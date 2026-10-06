import * as documentRepository from '../../repositories/document.repository.js';
import * as documentChunkRepository from '../../repositories/documentChunk.repository.js';
import * as chunkingService from '../chunking.service.js';
import * as embeddingService from '../embedding.service.js';
import { DOCUMENT_STATUS } from '../../constants/document.constants.js';
import { getGitHubRepoMetadata, downloadRepoArchive } from './github.service.js';
import { extractAndFilterRepository } from './repositoryExtractor.service.js';
import AppError from '../../errors/AppError.js';

/**
 * Processes a REPOSITORY source through the existing RecallAI pipeline:
 * 1. Mark repository status as PROCESSING.
 * 2. Fetch latest metadata (default branch, commit SHA) from GitHub.
 * 3. Download repository zip archive from GitHub.
 * 4. Safely extract files with path traversal checks and file filtering.
 * 5. For each valid file:
 *    - Create a child document record (source_type = 'REPOSITORY_FILE', parent_source_id = repo.id, file_path).
 *    - Chunk using existing chunking service (preserving file boundaries).
 *    - Embed using existing embedding service.
 *    - Store in existing document_chunks pgvector table.
 * 6. Mark repository status as READY.
 *
 * @param {object} repositoryDoc - The parent repository document record
 */
export async function processRepository(repositoryDoc) {
    const repositoryId = repositoryDoc.id;

    try {
        await documentRepository.updateDocumentStatus(
            repositoryId,
            DOCUMENT_STATUS.PROCESSING
        );

        const { repo_owner: owner, repo_name: repo, default_branch, commit_sha } = repositoryDoc;

        console.log(`[RepoProcessor] Processing repository: ${owner}/${repo} (ID: ${repositoryId})`);

        // 1. Fetch metadata if branch/commitSha not yet saved
        let activeBranch = default_branch;
        let activeCommitSha = commit_sha;

        try {
            const meta = await getGitHubRepoMetadata(owner, repo);
            activeBranch = meta.defaultBranch || activeBranch || 'main';
            activeCommitSha = meta.commitSha || activeCommitSha;

            await documentRepository.updateRepositoryMetadata(repositoryId, {
                commitSha: activeCommitSha,
                defaultBranch: activeBranch,
                name: `${owner}/${repo}`
            });
        } catch (metaErr) {
            console.warn(`[RepoProcessor] Warning fetching metadata for ${owner}/${repo}: ${metaErr.message}`);
        }

        // 2. Download zipball archive
        console.log(`[RepoProcessor] Downloading archive for ${owner}/${repo}@${activeBranch}...`);
        const zipBuffer = await downloadRepoArchive(owner, repo, activeCommitSha || activeBranch || 'main');

        // 3. Extract and filter files safely
        console.log(`[RepoProcessor] Extracting and scanning files for ${owner}/${repo}...`);
        const { files, totalScanned, totalIndexed } = await extractAndFilterRepository(zipBuffer);

        console.log(`[RepoProcessor] Scanned ${totalScanned} files, filtered ${totalIndexed} files for indexing.`);

        if (files.length === 0) {
            throw new AppError(`No indexable text or code files found in repository '${owner}/${repo}'`, 422);
        }

        // 4. Index each file into existing document + chunking + embeddings + pgvector pipeline
        for (const file of files) {
            try {
                // 4a. Create REPOSITORY_FILE document record linked to this parent
                const fileDoc = await documentRepository.createRepositoryFileDocument({
                    knowledgeBaseId: repositoryDoc.knowledge_base_id,
                    conversationId: repositoryDoc.conversation_id,
                    parentSourceId: repositoryId,
                    filePath: file.filePath,
                    fileName: file.filePath.split('/').pop(),
                    fileSizeBytes: file.fileSizeBytes,
                    status: DOCUMENT_STATUS.PROCESSING
                });

                // 4b. Chunk file content (preserves file boundary)
                const chunks = await chunkingService.chunk(file.content);

                if (!chunks || chunks.length === 0) {
                    await documentRepository.updateDocumentStatus(fileDoc.id, DOCUMENT_STATUS.READY);
                    continue;
                }

                // 4c. Generate embeddings via existing Ollama/embedding service
                const embeddings = await embeddingService.embed(chunks);

                // 4d. Map chunk records
                const chunkRecords = chunks.map((content, index) => ({
                    chunkIndex: index,
                    content,
                    embedding: embeddings[index]
                }));

                // 4e. Save to document_chunks table with vector embeddings
                await documentChunkRepository.saveChunksAndEmbeddings(
                    fileDoc.id,
                    chunkRecords
                );

                // 4f. Mark child file document as READY
                await documentRepository.updateDocumentStatus(
                    fileDoc.id,
                    DOCUMENT_STATUS.READY
                );
            } catch (fileErr) {
                console.error(`[RepoProcessor] Error processing file ${file.filePath}:`, fileErr);
                // Continue indexing remaining files if an individual file fails
            }
        }

        // 5. Mark parent repository document as READY
        await documentRepository.updateDocumentStatus(
            repositoryId,
            DOCUMENT_STATUS.READY
        );

        console.log(`[RepoProcessor] Successfully indexed repository ${owner}/${repo} (ID: ${repositoryId})`);
    } catch (err) {
        console.error(`[RepoProcessor] Repository processing failed for ID ${repositoryId}:`, err);
        await documentRepository.updateDocumentStatus(
            repositoryId,
            DOCUMENT_STATUS.FAILED
        );
        throw err;
    }
}
