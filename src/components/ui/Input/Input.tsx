import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ style, ...props }: InputProps) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 'var(--radius-interactive)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--color-title)',
    fontSize: '14px',
    outline: 'none',
    ...style,
  };

  return (
    <input 
      style={baseStyle} 
      {...props} 
    />
  );
}
