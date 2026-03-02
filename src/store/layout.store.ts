import { create } from 'zustand';
import { LayoutNode, LayoutModule } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';
import { 
  insertNode, 
  removeNode, 
  findNode, 
  mergeIntoTabs, 
  updateNodeModule, 
  updateRatio, 
  setTabIndex, 
  dockModule, 
  undockModule 
} from '@/utils/layout-tree';
import { userService } from '@/services/user.service';
import { useAuthStore } from './auth.store';

// Helper para debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const initialLayout: LayoutNode = {
  id: 'root',
  type: 'split',
  direction: 'horizontal',
  ratio: 0.9,
  parentId: null,
  firstChild: {
    id: 'main-content',
    type: 'module',
    moduleId: ModuleId.Empty,
    parentId: 'root',
  },
  secondChild: {
    id: 'nav-bar',
    type: 'module',
    moduleId: ModuleId.Nav,
    parentId: 'root',
    dockedModules: [ModuleId.Chat, ModuleId.Feed, ModuleId.Profile, ModuleId.Settings],
  }
};

interface LayoutState {
  tree: LayoutNode;
  activeNodeId: string | null;
  isLoaded: boolean;
  revision: number;
  draggedNodeId: string | null;
  dropTargetId: string | null;
  dropPosition: 'top' | 'bottom' | 'left' | 'right' | 'center' | null;
}

interface LayoutActions {
  insertNode: (targetId: string, newModuleId: ModuleId, position: 'top' | 'bottom' | 'left' | 'right' | 'center') => void;
  moveNode: (sourceId: string, targetId: string, position: 'top' | 'bottom' | 'left' | 'right' | 'center', isAltPressed?: boolean) => void;
  removeNode: (nodeId: string) => void;
  updateRatio: (nodeId: string, ratio: number) => void;
  setActiveNode: (nodeId: string | null) => void;
  setTabIndex: (nodeId: string, index: number) => void;
  undockModule: (targetId: string, moduleId: ModuleId) => void;
  dockModule: (targetId: string, moduleId: ModuleId) => void;
  setDragState: (draggedId: string | null, targetId?: string | null, position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | null) => void;
  resetLayout: () => void;
  saveLayout: () => void;
  loadLayout: () => Promise<void>;
}

const debouncedSave = debounce((tree: LayoutNode) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    userService.saveLayout(userId, tree);
}, 2000);

export const useLayoutStore = create<LayoutState & LayoutActions>((set, get) => ({
  tree: initialLayout,
  activeNodeId: null,
  isLoaded: false,
  revision: 0,
  draggedNodeId: null,
  dropTargetId: null,
  dropPosition: null,

  insertNode: (targetId, newModuleId, position) => {
    set(state => ({
      tree: insertNode(state.tree, targetId, {
        id: crypto.randomUUID(),
        type: 'module',
        moduleId: newModuleId,
        parentId: ''
      } as LayoutModule, position),
      revision: state.revision + 1
    }));
    get().saveLayout();
  },

  moveNode: (sourceId, targetId, position, isAltPressed = false) => {
    if (sourceId === targetId) return;
    const sourceNode = findNode(get().tree, sourceId) as LayoutModule;
    if (!sourceNode || sourceNode.type !== 'module') return;

    set(state => {
      let newTree;
      const targetNode = findNode(state.tree, targetId) as LayoutModule;

      // LOUCURA: Se o alvo for o Nav e o drop for no centro, docamos o módulo
      if (targetNode?.moduleId === ModuleId.Nav && position === 'center') {
        // 1. Remove o nó de origem da árvore principal
        const treeWithoutSource = removeNode(state.tree, sourceId) || initialLayout;
        // 2. Adiciona o moduleId de origem ao inventário do Nav
        newTree = dockModule(treeWithoutSource, targetId, sourceNode.moduleId);
        return { tree: newTree, revision: state.revision + 1, draggedNodeId: null, dropTargetId: null, dropPosition: null };
      }

      if (isAltPressed) {
        const tempTree = removeNode(state.tree, sourceId) || initialLayout;
        newTree = mergeIntoTabs(tempTree, targetId, sourceNode);
      } else if (position === 'center') {
        const targetNode = findNode(state.tree, targetId) as LayoutModule;
        if (!targetNode || targetNode.type !== 'module') return state;
        newTree = updateNodeModule(state.tree, sourceId, targetNode.moduleId);
        newTree = updateNodeModule(newTree, targetId, sourceNode.moduleId);
      } else {
        const tempTree = removeNode(state.tree, sourceId) || initialLayout;
        newTree = insertNode(tempTree, targetId, sourceNode, position);
      }
      return { tree: newTree, revision: state.revision + 1, draggedNodeId: null, dropTargetId: null, dropPosition: null };
    });
    get().saveLayout();
  },

  removeNode: (nodeId) => {
    set(state => ({
      tree: removeNode(state.tree, nodeId) || initialLayout,
      revision: state.revision + 1
    }));
    get().saveLayout();
  },

  updateRatio: (nodeId, ratio) => {
    set(state => ({
      tree: updateRatio(state.tree, nodeId, ratio),
      revision: state.revision + 1
    }));
    get().saveLayout();
  },

  setTabIndex: (nodeId, index) => {
    set(state => ({
      tree: setTabIndex(state.tree, nodeId, index),
      revision: state.revision + 1
    }));
    get().saveLayout();
  },

  undockModule: (targetId, moduleId) => {
    set(state => {
      return {
        tree: undockModule(state.tree, targetId, moduleId),
        revision: state.revision + 1
      };
    });
    get().saveLayout();
  },

  dockModule: (targetId, moduleId) => {
    set(state => {
      return {
        tree: dockModule(state.tree, targetId, moduleId),
        revision: state.revision + 1
      };
    });
    get().saveLayout();
  },

  setActiveNode: (nodeId) => set({ activeNodeId: nodeId }),

  setDragState: (draggedId, targetId = null, position = null) => {
    set({ draggedNodeId: draggedId, dropTargetId: targetId, dropPosition: position });
  },

  resetLayout: () => {
    set({ tree: initialLayout, activeNodeId: null, revision: get().revision + 1 });
    get().saveLayout();
  },

  saveLayout: () => {
    if (!get().isLoaded) return;
    debouncedSave(get().tree);
  },

  loadLayout: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) { set({ isLoaded: true }); return; }
    
    try {
      const savedLayout = await userService.getLayout(userId);
      if (savedLayout && savedLayout.type) {
        console.log('[LayoutStore] Layout carregado com sucesso');
        set({ tree: savedLayout, revision: get().revision + 1 });
      } else {
        console.warn('[LayoutStore] Layout salvo inválido ou vazio, usando padrão');
        set({ tree: initialLayout });
      }
    } catch (error) {
      console.error('[LayoutStore] Falha ao carregar layout:', error);
      set({ tree: initialLayout });
    } finally {
      set({ isLoaded: true });
    }
  },
}));
