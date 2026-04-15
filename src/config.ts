/**
 * Configuration loader for ContextForge.
 *
 * Config resolution order (later overrides earlier):
 *   1. Built-in defaults
 *   2. Global config:  ~/.config/contextforge/config.json
 *   3. Project config: .contextforge/config.json  (or contextforge.config.json)
 *   4. Environment variables: CONTEXTFORGE_*
 *   5. CLI flags (handled by commander, not here)
 *
 * Config file format (.contextforge/config.json):
 * {
 *   "ai": {
 *     "provider": "deepseek",          // preset name or "custom"
 *     "apiKey": "sk-xxx",              // or use env var
 *     "baseURL": "https://...",        // auto-set for known providers
 *     "model": "deepseek-chat"         // auto-set for known providers
 *   },
 *   "scan": {
 *     "ignore": ["vendor", "generated"],  // extra ignore patterns
 *     "languages": ["typescript", "python"],  // focus languages
 *     "maxFiles": 5000                 // skip scan if too many files
 *   },
 *   "export": {
 *     "defaultFormat": "cursor"        // default export format
 *   }
 * }
 */

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';

// ─── Types ───────────────────────────────────────────────────────────

export interface ContextForgeConfig {
    ai: AIConfig;
    scan: ScanConfig;
    export: ExportConfig;
}

export interface AIConfig {
    /** Provider preset name, or "custom" for manual baseURL */
    provider: string;
    /** API key (prefer env var CONTEXTFORGE_API_KEY for security) */
    apiKey?: string;
    /** API base URL (auto-resolved for known providers) */
    baseURL?: string;
    /** Model name (auto-resolved for known providers) */
    model?: string;
}

export interface ScanConfig {
    /** Extra glob patterns to ignore (on top of .gitignore + defaults) */
    ignore: string[];
    /** Focus on specific languages (empty = all) */
    languages: string[];
    /** Skip scan if project has more files than this */
    maxFiles: number;
}

export interface ExportConfig {
    /** Default export format when --format is not specified */
    defaultFormat: 'cursor' | 'claude' | 'text' | 'json';
}

/** Resolved AI connection config (ready to use) */
export interface ResolvedAIConfig {
    apiKey: string;
    baseURL?: string;
    model: string;
}

// ─── Provider Presets ────────────────────────────────────────────────

export const PROVIDER_PRESETS: Record<string, { baseURL: string; model: string; name: string }> = {
    openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini', name: 'OpenAI' },
    deepseek: { baseURL: 'https://api.deepseek.com', model: 'deepseek-chat', name: 'DeepSeek' },
    openrouter: { baseURL: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-3.5-sonnet', name: 'OpenRouter' },
    ollama: { baseURL: 'http://localhost:11434/v1', model: 'llama3', name: 'Ollama (local)' },
    together: { baseURL: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3-70b-chat-hf', name: 'Together AI' },
    groq: { baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile', name: 'Groq' },
    mistral: { baseURL: 'https://api.mistral.ai/v1', model: 'mistral-large-latest', name: 'Mistral' },
};

/** Legacy env var → provider mapping */
const LEGACY_ENV_MAP: Record<string, string> = {
    DEEPSEEK_API_KEY: 'deepseek',
    OPENAI_API_KEY: 'openai',
};

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ContextForgeConfig = {
    ai: {
        provider: 'openai',
    },
    scan: {
        ignore: [],
        languages: [],
        maxFiles: 10000,
    },
    export: {
        defaultFormat: 'cursor',
    },
};

// ─── Config File Locations ───────────────────────────────────────────

function getConfigPaths(projectDir: string): string[] {
    const cwd = resolve('.');
    const paths = [
        // Global config (lowest priority)
        join(homedir(), '.config', 'contextforge', 'config.json'),
    ];

    // If CWD differs from projectDir, also load CWD config (middle priority)
    // This allows running `contextforge init --dir /other/project` while
    // keeping your API key config in the CWD's .contextforge/config.json
    if (cwd !== resolve(projectDir)) {
        paths.push(join(cwd, 'contextforge.config.json'));
        paths.push(join(cwd, '.contextforge', 'config.json'));
    }

    // Project-level configs (highest priority)
    paths.push(join(projectDir, 'contextforge.config.json'));
    paths.push(join(projectDir, '.contextforge', 'config.json'));

    return paths;
}

// ─── Loader ──────────────────────────────────────────────────────────

/** Deep merge two objects (source into target) */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key of Object.keys(source) as Array<keyof T>) {
        const val = source[key];
        if (val !== undefined && val !== null) {
            if (typeof val === 'object' && !Array.isArray(val) && typeof result[key] === 'object') {
                result[key] = deepMerge(result[key] as any, val as any);
            } else {
                result[key] = val as any;
            }
        }
    }
    return result;
}

/** Load a single JSON config file, returns null if not found or invalid */
function loadConfigFile(path: string): Partial<ContextForgeConfig> | null {
    if (!existsSync(path)) return null;
    try {
        const raw = readFileSync(path, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Load the full merged config for a project.
 *
 * Resolution: defaults → global file → project file → env vars
 */
export function loadConfig(projectDir: string = '.'): ContextForgeConfig {
    const absDir = resolve(projectDir);
    let config: ContextForgeConfig = structuredClone(DEFAULT_CONFIG);

    // Layer config files (global → project)
    for (const path of getConfigPaths(absDir)) {
        const fileConfig = loadConfigFile(path);
        if (fileConfig) {
            config = deepMerge(config, fileConfig);
        }
    }

    // Layer environment variables (highest priority for AI config)
    if (process.env.CONTEXTFORGE_API_KEY) {
        config.ai.apiKey = process.env.CONTEXTFORGE_API_KEY;
    }
    if (process.env.CONTEXTFORGE_BASE_URL) {
        config.ai.baseURL = process.env.CONTEXTFORGE_BASE_URL;
        config.ai.provider = 'custom';
    }
    if (process.env.CONTEXTFORGE_MODEL) {
        config.ai.model = process.env.CONTEXTFORGE_MODEL;
    }
    if (process.env.CONTEXTFORGE_PROVIDER) {
        config.ai.provider = process.env.CONTEXTFORGE_PROVIDER;
    }

    return config;
}

/**
 * Resolve the final AI connection config from the merged config.
 *
 * Priority: env vars > config file > legacy env vars > null
 */
export function resolveAIConfig(config: ContextForgeConfig): ResolvedAIConfig | null {
    const ai = config.ai;

    // If we have an explicit API key (from config or env), use it
    if (ai.apiKey) {
        // Resolve provider preset for baseURL/model defaults
        const preset = PROVIDER_PRESETS[ai.provider];
        return {
            apiKey: ai.apiKey,
            baseURL: ai.baseURL || preset?.baseURL || undefined,
            model: ai.model || preset?.model || 'gpt-4o-mini',
        };
    }

    // Fallback: check legacy env vars
    for (const [envKey, providerName] of Object.entries(LEGACY_ENV_MAP)) {
        const key = process.env[envKey];
        if (key) {
            const preset = PROVIDER_PRESETS[providerName]!;
            return {
                apiKey: key,
                baseURL: ai.baseURL || preset.baseURL,
                model: ai.model || preset.model,
            };
        }
    }

    return null;
}

/**
 * Find which config file is currently active for a project.
 * Returns the path and parsed content, or null.
 */
export function findActiveConfigFile(projectDir: string = '.'): { path: string; config: Partial<ContextForgeConfig> } | null {
    const absDir = resolve(projectDir);
    // Check in reverse priority order, return the highest priority one found
    const paths = getConfigPaths(absDir).reverse();
    for (const path of paths) {
        const config = loadConfigFile(path);
        if (config) return { path, config };
    }
    return null;
}

/**
 * Generate a config file template.
 */
export function generateConfigTemplate(provider: string = 'deepseek'): ContextForgeConfig {
    const preset = PROVIDER_PRESETS[provider];
    return {
        ai: {
            provider,
            // apiKey is intentionally omitted — use env var for security
            ...(preset ? { baseURL: preset.baseURL, model: preset.model } : {}),
        },
        scan: {
            ignore: [],
            languages: [],
            maxFiles: 10000,
        },
        export: {
            defaultFormat: 'cursor',
        },
    };
}
