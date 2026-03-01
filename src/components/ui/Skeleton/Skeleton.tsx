import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ width = '100%', height = 20, circle = false }: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
    borderRadius: circle ? '50%' : '8px',
    background: 'rgba(255,255,255,0.05)',
    animation: 'skeleton-pulse var(--duration-skeleton) infinite ease-in-out',
  };

  return <div style={style} />;
}
