import React from 'react';
import { ResizeHandle } from './ResizeHandle';
import styles from './layout.module.css';
import { LayoutSplit, LayoutNode, LayoutModule } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';

interface SplitPaneProps {
  node: LayoutSplit;
  renderNode: (node: LayoutNode) => React.ReactNode;
}

export function SplitPane({ node, renderNode }: SplitPaneProps) {
  const { direction, ratio, firstChild, secondChild, id } = node;

  // Verifica se algum dos filhos é o Nav (compara como string para segurança)
  const isFirstNav = firstChild.type === 'module' && String(firstChild.moduleId) === 'nav';
  const isSecondNav = secondChild.type === 'module' && String(secondChild.moduleId) === 'nav';

  const containerStyle: React.CSSProperties = {
    flexDirection: direction === 'vertical' ? 'row' : 'column',
  };

  const firstChildStyle: React.CSSProperties = {
    flex: isFirstNav ? '0 0 50px' : (isSecondNav ? '1 1 0%' : undefined),
    width: (direction === 'vertical' && isFirstNav) ? '50px' : (isFirstNav ? '100%' : undefined),
    height: (direction === 'horizontal' && isFirstNav) ? '50px' : (isFirstNav ? '100%' : undefined),
    minWidth: (direction === 'vertical' && isFirstNav) ? '50px' : undefined,
    maxWidth: (direction === 'vertical' && isFirstNav) ? '50px' : undefined,
    minHeight: (direction === 'horizontal' && isFirstNav) ? '50px' : undefined,
    maxHeight: (direction === 'horizontal' && isFirstNav) ? '50px' : undefined,
    overflow: isFirstNav ? 'visible' : 'hidden',
    position: 'relative',
    transition: 'all 0.2s ease'
  };

  const secondChildStyle: React.CSSProperties = {
    flex: isSecondNav ? '0 0 50px' : (isFirstNav ? '1 1 0%' : '1 1 0%'),
    width: (direction === 'vertical' && isSecondNav) ? '50px' : undefined,
    height: (direction === 'horizontal' && isSecondNav) ? '50px' : undefined,
    minWidth: (direction === 'vertical' && isSecondNav) ? '50px' : undefined,
    maxWidth: (direction === 'vertical' && isSecondNav) ? '50px' : undefined,
    minHeight: (direction === 'horizontal' && isSecondNav) ? '50px' : undefined,
    maxHeight: (direction === 'horizontal' && isSecondNav) ? '50px' : undefined,
    overflow: isSecondNav ? 'visible' : 'hidden',
    position: 'relative',
    transition: 'all 0.2s ease'
  };

  return (
    <div className={`${styles.splitPane} ${styles[direction]}`} style={containerStyle}>
      <div style={firstChildStyle}>
        {renderNode(firstChild)}
      </div>
      {/* Esconde o resize handle se um dos vizinhos for o Nav (opcional, para evitar que o usuário mude o fixo) */}
      {!isFirstNav && !isSecondNav && <ResizeHandle nodeId={id} direction={direction} />}
      <div style={secondChildStyle}>
        {renderNode(secondChild)}
      </div>
    </div>
  );
}
