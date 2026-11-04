const crypto = require('crypto');
const User = require('../models/userModel');
const Coupon = require('../models/couponModel');
const { createPassword, createSession, verifyPassword } = require('../utils/auth');

const maxProfileImageBytes = 1024 * 1024;
const profileImagePattern = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  profileImage: user.profileImage || '',
  welcomeCouponCode: user.welcomeCouponCode || '',
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
  let user;
  try {
    const couponCode = `WELCOME-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone).trim(),
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt,
      welcomeCouponCode: couponCode,
    });
    await Coupon.create({
      code: couponCode,
      discountAmount: 50,
      minimumSubtotal: 500,
      owner: user._id,
      maxUses: 2,
      active: true,
    });
    const token = await createSession(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    if (user) {
      await Promise.all([
        Coupon.deleteOne({ owner: user._id }),
        User.deleteOne({ _id: user._id }),
      ]);
    }
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
  res.json({ token, user: publicUser(user) });
};

const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

const updateProfile = async (req, res) => {
  const { profileImage } = req.body;
  if (typeof profileImage !== 'string') {
    return res.status(400).json({ message: 'A profile image value is required.' });
  }
  if (profileImage) {
    const match = profileImagePattern.exec(profileImage);
    if (!match || Buffer.from(match[2], 'base64').length > maxProfileImageBytes) {
      return res.status(400).json({ message: 'Upload a JPEG, PNG, or WebP profile image no larger than 1 MB.' });
    }
  }
  req.user.profileImage = profileImage;
  await req.user.save();
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

module.exports = { getMe, login, logout, publicUser, register, seedAdmin, updateProfile };
