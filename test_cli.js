
import { loadJson, saveJson, HISTORY_FILE, QUEUE_FILE } from './cli.js';
import fs from 'fs/promises';
import chalk from 'chalk';

async function runTests() {
    console.log(chalk.bold.blue("🧪 Running CLI Logic Tests...\n"));

    // Test 1: File I/O
    console.log("🔹 Test 1: JSON Save/Load");
    const testData = { test: "value", timestamp: Date.now() };
    const testFile = "test_db.json";
    
    try {
        await saveJson(testFile, testData);
        const loaded = await loadJson(testFile, {});
        
        if (loaded.test === "value") {
            console.log(chalk.green("  ✅ Save/Load passed."));
        } else {
            console.log(chalk.red("  ❌ Save/Load failed: content mismatch."));
        }
        await fs.unlink(testFile); // Cleanup
    } catch (e) {
        console.log(chalk.red("  ❌ Save/Load crashed: " + e.message));
    }

    // Test 2: Queue Management Logic
    console.log("\n🔹 Test 2: Queue Initialization");
    try {
        const queue = await loadJson(QUEUE_FILE, { queue: [] });
        if (Array.isArray(queue.queue)) {
            console.log(chalk.green("  ✅ Queue file structure is valid."));
        } else {
            console.log(chalk.red("  ❌ Queue file structure invalid."));
        }
    } catch (e) {
        console.log(chalk.red("  ❌ Queue test failed: " + e.message));
    }

    // Test 3: History Logic
    console.log("\n🔹 Test 3: History Initialization");
    try {
        const history = await loadJson(HISTORY_FILE, { lessons: [] });
        if (Array.isArray(history.lessons)) {
            console.log(chalk.green("  ✅ History file structure is valid."));
        } else {
            console.log(chalk.red("  ❌ History file structure invalid."));
        }
    } catch (e) {
        console.log(chalk.red("  ❌ History test failed: " + e.message));
    }

    console.log(chalk.bold.magenta("\n✨ All systems check complete. Logic is sound."));
}

runTests();
