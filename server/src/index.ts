import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { StatusCodes } from 'http-status-codes';
import apiRouter from './routes/api.js';
import { authService } from './services/auth.js';
import { matchmaking } from './services/matchmaking.js';
import { GameSession } from './services/gameSession.js';
import { MatchTicket, QueueType } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const playerSockets = new Map<string, string>();
const activeSessions = new Map<string, GameSession>();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string') {
    return next(new Error('UNAUTHORIZED'));
  }
  const verified = authService.verifyToken(token);
  if (!verified) {
    return next(new Error('UNAUTHORIZED'));
  }
  socket.data.playerId = verified.player.id;
  socket.data.accountId = verified.account.id;
  return next();
});

io.on('connection', (socket) => {
  const playerId = socket.data.playerId as string;
  playerSockets.set(playerId, socket.id);
  socket.join(playerId);

  socket.emit('session:ready', { playerId });

  socket.on('queue:join', (payload: { queue: QueueType }) => {
    const queue = payload?.queue ?? 'casual';
    const ticket: MatchTicket = {
      playerId,
      queue,
      enqueuedAt: Date.now()
    };
    const pairing = matchmaking.enqueue(ticket);
    if (pairing) {
      const sessionId = `${pairing.ticketA.playerId}-${pairing.ticketB.playerId}-${Date.now()}`;
      const session = new GameSession(io, pairing, playerSockets, (result) => {
        activeSessions.delete(sessionId);
        io.to(pairing.ticketA.playerId).emit('session:summary', result);
        io.to(pairing.ticketB.playerId).emit('session:summary', result);
      });
      activeSessions.set(sessionId, session);
      session.start();
    }
  });

  socket.on('queue:leave', (payload: { queue: QueueType }) => {
    const queue = payload?.queue ?? 'casual';
    matchmaking.remove(playerId, queue);
  });

  socket.on('disconnect', () => {
    matchmaking.remove(playerId, 'casual');
    matchmaking.remove(playerId, 'ranked');
    playerSockets.delete(playerId);
  });
});

app.use((_req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ error: 'Not Found' });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(PORT, () => {
  console.log(`FloppyDuck Arena server running on port ${PORT}`);
});
