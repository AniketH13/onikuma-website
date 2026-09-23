import express from 'express';
import crypto from 'crypto';

const router = express.Router();

function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'onikuma2026',
    secret: process.env.JWT_SECRET || 'onikuma_nepal_secret_key_2026'
  };
}

// Generate token: payload + "." + signature
function generateToken(username) {
  const { secret } = getAdminCredentials();
  const payload = Buffer.from(JSON.stringify({
    username,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

// Verify token
function verifyToken(token) {
  if (!token) return null;
  const { secret } = getAdminCredentials();
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null; // expired
    return payload;
  } catch (err) {
    return null;
  }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const creds = getAdminCredentials();

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    if (username !== creds.username || password !== creds.password) {
      return res.status(401).json({ success: false, message: 'Invalid Admin ID or Password' });
    }

    const token = generateToken(username);
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { username }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, valid: false, message: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ success: false, valid: false, message: 'Session expired or invalid token' });
    }

    return res.json({
      success: true,
      valid: true,
      user: { username: payload.username }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
