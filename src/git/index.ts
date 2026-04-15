/**
 * Git Analyzer — Extracts insights from git history.
 */

import simpleGit, { type LogResult, type SimpleGit } from 'simple-git';
import type { CommitSummary, GitInsights, HotFileInfo } from '../types.js';

export class GitAnalyzer {
    private git: SimpleGit;
    private projectDir: string;

    constructor(projectDir: string) {
        this.projectDir = projectDir;
        this.git = simpleGit(projectDir);
    }

    /** Check if directory is a git repository */
    async isGitRepo(): Promise<boolean> {
        try {
            await this.git.status();
            return true;
        } catch {
            return false;
        }
    }

    /** Analyze git history and extract insights */
    async analyze(): Promise<GitInsights> {
        if (!(await this.isGitRepo())) {
            return {
                recentDirection: 'Not a git repository',
                hotFiles: [],
                recentCommits: [],
                contributors: [],
            };
        }

        const [recentCommits, hotFiles, contributors] = await Promise.all([
            this.getRecentCommits(20),
            this.getHotFiles(10),
            this.getContributors(),
        ]);

        const recentDirection = this.inferDirection(recentCommits);

        return {
            recentDirection,
            hotFiles,
            recentCommits,
            contributors,
            lastCommitDate: recentCommits[0]?.date,
        };
    }

    /** Get recent commits */
    private async getRecentCommits(count: number): Promise<CommitSummary[]> {
        try {
            const log: LogResult = await this.git.log({ maxCount: count });
            return log.all.map(entry => ({
                hash: entry.hash.substring(0, 8),
                message: entry.message.split('\n')[0], // First line only
                date: entry.date,
                author: entry.author_name,
            }));
        } catch {
            return [];
        }
    }

    /** Get most frequently modified files */
    private async getHotFiles(count: number): Promise<HotFileInfo[]> {
        try {
            // Get file change frequency from recent 100 commits
            const log = await this.git.log({ maxCount: 100, '--stat': null } as any);
            const fileChanges: Record<string, { count: number; lastDate: string }> = {};

            for (const entry of log.all) {
                const diff = entry.diff;
                if (diff?.files) {
                    for (const file of diff.files) {
                        const path = file.file;
                        if (!fileChanges[path]) {
                            fileChanges[path] = { count: 0, lastDate: entry.date };
                        }
                        fileChanges[path].count++;
                    }
                }
            }

            return Object.entries(fileChanges)
                .map(([path, info]) => ({
                    path,
                    changeCount: info.count,
                    lastChanged: info.lastDate,
                }))
                .sort((a, b) => b.changeCount - a.changeCount)
                .slice(0, count);
        } catch {
            return [];
        }
    }

    /** Get active contributors */
    private async getContributors(): Promise<string[]> {
        try {
            const log = await this.git.log({ maxCount: 50 });
            const authors = new Set(log.all.map(e => e.author_name));
            return Array.from(authors);
        } catch {
            return [];
        }
    }

    /** Infer development direction from recent commits */
    private inferDirection(commits: CommitSummary[]): string {
        if (commits.length === 0) return 'No commit history';

        // Categorize commits by keywords
        const categories: Record<string, number> = {
            'feature/new': 0,
            'bugfix': 0,
            'refactor': 0,
            'docs': 0,
            'test': 0,
            'config/ci': 0,
        };

        const patterns: Array<{ category: string; keywords: string[] }> = [
            { category: 'feature/new', keywords: ['feat', 'add', 'new', 'implement', 'create'] },
            { category: 'bugfix', keywords: ['fix', 'bug', 'patch', 'hotfix', 'resolve'] },
            { category: 'refactor', keywords: ['refactor', 'clean', 'improve', 'optimize', 'update'] },
            { category: 'docs', keywords: ['doc', 'readme', 'comment', 'changelog'] },
            { category: 'test', keywords: ['test', 'spec', 'coverage'] },
            { category: 'config/ci', keywords: ['config', 'ci', 'cd', 'build', 'deploy', 'docker'] },
        ];

        for (const commit of commits) {
            const msg = commit.message.toLowerCase();
            for (const pattern of patterns) {
                if (pattern.keywords.some(kw => msg.includes(kw))) {
                    categories[pattern.category]++;
                    break;
                }
            }
        }

        // Build direction summary
        const sorted = Object.entries(categories)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) return 'Active development (commit patterns unclear)';

        const primary = sorted[0];
        const parts = [`Primarily ${primary[0]} (${primary[1]}/${commits.length} commits)`];
        if (sorted.length > 1) {
            parts.push(`also ${sorted[1][0]} (${sorted[1][1]})`);
        }

        return parts.join(', ');
    }

    /** Get diff since a specific ref */
    async getDiffSince(ref: string): Promise<string[]> {
        try {
            const diff = await this.git.diff(['--name-only', ref]);
            return diff.split('\n').filter(Boolean);
        } catch {
            return [];
        }
    }

    /** Get the hash of the last commit */
    async getLastCommitHash(): Promise<string | undefined> {
        try {
            const log = await this.git.log({ maxCount: 1 });
            return log.latest?.hash;
        } catch {
            return undefined;
        }
    }
}
