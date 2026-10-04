import dns from 'dns/promises';
import net from 'net';
import AppError from '../errors/AppError.js';

/**
 * Normalizes a URL:
 * - Trims whitespace
 * - Ensures protocol is lowercase
 * - Ensures hostname is lowercase
 * - Strips fragment identifier (#...)
 * - Normalizes trailing slash for root paths
 * - Removes default ports (:80, :443)
 */
export function normalizeUrl(rawUrl) {
    if (typeof rawUrl !== 'string') {
        throw new AppError('URL must be a string', 400);
    }

    const trimmed = rawUrl.trim();
    if (!trimmed) {
        throw new AppError('URL is required', 400);
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new AppError('Invalid URL format', 400);
    }

    // Only allow http: and https: protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new AppError('Unsupported protocol. Only http:// and https:// URLs are allowed', 400);
    }

    // Remove fragment
    parsed.hash = '';

    // Remove default ports
    if ((parsed.protocol === 'http:' && parsed.port === '80') ||
        (parsed.protocol === 'https:' && parsed.port === '443')) {
        parsed.port = '';
    }

    // If pathname is empty or just '/', ensure consistent trailing slash handling
    let normalized = parsed.toString();
    // URL() keeps trailing slash on root (e.g., https://example.com/); remove trailing slash if path is empty
    if (parsed.pathname === '/' && !parsed.search) {
        normalized = `${parsed.protocol}//${parsed.host}`;
    }

    return normalized;
}

/**
 * Validates a URL synchronously at the API boundary:
 * - Checks format and protocol
 * - Rejects non-HTTP(S) protocols
 * - Rejects localhost and internal hostname patterns
 */
export function validateUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
        throw new AppError('URL is required', 400);
    }

    const trimmed = rawUrl.trim();

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new AppError('Malformed URL provided', 400);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new AppError(`Unsupported protocol '${parsed.protocol}'. Only http: and https: are allowed.`, 400);
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) {
        throw new AppError('URL must include a valid hostname', 400);
    }

    // Reject localhost / loopback / obvious internal hostnames
    if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        hostname === '0.0.0.0' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]'
    ) {
        throw new AppError('Access to localhost or private network addresses is forbidden', 400);
    }

    // If hostname is directly an IP address, check it synchronously
    if (net.isIP(hostname)) {
        if (isPrivateIp(hostname)) {
            throw new AppError('Access to internal or private IP addresses is forbidden', 400);
        }
    }

    return parsed;
}

/**
 * Checks whether an IP address belongs to private/reserved/internal ranges.
 * Covers:
 * - IPv4:
 *   - 0.0.0.0/8 (Current network)
 *   - 10.0.0.0/8 (Private)
 *   - 127.0.0.0/8 (Loopback)
 *   - 169.254.0.0/16 (Link-local)
 *   - 172.16.0.0/12 (Private)
 *   - 192.168.0.0/16 (Private)
 *   - 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (TEST-NET)
 *   - 224.0.0.0/4 (Multicast)
 *   - 240.0.0.0/4 (Reserved)
 * - IPv6:
 *   - ::1 (Loopback)
 *   - :: (Unspecified)
 *   - fc00::/7 (Unique local address / private)
 *   - fe80::/10 (Link-local)
 *   - ::ffff:0:0/96 (IPv4-mapped IPv6)
 */
export function isPrivateIp(ip) {
    if (!ip) return true;

    // IPv4 check
    if (net.isIPv4(ip)) {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
            return true;
        }

        const [a, b] = parts;

        if (a === 0) return true;                           // 0.0.0.0/8
        if (a === 10) return true;                          // 10.0.0.0/8
        if (a === 127) return true;                         // 127.0.0.0/8
        if (a === 169 && b === 254) return true;           // 169.254.0.0/16 (link-local)
        if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
        if (a === 192 && b === 168) return true;           // 192.168.0.0/16
        if (a >= 224) return true;                         // Multicast & reserved (224.0.0.0/4, 240.0.0.0/4)

        return false;
    }

    // IPv6 check
    if (net.isIPv6(ip)) {
        const normalized = ip.toLowerCase();

        // Loopback and unspecified
        if (normalized === '::1' || normalized === '::') return true;

        // IPv4-mapped IPv6 (::ffff:127.0.0.1)
        if (normalized.startsWith('::ffff:')) {
            const ipv4Part = normalized.replace('::ffff:', '');
            if (net.isIPv4(ipv4Part)) {
                return isPrivateIp(ipv4Part);
            }
        }

        // Unique local address (fc00::/7 -> starts with fc or fd)
        if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

        // Link-local address (fe80::/10 -> starts with fe8, fe9, fea, feb)
        if (/^fe[89ab]/i.test(normalized)) return true;

        return false;
    }

    return true; // Unknown address format is considered unsafe
}

/**
 * Resolves a hostname via DNS and verifies that none of its resolved addresses
 * point to private, loopback, or reserved IP ranges.
 * Throws AppError(400) if any resolved IP is private.
 */
export async function checkSsrfSafe(hostname) {
    if (!hostname) {
        throw new AppError('Hostname is required for security verification', 400);
    }

    // Clean brackets around IPv6 literal if present
    const cleanHost = hostname.replace(/^\[|\]$/g, '');

    // If it's already an IP address
    if (net.isIP(cleanHost)) {
        if (isPrivateIp(cleanHost)) {
            throw new AppError(`Destination IP ${cleanHost} is blocked by SSRF protection`, 400);
        }
        return;
    }

    try {
        const addresses = await dns.lookup(cleanHost, { all: true });

        if (!addresses || addresses.length === 0) {
            throw new AppError(`DNS lookup failed for hostname: ${cleanHost}`, 400);
        }

        for (const { address } of addresses) {
            if (isPrivateIp(address)) {
                throw new AppError(
                    `Destination hostname '${cleanHost}' resolves to private/internal IP address (${address}), which is blocked`,
                    400
                );
            }
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Failed to resolve host '${cleanHost}': ${err.message}`, 400);
    }
}
