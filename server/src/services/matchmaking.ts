import { MatchPairing, MatchTicket, QueueType } from '../types.js';

type QueueMap = Map<QueueType, MatchTicket[]>;

class MatchmakingService {
  private queues: QueueMap = new Map([
    ['casual', []],
    ['ranked', []]
  ]);

  enqueue(ticket: MatchTicket): MatchPairing | null {
    const queue = this.queues.get(ticket.queue);
    if (!queue) {
      this.queues.set(ticket.queue, [ticket]);
      return null;
    }
    if (queue.find((existing) => existing.playerId === ticket.playerId)) {
      return null;
    }
    queue.push(ticket);
    if (queue.length < 2) {
      return null;
    }
    queue.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
    const [ticketA, ticketB] = queue.splice(0, 2);
    return { ticketA, ticketB };
  }

  remove(playerId: string, queueType: QueueType): void {
    const queue = this.queues.get(queueType);
    if (!queue) return;
    const index = queue.findIndex((ticket) => ticket.playerId === playerId);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  }
}

export const matchmaking = new MatchmakingService();
