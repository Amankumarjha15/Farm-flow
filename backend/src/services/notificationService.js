const Notification = require('../models/Notification');

/**
 * Creates a notification record and emits it in real time to the target user's socket room.
 * @param {import('express').Request} req - needed to access req.app.get('io')
 * @param {{userId: string, type: string, title: string, message: string, link?: string, relatedOrder?: string}} payload
 */
const notify = async (req, { userId, type, title, message, link, relatedOrder }) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
    relatedOrder,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(String(userId)).emit('notification', notification);
  }

  return notification;
};

/** Notify many users at once (e.g. all eligible logistics partners) */
const notifyMany = async (req, userIds, payload) => {
  await Promise.all(userIds.map((userId) => notify(req, { ...payload, userId })));
};

module.exports = { notify, notifyMany };
