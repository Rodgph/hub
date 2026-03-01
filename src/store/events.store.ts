import { create } from 'zustand';
import { EventType, AppEvent } from '@/types';

type EventHandler = (payload: any) => void;

interface EventsState {
  handlers: Map<EventType, Set<EventHandler>>;
  emit: (type: EventType, payload: any) => void;
  on: (type: EventType, handler: EventHandler) => () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  handlers: new Map(),

  emit: (type, payload) => {
    const { handlers } = get();
    const eventHandlers = handlers.get(type);
    if (eventHandlers) {
      eventHandlers.forEach(handler => handler(payload));
    }
  },

  on: (type, handler) => {
    const { handlers } = get();
    if (!handlers.has(type)) {
      handlers.set(type, new Set());
    }
    handlers.get(type)!.add(handler);

    return () => {
      handlers.get(type)?.delete(handler);
    };
  }
}));
