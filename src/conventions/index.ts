/**
 * Convention Detector — Identifies coding conventions from project files.
 */

import { existsSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';
import type { CodingConventions, EnvVarInfo, NamingConvention, ScriptInfo } from '../types.js';

export class ConventionDetector {
    private projectDir: string;

    constructor(projectDir: string) {
        this.projectDir = projectDir;
    }

    /** Detect all coding conventions */
    async detect(files: string[]): Promise<CodingConventions> {
        const naming = this.detectNaming(files);
        const fileOrganization = this.detectFileOrganization(files);
        const envVars = this.detectEnvVars();
        const scripts = this.detectScripts();
        const styleNotes = this.detectStyleNotes(files);

        return { naming, fileOrganization, envVars, scripts, styleNotes };
    }

    /** Detect naming conventions from file names */
    private detectNaming(files: string[]): NamingConvention {
        const sourceFiles = files.filter(f => {
            const ext = extname(f);
            return ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go'].includes(ext);
        });

        // Analyze file naming patterns
        const fileNames = sourceFiles.map(f => basename(f, extname(f)));
        const fileConvention = this.detectCase(fileNames);

        // Detect component naming (files with uppercase first letter)
        const componentFiles = sourceFiles.filter(f => {
            const name = basename(f, extname(f));
            return /^[A-Z]/.test(name);
        });
        const componentConvention = componentFiles.length > 0 ? 'PascalCase' : fileConvention;

        return {
            files: fileConvention,
            components: componentConvention,
            functions: 'camelCase', // Default assumption, could be improved with AST
            constants: 'UPPER_SNAKE_CASE', // Default assumption
        };
    }

    /** Detect the dominant case style */
    private detectCase(names: string[]): string {
        const patterns = {
            'kebab-case': 0,
            'snake_case': 0,
            'camelCase': 0,
            'PascalCase': 0,
        };

        for (const name of names) {
            if (name.includes('-')) patterns['kebab-case']++;
            else if (name.includes('_')) patterns['snake_case']++;
            else if (/^[a-z]/.test(name) && /[A-Z]/.test(name)) patterns['camelCase']++;
            else if (/^[A-Z]/.test(name)) patterns['PascalCase']++;
        }

        const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
        return sorted[0][1] > 0 ? sorted[0][0] : 'mixed';
    }

    /** Detect file organization patterns */
    private detectFileOrganization(files: string[]): string[] {
        const patterns: string[] = [];

        // Check for common patterns
        const dirs = new Set(files.map(f => f.split('/')[0]).filter(Boolean));

        if (dirs.has('src')) patterns.push('Source code in src/ directory');
        if (dirs.has('app')) patterns.push('App directory routing (Next.js/Rails style)');
        if (dirs.has('pages')) patterns.push('Pages-based routing');
        if (dirs.has('components')) patterns.push('Dedicated components directory');
        if (dirs.has('lib')) patterns.push('Shared library code in lib/');
        if (dirs.has('utils') || dirs.has('helpers')) patterns.push('Utility functions separated');
        if (dirs.has('services')) patterns.push('Service layer pattern');
        if (dirs.has('hooks')) patterns.push('Custom hooks separated');
        if (dirs.has('types')) patterns.push('Type definitions separated');
        if (dirs.has('tests') || dirs.has('test') || dirs.has('__tests__')) {
            patterns.push('Dedicated test directory');
        }

        // Check for co-located tests
        const hasColocatedTests = files.some(f =>
            f.includes('.test.') || f.includes('.spec.')
        );
        if (hasColocatedTests) patterns.push('Co-located test files');

        // Check for barrel exports (index files)
        const hasBarrels = files.filter(f => basename(f).startsWith('index.')).length > 3;
        if (hasBarrels) patterns.push('Barrel exports (index files)');

        return patterns;
    }

    /** Detect environment variables from .env.example */
    private detectEnvVars(): EnvVarInfo[] {
        const envFiles = ['.env.example', '.env.sample', '.env.template'];
        const vars: EnvVarInfo[] = [];

        for (const envFile of envFiles) {
            const path = join(this.projectDir, envFile);
            if (existsSync(path)) {
                const content = readFileSync(path, 'utf-8');
                const lines = content.split('\n');

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;

                    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
                    if (match) {
                        const [, name, value] = match;
                        vars.push({
                            name,
                            description: value ? `Default: ${value}` : undefined,
                            required: !value, // Empty value = likely required
                        });
                    }
                }
                break; // Only read the first found env file
            }
        }

        return vars;
    }

    /** Detect available scripts from package.json */
    private detectScripts(): ScriptInfo[] {
        const pkgPath = join(this.projectDir, 'package.json');
        if (!existsSync(pkgPath)) return [];

        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const scripts = pkg.scripts || {};

            return Object.entries(scripts).map(([name, command]) => ({
                name,
                command: command as string,
                description: this.inferScriptDescription(name, command as string),
            }));
        } catch {
            return [];
        }
    }

    /** Infer script description from name and command */
    private inferScriptDescription(name: string, command: string): string {
        const descMap: Record<string, string> = {
            'dev': 'Start development server',
            'build': 'Build for production',
            'start': 'Start production server',
            'test': 'Run tests',
            'lint': 'Run linter',
            'format': 'Format code',
            'typecheck': 'Run type checking',
            'deploy': 'Deploy to production',
            'preview': 'Preview production build',
            'clean': 'Clean build artifacts',
            'prepare': 'Pre-install hook',
        };

        return descMap[name] || `Runs: ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`;
    }

    /** Detect code style notes */
    private detectStyleNotes(files: string[]): string[] {
        const notes: string[] = [];

        // Check for style config files
        const styleConfigs: Record<string, string> = {
            '.prettierrc': 'Uses Prettier for code formatting',
            '.prettierrc.json': 'Uses Prettier for code formatting',
            'prettier.config.js': 'Uses Prettier for code formatting',
            '.eslintrc': 'Uses ESLint for linting',
            '.eslintrc.json': 'Uses ESLint for linting',
            'eslint.config.js': 'Uses ESLint flat config',
            'eslint.config.mjs': 'Uses ESLint flat config',
            '.editorconfig': 'Uses EditorConfig for editor settings',
            'biome.json': 'Uses Biome for formatting and linting',
            '.stylelintrc': 'Uses Stylelint for CSS linting',
        };

        for (const file of files) {
            const name = basename(file);
            if (styleConfigs[name]) {
                notes.push(styleConfigs[name]);
            }
        }

        // Check for TypeScript strict mode
        const tsconfigPath = join(this.projectDir, 'tsconfig.json');
        if (existsSync(tsconfigPath)) {
            try {
                const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
                if (tsconfig.compilerOptions?.strict) {
                    notes.push('TypeScript strict mode enabled');
                }
            } catch { /* ignore */ }
        }

        return notes;
    }
}
