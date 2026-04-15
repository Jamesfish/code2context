
<div align="center">

# 🔥 ContextForge

**为 AI 编程助手自动生成结构化上下文文件。**

一条命令，让 Cursor、Claude、Copilot 等 AI 工具真正理解你的代码库。

[![npm version](https://img.shields.io/npm/v/contextforge)](https://www.npmjs.com/package/contextforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

[English](./README.md) | **中文**

</div>

---

## 💡 痛点

使用 AI 编程助手（Cursor、Claude、Copilot、Cline……）时，AI 输出的质量很大程度上取决于**它对你项目的理解程度** —— 架构设计、编码规范、模块关系、常见陷阱等。

但构建和维护这些上下文信息非常痛苦：

- **手写 `.cursorrules` 或 `CLAUDE.md`** 费时费力
- **上下文容易过时** —— 代码在演进，你却忘了更新上下文
- **每个 AI 工具需要不同的格式** —— 给 Cursor 写的对 Claude 不适用
- **大型代码库难以总结** —— 很难判断哪些信息是重要的

## ✅ 解决方案

ContextForge **自动扫描你的代码库**，提取结构化、可操作的上下文信息 —— 然后导出为你需要的任何 AI 工具格式。

```bash
# 扫描你的项目（一条命令）
npx contextforge init

# 导出为任意 AI 工具格式
npx contextforge export --format cursor    # → .cursorrules
npx contextforge export --format claude    # → CLAUDE.md
npx contextforge export --format text      # → CONTEXT.txt
npx contextforge export --format json      # → context.json

# 代码变更后增量更新（基于 git-diff，速度快）
npx contextforge update
```

**无需手写。不会过时。所有 AI 工具共享同一份上下文。**

---

## 🔍 提取内容

ContextForge 对你的项目进行多层分析：

| 层级 | 检测内容 | 实现方式 |
|------|---------|---------|
| 🏗️ **项目结构** | 目录、关键文件、入口点 | 文件系统遍历 |
| 🧩 **模块依赖图** | 导入、导出、依赖关系 | 基于正则的解析（JS/TS/Python） |
| 📐 **编码规范** | 命名模式、文件组织、代码风格 | 模式检测 |
| 🔧 **项目配置** | 脚本、环境变量、依赖、框架 | 配置文件解析 |
| 📊 **Git 洞察** | 开发方向、热点文件、贡献者 | Git 历史分析 |
| 🤖 **AI 总结** | 架构决策、编码指南、常见陷阱 | LLM 驱动分析（可选） |

### 支持的语言

**完整模块解析**（导入 + 导出）：
- TypeScript / JavaScript（ES Modules + CommonJS）
- Python

**文件检测**（结构 + 规范）：
- Rust、Go、Java、Kotlin、Swift、Ruby、PHP、C#、C++、C、Vue、Svelte、Dart、Elixir、Scala、Zig

---

## 🚀 快速开始

### 1. 初始化上下文

```bash
npx contextforge init
```

这会扫描你的项目并生成：
- `.contextforge/context.json` — 结构化上下文数据
- `.contextforge/context.md` — 人类可读的摘要

### 2. 导出到你的 AI 工具

```bash
# 导出给 Cursor
npx contextforge export --format cursor
# → 在项目根目录创建 .cursorrules

# 导出给 Claude
npx contextforge export --format claude
# → 在项目根目录创建 CLAUDE.md
```

### 3. 保持更新

```bash
# 代码变更后
npx contextforge update
```

update 命令使用 **git-diff** 检测变更，只重新分析受影响的部分。

### 4. 查看上下文健康状态

```bash
npx contextforge stats
```

---

## 🤖 AI 增强分析（可选）

ContextForge 可以使用 LLM 生成更深层的项目洞察 —— 架构决策、编码指南，以及 AI 助手经常犯错的常见陷阱。

支持**任何兼容 OpenAI 接口的 API 提供商**。

### 方式 A：环境变量

```bash
export CONTEXTFORGE_API_KEY=your-key
export CONTEXTFORGE_BASE_URL=https://api.provider.com/v1   # 可选
export CONTEXTFORGE_MODEL=model-name                       # 可选
```

### 方式 B：配置文件

```bash
# 生成配置文件
npx contextforge config init

# 或直接设置值
npx contextforge config set ai.provider deepseek
npx contextforge config set ai.model deepseek-chat
```

> ⚠️ **安全提示**：不要将 API Key 写入会被提交到 git 的配置文件中。密钥请使用环境变量，配置文件用于其他设置。`.contextforge/` 目录已默认加入 `.gitignore`。

### 提供商配置示例

<details>
<summary><b>点击展开各提供商配置</b></summary>

```bash
# OpenAI（默认 — 只需设置密钥）
export CONTEXTFORGE_API_KEY=sk-xxx

# DeepSeek（最具性价比）
export CONTEXTFORGE_API_KEY=sk-xxx
export CONTEXTFORGE_BASE_URL=https://api.deepseek.com
export CONTEXTFORGE_MODEL=deepseek-chat

# OpenRouter（100+ 模型，一个密钥）
export CONTEXTFORGE_API_KEY=sk-or-xxx
export CONTEXTFORGE_BASE_URL=https://openrouter.ai/api/v1
export CONTEXTFORGE_MODEL=anthropic/claude-3.5-sonnet

# Ollama（本地运行，免费，隐私安全）
export CONTEXTFORGE_API_KEY=ollama
export CONTEXTFORGE_BASE_URL=http://localhost:11434/v1
export CONTEXTFORGE_MODEL=llama3

# Together AI
export CONTEXTFORGE_API_KEY=xxx
export CONTEXTFORGE_BASE_URL=https://api.together.xyz/v1
export CONTEXTFORGE_MODEL=meta-llama/Llama-3-70b-chat-hf

# Groq（最快推理速度）
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

**即使没有配置任何 API Key，ContextForge 也能完美运行** —— 只是跳过 AI 总结层。其他所有分析（结构、模块、规范、Git）均在本地运行，零外部调用。

---

## ⚙️ 配置

### 配置文件

ContextForge 支持项目级和全局配置：

```bash
# 创建项目配置
npx contextforge config init

# 创建全局配置
npx contextforge config init --global

# 查看当前生效的配置
npx contextforge config show

# 设置单个配置项
npx contextforge config set ai.provider openrouter
npx contextforge config set scan.maxFiles 5000
npx contextforge config set export.defaultFormat claude
```

### 配置文件格式

`.contextforge/config.json`：

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

### 配置优先级

高优先级覆盖低优先级：

1. **CLI 参数**（`--format`、`--no-ai` 等）
2. **环境变量**（`CONTEXTFORGE_API_KEY` 等）
3. **项目配置**（`.contextforge/config.json`）
4. **全局配置**（`~/.config/contextforge/config.json`）
5. **内置默认值**

### 可用提供商

| 提供商 | `ai.provider` | 默认模型 | 备注 |
|--------|---------------|---------|------|
| OpenAI | `openai` | `gpt-4o-mini` | 默认提供商 |
| DeepSeek | `deepseek` | `deepseek-chat` | 最具性价比 |
| OpenRouter | `openrouter` | `claude-3.5-sonnet` | 100+ 模型，一个密钥 |
| Ollama | `ollama` | `llama3` | 本地运行，免费，隐私安全 |
| Together AI | `together` | `Llama-3-70b` | 开源模型 |
| Groq | `groq` | `llama-3.1-70b` | 最快推理速度 |
| Mistral | `mistral` | `mistral-large` | 欧洲提供商 |
| 自定义 | `custom` | — | 手动设置 `baseURL` |

---

## 📊 输出示例

在一个真实的 Next.js 项目上运行 `contextforge init`：

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

生成的 `.cursorrules` 包含如下结构化内容：

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

### 真实项目性能表现

| 项目 | 语言 | 文件数 | 模块数 | 上下文大小 | 耗时 |
|------|------|--------|--------|-----------|------|
| my-nextjs-app | TypeScript/Next.js | 58 | 46 | 18.8KB | 0.4s |
| Express.js | JavaScript (CJS) | 213 | 22 | 13.0KB | 0.1s |
| FastAPI | Python | 2,984 | 758 | 54.5KB | 0.5s |
| Vue Core | TypeScript monorepo | 702 | 283 | 55.4KB | 0.3s |

> ⏱️ 以上耗时仅为本地分析时间（不含 AI）。AI 分析额外需要 ~5-60 秒，取决于提供商和模型。

---

## 📋 所有命令

| 命令 | 说明 |
|------|------|
| `contextforge init` | 扫描项目并生成结构化上下文 |
| `contextforge update` | 增量更新上下文（基于 git-diff） |
| `contextforge export` | 导出上下文为 AI 工具格式（cursor/claude/text/json） |
| `contextforge stats` | 显示上下文统计信息和健康状态 |
| `contextforge config init` | 生成配置文件 |
| `contextforge config show` | 显示当前生效的配置 |
| `contextforge config set <key> <value>` | 设置配置项 |

### 常用参数

```bash
# 指定项目目录
contextforge init --dir /path/to/project

# 跳过 AI 分析
contextforge init --no-ai

# 选择导出格式
contextforge export --format claude

# 自定义输出路径
contextforge export --output ./my-context.md

# 详细输出
contextforge init --verbose
```

---

## 🗺️ 路线图

- [x] 核心 CLI（`init`、`update`、`export`、`stats`、`config`）
- [x] 多格式导出（cursor、claude、text、json）
- [x] 基于 git-diff 的增量更新
- [x] AI 增强分析（支持任何 OpenAI 兼容提供商）
- [x] 配置文件支持（项目级 + 全局）
- [x] 模块解析 — JS/TS（ESM + CJS）+ Python
- [x] 大型项目优化（自动裁剪）
- [ ] MCP Server（让 AI 工具直接调用 ContextForge）
- [ ] 云端同步（跨设备、团队共享）
- [ ] IDE 插件（VS Code、JetBrains）
- [ ] 上下文质量评分
- [ ] 更多语言解析器（Rust、Go、Java）

---

## 🤝 参与贡献

欢迎贡献！无论是 Bug 报告、功能建议还是 Pull Request —— 我们都非常感谢。

```bash
# 克隆仓库
git clone https://github.com/Jamesfish/contextforge.git
cd contextforge

# 安装依赖
npm install

# 构建
npm run build

# 本地运行
node dist/cli.js init --dir /path/to/your/project
```

---

## ☕ 支持本项目

如果 ContextForge 帮你节省了时间，让你的 AI 编程工作流更加顺畅，欢迎请我喝杯咖啡！你的支持是这个项目持续维护和开发新功能的最大动力。

每一份支持 —— 无论大小 —— 都让我深受鼓舞。🙏

<div align="center">

| 微信支付 | 支付宝 |
|:--------:|:------:|
| <img src="assets/wechat-pay.png" width="200" /> | <img src="assets/zhifubao-pay.jpg" width="200" /> |

</div>

你也可以通过以下方式支持：
- ⭐ **给这个仓库点 Star** —— 帮助更多人发现这个项目
- 🐛 **报告 Bug** 或提出功能建议
- 📢 **分享** ContextForge 给你的开发者朋友

---

## 📄 许可证

MIT © [ContextForge Contributors](LICENSE)
