import assert from 'node:assert/strict';
import { validateAndParseGitHubUrl } from '../services/repository/github.service.js';
import { shouldIndexFile, ALLOWED_EXTENSIONS, IGNORED_DIRECTORIES, IGNORED_EXTENSIONS } from '../utils/repositoryFilter.util.js';
import { extractAndFilterRepository } from '../services/repository/repositoryExtractor.service.js';
import AdmZip from 'adm-zip';

console.log('🧪 Starting GitHub Repository Backend Unit Tests...\n');

// 1. GitHub URL Validation Tests
console.log('--- 1. Testing GitHub URL Validation ---');
{
    // Valid URLs
    const v1 = validateAndParseGitHubUrl('https://github.com/facebook/react');
    assert.equal(v1.owner, 'facebook');
    assert.equal(v1.repo, 'react');
    assert.equal(v1.normalizedUrl, 'https://github.com/facebook/react');

    const v2 = validateAndParseGitHubUrl('https://github.com/facebook/react/');
    assert.equal(v2.normalizedUrl, 'https://github.com/facebook/react');

    const v3 = validateAndParseGitHubUrl('https://github.com/facebook/react.git');
    assert.equal(v3.repo, 'react');
    assert.equal(v3.normalizedUrl, 'https://github.com/facebook/react');

    const v4 = validateAndParseGitHubUrl('https://www.github.com/owner-name/repo_123');
    assert.equal(v4.owner, 'owner-name');
    assert.equal(v4.repo, 'repo_123');

    // Invalid URLs
    assert.throws(() => validateAndParseGitHubUrl(''), /required/);
    assert.throws(() => validateAndParseGitHubUrl('http://github.com/owner/repo'), /HTTPS/);
    assert.throws(() => validateAndParseGitHubUrl('https://gitlab.com/owner/repo'), /github.com/);
    assert.throws(() => validateAndParseGitHubUrl('https://github.com/'), /directly to a repository/);
    assert.throws(() => validateAndParseGitHubUrl('https://github.com/owner'), /directly to a repository/);
    assert.throws(() => validateAndParseGitHubUrl('https://github.com/explore'), /directly to a repository|not a valid GitHub repository owner/);
    assert.throws(() => validateAndParseGitHubUrl('https://github.com/settings'), /directly to a repository|not a valid GitHub repository owner/);
    assert.throws(() => validateAndParseGitHubUrl('https://github.com/explore/repo'), /not a valid GitHub repository owner/);
    assert.throws(() => validateAndParseGitHubUrl('https://github.com/owner/repo/pulls/1'), /directly to a repository/);

    console.log('✓ GitHub URL validation tests passed');
}

// 2. File Filter Rules Tests
console.log('\n--- 2. Testing Repository File Filter Rules ---');
{
    // Allowed code and docs
    assert.equal(shouldIndexFile('src/auth/service.js').allow, true);
    assert.equal(shouldIndexFile('src/components/Button.tsx').allow, true);
    assert.equal(shouldIndexFile('main.py').allow, true);
    assert.equal(shouldIndexFile('README.md').allow, true);
    assert.equal(shouldIndexFile('schema.sql').allow, true);
    assert.equal(shouldIndexFile('config.yaml').allow, true);

    // Ignored directories
    assert.equal(shouldIndexFile('node_modules/express/index.js').allow, false);
    assert.equal(shouldIndexFile('.git/config').allow, false);
    assert.equal(shouldIndexFile('dist/bundle.js').allow, false);
    assert.equal(shouldIndexFile('build/output.js').allow, false);
    assert.equal(shouldIndexFile('coverage/lcov.info').allow, false);
    assert.equal(shouldIndexFile('.vscode/settings.json').allow, false);

    // Ignored secrets & environment files
    assert.equal(shouldIndexFile('.env').allow, false);
    assert.equal(shouldIndexFile('.env.local').allow, false);
    assert.equal(shouldIndexFile('.env.production').allow, false);
    assert.equal(shouldIndexFile('src/secrets.json').allow, false);

    // Ignored binaries & lockfiles
    assert.equal(shouldIndexFile('package-lock.json').allow, false);
    assert.equal(shouldIndexFile('yarn.lock').allow, false);
    assert.equal(shouldIndexFile('image.png').allow, false);
    assert.equal(shouldIndexFile('archive.zip').allow, false);
    assert.equal(shouldIndexFile('app.exe').allow, false);
    assert.equal(shouldIndexFile('cert.pem').allow, false);

    // File size limit test (e.g. 500 bytes limit)
    assert.equal(shouldIndexFile('big.js', 1000, 500).allow, false);
    assert.equal(shouldIndexFile('small.js', 400, 500).allow, true);

    console.log('✓ Repository file filtering tests passed');
}

// 3. Zip Extraction & Zip Slip Protection Tests
console.log('\n--- 3. Testing Zip Extraction & Zip Slip Security ---');
{
    const zip = new AdmZip();

    // Normal files in GitHub zipball format (root folder prefix)
    zip.addFile('owner-repo-sha123/README.md', Buffer.from('# Hello RecallAI\nThis is a sample readme.'));
    zip.addFile('owner-repo-sha123/src/index.js', Buffer.from('console.log("main entrypoint");'));
    zip.addFile('owner-repo-sha123/node_modules/fake.js', Buffer.from('module.exports = {};'));
    zip.addFile('owner-repo-sha123/photo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    // Path traversal attempt (Zip Slip)
    zip.addFile('owner-repo-sha123/../../etc/passwd', Buffer.from('root:x:0:0'));

    const zipBuffer = zip.toBuffer();

    const { files, totalScanned, totalIndexed } = await extractAndFilterRepository(zipBuffer);

    assert.equal(totalIndexed, 2, 'Should index only README.md and src/index.js');
    assert.ok(files.some(f => f.filePath === 'README.md'));
    assert.ok(files.some(f => f.filePath === 'src/index.js'));
    assert.ok(!files.some(f => f.filePath.includes('etc/passwd')), 'Path traversal must be excluded');
    assert.ok(!files.some(f => f.filePath.includes('node_modules')), 'node_modules must be excluded');
    assert.ok(!files.some(f => f.filePath.includes('photo.png')), 'Binary must be excluded');

    console.log('✓ Zip Slip security & extraction tests passed');
}

console.log('\n🎉 ALL GITHUB REPOSITORY BACKEND TESTS PASSED!\n');
