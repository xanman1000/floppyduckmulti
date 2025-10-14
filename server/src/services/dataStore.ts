import { v4 as uuid } from 'uuid';
import { db, getActiveSeason, mapPlayerRow, PlayerRow } from '../db/database.js';
import { PlayerAccount, PlayerLoadout, PlayerStats, SeasonConfig } from '../types.js';

const insertPlayer = db.prepare<PlayerRow>(
  `INSERT INTO players (
    id, displayName, mmr, xp, level, currencies, cosmetics, loadout, stats, createdAt, updatedAt
  ) VALUES (
    @id, @displayName, @mmr, @xp, @level, @currencies, @cosmetics, @loadout, @stats, @createdAt, @updatedAt
  )`
);

const getPlayerStmt = db.prepare<[string], PlayerRow | undefined>(
  'SELECT * FROM players WHERE id = ?'
);

const updatePlayerStmt = db.prepare<PlayerRow>(
  `UPDATE players SET
    displayName = @displayName,
    mmr = @mmr,
    xp = @xp,
    level = @level,
    currencies = @currencies,
    cosmetics = @cosmetics,
    loadout = @loadout,
    stats = @stats,
    updatedAt = @updatedAt
  WHERE id = @id`
);

class DataStore {
  createPlayerProfile(displayName: string, overrideId?: string): PlayerAccount {
    const id = overrideId ?? uuid();
    const timestamp = Date.now();
    const loadout: PlayerLoadout = {
      skin: 'default_duck',
      trail: 'classic',
      theme: 'daylight',
      emote: 'wave',
      powerUps: ['shield', 'slowMo']
    };
    const stats: PlayerStats = {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      bestSoloScore: 0,
      bestMultiplayerScore: 0
    };
    const player: PlayerAccount = {
      id,
      displayName,
      mmr: 1000,
      xp: 0,
      level: 1,
      currencies: { feathers: 500, goldenEggs: 0 },
      cosmetics: {
        skins: ['default_duck'],
        trails: ['classic'],
        themes: ['daylight', 'dusk'],
        emotes: ['wave', 'victory']
      },
      loadout,
      stats,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    insertPlayer.run({
      id: player.id,
      displayName: player.displayName,
      mmr: player.mmr,
      xp: player.xp,
      level: player.level,
      currencies: JSON.stringify(player.currencies),
      cosmetics: JSON.stringify(player.cosmetics),
      loadout: JSON.stringify(player.loadout),
      stats: JSON.stringify(player.stats),
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    });

    return player;
  }

  createGuest(displayName?: string): PlayerAccount {
    const name = displayName && displayName.trim().length > 0 ? displayName : undefined;
    const generatedId = uuid();
    return this.createPlayerProfile(name ?? `Duck_${generatedId.slice(0, 5)}`, generatedId);
  }

  getPlayer(id: string): PlayerAccount | undefined {
    const row = getPlayerStmt.get(id);
    if (!row) {
      return undefined;
    }
    return mapPlayerRow(row);
  }

  updatePlayer(player: PlayerAccount): void {
    const updatedAt = Date.now();
    const nextRow: PlayerRow = {
      id: player.id,
      displayName: player.displayName,
      mmr: player.mmr,
      xp: player.xp,
      level: player.level,
      currencies: JSON.stringify(player.currencies),
      cosmetics: JSON.stringify(player.cosmetics),
      loadout: JSON.stringify(player.loadout),
      stats: JSON.stringify(player.stats),
      createdAt: player.createdAt,
      updatedAt
    };
    updatePlayerStmt.run(nextRow);
    player.updatedAt = updatedAt;
  }

  getSeason(): SeasonConfig {
    return getActiveSeason();
  }
}

export const dataStore = new DataStore();
