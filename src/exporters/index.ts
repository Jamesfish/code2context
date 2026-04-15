/**
 * Context Exporters — Convert ProjectContext to various AI tool formats.
 */

import type { ProjectContext } from '../types.js';

/** Export context as .cursorrules format */
export function exportCursor(ctx: ProjectContext): string {
    const lines: string[] = [];

    lines.push(`# Project: ${ctx.meta.name}`);
    if (ctx.meta.description) {
        lines.push(`# ${ctx.meta.description}`);
    }
    lines.push('');

    // AI Summary (if available)
    if (ctx.aiSummary) {
        lines.push('## Project Overview');
        lines.push(ctx.aiSummary.overview);
        lines.push('');

        if (ctx.aiSummary.architectureDecisions.length > 0) {
            lines.push('## Architecture Decisions');
            for (const decision of ctx.aiSummary.architectureDecisions) {
                lines.push(`- ${decision}`);
            }
            lines.push('');
        }

        if (ctx.aiSummary.codingGuidelines.length > 0) {
            lines.push('## Coding Guidelines');
            for (const guideline of ctx.aiSummary.codingGuidelines) {
                lines.push(`- ${guideline}`);
            }
            lines.push('');
        }

        if (ctx.aiSummary.aiGotchas.length > 0) {
            lines.push('## Important: AI Gotchas');
            for (const gotcha of ctx.aiSummary.aiGotchas) {
                lines.push(`- ⚠️ ${gotcha}`);
            }
            lines.push('');
        }
    }

    // Tech Stack
    lines.push('## Tech Stack');
    lines.push(`- Languages: ${ctx.meta.languages.map(l => `${l.name} (${l.percentage}%)`).join(', ')}`);
    if (ctx.meta.frameworks.length > 0) {
        lines.push(`- Frameworks: ${ctx.meta.frameworks.join(', ')}`);
    }
    if (ctx.meta.packageManager) {
        lines.push(`- Package Manager: ${ctx.meta.packageManager}`);
    }
    lines.push('');

    // Project Structure
    lines.push('## Project Structure');
    for (const dir of ctx.structure.directories.slice(0, 15)) {
        lines.push(`- \`${dir.path}/\` — ${dir.purpose} (${dir.fileCount} files)`);
    }
    lines.push('');

    // Key Files
    if (ctx.structure.keyFiles.length > 0) {
        lines.push('## Key Files');
        for (const kf of ctx.structure.keyFiles) {
            lines.push(`- \`${kf.path}\` — ${kf.role}`);
        }
        lines.push('');
    }

    // Module Structure
    if (ctx.structure.modules.length > 0) {
        lines.push('## Module Structure');
        const entryModules = ctx.structure.modules.filter(m => m.isEntryPoint);
        if (entryModules.length > 0) {
            lines.push('Entry points:');
            for (const m of entryModules) {
                lines.push(`- \`${m.path}\` → exports: ${m.exports.join(', ') || '(side-effect only)'}`);
            }
        }
        const topExporters = ctx.structure.modules
            .filter(m => m.exports.length > 2 && !m.isEntryPoint)
            .sort((a, b) => b.exports.length - a.exports.length)
            .slice(0, 10);
        if (topExporters.length > 0) {
            lines.push('Key modules (most exports):');
            for (const m of topExporters) {
                lines.push(`- \`${m.path}\` → ${m.exports.slice(0, 6).join(', ')}${m.exports.length > 6 ? ` (+${m.exports.length - 6} more)` : ''}`);
            }
        }
        // Most-used dependencies
        const depCounts: Record<string, number> = {};
        for (const mod of ctx.structure.modules) {
            for (const imp of mod.imports) {
                if (!imp.startsWith('.')) {
                    const pkg = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
                    depCounts[pkg] = (depCounts[pkg] || 0) + 1;
                }
            }
        }
        const topDeps = Object.entries(depCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        if (topDeps.length > 0) {
            lines.push('Most-used external dependencies:');
            for (const [pkg, count] of topDeps) {
                lines.push(`- \`${pkg}\` (imported by ${count} files)`);
            }
        }
        lines.push('');
    }

    // Coding Conventions
    lines.push('## Coding Conventions');
    lines.push(`- File naming: ${ctx.conventions.naming.files}`);
    lines.push(`- Component naming: ${ctx.conventions.naming.components}`);
    lines.push(`- Function naming: ${ctx.conventions.naming.functions}`);
    for (const pattern of ctx.conventions.fileOrganization) {
        lines.push(`- ${pattern}`);
    }
    for (const note of ctx.conventions.styleNotes) {
        lines.push(`- ${note}`);
    }
    lines.push('');

    // Environment Variables
    if (ctx.conventions.envVars.length > 0) {
        lines.push('## Environment Variables');
        for (const env of ctx.conventions.envVars) {
            const req = env.required ? '(required)' : '(optional)';
            lines.push(`- \`${env.name}\` ${req}${env.description ? ` — ${env.description}` : ''}`);
        }
        lines.push('');
    }

    // Available Scripts
    if (ctx.conventions.scripts.length > 0) {
        lines.push('## Available Scripts');
        for (const script of ctx.conventions.scripts) {
            lines.push(`- \`${ctx.meta.packageManager || 'npm'} run ${script.name}\` — ${script.description}`);
        }
        lines.push('');
    }

    // Development Context
    if (ctx.gitInsights.recentDirection !== 'Not a git repository') {
        lines.push('## Current Development Context');
        lines.push(`- Direction: ${ctx.gitInsights.recentDirection}`);
        if (ctx.gitInsights.hotFiles.length > 0) {
            lines.push('- Hot files (frequently modified):');
            for (const hf of ctx.gitInsights.hotFiles.slice(0, 5)) {
                lines.push(`  - \`${hf.path}\` (${hf.changeCount} changes)`);
            }
        }
        lines.push('');
    }

    // Footer
    lines.push(`# Generated by ContextForge v${ctx.generated.version} on ${ctx.generated.timestamp}`);
    lines.push(`# ${ctx.structure.totalFiles} files scanned, ${ctx.structure.totalLines} lines analyzed`);

    return lines.join('\n');
}

/** Export context as CLAUDE.md format */
export function exportClaude(ctx: ProjectContext): string {
    // Claude format is similar to cursor but with slightly different structure
    const lines: string[] = [];

    lines.push(`# ${ctx.meta.name}`);
    lines.push('');

    if (ctx.aiSummary) {
        lines.push(ctx.aiSummary.overview);
        lines.push('');
    } else if (ctx.meta.description) {
        lines.push(ctx.meta.description);
        lines.push('');
    }

    lines.push('## Tech Stack');
    lines.push('');
    lines.push(`| Component | Value |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Languages | ${ctx.meta.languages.map(l => l.name).join(', ')} |`);
    lines.push(`| Frameworks | ${ctx.meta.frameworks.join(', ') || 'N/A'} |`);
    lines.push(`| Package Manager | ${ctx.meta.packageManager || 'N/A'} |`);
    lines.push(`| Total Files | ${ctx.structure.totalFiles} |`);
    lines.push(`| Total Lines | ~${ctx.structure.totalLines} |`);
    lines.push('');

    lines.push('## Directory Structure');
    lines.push('');
    lines.push('```');
    for (const dir of ctx.structure.directories.slice(0, 15)) {
        lines.push(`${dir.path}/  # ${dir.purpose}`);
    }
    lines.push('```');
    lines.push('');

    if (ctx.aiSummary?.architectureDecisions.length) {
        lines.push('## Architecture');
        lines.push('');
        for (const d of ctx.aiSummary.architectureDecisions) {
            lines.push(`- ${d}`);
        }
        lines.push('');
    }

    if (ctx.aiSummary?.codingGuidelines.length) {
        lines.push('## Coding Guidelines');
        lines.push('');
        for (const g of ctx.aiSummary.codingGuidelines) {
            lines.push(`- ${g}`);
        }
        lines.push('');
    }

    lines.push('## Conventions');
    lines.push('');
    lines.push(`- File naming: \`${ctx.conventions.naming.files}\``);
    lines.push(`- Component naming: \`${ctx.conventions.naming.components}\``);
    for (const note of ctx.conventions.styleNotes) {
        lines.push(`- ${note}`);
    }
    lines.push('');

    if (ctx.conventions.scripts.length > 0) {
        lines.push('## Commands');
        lines.push('');
        lines.push('```bash');
        for (const s of ctx.conventions.scripts) {
            lines.push(`# ${s.description}`);
            lines.push(`${ctx.meta.packageManager || 'npm'} run ${s.name}`);
            lines.push('');
        }
        lines.push('```');
        lines.push('');
    }

    if (ctx.aiSummary?.aiGotchas.length) {
        lines.push('## ⚠️ Important Notes for AI');
        lines.push('');
        for (const g of ctx.aiSummary.aiGotchas) {
            lines.push(`> ${g}`);
            lines.push('');
        }
    }

    lines.push('---');
    lines.push(`*Generated by [ContextForge](https://github.com/Jamesfish/contextforge) v${ctx.generated.version}*`);

    return lines.join('\n');
}

/** Export context as plain text */
export function exportText(ctx: ProjectContext): string {
    const lines: string[] = [];

    lines.push(`=== ${ctx.meta.name} ===`);
    lines.push('');

    if (ctx.aiSummary) {
        lines.push(ctx.aiSummary.overview);
        lines.push('');
    }

    lines.push(`Languages: ${ctx.meta.languages.map(l => `${l.name}(${l.percentage}%)`).join(', ')}`);
    lines.push(`Frameworks: ${ctx.meta.frameworks.join(', ') || 'none'}`);
    lines.push(`Files: ${ctx.structure.totalFiles} | Lines: ~${ctx.structure.totalLines}`);
    lines.push('');

    lines.push('Structure:');
    for (const dir of ctx.structure.directories.slice(0, 10)) {
        lines.push(`  ${dir.path}/ - ${dir.purpose}`);
    }
    lines.push('');

    lines.push('Conventions:');
    lines.push(`  Naming: files=${ctx.conventions.naming.files}, components=${ctx.conventions.naming.components}`);
    for (const note of ctx.conventions.styleNotes) {
        lines.push(`  ${note}`);
    }
    lines.push('');

    if (ctx.aiSummary?.codingGuidelines.length) {
        lines.push('Guidelines:');
        for (const g of ctx.aiSummary.codingGuidelines) {
            lines.push(`  - ${g}`);
        }
        lines.push('');
    }

    if (ctx.aiSummary?.aiGotchas.length) {
        lines.push('AI Gotchas:');
        for (const g of ctx.aiSummary.aiGotchas) {
            lines.push(`  ! ${g}`);
        }
    }

    return lines.join('\n');
}

/** Export context as JSON */
export function exportJSON(ctx: ProjectContext): string {
    return JSON.stringify(ctx, null, 2);
}
