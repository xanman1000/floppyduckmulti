import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { defaultSeason } from '../config.js';
import { AccountRecord, PlayerAccount, SeasonConfig } from '../types.js';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data/floppyduck.db');

function resolveDatabasePath(): string {
  const configured = process.env.DB_PATH;
  if (configured && configured.trim().length > 0) {
    return path.resolve(configured);
  }
  return DEFAULT_DB_PATH;
}

const databasePath = resolveDatabasePath();
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

type SeasonRow = {
  id: string;
  name: string;
  startAt: number;
  endAt: number;
  rewards: string;
  createdAt: number;
  updatedAt: number;
  isActive: number;
};

type PlayerRow = {
  id: string;
  displayName: string;
  mmr: number;
  xp: number;
  level: number;
  currencies: string;
  cosmetics: string;
  loadout: string;
  stats: string;
  createdAt: number;
  updatedAt: number;
};

type AccountRow = {
  id: string;
  playerId: string;
  email: string | null;
  passwordHash: string | null;
  isGuest: number;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
};

const createTablesSql = `
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  displayName TEXT NOT NULL,
  mmr INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  level INTEGER NOT NULL,
  currencies TEXT NOT NULL,
  cosmetics TEXT NOT NULL,
  loadout TEXT NOT NULL,
  stats TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  startAt INTEGER NOT NULL,
  endAt INTEGER NOT NULL,
  rewards TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  playerId TEXT NOT NULL,
  email TEXT UNIQUE,
  passwordHash TEXT,
  isGuest INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  lastLoginAt INTEGER,
  FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
`;

db.exec(createTablesSql);

const activeSeason = db.prepare<[], SeasonRow | undefined>(
  'SELECT * FROM seasons WHERE isActive = 1 LIMIT 1'
);

const insertSeason = db.prepare<SeasonRow>(
  `INSERT INTO seasons (id, name, startAt, endAt, rewards, createdAt, updatedAt, isActive)
   VALUES (@id, @name, @startAt, @endAt, @rewards, @createdAt, @updatedAt, @isActive)`
);

const insertAccount = db.prepare<AccountRow>(
  `INSERT INTO accounts (id, playerId, email, passwordHash, isGuest, createdAt, updatedAt, lastLoginAt)
   VALUES (@id, @playerId, @email, @passwordHash, @isGuest, @createdAt, @updatedAt, @lastLoginAt)`
);

const getAccountByEmailStmt = db.prepare<[string], AccountRow | undefined>(
  'SELECT * FROM accounts WHERE email = ?'
);

const getAccountByIdStmt = db.prepare<[string], AccountRow | undefined>(
  'SELECT * FROM accounts WHERE id = ?'
);

const getAccountByPlayerIdStmt = db.prepare<[string], AccountRow | undefined>(
  'SELECT * FROM accounts WHERE playerId = ?'
);

const updateAccountStmt = db.prepare<AccountRow>(
  `UPDATE accounts SET
    email = @email,
    passwordHash = @passwordHash,
    isGuest = @isGuest,
    updatedAt = @updatedAt,
    lastLoginAt = @lastLoginAt
   WHERE id = @id`
);

function mapSeasonRow(row: SeasonRow): SeasonConfig {
  return {
    id: row.id,
    name: row.name,
    startAt: row.startAt,
    endAt: row.endAt,
    rewards: JSON.parse(row.rewards)
  };
}

function ensureSeason(): SeasonConfig {
  const existing = activeSeason.get();
  if (existing) {
    return mapSeasonRow(existing);
  }

  const now = Date.now();
  const seasonRow: SeasonRow = {
    id: defaultSeason.id,
    name: defaultSeason.name,
    startAt: defaultSeason.startAt,
    endAt: defaultSeason.endAt,
    rewards: JSON.stringify(defaultSeason.rewards),
    createdAt: now,
    updatedAt: now,
    isActive: 1
  };
  insertSeason.run(seasonRow);
  return defaultSeason;
}

export function getActiveSeason(): SeasonConfig {
  return ensureSeason();
}

export function mapPlayerRow(row: PlayerRow): PlayerAccount {
  return {
    id: row.id,
    displayName: row.displayName,
    mmr: row.mmr,
    xp: row.xp,
    level: row.level,
    currencies: JSON.parse(row.currencies) as PlayerAccount['currencies'],
    cosmetics: JSON.parse(row.cosmetics) as PlayerAccount['cosmetics'],
    loadout: JSON.parse(row.loadout) as PlayerAccount['loadout'],
    stats: JSON.parse(row.stats) as PlayerAccount['stats'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  } as PlayerAccount;
}

function mapAccountRow(row: AccountRow): AccountRecord {
  return {
    id: row.id,
    playerId: row.playerId,
    email: row.email,
    passwordHash: row.passwordHash,
    isGuest: row.isGuest === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastLoginAt: row.lastLoginAt ?? null
  };
}

function toAccountRow(record: AccountRecord): AccountRow {
  return {
    id: record.id,
    playerId: record.playerId,
    email: record.email ? record.email.toLowerCase() : null,
    passwordHash: record.passwordHash ?? null,
    isGuest: record.isGuest ? 1 : 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastLoginAt: record.lastLoginAt ?? null
  };
}

export function insertAccountRecord(record: AccountRecord): void {
  insertAccount.run(toAccountRow(record));
}

export function updateAccountRecord(record: AccountRecord): void {
  updateAccountStmt.run(toAccountRow(record));
}

export function getAccountByEmail(email: string): AccountRecord | undefined {
  const row = getAccountByEmailStmt.get(email.toLowerCase());
  return row ? mapAccountRow(row) : undefined;
}

export function getAccountById(id: string): AccountRecord | undefined {
  const row = getAccountByIdStmt.get(id);
  return row ? mapAccountRow(row) : undefined;
}

export function getAccountByPlayerId(playerId: string): AccountRecord | undefined {
  const row = getAccountByPlayerIdStmt.get(playerId);
  return row ? mapAccountRow(row) : undefined;
}

export type { PlayerRow };
