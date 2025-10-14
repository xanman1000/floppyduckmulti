import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import {
  getAccountByEmail,
  getAccountById,
  getAccountByPlayerId,
  insertAccountRecord,
  updateAccountRecord
} from '../db/database.js';
import { authConfig } from '../config.js';
import { AccountRecord, AuthTokenClaims, PlayerAccount } from '../types.js';
import { dataStore } from './dataStore.js';

interface AuthResult {
  token: string;
  player: PlayerAccount;
  account: AccountRecord;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function issueToken(account: AccountRecord): string {
  const payload: AuthTokenClaims = {
    accountId: account.id,
    playerId: account.playerId,
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, authConfig.jwtSecret, { expiresIn: authConfig.tokenTtl });
}

function ensurePlayer(account: AccountRecord): PlayerAccount {
  const player = dataStore.getPlayer(account.playerId);
  if (!player) {
    throw new Error('PLAYER_NOT_FOUND');
  }
  return player;
}

class AuthService {
  register(email: string, password: string, displayName: string): AuthResult {
    const normalizedEmail = normalizeEmail(email);
    const existing = getAccountByEmail(normalizedEmail);
    if (existing) {
      throw new Error('EMAIL_IN_USE');
    }
    const now = Date.now();
    const passwordHash = bcrypt.hashSync(password, 12);
    const player = dataStore.createPlayerProfile(displayName.trim(), uuid());
    const account: AccountRecord = {
      id: uuid(),
      playerId: player.id,
      email: normalizedEmail,
      passwordHash,
      isGuest: false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };
    insertAccountRecord(account);
    return { token: issueToken(account), player, account };
  }

  login(email: string, password: string): AuthResult {
    const normalizedEmail = normalizeEmail(email);
    const account = getAccountByEmail(normalizedEmail);
    if (!account || !account.passwordHash) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const matches = bcrypt.compareSync(password, account.passwordHash);
    if (!matches) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const player = ensurePlayer(account);
    const now = Date.now();
    const updatedAccount: AccountRecord = { ...account, updatedAt: now, lastLoginAt: now };
    updateAccountRecord(updatedAccount);
    return { token: issueToken(updatedAccount), player, account: updatedAccount };
  }

  createGuest(displayName?: string): AuthResult {
    const player = dataStore.createGuest(displayName);
    const now = Date.now();
    const account: AccountRecord = {
      id: uuid(),
      playerId: player.id,
      email: null,
      passwordHash: null,
      isGuest: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };
    insertAccountRecord(account);
    return { token: issueToken(account), player, account };
  }

  verifyToken(token: string): { account: AccountRecord; player: PlayerAccount } | null {
    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret) as AuthTokenClaims;
      if (!decoded?.accountId || !decoded?.playerId) {
        return null;
      }
      const account = getAccountById(decoded.accountId);
      if (!account || account.playerId !== decoded.playerId) {
        return null;
      }
      const player = ensurePlayer(account);
      return { account, player };
    } catch (err) {
      return null;
    }
  }

  promoteGuest(accountId: string, email: string, password: string): AuthResult {
    const account = getAccountById(accountId);
    if (!account) {
      throw new Error('ACCOUNT_NOT_FOUND');
    }
    if (!account.isGuest) {
      throw new Error('ALREADY_REGISTERED');
    }
    const normalizedEmail = normalizeEmail(email);
    const existing = getAccountByEmail(normalizedEmail);
    if (existing) {
      throw new Error('EMAIL_IN_USE');
    }
    const passwordHash = bcrypt.hashSync(password, 12);
    const now = Date.now();
    const updated: AccountRecord = {
      ...account,
      email: normalizedEmail,
      passwordHash,
      isGuest: false,
      updatedAt: now,
      lastLoginAt: now
    };
    updateAccountRecord(updated);
    const player = ensurePlayer(updated);
    return { token: issueToken(updated), player, account: updated };
  }

  getAccountForPlayer(playerId: string): AccountRecord | null {
    const account = getAccountByPlayerId(playerId);
    return account ?? null;
  }
}

export const authService = new AuthService();
