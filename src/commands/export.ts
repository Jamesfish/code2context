/**
 * `code2context export` command — Export context to various AI tool formats.
 */

import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { exportClaude, exportCursor, exportJSON, exportText } from '../exporters/index.js';
import type { ExportOptions, ProjectContext } from '../types.js';

const FORMAT_CONFIG: Record<string, { filename: string; exporter: (ctx: ProjectContext) => string }> = {
    cursor: { filename: '.cursorrules', exporter: exportCursor },
    claude: { filename: 'CLAUDE.md', exporter: exportClaude },
    text: { filename: 'CONTEXT.txt', exporter: exportText },
    json: { filename: 'context.json', exporter: exportJSON },
};

export async function exportCommand(options: ExportOptions): Promise<void> {
    const projectDir = resolve(options.dir);
    const contextPath = join(projectDir, '.code2context', 'context.json');

    // Check if context exists
    if (!existsSync(contextPath)) {
        console.error(chalk.red('\n❌ No context found. Run `code2context init` first.\n'));
        process.exit(1);
    }

    // Load context
    const context: ProjectContext = JSON.parse(readFileSync(contextPath, 'utf-8'));

    // Get format config
    const format = options.format.toLowerCase();
    const config = FORMAT_CONFIG[format];
    if (!config) {
        console.error(chalk.red(`\n❌ Unknown format: ${format}. Supported: cursor, claude, text, json\n`));
        process.exit(1);
    }

    // Generate output
    const output = config.exporter(context);

    // Determine output path
    const outputPath = options.output || join(projectDir, config.filename);

    // Write file
    writeFileSync(outputPath, output, 'utf-8');

    const sizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);

    console.log(chalk.bold(`\n✅ Exported to ${chalk.cyan(config.filename)} (${sizeKB}KB)\n`));
    console.log(chalk.dim(`  Format: ${format}`));
    console.log(chalk.dim(`  Path: ${outputPath}`));
    console.log(chalk.dim(`  Project: ${context.meta.name}`));
    console.log(chalk.dim(`  Context: ${context.structure.totalFiles} files, ~${context.structure.totalLines} lines`));
    console.log('');
}
