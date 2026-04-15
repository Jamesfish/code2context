<div align="center">

# 🔮 Code2Context

**Turn your codebase into AI-ready context — automatically.**

Zero-config, one-command context extraction for AI coding assistants.

[![npm version](https://img.shields.io/npm/v/code2context)](https://www.npmjs.com/package/code2context)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**English** | [中文](./README.zh-CN.md)

</div>

---

## 💡 The Pain Point

When using AI coding assistants (Cursor, Claude, Copilot, Cline...), the quality of AI output heavily depends on **how well it understands your project**.

But building and maintaining this context is painful:

- **Writing `.cursorrules` or `CLAUDE.md` by hand** takes time and effort
- **Context goes stale** as your code evolves — you forget to update it
- **Every AI tool needs a different format** — what works for Cursor doesn't work for Claude
- **Large codebases are hard to summarize** — it's difficult to know what's important to include

## ✅ What Code2Context Does Differently

Code2Context doesn't ask you questions. It doesn't need templates. It **reads your actual code** and extracts the truth.

```bash
# One command. Zero questions. Real analysis.
npx code2context init
```

That's it. Code2Context automatically:

1. 🔍 **Scans** every file in your project
2. 🧩 **Parses** module imports/exports to build a dependency graph
3. 📐 **Detects** coding conventions from your actual code patterns
4. 📊 **Analyzes** git history to find hot files and dev direction
5. 🤖 **Generates** AI-powered architecture insights (optional)
6. 📤 **Exports** to `.cursorrules`, `CLAUDE.md`, or any format you need

```bash
npx code2context export --format cursor    # → .cursorrules
npx code2context export --format claude    # → CLAUDE.md
npx code2context export --format text      # → CONTEXT.txt

# Code changed? Update incrementally (git-diff driven, fast)
npx code2context update
```

**No manual writing. No stale context. One source of truth for all AI tools.**

---

## 🎯 Core Strengths

### 1. 🔬 Real Code Analysis, Not Templates

Code2Context doesn't generate context from templates or questionnaires. It **analyzes your actual source code**:

- Parses `import`/`export` statements (ES Modules, CommonJS, Python)
- Builds a real **module dependency graph**
- Identifies entry points, key exporters, and most-used dependencies
- Detects naming conventions, file organization patterns, and code style

```
✔ 46 modules parsed, 7 internal + 77 external deps
✔ Naming: PascalCase, 4 scripts, 17 env vars
```

### 2. 📊 Git-Aware Intelligence

Code2Context reads your git history to understand **what's actually happening** in your project:

- **Hot files** — which files are being modified most frequently
- **Development direction** — is the team building features, fixing bugs, or refactoring?
- **Contributors** — who's working on what
- **Recent commits** — what changed recently

This means the generated context reflects your project's **current reality**, not a static snapshot.

### 3. ⚡ Zero-Config, One Command

No interactive wizards. No questionnaires. No configuration files required.

```bash
# Just run it. It figures everything out.
npx code2context init
```

Code2Context automatically detects your languages, frameworks, package manager, entry points, and conventions — all from your code.

### 4. 🔄 Incremental Updates (Git-Diff Driven)

After the initial scan, updates are fast and surgical:

```bash
npx code2context update
```

This uses `git diff` to detect what changed since the last scan, and only re-analyzes affected areas. No full re-scan needed.

### 5. 🤖 AI-Enhanced Insights (Optional)

Optionally use any LLM to generate deeper insights:

- **Architecture decisions** — why the code is structured this way
- **Coding guidelines** — conventions an AI assistant should follow
- **AI gotchas** — common mistakes AI assistants make in this type of project

Works with **any OpenAI-compatible API** — OpenAI, DeepSeek, OpenRouter, Ollama, Groq, Mistral, and more.

**Without any API key, Code2Context still works perfectly** — all code analysis runs locally with zero external calls.

---

## 🔍 What It Extracts

| Layer | What It Detects | How |
|-------|----------------|-----|
| 🏗️ **Project Structure** | Directories, key files, entry points | File system traversal |
| 🧩 **Module Graph** | Imports, exports, dependency relationships | Regex-based parsing |
| 📐 **Coding Conventions** | Naming patterns, file organization, code style | Pattern detection |
| 🔧 **Configuration** | Scripts, env vars, dependencies, frameworks | Config file parsing |
| 📊 **Git Insights** | Development direction, hot files, contributors | Git history analysis |
| 🤖 **AI Summary** | Architecture decisions, coding guidelines, gotchas | LLM-powered (optional) |

### Supported Languages

**Full module parsing** (imports + exports):
- TypeScript / JavaScript (ES Modules + CommonJS)
- Python

**File detection** (structure + conventions):
- Rust, Go, Java, Kotlin, Swift, Ruby, PHP, C#, C++, C, Vue, Svelte, Dart, Elixir, Scala, Zig

---

## 🚀 Quick Start

### 1. Initialize context

```bash
npx code2context init
```

This scans your project and generates:
- `.code2context/context.json` — Structured context data
- `.code2context/context.md` — Human-readable summary

### 2. Export to your AI tool

```bash
# For Cursor
npx code2context export --format cursor
# → Creates .cursorrules in your project root

# For Claude
npx code2context export --format claude
# → Creates CLAUDE.md in your project root
```

### 3. Keep it updated

```bash
npx code2context update
```

### 4. Check context health

```bash
npx code2context stats
```

---

## 🤖 AI-Enhanced Analysis (Optional)

### Option A: Environment Variables

```bash
export CODE2CONTEXT_API_KEY=your-key
export CODE2CONTEXT_BASE_URL=https://api.provider.com/v1   # optional
export CODE2CONTEXT_MODEL=model-name                       # optional
```

### Option B: Config File

```bash
npx code2context config init
npx code2context config set ai.provider deepseek
npx code2context config set ai.model deepseek-chat
```

> ⚠️ **Security tip**: Use environment variables for API keys. The `.code2context/` directory is already in the default `.gitignore`.

<details>
<summary><b>Provider configurations (click to expand)</b></summary>

```bash
# OpenAI (default)
export CODE2CONTEXT_API_KEY=sk-xxx

# DeepSeek (most cost-effective)
export CODE2CONTEXT_API_KEY=sk-xxx
export CODE2CONTEXT_BASE_URL=https://api.deepseek.com
export CODE2CONTEXT_MODEL=deepseek-chat

# OpenRouter (100+ models)
export CODE2CONTEXT_API_KEY=sk-or-xxx
export CODE2CONTEXT_BASE_URL=https://openrouter.ai/api/v1
export CODE2CONTEXT_MODEL=anthropic/claude-3.5-sonnet

# Ollama (local, free, private)
export CODE2CONTEXT_API_KEY=ollama
export CODE2CONTEXT_BASE_URL=http://localhost:11434/v1
export CODE2CONTEXT_MODEL=llama3

# Groq (fastest inference)
export CODE2CONTEXT_API_KEY=gsk_xxx
export CODE2CONTEXT_BASE_URL=https://api.groq.com/openai/v1
export CODE2CONTEXT_MODEL=llama-3.1-70b-versatile
```

</details>

### Available Providers

| Provider | `ai.provider` | Default Model | Notes |
|----------|---------------|---------------|-------|
| OpenAI | `openai` | `gpt-4o-mini` | Default |
| DeepSeek | `deepseek` | `deepseek-chat` | Most cost-effective |
| OpenRouter | `openrouter` | `claude-3.5-sonnet` | 100+ models |
| Ollama | `ollama` | `llama3` | Local, free, private |
| Together AI | `together` | `Llama-3-70b` | Open-source models |
| Groq | `groq` | `llama-3.1-70b` | Fastest inference |
| Mistral | `mistral` | `mistral-large` | European provider |
| Custom | `custom` | — | Set `baseURL` manually |

---

## ⚙️ Configuration

```bash
npx code2context config init             # Create config file
npx code2context config init --global    # Create global config
npx code2context config show             # View resolved config
npx code2context config set <key> <val>  # Set a value
```

Config file format (`.code2context/config.json`):

```json
{
  "ai": {
    "provider": "deepseek",
    "baseURL": "https://api.deepseek.com",
    "model": "deepseek-chat"
  },
  "scan": {
    "ignore": ["vendor", "generated"],
    "maxFiles": 10000
  },
  "export": {
    "defaultFormat": "cursor"
  }
}
```

Config priority: CLI flags > env vars > project config > global config > defaults.

---

## 📊 Output Example

```
🔮 Code2Context — Initializing project context

✔ Found 58 files
✔ my-nextjs-app — TypeScript, JavaScript + Next.js, React, Tailwind CSS
✔ 5 directories, ~7399 lines
✔ 46 modules parsed, 7 internal + 77 external deps
✔ Naming: PascalCase, 4 scripts, 17 env vars
✔ 2 commits analyzed, 10 hot files
✔ AI analysis complete (your-provider / your-model)

✅ Context generated successfully!

  📁 .code2context/context.json — Structured context (22.1KB)
  📄 .code2context/context.md — Human-readable context
  ⏱️  Completed in 56.7s
```

The generated `.cursorrules` includes:

```markdown
# Project: my-nextjs-app

## Project Overview
A Next.js 13+ application built with TypeScript and Tailwind CSS...

## Architecture Decisions
- Adopted the Next.js app router with route-specific layout.tsx and page.tsx
- Separated concerns by placing reusable utilities in src/lib/ and src/types/
...

## Module Structure
Entry points:
- src/app/page.tsx → exports: HomePage
Key modules:
- src/lib/utils/index.ts → formatDate, parseConfig, validateInput...

## Important: AI Gotchas
- ⚠️ Assuming all components are client-side; forgetting to add 'use client'
- ⚠️ Misplacing environment variables: variables without NEXT_PUBLIC_ prefix...
```

### Performance on Real Projects

| Project | Language | Files | Modules | Context Size | Time |
|---------|----------|-------|---------|-------------|------|
| Next.js app | TypeScript | 58 | 46 | 18.8KB | 0.4s |
| Express.js | JavaScript (CJS) | 213 | 22 | 13.0KB | 0.1s |
| FastAPI | Python | 2,984 | 758 | 54.5KB | 0.5s |
| Vue Core | TypeScript monorepo | 702 | 283 | 55.4KB | 0.3s |

> ⏱️ Local analysis only. AI analysis adds ~5-60s depending on provider.

---

## 📋 All Commands

| Command | Description |
|---------|-------------|
| `code2context init` | Scan project and generate structured context |
| `code2context update` | Incrementally update context (git-diff driven) |
| `code2context export` | Export to AI tool format (cursor/claude/text/json) |
| `code2context stats` | Show context statistics and health |
| `code2context config init` | Generate a config file |
| `code2context config show` | Show current resolved configuration |
| `code2context config set` | Set a config value |

### Common Flags

```bash
code2context init --dir /path/to/project   # Specify project directory
code2context init --no-ai                  # Skip AI analysis
code2context export --format claude        # Choose export format
code2context export --output ./ctx.md      # Custom output path
```

---

## 🗺️ Roadmap

- [x] Core CLI (`init`, `update`, `export`, `stats`, `config`)
- [x] Multi-format export (cursor, claude, text, json)
- [x] Git-diff driven incremental updates
- [x] AI-enhanced analysis (any OpenAI-compatible provider)
- [x] Config file support (project + global)
- [x] Module parsing — JS/TS (ESM + CJS) + Python
- [x] Large project optimization (auto-trimming)
- [ ] MCP Server (let AI tools call Code2Context directly)
- [ ] More language parsers (Rust, Go, Java)
- [ ] Context quality scoring
- [ ] IDE plugins (VS Code, JetBrains)

---

## 🤝 Contributing

Contributions are welcome!

```bash
git clone https://github.com/Jamesfish/code2context.git
cd code2context
npm install
npm run build
node dist/cli.js init --dir /path/to/your/project
```

---

## ☕ Support This Project

If Code2Context saves you time and makes your AI coding workflow better, consider buying me a coffee! Your support helps keep this project actively maintained.

Every contribution — no matter how small — is deeply appreciated. 🙏

<div align="center">

| WeChat Pay | Alipay |
|:----------:|:------:|
| <img src="assets/wechat-pay.png" width="200" /> | <img src="assets/zhifubao-pay.jpg" width="200" /> |

</div>

You can also support by:
- ⭐ **Starring this repo** — it helps others discover the project
- 🐛 **Reporting bugs** or suggesting features
- 📢 **Sharing** Code2Context with your developer friends

---

## 📄 License

MIT © [Jamesfish](LICENSE)
