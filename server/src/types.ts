export type CurrencyType = 'feathers' | 'goldenEggs';

export interface PlayerAccount {
  id: string;
  displayName: string;
  mmr: number;
  xp: number;
  level: number;
  currencies: Record<CurrencyType, number>;
  cosmetics: CosmeticInventory;
  loadout: PlayerLoadout;
  stats: PlayerStats;
  createdAt: number;
  updatedAt: number;
}

export interface AccountRecord {
  id: string;
  playerId: string;
  email: string | null;
  passwordHash: string | null;
  isGuest: boolean;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  bestSoloScore: number;
  bestMultiplayerScore: number;
}

export interface CosmeticInventory {
  skins: string[];
  trails: string[];
  themes: string[];
  emotes: string[];
}

export interface PlayerLoadout {
  skin: string;
  trail: string;
  theme: string;
  emote: string;
  powerUps: PowerUpType[];
}

export type QueueType = 'casual' | 'ranked';
export type PowerUpType = 'shield' | 'slowMo';

export interface AuthTokenClaims {
  accountId: string;
  playerId: string;
  iat: number;
}

export interface MatchPlayerState {
  playerId: string;
  socketId: string;
  status: 'waiting' | 'alive' | 'eliminated';
  score: number;
  lastInputAt: number;
  pendingInputs: PlayerInput[];
  physics: PhysicsState;
  appliedPowerUps: Record<PowerUpType, number>;
}

export interface PlayerInput {
  tick: number;
  flap: boolean;
  powerUp?: PowerUpType;
}

export interface PhysicsState {
  y: number;
  velocity: number;
  isShielded: boolean;
  shieldExpiresAt: number;
}

export interface PipeObstacle {
  id: string;
  x: number;
  gapY: number;
  gapHeight: number;
}

export interface GameFrame {
  tick: number;
  pipes: PipeObstacle[];
  players: Array<{
    playerId: string;
    y: number;
    velocity: number;
    score: number;
    status: 'alive' | 'eliminated';
    isShielded: boolean;
  }>;
}

export interface GameResult {
  winnerId: string | null;
  players: Array<{
    playerId: string;
    score: number;
    status: 'alive' | 'eliminated';
  }>;
  durationMs: number;
}

export interface SeasonConfig {
  id: string;
  name: string;
  startAt: number;
  endAt: number;
  rewards: SeasonReward[];
}

export interface SeasonReward {
  tier: number;
  xp: number;
  currency: Partial<Record<CurrencyType, number>>;
  cosmetics?: Partial<CosmeticInventory>;
}

export interface RewardGrant {
  xp: number;
  currency: Partial<Record<CurrencyType, number>>;
  cosmetics?: Partial<CosmeticInventory>;
}

export interface MatchTicket {
  playerId: string;
  queue: QueueType;
  enqueuedAt: number;
}

export interface MatchPairing {
  ticketA: MatchTicket;
  ticketB: MatchTicket;
}

export interface ServerConfig {
  tickRate: number;
  pipeSpawnIntervalTicks: number;
  pipeSpeed: number;
  pipeGapRange: [number, number];
  pipeGapHeight: number;
  gravity: number;
  flapImpulse: number;
  terminalVelocity: number;
  groundY: number;
  ceilingY: number;
  suddenDeathTick: number;
  shieldDurationTicks: number;
  slowMoDurationTicks: number;
  slowMoFactor: number;
}
