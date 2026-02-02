
import { generateLessonPlan } from './cli.js';
import chalk from 'chalk';

async function testGeneration() {
    console.log(chalk.blue("🧪 Testing Lesson Generation..."));
    
    // Using a simple topic to be fast
    const topic = "What is a derivative?"; 
    
    try {
        const lesson = await generateLessonPlan(topic);
        
        if (!lesson) {
            console.log(chalk.red("❌ Lesson generation returned null/undefined."));
            process.exit(1);
        }

        if (lesson.title && Array.isArray(lesson.concepts)) {
            console.log(chalk.green(`✅ Success! Generated lesson: "${lesson.title}"`));
            console.log(chalk.dim(`   Concepts: ${lesson.concepts.length}`));
            process.exit(0);
        } else {
            console.log(chalk.red("❌ Invalid lesson structure."));
            console.log(lesson);
            process.exit(1);
        }
    } catch (e) {
        console.log(chalk.red("❌ Crash during testing:"));
        console.error(e);
        process.exit(1);
    }
}

testGeneration();
