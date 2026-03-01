import { create } from 'zustand';
import { LayoutNode, LayoutModule } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';
import * as treeUtils from '@/utils/layout-tree';
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
  type: 'module',
  moduleId: ModuleId.Empty,
  parentId: null,
};

interface LayoutState {
  tree: LayoutNode;
  activeNodeId: string | null;
  isLoaded: boolean;
  // Drag and Drop state
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
  setDragState: (draggedId: string | null, targetId?: string | null, position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | null) => void;
  resetLayout: () => void;
  saveLayout: () => void;
  loadLayout: () => Promise<void>;
}

// O save é debounced para não sobrecarregar o Supabase durante o resize.
const debouncedSave = debounce((tree: LayoutNode) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    userService.saveLayout(userId, tree);
}, 2000);


export const useLayoutStore = create<LayoutState & LayoutActions>((set, get) => ({
  tree: initialLayout,
  activeNodeId: null,
  isLoaded: false,

  draggedNodeId: null,
  dropTargetId: null,
  dropPosition: null,

  insertNode: (targetId, newModuleId, position) => {
    const newModule: LayoutModule = {
        id: crypto.randomUUID(),
        type: 'module',
        moduleId: newModuleId,
        parentId: ''
    };
    set(state => ({
        tree: treeUtils.insertNode(state.tree, targetId, newModule, position)
    }));
    get().saveLayout();
  },

  moveNode: (sourceId, targetId, position, isAltPressed = false) => {
    if (sourceId === targetId) return;
    
    const sourceNode = treeUtils.findNode(get().tree, sourceId) as LayoutModule;
    const targetNode = treeUtils.findNode(get().tree, targetId);
    
    if (!sourceNode || sourceNode.type !== 'module') return;

    if (isAltPressed && targetNode && (targetNode.type === 'module' || targetNode.type === 'tabs')) {
      set(state => {
        const treeWithoutSource = treeUtils.removeNode(state.tree, sourceId) || initialLayout;
        const newTree = treeUtils.mergeIntoTabs(treeWithoutSource, targetId, sourceNode);
        return { tree: newTree, draggedNodeId: null, dropTargetId: null, dropPosition: null };
      });
    } else if (position === 'center') {
      if (!targetNode || targetNode.type !== 'module') return;
      
      set(state => {
        const sourceModuleId = sourceNode.moduleId;
        const targetModuleId = targetNode.moduleId;
        let newTree = treeUtils.updateNodeModule(state.tree, sourceId, targetModuleId);
        newTree = treeUtils.updateNodeModule(newTree, targetId, sourceModuleId);
        return { tree: newTree, draggedNodeId: null, dropTargetId: null, dropPosition: null };
      });
    } else {
      set(state => {
        const treeWithoutSource = treeUtils.removeNode(state.tree, sourceId) || initialLayout;
        const newTree = treeUtils.insertNode(treeWithoutSource, targetId, sourceNode, position);
        return { tree: newTree, draggedNodeId: null, dropTargetId: null, dropPosition: null };
      });
    }
    get().saveLayout();
  },

  setTabIndex: (nodeId, index) => {
    set(state => ({
      tree: treeUtils.setTabIndex(state.tree, nodeId, index)
    }));
    get().saveLayout();
  },

  setDragState: (draggedId, targetId = null, position = null) => {
    set({ 
      draggedNodeId: draggedId, 
      dropTargetId: targetId, 
      dropPosition: position 
    });
  },

  removeNode: (nodeId) => {
    set(state => {
        const newTree = treeUtils.removeNode(state.tree, nodeId);
        return { tree: newTree || initialLayout }; // Se a árvore ficar vazia, reseta
    });
    get().saveLayout();
  },

  updateRatio: (nodeId, ratio) => {
    set(state => ({
        tree: treeUtils.updateRatio(state.tree, nodeId, ratio)
    }));
    get().saveLayout();
  },

  setActiveNode: (nodeId) => {
    set({ activeNodeId: nodeId });
  },

  resetLayout: () => {
    set({ tree: initialLayout, activeNodeId: null });
    get().saveLayout();
  },

  saveLayout: () => {
    if (!get().isLoaded) return; // Não salva antes de carregar o layout inicial
    const { tree } = get();
    debouncedSave(tree);
  },

  loadLayout: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
        set({ isLoaded: true });
        return;
    };

    const savedLayout = await userService.getLayout(userId);
    if (savedLayout) {
        set({ tree: savedLayout });
    }
    set({ isLoaded: true });
  },
}));
