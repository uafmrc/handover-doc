# 🔧 Troubleshooting - Files with Deep Paths

## Problem: Files Are Not Detected

If you have a structure like:
```
src/app/features/entity-master/agent/agent-new/agent-new.component.ts
```

And the tool fails to find the file, follow this guide.

## 🔍 Diagnosis

### 1. Run the Debug Script

```bash
npm run debug:paths ./path/to/your/project
```

This will show you:
- How many files are found
- The directory depth
- The files with the deepest paths

### 2. Test a specific file

```bash
npm run debug:paths ./your-project "src/app/features/entity-master/agent/agent-new/agent-new.component.ts"
```

## ✅ Solutions

### Solution 1: Check `include` Patterns

In your `config.json`, make sure you have:

```json
{
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ]
}
```

The `**/*` pattern recursively searches ALL subdirectories.

### Solution 2: Check `exclude` Patterns

Make sure you are not excluding your source folders:

```json
{
  "exclude": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    ".git/**"
  ]
}
```

**DO NOT exclude** folders like `src/**` or `app/**`!

### Solution 3: Increase `maxFileSize`

If your component files are large:

```json
{
  "maxFileSize": 200000
}
```

The default is 100KB (100000 bytes). Increase it if necessary.

### Solution 4: Use an Absolute Path

In `config.json`, it's often more reliable to use absolute paths:

```json
{
  "projectPath": "/home/user/projects/my-angular-app"
}
```

Or ensure your relative path is correct from the project root:
```json
{
  "projectPath": "./my-angular-app"
}
```

### Solution 5: Check File Permissions

On Linux/Mac:
```bash
ls -la src/app/features/entity-master/agent/agent-new/agent-new.component.ts
```

Make sure the file is readable.

## 🐛 Advanced Debugging

### Detailed Logs

The tool now shows detailed logs during execution:

```bash
npm run dev:generate -c config.json
```

Output:
```
🔍 Searching for files in project: /path/to/project
   Patterns: **/*.ts, **/*.js
   Found 245 files with pattern "**/*.ts"
   Found 12 files with pattern "**/*.js"
   Total unique files: 257
   ✅ Valid files to analyze: 257

   Examples of found files:
   - src/app/app.component.ts
   - src/app/features/entity-master/agent/agent-new/agent-new.component.ts
   - src/app/services/auth.service.ts
   ... and 254 more files
```

### Manual Glob Test

Create a file `test-glob.js`:

```javascript
const { glob } = require('glob');

async function run() {
    const files = await glob('**/*.ts', {
        cwd: '/path/to/your/project',
        ignore: ['node_modules/**', 'dist/**'],
        absolute: true
    });
    console.log(`Found ${files.length} files`);
    files.slice(0, 20).forEach(f => console.log(f));
}

run().catch(console.error);
```

Run it with: `node test-glob.js`

## 📋 Full Checklist

- [ ] `**/*.ts` (or similar) pattern is present in `include`.
- [ ] No patterns in `exclude` that would match `src/**` or `app/**`.
- [ ] The project path is correct (valid absolute or relative path).
- [ ] The file is not too large (check `maxFileSize`).
- [ ] The file has correct read permissions.
- [ ] The glob pattern finds the files (test with `npm run debug:paths`).
- [ ] The TypeScript parser is working (check logs for errors).

## 🎯 Recommended Configuration for Angular

```json
{
  "projectPath": "./your-angular-project",
  "outputDir": "./handover-docs",
  "llmProvider": "ollama",
  "llmModel": "qwen2.5-coder:7b",
  "projectName": "My Angular App",
  "exclude": [
    "node_modules/**",
    "dist/**",
    ".angular/**",
    "coverage/**",
    "*.spec.ts"
  ],
  "include": [
    "**/*.ts",
    "**/*.component.ts",
    "**/*.service.ts",
    "**/*.module.ts"
  ],
  "maxFileSize": 200000,
  "generateHtml": true,
  "generateMarkdown": true,
  "languages": ["typescript"],
  "analysisDepth": "detailed"
}
```

## 🆘 If It Still Doesn't Work

1.  **Copy the full path of the problematic file.**
2.  **Verify that it exists**:
    ```bash
    ls -la "/path/to/src/app/features/entity-master/agent/agent-new/agent-new.component.ts"
    ```
3.  **Test it with the debug script**:
    ```bash
    npm run debug:paths . "src/app/features/entity-master/agent/agent-new/agent-new.component.ts"
    ```
4.  **Check the detailed logs** during generation.
5.  **Open an issue** with:
    - Your folder structure.
    - The `config.json` you used.
    - The output of the debug script.
    - The full error logs.

## 💡 Tips

- The tool now supports **unlimited directory depth**.
- Logs show **examples of found files** for verification.
- Use `npm run watch:generate` for **auto-reload** during development.
- The parser has an **automatic fallback** for problematic files.

---

**The tool has been updated to better handle deep paths like those in Angular projects!** 🚀
