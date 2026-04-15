/**
 * `contextforge stats` command — Show context statistics.
 */

import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import type { ProjectContext, StatsOptions } from '../types.js';

export async function statsCommand(options: StatsOptions): Promise<void> {
    const projectDir = resolve(options.dir);
    const contextPath = join(projectDir, '.contextforge', 'context.json');

    if (!existsSync(contextPath)) {
        console.error(chalk.red('\n❌ No context found. Run `contextforge init` first.\n'));
        process.exit(1);
    }

    const context: ProjectContext = JSON.parse(readFileSync(contextPath, 'utf-8'));

    console.log(chalk.bold(`\n📊 ContextForge Stats — ${context.meta.name}\n`));

    // Project info
    console.log(chalk.bold('  Project'));
    console.log(`    Name:            ${context.meta.name}`);
    if (context.meta.description) {
        console.log(`    Description:     ${context.meta.description}`);
    }
    if (context.meta.version) {
        console.log(`    Version:         ${context.meta.version}`);
    }
    console.log(`    Languages:       ${context.meta.languages.map(l => `${l.name}(${l.percentage}%)`).join(', ')}`);
    console.log(`    Frameworks:      ${context.meta.frameworks.join(', ') || 'none'}`);
    console.log(`    Package Manager: ${context.meta.packageManager || 'unknown'}`);
    console.log('');

    // Size
    console.log(chalk.bold('  Size'));
    console.log(`    Files:           ${context.structure.totalFiles}`);
    console.log(`    Lines:           ~${context.structure.totalLines}`);
    console.log(`    Directories:     ${context.structure.directories.length}`);
    console.log(`    Context size:    ${(context.generated.contextSize / 1024).toFixed(1)}KB`);
    console.log('');

    // Conventions
    console.log(chalk.bold('  Conventions'));
    console.log(`    File naming:     ${context.conventions.naming.files}`);
    console.log(`    Components:      ${context.conventions.naming.components}`);
    console.log(`    Scripts:         ${context.conventions.scripts.length}`);
    console.log(`    Env vars:        ${context.conventions.envVars.length}`);
    console.log(`    Style notes:     ${context.conventions.styleNotes.length}`);
    console.log('');

    // Git
    if (context.gitInsights.recentDirection !== 'Not a git repository') {
        console.log(chalk.bold('  Git'));
        console.log(`    Direction:       ${context.gitInsights.recentDirection}`);
        console.log(`    Contributors:    ${context.gitInsights.contributors.length}`);
        console.log(`    Hot files:       ${context.gitInsights.hotFiles.length}`);
        if (context.gitInsights.lastCommitDate) {
            console.log(`    Last commit:     ${context.gitInsights.lastCommitDate}`);
        }
        console.log('');
    }

    // AI
    console.log(chalk.bold('  AI Analysis'));
    console.log(`    Status:          ${context.aiSummary ? chalk.green('✅ Available') : chalk.yellow('⚠ Not generated')}`);
    if (context.aiSummary) {
        console.log(`    Decisions:       ${context.aiSummary.architectureDecisions.length}`);
        console.log(`    Guidelines:      ${context.aiSummary.codingGuidelines.length}`);
        console.log(`    Gotchas:         ${context.aiSummary.aiGotchas.length}`);
    }
    console.log('');

    // Generation info
    console.log(chalk.bold('  Generation'));
    console.log(`    Tool:            ${context.generated.tool} v${context.generated.version}`);
    console.log(`    Generated:       ${context.generated.timestamp}`);
    console.log(`    Scan duration:   ${(context.generated.scanDuration / 1000).toFixed(1)}s`);
    console.log('');
}
