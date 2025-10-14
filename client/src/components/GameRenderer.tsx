import { useEffect, useRef } from 'react';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import type { PipeObstacle } from '../types';

interface Props {
  pipes: PipeObstacle[];
  playerY: number;
  status: 'idle' | 'running' | 'ended';
  score: number;
  onFlap: () => void;
  theme?: 'daylight' | 'dusk' | string;
}

const PLAYER_X = 0.4;

function mapTheme(theme: string | undefined) {
  switch (theme) {
    case 'dusk':
      return { background: '#1f2937', ground: '#4b5563', pipe: '#f87171' };
    case 'neon':
      return { background: '#111827', ground: '#06b6d4', pipe: '#a855f7' };
    default:
      return { background: '#bae6fd', ground: '#0c4a6e', pipe: '#16a34a' };
  }
}

export function GameRenderer({ pipes, playerY, status, score, onFlap, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = mapTheme(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);

    ctx.fillStyle = colors.pipe;
    pipes.forEach((pipe) => {
      const pipeX = pipe.x * GAME_WIDTH;
      const gapCenter = pipe.gapY * GAME_HEIGHT;
      const gapHeightPx = pipe.gapHeight * GAME_HEIGHT;
      const topHeight = gapCenter - gapHeightPx / 2;
      const bottomY = gapCenter + gapHeightPx / 2;
      ctx.fillRect(pipeX - 30, 0, 60, topHeight);
      ctx.fillRect(pipeX - 30, bottomY, 60, GAME_HEIGHT - bottomY - 40);
    });

    const playerX = PLAYER_X * GAME_WIDTH;
    const playerYpx = playerY * GAME_HEIGHT;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(playerX, playerYpx, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 16, 32);

    if (status === 'idle') {
      ctx.textAlign = 'center';
      ctx.fillText('Tap to start', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    if (status === 'ended') {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.fillText('Tap to retry', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 36);
    }
  }, [pipes, playerY, status, score, colors.background, colors.ground, colors.pipe]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointer = (event: PointerEvent) => {
      event.preventDefault();
      onFlap();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        onFlap();
      }
    };

    canvas.addEventListener('pointerdown', handlePointer);
    window.addEventListener('keydown', handleKey);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onFlap]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      style={{ width: '100%', height: '100%', touchAction: 'none', borderRadius: 16 }}
    />
  );
}
