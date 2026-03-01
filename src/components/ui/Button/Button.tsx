import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
}

export function Button({ variant = 'primary', style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 'var(--radius-interactive)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    outline: 'none',
    ...style,
  };

  const variants = {
    primary: { background: 'var(--color-title)', color: 'var(--bg-base)' },
    secondary: { background: 'rgba(255,255,255,0.08)', color: 'var(--color-title)' },
    ghost: { background: 'transparent', color: 'var(--color-subtitle)' },
    destructive: { background: 'var(--status-dnd)', color: '#fff' },
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant] }} 
      {...props} 
    />
  );
}
