/**
 * Lightweight Module Parser — Extracts imports, exports, and module structure.
 *
 * Uses regex-based heuristics instead of full AST parsing (tree-sitter)
 * to keep dependencies minimal. Supports:
 * - ES Modules (import/export)
 * - CommonJS (require/module.exports)
 * - Python (import/from...import/def/class)
 */

import { readFileSync } from 'fs';
import { extname, join } from 'path';
import type { ModuleInfo } from '../types.js';

/** File extensions we can parse, grouped by language */
const JS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const PY_EXTENSIONS = new Set(['.py', '.pyw']);
const ALL_PARSEABLE = new Set([...JS_EXTENSIONS, ...PY_EXTENSIONS]);

// ─── JavaScript/TypeScript Patterns ───

/** Regex patterns for JS/TS import extraction */
const JS_IMPORT_PATTERNS = [
    // import X from 'module'
    /import\s+(?:[\w{}\s,*]+)\s+from\s+['"]([^'"]+)['"]/g,
    // import 'module' (side-effect)
    /import\s+['"]([^'"]+)['"]/g,
    // const X = require('module')
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // dynamic import('module')
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

/** Regex patterns for ES module export extraction */
const JS_EXPORT_PATTERNS = [
    // export function name / export async function name
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    // export class name
    /export\s+class\s+(\w+)/g,
    // export const/let/var name
    /export\s+(?:const|let|var)\s+(\w+)/g,
    // export interface/type name
    /export\s+(?:interface|type)\s+(\w+)/g,
    // export enum name
    /export\s+enum\s+(\w+)/g,
    // export default (class/function name or anonymous)
    /export\s+default\s+(?:class|function)\s*(\w*)/g,
];

/** Regex patterns for CommonJS export extraction */
const CJS_EXPORT_PATTERNS = [
    // module.exports = { name1, name2 } — extract names from object
    /module\.exports\s*=\s*\{([^}]+)\}/g,
    // module.exports = function name / class name
    /module\.exports\s*=\s*(?:function|class)\s+(\w+)/g,
    // module.exports = identifier
    /module\.exports\s*=\s*(\w+)\s*;/g,
    // exports.name = ...
    /exports\.(\w+)\s*=/g,
];

// ─── Python Patterns ───

/** Regex patterns for Python import extraction */
const PY_IMPORT_PATTERNS = [
    // from module import ...
    /^from\s+([\w.]+)\s+import\s+/gm,
    // import module
    /^import\s+([\w.]+)/gm,
];

/** Regex patterns for Python export extraction (public definitions) */
const PY_EXPORT_PATTERNS = [
    // def function_name (not private)
    /^def\s+([a-zA-Z]\w*)\s*\(/gm,
    // class ClassName
    /^class\s+([A-Z]\w*)/gm,
    // CONSTANT = ... (module-level uppercase)
    /^([A-Z][A-Z_0-9]+)\s*=/gm,
];

/** Check if a path is a relative import */
function isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('.') || importPath.startsWith('/');
}

/** Check if a Python import is relative (starts with .) */
function isPythonRelativeImport(importPath: string): boolean {
    return importPath.startsWith('.');
}

export class ModuleParser {
    private projectDir: string;

    constructor(projectDir: string) {
        this.projectDir = projectDir;
    }

    /** Parse all parseable files and extract module information */
    async parseModules(files: string[], entryPoints: string[]): Promise<ModuleInfo[]> {
        const entrySet = new Set(entryPoints);
        const modules: ModuleInfo[] = [];

        for (const file of files) {
            const ext = extname(file).toLowerCase();
            if (!ALL_PARSEABLE.has(ext)) continue;

            try {
                const fullPath = join(this.projectDir, file);
                const content = readFileSync(fullPath, 'utf-8');

                // Skip very large files (likely generated/bundled)
                if (content.length > 100_000) continue;

                const isPython = PY_EXTENSIONS.has(ext);
                const imports = isPython
                    ? this.extractPythonImports(content)
                    : this.extractJSImports(content);
                const exports = isPython
                    ? this.extractPythonExports(content)
                    : this.extractJSExports(content);

                // Only include files that have meaningful exports or are entry points
                if (exports.length > 0 || entrySet.has(file)) {
                    modules.push({
                        path: file,
                        imports,
                        exports,
                        isEntryPoint: entrySet.has(file),
                    });
                }
            } catch {
                // Skip files that can't be read
            }
        }

        return modules;
    }

    // ─── JavaScript/TypeScript ───

    /** Extract import paths from JS/TS content */
    private extractJSImports(content: string): string[] {
        const cleaned = this.stripJSComments(content);
        const imports = new Set<string>();

        for (const pattern of JS_IMPORT_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(cleaned)) !== null) {
                if (match[1]) imports.add(match[1]);
            }
        }

        return Array.from(imports);
    }

    /** Extract exported names from JS/TS content (ES modules + CommonJS) */
    private extractJSExports(content: string): string[] {
        const cleaned = this.stripJSComments(content);
        const exports = new Set<string>();

        // ES module exports
        for (const pattern of JS_EXPORT_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(cleaned)) !== null) {
                if (match[1]) exports.add(match[1]);
            }
        }

        // Barrel re-exports: export * from '...' or export { ... } from '...'
        const reExportPattern = /export\s+(?:\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = reExportPattern.exec(cleaned)) !== null) {
            exports.add(`* from ${match[1]}`);
        }

        // Default export (anonymous)
        if (/export\s+default\s+/.test(cleaned)) {
            exports.add('default');
        }

        // CommonJS exports
        for (const pattern of CJS_EXPORT_PATTERNS) {
            pattern.lastIndex = 0;
            let cjsMatch;
            while ((cjsMatch = pattern.exec(cleaned)) !== null) {
                const captured = cjsMatch[1];
                if (!captured) continue;

                // module.exports = { name1, name2, ... } — extract individual names
                if (captured.includes(',') || captured.includes(':')) {
                    const names = captured.split(',').map(s => {
                        // Handle "key: value" → take key; Handle "name" → take name
                        const trimmed = s.trim();
                        const colonIdx = trimmed.indexOf(':');
                        return colonIdx > 0 ? trimmed.substring(0, colonIdx).trim() : trimmed;
                    }).filter(n => /^\w+$/.test(n));
                    for (const name of names) exports.add(name);
                } else if (/^\w+$/.test(captured.trim())) {
                    exports.add(captured.trim());
                }
            }
        }

        return Array.from(exports).filter(Boolean);
    }

    /** Strip JS/TS single-line and multi-line comments */
    private stripJSComments(content: string): string {
        let result = content.replace(/\/\*[\s\S]*?\*\//g, '');
        result = result.replace(/(?<![:\w])\/\/.*$/gm, '');
        return result;
    }

    // ─── Python ───

    /** Extract import paths from Python content */
    private extractPythonImports(content: string): string[] {
        const cleaned = this.stripPythonComments(content);
        const imports = new Set<string>();

        for (const pattern of PY_IMPORT_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(cleaned)) !== null) {
                if (match[1]) imports.add(match[1]);
            }
        }

        return Array.from(imports);
    }

    /** Extract exported names from Python content (public defs/classes) */
    private extractPythonExports(content: string): string[] {
        const cleaned = this.stripPythonComments(content);
        const exports = new Set<string>();

        // Check for explicit __all__ = [...]
        const allMatch = cleaned.match(/__all__\s*=\s*\[([^\]]+)\]/);
        if (allMatch) {
            const names = allMatch[1].match(/['"](\w+)['"]/g);
            if (names) {
                for (const n of names) {
                    exports.add(n.replace(/['"]/g, ''));
                }
                return Array.from(exports);
            }
        }

        // Fall back to public definitions
        for (const pattern of PY_EXPORT_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(cleaned)) !== null) {
                const name = match[1];
                // Skip private names (starting with _)
                if (name && !name.startsWith('_')) {
                    exports.add(name);
                }
            }
        }

        return Array.from(exports);
    }

    /** Strip Python comments and docstrings */
    private stripPythonComments(content: string): string {
        // Remove triple-quoted strings (docstrings)
        let result = content.replace(/"""[\s\S]*?"""/g, '');
        result = result.replace(/'''[\s\S]*?'''/g, '');
        // Remove single-line comments
        result = result.replace(/#.*$/gm, '');
        return result;
    }

    // ─── Dependency Summary ───

    /**
     * Build a simplified dependency summary for context generation.
     */
    buildDependencySummary(modules: ModuleInfo[]): {
        topImported: Array<{ module: string; importedBy: number }>;
        topExporters: Array<{ file: string; exportCount: number }>;
        internalDeps: number;
        externalDeps: number;
    } {
        const importCounts: Record<string, number> = {};
        let internalDeps = 0;
        let externalDeps = 0;

        for (const mod of modules) {
            for (const imp of mod.imports) {
                importCounts[imp] = (importCounts[imp] || 0) + 1;
                if (isRelativeImport(imp) || isPythonRelativeImport(imp)) {
                    internalDeps++;
                } else {
                    externalDeps++;
                }
            }
        }

        const topImported = Object.entries(importCounts)
            .map(([module, importedBy]) => ({ module, importedBy }))
            .sort((a, b) => b.importedBy - a.importedBy)
            .slice(0, 15);

        const topExporters = modules
            .map(m => ({ file: m.path, exportCount: m.exports.length }))
            .sort((a, b) => b.exportCount - a.exportCount)
            .slice(0, 10);

        return { topImported, topExporters, internalDeps, externalDeps };
    }

    /**
     * Trim modules list for large projects to keep context.json reasonable.
     * Keeps entry points + top exporters + top imported-from files.
     */
    trimModules(modules: ModuleInfo[], maxModules: number = 50): ModuleInfo[] {
        if (modules.length <= maxModules) return modules.map(m => this.capExports(m));

        // Always keep entry points
        const kept = new Set<string>();
        const result: ModuleInfo[] = [];

        for (const m of modules) {
            if (m.isEntryPoint) {
                kept.add(m.path);
                result.push(this.capExports(m));
            }
        }

        // Add top exporters
        const sorted = [...modules]
            .filter(m => !kept.has(m.path))
            .sort((a, b) => b.exports.length - a.exports.length);

        for (const m of sorted) {
            if (result.length >= maxModules) break;
            if (!kept.has(m.path)) {
                kept.add(m.path);
                result.push(this.capExports(m));
            }
        }

        return result;
    }

    /** Cap exports per module to prevent bloat */
    private capExports(mod: ModuleInfo, max: number = 15): ModuleInfo {
        if (mod.exports.length <= max) return mod;
        return {
            ...mod,
            exports: [...mod.exports.slice(0, max), `(+${mod.exports.length - max} more)`],
        };
    }
}
