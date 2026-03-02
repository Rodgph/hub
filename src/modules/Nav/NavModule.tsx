import React, { useState, useRef, useEffect } from 'react';
import styles from './Nav.module.css';
import { useLayoutStore } from '@/store/layout.store';
import { useHardwareStore } from '@/store/hardware.store';
import { ModuleRegistry } from '@/modules';
import { ModuleId } from '@/types/module.types';
import { LayoutModule } from '@/types/layout.types';
import { useContextMenu } from '@/hooks/useContextMenu';
import { MenuItem } from '@/store/context-menu.store';

type Side = 'top' | 'bottom' | 'left' | 'right';

export function NavModule() {
  const { tree, undockModule } = useLayoutStore();
  const { openContextMenu } = useContextMenu();
  const { cpuUsage, ramUsagePercent, ramUsed, ramTotal, disks } = useHardwareStore();
  const [drawerSize, setDrawerSize] = useState(400);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [side, setSide] = useState<Side>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  
  const navNode = findNavNode(tree);
  const dockedModules = navNode?.dockedModules || [];
  const activeModuleId = navNode?.activeDockedModule;

  // Limitar o tamanho da gaveta
  const clampSize = (size: number) => Math.max(300, Math.min(window.innerWidth - 100, window.innerHeight - 100, size));

  useEffect(() => {
    if (!containerRef.current) return;

    const updatePosition = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      const isHorizontal = rect.width > rect.height;
      setOrientation(isHorizontal ? 'horizontal' : 'vertical');

      // Detecção de quadrante para decidir a direção de abertura
      if (isHorizontal) {
        setSide(rect.top < winH / 2 ? 'top' : 'bottom');
      } else {
        setSide(rect.left < winW / 2 ? 'left' : 'right');
      }
      
      const wrapper = containerRef.current?.closest('[data-module-id="nav"]');
      if (wrapper) {
        wrapper.setAttribute('data-nav-orientation', isHorizontal ? 'horizontal' : 'vertical');
        wrapper.setAttribute('data-nav-side', isHorizontal ? (rect.top < winH / 2 ? 'top' : 'bottom') : (rect.left < winW / 2 ? 'left' : 'right'));
      }
    };

    const observer = new ResizeObserver(updatePosition);
    observer.observe(containerRef.current);
    updatePosition();

    return () => observer.disconnect();
  }, []);

  const setActive = (moduleId: ModuleId | null) => {
    useLayoutStore.setState(state => {
        const newTree = setNavActiveModule(state.tree, moduleId);
        return { tree: newTree, revision: state.revision + 1 };
    });
  };

  const handleBarContextMenu = (e: React.MouseEvent) => {
    const formatGB = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    const mainDisk = disks[0];
    const layoutActions = useLayoutStore.getState();
    
    const menuItems: MenuItem[] = [
      { id: 'cpu', label: `CPU: ${cpuUsage.toFixed(1)}%`, icon: '⚡', action: () => {} },
      { id: 'ram', label: `RAM: ${ramUsagePercent.toFixed(1)}% (${formatGB(ramUsed)} / ${formatGB(ramTotal)})`, icon: '🧠', action: () => {} },
      { id: 'gpu', label: `GPU: N/A`, icon: '🎮', action: () => {} },
    ];

    if (mainDisk) {
      menuItems.push({ 
        id: 'hd', 
        label: `HD: ${mainDisk.usage_percent.toFixed(1)}% (${formatGB(mainDisk.available_space)} livre)`, 
        icon: '💾', 
        action: () => {} 
      });
    }
    
    menuItems.push({ id: 'sep1', type: 'separator' } as any);

    // Nova seção para adicionar módulos rapidamente
    if (navNode) {
      const handleDock = (moduleId: ModuleId) => {
        console.log(`[NavModule] Solicitando acoplamento do módulo: ${moduleId} no nó: ${navNode.id}`);
        layoutActions.dockModule(navNode.id, moduleId);
      };

      menuItems.push({
        id: 'add-modules',
        label: 'Adicionar à Barra',
        icon: '➕',
        children: [
          { id: 'add-cpu', label: 'Monitor de CPU', icon: '⚡', action: () => handleDock(ModuleId.CPU) },
          { id: 'add-ram', label: 'Monitor de RAM', icon: '🧠', action: () => handleDock(ModuleId.RAM) },
          { id: 'add-gpu', label: 'Monitor de GPU', icon: '🎮', action: () => handleDock(ModuleId.GPU) },
          { id: 'add-hd', label: 'Monitor de Disco', icon: '💾', action: () => handleDock(ModuleId.Storage) },
          { id: 'sep-add', type: 'separator' } as any,
          { id: 'add-settings', label: 'Configurações', icon: '⚙️', action: () => handleDock(ModuleId.Settings) },
          { id: 'add-chat', label: 'Chat', icon: '💬', action: () => handleDock(ModuleId.Chat) },
          { id: 'add-feed', label: 'Feed', icon: '📰', action: () => handleDock(ModuleId.Feed) },
          { id: 'add-music', label: 'Música', icon: '🎵', action: () => handleDock(ModuleId.Music) },
          { id: 'add-games', label: 'Jogos e Apps', icon: '🎮', action: () => handleDock(ModuleId.FavoriteGames) },
          { id: 'add-live', label: 'Lives ao Vivo', icon: '📺', action: () => handleDock(ModuleId.Live) },
        ]
      });
    }

    menuItems.push({ id: 'nav-settings', label: 'Configurações de Nav', icon: '⚙️', action: () => {} });
    
    openContextMenu(e, menuItems);
  };

  const handleIconContextMenu = (e: React.MouseEvent, moduleId: ModuleId) => {
    e.stopPropagation(); // Evita o menu da barra
    if (!navNode) return;
    
    const menuItems: MenuItem[] = [
      { 
        id: 'undock', 
        label: `Remover ${getModuleName(moduleId)}`, 
        action: () => undockModule(navNode.id, moduleId),
        icon: '📤',
        isDestructive: true
      }
    ];
    
    openContextMenu(e, menuItems);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const isVerticalDrag = side === 'top' || side === 'bottom';
    const startPos = isVerticalDrag ? e.clientY : e.clientX;
    const startSize = drawerSize;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      
      const currentPos = isVerticalDrag ? moveEvent.clientY : moveEvent.clientX;
      let delta = 0;

      // Inversão lógica: arrastar para LONGE da barra sempre aumenta o módulo
      if (side === 'bottom') delta = startPos - currentPos;
      else if (side === 'top') delta = currentPos - startPos;
      else if (side === 'left') delta = currentPos - startPos;
      else if (side === 'right') delta = startPos - currentPos;
      
      setDrawerSize(clampSize(startSize + delta));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = isVerticalDrag ? 'ns-resize' : 'ew-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const ActiveComponent = activeModuleId ? ModuleRegistry[activeModuleId] : null;

  // Renderizador de ícone dinâmico
  const renderIcon = (id: ModuleId) => {
    switch(id) {
        case ModuleId.Chat: return '💬';
        case ModuleId.Feed: return '📰';
        case ModuleId.Music: return '🎵';
        case ModuleId.Profile: return '👤';
        case ModuleId.Settings: return '⚙️';
        case ModuleId.CPU: return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{cpuUsage.toFixed(0)}%</span>;
        case ModuleId.RAM: return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{ramUsagePercent.toFixed(0)}%</span>;
        case ModuleId.GPU: return '🎮';
        case ModuleId.Storage: return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{disks[0] ? disks[0].usage_percent.toFixed(0) : '??'}%</span>;
        default: return '🧩';
    }
  };

  const getDrawerStyle = (): React.CSSProperties => {
    if (!activeModuleId) return { opacity: 0, pointerEvents: 'none' };

    const style: React.CSSProperties = { 
      opacity: 1, 
      pointerEvents: 'all',
      position: 'absolute',
      zIndex: 100
    };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20; // Margem das bordas da tela

    if (side === 'bottom' || side === 'top') {
      const width = Math.min(900, viewportWidth - (margin * 2));
      style.width = `${width}px`;
      style.height = `${drawerSize}px`;
      style.left = '50%';
      style.transform = 'translateX(-50%)';
      
      if (side === 'bottom') style.bottom = '60px';
      else style.top = '60px';

      // Ajuste horizontal se o translateX(-50%) falhar (ex: Nav no canto)
      // Como o NavModule está em um container relativo, precisamos garantir que o absolute
      // não saia da tela. Usaremos fixed para o drawer para maior controle.
      style.position = 'fixed';
      const navRect = containerRef.current?.getBoundingClientRect();
      if (navRect) {
        let left = navRect.left + (navRect.width / 2) - (width / 2);
        // Trava nas bordas
        if (left < margin) left = margin;
        if (left + width > viewportWidth - margin) left = viewportWidth - width - margin;
        
        style.left = `${left}px`;
        style.transform = 'none';
        if (side === 'bottom') style.top = `${navRect.top - drawerSize - 10}px`;
        else style.top = `${navRect.bottom + 10}px`;
      }
    } else {
      const height = Math.min(900, viewportHeight - (margin * 2));
      style.height = `${height}px`;
      style.width = `${drawerSize}px`;
      style.position = 'fixed';
      
      const navRect = containerRef.current?.getBoundingClientRect();
      if (navRect) {
        let top = navRect.top + (navRect.height / 2) - (height / 2);
        // Trava nas bordas
        if (top < margin) top = margin;
        if (top + height > viewportHeight - margin) top = viewportHeight - height - margin;
        
        style.top = `${top}px`;
        if (side === 'left') style.left = `${navRect.right + 10}px`;
        else style.left = `${navRect.left - drawerSize - 10}px`;
      }
    }

    return style;
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.navContainer} ${styles[orientation]} ${styles[side]}`}
    >
      <div className={`${styles.drawer} ${activeModuleId ? styles.drawerOpen : ''}`} style={getDrawerStyle()}>
        <div 
          className={`${styles.resizeHandle} ${styles[`handle_${side}`]}`} 
          onMouseDown={handleResizeMouseDown}
        />
        {ActiveComponent && (
          <div className={styles.activeModuleWrapper}>
            <ActiveComponent />
          </div>
        )}
      </div>

      <div className={styles.bar} onContextMenu={handleBarContextMenu}>
        {dockedModules.map((id, index) => (
          <button 
            key={index} 
            className={`${styles.dockItem} ${activeModuleId === id ? styles.dockItemActive : ''}`}
            onClick={() => setActive(activeModuleId === id ? null : id)}
            onContextMenu={(e) => handleIconContextMenu(e, id)}
          >
            {renderIcon(id)}
          </button>
        ))}
      </div>
    </div>
  );
}

function findNavNode(node: any): LayoutModule | null {
    if (node.type === 'module' && node.moduleId === ModuleId.Nav) return node;
    if (node.type === 'split') return findNavNode(node.firstChild) || findNavNode(node.secondChild);
    if (node.type === 'tabs') {
        for (const child of node.children) {
            const found = findNavNode(child);
            if (found) return found;
        }
    }
    return null;
}

function setNavActiveModule(tree: any, moduleId: ModuleId | null): any {
    if (tree.type === 'module' && tree.moduleId === ModuleId.Nav) {
        return { ...tree, activeDockedModule: moduleId };
    }
    if (tree.type === 'split') {
        return {
            ...tree,
            firstChild: setNavActiveModule(tree.firstChild, moduleId),
            secondChild: setNavActiveModule(tree.secondChild, moduleId),
        };
    }
    if (tree.type === 'tabs') {
        return {
            ...tree,
            children: tree.children.map((child: any) => setNavActiveModule(child, moduleId))
        };
    }
    return tree;
}

function getIconForModule(id: ModuleId): React.ReactNode {
    const { cpuUsage, ramUsagePercent, disks } = useHardwareStore.getState();
    const mainDisk = disks[0];

    switch(id) {
        case ModuleId.Chat: return '💬';
        case ModuleId.Feed: return '📰';
        case ModuleId.Music: return '🎵';
        case ModuleId.Profile: return '👤';
        case ModuleId.Settings: return '⚙️';
        case ModuleId.CPU: return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{cpuUsage.toFixed(0)}%</span>;
        case ModuleId.RAM: return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{ramUsagePercent.toFixed(0)}%</span>;
        case ModuleId.GPU: return '🎮';
        case ModuleId.Storage: return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{mainDisk ? mainDisk.usage_percent.toFixed(0) : '??'}%</span>;
        default: return '🧩';
    }
}

function getModuleName(id: ModuleId): string {
    switch(id) {
        case ModuleId.Chat: return 'Chat';
        case ModuleId.Feed: return 'Feed';
        case ModuleId.Music: return 'Música';
        case ModuleId.Profile: return 'Perfil';
        case ModuleId.Settings: return 'Configurações';
        case ModuleId.Music: return 'Música';
        case ModuleId.FavoriteGames: return 'Jogos e Apps';
        case ModuleId.Live: return 'Lives ao Vivo';
        case ModuleId.CPU: return 'Monitor de CPU';
        case ModuleId.RAM: return 'Monitor de RAM';
        case ModuleId.GPU: return 'Monitor de GPU';
        case ModuleId.Storage: return 'Monitor de Disco';
        default: return 'Módulo';
    }
}
