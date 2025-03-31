# Code Rewriter

[![GitHub Repository](https://img.shields.io/badge/GitHub-hallway/code--rewriter-blue?logo=github)](https://github.com/hallway/code-rewriter)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Script to replace code snippets within a larger file, using surrounding context lines to ensure accuracy.

## Overview

This project provides a JavaScript function, `replaceMultipleSnippetsWithContext`, designed to perform targeted code replacements. Instead of simple string substitution, it locates the target snippet by verifying the lines immediately before (`contextBefore`) and after (`contextAfter`) it, preventing accidental replacements in similar-looking but incorrect locations.

## Files

-   `lib.js`: Contains the core `replaceMultipleSnippetsWithContext` function.
-   `index.js`: Example script demonstrating how to use the function. Reads `test.txt`, defines replacements, applies them, and prints the result.
-   `test.txt`: Sample input file used by `index.js`.
-   `package.json`: Project configuration (sets ES Module type).
-   `README.md`: This file.

## Prerequisites

-   [Node.js](https://nodejs.org/) (developed with v20+)

## Usage

1.  Clone the repository:
    ```bash
    git clone https://github.com/hallway/code-rewriter.git
    cd code-rewriter
    ```
2.  Run the example script:
    ```bash
    node index.js
    ```
    This will:
    *   Read the content of `test.txt`.
    *   Define specific replacements with context (see `index.js`).
    *   Call `replaceMultipleSnippetsWithContext` from `lib.js`.
    *   Print the original code, the defined replacements, the steps taken by the function, and the final modified code to the console.

## Core Function: `replaceMultipleSnippetsWithContext`

Located in `lib.js`.

```javascript
/**
 * Replaces multiple snippets of code within an original source string, using context for accuracy.
 * It first finds all snippet locations in the original code, then applies the replacements
 * in reverse order to handle index changes correctly.
 *
 * @param {string} original - The original source code.
 * @param {Array<{ 
 *   replacementSnippet: string, 
 *   newSnippet: string, 
 *   contextBefore?: string[], 
 *   contextAfter?: string[] 
 * }>} replacements - An array of objects specifying the snippet, its replacement, and optional context lines surrounding it.
 * @returns {string} - The source code with all specified replacements applied.
 * @throws {Error} If any replacementSnippet with its context is not found, matches multiple locations ambiguously, or input is invalid.
 */
export function replaceMultipleSnippetsWithContext(original, replacements)
```

**Key Features:**

*   **Contextual Matching:** Uses `contextBefore` and `contextAfter` string arrays to pinpoint the exact location of the `replacementSnippet`.
*   **Ambiguity Detection:** Throws an error if a snippet + context combination is found in multiple places.
*   **Not Found Handling:** Throws an error if a snippet + context combination cannot be found.
*   **Safe Ordering:** Applies replacements starting from the end of the file to avoid index shifting issues.

## License

This project is licensed under the ISC License. See the `package.json` file for details.