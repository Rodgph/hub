import React from 'react';
import { useLayoutStore } from '@/store/layout.store';
import { LayoutNode } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';
import { SplitPane } from './SplitPane';
import { EmptyPane } from './EmptyPane';
import { ModuleWrapper } from './ModuleWrapper';
import { TabPane } from './TabPane';
import styles from './layout.module.css';


export function LayoutEngine() {
  const tree = useLayoutStore(state => state.tree);

  const renderNode = (node: LayoutNode): React.ReactNode => {
    if (node.type === 'split') {
      return <SplitPane node={node} renderNode={renderNode} />;
    }

    if (node.type === 'tabs') {
      return <TabPane node={node} renderNode={renderNode} />;
    }
    
    // All module nodes (empty or not) are wrapped in ModuleWrapper
    // This provides context menu, drag and drop, and standard container styles
    return (
        <ModuleWrapper 
          nodeId={node.id} 
          moduleId={node.moduleId}
          hideHandle={node.moduleId === ModuleId.Empty}
        >
            {node.moduleId === ModuleId.Empty ? (
                <EmptyPane nodeId={node.id} />
            ) : (
                /* In future phases, we will map moduleId to actual components */
                null
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
