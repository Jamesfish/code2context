/**
 * `code2context init` command — Scan project and generate structured context.
 */

import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import ora from 'ora';
import { join, resolve } from 'path';
import { AIAnalyzer } from '../ai/index.js';
import { ConventionDetector } from '../conventions/index.js';
import { GitAnalyzer } from '../git/index.js';
import { ModuleParser } from '../parser/index.js';
import { ProjectScanner } from '../scanner/index.js';
import type { InitOptions, ProjectContext } from '../types.js';

export async function initCommand(options: InitOptions): Promise<void> {
    const projectDir = resolve(options.dir);
    const startTime = Date.now();

    console.log(chalk.bold('\n🔮 Code2Context — Initializing project context\n'));
    console.log(chalk.dim(`  Project: ${projectDir}`));
    console.log(chalk.dim(`  AI analysis: ${options.ai ? 'enabled' : 'disabled'}\n`));

    // Step 1: Scan files
    const scanSpinner = ora('Scanning project files...').start();
    const scanner = new ProjectScanner(projectDir);
    const files = await scanner.scanFiles();
    scanSpinner.succeed(`Found ${chalk.bold(files.length)} files`);

    // Step 2: Detect metadata
    const metaSpinner = ora('Detecting project metadata...').start();
    const meta = await scanner.detectMeta(files);
    metaSpinner.succeed(
        `${chalk.bold(meta.name)} — ${meta.languages.map(l => l.name).join(', ')}` +
        (meta.frameworks.length > 0 ? ` + ${meta.frameworks.join(', ')}` : '')
    );

    // Step 3: Analyze structure
    const structSpinner = ora('Analyzing project structure...').start();
    const structure = await scanner.analyzeStructure(files);
    structSpinner.succeed(`${structure.directories.length} directories, ~${structure.totalLines} lines`);

    // Step 3.5: Parse module imports/exports
    const parseSpinner = ora('Parsing module structure...').start();
    const parser = new ModuleParser(projectDir);
    const allModules = await parser.parseModules(files, meta.entryPoints);
    const depSummary = parser.buildDependencySummary(allModules);
    // Trim modules for large projects to keep context.json reasonable
    structure.modules = parser.trimModules(allModules, 50);
    parseSpinner.succeed(
        `${allModules.length} modules parsed` +
        (allModules.length > structure.modules.length ? ` (top ${structure.modules.length} kept)` : '') +
        `, ${depSummary.internalDeps} internal + ${depSummary.externalDeps} external deps`
    );

    // Step 4: Detect conventions
    const convSpinner = ora('Detecting coding conventions...').start();
    const conventionDetector = new ConventionDetector(projectDir);
    const conventions = await conventionDetector.detect(files);
    convSpinner.succeed(
        `Naming: ${conventions.naming.files}, ` +
        `${conventions.scripts.length} scripts, ` +
        `${conventions.envVars.length} env vars`
    );

    // Step 5: Analyze git history
    const gitSpinner = ora('Analyzing git history...').start();
    const gitAnalyzer = new GitAnalyzer(projectDir);
    const gitInsights = await gitAnalyzer.analyze();
    gitSpinner.succeed(
        gitInsights.recentDirection !== 'Not a git repository'
            ? `${gitInsights.recentCommits.length} commits analyzed, ${gitInsights.hotFiles.length} hot files`
            : 'Not a git repository (skipped)'
    );

    // Step 6: AI-enhanced analysis (optional)
    let aiSummary;
    if (options.ai) {
        const aiAnalyzer = new AIAnalyzer(projectDir);
        if (aiAnalyzer.isAvailable()) {
            const aiSpinner = ora(`Running AI-enhanced analysis (${aiAnalyzer.getProviderInfo()})...`).start();
            aiSummary = await aiAnalyzer.analyze({ meta, structure, conventions, gitInsights });
            if (aiSummary) {
                aiSpinner.succeed(`AI analysis complete (${aiAnalyzer.getProviderInfo()})`);
            } else {
                aiSpinner.warn('AI analysis failed (continuing without it)');
            }
        } else {
            console.log(chalk.yellow('  ⚠ AI analysis skipped (set CODE2CONTEXT_API_KEY to enable)'));
            console.log(chalk.dim('    Supports: OpenAI, DeepSeek, OpenRouter, Ollama, or any OpenAI-compatible API'));
            console.log(chalk.dim('    See: https://github.com/Jamesfish/code2context#ai-enhanced-analysis'));
        }
    }

    // Build full context
    const duration = Date.now() - startTime;
    const context: ProjectContext = {
        meta,
        structure,
        conventions,
        gitInsights,
        aiSummary,
        generated: {
            tool: 'code2context',
            version: '0.1.0',
            timestamp: new Date().toISOString(),
            scanDuration: duration,
            contextSize: 0, // Will be updated after serialization
        },
    };

    // Save context
    const contextDir = join(projectDir, '.code2context');
    if (!existsSync(contextDir)) {
        mkdirSync(contextDir, { recursive: true });
    }

    const contextJson = JSON.stringify(context, null, 2);
    context.generated.contextSize = contextJson.length;

    writeFileSync(join(contextDir, 'context.json'), contextJson, 'utf-8');

    // Also generate a human-readable markdown version
    const contextMd = generateContextMarkdown(context);
    writeFileSync(join(contextDir, 'context.md'), contextMd, 'utf-8');

    // Save last scan metadata for incremental updates
    const scanMeta = {
        lastScanTime: new Date().toISOString(),
        lastCommitHash: await gitAnalyzer.getLastCommitHash(),
        fileCount: files.length,
    };
    writeFileSync(join(contextDir, '.scan-meta.json'), JSON.stringify(scanMeta, null, 2), 'utf-8');

    // Summary
    console.log(chalk.bold('\n✅ Context generated successfully!\n'));
    console.log(`  📁 ${chalk.cyan('.code2context/context.json')} — Structured context (${(contextJson.length / 1024).toFixed(1)}KB)`);
    console.log(`  📄 ${chalk.cyan('.code2context/context.md')} — Human-readable context`);
    console.log(`  ⏱️  Completed in ${(duration / 1000).toFixed(1)}s`);
    console.log('');
    console.log(chalk.dim('  Next steps:'));
    console.log(chalk.dim('    code2context export --format cursor   → Generate .cursorrules'));
    console.log(chalk.dim('    code2context export --format claude   → Generate CLAUDE.md'));
    console.log(chalk.dim('    code2context update                   → Update after code changes'));
    console.log('');
}

/** Generate human-readable markdown from context */
function generateContextMarkdown(ctx: ProjectContext): string {
    const lines: string[] = [];

    lines.push(`# ${ctx.meta.name} — Project Context`);
    lines.push('');
    lines.push(`> Generated by Code2Context on ${ctx.generated.timestamp}`);
    lines.push('');

    if (ctx.aiSummary) {
        lines.push('## Overview');
        lines.push(ctx.aiSummary.overview);
        lines.push('');
    }

    lines.push('## Tech Stack');
    lines.push(`- **Languages**: ${ctx.meta.languages.map(l => `${l.name} (${l.percentage}%)`).join(', ')}`);
    lines.push(`- **Frameworks**: ${ctx.meta.frameworks.join(', ') || 'None detected'}`);
    lines.push(`- **Package Manager**: ${ctx.meta.packageManager || 'Unknown'}`);
    lines.push(`- **Size**: ${ctx.structure.totalFiles} files, ~${ctx.structure.totalLines} lines`);
    lines.push('');

    lines.push('## Structure');
    for (const dir of ctx.structure.directories) {
        lines.push(`- \`${dir.path}/\` — ${dir.purpose} (${dir.fileCount} files)`);
    }
    lines.push('');

    if (ctx.aiSummary?.architectureDecisions.length) {
        lines.push('## Architecture Decisions');
        for (const d of ctx.aiSummary.architectureDecisions) {
            lines.push(`- ${d}`);
        }
        lines.push('');
    }

    if (ctx.structure.modules.length > 0) {
        lines.push('## Module Structure');
        const entryModules = ctx.structure.modules.filter(m => m.isEntryPoint);
        if (entryModules.length > 0) {
            lines.push('**Entry points**:');
            for (const m of entryModules) {
                lines.push(`- \`${m.path}\` → exports: ${m.exports.join(', ') || '(none)'}`);
            }
        }
        const topExporters = ctx.structure.modules
            .filter(m => m.exports.length > 2)
            .sort((a, b) => b.exports.length - a.exports.length)
            .slice(0, 10);
        if (topExporters.length > 0) {
            lines.push('**Key modules** (most exports):');
            for (const m of topExporters) {
                lines.push(`- \`${m.path}\` → ${m.exports.slice(0, 5).join(', ')}${m.exports.length > 5 ? ` (+${m.exports.length - 5} more)` : ''}`);
            }
        }
        lines.push('');
    }

    lines.push('## Conventions');
    lines.push(`- File naming: \`${ctx.conventions.naming.files}\``);
    lines.push(`- Component naming: \`${ctx.conventions.naming.components}\``);
    for (const note of ctx.conventions.styleNotes) {
        lines.push(`- ${note}`);
    }
    lines.push('');

    if (ctx.conventions.scripts.length > 0) {
        lines.push('## Scripts');
        for (const s of ctx.conventions.scripts) {
            lines.push(`- \`${s.name}\`: ${s.description}`);
        }
        lines.push('');
    }

    if (ctx.gitInsights.recentDirection !== 'Not a git repository') {
        lines.push('## Development Activity');
        lines.push(`- **Direction**: ${ctx.gitInsights.recentDirection}`);
        lines.push(`- **Contributors**: ${ctx.gitInsights.contributors.join(', ')}`);
        if (ctx.gitInsights.hotFiles.length > 0) {
            lines.push('- **Hot files**:');
            for (const hf of ctx.gitInsights.hotFiles.slice(0, 5)) {
                lines.push(`  - \`${hf.path}\` (${hf.changeCount} changes)`);
            }
        }
        lines.push('');
    }

    if (ctx.aiSummary?.aiGotchas.length) {
        lines.push('## ⚠️ AI Gotchas');
        for (const g of ctx.aiSummary.aiGotchas) {
            lines.push(`- ${g}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}
