import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useHardwareStore } from '@/store/hardware.store';
import { HARDWARE_POLL_INTERVAL_MS } from '@/config/constants';

interface RustHardwareStats {
  cpu_usage: number;
  ram_used: number;
  ram_total: number;
  ram_usage_percent: number;
  disks: any[];
}

export function useHardware() {
  const updateStats = useHardwareStore((state) => state.updateStats);

  useEffect(() => {
    const poll = async () => {
      try {
        const stats = await invoke<RustHardwareStats>('get_hardware_stats');
        
        updateStats({
          cpuUsage: stats.cpu_usage,
          ramUsed: stats.ram_used,
          ramTotal: stats.ram_total,
          ramUsagePercent: stats.ram_usage_percent,
          disks: stats.disks.map(d => ({
            name: d.name,
            mount_point: d.mount_point,
            total_space: d.total_space,
            available_space: d.available_space,
            usage_percent: d.usage_percent,
          })),
        });
      } catch (error) {
        console.error('[useHardware] Erro ao buscar stats:', error);
      }
    };

    poll();
    const interval = setInterval(poll, HARDWARE_POLL_INTERVAL_MS || 2000);
    return () => clearInterval(interval);
  }, [updateStats]);
}
