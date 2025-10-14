import { dataStore } from './dataStore.js';
import { PlayerAccount, RewardGrant, GameResult } from '../types.js';

const XP_PER_WIN = 200;
const XP_PER_LOSS = 75;
const FEATHERS_PER_WIN = 150;
const FEATHERS_PER_LOSS = 40;

const dedupe = (values: string[]) => Array.from(new Set(values));

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function applyReward(player: PlayerAccount, reward: RewardGrant): void {
  player.xp += reward.xp;
  player.level = calculateLevel(player.xp);
  Object.entries(reward.currency).forEach(([currency, amount]) => {
    player.currencies[currency as keyof typeof player.currencies] += amount ?? 0;
  });
  if (reward.cosmetics) {
    if (reward.cosmetics.skins) {
      player.cosmetics.skins = dedupe([
        ...player.cosmetics.skins,
        ...reward.cosmetics.skins
      ]);
    }
    if (reward.cosmetics.themes) {
      player.cosmetics.themes = dedupe([
        ...player.cosmetics.themes,
        ...reward.cosmetics.themes
      ]);
    }
    if (reward.cosmetics.trails) {
      player.cosmetics.trails = dedupe([
        ...player.cosmetics.trails,
        ...reward.cosmetics.trails
      ]);
    }
    if (reward.cosmetics.emotes) {
      player.cosmetics.emotes = dedupe([
        ...player.cosmetics.emotes,
        ...reward.cosmetics.emotes
      ]);
    }
  }
}

export function applyMatchResult(result: GameResult): void {
  result.players.forEach((summary) => {
    const player = dataStore.getPlayer(summary.playerId);
    if (!player) return;

    player.stats.totalMatches += 1;
    const isWinner = result.winnerId === summary.playerId;
    if (isWinner) {
      player.stats.wins += 1;
      player.stats.bestMultiplayerScore = Math.max(
        player.stats.bestMultiplayerScore,
        summary.score
      );
      applyReward(player, {
        xp: XP_PER_WIN,
        currency: { feathers: FEATHERS_PER_WIN }
      });
      player.mmr += 10;
    } else {
      player.stats.losses += 1;
      applyReward(player, {
        xp: XP_PER_LOSS,
        currency: { feathers: FEATHERS_PER_LOSS }
      });
      player.mmr = Math.max(100, player.mmr - 8);
    }

    dataStore.updatePlayer(player);
  });
}

export function recordSoloScore(playerId: string, score: number): void {
  const player = dataStore.getPlayer(playerId);
  if (!player) return;
  player.stats.bestSoloScore = Math.max(player.stats.bestSoloScore, score);
  const xpGain = 10 * Math.floor(score / 5);
  applyReward(player, { xp: xpGain, currency: { feathers: xpGain } });
  dataStore.updatePlayer(player);
}
