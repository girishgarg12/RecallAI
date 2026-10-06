import path from 'path';

// Whitelisted file extensions for code & documentation indexing
export const ALLOWED_EXTENSIONS = new Set([
    // JavaScript / TypeScript
    '.js', '.jsx', '.mjs', '.cjs',
    '.ts', '.tsx', '.mts', '.cts',

    // Python
    '.py',

    // Java & JVM
    '.java', '.kt', '.scala',

    // C / C++
    '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx',

    // Systems languages
    '.go', '.rs',

    // Web & scripting
    '.php', '.rb',
    '.html', '.htm',
    '.css', '.scss', '.sass', '.less',

    // Data & Config
    '.json', '.yaml', '.yml', '.xml', '.sql',

    // Documentation
    '.md', '.markdown', '.txt'
]);

// Ignored directory names (case-insensitive)
export const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.github',
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.cache',
    '.next',
    '.nuxt',
    'target',
    'bin',
    'obj',
    'vendor',
    'venv',
    '.venv',
    'env',
    '.env',
    '__pycache__',
    '.idea',
    '.vscode'
]);

// Explicitly ignored file names or patterns (case-insensitive)
export const IGNORED_EXACT_FILES = new Set([
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    'gemfile.lock',
    'poetry.lock',
    'cargo.lock'
]);

// Ignored binary/media/secret extensions
export const IGNORED_EXTENSIONS = new Set([
    '.pem', '.key', '.p12', '.pfx', '.crt', '.cer',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.mp4', '.mp3', '.mov', '.avi', '.wav',
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war',
    '.pdf', '.docx', '.xlsx', '.pptx',
    '.woff', '.woff2', '.ttf', '.eot'
]);

/**
 * Checks whether a repository file path should be indexed.
 * @param {string} relativePath - Normalized path within the repo (e.g. "src/auth/service.js")
 * @param {number} fileSizeBytes - Size of file in bytes
 * @param {number} maxFileSizeBytes - Maximum allowed size
 * @returns {{ allow: boolean, reason?: string }}
 */
export function shouldIndexFile(relativePath, fileSizeBytes = 0, maxFileSizeBytes = 1024 * 1024) {
    if (!relativePath || typeof relativePath !== 'string') {
        return { allow: false, reason: 'Invalid path' };
    }

    // Normalize slashes to forward slashes
    const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = normalizedPath.split('/');
    const fileName = parts[parts.length - 1];

    // Check directory exclusion
    for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts[i].toLowerCase();
        if (IGNORED_DIRECTORIES.has(dir) || dir.startsWith('.')) {
            return { allow: false, reason: `Ignored directory: ${dir}` };
        }
    }

    // Check secret files (.env, .env.local, id_rsa, etc.)
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.startsWith('.env') || lowerFileName.includes('secret') || lowerFileName.includes('credential')) {
        return { allow: false, reason: `Secret/sensitive file pattern: ${fileName}` };
    }

    // Check exact ignored filenames (locks, etc.)
    if (IGNORED_EXACT_FILES.has(lowerFileName)) {
        return { allow: false, reason: `Ignored lock/manifest file: ${fileName}` };
    }

    // Check extension
    const ext = path.extname(fileName).toLowerCase();

    if (IGNORED_EXTENSIONS.has(ext)) {
        return { allow: false, reason: `Ignored extension: ${ext}` };
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return { allow: false, reason: `Extension not in allowlist: ${ext}` };
    }

    // Check size limit
    if (fileSizeBytes > maxFileSizeBytes) {
        return { allow: false, reason: `File size ${fileSizeBytes}B exceeds limit ${maxFileSizeBytes}B` };
    }

    return { allow: true };
}
