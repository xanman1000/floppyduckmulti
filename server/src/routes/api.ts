import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.js';
import { dataStore } from '../services/dataStore.js';
import { recordSoloScore } from '../services/progression.js';
import type { AccountRecord, PlayerAccount } from '../types.js';

const router = Router();

interface AuthenticatedRequest extends Request {
  auth?: {
    account: AccountRecord;
    player: PlayerAccount;
  };
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const verified = authService.verifyToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.auth = verified;
  return next();
}

function serializeAuthResponse(result: { token: string; player: PlayerAccount; account: AccountRecord }) {
  return {
    token: result.token,
    player: result.player,
    account: {
      id: result.account.id,
      email: result.account.email,
      isGuest: result.account.isGuest,
      lastLoginAt: result.account.lastLoginAt
    }
  };
}

router.post('/auth/guest', (req, res) => {
  const schema = z.object({ displayName: z.string().min(2).max(16).optional() });
  const parse = schema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  try {
    const result = authService.createGuest(parse.data.displayName);
    return res.json(serializeAuthResponse(result));
  } catch (err) {
    return res.status(500).json({ error: 'Unable to create guest' });
  }
});

router.post('/auth/register', (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(2).max(16)
  });
  const parse = schema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  try {
    const result = authService.register(parse.data.email, parse.data.password, parse.data.displayName);
    return res.status(201).json(serializeAuthResponse(result));
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_IN_USE') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    return res.status(500).json({ error: 'Unable to register account' });
  }
});

router.post('/auth/login', (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
  const parse = schema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  try {
    const result = authService.login(parse.data.email, parse.data.password);
    return res.json(serializeAuthResponse(result));
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(500).json({ error: 'Unable to login' });
  }
});

router.post('/auth/upgrade', requireAuth, (req: AuthenticatedRequest, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
  const parse = schema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  const account = req.auth?.account;
  if (!account) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = authService.promoteGuest(account.id, parse.data.email, parse.data.password);
    return res.json(serializeAuthResponse(result));
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'ALREADY_REGISTERED') {
        return res.status(400).json({ error: 'Account already registered' });
      }
      if (err.message === 'EMAIL_IN_USE') {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }
    return res.status(500).json({ error: 'Unable to upgrade guest account' });
  }
});

router.get('/auth/session', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json(serializeAuthResponse({
    token: extractBearerToken(req)!,
    player: req.auth.player,
    account: req.auth.account
  }));
});

router.get('/profile/:playerId', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.auth || req.params.playerId !== req.auth.player.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json({ player: req.auth.player });
});

router.post('/profile/:playerId/loadout', requireAuth, (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    skin: z.string(),
    trail: z.string(),
    theme: z.string(),
    emote: z.string(),
    powerUps: z.array(z.enum(['shield', 'slowMo'])).max(2)
  });
  const parse = schema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  if (!req.auth || req.params.playerId !== req.auth.player.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const player = { ...req.auth.player, loadout: parse.data };
  dataStore.updatePlayer(player);
  req.auth.player = player;
  res.json({ player });
});

router.post('/solo/:playerId/score', requireAuth, (req: AuthenticatedRequest, res) => {
  const schema = z.object({ score: z.number().int().nonnegative() });
  const parse = schema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  if (!req.auth || req.params.playerId !== req.auth.player.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  recordSoloScore(req.params.playerId, parse.data.score);
  const player = dataStore.getPlayer(req.params.playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  req.auth.player = player;
  return res.json({ player });
});

router.get('/season', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ season: dataStore.getSeason() });
});

export default router;
