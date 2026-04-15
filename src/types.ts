/**
 * Core types for ContextForge
 */

/** Represents the full project context */
export interface ProjectContext {
    /** Project metadata */
    meta: ProjectMeta;
    /** Project structure analysis */
    structure: ProjectStructure;
    /** Coding conventions detected */
    conventions: CodingConventions;
    /** Git history insights */
    gitInsights: GitInsights;
    /** AI-generated summary (optional) */
    aiSummary?: AISummary;
    /** Generation metadata */
    generated: GenerationMeta;
}

export interface ProjectMeta {
    name: string;
    description?: string;
    version?: string;
    languages: LanguageInfo[];
    frameworks: string[];
    packageManager?: string;
    entryPoints: string[];
}

export interface LanguageInfo {
    name: string;
    percentage: number;
    fileCount: number;
}

export interface ProjectStructure {
    /** Top-level directory layout with descriptions */
    directories: DirectoryInfo[];
    /** Key files and their roles */
    keyFiles: KeyFileInfo[];
    /** Module dependency graph (simplified) */
    modules: ModuleInfo[];
    /** Total file count (excluding ignored) */
    totalFiles: number;
    /** Total lines of code */
    totalLines: number;
}

export interface DirectoryInfo {
    path: string;
    purpose: string;
    fileCount: number;
}

export interface KeyFileInfo {
    path: string;
    role: string;
    exports?: string[];
}

export interface ModuleInfo {
    path: string;
    imports: string[];
    exports: string[];
    isEntryPoint: boolean;
}

export interface CodingConventions {
    /** Naming conventions detected */
    naming: NamingConvention;
    /** File organization patterns */
    fileOrganization: string[];
    /** Environment variables used */
    envVars: EnvVarInfo[];
    /** Scripts/commands available */
    scripts: ScriptInfo[];
    /** Code style notes */
    styleNotes: string[];
}

export interface NamingConvention {
    files: string;       // e.g., "kebab-case"
    components: string;  // e.g., "PascalCase"
    functions: string;   // e.g., "camelCase"
    constants: string;   // e.g., "UPPER_SNAKE_CASE"
}

export interface EnvVarInfo {
    name: string;
    description?: string;
    required: boolean;
}

export interface ScriptInfo {
    name: string;
    command: string;
    description?: string;
}

export interface GitInsights {
    /** Recent development direction */
    recentDirection: string;
    /** Most frequently modified files (hot zones) */
    hotFiles: HotFileInfo[];
    /** Recent commit summary */
    recentCommits: CommitSummary[];
    /** Active contributors */
    contributors: string[];
    /** Last update timestamp */
    lastCommitDate?: string;
}

export interface HotFileInfo {
    path: string;
    changeCount: number;
    lastChanged: string;
}

export interface CommitSummary {
    hash: string;
    message: string;
    date: string;
    author: string;
}

export interface AISummary {
    /** One-paragraph project overview */
    overview: string;
    /** Key architectural decisions */
    architectureDecisions: string[];
    /** Important coding conventions (AI-inferred) */
    codingGuidelines: string[];
    /** Potential gotchas for AI assistants */
    aiGotchas: string[];
}

export interface GenerationMeta {
    tool: string;
    version: string;
    timestamp: string;
    scanDuration: number;
    contextSize: number;
}

/** Options for the init command */
export interface InitOptions {
    dir: string;
    ai: boolean;
    lang?: string;
    verbose?: boolean;
}

/** Options for the update command */
export interface UpdateOptions {
    dir: string;
    since?: string;
    verbose?: boolean;
}

/** Options for the export command */
export interface ExportOptions {
    format: 'cursor' | 'claude' | 'text' | 'json';
    dir: string;
    output?: string;
}

/** Options for the stats command */
export interface StatsOptions {
    dir: string;
}
