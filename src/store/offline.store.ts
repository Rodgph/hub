import { create } from 'zustand';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  queue: OfflineAction[];
  setOnline: (status: boolean) => void;
  enqueue: (type: string, payload: any) => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: navigator.onLine,
  queue: [],

  setOnline: (isOnline) => set({ isOnline }),

  enqueue: (type, payload) => set((state) => ({
    queue: [...state.queue, { id: crypto.randomUUID(), type, payload, timestamp: Date.now() }]
  })),

  clearQueue: () => set({ queue: [] }),
}));
