import { create } from 'zustand';

export interface DiskStats {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  usage_percent: number;
}

interface HardwareState {
  cpuUsage: number;
  gpuUsage: number;
  ramUsagePercent: number;
  ramUsed: number;
  ramTotal: number;
  disks: DiskStats[];
  networkSpeed: { download: number; upload: number };
  updateStats: (data: Partial<HardwareState>) => void;
}

export const useHardwareStore = create<HardwareState>((set) => ({
  cpuUsage: 0,
  gpuUsage: 0,
  ramUsagePercent: 0,
  ramUsed: 0,
  ramTotal: 0,
  disks: [],
  networkSpeed: { download: 0, upload: 0 },
  updateStats: (data) => set((state) => ({ ...state, ...data })),
}));
