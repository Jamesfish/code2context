/**
 * Project Scanner — Traverses project directory and collects file information.
 * Respects .gitignore and common ignore patterns.
 */

import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';
import ignore from 'ignore';
import { basename, extname, join } from 'path';
import type { DirectoryInfo, KeyFileInfo, LanguageInfo, ProjectMeta, ProjectStructure } from '../types.js';

/** Default patterns to always ignore */
const DEFAULT_IGNORE = [
    'node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt',
    '__pycache__', '.pytest_cache', 'venv', '.venv', 'env',
    '.DS_Store', 'Thumbs.db', '*.lock', 'package-lock.json',
    'yarn.lock', 'pnpm-lock.yaml', '.env', '.env.*',
    'coverage', '.nyc_output', '.cache', '.turbo',
    '*.min.js', '*.min.css', '*.map', '*.chunk.*',
    '.code2context',
];

/** Language detection by file extension */
const LANG_MAP: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
    '.py': 'Python', '.pyw': 'Python',
    '.rs': 'Rust',
    '.go': 'Go',
    '.java': 'Java',
    '.kt': 'Kotlin', '.kts': 'Kotlin',
    '.swift': 'Swift',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.cs': 'C#',
    '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++', '.hpp': 'C++',
    '.c': 'C', '.h': 'C',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.dart': 'Dart',
    '.ex': 'Elixir', '.exs': 'Elixir',
    '.scala': 'Scala',
    '.zig': 'Zig',
};

/** Framework detection — separated into dependency-based and file-based checks */
const FRAMEWORK_DETECTORS: Array<{
    name: string;
    /** Package names to look for in dependencies (exact match) */
    deps?: string[];
    /** Config file basenames to look for (exact match on basename) */
    configFiles?: string[];
}> = [
        { name: 'Next.js', configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'] },
        { name: 'React', deps: ['react', 'react-dom'] },
        { name: 'Vue', deps: ['vue'], configFiles: ['nuxt.config.js', 'nuxt.config.ts'] },
        { name: 'Svelte', deps: ['svelte'], configFiles: ['svelte.config.js', 'svelte.config.ts'] },
        { name: 'Express', deps: ['express'] },
        { name: 'FastAPI', deps: ['fastapi'] },
        { name: 'Django', deps: ['django'], configFiles: ['manage.py'] },
        { name: 'Flask', deps: ['flask'] },
        { name: 'NestJS', deps: ['@nestjs/core'] },
        { name: 'Tailwind CSS', deps: ['tailwindcss'], configFiles: ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'] },
        { name: 'Prisma', deps: ['prisma', '@prisma/client'], configFiles: ['schema.prisma'] },
    ];

/** Key file roles */
const KEY_FILE_ROLES: Record<string, string> = {
    'package.json': 'Node.js project manifest',
    'tsconfig.json': 'TypeScript configuration',
    'pyproject.toml': 'Python project configuration',
    'Cargo.toml': 'Rust project manifest',
    'go.mod': 'Go module definition',
    'pom.xml': 'Maven project configuration',
    'build.gradle': 'Gradle build configuration',
    'Makefile': 'Build automation',
    'Dockerfile': 'Container definition',
    'docker-compose.yml': 'Multi-container orchestration',
    'docker-compose.yaml': 'Multi-container orchestration',
    '.env.example': 'Environment variable template',
    'README.md': 'Project documentation',
    'CONTRIBUTING.md': 'Contribution guidelines',
    '.cursorrules': 'Cursor AI rules',
    'CLAUDE.md': 'Claude AI context',
};

export class ProjectScanner {
    private projectDir: string;
    private ig: ReturnType<typeof ignore>;

    constructor(projectDir: string) {
        this.projectDir = projectDir;
        this.ig = ignore();

        // Load .gitignore
        const gitignorePath = join(projectDir, '.gitignore');
        if (existsSync(gitignorePath)) {
            const content = readFileSync(gitignorePath, 'utf-8');
            this.ig.add(content);
        }

        // Add default ignores
        this.ig.add(DEFAULT_IGNORE);
    }

    /** Scan all files in the project */
    async scanFiles(): Promise<string[]> {
        const allFiles = await glob('**/*', {
            cwd: this.projectDir,
            nodir: true,
            dot: true,
        });

        return allFiles.filter(f => !this.ig.ignores(f));
    }

    /** Detect project metadata */
    async detectMeta(files: string[]): Promise<ProjectMeta> {
        const languages = this.detectLanguages(files);
        const frameworks = this.detectFrameworks(files);
        const packageManager = this.detectPackageManager();
        const entryPoints = this.detectEntryPoints(files);

        // Try to get name/description from package.json or similar
        let name = basename(this.projectDir);
        let description: string | undefined;
        let version: string | undefined;

        const pkgPath = join(this.projectDir, 'package.json');
        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                name = pkg.name || name;
                description = pkg.description;
                version = pkg.version;
            } catch { /* ignore parse errors */ }
        }

        return { name, description, version, languages, frameworks, packageManager, entryPoints };
    }

    /** Detect programming languages used */
    private detectLanguages(files: string[]): LanguageInfo[] {
        const langCount: Record<string, number> = {};

        for (const file of files) {
            const ext = extname(file).toLowerCase();
            const lang = LANG_MAP[ext];
            if (lang) {
                langCount[lang] = (langCount[lang] || 0) + 1;
            }
        }

        const total = Object.values(langCount).reduce((a, b) => a + b, 0) || 1;

        return Object.entries(langCount)
            .map(([name, fileCount]) => ({
                name,
                fileCount,
                percentage: Math.round((fileCount / total) * 100),
            }))
            .sort((a, b) => b.fileCount - a.fileCount);
    }

    /** Detect frameworks used */
    private detectFrameworks(files: string[]): string[] {
        const detected: string[] = [];

        // Check package.json dependencies
        const pkgPath = join(this.projectDir, 'package.json');
        let deps: string[] = [];
        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                deps = [
                    ...Object.keys(pkg.dependencies || {}),
                    ...Object.keys(pkg.devDependencies || {}),
                ];
            } catch { /* ignore */ }
        }

        // Also check pyproject.toml for Python dependencies
        const pyprojectPath = join(this.projectDir, 'pyproject.toml');
        if (existsSync(pyprojectPath)) {
            try {
                const content = readFileSync(pyprojectPath, 'utf-8');
                // Extract dependency names from pyproject.toml (rough match)
                const depMatches = content.match(/["']([a-zA-Z][a-zA-Z0-9_-]*)/g);
                if (depMatches) {
                    deps.push(...depMatches.map(d => d.replace(/^["']/, '').toLowerCase()));
                }
            } catch { /* ignore */ }
        }

        // Get file basenames for config file matching
        const fileBasenames = new Set(files.map(f => {
            const parts = f.split('/');
            return parts[parts.length - 1];
        }));

        for (const detector of FRAMEWORK_DETECTORS) {
            const depMatch = detector.deps?.some(d => deps.includes(d)) ?? false;
            const fileMatch = detector.configFiles?.some(cf => fileBasenames.has(cf)) ?? false;
            if (depMatch || fileMatch) detected.push(detector.name);
        }

        return detected;
    }

    /** Detect package manager */
    private detectPackageManager(): string | undefined {
        if (existsSync(join(this.projectDir, 'pnpm-lock.yaml'))) return 'pnpm';
        if (existsSync(join(this.projectDir, 'yarn.lock'))) return 'yarn';
        if (existsSync(join(this.projectDir, 'bun.lockb'))) return 'bun';
        if (existsSync(join(this.projectDir, 'package-lock.json'))) return 'npm';
        if (existsSync(join(this.projectDir, 'Cargo.toml'))) return 'cargo';
        if (existsSync(join(this.projectDir, 'go.mod'))) return 'go modules';
        if (existsSync(join(this.projectDir, 'pyproject.toml'))) return 'pip/poetry';
        if (existsSync(join(this.projectDir, 'requirements.txt'))) return 'pip';
        return undefined;
    }

    /** Detect entry points */
    private detectEntryPoints(files: string[]): string[] {
        const entryPatterns = [
            // Node.js / TypeScript
            'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js',
            'src/app.ts', 'src/app.js', 'src/cli.ts', 'src/cli.js',
            'index.ts', 'index.js', 'main.ts', 'main.js',
            // Next.js App Router
            'src/app/layout.tsx', 'src/app/layout.ts',
            'src/app/page.tsx', 'src/app/page.ts',
            'app/layout.tsx', 'app/layout.ts',
            'app/page.tsx', 'app/page.ts',
            // Next.js Pages Router
            'src/pages/_app.tsx', 'src/pages/_app.ts',
            'pages/_app.tsx', 'pages/_app.ts',
            // Python
            'app.py', 'main.py', '__main__.py',
            // Rust / Go
            'src/main.rs', 'main.go', 'cmd/main.go',
        ];

        return files.filter(f => entryPatterns.includes(f));
    }

    /** Analyze project structure */
    async analyzeStructure(files: string[]): Promise<ProjectStructure> {
        const directories = this.analyzeDirectories(files);
        const keyFiles = this.detectKeyFiles(files);
        const totalFiles = files.length;

        // Count total lines (sample-based for large projects)
        let totalLines = 0;
        const filesToCount = files.length > 200 ? files.slice(0, 200) : files;
        for (const file of filesToCount) {
            try {
                const content = readFileSync(join(this.projectDir, file), 'utf-8');
                totalLines += content.split('\n').length;
            } catch { /* skip binary files */ }
        }
        if (files.length > 200) {
            totalLines = Math.round(totalLines * (files.length / 200));
        }

        return {
            directories,
            keyFiles,
            modules: [], // Populated by parser module
            totalFiles,
            totalLines,
        };
    }

    /** Analyze directory structure (up to 2 levels deep) */
    private analyzeDirectories(files: string[]): DirectoryInfo[] {
        const dirMap: Record<string, number> = {};

        for (const file of files) {
            const parts = file.split('/');
            if (parts.length > 1) {
                // Level 1: top-level directory
                const topDir = parts[0];
                dirMap[topDir] = (dirMap[topDir] || 0) + 1;

                // Level 2: second-level directory (e.g., src/app, src/lib)
                if (parts.length > 2) {
                    const subDir = `${parts[0]}/${parts[1]}`;
                    dirMap[subDir] = (dirMap[subDir] || 0) + 1;
                }
            }
        }

        // Common directory purpose mapping
        const purposeMap: Record<string, string> = {
            'src': 'Source code',
            'lib': 'Library code',
            'app': 'Application code (Next.js/Rails)',
            'pages': 'Page components/routes',
            'components': 'UI components',
            'utils': 'Utility functions',
            'helpers': 'Helper functions',
            'hooks': 'React hooks',
            'services': 'Service layer / API clients',
            'api': 'API routes/endpoints',
            'models': 'Data models',
            'types': 'Type definitions',
            'config': 'Configuration files',
            'public': 'Static assets',
            'assets': 'Static assets',
            'styles': 'Stylesheets',
            'tests': 'Test files',
            'test': 'Test files',
            '__tests__': 'Test files',
            'docs': 'Documentation',
            'scripts': 'Build/utility scripts',
            'migrations': 'Database migrations',
            'prisma': 'Prisma schema and migrations',
        };

        /** Resolve purpose for a directory path (checks last segment) */
        const resolvePurpose = (dirPath: string): string => {
            const lastSegment = dirPath.split('/').pop() || dirPath;
            return purposeMap[lastSegment] || 'Project files';
        };

        return Object.entries(dirMap)
            .map(([path, fileCount]) => ({
                path,
                purpose: resolvePurpose(path),
                fileCount,
            }))
            .sort((a, b) => b.fileCount - a.fileCount)
            .slice(0, 30); // Cap at 30 directories for large projects
    }

    /** Detect key files */
    private detectKeyFiles(files: string[]): KeyFileInfo[] {
        const keyFiles: KeyFileInfo[] = [];

        for (const file of files) {
            const name = basename(file);
            const role = KEY_FILE_ROLES[name];
            if (role) {
                keyFiles.push({ path: file, role });
            }
        }

        return keyFiles;
    }
}
