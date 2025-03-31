import { replaceMultipleSnippetsWithContext } from './lib.js';
import fs from 'fs';
import path from 'path';

// Get the directory of the current module
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Define the path to the test file
const testFilePath = path.join(__dirname, 'test.txt');

console.log("--- Code Rewriter Test ---");

try {
    // 1. Read the original code from test.txt
    console.log(`Reading original code from: ${testFilePath}`);
    const originalCode = fs.readFileSync(testFilePath, 'utf8');
    console.log("\n--- Original Code (test.txt) ---");
    console.log(originalCode);

    // 2. Define the replacements
    const replacements = [
        { // Replace function name in config
            replacementSnippet: 'name: "hello",',
            newSnippet: 'name: "confetti_test",',
            // Providing context that is directly adjacent and unique is best.
            contextBefore: ["export const config = {"], // Line before the target
            contextAfter: ["  permissions: [\"net\"],"] // Line after the target
        },
        { // Replace button text
            replacementSnippet: '<button id="confetti-btn">Celebrate!</button>',
            newSnippet: '<button id="confetti-btn">Click for Confetti!</button>',
            contextBefore: ["            <p>This is a simple serverless function running on Deno.</p>"],
            contextAfter: ["            <a href=\"http://example.local:8000/src/hello.ts\" target=\"_blank\">View Source</a>"]
        },
        { // Replace particle count
             replacementSnippet: "particleCount: 100,",
             newSnippet: "particleCount: 250, // Increased!",
             contextBefore: ["              confetti({"], // Line immediately before
             contextAfter: ["                spread: 70,"] // Line immediately after
        }
        // Add more test cases here if needed
    ];

    console.log("\n--- Replacements Defined ---");
    console.log(JSON.stringify(replacements, null, 2));


    // 3. Perform the replacements
    console.log("\n--- Performing Replacements ---");
    // The lib function handles the context logic internally now
    const modifiedCode = replaceMultipleSnippetsWithContext(originalCode, replacements);

    // 4. Show the result
    console.log("\n--- Modified Code ---");
    console.log(modifiedCode);
    console.log("\n--- Test Complete ---");

} catch (error) {
    console.error("\n--- Test Failed ---");
    console.error("Error:", error.message);
    // console.error(error); // Uncomment for full stack trace
    console.log("--- End Failure Report ---");
}