export const GAME_HEIGHT = 640;
export const GAME_WIDTH = 360;

export const physicsConfig = {
  tickRate: 60,
  gravity: 0.0025,
  flapImpulse: -0.045,
  terminalVelocity: 0.035,
  groundY: 1,
  ceilingY: 0,
  pipeSpawnInterval: 90,
  pipeSpeed: 0.35,
  pipeGapRange: [0.25, 0.75] as const,
  pipeGapHeight: 0.25
};
