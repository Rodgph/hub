import React, { useEffect, useRef } from 'react';
import { LayoutTabs, LayoutNode } from '@/types/layout.types';
import { useLayoutStore } from '@/store/layout.store';
import styles from './layout.module.css';

interface TabPaneProps {
  node: LayoutTabs;
  renderNode: (node: LayoutNode) => React.ReactNode;
}

export function TabPane({ node, renderNode }: TabPaneProps) {
  const { setTabIndex } = useLayoutStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        setTabIndex(node.id, node.activeIndex + delta);
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [node.id, node.activeIndex, setTabIndex]);

  return (
    <div ref={containerRef} className={styles.tabContainer}>
      <div className={styles.tabContent}>
        {renderNode(node.children[node.activeIndex])}
      </div>
    </div>
  );
}
