const User = require('../models/userModel');
const { publicUser } = require('./authController');

const getUsers = async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  res.json(users.map((user) => publicUser(user)));
};

const updateUserRole = async (req, res) => {
  if (!['customer', 'admin'].includes(req.body.role)) {
    return res.status(400).json({ message: 'Role must be customer or admin.' });
  }
  if (String(req.user._id) === req.params.id && req.body.role !== 'admin') {
    return res.status(400).json({ message: 'You cannot remove your own administrator access.' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json(publicUser(user));
};

module.exports = { getUsers, updateUserRole };
