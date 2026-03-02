import React, { useState, useEffect, useRef } from 'react';
import styles from './EditableText.module.css';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  isTextArea?: boolean;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
}

export function EditableText({ value, onSave, isTextArea = false, style, className, placeholder }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleBlur = async () => {
    setIsEditing(false);
    if (currentValue !== value) {
      await onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTextArea) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: currentValue,
      onChange: (e: any) => setCurrentValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      className: styles.input,
      style: { ...style, width: '100%' },
      placeholder
    };

    return isTextArea ? <textarea {...commonProps} rows={3} /> : <input type="text" {...commonProps} />;
  }

  return (
    <div 
      className={`${styles.textContainer} ${className}`} 
      onClick={() => setIsEditing(true)}
      style={style}
    >
      {value || <span style={{ opacity: 0.3 }}>{placeholder}</span>}
    </div>
  );
}
