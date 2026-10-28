import type { UserEventInput } from '../repositories/eventRepo.js';

export type EventListener = (event: UserEventInput) => void;

const MAX_LISTENERS_PER_CHANNEL = 32;

function channelKey(tenantId: string, userId: string): string {
  return `${tenantId}:${userId}`;
}

// Bus liviano en memoria para empujar notificaciones por SSE APENAS commitea la transacción.
// Nunca llamarlo adentro del callback SERIALIZABLE: si Postgres reintenta por 40001,
// terminarías mandándole al usuario notificaciones fantasma de rollbacks.
export class EventHub {
  private readonly channels = new Map<string, Set<EventListener>>();

  subscribe(tenantId: string, userId: string, listener: EventListener): () => void {
    const key = channelKey(tenantId, userId);
    const set = this.getOrCreateChannel(key);
    this.enforceChannelCap(set);
    set.add(listener);

    return () => {
      set.delete(listener);
      if (set.size === 0) this.channels.delete(key);
    };
  }

  publish(event: UserEventInput): void {
    const set = this.channels.get(channelKey(event.tenantId, event.userId));
    if (!set) return;
    for (const listener of set) {
      listener(event);
    }
  }

  private getOrCreateChannel(key: string): Set<EventListener> {
    let set = this.channels.get(key);
    if (!set) {
      set = new Set();
      this.channels.set(key, set);
    }
    return set;
  }

  private enforceChannelCap(set: Set<EventListener>): void {
    if (set.size < MAX_LISTENERS_PER_CHANNEL) return;
    const oldest = set.values().next().value;
    if (oldest) set.delete(oldest);
  }
}
