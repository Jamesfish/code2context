/**
 * `code2context update` command — Incrementally update context based on git changes.
 */

import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import ora from 'ora';
import { join, resolve } from 'path';
import { AIAnalyzer } from '../ai/index.js';
import { ConventionDetector } from '../conventions/index.js';
import { GitAnalyzer } from '../git/index.js';
import { ProjectScanner } from '../scanner/index.js';
import type { ProjectContext, UpdateOptions } from '../types.js';

export async function updateCommand(options: UpdateOptions): Promise<void> {
    const projectDir = resolve(options.dir);
    const contextDir = join(projectDir, '.code2context');
    const contextPath = join(contextDir, 'context.json');
    const scanMetaPath = join(contextDir, '.scan-meta.json');

    // Check if context exists
    if (!existsSync(contextPath)) {
        console.error(chalk.red('\n❌ No context found. Run `code2context init` first.\n'));
        process.exit(1);
    }

    console.log(chalk.bold('\n🔄 Code2Context — Updating project context\n'));

    const startTime = Date.now();

    // Load existing context
    const existingContext: ProjectContext = JSON.parse(readFileSync(contextPath, 'utf-8'));

    // Determine what changed
    const gitAnalyzer = new GitAnalyzer(projectDir);
    let changedFiles: string[] = [];

    if (options.since) {
        changedFiles = await gitAnalyzer.getDiffSince(options.since);
    } else if (existsSync(scanMetaPath)) {
        const scanMeta = JSON.parse(readFileSync(scanMetaPath, 'utf-8'));
        if (scanMeta.lastCommitHash) {
            changedFiles = await gitAnalyzer.getDiffSince(scanMeta.lastCommitHash);
        }
    }

    if (changedFiles.length === 0) {
        // Fall back to full rescan if no diff available
        const spinner = ora('No diff reference found, performing full rescan...').start();

        const scanner = new ProjectScanner(projectDir);
        const files = await scanner.scanFiles();
        const meta = await scanner.detectMeta(files);
        const structure = await scanner.analyzeStructure(files);
        const conventionDetector = new ConventionDetector(projectDir);
        const conventions = await conventionDetector.detect(files);
        const gitInsights = await gitAnalyzer.analyze();

        // Preserve AI summary if no significant changes
        const aiSummary = existingContext.aiSummary;

        const duration = Date.now() - startTime;
        const context: ProjectContext = {
            meta, structure, conventions, gitInsights, aiSummary,
            generated: {
                tool: 'code2context',
                version: '0.1.0',
                timestamp: new Date().toISOString(),
                scanDuration: duration,
                contextSize: 0,
            },
        };

        const contextJson = JSON.stringify(context, null, 2);
        context.generated.contextSize = contextJson.length;
        writeFileSync(contextPath, contextJson, 'utf-8');

        spinner.succeed(`Full rescan complete (${files.length} files, ${(duration / 1000).toFixed(1)}s)`);
    } else {
        const spinner = ora(`Updating context for ${changedFiles.length} changed files...`).start();

        // Incremental update: rescan only changed areas
        const scanner = new ProjectScanner(projectDir);
        const allFiles = await scanner.scanFiles();
        const meta = await scanner.detectMeta(allFiles);
        const structure = await scanner.analyzeStructure(allFiles);
        const conventionDetector = new ConventionDetector(projectDir);
        const conventions = await conventionDetector.detect(allFiles);
        const gitInsights = await gitAnalyzer.analyze();

        // Re-run AI analysis only if significant changes
        let aiSummary = existingContext.aiSummary;
        const significantChange = changedFiles.length > 10 ||
            changedFiles.some(f => f.includes('package.json') || f.includes('tsconfig'));

        if (significantChange) {
            const aiAnalyzer = new AIAnalyzer(projectDir);
            if (aiAnalyzer.isAvailable()) {
                aiSummary = await aiAnalyzer.analyze({ meta, structure, conventions, gitInsights }) || aiSummary;
            }
        }

        const duration = Date.now() - startTime;
        const context: ProjectContext = {
            meta, structure, conventions, gitInsights, aiSummary,
            generated: {
                tool: 'code2context',
                version: '0.1.0',
                timestamp: new Date().toISOString(),
                scanDuration: duration,
                contextSize: 0,
            },
        };

        const contextJson = JSON.stringify(context, null, 2);
        context.generated.contextSize = contextJson.length;
        writeFileSync(contextPath, contextJson, 'utf-8');

        spinner.succeed(
            `Updated: ${changedFiles.length} files changed, ` +
            `${significantChange ? 'AI re-analyzed' : 'AI summary preserved'} ` +
            `(${(duration / 1000).toFixed(1)}s)`
        );
    }

    // Update scan metadata
    const scanMeta = {
        lastScanTime: new Date().toISOString(),
        lastCommitHash: await gitAnalyzer.getLastCommitHash(),
        fileCount: (await new ProjectScanner(projectDir).scanFiles()).length,
    };
    writeFileSync(scanMetaPath, JSON.stringify(scanMeta, null, 2), 'utf-8');

    console.log(chalk.bold('\n✅ Context updated!\n'));
    console.log(chalk.dim('  Run `code2context export` to regenerate AI tool files.'));
    console.log('');
}
