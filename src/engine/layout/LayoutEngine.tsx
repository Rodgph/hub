import React from 'react';
import { useLayoutStore } from '@/store/layout.store';
import { LayoutNode } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';
import { SplitPane } from './SplitPane';
import { EmptyPane } from './EmptyPane';
import { ModuleWrapper } from './ModuleWrapper';
import { TabPane } from './TabPane';
import styles from './layout.module.css';

import { ModuleRegistry } from '@/modules';

export function LayoutEngine() {
  const tree = useLayoutStore(state => state.tree);

  const renderNode = (node: LayoutNode): React.ReactNode => {
    if (node.type === 'split') {
      return <SplitPane key={node.id} node={node} renderNode={renderNode} />;
    }

    if (node.type === 'tabs') {
      return <TabPane key={node.id} node={node} renderNode={renderNode} />;
    }
    
    // Procura o componente real no registro
    const RealComponent = ModuleRegistry[node.moduleId];

    return (
        <ModuleWrapper 
          key={node.id}
          nodeId={node.id} 
          moduleId={node.moduleId}
          hideHandle={node.moduleId === ModuleId.Empty}
        >
            {node.moduleId === ModuleId.Empty ? (
                <EmptyPane nodeId={node.id} />
            ) : RealComponent ? (
                <RealComponent />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                    {node.moduleId.toUpperCase()} (EM DESENVOLVIMENTO)
                </div>
            )}
        </ModuleWrapper>
    );
  };

  return (
    <div className={styles.container}>
      {renderNode(tree)}
    </div>
  );
}
