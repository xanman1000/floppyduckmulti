import { Server } from 'socket.io';
import { serverConfig } from '../config.js';
import {
  GameFrame,
  GameResult,
  MatchPairing,
  MatchPlayerState,
  PipeObstacle,
  PlayerInput,
  PowerUpType
} from '../types.js';
import { SeededRandom } from '../utils/random.js';
import { applyMatchResult } from './progression.js';
import { v4 as uuid } from 'uuid';

const PIPE_DESPAWN_X = -0.2;
const PIPE_START_X = 1.2;

export class GameSession {
  private readonly io: Server;
  private readonly pairing: MatchPairing;
  private readonly playerSocketMap: Map<string, string>;
  private readonly onFinish: (result: GameResult) => void;
  private readonly players: Map<string, MatchPlayerState> = new Map();
  private readonly seed: number;
  private readonly random: SeededRandom;
  private pipes: PipeObstacle[] = [];
  private tick = 0;
  private interval: NodeJS.Timeout | null = null;
  private slowMoUntilTick: number | null = null;

  constructor(
    io: Server,
    pairing: MatchPairing,
    playerSocketMap: Map<string, string>,
    onFinish: (result: GameResult) => void
  ) {
    this.io = io;
    this.pairing = pairing;
    this.playerSocketMap = playerSocketMap;
    this.onFinish = onFinish;
    this.seed = Math.floor(Math.random() * 1_000_000);
    this.random = new SeededRandom(this.seed);

    [pairing.ticketA, pairing.ticketB].forEach((ticket) => {
      const socketId = this.playerSocketMap.get(ticket.playerId);
      if (!socketId) return;
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) return;
      const state: MatchPlayerState = {
        playerId: ticket.playerId,
        socketId: socket.id,
        status: 'waiting',
        score: 0,
        lastInputAt: 0,
        pendingInputs: [],
        physics: {
          y: 0.5,
          velocity: 0,
          isShielded: false,
          shieldExpiresAt: 0
        },
        appliedPowerUps: {
          shield: 0,
          slowMo: 0
        }
      };
      this.players.set(ticket.playerId, state);
    });
  }

  start(): void {
    this.broadcast('game:start', {
      seed: this.seed,
      tickRate: serverConfig.tickRate
    });
    this.players.forEach((player) => {
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (!socket) return;
      socket.on('game:flap', (input: PlayerInput) => this.handleInput(player.playerId, input));
    });
    this.interval = setInterval(() => this.update(), 1000 / serverConfig.tickRate);
  }

  private handleInput(playerId: string, input: PlayerInput) {
    const player = this.players.get(playerId);
    if (!player || player.status !== 'alive') return;
    if (input.powerUp) {
      this.activatePowerUp(player, input.powerUp);
    }
    player.pendingInputs.push(input);
    player.lastInputAt = this.tick;
  }

  private activatePowerUp(player: MatchPlayerState, powerUp: PowerUpType) {
    if (player.appliedPowerUps[powerUp] > 0) {
      return;
    }
    switch (powerUp) {
      case 'shield':
        player.physics.isShielded = true;
        player.physics.shieldExpiresAt = this.tick + serverConfig.shieldDurationTicks;
        player.appliedPowerUps[powerUp] = serverConfig.shieldDurationTicks;
        break;
      case 'slowMo':
        this.slowMoUntilTick = this.tick + serverConfig.slowMoDurationTicks;
        player.appliedPowerUps[powerUp] = serverConfig.slowMoDurationTicks;
        break;
    }
  }

  private update(): void {
    this.tick += 1;
    const delta = this.getDeltaTime();
    this.spawnPipesIfNeeded();
    this.movePipes(delta);
    this.players.forEach((player) => this.processPlayer(player, delta));
    this.removeExpiredPowerUps();
    const alivePlayers = Array.from(this.players.values()).filter(
      (player) => player.status === 'alive'
    );
    if (alivePlayers.length <= 1 || this.tick >= serverConfig.suddenDeathTick) {
      this.finish(alivePlayers[0]?.playerId ?? null);
      return;
    }
    this.broadcastFrame();
  }

  private getDeltaTime(): number {
    const base = 1 / serverConfig.tickRate;
    if (this.slowMoUntilTick && this.tick <= this.slowMoUntilTick) {
      return base * serverConfig.slowMoFactor;
    }
    return base;
  }

  private processPlayer(player: MatchPlayerState, delta: number) {
    if (player.status === 'waiting') {
      player.status = 'alive';
    }
    if (player.status !== 'alive') return;

    const physics = player.physics;
    const flapInputs = player.pendingInputs.filter((input) => input.flap);
    if (flapInputs.length > 0) {
      physics.velocity = serverConfig.flapImpulse;
    }
    player.pendingInputs = [];

    physics.velocity = Math.min(
      physics.velocity + serverConfig.gravity,
      serverConfig.terminalVelocity
    );
    physics.y += physics.velocity * delta;

    if (physics.y >= serverConfig.groundY || physics.y <= serverConfig.ceilingY) {
      this.handleCollision(player, 'boundary');
      return;
    }

    const collidedPipe = this.pipes.find((pipe) => this.isColliding(pipe, physics.y));
    if (collidedPipe) {
      this.handleCollision(player, collidedPipe.id);
    }

    player.score = Math.max(player.score, this.tick);
  }

  private isColliding(pipe: PipeObstacle, y: number): boolean {
    const pipeCenter = pipe.gapY;
    const halfGap = pipe.gapHeight / 2;
    const withinGap = y > pipeCenter - halfGap && y < pipeCenter + halfGap;
    const nearPipe = pipe.x < 0.5 && pipe.x > 0.4;
    return nearPipe && !withinGap;
  }

  private handleCollision(player: MatchPlayerState, obstacleId: string) {
    if (player.physics.isShielded) {
      player.physics.isShielded = false;
      player.physics.shieldExpiresAt = 0;
      return;
    }
    player.status = 'eliminated';
  }

  private removeExpiredPowerUps() {
    this.players.forEach((player) => {
      if (player.physics.isShielded && this.tick >= player.physics.shieldExpiresAt) {
        player.physics.isShielded = false;
      }
    });
    if (this.slowMoUntilTick && this.tick > this.slowMoUntilTick) {
      this.slowMoUntilTick = null;
    }
  }

  private spawnPipesIfNeeded() {
    if (this.tick % serverConfig.pipeSpawnIntervalTicks !== 0) {
      return;
    }
    const gapY = this.random.nextBetween(
      serverConfig.pipeGapRange[0],
      serverConfig.pipeGapRange[1]
    );
    const pipe: PipeObstacle = {
      id: uuid(),
      x: PIPE_START_X,
      gapY,
      gapHeight: serverConfig.pipeGapHeight
    };
    this.pipes.push(pipe);
  }

  private movePipes(delta: number) {
    const movement = serverConfig.pipeSpeed * delta;
    this.pipes.forEach((pipe) => {
      pipe.x -= movement;
    });
    this.pipes = this.pipes.filter((pipe) => pipe.x > PIPE_DESPAWN_X);
  }

  private finish(winnerId: string | null) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    const result: GameResult = {
      winnerId,
      durationMs: (this.tick / serverConfig.tickRate) * 1000,
      players: Array.from(this.players.values()).map((player) => ({
        playerId: player.playerId,
        score: player.score,
        status: player.status === 'alive' ? 'alive' : 'eliminated'
      }))
    };
    applyMatchResult(result);
    this.broadcast('game:end', result);
    this.onFinish(result);
    this.players.forEach((player) => {
      const socket = this.io.sockets.sockets.get(player.socketId);
      socket?.removeAllListeners('game:flap');
    });
  }

  private broadcast(event: string, payload: unknown) {
    [this.pairing.ticketA, this.pairing.ticketB].forEach((ticket) => {
      const socketId = this.playerSocketMap.get(ticket.playerId);
      if (!socketId) return;
      const socket = this.io.sockets.sockets.get(socketId);
      socket?.emit(event, payload);
    });
  }

  private broadcastFrame() {
    const frame: GameFrame = {
      tick: this.tick,
      pipes: this.pipes,
      players: Array.from(this.players.values()).map((player) => ({
        playerId: player.playerId,
        y: player.physics.y,
        velocity: player.physics.velocity,
        score: player.score,
        status: player.status === 'alive' ? 'alive' : 'eliminated',
        isShielded: player.physics.isShielded
      }))
    };
    this.broadcast('game:state', frame);
  }
}
