<div align="center">

# 🔮 Code2Context

**一条命令，将代码库转化为 AI 可理解的上下文。**

零配置、一条命令，为 AI 编程助手自动提取代码库上下文。

[![npm version](https://img.shields.io/npm/v/code2context)](https://www.npmjs.com/package/code2context)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

[English](./README.md) | **中文**

</div>

---

## 💡 痛点

使用 AI 编程助手（Cursor、Claude、Copilot、Cline……）时，AI 输出的质量很大程度上取决于**它对你项目的理解程度**。

但构建和维护这些上下文信息非常痛苦：

- **手写 `.cursorrules` 或 `CLAUDE.md`** 费时费力
- **上下文容易过时** —— 代码在演进，你却忘了更新
- **每个 AI 工具需要不同的格式** —— 给 Cursor 写的对 Claude 不适用
- **大型代码库难以总结** —— 很难判断哪些信息是重要的

## ✅ Code2Context 的不同之处

Code2Context 不问你问题，不需要模板。它**直接阅读你的真实代码**，提取事实。

```bash
# 一条命令。零问答。真实分析。
npx code2context init
```

就这样。Code2Context 自动完成：

1. 🔍 **扫描** 项目中的每一个文件
2. 🧩 **解析** 模块的 import/export，构建依赖关系图
3. 📐 **检测** 代码中的实际编码规范
4. 📊 **分析** Git 历史，找出热点文件和开发方向
5. 🤖 **生成** AI 驱动的架构洞察（可选）
6. 📤 **导出** 为 `.cursorrules`、`CLAUDE.md` 或任何你需要的格式

```bash
npx code2context export --format cursor    # → .cursorrules
npx code2context export --format claude    # → CLAUDE.md
npx code2context export --format text      # → CONTEXT.txt

# 代码变更后增量更新（基于 git-diff，速度快）
npx code2context update
```

**无需手写。不会过时。所有 AI 工具共享同一份上下文。**

---

## 🎯 核心优势

### 1. 🔬 真实代码分析，而非模板

Code2Context 不从模板或问卷生成上下文。它**分析你的实际源代码**：

- 解析 `import`/`export` 语句（ES Modules、CommonJS、Python）
- 构建真实的**模块依赖关系图**
- 识别入口点、关键导出模块和最常用的依赖
- 检测命名规范、文件组织模式和代码风格

```
✔ 46 modules parsed, 7 internal + 77 external deps
✔ Naming: PascalCase, 4 scripts, 17 env vars
```

### 2. 📊 Git 感知的智能分析

Code2Context 读取你的 Git 历史，理解项目中**真正在发生什么**：

- **热点文件** —— 哪些文件被修改得最频繁
- **开发方向** —— 团队在做新功能、修 Bug 还是重构？
- **贡献者** —— 谁在做什么
- **最近提交** —— 最近改了什么

这意味着生成的上下文反映的是项目的**当前现实**，而不是静态快照。

### 3. ⚡ 零配置，一条命令

没有交互式向导，没有问卷，不需要配置文件。

```bash
# 直接运行，它会自己搞清楚一切
npx code2context init
```

Code2Context 自动检测你的语言、框架、包管理器、入口点和编码规范 —— 全部来自你的代码。

### 4. 🔄 增量更新（Git-Diff 驱动）

初始扫描后，更新是快速且精准的：

```bash
npx code2context update
```

使用 `git diff` 检测上次扫描以来的变更，只重新分析受影响的部分。无需全量重扫。

### 5. 🤖 AI 增强洞察（可选）

可选使用任意 LLM 生成更深层的洞察：

- **架构决策** —— 代码为什么这样组织
- **编码指南** —— AI 助手应该遵循的规范
- **AI 陷阱** —— AI 助手在这类项目中常犯的错误

支持**任何兼容 OpenAI 接口的 API** —— OpenAI、DeepSeek、OpenRouter、Ollama、Groq、Mistral 等。

**即使没有配置任何 API Key，Code2Context 也能完美运行** —— 所有代码分析均在本地运行，零外部调用。

---

## 🔍 提取内容

| 层级 | 检测内容 | 实现方式 |
|------|---------|---------|
| 🏗️ **项目结构** | 目录、关键文件、入口点 | 文件系统遍历 |
| 🧩 **模块依赖图** | 导入、导出、依赖关系 | 基于正则的解析 |
| 📐 **编码规范** | 命名模式、文件组织、代码风格 | 模式检测 |
| 🔧 **项目配置** | 脚本、环境变量、依赖、框架 | 配置文件解析 |
| 📊 **Git 洞察** | 开发方向、热点文件、贡献者 | Git 历史分析 |
| 🤖 **AI 总结** | 架构决策、编码指南、常见陷阱 | LLM 驱动（可选） |

### 支持的语言

**完整模块解析**（导入 + 导出）：TypeScript / JavaScript（ESM + CJS）、Python

**文件检测**（结构 + 规范）：Rust、Go、Java、Kotlin、Swift、Ruby、PHP、C#、C++、C、Vue、Svelte、Dart、Elixir、Scala、Zig

---

## 🚀 快速开始

```bash
npx code2context init                      # 扫描项目
npx code2context export --format cursor    # 导出 .cursorrules
npx code2context export --format claude    # 导出 CLAUDE.md
npx code2context update                    # 增量更新
npx code2context stats                     # 查看统计
```

---

## 🤖 AI 增强分析（可选）

```bash
export CODE2CONTEXT_API_KEY=your-key
export CODE2CONTEXT_BASE_URL=https://api.deepseek.com    # 可选
export CODE2CONTEXT_MODEL=deepseek-chat                  # 可选
```

或使用配置文件：

```bash
npx code2context config init
npx code2context config set ai.provider deepseek
```

> ⚠️ **安全提示**：密钥请使用环境变量。`.code2context/` 目录已默认加入 `.gitignore`。

<details>
<summary><b>点击展开各提供商配置</b></summary>

```bash
# OpenAI（默认）
export CODE2CONTEXT_API_KEY=sk-xxx

# DeepSeek（最具性价比）
export CODE2CONTEXT_API_KEY=sk-xxx
export CODE2CONTEXT_BASE_URL=https://api.deepseek.com
export CODE2CONTEXT_MODEL=deepseek-chat

# OpenRouter（100+ 模型）
export CODE2CONTEXT_API_KEY=sk-or-xxx
export CODE2CONTEXT_BASE_URL=https://openrouter.ai/api/v1
export CODE2CONTEXT_MODEL=anthropic/claude-3.5-sonnet

# Ollama（本地运行，免费）
export CODE2CONTEXT_API_KEY=ollama
export CODE2CONTEXT_BASE_URL=http://localhost:11434/v1
export CODE2CONTEXT_MODEL=llama3
```

</details>

---

## 📊 输出示例

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
  ⏱️  Completed in 56.7s
```

### 真实项目性能表现

| 项目 | 语言 | 文件数 | 模块数 | 上下文大小 | 耗时 |
|------|------|--------|--------|-----------|------|
| Next.js app | TypeScript | 58 | 46 | 18.8KB | 0.4s |
| Express.js | JavaScript (CJS) | 213 | 22 | 13.0KB | 0.1s |
| FastAPI | Python | 2,984 | 758 | 54.5KB | 0.5s |
| Vue Core | TypeScript monorepo | 702 | 283 | 55.4KB | 0.3s |

---

## 🗺️ 路线图

- [x] 核心 CLI（`init`、`update`、`export`、`stats`、`config`）
- [x] 多格式导出（cursor、claude、text、json）
- [x] 基于 git-diff 的增量更新
- [x] AI 增强分析（支持任何 OpenAI 兼容提供商）
- [x] 模块解析 — JS/TS（ESM + CJS）+ Python
- [x] 大型项目优化（自动裁剪）
- [ ] MCP Server（让 AI 工具直接调用 Code2Context）
- [ ] 更多语言解析器（Rust、Go、Java）
- [ ] IDE 插件（VS Code、JetBrains）

---

## ☕ 支持本项目

如果 Code2Context 帮你节省了时间，让你的 AI 编程工作流更加顺畅，欢迎请我喝杯咖啡！

<div align="center">

| 微信支付 | 支付宝 |
|:--------:|:------:|
| <img src="assets/wechat-pay.png" width="200" /> | <img src="assets/zhifubao-pay.jpg" width="200" /> |

</div>

你也可以通过以下方式支持：
- ⭐ **给这个仓库点 Star** —— 帮助更多人发现这个项目
- 🐛 **报告 Bug** 或提出功能建议
- 📢 **分享** Code2Context 给你的开发者朋友

---

## 📄 许可证

MIT © [Jamesfish](LICENSE)
