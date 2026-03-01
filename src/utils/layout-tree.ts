import { LayoutNode, LayoutModule, LayoutSplit, LayoutTabs, SplitDirection } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';

/**
 * Encontra um nó na árvore de layout pelo seu ID.
 */
export function findNode(tree: LayoutNode, nodeId: string): LayoutNode | null {
  if (tree.id === nodeId) return tree;

  if (tree.type === 'split') {
    return findNode(tree.firstChild, nodeId) || findNode(tree.secondChild, nodeId);
  }

  if (tree.type === 'tabs') {
    return tree.children.find(child => child.id === nodeId) || null;
  }

  return null;
}

/**
 * Retorna todos os nós folha (módulos reais ou abas ativas) da árvore.
 */
export function getLeafNodes(tree: LayoutNode): LayoutModule[] {
  if (tree.type === 'module') return [tree];

  if (tree.type === 'tabs') {
    return [tree.children[tree.activeIndex]];
  }

  return [...getLeafNodes(tree.firstChild), ...getLeafNodes(tree.secondChild)];
}

/**
 * Atualiza a proporção de um nó de split na árvore.
 * @param tree A raiz da árvore de layout.
 * @param nodeId O ID do nó de split a ser atualizado.
 * @param ratio O novo valor da proporção (0 a 1).
 * @returns A nova árvore de layout com o nó atualizado.
 */
export function updateRatio(tree: LayoutNode, nodeId: string, ratio: number): LayoutNode {
    if (tree.id === nodeId && tree.type === 'split') {
        return { ...tree, ratio };
    }
    if (tree.type === 'split') {
        return {
            ...tree,
            firstChild: updateRatio(tree.firstChild, nodeId, ratio),
            secondChild: updateRatio(tree.secondChild, nodeId, ratio),
        };
    }
    return tree;
}

/**
 * Remove um nó da árvore de layout.
 * Esta é uma função complexa que precisa lidar com a reestruturação da árvore.
 * Se um nó é removido de um split, o outro nó do split "sobe" na árvore.
 * @param tree A raiz da árvore de layout.
 * @param nodeId O ID do nó a ser removido.
 * @returns A nova árvore de layout sem o nó. Retorna `null` se a raiz for removida.
 */
export function removeNode(tree: LayoutNode, nodeId: string): LayoutNode | null {
  if (tree.id === nodeId) {
    return null; // A raiz foi removida
  }

  if (tree.type === 'split') {
    if (tree.firstChild.id === nodeId) {
        // O filho da esquerda foi removido, o da direita sobe
        tree.secondChild.parentId = tree.parentId;
        return tree.secondChild;
    }
    if (tree.secondChild.id === nodeId) {
        // O filho da direita foi removido, o da esquerda sobe
        tree.firstChild.parentId = tree.parentId;
        return tree.firstChild;
    }

    const newFirstChild = removeNode(tree.firstChild, nodeId);
    if (!newFirstChild) return tree.secondChild; // Lógica de subida recursiva

    const newSecondChild = removeNode(tree.secondChild, nodeId);
    if (!newSecondChild) return tree.firstChild; // Lógica de subida recursiva

    return {
        ...tree,
        firstChild: newFirstChild,
        secondChild: newSecondChild,
    };
  }
  return tree;
}

/**
 * Transforma um nó em tabs ou adiciona um módulo a um conjunto de tabs existente.
 */
export function mergeIntoTabs(tree: LayoutNode, targetId: string, newNode: LayoutModule): LayoutNode {
  if (tree.id === targetId) {
    if (tree.type === 'module') {
      const newTabs: LayoutTabs = {
        id: crypto.randomUUID(),
        type: 'tabs',
        parentId: tree.parentId,
        children: [tree, { ...newNode, parentId: null }],
        activeIndex: 1
      };
      // Atualiza parentId do segundo filho para apontar para o novo container
      newTabs.children[0].parentId = newTabs.id;
      newTabs.children[1].parentId = newTabs.id;
      return newTabs;
    }

    if (tree.type === 'tabs') {
      return {
        ...tree,
        children: [...tree.children, { ...newNode, parentId: tree.id }],
        activeIndex: tree.children.length
      };
    }
  }

  if (tree.type === 'split') {
    return {
      ...tree,
      firstChild: mergeIntoTabs(tree.firstChild, targetId, newNode),
      secondChild: mergeIntoTabs(tree.secondChild, targetId, newNode),
    };
  }

  return tree;
}

/**
 * Atualiza o índice da aba ativa de um nó do tipo tabs.
 */
export function setTabIndex(tree: LayoutNode, nodeId: string, index: number): LayoutNode {
  if (tree.id === nodeId && tree.type === 'tabs') {
    const newIndex = Math.max(0, Math.min(index, tree.children.length - 1));
    return { ...tree, activeIndex: newIndex };
  }

  if (tree.type === 'split') {
    return {
      ...tree,
      firstChild: setTabIndex(tree.firstChild, nodeId, index),
      secondChild: setTabIndex(tree.secondChild, nodeId, index),
    };
  }

  return tree;
}

/**
 * Atualiza o moduleId de um nó específico na árvore.
 */
export function updateNodeModule(tree: LayoutNode, nodeId: string, newModuleId: ModuleId): LayoutNode {
  if (tree.id === nodeId && tree.type === 'module') {
    return { ...tree, moduleId: newModuleId };
  }

  if (tree.type === 'split') {
    return {
      ...tree,
      firstChild: updateNodeModule(tree.firstChild, nodeId, newModuleId),
      secondChild: updateNodeModule(tree.secondChild, nodeId, newModuleId),
    };
  }

  return tree;
}

/**
 * Insere um novo nó na árvore, substituindo um nó alvo ou dividindo-o.
 * @param tree A raiz da árvore de layout.
 * @param targetId O ID do nó que será substituído ou dividido.
 * @param newNode O novo nó a ser inserido.
 * @param position A posição para inserir o novo nó ('top', 'bottom', 'left', 'right', 'center').
 *                 'center' substitui o alvo, as outras posições criam um split.
 * @returns A nova árvore de layout.
 */
export function insertNode(
  tree: LayoutNode,
  targetId: string,
  newNode: LayoutModule,
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
): LayoutNode {
    if (tree.id !== targetId && tree.type === 'split') {
        return {
            ...tree,
            firstChild: insertNode(tree.firstChild, targetId, newNode, position),
            secondChild: insertNode(tree.secondChild, targetId, newNode, position),
        }
    }

    if (tree.id === targetId && tree.type === 'module') {
        if (position === 'center' || tree.moduleId === ModuleId.Empty) {
            // Substitui o nó alvo pelo novo nó, mantendo o ID e parentId.
            return { ...newNode, id: tree.id, parentId: tree.parentId };
        }

        const newSplitId = crypto.randomUUID();
        const direction: SplitDirection = (position === 'left' || position === 'right') ? 'vertical' : 'horizontal';
        const targetIsFirst = position === 'right' || position === 'bottom';

        const newSplit: LayoutSplit = {
            id: newSplitId,
            type: 'split',
            parentId: tree.parentId,
            direction,
            ratio: 0.5,
            firstChild: targetIsFirst ? { ...tree, parentId: newSplitId } : { ...newNode, parentId: newSplitId },
            secondChild: targetIsFirst ? { ...newNode, parentId: newSplitId } : { ...tree, parentId: newSplitId },
        };
        return newSplit;
    }

    return tree;
}

/**
 * Calcula o tamanho mínimo de um nó.
 */
export function calculateMinSize(
  node: LayoutNode, 
  minSizes: Record<string, { width: number; height: number }> = {}
): { width: number; height: number } {
  if (node.type === 'module') {
    // Retorna o tamanho mínimo do módulo ou um padrão
    return minSizes[node.moduleId] || { width: 150, height: 100 };
  }

  const firstMin = calculateMinSize(node.firstChild, minSizes);
  const secondMin = calculateMinSize(node.secondChild, minSizes);

  if (node.direction === 'vertical') {
    return {
      width: firstMin.width + secondMin.width,
      height: Math.max(firstMin.height, secondMin.height)
    };
  } else {
    return {
      width: Math.max(firstMin.width, secondMin.width),
      height: firstMin.height + secondMin.height
    };
  }
}
