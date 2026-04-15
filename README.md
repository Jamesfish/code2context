<div align="center">

# 🔥 ContextForge

**Auto-generate structured context files for AI coding assistants.**

One command to help Cursor, Claude, Copilot and other AI tools truly understand your codebase.

[![npm version](https://img.shields.io/npm/v/contextforge)](https://www.npmjs.com/package/contextforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**English** | [中文](./README.zh-CN.md)

</div>

---

## 💡 The Pain Point

When using AI coding assistants (Cursor, Claude, Copilot, Cline...), the quality of AI output heavily depends on **how well it understands your project** — the architecture, coding conventions, module relationships, and common pitfalls.

But building and maintaining this context is painful:

- **Writing `.cursorrules` or `CLAUDE.md` by hand** takes time and effort
- **Context goes stale** as your code evolves — you forget to update it
- **Every AI tool needs a different format** — what works for Cursor doesn't work for Claude
- **Large codebases are hard to summarize** — it's difficult to know what's important to include

## ✅ The Solution

ContextForge **automatically scans your codebase** and extracts structured, actionable context — then exports it to any AI tool format you need.

```bash
# Scan your project (one command)
npx contextforge init

# Export to any AI tool format
npx contextforge export --format cursor    # → .cursorrules
npx contextforge export --format claude    # → CLAUDE.md
npx contextforge export --format text      # → CONTEXT.txt
npx contextforge export --format json      # → context.json

# Update after code changes (git-diff driven, fast)
npx contextforge update
```

**No manual writing. No stale context. One source of truth for all AI tools.**

---

## 🔍 What It Extracts

ContextForge performs a multi-layer analysis of your project:

| Layer | What It Detects | How |
|-------|----------------|-----|
| 🏗️ **Project Structure** | Directories, key files, entry points | File system traversal |
| 🧩 **Module Graph** | Imports, exports, dependency relationships | Regex-based parsing (JS/TS/Python) |
| 📐 **Coding Conventions** | Naming patterns, file organization, code style | Pattern detection |
| 🔧 **Configuration** | Scripts, env vars, dependencies, frameworks | Config file parsing |
| 📊 **Git Insights** | Development direction, hot files, contributors | Git history analysis |
| 🤖 **AI Summary** | Architecture decisions, coding guidelines, gotchas | LLM-powered analysis (optional) |

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
npx contextforge init
```

This scans your project and generates:
- `.contextforge/context.json` — Structured context data
- `.contextforge/context.md` — Human-readable summary

### 2. Export to your AI tool

```bash
# For Cursor
npx contextforge export --format cursor
# → Creates .cursorrules in your project root

# For Claude
npx contextforge export --format claude
# → Creates CLAUDE.md in your project root
```

### 3. Keep it updated

```bash
# After making code changes
npx contextforge update
```

The update command uses **git-diff** to detect what changed and only re-analyzes affected areas.

### 4. Check context health

```bash
npx contextforge stats
```

---

## 🤖 AI-Enhanced Analysis (Optional)

ContextForge can use an LLM to generate deeper insights about your project — architecture decisions, coding guidelines, and common pitfalls that AI assistants often get wrong.

This works with **any OpenAI-compatible API provider**.

### Option A: Environment Variables

```bash
export CONTEXTFORGE_API_KEY=your-key
export CONTEXTFORGE_BASE_URL=https://api.provider.com/v1   # optional
export CONTEXTFORGE_MODEL=model-name                       # optional
```

### Option B: Config File

```bash
# Generate a config file
npx contextforge config init

# Or set values directly
npx contextforge config set ai.provider deepseek
npx contextforge config set ai.model deepseek-chat
```

> ⚠️ **Security tip**: Don't put API keys in config files that get committed to git. Use environment variables for keys, config files for everything else. The `.contextforge/` directory is already in the default `.gitignore`.

### Provider Examples

<details>
<summary><b>Click to expand provider configurations</b></summary>

```bash
# OpenAI (default — just set the key)
export CONTEXTFORGE_API_KEY=sk-xxx

# DeepSeek (cheapest)
export CONTEXTFORGE_API_KEY=sk-xxx
export CONTEXTFORGE_BASE_URL=https://api.deepseek.com
export CONTEXTFORGE_MODEL=deepseek-chat

# OpenRouter (100+ models, one key)
export CONTEXTFORGE_API_KEY=sk-or-xxx
export CONTEXTFORGE_BASE_URL=https://openrouter.ai/api/v1
export CONTEXTFORGE_MODEL=anthropic/claude-3.5-sonnet

# Ollama (local, free, private)
export CONTEXTFORGE_API_KEY=ollama
export CONTEXTFORGE_BASE_URL=http://localhost:11434/v1
export CONTEXTFORGE_MODEL=llama3

# Together AI
export CONTEXTFORGE_API_KEY=xxx
export CONTEXTFORGE_BASE_URL=https://api.together.xyz/v1
export CONTEXTFORGE_MODEL=meta-llama/Llama-3-70b-chat-hf

# Groq (fastest inference)
export CONTEXTFORGE_API_KEY=gsk_xxx
export CONTEXTFORGE_BASE_URL=https://api.groq.com/openai/v1
export CONTEXTFORGE_MODEL=llama-3.1-70b-versatile

# Mistral
export CONTEXTFORGE_API_KEY=xxx
export CONTEXTFORGE_BASE_URL=https://api.mistral.ai/v1
export CONTEXTFORGE_MODEL=mistral-large-latest

# Azure OpenAI
export CONTEXTFORGE_API_KEY=xxx
export CONTEXTFORGE_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment/v1
export CONTEXTFORGE_MODEL=gpt-4o
```

</details>

**Without any API key, ContextForge still works perfectly** — it just skips the AI summary layer. All other analysis (structure, modules, conventions, git) runs locally with zero external calls.

---

## ⚙️ Configuration

### Config File

ContextForge supports project-level and global configuration:

```bash
# Create project config
npx contextforge config init

# Create global config
npx contextforge config init --global

# View resolved config
npx contextforge config show

# Set individual values
npx contextforge config set ai.provider openrouter
npx contextforge config set scan.maxFiles 5000
npx contextforge config set export.defaultFormat claude
```

### Config File Format

`.contextforge/config.json`:

```json
{
  "ai": {
    "provider": "deepseek",
    "baseURL": "https://api.deepseek.com",
    "model": "deepseek-chat"
  },
  "scan": {
    "ignore": ["vendor", "generated"],
    "languages": [],
    "maxFiles": 10000
  },
  "export": {
    "defaultFormat": "cursor"
  }
}
```

### Config Resolution Order

Higher priority overrides lower:

1. **CLI flags** (`--format`, `--no-ai`, etc.)
2. **Environment variables** (`CONTEXTFORGE_API_KEY`, etc.)
3. **Project config** (`.contextforge/config.json`)
4. **Global config** (`~/.config/contextforge/config.json`)
5. **Built-in defaults**

### Available Providers

| Provider | `ai.provider` | Default Model | Notes |
|----------|---------------|---------------|-------|
| OpenAI | `openai` | `gpt-4o-mini` | Default provider |
| DeepSeek | `deepseek` | `deepseek-chat` | Most cost-effective |
| OpenRouter | `openrouter` | `claude-3.5-sonnet` | 100+ models, one key |
| Ollama | `ollama` | `llama3` | Local, free, private |
| Together AI | `together` | `Llama-3-70b` | Open-source models |
| Groq | `groq` | `llama-3.1-70b` | Fastest inference |
| Mistral | `mistral` | `mistral-large` | European provider |
| Custom | `custom` | — | Set `baseURL` manually |

---

## 📊 Output Example

Running `contextforge init` on a real Next.js project:

```
🔥 ContextForge — Initializing project context

✔ Found 58 files
✔ my-nextjs-app — TypeScript, JavaScript + Next.js, React, Tailwind CSS
✔ 5 directories, ~7399 lines
✔ 46 modules parsed, 7 internal + 77 external deps
✔ Naming: PascalCase, 4 scripts, 17 env vars
✔ 2 commits analyzed, 10 hot files
✔ AI analysis complete (your-provider / your-model)

✅ Context generated successfully!

  📁 .contextforge/context.json — Structured context (22.1KB)
  📄 .contextforge/context.md — Human-readable context
  ⏱️  Completed in 56.7s
```

The generated `.cursorrules` includes structured sections like:

```markdown
# Project: my-nextjs-app

## Project Overview
my-nextjs-app is a Next.js 13+ application built with TypeScript and Tailwind CSS
that provides a data dashboard...

## Architecture Decisions
- Adopted the Next.js app router (src/app/) with route-specific layout.tsx and page.tsx
- Separated concerns by placing reusable utilities in src/lib/ and src/types/
...

## Module Structure
Entry points:
- src/app/page.tsx → exports: HomePage
Key modules (most exports):
- src/lib/utils/index.ts → formatDate, parseConfig, validateInput...

## Important: AI Gotchas
- ⚠️ Assuming all components are client-side; forgetting to add 'use client'
- ⚠️ Misplacing environment variables: variables without NEXT_PUBLIC_ prefix...
```

### Performance on Real Projects

| Project | Language | Files | Modules | Context Size | Time |
|---------|----------|-------|---------|-------------|------|
| my-nextjs-app | TypeScript/Next.js | 58 | 46 | 18.8KB | 0.4s |
| Express.js | JavaScript (CJS) | 213 | 22 | 13.0KB | 0.1s |
| FastAPI | Python | 2,984 | 758 | 54.5KB | 0.5s |
| Vue Core | TypeScript monorepo | 702 | 283 | 55.4KB | 0.3s |

> ⏱️ Times shown are for local analysis only (without AI). AI analysis adds ~5-60s depending on provider and model.

---

## 📋 All Commands

| Command | Description |
|---------|-------------|
| `contextforge init` | Scan project and generate structured context |
| `contextforge update` | Incrementally update context (git-diff driven) |
| `contextforge export` | Export context to AI tool format (cursor/claude/text/json) |
| `contextforge stats` | Show context statistics and health |
| `contextforge config init` | Generate a config file |
| `contextforge config show` | Show current resolved configuration |
| `contextforge config set <key> <value>` | Set a config value |

### Common Flags

```bash
# Specify project directory
contextforge init --dir /path/to/project

# Skip AI analysis
contextforge init --no-ai

# Choose export format
contextforge export --format claude

# Custom output path
contextforge export --output ./my-context.md

# Verbose output
contextforge init --verbose
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
- [ ] MCP Server (let AI tools call ContextForge directly)
- [ ] Cloud sync (cross-device, team sharing)
- [ ] IDE plugins (VS Code, JetBrains)
- [ ] Context quality scoring
- [ ] More language parsers (Rust, Go, Java)

---

## 🤝 Contributing

Contributions are welcome! Whether it's bug reports, feature requests, or pull requests — all are appreciated.

```bash
# Clone the repo
git clone https://github.com/Jamesfish/contextforge.git
cd contextforge

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/cli.js init --dir /path/to/your/project
```

---

## ☕ Support This Project

If ContextForge saves you time and makes your AI coding workflow better, consider buying me a coffee! Your support helps keep this project actively maintained and motivates continued development of new features.

Every contribution — no matter how small — is deeply appreciated. 🙏

<div align="center">

| WeChat Pay | Alipay |
|:----------:|:------:|
| <img src="assets/wechat-pay.png" width="200" /> | <img src="assets/zhifubao-pay.jpg" width="200" /> |

</div>

You can also support by:
- ⭐ **Starring this repo** — it helps others discover the project
- 🐛 **Reporting bugs** or suggesting features
- 📢 **Sharing** ContextForge with your developer friends

---

## 📄 License

MIT © [ContextForge Contributors](LICENSE)
