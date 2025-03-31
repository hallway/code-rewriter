/**
 * Replaces multiple snippets of code within an original source string, using context for accuracy.
 *
 * @param {string} original - The original source code.
 * @param {Array<{
 *   replacementSnippet: string,
 *   newSnippet: string,
 *   contextBefore: string[],
 *   contextAfter: string[]
 * }>} replacements - An array of objects specifying the snippet, its replacement, and the context lines surrounding it.
 * @returns {string} - The source code with all specified replacements applied.
 * @throws {Error} If a replacementSnippet with its context is not found or matches multiple locations ambiguously.
 */

// --- Helper for comparing lines (case-sensitive, trims whitespace) ---
function linesMatch(actualLines, expectedLines) {
    if (!actualLines || !expectedLines || actualLines.length !== expectedLines.length) {
        return false;
    }
    for (let i = 0; i < actualLines.length; i++) {
        // Trim for robustness against leading/trailing whitespace.
        // Use exact comparison if whitespace is critical: if (actualLines[i] !== expectedLines[i])
        if (actualLines[i].trim() !== expectedLines[i].trim()) {
            return false;
        }
    }
    return true;
}
// ---

/**
 * Finds the start and end line index for a single snippet within source lines, using context.
 *
 * @param {string[]} sourceLines - The lines of the source code to search within.
 * @param {string} replacementSnippet - The snippet to find.
 * @param {string[]} contextBefore - Lines expected immediately before the snippet.
 * @param {string[]} contextAfter - Lines expected immediately after the snippet.
 * @param {number} replacementIndex - The index of the replacement object (for error messages).
 * @returns {{startIndex: number, endIndex: number}} - The start and end index (exclusive) of the snippet.
 * @throws {Error} If the snippet with context is not found or found multiple times.
 */
function findSnippetLocation(sourceLines, replacementSnippet, contextBefore, contextAfter, replacementIndex) {
    const snippetLines = replacementSnippet.trim().split("\n");
    const contextBeforeLines = (contextBefore || []).map(l => l.trim());
    const contextAfterLines = (contextAfter || []).map(l => l.trim());

    if (snippetLines.length === 0 || snippetLines.every(line => line.trim() === '')) {
        // This case should ideally be handled before calling this function,
        // but we add a check for robustness.
        throw new Error(`Replacement snippet at index ${replacementIndex} is empty.`);
    }

    console.log(`\nSearching for snippet with context (Index ${replacementIndex}):`);
    console.log("  Context Before:", contextBeforeLines.length > 0 ? contextBeforeLines : "[None]");
    console.log(`  Replacement Snippet:\n---\n${replacementSnippet}\n---`);
    console.log("  Context After:", contextAfterLines.length > 0 ? contextAfterLines : "[None]");


    let foundMatches = [];

    // Iterate through possible starting positions of the *replacementSnippet*
    for (let i = 0; i <= sourceLines.length - snippetLines.length; i++) {
        // --- Check if the core snippet matches ---
        let coreSnippetMatches = true;
        const actualSnippetLines = [];
        for (let j = 0; j < snippetLines.length; j++) {
            actualSnippetLines.push(sourceLines[i + j]);
            if (sourceLines[i + j].trim() !== snippetLines[j].trim()) {
                coreSnippetMatches = false;
                break;
            }
        }

        if (!coreSnippetMatches) {
            continue; // Move to next potential start line if core snippet doesn't match
        }

        // --- Core snippet matched, now check context ---
        console.log(`  Core snippet potentially matches at line ${i}. Checking context...`);

        // --- Check Context Before ---
        let contextBeforeMatches = true;
        if (contextBeforeLines.length > 0) {
            const actualContextBefore = [];
            const expectedContextBeforeCount = contextBeforeLines.length;
            // Ensure we don't read before the start of the file
            const startIndexBefore = Math.max(0, i - expectedContextBeforeCount);
             // Check if enough lines are *available* before the potential match start
            if (i < expectedContextBeforeCount) {
                contextBeforeMatches = false;
                console.log(`    Context Before mismatch at line ${i}. Not enough preceding lines available. Expected ${expectedContextBeforeCount}, Available ${i}`);
            } else {
                // Extract the actual preceding lines
                for (let k = startIndexBefore; k < i; k++) {
                    actualContextBefore.push(sourceLines[k]);
                }
                // Now compare
                if (!linesMatch(actualContextBefore, contextBeforeLines)) {
                    contextBeforeMatches = false;
                    console.log(`    Context Before mismatch at line ${i}. Expected:`, contextBeforeLines, "Actual:", actualContextBefore.map(l => l.trim()));
                }
            }
        } // else: no context before to check

        if (!contextBeforeMatches) {
            continue; // Context before didn't match, try next potential core snippet match
        }

         // --- Check Context After ---
         let contextAfterMatches = true;
         if (contextAfterLines.length > 0) {
             const actualContextAfter = [];
             const expectedContextAfterCount = contextAfterLines.length;
             const snippetEndIndex = i + snippetLines.length; // Line *after* the last line of the snippet

             // Check if enough lines are *available* after the potential match end
             if (snippetEndIndex + expectedContextAfterCount > sourceLines.length) {
                contextAfterMatches = false;
                 console.log(`    Context After mismatch at line ${i}. Not enough succeeding lines available. Expected ${expectedContextAfterCount}, Available ${sourceLines.length - snippetEndIndex}`);
             } else {
                 // Extract the actual succeeding lines
                 for (let k = snippetEndIndex; k < snippetEndIndex + expectedContextAfterCount; k++) {
                     actualContextAfter.push(sourceLines[k]);
                 }
                 // Now compare
                 if (!linesMatch(actualContextAfter, contextAfterLines)) {
                     contextAfterMatches = false;
                     console.log(`    Context After mismatch at line ${i}. Expected:`, contextAfterLines, "Actual:", actualContextAfter.map(l => l.trim()));
                 }
             }
         } // else: no context after to check


        // --- If both core snippet and context (if provided) match ---
        if (contextBeforeMatches && contextAfterMatches) {
            console.log(`  >>> Match found for snippet index ${replacementIndex} at original line index ${i}`);
            foundMatches.push({ startIndex: i, endIndex: i + snippetLines.length });
        } else {
             console.log(`  Context mismatch for potential match at line ${i}.`);
        }
    } // End loop through potential start lines

    // --- Evaluate Findings ---
    if (foundMatches.length === 0) {
        console.error(`Could not find snippet index ${replacementIndex} with specified context.`);
        throw new Error(`Replacement target (index ${replacementIndex}) with specified context not found in the original code.`);
    }

    if (foundMatches.length > 1) {
        console.error(`Found multiple ambiguous matches for snippet index ${replacementIndex} with specified context at lines: ${foundMatches.map(m => m.startIndex).join(', ')}`);
        // Provide more details in the error for debugging
        let detail = `Ambiguous match for replacement target (index ${replacementIndex}) with context. Found at original line indices: ${foundMatches.map(m => m.startIndex).join(', ')}.`;
        detail += `\nSnippet:\n${replacementSnippet}`;
        if (contextBeforeLines.length > 0) detail += `\nContext Before: ${JSON.stringify(contextBeforeLines)}`;
        if (contextAfterLines.length > 0) detail += `\nContext After: ${JSON.stringify(contextAfterLines)}`;
        throw new Error(detail);
    }

    // Exactly one match found
    return foundMatches[0]; // { startIndex: number, endIndex: number }
}


export function replaceMultipleSnippetsWithContext(original, replacements) {
    console.log(`Attempting to replace ${replacements.length} snippets with context.`);
    if (typeof original !== 'string') {
        throw new Error("Original code must be a string.");
    }
    if (!Array.isArray(replacements)) {
        throw new Error("Replacements must be an array.");
    }

    const origLines = original.split("\n");
    let currentLines = [...origLines]; // Work on a mutable copy
    const plannedReplacements = []; // Store validated replacements with locations

    // 1. Find all match locations based on the *original* code
    for (let rIndex = 0; rIndex < replacements.length; rIndex++) {
        const rep = replacements[rIndex];
        if (!rep || typeof rep !== 'object') {
             console.warn(`Skipping invalid replacement object at index ${rIndex}`);
             continue;
        }
        const { replacementSnippet, newSnippet, contextBefore, contextAfter } = rep;

         // Basic validation
         if (typeof replacementSnippet !== 'string' || typeof newSnippet !== 'string') {
            console.warn(`Skipping replacement at index ${rIndex} due to invalid snippet types.`);
            continue;
         }
         if (replacementSnippet.trim() === '') {
            console.warn(`Skipping empty replacementSnippet at index ${rIndex}`);
            continue; // Skip empty snippets
         }
         // Ensure context is array, even if null/undefined
         const cleanContextBefore = Array.isArray(contextBefore) ? contextBefore : [];
         const cleanContextAfter = Array.isArray(contextAfter) ? contextAfter : [];


        try {
            // Find location in the pristine original lines
            const location = findSnippetLocation(
                origLines,
                replacementSnippet,
                cleanContextBefore,
                cleanContextAfter,
                rIndex
            );
            plannedReplacements.push({
                ...location, // { startIndex, endIndex }
                newSnippetLines: newSnippet.split('\n'), // Pre-split the new snippet
                originalIndex: rIndex // Keep track for debugging/ordering if needed
            });
        } catch (error) {
            console.error(`Error finding location for replacement index ${rIndex}:`, error.message);
            // Propagate the error to stop the whole process if one replacement is bad
            throw new Error(`Failed to find or validate replacement target at index ${rIndex}: ${error.message}`);
        }
    }

    // 2. Sort replacements by start index in *descending* order
    // This ensures that replacements later in the file don't affect the indices
    // of replacements earlier in the file.
    plannedReplacements.sort((a, b) => b.startIndex - a.startIndex);

    console.log(`\nFound ${plannedReplacements.length} valid locations. Applying replacements in reverse order...`);

    // 3. Apply replacements to the `currentLines` copy
    let replacementsApplied = 0;
    for (const rep of plannedReplacements) {
         console.log(`Applying replacement originally at index ${rep.originalIndex}: Replacing lines ${rep.startIndex} to ${rep.endIndex-1} (original indices)`);
        currentLines.splice(rep.startIndex, rep.endIndex - rep.startIndex, ...rep.newSnippetLines);
        replacementsApplied++;
    }


    console.log(`Successfully applied ${replacementsApplied} replacements.`);
    return currentLines.join("\n");
}

// --- Example Usage (Optional - for testing) ---
/*
const originalCode = `line 1
line 2 // context before
line 3 // snippet line 1
line 4 // snippet line 2
line 5 // context after
line 6
line 7 // another snippet
line 8`;

const replacements = [
  {
    replacementSnippet: "line 3 // snippet line 1\nline 4 // snippet line 2",
    newSnippet: "NEW line 3\nNEW line 4",
    contextBefore: ["line 2 // context before"],
    contextAfter: ["line 5 // context after"]
  },
  {
    replacementSnippet: "line 7 // another snippet",
    newSnippet: "NEW line 7",
    contextBefore: ["line 6"], // No context after needed if unambiguous
    contextAfter: []
  }
];

try {
  const modifiedCode = replaceMultipleSnippetsWithContext(originalCode, replacements);
  console.log("\n--- Modified Code ---");
  console.log(modifiedCode);
  console.log("--- End Modified Code ---");
} catch (error) {
  console.error("\n--- Replacement Failed ---");
  console.error(error);
  console.log("--- End Failure Report ---");
}
*/