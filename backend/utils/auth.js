const crypto = require('crypto');
const User = require('../models/userModel');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createPassword = (password) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve({ salt, hash: derivedKey.toString('hex') });
    });
  });

const verifyPassword = (password, salt, expectedHash) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      const expected = Buffer.from(expectedHash, 'hex');
      const actual = derivedKey;
      resolve(expected.length === actual.length && crypto.timingSafeEqual(expected, actual));
    });
  });

const createSession = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  if (!user.sessions) user.sessions = [];
  user.sessions.push({ tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 86400000) });
  await user.save();
  return token;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const tokenHash = hashToken(token);
    const user = await User.findOne({ 'sessions.tokenHash': tokenHash }).select('+sessions');
    const session = user?.sessions.find(
      (item) => item.tokenHash === tokenHash && item.expiresAt > new Date()
    );
    if (!session) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    req.user = user;
    req.sessionTokenHash = tokenHash;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = (req, res, next) => {
  if (!req.get('authorization')) return next();
  return requireAuth(req, res, next);
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' });
  next();
};

module.exports = { createPassword, createSession, hashToken, optionalAuth, requireAdmin, requireAuth, verifyPassword };
