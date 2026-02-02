
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import crypto from 'crypto';

// Load env
dotenv.config({ path: '.env' });

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.error(chalk.red("❌ Error: VITE_GEMINI_API_KEY not found in .env"));
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

// --- FILE PATHS ---
const MEMORY_FILE = 'brain_map.json';
const HISTORY_FILE = 'lessons_history.json';
const QUEUE_FILE = 'learning_queue.json';

// --- STORAGE HELPERS ---

async function loadJson(file, defaultVal) {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch {
        return defaultVal;
    }
}

async function saveJson(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// --- GENERATORS ---

async function generateLessonPlan(topic) {
    // Removed ora spinner for Windows compatibility
    console.log(chalk.cyan(`\n(AI is researching "${topic}"... this takes ~5-10s)`));
    
    const prompt = `
        You are an elite technical tutor. The user wants to learn: "${topic}".
        Generate a concise, high-density lesson plan for a CLI interface.
        
        Format your response as a valid JSON object with this structure:
        {
            "title": "Lesson Title",
            "concepts": [
                {
                    "name": "Concept Name",
                    "explanation": "Short, punchy explanation (2-3 sentences). Use analogies.",
                    "codeSnippet": "Optional code example (or null)",
                    "asciiArt": "Optional ASCII art diagram (max 60 chars wide) illustrating the concept (e.g. a graph, shape, or flow). Use standard characters like | - / \\ + . *",
                    "quiz": {
                        "question": "A question to test understanding",
                        "options": ["A", "B", "C", "D"],
                        "correctIndex": 0,
                        "explanation": "Why it is correct"
                    }
                }
            ],
            "nextSteps": ["What to learn next"]
        }
        Do not include markdown blocks. Just the JSON.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        let jsonText = result.text;
        // Clean markdown if present (just in case model ignores mime type slightly)
        if (typeof jsonText === 'string') {
            jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        
        const lesson = JSON.parse(jsonText);
        
        // Save to History immediately
        const history = await loadJson(HISTORY_FILE, { lessons: [] });
        const lessonId = crypto.randomUUID();
        history.lessons.unshift({
            id: lessonId,
            topic: topic,
            title: lesson.title,
            createdAt: Date.now(),
            content: lesson
        });
        if (history.lessons.length > 50) history.lessons.pop();
        await saveJson(HISTORY_FILE, history);

        console.log(chalk.green("✔ Lesson generated."));
        return lesson;
    } catch (e) {
        console.log(chalk.red("❌ Agent failed to generate lesson."));
        console.error(e);
        return null;
    }
}

// --- UI LOOP ---

// Modify runLesson to use the passed readline instance instead of inquirer
async function runLesson(lesson, readline) {
    const ask = (q) => new Promise(resolve => readline.question(q, resolve));

    console.clear();
    console.log(chalk.bold.magenta(`\n💎 ${lesson.title}\n`));
    console.log(chalk.dim('─'.repeat(50)));

    let memory = await loadJson(MEMORY_FILE, { mastered: [], struggling: [], reviewing: [] });

    for (const concept of lesson.concepts) {
        console.log(chalk.bold.bgBlue.white(`\n 🔹 ${concept.name} `));
        console.log(chalk.bold.white(concept.explanation));
        
        if (concept.asciiArt) {
            console.log(chalk.yellow('\n' + concept.asciiArt));
        }

        if (concept.codeSnippet) {
            console.log(chalk.bgGray.white('\n' + concept.codeSnippet + '\n'));
        }

        console.log(chalk.cyan(`\n❓ Question: ${concept.quiz.question}`));
        concept.quiz.options.forEach((opt, i) => console.log(`   [${i+1}] ${opt}`));

        let answer = await ask(chalk.greenBright('\nEnter choice (1-4) > '));
        const selectedIndex = parseInt(answer) - 1;
        
        if (selectedIndex === concept.quiz.correctIndex) {
            console.log(chalk.bold.green("✅ Correct! ") + chalk.cyan(concept.quiz.explanation));
            if (!memory.mastered.includes(concept.name)) memory.mastered.push(concept.name);
        } else {
            console.log(chalk.bold.red("❌ Incorrect."));
            console.log(chalk.white(`The right answer was: ${concept.quiz.options[concept.quiz.correctIndex]}`));
            console.log(chalk.cyan(concept.quiz.explanation));
            if (!memory.struggling.includes(concept.name)) memory.struggling.push(concept.name);
        }
        
        await ask(chalk.dim('\nPress Enter for next concept...'));
    }

    await saveJson(MEMORY_FILE, memory);
    console.log(chalk.green("\n🎉 Lesson Complete!"));
}

async function showBrainMap() {
    const memory = await loadJson(MEMORY_FILE, { mastered: [], struggling: [], reviewing: [] });
    console.clear();
    console.log(chalk.bold.magenta("\n🧠 Neural Knowledge Map"));
    
    console.log(chalk.red("\n🚨 Needs Focus:"));
    if(memory.struggling.length === 0) console.log(chalk.dim("  (None - You are a genius!)"));
    memory.struggling.forEach(m => console.log(`  • ${m}`));

    console.log(chalk.green("\n✅ Mastered:"));
    if(memory.mastered.length === 0) console.log(chalk.dim("  (Start learning to fill this!)"));
    memory.mastered.forEach(m => console.log(`  • ${m}`));
    
    console.log("\n");
}

async function showHistory(readline) {
    const ask = (q) => new Promise(resolve => readline.question(q, resolve));
    const history = await loadJson(HISTORY_FILE, { lessons: [] });
    
    if (history.lessons.length === 0) {
        console.log(chalk.yellow("\n📜 No lesson history found."));
        await ask('Press Enter...');
        return;
    }

    console.log(chalk.bold("\n📜 Lesson History:"));
    history.lessons.forEach((l, i) => {
        console.log(`  [${i+1}] ${l.title} (${chalk.dim(l.topic)})`);
    });

    const choice = await ask('\nEnter number to replay (or 0 to back) > ');
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < history.lessons.length) {
        await runLesson(history.lessons[idx].content, readline);
    }
}

async function sotaScan(readline) {
    const ask = (q) => new Promise(resolve => readline.question(q, resolve));
    try {
        const plansDir = 'E:\\openclaw\\plans';
        const files = await fs.readdir(plansDir).catch(() => []);
        const sotaFiles = files.filter(f => f.endsWith('.md')).sort().reverse();

        if (sotaFiles.length === 0) {
            console.log(chalk.yellow("\n⚠️  No SOTA reports found in " + plansDir));
        } else {
            const latest = sotaFiles[0];
            const content = await fs.readFile(path.join(plansDir, latest), 'utf-8');
            
            console.clear();
            console.log(chalk.bold.cyan(`\n🌐 SOTA Report: ${latest}\n`));
            
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.startsWith('# ')) console.log(chalk.bold.magenta.underline(line.replace('# ', '')));
                else if (line.startsWith('## ')) console.log(chalk.bold.yellow('\n' + line.replace('## ', '')));
                else if (line.startsWith('### ')) console.log(chalk.bold.green(line.replace('### ', '')));
                else if (line.startsWith('**')) console.log(chalk.cyan(line));
                else if (line.startsWith('* ')) console.log(chalk.white('  • ' + line.replace('* ', '')));
                else console.log(chalk.dim(line));
            }

            const ans = await ask(chalk.green('\nAdd a SOTA topic to queue? (y/n) > '));
            if (ans.toLowerCase() === 'y') {
                const topic = await ask(chalk.yellow('Topic name > '));
                const queueData = await loadJson(QUEUE_FILE, { queue: [] });
                queueData.queue.push({ topic, addedAt: Date.now(), status: 'pending' });
                await saveJson(QUEUE_FILE, queueData);
                console.log(chalk.green("Added to Queue."));
            }
        }
    } catch (err) {
        console.error(chalk.red("Error reading SOTA plans:"), err.message);
    }
    await ask('Press Enter...');
}

async function mainMenu() {
    const readline = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (q) => new Promise(resolve => readline.question(q, resolve));

    while (true) {
        console.clear();
        console.log(chalk.bold.blue('💎 Agent Tutor v1.3 | Select Operation:'));
        console.log(chalk.dim('─'.repeat(40)));
        console.log(chalk.cyan(' [1] ') + '📚 Start New Lesson');
        console.log(chalk.cyan(' [2] ') + '⏳ Learning Queue');
        console.log(chalk.cyan(' [3] ') + '📜 Lesson History');
        console.log(chalk.cyan(' [4] ') + '🧠 Brain Map');
        console.log(chalk.cyan(' [5] ') + '🌐 SOTA Scan');
        console.log(chalk.cyan(' [6] ') + '❌ Exit');
        console.log(chalk.dim('─'.repeat(40)));

        const choice = await ask(chalk.yellow('Enter number > '));

        if (choice.trim() === '6') {
            console.log(chalk.cyan("Goodbye."));
            readline.close();
            process.exit(0);
        }
        
        if (choice.trim() === '4') { 
            await showBrainMap(); 
            await ask('Press Enter to continue...');
        }
        
        if (choice.trim() === '1') {
            const topic = await ask(chalk.yellow('Enter topic to learn > '));
            // Log moved inside generateLessonPlan to prevent duplicate
            
            try {
                const lesson = await generateLessonPlan(topic);
                if (lesson) await runLesson(lesson, readline);
            } catch (e) {
                console.error("Error:", e);
            }
            await ask('Press Enter to return to menu...');
        }

        if (choice.trim() === '3') {
            await showHistory(readline); 
        }

        if (choice.trim() === '2') {
             const q = await loadJson(QUEUE_FILE, { queue: [] });
             console.log(chalk.bold("\n⏳ Learning Queue:"));
             if (q.queue.length === 0) console.log(chalk.dim("  (Empty)"));
             q.queue.forEach((item, i) => console.log(`  ${i+1}. ${item.topic}`));
             await ask('Press Enter...');
        }

        if (choice.trim() === '5') {
            await sotaScan(readline);
        }
    }
}

// Start
console.clear();
mainMenu();

export { loadJson, saveJson, generateLessonPlan, HISTORY_FILE, QUEUE_FILE, MEMORY_FILE };
