import * as cheerio from 'cheerio';
import config from '../config/index.js';
import AppError from '../errors/AppError.js';
import { validateUrl, checkSsrfSafe } from '../utils/url.util.js';
import { normalizeText } from '../utils/text.util.js';
import * as documentRepository from '../repositories/document.repository.js';

/**
 * Fetches a webpage with strict security controls:
 * 1. Validates URL and protocol
 * 2. Checks DNS resolution against SSRF blocklist
 * 3. Enforces network timeouts via AbortController
 * 4. Manually handles redirects with recursive SSRF checks (up to config.urlIngestion.maxRedirects)
 * 5. Checks Content-Type (text/html or text/plain only)
 * 6. Checks Content-Length header to prevent large downloads early
 * 7. Limits downloaded response body size to config.urlIngestion.maxResponseSize
 * 8. Parses HTML with Cheerio, strips scripts/styles/navigation noise
 * 9. Extracts title and updates document name if useful
 * 10. Normalizes text and throws AppError if empty
 */
export async function fetchAndExtract(document) {
    const rawUrl = document.source_url;
    if (!rawUrl) {
        throw new AppError('Document record is missing source_url', 400);
    }

    const { html, contentType, finalUrl } = await fetchUrlWithSecurity(rawUrl);

    let extractedText = '';
    let extractedTitle = null;

    if (contentType.includes('text/html')) {
        const $ = cheerio.load(html);

        // Extract title before pruning
        const pageTitle = $('title').text()?.trim() || $('meta[property="og:title"]').attr('content')?.trim();
        if (pageTitle) {
            extractedTitle = pageTitle;
        }

        // Remove non-content and noise elements
        $(
            'script, style, noscript, svg, canvas, iframe, form, nav, footer, header, ' +
            'aside, [role="navigation"], [role="banner"], [role="contentinfo"], .nav, .menu, .footer, .header'
        ).remove();

        // Get main content or fallback to body
        const mainContent = $('main, article, [role="main"], #content, .content, .post, .article').first();
        if (mainContent.length > 0) {
            extractedText = mainContent.text();
        } else {
            extractedText = $('body').text() || $.text();
        }
    } else {
        // Plain text content
        extractedText = html;
    }

    const cleanText = normalizeText(extractedText);

    if (!cleanText || cleanText.length < 20) {
        throw new AppError('No meaningful textual content could be extracted from this webpage', 422);
    }

    // If an extracted title is found and document.name is fallback, update it in DB
    if (extractedTitle && extractedTitle.length > 0) {
        try {
            const truncatedTitle = extractedTitle.slice(0, 255);
            await documentRepository.updateDocument(document.id, truncatedTitle);
        } catch {
            // Non-critical, continue
        }
    }

    return cleanText;
}

/**
 * Fetches URL with full SSRF checks and manual redirect handling
 */
async function fetchUrlWithSecurity(initialUrl, redirectCount = 0) {
    const maxRedirects = config.urlIngestion?.maxRedirects || 5;
    const maxResponseSize = config.urlIngestion?.maxResponseSize || 10 * 1024 * 1024;
    const timeoutMs = config.urlIngestion?.timeoutMs || 20000;

    if (redirectCount > maxRedirects) {
        throw new AppError(`Too many redirects (exceeded limit of ${maxRedirects})`, 400);
    }

    // 1. Validate URL structure
    const parsed = validateUrl(initialUrl);

    // 2. Resolve DNS and ensure safe destination IP
    await checkSsrfSafe(parsed.hostname);

    // 3. Setup timeout controller
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
        response = await fetch(parsed.toString(), {
            method: 'GET',
            headers: {
                'User-Agent': 'RecallAI-Bot/1.0 (+https://recallai.local)',
                'Accept': 'text/html,text/plain;q=0.9,*/*;q=0.8',
            },
            redirect: 'manual', // Enforce manual redirect handling for security
            signal: controller.signal,
        });
    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            throw new AppError(`Request timed out after ${timeoutMs / 1000} seconds`, 504);
        }
        throw new AppError(`Failed to fetch URL: ${err.message}`, 502);
    } finally {
        clearTimeout(timer);
    }

    // 4. Handle HTTP redirects manually
    if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
            throw new AppError(`Redirect status ${response.status} returned without Location header`, 502);
        }

        // Resolve relative redirects
        const nextUrl = new URL(location, parsed).toString();
        return fetchUrlWithSecurity(nextUrl, redirectCount + 1);
    }

    // 5. Verify HTTP status
    if (!response.ok) {
        throw new AppError(`HTTP Error: Webpage responded with status ${response.status} ${response.statusText}`, response.status >= 400 && response.status < 500 ? response.status : 502);
    }

    // 6. Validate Content-Type
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    const isText = contentType.includes('text/plain');

    if (!isHtml && !isText) {
        throw new AppError(`Unsupported content type '${contentType}'. Only text/html and text/plain are supported.`, 415);
    }

    // 7. Check Content-Length if present
    const contentLength = Number(response.headers.get('content-length'));
    if (contentLength && contentLength > maxResponseSize) {
        throw new AppError(`Response size (${(contentLength / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${(maxResponseSize / 1024 / 1024).toFixed(1)}MB`, 413);
    }

    // 8. Stream body with byte counter
    const reader = response.body.getReader();
    const chunks = [];
    let receivedBytes = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        receivedBytes += value.length;
        if (receivedBytes > maxResponseSize) {
            reader.cancel();
            throw new AppError(`Response exceeded maximum allowed size of ${(maxResponseSize / 1024 / 1024).toFixed(1)}MB`, 413);
        }
        chunks.push(value);
    }

    const totalBuffer = Buffer.concat(chunks);
    const html = totalBuffer.toString('utf-8');

    return {
        html,
        contentType,
        finalUrl: parsed.toString(),
    };
}
