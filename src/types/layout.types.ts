import { ModuleId } from './module.types';

/**
 * Direção de um split no layout.
 */
export type SplitDirection = 'horizontal' | 'vertical';

/**
 * Representa um nó folha na árvore de layout, que contém um módulo de produto.
 */
export interface LayoutModule {
  /** ID único deste nó, geralmente um UUID. */
  id: string;
  /** Tipo do nó, sempre 'module'. */
  type: 'module';
  /** ID do módulo que este nó renderiza. */
  moduleId: ModuleId;
  /** ID do nó pai. `null` se for a raiz. */
  parentId: string | null;
  /** Módulos acoplados dentro deste nó (especialmente para o Nav) */
  dockedModules?: ModuleId[];
  /** Módulo acoplado atualmente visível */
  activeDockedModule?: ModuleId | null;
}

/**
 * Representa um nó interno na árvore de layout, que se divide em dois filhos.
 */
export interface LayoutSplit {
  /** ID único deste nó, geralmente um UUID. */
  id: string;
  /** Tipo do nó, sempre 'split'. */
  type: 'split';
  /** ID do nó pai. `null` se for a raiz. */
  parentId: string | null;
  /** Direção da divisão. */
  direction: SplitDirection;
  /**
   * Proporção da divisão (entre 0 e 1).
   * Para 'vertical', representa a proporção da largura do primeiro filho.
   * Para 'horizontal', representa a proporção da altura do primeiro filho.
   */
  ratio: number;
  /** O primeiro nó filho da divisão. */
  firstChild: LayoutNode;
  /** O segundo nó filho da divisão. */
  secondChild: LayoutNode;
}

/**
 * Representa um conjunto de abas dentro de um mesmo painel.
 */
export interface LayoutTabs {
  id: string;
  type: 'tabs';
  parentId: string | null;
  /** Lista de módulos dentro deste conjunto de abas. */
  children: LayoutModule[];
  /** Índice da aba selecionada no momento. */
  activeIndex: number;
}

/**
 * Union type que representa qualquer nó na árvore de layout.
 * A árvore é uma estrutura recursiva composta por splits, módulos e abas.
 */
export type LayoutNode = LayoutSplit | LayoutModule | LayoutTabs;
