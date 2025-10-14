import { ServerConfig, SeasonConfig } from './types.js';

const defaultJwtSecret = process.env.JWT_SECRET ?? 'dev-floppyduck-secret';

export const authConfig = {
  jwtSecret: defaultJwtSecret,
  tokenTtl: '7d'
};

export const serverConfig: ServerConfig = {
  tickRate: 30,
  pipeSpawnIntervalTicks: 120,
  pipeSpeed: 0.01,
  pipeGapRange: [0.25, 0.75],
  pipeGapHeight: 0.25,
  gravity: 0.0025,
  flapImpulse: -0.045,
  terminalVelocity: 0.035,
  groundY: 1,
  ceilingY: 0,
  suddenDeathTick: 2700,
  shieldDurationTicks: 180,
  slowMoDurationTicks: 120,
  slowMoFactor: 0.5
};

export const defaultSeason: SeasonConfig = {
  id: 'season-1',
  name: 'Dawn of the Arena',
  startAt: Date.UTC(2024, 0, 1),
  endAt: Date.UTC(2024, 2, 31),
  rewards: Array.from({ length: 10 }).map((_, index) => ({
    tier: index + 1,
    xp: 250 * (index + 1),
    currency: {
      feathers: 100 * (index + 1)
    },
    cosmetics: index % 3 === 0 ? { skins: [`season1_skin_${index + 1}`] } : undefined
  }))
};
