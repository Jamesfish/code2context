/**
 * `code2context config` command — Manage configuration.
 *
 * Subcommands:
 *   code2context config init              → Generate .code2context/config.json interactively
 *   code2context config show              → Show current resolved config
 *   code2context config path              → Show config file locations
 *   code2context config set <key> <value> → Set a config value
 */

import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import {
    findActiveConfigFile,
    generateConfigTemplate,
    loadConfig,
    PROVIDER_PRESETS,
    resolveAIConfig,
    type Code2ContextConfig,
} from '../config.js';

export interface ConfigOptions {
    dir: string;
    global?: boolean;
}

/** `code2context config init` — Generate a config file */
export async function configInitCommand(options: ConfigOptions): Promise<void> {
    const projectDir = resolve(options.dir);

    console.log(chalk.bold('\n⚙️  Code2Context — Config Setup\n'));

    // Show available providers
    console.log(chalk.bold('  Available AI providers:\n'));
    for (const [key, preset] of Object.entries(PROVIDER_PRESETS)) {
        console.log(`    ${chalk.cyan(key.padEnd(12))} ${preset.name.padEnd(18)} ${chalk.dim(preset.baseURL)}`);
    }
    console.log(`    ${chalk.cyan('custom'.padEnd(12))} ${'Custom endpoint'.padEnd(18)} ${chalk.dim('You provide the base URL')}`);
    console.log('');

    // Generate template with deepseek as default (cheapest)
    const template = generateConfigTemplate('deepseek');

    // Determine output path
    let configPath: string;
    if (options.global) {
        const globalDir = join(process.env.HOME || process.env.USERPROFILE || '~', '.config', 'code2context');
        if (!existsSync(globalDir)) mkdirSync(globalDir, { recursive: true });
        configPath = join(globalDir, 'config.json');
    } else {
        const contextDir = join(projectDir, '.code2context');
        if (!existsSync(contextDir)) mkdirSync(contextDir, { recursive: true });
        configPath = join(contextDir, 'config.json');
    }

    // Check if file already exists
    if (existsSync(configPath)) {
        console.log(chalk.yellow(`  ⚠ Config file already exists: ${configPath}`));
        console.log(chalk.dim('    Use `code2context config show` to view current config'));
        console.log(chalk.dim('    Edit the file directly or use `code2context config set`\n'));
        return;
    }

    // Write config file
    const configContent = JSON.stringify(template, null, 2);
    writeFileSync(configPath, configContent, 'utf-8');

    console.log(chalk.bold('  ✅ Config file created:\n'));
    console.log(`    ${chalk.cyan(configPath)}\n`);
    console.log(chalk.dim('  Contents:'));
    for (const line of configContent.split('\n')) {
        console.log(chalk.dim(`    ${line}`));
    }
    console.log('');

    // Security reminder
    console.log(chalk.bold('  🔑 API Key setup:\n'));
    console.log('    Option A (recommended): Use environment variable');
    console.log(chalk.dim('      export CODE2CONTEXT_API_KEY=sk-xxx\n'));
    console.log('    Option B: Add to config file (⚠️ add to .gitignore!)');
    console.log(chalk.dim('      Edit the config file and add "apiKey": "sk-xxx" under "ai"\n'));

    if (!options.global) {
        // Check .gitignore
        const gitignorePath = join(projectDir, '.gitignore');
        if (existsSync(gitignorePath)) {
            const content = readFileSync(gitignorePath, 'utf-8');
            if (!content.includes('.code2context')) {
                console.log(chalk.yellow('  ⚠ Remember to add .code2context/ to your .gitignore'));
                console.log(chalk.dim('    (especially if you put API keys in the config file)\n'));
            }
        }
    }
}

/** `code2context config show` — Show resolved config */
export async function configShowCommand(options: ConfigOptions): Promise<void> {
    const projectDir = resolve(options.dir);
    const config = loadConfig(projectDir);
    const aiConfig = resolveAIConfig(config);
    const activeFile = findActiveConfigFile(projectDir);

    console.log(chalk.bold('\n⚙️  Code2Context — Current Configuration\n'));

    // Config source
    if (activeFile) {
        console.log(chalk.bold('  📁 Config file:'));
        console.log(`    ${chalk.cyan(activeFile.path)}\n`);
    } else {
        console.log(chalk.dim('  📁 No config file found (using defaults + env vars)\n'));
    }

    // AI config
    console.log(chalk.bold('  🤖 AI Configuration:'));
    console.log(`    Provider:  ${config.ai.provider}`);
    if (aiConfig) {
        console.log(`    Base URL:  ${aiConfig.baseURL || '(OpenAI default)'}`);
        console.log(`    Model:     ${aiConfig.model}`);
        console.log(`    API Key:   ${maskKey(aiConfig.apiKey)}`);
        console.log(chalk.green('    Status:    ✅ Ready'));
    } else {
        console.log(chalk.yellow('    Status:    ⚠ No API key configured'));
        console.log(chalk.dim('    Set CODE2CONTEXT_API_KEY or add apiKey to config file'));
    }
    console.log('');

    // Scan config
    console.log(chalk.bold('  🔍 Scan Configuration:'));
    console.log(`    Extra ignores:  ${config.scan.ignore.length > 0 ? config.scan.ignore.join(', ') : '(none)'}`);
    console.log(`    Languages:      ${config.scan.languages.length > 0 ? config.scan.languages.join(', ') : '(all)'}`);
    console.log(`    Max files:      ${config.scan.maxFiles}`);
    console.log('');

    // Export config
    console.log(chalk.bold('  📤 Export Configuration:'));
    console.log(`    Default format: ${config.export.defaultFormat}`);
    console.log('');

    // Config file locations
    console.log(chalk.bold('  📍 Config file search paths (in priority order):'));
    console.log(chalk.dim('    1. .code2context/config.json        (project, highest priority)'));
    console.log(chalk.dim('    2. code2context.config.json          (project root)'));
    console.log(chalk.dim('    3. ~/.config/code2context/config.json (global, lowest priority)'));
    console.log('');
}

/** `code2context config set` — Set a config value */
export async function configSetCommand(key: string, value: string, options: ConfigOptions): Promise<void> {
    const projectDir = resolve(options.dir);
    const contextDir = join(projectDir, '.code2context');
    const configPath = join(contextDir, 'config.json');

    // Load existing or create new
    let config: Partial<Code2ContextConfig> = {};
    if (existsSync(configPath)) {
        try {
            config = JSON.parse(readFileSync(configPath, 'utf-8'));
        } catch { /* start fresh */ }
    } else {
        if (!existsSync(contextDir)) mkdirSync(contextDir, { recursive: true });
    }

    // Parse dotted key path (e.g., "ai.provider" → config.ai.provider)
    const keys = key.split('.');
    let target: any = config;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
            target[keys[i]] = {};
        }
        target = target[keys[i]];
    }

    // Parse value (try JSON, fall back to string)
    let parsedValue: any;
    try {
        parsedValue = JSON.parse(value);
    } catch {
        parsedValue = value;
    }

    target[keys[keys.length - 1]] = parsedValue;

    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    console.log(chalk.bold(`\n✅ Set ${chalk.cyan(key)} = ${chalk.green(JSON.stringify(parsedValue))}`));
    console.log(chalk.dim(`   in ${configPath}\n`));
}

/** Mask an API key for display */
function maskKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}
