import { create } from 'zustand';

interface HardwareState {
  cpuUsage: number;
  gpuUsage: number;
  ramUsage: number;
  networkSpeed: { download: number; upload: number };
  updateUsage: (data: Partial<HardwareState>) => void;
}

export const useHardwareStore = create<HardwareState>((set) => ({
  cpuUsage: 0,
  gpuUsage: 0,
  ramUsage: 0,
  networkSpeed: { download: 0, upload: 0 },
  updateUsage: (data) => set((state) => ({ ...state, ...data })),
}));
