import { LayoutNode, LayoutModule, LayoutSplit, LayoutTabs, SplitDirection } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';

export function findFirstEmptyNode(tree: LayoutNode): string | null {
  if (tree.type === 'module' && tree.moduleId === ModuleId.Empty) return tree.id;
  if (tree.type === 'split') return findFirstEmptyNode(tree.firstChild) || findFirstEmptyNode(tree.secondChild);
  if (tree.type === 'tabs') {
    for (const child of tree.children) {
      const found = findFirstEmptyNode(child);
      if (found) return found;
    }
  }
  return null;
}

export function getLeafNodes(tree: LayoutNode): LayoutModule[] {
  if (tree.type === 'module') return [tree];
  if (tree.type === 'split') return [...getLeafNodes(tree.firstChild), ...getLeafNodes(tree.secondChild)];
  if (tree.type === 'tabs') return tree.children.flatMap(getLeafNodes);
  return [];
}

export function findNode(tree: LayoutNode, nodeId: string): LayoutNode | null {
  if (tree.id === nodeId) return tree;
  if (tree.type === 'split') return findNode(tree.firstChild, nodeId) || findNode(tree.secondChild, nodeId);
  if (tree.type === 'tabs') {
    for (const child of tree.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

export function insertNode(
  tree: LayoutNode,
  targetId: string,
  newNode: LayoutModule,
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
): LayoutNode {
    if (tree.id !== targetId) {
        if (tree.type === 'split') {
            return {
                ...tree,
                firstChild: insertNode(tree.firstChild, targetId, newNode, position),
                secondChild: insertNode(tree.secondChild, targetId, newNode, position),
            }
        }
        if (tree.type === 'tabs') {
            return {
                ...tree,
                children: tree.children.map(child => insertNode(child, targetId, newNode, position))
            };
        }
    }

    if (tree.id === targetId && tree.type === 'module') {
        if (position === 'center' || tree.moduleId === ModuleId.Empty) {
            return { ...newNode, id: tree.id, parentId: tree.parentId };
        }

        const newSplitId = crypto.randomUUID();
        const direction: SplitDirection = (position === 'left' || position === 'right') ? 'vertical' : 'horizontal';
        const targetIsFirst = position === 'right' || position === 'bottom';

        return {
            id: newSplitId,
            type: 'split',
            parentId: tree.parentId,
            direction,
            ratio: 0.5,
            firstChild: targetIsFirst ? { ...tree, parentId: newSplitId } : { ...newNode, parentId: newSplitId },
            secondChild: targetIsFirst ? { ...newNode, parentId: newSplitId } : { ...tree, parentId: newSplitId },
        };
    }

    return tree;
}

export function removeNode(tree: LayoutNode, nodeId: string): LayoutNode | null {
  if (tree.id === nodeId) return null;
  if (tree.type === 'split') {
    if (tree.firstChild.id === nodeId) return tree.secondChild;
    if (tree.secondChild.id === nodeId) return tree.firstChild;
    return {
        ...tree,
        firstChild: removeNode(tree.firstChild, nodeId) || tree.secondChild,
        secondChild: removeNode(tree.secondChild, nodeId) || tree.firstChild,
    };
  }
  if (tree.type === 'tabs') {
    const newChildren = tree.children.filter(child => child.id !== nodeId);
    if (newChildren.length === 0) return null;
    if (newChildren.length === 1) return newChildren[0];
    return { ...tree, children: newChildren, activeIndex: Math.min(tree.activeIndex, newChildren.length - 1) };
  }
  return tree;
}

export function updateRatio(tree: LayoutNode, nodeId: string, ratio: number): LayoutNode {
    if (tree.id === nodeId && tree.type === 'split') return { ...tree, ratio };
    if (tree.type === 'split') return { ...tree, firstChild: updateRatio(tree.firstChild, nodeId, ratio), secondChild: updateRatio(tree.secondChild, nodeId, ratio) };
    if (tree.type === 'tabs') return { ...tree, children: tree.children.map(child => updateRatio(child, nodeId, ratio)) };
    return tree;
}

export function updateNodeModule(tree: LayoutNode, nodeId: string, newModuleId: ModuleId): LayoutNode {
  if (tree.id === nodeId && tree.id !== 'nav-bar' && tree.type === 'module') return { ...tree, moduleId: newModuleId };
  if (tree.type === 'split') return { ...tree, firstChild: updateNodeModule(tree.firstChild, nodeId, newModuleId), secondChild: updateNodeModule(tree.secondChild, nodeId, newModuleId) };
  if (tree.type === 'tabs') return { ...tree, children: tree.children.map(child => updateNodeModule(child, nodeId, newModuleId)) };
  return tree;
}

export function mergeIntoTabs(tree: LayoutNode, targetId: string, newNode: LayoutModule): LayoutNode {
  if (tree.id === targetId && tree.type === 'module') {
      const newTabs: LayoutTabs = {
        id: crypto.randomUUID(), type: 'tabs', parentId: tree.parentId,
        children: [tree, { ...newNode, parentId: 'temp' }], activeIndex: 1
      };
      return newTabs;
  }
  if (tree.type === 'split') return { ...tree, firstChild: mergeIntoTabs(tree.firstChild, targetId, newNode), secondChild: mergeIntoTabs(tree.secondChild, targetId, newNode) };
  if (tree.type === 'tabs') return { ...tree, children: [...tree.children, { ...newNode, parentId: tree.id }], activeIndex: tree.children.length };
  return tree;
}

export function setTabIndex(tree: LayoutNode, nodeId: string, index: number): LayoutNode {
  if (tree.id === nodeId && tree.type === 'tabs') return { ...tree, activeIndex: index };
  if (tree.type === 'split') return { ...tree, firstChild: setTabIndex(tree.firstChild, nodeId, index), secondChild: setTabIndex(tree.secondChild, nodeId, index) };
  if (tree.type === 'tabs') return { ...tree, children: tree.children.map(child => setTabIndex(child, nodeId, index)) };
  return tree;
}

export function dockModule(tree: LayoutNode, targetId: string, moduleId: ModuleId): LayoutNode {
  if (tree.id === targetId && tree.type === 'module') {
    const docked = tree.dockedModules || [];
    if (docked.includes(moduleId)) return { ...tree, activeDockedModule: moduleId };
    
    return {
      ...tree,
      dockedModules: [...docked, moduleId],
      activeDockedModule: moduleId
    };
  }
  if (tree.type === 'split') {
    return {
      ...tree,
      firstChild: dockModule(tree.firstChild, targetId, moduleId),
      secondChild: dockModule(tree.secondChild, targetId, moduleId),
    };
  }
  if (tree.type === 'tabs') {
    return {
      ...tree,
      children: tree.children.map(child => dockModule(child, targetId, moduleId))
    };
  }
  return tree;
}

export function undockModule(tree: LayoutNode, targetId: string, moduleId: ModuleId): LayoutNode {
  if (tree.id === targetId && tree.type === 'module') {
    const docked = (tree.dockedModules || []).filter(m => m !== moduleId);
    return {
      ...tree,
      dockedModules: docked,
      activeDockedModule: tree.activeDockedModule === moduleId ? null : tree.activeDockedModule
    };
  }
  if (tree.type === 'split') {
    return {
      ...tree,
      firstChild: undockModule(tree.firstChild, targetId, moduleId),
      secondChild: undockModule(tree.secondChild, targetId, moduleId),
    };
  }
  if (tree.type === 'tabs') {
    return {
      ...tree,
      children: tree.children.map(child => undockModule(child, targetId, moduleId))
    };
  }
  return tree;
}

export function calculateMinSize(node: LayoutNode, minSizes: any): { width: number; height: number } {
  return { width: 100, height: 100 };
}
