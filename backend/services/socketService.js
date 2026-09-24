import { Server } from 'socket.io';
import Notification from '../models/Notification.js';

let io = null;
const userSockets = new Map(); // userId -> set of socketIds

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('register', (userId) => {
      if (!userId) return;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      socket.userId = userId;
      console.log(`[Socket.IO] User ${userId} registered to socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const createAndEmitNotification = async ({ recipient, title, message, link, type }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      link: link || '',
      type: type || 'INFO',
      read: false
    });

    if (io && recipient) {
      const recipientStr = recipient.toString();
      const socketIds = userSockets.get(recipientStr);
      if (socketIds && socketIds.size > 0) {
        socketIds.forEach((socketId) => {
          io.to(socketId).emit('notification', notification);
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('[SocketService Error]: Failed to create/emit notification:', error.message);
  }
};
