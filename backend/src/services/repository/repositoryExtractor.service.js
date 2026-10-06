import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';
import AppError from '../../errors/AppError.js';
import { shouldIndexFile } from '../../utils/repositoryFilter.util.js';
import config from '../../config/index.js';

/**
 * Extracts and scans a GitHub zipball buffer in a secure isolated temporary directory.
 * GitHub zipballs contain a single top-level folder like: owner-repo-sha/...
 * This extractor:
 * 1. Validates entry paths against Zip Slip / path traversal attacks.
 * 2. Strips the root archive folder prefix.
 * 3. Applies file filter rules (extensions, directory exclusions, secrets, size limits).
 * 4. Reads valid text contents.
 * 5. Cleans up the temporary directory in all scenarios (success or error).
 *
 * @param {Buffer} zipBuffer
 * @returns {Promise<{ files: Array<{ filePath: string, content: string, fileSizeBytes: number }>, totalScanned: number, totalIndexed: number }>}
 */
export async function extractAndFilterRepository(zipBuffer) {
    if (!zipBuffer || !Buffer.isBuffer(zipBuffer)) {
        throw new AppError('Invalid repository archive buffer provided', 400);
    }

    const tempDir = path.join(os.tmpdir(), `recallai-repo-${randomUUID()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const maxFileSizeBytes = config.repositoryIngestion?.maxFileSizeBytes || 1024 * 1024;
    const maxFilesCount = config.repositoryIngestion?.maxFilesCount || 500;

    const files = [];
    let totalScanned = 0;

    try {
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();

        // Detect root folder prefix (GitHub zipballs put everything under e.g. "owner-repo-commitSha/")
        let rootPrefix = '';
        const prefixes = new Map();
        for (const entry of zipEntries) {
            const cleanName = entry.entryName.replace(/\\/g, '/');
            const slashIdx = cleanName.indexOf('/');
            if (slashIdx > 0) {
                const p = cleanName.slice(0, slashIdx + 1);
                prefixes.set(p, (prefixes.get(p) || 0) + 1);
            }
        }
        // Choose the prefix that appears most frequently (the repo root folder)
        let maxCount = 0;
        for (const [p, count] of prefixes.entries()) {
            if (count > maxCount) {
                maxCount = count;
                rootPrefix = p;
            }
        }

        for (const entry of zipEntries) {
            if (entry.isDirectory) continue;

            totalScanned++;

            const rawEntryName = entry.entryName.replace(/\\/g, '/');

            // Strip GitHub's top-level container directory
            let relativePath = rawEntryName;
            if (rootPrefix && relativePath.startsWith(rootPrefix)) {
                relativePath = relativePath.slice(rootPrefix.length);
            }

            if (!relativePath) continue;

            // Security check: Guard against Path Traversal / Zip Slip
            // Must not contain ".." segments or start with "/" or contain drive letter
            const normalized = path.normalize(relativePath).replace(/\\/g, '/');
            if (
                normalized.startsWith('../') ||
                normalized.includes('/../') ||
                normalized === '..' ||
                path.isAbsolute(normalized) ||
                /^[a-zA-Z]:/.test(normalized)
            ) {
                console.warn(`[Security] Skipped suspicious archive entry path: ${entry.entryName}`);
                continue;
            }

            const uncompressedSize = entry.header?.size || 0;

            // Apply centralized file filter
            const filterResult = shouldIndexFile(normalized, uncompressedSize, maxFileSizeBytes);
            if (!filterResult.allow) {
                continue;
            }

            // Extract content to buffer and decode as UTF-8
            const entryData = entry.getData();

            // Re-verify actual byte size
            if (entryData.length > maxFileSizeBytes) {
                continue;
            }

            // Basic binary check: check for null bytes in initial 800 bytes
            const previewBytes = entryData.subarray(0, Math.min(800, entryData.length));
            let isBinary = false;
            for (let i = 0; i < previewBytes.length; i++) {
                if (previewBytes[i] === 0) {
                    isBinary = true;
                    break;
                }
            }

            if (isBinary) {
                continue;
            }

            const content = entryData.toString('utf-8');

            // Skip empty files
            if (!content || !content.trim()) {
                continue;
            }

            files.push({
                filePath: normalized,
                content,
                fileSizeBytes: entryData.length
            });

            // Stop if maximum file count limit reached
            if (files.length >= maxFilesCount) {
                console.warn(`[RepoProcessor] Reached max files limit (${maxFilesCount}). Skipping remaining files.`);
                break;
            }
        }

        return {
            files,
            totalScanned,
            totalIndexed: files.length
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Failed to extract repository archive: ${err.message}`, 500);
    } finally {
        // Guarantee cleanup of temp directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
            // silent cleanup error
        }
    }
}
