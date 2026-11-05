const ContactMessage = require('../models/contactMessageModel');

const createContactMessage = async (req, res) => {
  const { message } = req.body;
  if (typeof message !== 'string' || !message.trim() || message.trim().length > 5000) {
    return res.status(400).json({ message: 'Enter a message no longer than 5000 characters.' });
  }

  const contactMessage = await ContactMessage.create({
    name: req.user.name,
    email: req.user.email,
    message: message.trim(),
    user: req.user._id,
  });
  res.status(201).json({ message: 'Your message has been sent to the PHONE KH team.', contactMessage });
};

const getMyContactMessages = async (req, res) => {
  await ContactMessage.updateMany(
    { user: req.user._id, 'replies.0': { $exists: true }, customerReadAt: null },
    { $set: { customerReadAt: new Date() } }
  );
  const messages = await ContactMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(messages);
};

const getContactMessages = async (_req, res) => {
  const messages = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
  res.json(messages);
};

const markContactMessageRead = async (req, res) => {
  const message = await ContactMessage.findOneAndUpdate(
    { _id: req.params.id, status: 'New' },
    { status: 'Read' },
    { new: true, runValidators: true }
  );
  if (!message) {
    const existing = await ContactMessage.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Contact message not found.' });
    return res.json(existing);
  }
  res.json(message);
};

const replyToContactMessage = async (req, res) => {
  const { body } = req.body;
  if (typeof body !== 'string' || !body.trim() || body.trim().length > 5000) {
    return res.status(400).json({ message: 'Enter a reply no longer than 5000 characters.' });
  }
  const message = await ContactMessage.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Contact message not found.' });
  if (!message.user) return res.status(409).json({ message: 'This message is not linked to a customer account.' });
  message.replies.push({ body: body.trim(), authorRole: 'admin' });
  message.status = 'Replied';
  message.customerReadAt = null;
  await message.save();
  res.json(message);
};

const replyToMyContactMessage = async (req, res) => {
  const { body } = req.body;
  if (typeof body !== 'string' || !body.trim() || body.trim().length > 5000) {
    return res.status(400).json({ message: 'Enter a reply no longer than 5000 characters.' });
  }
  const message = await ContactMessage.findOne({ _id: req.params.id, user: req.user._id });
  if (!message) return res.status(404).json({ message: 'Contact message not found.' });
  message.replies.push({ body: body.trim(), authorRole: 'customer' });
  message.status = 'New';
  await message.save();
  res.json(message);
};

const deleteContactMessage = async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) return res.status(404).json({ message: 'Contact message not found.' });
  res.json({ message: 'Contact message deleted.' });
};

module.exports = {
  createContactMessage,
  deleteContactMessage,
  getContactMessages,
  getMyContactMessages,
  markContactMessageRead,
  replyToContactMessage,
  replyToMyContactMessage,
};
