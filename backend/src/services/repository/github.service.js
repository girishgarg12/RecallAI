import AppError from '../../errors/AppError.js';
import config from '../../config/index.js';

/**
 * Validates and parses a GitHub repository URL.
 * Accepts only: https://github.com/:owner/:repo (with optional trailing slash or .git)
 * Rejects non-repository pages (e.g. /explore, /settings, /orgs, user profile only, etc.)
 *
 * @param {string} rawUrl
 * @returns {{ provider: 'github', owner: string, repo: string, normalizedUrl: string }}
 */
export function validateAndParseGitHubUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
        throw new AppError('GitHub repository URL is required', 400);
    }

    const trimmed = rawUrl.trim();

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new AppError('Invalid GitHub URL format', 400);
    }

    if (parsed.protocol !== 'https:') {
        throw new AppError("Only secure HTTPS GitHub URLs ('https://github.com/...') are accepted", 400);
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') {
        throw new AppError("Only public GitHub repositories on 'github.com' are supported", 400);
    }

    // Path segments: ['', 'owner', 'repo', ...]
    const segments = parsed.pathname
        .replace(/^\/+|\/+$/g, '')
        .split('/')
        .filter(Boolean);

    if (segments.length !== 2) {
        throw new AppError('URL must point directly to a repository (e.g., https://github.com/owner/repository)', 400);
    }

    const owner = segments[0];
    let repo = segments[1];

    if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4);
    }

    // Reserved non-repo GitHub path names
    const reservedWords = new Set([
        'explore', 'trending', 'features', 'enterprise', 'pricing', 'security',
        'login', 'join', 'settings', 'notifications', 'marketplace', 'issues', 'pulls'
    ]);

    if (reservedWords.has(owner.toLowerCase()) || !owner || !repo) {
        throw new AppError(`'${owner}' is not a valid GitHub repository owner`, 400);
    }

    // Basic slug validation
    const slugRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!slugRegex.test(owner) || !slugRegex.test(repo)) {
        throw new AppError('GitHub owner or repository name contains invalid characters', 400);
    }

    const normalizedUrl = `https://github.com/${owner}/${repo}`;

    return {
        provider: 'github',
        owner,
        repo,
        normalizedUrl
    };
}

/**
 * Fetches repository metadata from GitHub public REST API.
 * Retrieves default branch, commit SHA, description, and verifies public accessibility.
 *
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<{ owner: string, repo: string, defaultBranch: string, commitSha: string, description: string }>}
 */
export async function getGitHubRepoMetadata(owner, repo) {
    const timeoutMs = config.repositoryIngestion?.timeoutMs || 60000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    try {
        const repoRes = await fetch(repoApiUrl, {
            headers: {
                'User-Agent': 'RecallAI-Bot/1.0 (+https://recallai.local)',
                'Accept': 'application/vnd.github.v3+json'
            },
            signal: controller.signal
        });

        if (repoRes.status === 404) {
            throw new AppError(`GitHub repository '${owner}/${repo}' not found or is private`, 404);
        }

        if (repoRes.status === 403) {
            const rateLimitRemaining = repoRes.headers.get('x-ratelimit-remaining');
            if (rateLimitRemaining === '0') {
                throw new AppError('GitHub API rate limit exceeded. Please try again later.', 429);
            }
            throw new AppError(`Access forbidden to GitHub repository '${owner}/${repo}'`, 403);
        }

        if (!repoRes.ok) {
            throw new AppError(`GitHub API error (${repoRes.status}): ${repoRes.statusText}`, 502);
        }

        const repoData = await repoRes.json();

        if (repoData.private) {
            throw new AppError('Private repositories are not supported in MVP. Only public repositories are allowed.', 400);
        }

        const defaultBranch = repoData.default_branch || 'main';

        // Fetch latest commit SHA on default branch
        const commitApiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(defaultBranch)}`;
        const commitRes = await fetch(commitApiUrl, {
            headers: {
                'User-Agent': 'RecallAI-Bot/1.0 (+https://recallai.local)',
                'Accept': 'application/vnd.github.v3+json'
            },
            signal: controller.signal
        });

        let commitSha = null;
        if (commitRes.ok) {
            const commitData = await commitRes.json();
            commitSha = commitData.sha || null;
        }

        return {
            owner: repoData.owner?.login || owner,
            repo: repoData.name || repo,
            defaultBranch,
            commitSha,
            description: repoData.description || ''
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        if (err.name === 'AbortError') {
            throw new AppError(`Request to GitHub timed out after ${timeoutMs / 1000}s`, 504);
        }
        throw new AppError(`Failed to fetch metadata from GitHub: ${err.message}`, 502);
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Downloads GitHub repository zip archive as an ArrayBuffer.
 * Enforces size limits and timeouts.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref - Branch or commit SHA
 * @returns {Promise<Buffer>}
 */
export async function downloadRepoArchive(owner, repo, ref = 'main') {
    const timeoutMs = config.repositoryIngestion?.timeoutMs || 120000;
    const maxArchiveSizeBytes = config.repositoryIngestion?.maxArchiveSizeBytes || 100 * 1024 * 1024;

    const archiveUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${encodeURIComponent(ref)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(archiveUrl, {
            headers: {
                'User-Agent': 'RecallAI-Bot/1.0 (+https://recallai.local)',
                'Accept': 'application/vnd.github.v3+json'
            },
            signal: controller.signal
        });

        if (response.status === 404) {
            throw new AppError(`Archive for repository '${owner}/${repo}' at ref '${ref}' not found`, 404);
        }

        if (!response.ok) {
            throw new AppError(`Failed to download repository archive (${response.status}): ${response.statusText}`, 502);
        }

        const contentLength = Number(response.headers.get('content-length'));
        if (contentLength && contentLength > maxArchiveSizeBytes) {
            throw new AppError(
                `Repository archive size (${(contentLength / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${(maxArchiveSizeBytes / 1024 / 1024).toFixed(1)}MB`,
                413
            );
        }

        const reader = response.body.getReader();
        const chunks = [];
        let receivedBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            receivedBytes += value.length;
            if (receivedBytes > maxArchiveSizeBytes) {
                reader.cancel();
                throw new AppError(
                    `Repository archive exceeded maximum allowed size of ${(maxArchiveSizeBytes / 1024 / 1024).toFixed(1)}MB`,
                    413
                );
            }
            chunks.push(value);
        }

        return Buffer.concat(chunks);
    } catch (err) {
        if (err instanceof AppError) throw err;
        if (err.name === 'AbortError') {
            throw new AppError(`Repository archive download timed out after ${timeoutMs / 1000}s`, 504);
        }
        throw new AppError(`Failed to download repository archive: ${err.message}`, 502);
    } finally {
        clearTimeout(timer);
    }
}
