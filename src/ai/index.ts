/**
 * AI Analyzer — Uses LLM to generate enhanced project context.
 *
 * Supports ANY OpenAI-compatible API provider via environment variables:
 *
 *   CODE2CONTEXT_API_KEY     — API key (required for AI analysis)
 *   CODE2CONTEXT_BASE_URL    — API base URL (optional, defaults to OpenAI)
 *   CODE2CONTEXT_MODEL       — Model name (optional, defaults to "gpt-4o-mini")
 *
 * Examples:
 *   # OpenAI (default)
 *   export CODE2CONTEXT_API_KEY=sk-xxx
 *
 *   # DeepSeek
 *   export CODE2CONTEXT_API_KEY=sk-xxx
 *   export CODE2CONTEXT_BASE_URL=https://api.deepseek.com
 *   export CODE2CONTEXT_MODEL=deepseek-chat
 *
 *   # OpenRouter (access 100+ models)
 *   export CODE2CONTEXT_API_KEY=sk-or-xxx
 *   export CODE2CONTEXT_BASE_URL=https://openrouter.ai/api/v1
 *   export CODE2CONTEXT_MODEL=anthropic/claude-3.5-sonnet
 *
 *   # Ollama (local, free)
 *   export CODE2CONTEXT_API_KEY=ollama
 *   export CODE2CONTEXT_BASE_URL=http://localhost:11434/v1
 *   export CODE2CONTEXT_MODEL=llama3
 *
 *   # Any other OpenAI-compatible provider (Together, Groq, Mistral, etc.)
 *   export CODE2CONTEXT_API_KEY=xxx
 *   export CODE2CONTEXT_BASE_URL=https://api.together.xyz/v1
 *   export CODE2CONTEXT_MODEL=meta-llama/Llama-3-70b-chat-hf
 *
 * Legacy support: DEEPSEEK_API_KEY and OPENAI_API_KEY are still recognized
 * as fallbacks for backward compatibility.
 */

import OpenAI from 'openai';
import {
    loadConfig,
    resolveAIConfig as resolveFromConfig,
    type ResolvedAIConfig,
} from '../config.js';
import type { AISummary, ProjectContext } from '../types.js';

const SYSTEM_PROMPT = `You are Code2Context, an AI that analyzes codebases to generate structured context for other AI coding assistants.

Your job is to produce a concise, actionable project summary that helps AI assistants understand:
1. What this project does (one paragraph)
2. Key architectural decisions and WHY they were made
3. Important coding conventions that an AI must follow
4. Common gotchas that AI assistants often get wrong in this type of project

Be specific and practical. Don't be generic. Reference actual file paths and patterns from the project.
Output in JSON format matching the schema provided.`;

export class AIAnalyzer {
    private client: OpenAI | null = null;
    private model: string = 'gpt-4o-mini';
    private providerInfo: string = 'none';

    /**
     * @param projectDir — Project directory to load config from.
     *                      If omitted, uses CWD for config resolution.
     */
    constructor(projectDir?: string) {
        const config = loadConfig(projectDir);
        const resolved: ResolvedAIConfig | null = resolveFromConfig(config);

        if (resolved) {
            this.client = new OpenAI({
                apiKey: resolved.apiKey,
                baseURL: resolved.baseURL,
            });
            this.model = resolved.model;
            this.providerInfo = resolved.baseURL
                ? `${new URL(resolved.baseURL).hostname} / ${resolved.model}`
                : `openai.com / ${resolved.model}`;
        }
    }

    /** Check if AI analysis is available */
    isAvailable(): boolean {
        return this.client !== null;
    }

    /** Get a human-readable description of the configured provider */
    getProviderInfo(): string {
        return this.providerInfo;
    }

    /** Generate AI-enhanced summary */
    async analyze(context: Omit<ProjectContext, 'aiSummary' | 'generated'>): Promise<AISummary | undefined> {
        if (!this.client) return undefined;

        // Build a compact representation of the project for the AI
        const projectInfo = this.buildProjectInfo(context);

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `Analyze this project and generate a structured summary.\n\nProject Info:\n${projectInfo}\n\nRespond with a JSON object matching this schema:\n{\n  "overview": "one paragraph project overview",\n  "architectureDecisions": ["decision 1", "decision 2", ...],\n  "codingGuidelines": ["guideline 1", "guideline 2", ...],\n  "aiGotchas": ["gotcha 1", "gotcha 2", ...]\n}`,
                    },
                ],
                temperature: 0.3,
                max_tokens: 1500,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return undefined;

            // Extract JSON from response (handles various LLM output formats)
            const parsed = this.extractJSON(content);
            if (!parsed) {
                console.error('AI analysis: could not parse JSON from response');
                return undefined;
            }
            return parsed;
        } catch (error) {
            // AI analysis is optional — fail silently
            console.error('AI analysis failed (continuing without it):', (error as Error).message);
            return undefined;
        }
    }

    /** Robustly extract JSON from LLM response (handles code blocks, preamble text, etc.) */
    private extractJSON(raw: string): AISummary | null {
        // Strategy 1: Try direct parse
        try {
            return JSON.parse(raw.trim()) as AISummary;
        } catch { /* continue */ }

        // Strategy 2: Extract from ```json ... ``` code block
        const codeBlockMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1].trim()) as AISummary;
            } catch { /* continue */ }
        }

        // Strategy 3: Find first { ... } block (greedy)
        const braceMatch = raw.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            try {
                return JSON.parse(braceMatch[0]) as AISummary;
            } catch { /* continue */ }
        }

        return null;
    }

    /** Build compact project info string for AI consumption */
    private buildProjectInfo(context: Omit<ProjectContext, 'aiSummary' | 'generated'>): string {
        const parts: string[] = [];

        // Meta
        const m = context.meta;
        parts.push(`## Project: ${m.name}`);
        if (m.description) parts.push(`Description: ${m.description}`);
        if (m.version) parts.push(`Version: ${m.version}`);
        parts.push(`Languages: ${m.languages.map(l => `${l.name}(${l.percentage}%)`).join(', ')}`);
        parts.push(`Frameworks: ${m.frameworks.join(', ') || 'none detected'}`);
        parts.push(`Package Manager: ${m.packageManager || 'unknown'}`);
        parts.push(`Entry Points: ${m.entryPoints.join(', ') || 'none detected'}`);

        // Structure
        const s = context.structure;
        parts.push(`\n## Structure (${s.totalFiles} files, ~${s.totalLines} lines)`);
        parts.push('Directories:');
        for (const dir of s.directories.slice(0, 15)) {
            parts.push(`  ${dir.path}/ — ${dir.purpose} (${dir.fileCount} files)`);
        }
        parts.push('Key Files:');
        for (const kf of s.keyFiles) {
            parts.push(`  ${kf.path} — ${kf.role}`);
        }

        // Conventions
        const c = context.conventions;
        parts.push('\n## Conventions');
        parts.push(`File naming: ${c.naming.files}`);
        parts.push(`Component naming: ${c.naming.components}`);
        if (c.fileOrganization.length > 0) {
            parts.push(`Organization: ${c.fileOrganization.join('; ')}`);
        }
        if (c.envVars.length > 0) {
            parts.push(`Env vars: ${c.envVars.map(v => v.name).join(', ')}`);
        }
        if (c.scripts.length > 0) {
            parts.push('Scripts:');
            for (const script of c.scripts) {
                parts.push(`  ${script.name}: ${script.command}`);
            }
        }
        if (c.styleNotes.length > 0) {
            parts.push(`Style: ${c.styleNotes.join('; ')}`);
        }

        // Git
        const g = context.gitInsights;
        parts.push('\n## Git Insights');
        parts.push(`Direction: ${g.recentDirection}`);
        if (g.hotFiles.length > 0) {
            parts.push(`Hot files: ${g.hotFiles.slice(0, 5).map(f => `${f.path}(${f.changeCount})`).join(', ')}`);
        }
        if (g.recentCommits.length > 0) {
            parts.push('Recent commits:');
            for (const commit of g.recentCommits.slice(0, 10)) {
                parts.push(`  ${commit.hash} ${commit.message}`);
            }
        }

        return parts.join('\n');
    }
}
