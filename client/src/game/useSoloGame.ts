import { useCallback, useEffect, useRef, useState } from 'react';
import { physicsConfig } from './constants';
import { SeededRandom } from './seededRandom';
import type { PipeObstacle } from '../types';

const PLAYER_X = 0.4;
const PIPE_START_X = 1.2;
const PIPE_DESPAWN_X = -0.2;

export interface SoloGameState {
  status: 'idle' | 'running' | 'ended';
  score: number;
  pipes: PipeObstacle[];
  y: number;
  velocity: number;
  tick: number;
}

interface SoloGameInternal extends SoloGameState {
  random: SeededRandom;
}

function createInitialState(seed: number): SoloGameInternal {
  return {
    status: 'idle',
    score: 0,
    pipes: [],
    y: 0.5,
    velocity: 0,
    tick: 0,
    random: new SeededRandom(seed)
  };
}

function advance(game: SoloGameInternal, delta: number) {
  if (game.status !== 'running') {
    return;
  }
  game.tick += 1;
  game.velocity = Math.min(game.velocity + physicsConfig.gravity, physicsConfig.terminalVelocity);
  game.y += game.velocity * delta;

  if (game.tick % physicsConfig.pipeSpawnInterval === 0) {
    const gapY = game.random.nextBetween(
      physicsConfig.pipeGapRange[0],
      physicsConfig.pipeGapRange[1]
    );
    game.pipes.push({
      id: `${game.tick}`,
      x: PIPE_START_X,
      gapY,
      gapHeight: physicsConfig.pipeGapHeight
    });
  }

  const movement = physicsConfig.pipeSpeed * delta;
  game.pipes.forEach((pipe) => {
    pipe.x -= movement;
  });
  game.pipes = game.pipes.filter((pipe) => pipe.x > PIPE_DESPAWN_X);

  const collided = game.pipes.some((pipe) => {
    const nearPipe = pipe.x < PLAYER_X + 0.05 && pipe.x > PLAYER_X - 0.05;
    const halfGap = pipe.gapHeight / 2;
    const withinGap = game.y > pipe.gapY - halfGap && game.y < pipe.gapY + halfGap;
    return nearPipe && !withinGap;
  });

  if (game.y <= physicsConfig.ceilingY || game.y >= physicsConfig.groundY || collided) {
    game.status = 'ended';
    return;
  }

  game.score = Math.max(game.score, Math.floor(game.tick / physicsConfig.pipeSpawnInterval));
}

function toPublicState(game: SoloGameInternal): SoloGameState {
  const { random: _random, ...rest } = game;
  return { ...rest };
}

export function useSoloGame(seed: number) {
  const [state, setState] = useState<SoloGameState>(() => toPublicState(createInitialState(seed)));
  const gameRef = useRef<SoloGameInternal>(createInitialState(seed));
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const syncState = useCallback(() => {
    setState(toPublicState(gameRef.current));
  }, []);

  const loop = useCallback(
    (time: number) => {
      if (gameRef.current.status !== 'running') {
        syncState();
        return;
      }
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      accumulatorRef.current += delta;
      const step = 1 / physicsConfig.tickRate;
      while (accumulatorRef.current >= step) {
        advance(gameRef.current, step);
        accumulatorRef.current -= step;
      }
      syncState();
      animationRef.current = requestAnimationFrame(loop);
    },
    [syncState]
  );

  const start = useCallback(() => {
    gameRef.current = createInitialState(seed);
    gameRef.current.status = 'running';
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    syncState();
    animationRef.current = requestAnimationFrame(loop);
  }, [seed, loop, syncState]);

  const flap = useCallback(() => {
    if (gameRef.current.status !== 'running') return;
    gameRef.current.velocity = physicsConfig.flapImpulse;
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    gameRef.current.status = 'ended';
    syncState();
  }, [syncState]);

  useEffect(() => {
    gameRef.current = createInitialState(seed);
    setState(toPublicState(gameRef.current));
  }, [seed]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state.status === 'ended' && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [state.status]);

  return { state, start, flap, stop };
}
