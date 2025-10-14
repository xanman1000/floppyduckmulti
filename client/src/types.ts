export interface PlayerAccount {
  id: string;
  displayName: string;
  mmr: number;
  xp: number;
  level: number;
  currencies: Record<string, number>;
  cosmetics: {
    skins: string[];
    trails: string[];
    themes: string[];
    emotes: string[];
  };
  loadout: {
    skin: string;
    trail: string;
    theme: string;
    emote: string;
    powerUps: string[];
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    bestSoloScore: number;
    bestMultiplayerScore: number;
  };
}

export interface PipeObstacle {
  id: string;
  x: number;
  gapY: number;
  gapHeight: number;
}

export interface MultiplayerFrame {
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

export interface MultiplayerSummary {
  winnerId: string | null;
  players: Array<{
    playerId: string;
    score: number;
    status: 'alive' | 'eliminated';
  }>;
  durationMs: number;
}

export interface AccountSummary {
  id: string;
  email: string | null;
  isGuest: boolean;
  lastLoginAt: number | null;
}

export interface AuthResponse {
  token: string;
  player: PlayerAccount;
  account: AccountSummary;
}
