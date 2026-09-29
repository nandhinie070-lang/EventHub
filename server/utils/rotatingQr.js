const crypto = require('crypto');
const qrcode = require('qrcode');

const JWT_SECRET = process.env.JWT_SECRET || 'eventhub_jwt_secret_key_2026';
const WINDOW_DURATION_MS = 30000; // 30 seconds

/**
 * Generate a rotating time-based token for a ticket code
 * @param {string} ticketCode
 * @param {number} timestamp
 * @returns {Object}
 */
const generateRotatingToken = (ticketCode, timestamp = Date.now()) => {
  const windowIndex = Math.floor(timestamp / WINDOW_DURATION_MS);
  const timeIntoWindow = timestamp % WINDOW_DURATION_MS;
  const remainingMs = WINDOW_DURATION_MS - timeIntoWindow;
  const expiresInSeconds = Math.ceil(remainingMs / 1000);

  const hash = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${ticketCode}:${windowIndex}`)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  const token = `RQR-${ticketCode}-${windowIndex}-${hash}`;

  return {
    token,
    ticketCode,
    windowIndex,
    expiresInSeconds,
    expiresInMs: remainingMs
  };
};

/**
 * Verify a rotating QR token
 * @param {string} token - The scanned rotating token string
 * @param {string} ticketCode - Expected ticketCode
 * @param {number} timestamp - Current timestamp
 * @returns {Object} { isValid: boolean, error: string|null, code: string }
 */
const verifyRotatingToken = (token, ticketCode, timestamp = Date.now()) => {
  if (!token || typeof token !== 'string') {
    return { isValid: false, error: 'Empty token supplied.' };
  }

  // If token is just the standard static ticketCode (legacy compatibility if enabled)
  if (!token.startsWith('RQR-')) {
    return {
      isValid: token.trim().toUpperCase() === ticketCode.trim().toUpperCase(),
      error: token.trim().toUpperCase() === ticketCode.trim().toUpperCase() ? null : 'Mismatched ticket code.',
      code: ticketCode
    };
  }

  // Token format: RQR-{ticketCode}-{windowIndex}-{hash}
  const parts = token.split('-');
  if (parts.length < 5) {
    return { isValid: false, error: 'Malformed rotating token format.' };
  }

  // ticketCode might be EH-2026-XXXX (which contains hyphens)
  // Format: RQR - EH - 2026 - XXXX - windowIndex - hash
  const hash = parts[parts.length - 1];
  const tokenWindow = parseInt(parts[parts.length - 2], 10);
  const extractedCode = parts.slice(1, parts.length - 2).join('-');

  if (isNaN(tokenWindow)) {
    return { isValid: false, error: 'Invalid time window format.' };
  }

  if (extractedCode.toUpperCase() !== ticketCode.toUpperCase()) {
    return { isValid: false, error: 'Token belongs to a different ticket pass.' };
  }

  const currentWindow = Math.floor(timestamp / WINDOW_DURATION_MS);

  // Allow current window OR previous window (grace period for scanner latency)
  if (tokenWindow < currentWindow - 1) {
    return {
      isValid: false,
      isExpired: true,
      error: 'Rotating QR code has expired. Screenshots are strictly disallowed. Please ask the attendee to present their live rotating pass.'
    };
  }

  if (tokenWindow > currentWindow + 1) {
    return { isValid: false, error: 'Token timestamp is in the future. Check system clock.' };
  }

  // Verify HMAC hash for tokenWindow
  const expectedHash = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${extractedCode}:${tokenWindow}`)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  if (hash !== expectedHash) {
    return { isValid: false, error: 'Security signature mismatch. Invalid rotating token.' };
  }

  return { isValid: true, error: null, code: extractedCode };
};

/**
 * Generate QR code data URL for rotating token
 * @param {string} token
 * @returns {Promise<string>}
 */
const generateRotatingQrDataUrl = async (tokenPayload) => {
  return await qrcode.toDataURL(tokenPayload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 280,
    color: {
      dark: '#312e81',
      light: '#ffffff'
    }
  });
};

module.exports = {
  generateRotatingToken,
  verifyRotatingToken,
  generateRotatingQrDataUrl,
  WINDOW_DURATION_MS
};
