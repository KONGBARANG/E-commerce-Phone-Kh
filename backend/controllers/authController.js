const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const { createPassword, createSession, hashToken, verifyPassword } = require('../utils/auth');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const register = async (req, res) => {
  const { name, email, phone = '', password } = req.body;
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Enter a valid name and email address.' });
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be between 6 and 128 characters.' });
  }
  const credentials = await createPassword(password);
  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone).trim(),
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt,
    });
    const token = await createSession(user);
    const guestCartToken = req.get('x-cart-token');
    if (guestCartToken) {
      await Cart.updateOne({ tokenHash: hashToken(guestCartToken) }, { $set: { user: user._id } });
    }
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    throw error;
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select('+passwordHash +passwordSalt +sessions');
  if (!user || !(await verifyPassword(password, user.passwordSalt, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  const token = await createSession(user);
  const guestCartToken = req.get('x-cart-token');
  if (guestCartToken) {
    await Cart.updateOne({ tokenHash: hashToken(guestCartToken) }, { $set: { user: user._id } });
  }
  res.json({ token, user: publicUser(user) });
};

const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

const logout = async (req, res) => {
  req.user.sessions = req.user.sessions.filter((session) => session.tokenHash !== req.sessionTokenHash);
  await req.user.save();
  res.json({ message: 'Signed out.' });
};

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  let admin = await User.findOne({ email });
  if (!admin) {
    const credentials = await createPassword(password);
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'PHONE KH Admin',
      email,
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt,
      role: 'admin',
    });
    console.log(`Initial administrator created: ${email}`);
  } else if (admin.role !== 'admin') {
    throw new Error(
      `ADMIN_EMAIL ${email} already belongs to a customer. Promote that user directly in MongoDB or configure an unused ADMIN_EMAIL.`
    );
  }
};

module.exports = { getMe, login, logout, publicUser, register, seedAdmin };
