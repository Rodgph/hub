import React from 'react';
import { useHardwareStore } from '@/store/hardware.store';
import styles from './Hardware.module.css';

const formatGB = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

export function CPUModule() {
  const { cpuUsage } = useHardwareStore();
  return (
    <div className={styles.hardwareWidget}>
      <span className={styles.icon}>⚡</span>
      <div className={styles.details}>
        <h4>CPU Usage</h4>
        <div className={styles.barContainer}>
          <div className={styles.bar} style={{ width: `${cpuUsage}%` }} />
        </div>
        <p>{cpuUsage.toFixed(1)}%</p>
      </div>
    </div>
  );
}

export function RAMModule() {
  const { ramUsagePercent, ramUsed, ramTotal } = useHardwareStore();
  return (
    <div className={styles.hardwareWidget}>
      <span className={styles.icon}>🧠</span>
      <div className={styles.details}>
        <h4>RAM Memory</h4>
        <div className={styles.barContainer}>
          <div className={styles.bar} style={{ width: `${ramUsagePercent}%` }} />
        </div>
        <p>{ramUsagePercent.toFixed(1)}% ({formatGB(ramUsed)} / {formatGB(ramTotal)})</p>
      </div>
    </div>
  );
}

export function GPUModule() {
  return (
    <div className={styles.hardwareWidget}>
      <span className={styles.icon}>🎮</span>
      <div className={styles.details}>
        <h4>GPU Performance</h4>
        <p>N/A (Driver not detected)</p>
      </div>
    </div>
  );
}

export function StorageModule() {
  const { disks } = useHardwareStore();
  const mainDisk = disks[0];
  if (!mainDisk) return <div className={styles.hardwareWidget}>💾 No Disk Detected</div>;

  return (
    <div className={styles.hardwareWidget}>
      <span className={styles.icon}>💾</span>
      <div className={styles.details}>
        <h4>Storage: {mainDisk.name}</h4>
        <div className={styles.barContainer}>
          <div className={styles.bar} style={{ width: `${mainDisk.usage_percent}%` }} />
        </div>
        <p>{mainDisk.usage_percent.toFixed(1)}% ({formatGB(mainDisk.available_space)} livre)</p>
      </div>
    </div>
  );
}
