#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { configInitCommand, configSetCommand, configShowCommand } from './commands/config.js';
import { exportCommand } from './commands/export.js';
import { initCommand } from './commands/init.js';
import { statsCommand } from './commands/stats.js';
import { updateCommand } from './commands/update.js';

const program = new Command();

program
    .name('code2context')
    .description(
        chalk.bold('🔮 Code2Context') +
        ' — AI-powered codebase context management.\n' +
        'Smart extraction, persistence, and cross-tool sync for AI coding assistants.'
    )
    .version('0.1.0');

program
    .command('init')
    .description('Scan project and generate structured context')
    .option('-d, --dir <path>', 'Project directory to scan', '.')
    .option('--no-ai', 'Skip AI-enhanced analysis')
    .option('--lang <languages>', 'Comma-separated list of languages to focus on')
    .option('-v, --verbose', 'Show detailed output')
    .action(initCommand);

program
    .command('update')
    .description('Incrementally update context based on git changes')
    .option('-d, --dir <path>', 'Project directory', '.')
    .option('--since <ref>', 'Git ref to diff from (default: last update)')
    .option('-v, --verbose', 'Show detailed output')
    .action(updateCommand);

program
    .command('export')
    .description('Export context to various AI tool formats')
    .option('-f, --format <format>', 'Output format: cursor | claude | text | json', 'cursor')
    .option('-d, --dir <path>', 'Project directory', '.')
    .option('-o, --output <path>', 'Output file path (default: auto)')
    .action(exportCommand);

program
    .command('stats')
    .description('Show context statistics and health')
    .option('-d, --dir <path>', 'Project directory', '.')
    .action(statsCommand);

// Config command group
const configCmd = program
    .command('config')
    .description('Manage Code2Context configuration');

configCmd
    .command('init')
    .description('Generate a config file (.code2context/config.json)')
    .option('-d, --dir <path>', 'Project directory', '.')
    .option('-g, --global', 'Create global config (~/.config/code2context/config.json)')
    .action(configInitCommand);

configCmd
    .command('show')
    .description('Show current resolved configuration')
    .option('-d, --dir <path>', 'Project directory', '.')
    .action(configShowCommand);

configCmd
    .command('set <key> <value>')
    .description('Set a config value (e.g., ai.provider deepseek)')
    .option('-d, --dir <path>', 'Project directory', '.')
    .action(configSetCommand);
program.parse();
