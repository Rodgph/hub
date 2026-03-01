import React from 'react';
import { ResizeHandle } from './ResizeHandle';
import styles from './layout.module.css';
import { LayoutSplit, LayoutNode } from '@/types/layout.types';

interface SplitPaneProps {
  node: LayoutSplit;
  renderNode: (node: LayoutNode) => React.ReactNode;
}

export function SplitPane({ node, renderNode }: SplitPaneProps) {
  const { direction, ratio, firstChild, secondChild, id } = node;

  const containerStyle: React.CSSProperties = {
    flexDirection: direction === 'vertical' ? 'row' : 'column',
  };

  const firstChildStyle: React.CSSProperties = {
    [direction === 'vertical' ? 'width' : 'height']: `${ratio * 100}%`,
  };

  const secondChildStyle: React.CSSProperties = {
    flex: 1,
  };

  return (
    <div className={`${styles.splitPane} ${styles[direction]}`} style={containerStyle}>
      <div style={firstChildStyle}>
        {renderNode(firstChild)}
      </div>
      <ResizeHandle nodeId={id} direction={direction} />
      <div style={secondChildStyle}>
        {renderNode(secondChild)}
      </div>
    </div>
  );
}
