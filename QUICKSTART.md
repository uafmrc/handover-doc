# 🚀 Quick Start - Handover Doc Generator

Follow these steps to generate professional documentation for your project in less than 5 minutes.

## 1. Prerequisites
- **Node.js**: Version 18 or higher.
- **LLM Provider**:
    - **Ollama (Recommended)**: For local, private, and free analysis.
    - **API Key**: For Anthropic (Claude), OpenAI (GPT), or Google (Gemini).

### Setup Ollama (Optional but Highly Recommended)
```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the optimized model for code
ollama pull qwen2.5-coder:7b

# Ensure Ollama is running
ollama serve
```

## 2. Installation
```bash
# Clone and enter the directory
git clone <your-repo-url>
cd handover-doc

# Install dependencies and build
npm install
npm run build
```

## 3. Configuration
Generate your local configuration file:
```bash
npm run dev init
```

Open `config.json` and configure your project. Here are the most common setups:

### Local Analysis (Ollama - Free)
```json
{
  "projectPath": "./path/to/your/app",
  "projectName": "My Awesome App",
  "llmProvider": "ollama",
  "llmModel": "qwen2.5-coder:7b",
  "languageDoc": "english"
}
```

### Cloud Analysis (e.g., Anthropic)
```json
{
  "projectPath": "./path/to/your/app",
  "projectName": "My Awesome App",
  "llmProvider": "anthropic",
  "llmKey": "sk-ant-...",
  "llmModel": "claude-3-5-sonnet-20241022",
  "languageDoc": "italian"
}
```

## 4. Run Generation
Start the analysis and documentation process:
```bash
npm run dev:generate
```

## 📝 Test with Example Project
Try the tool on our built-in example to see it in action:
```bash
npm run dev generate -c config.test.json
```
Check the results in the `./example-output/` folder.

## 📁 What's in the Box?
After generation, your `outputDir` will contain:
- **`handover-report.html`**: Interactive dashboard with charts and file maps.
- **`README.md`**: High-level project summary.
- **`ARCHITECTURE.md`**: Detailed analysis of layers and patterns.
- **`SETUP.md`**: Project-specific installation guide.
- **`API.md`**: Reference for all detected endpoints.

## 🔍 Key Analysis Features
- **Framework Detection**: Automatically recognizes NestJS, React, Express, and more.
- **Technical Debt**: Estimates debt based on complexity and TODOs.
- **Quality Score**: Assigns a 1-10 score to each file.
- **Dependency Mapping**: Visualizes production and dev dependencies.
- **Environment Discovery**: Lists required `process.env` variables.

## ❓ Common Troubleshooting

### "Ollama is not reachable"
Make sure the Ollama service is running (`ollama serve`). You can verify by visiting `http://localhost:11434` in your browser.

### "Too many files"
By default, the tool analyzes up to 50 files. You can refine this by adjusting `include` and `exclude` patterns in `config.json`:
```json
"include": ["src/**/*.ts"],
"exclude": ["**/*.test.ts", "node_modules/**"]
```

### "API Key Error"
Ensure your `llmKey` is correctly pasted and that your account has enough credits for the selected provider.

---
📖 **Need more details?** Check out [README.md](./README.md) or [OLLAMA_SETUP.md](./OLLAMA_SETUP.md).

