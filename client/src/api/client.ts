import type { AuthResponse, PlayerAccount } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const init: RequestInit = {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers,
    signal: options.signal
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      message = typeof data?.error === 'string' ? data.error : data?.message ?? message;
    } catch (err) {
      console.warn('Failed to parse error payload', err);
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function createGuest(displayName?: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/guest', {
    method: 'POST',
    body: { displayName }
  });
}

export async function registerAccount(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { email, password, displayName }
  });
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
}

export async function upgradeGuest(token: string, email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/upgrade', {
    method: 'POST',
    body: { email, password },
    token
  });
}

export async function fetchSession(token: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/session', {
    method: 'GET',
    token
  });
}

export async function fetchProfile(token: string, playerId: string): Promise<PlayerAccount> {
  const data = await request<{ player: PlayerAccount }>(`/profile/${playerId}`, {
    method: 'GET',
    token
  });
  return data.player;
}

export async function updateLoadout(
  token: string,
  playerId: string,
  loadout: PlayerAccount['loadout']
): Promise<PlayerAccount> {
  const data = await request<{ player: PlayerAccount }>(`/profile/${playerId}/loadout`, {
    method: 'POST',
    body: loadout,
    token
  });
  return data.player;
}

export async function submitSoloScore(token: string, playerId: string, score: number): Promise<PlayerAccount> {
  const data = await request<{ player: PlayerAccount }>(`/solo/${playerId}/score`, {
    method: 'POST',
    body: { score },
    token
  });
  return data.player;
}
