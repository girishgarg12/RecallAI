import assert from 'node:assert/strict';
import { validateUrl, normalizeUrl, isPrivateIp, checkSsrfSafe } from '../utils/url.util.js';
import * as cheerio from 'cheerio';
import { normalizeText } from '../utils/text.util.js';

console.log('🧪 Starting URL Source Ingestion Tests...');

// 1. URL Normalization Tests
console.log('\n--- 1. Testing URL Normalization ---');
{
    assert.equal(
        normalizeUrl('https://example.com/'),
        'https://example.com',
        'Should strip root trailing slash'
    );
    assert.equal(
        normalizeUrl('https://example.com/article/'),
        'https://example.com/article/',
        'Should preserve path'
    );
    assert.equal(
        normalizeUrl('HTTP://EXAMPLE.COM/Path#fragment'),
        'http://example.com/Path',
        'Should lowercase protocol and host, strip fragment'
    );
    assert.equal(
        normalizeUrl('https://example.com:443/test'),
        'https://example.com/test',
        'Should remove default https port 443'
    );
    assert.equal(
        normalizeUrl('http://example.com:80/test'),
        'http://example.com/test',
        'Should remove default http port 80'
    );
    console.log('✓ URL Normalization tests passed');
}

// 2. URL Validation Tests
console.log('\n--- 2. Testing URL Validation (Format & Protocols) ---');
{
    // Valid URLs
    assert.doesNotThrow(() => validateUrl('https://example.com'));
    assert.doesNotThrow(() => validateUrl('http://sub.domain.org/path?query=1'));

    // Missing / Empty URLs
    assert.throws(() => validateUrl(''), /URL is required/);
    assert.throws(() => validateUrl('   '), /URL is required/);

    // Malformed URLs
    assert.throws(() => validateUrl('hello'), /Malformed URL/);
    assert.throws(() => validateUrl('://example.com'), /Malformed URL/);
    assert.throws(() => validateUrl('http://'), /Malformed URL/);

    // Unsupported protocols
    assert.throws(() => validateUrl('ftp://example.com'), /Unsupported protocol/);
    assert.throws(() => validateUrl('file:///etc/passwd'), /Unsupported protocol/);
    assert.throws(() => validateUrl('javascript:alert(1)'), /Unsupported protocol/);
    assert.throws(() => validateUrl('data:text/html,test'), /Unsupported protocol/);

    // Localhost / Hostname blocks
    assert.throws(() => validateUrl('http://localhost:3000'), /localhost or private network/);
    assert.throws(() => validateUrl('http://api.local/data'), /localhost or private network/);
    assert.throws(() => validateUrl('http://127.0.0.1:8080'), /localhost or private network/);
    assert.throws(() => validateUrl('http://0.0.0.0/'), /localhost or private network/);

    console.log('✓ URL Validation format & protocol tests passed');
}

// 3. Private IP & SSRF Detection Tests
console.log('\n--- 3. Testing Private IP & SSRF Filter ---');
{
    // Loopback
    assert.equal(isPrivateIp('127.0.0.1'), true, '127.0.0.1 should be private');
    assert.equal(isPrivateIp('127.255.255.255'), true, '127.255.255.255 should be private');

    // RFC 1918 Private Ranges
    assert.equal(isPrivateIp('10.0.0.1'), true, '10.x should be private');
    assert.equal(isPrivateIp('172.16.0.1'), true, '172.16.x should be private');
    assert.equal(isPrivateIp('172.31.255.255'), true, '172.31.x should be private');
    assert.equal(isPrivateIp('192.168.1.1'), true, '192.168.x should be private');

    // Link-local & 0.0.0.0
    assert.equal(isPrivateIp('169.254.169.254'), true, 'AWS metadata 169.254.x should be private');
    assert.equal(isPrivateIp('0.0.0.0'), true, '0.0.0.0 should be private');

    // IPv6 private & loopback
    assert.equal(isPrivateIp('::1'), true, '::1 should be private');
    assert.equal(isPrivateIp('fe80::1'), true, 'fe80:: link-local should be private');
    assert.equal(isPrivateIp('fc00::1'), true, 'fc00:: private should be private');
    assert.equal(isPrivateIp('::ffff:127.0.0.1'), true, 'IPv4-mapped 127.0.0.1 should be private');
    assert.equal(isPrivateIp('::ffff:192.168.1.1'), true, 'IPv4-mapped 192.168.1.1 should be private');

    // Public IPs (should be allowed)
    assert.equal(isPrivateIp('8.8.8.8'), false, '8.8.8.8 should be public');
    assert.equal(isPrivateIp('1.1.1.1'), false, '1.1.1.1 should be public');
    assert.equal(isPrivateIp('93.184.216.34'), false, 'example.com IP should be public');

    console.log('✓ Private IP filter tests passed');
}

// 4. DNS-based SSRF Check
console.log('\n--- 4. Testing DNS SSRF Resolver Check ---');
{
    // localhost should be rejected by IP resolution
    await assert.rejects(
        () => checkSsrfSafe('localhost'),
        /private\/internal IP address|blocked by SSRF/
    );

    // 127.0.0.1 literal should be rejected
    await assert.rejects(
        () => checkSsrfSafe('127.0.0.1'),
        /blocked by SSRF protection/
    );

    // 169.254.169.254 should be rejected
    await assert.rejects(
        () => checkSsrfSafe('169.254.169.254'),
        /blocked by SSRF protection/
    );

    console.log('✓ DNS SSRF check passed');
}

// 5. HTML Content Extraction & Sanitization Tests
console.log('\n--- 5. Testing HTML Content Extraction ---');
{
    const htmlSample = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Test Page Title</title>
                <style>body { color: red; }</style>
                <script>alert("evil");</script>
            </head>
            <body>
                <header><nav><a href="/">Home</a></nav></header>
                <main>
                    <h1>Main Article Heading</h1>
                    <p>This is the first paragraph with important knowledge.</p>
                    <p>Second paragraph explaining RecallAI RAG architecture.</p>
                </main>
                <footer><p>© 2026 Test Site</p></footer>
            </body>
        </html>
    `;

    const $ = cheerio.load(htmlSample);
    const title = $('title').text()?.trim();
    assert.equal(title, 'Test Page Title');

    // Strip scripts, styles, nav, footer, header
    $('script, style, noscript, nav, footer, header').remove();

    const text = normalizeText($('main').text() || $('body').text());

    assert.ok(text.includes('Main Article Heading'));
    assert.ok(text.includes('This is the first paragraph'));
    assert.ok(text.includes('RecallAI RAG architecture'));
    assert.ok(!text.includes('alert("evil")'), 'Scripts must be excluded');
    assert.ok(!text.includes('color: red'), 'Styles must be excluded');
    assert.ok(!text.includes('Home'), 'Navigation must be excluded');
    assert.ok(!text.includes('© 2026 Test Site'), 'Footer must be excluded');

    console.log('✓ HTML extraction and cleanup passed');
}

// 6. Empty / Low-content HTML Detection
console.log('\n--- 6. Testing Empty HTML Handling ---');
{
    const emptyHtml = `<html><head><script>something();</script></head><body><style>.a{}</style></body></html>`;
    const $ = cheerio.load(emptyHtml);
    $('script, style, noscript, nav, footer, header').remove();
    const text = normalizeText($('body').text() || $.text());
    assert.equal(text.length < 20, true, 'Empty HTML text length should be < 20 characters');

    console.log('✓ Empty HTML detection passed');
}

console.log('\n🎉 ALL UNIT & SECURITY TESTS PASSED SUCCESSFULLY!\n');
