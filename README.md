# 📦 Handover Doc Generator

An intelligent, AI-powered documentation generator designed to simplify software project handovers. By combining advanced static analysis with Large Language Models (LLMs), it automatically creates comprehensive reports and technical documentation.

## ✨ Key Features

- 🤖 **AI-Driven Code Analysis**: Deep understanding of your codebase using LLMs to explain purpose, logic, and patterns.
- 🌍 **Full i18n Support**: Generates documentation in **English** or **Italian**. The entire CLI and report templates are fully localized.
- 📊 **Interactive HTML Dashboard**: A professional, navigable report with interactive file maps, complexity charts, and technical debt visualization.
- 📉 **Technical Debt & Quality Score**: Automatically estimates technical debt based on code complexity and TODOs, and provides a Quality Score (1-10) for each file.
- 🔍 **Advanced Static Analysis**: Extracts functions, classes, environment variables, API routes, and architectural patterns (NestJS, React, Express, etc.).
- 📝 **Markdown Documentation Suite**: Generates a complete set of documentation including `README.md`, `ARCHITECTURE.md`, `SETUP.md`, and `API.md`.
- 🔌 **Multi-Provider Support**: Compatible with **Ollama** (local & free), **Anthropic (Claude)**, **OpenAI (GPT)**, and **Google (Gemini)**.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 18
- (Optional but recommended) [Ollama](https://ollama.ai/) for local, private, and free analysis.

### 2. Installation
```bash
git clone <your-repo-url>
cd handover-doc
npm install
npm run build
```

### 3. Initialize Configuration
```bash
npm run dev init
```
This creates a `config.json` file in the root directory.

### 4. Run Generation
```bash
npm run dev:generate
```

## ⚙️ Configuration (`config.json`)

| Option | Description | Default |
|--------|-------------|---------|
| `projectPath` | Path to the project to analyze | - |
| `outputDir` | Where to save generated docs | `./handover-docs` |
| `llmProvider` | `ollama`, `anthropic`, `openai`, or `google` | `ollama` |
| `llmModel` | Model name (e.g., `qwen2.5-coder:7b`, `gpt-4o`) | - |
| `languageDoc` | Output language (`english` or `italian`) | `english` |
| `analysisDepth` | `basic`, `detailed`, or `comprehensive` | `detailed` |

### Recommended Models (Ollama)
- **qwen2.5-coder:7b** (Recommended balance)
- **deepseek-coder-v2:16b** (High precision)

## 📁 Generated Output

The tool populates your `outputDir` with:

- **`handover-report.html`**: An interactive dashboard for executive and technical review.
- **`README.md`**: Project overview and high-level summary.
- **`ARCHITECTURE.md`**: Deep dive into layers, patterns, and dependencies.
- **`SETUP.md`**: Tailored installation and startup instructions.
- **`API.md`**: Reference for detected endpoints and routes.

## 🏗️ Project Architecture

```
src/
├── analyzers/      # Static analysis engine (AST, patterns, frameworks)
├── generators/     # HTML (Handlebars) & Markdown output logic
├── helpers/        # Config and prompt engineering
├── models/         # Zod schemas and data structures
├── services/       # LLM integrations & i18n localization
└── utils/          # File system & AST parsers (TypeScript/JavaScript)
```

## 🔧 Available Commands

- `npm run dev init`: Create a new config file.
- `npm run dev:generate`: Run analysis using `ts-node`.
- `npm run build`: Compile the project to Javascript.
- `npm start generate`: Run the compiled tool.
- `npm run debug:paths`: Troubleshoot file detection issues.

## 🛡️ Privacy & Security

- **With Ollama**: Your code stays 100% local. No data is sent to external servers.
- **With Cloud APIs**: Only file contents are sent to the provider (OpenAI/Anthropic/Google). API keys are read from your local `config.json` (never committed).

---

**Built with ❤️ by Marco Lattanzi to make handovers painless.**

