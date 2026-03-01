/**
 * Enum com todos os módulos de produto disponíveis na aplicação.
 */
export enum ModuleId {
  // Core
  Chat = 'chat',
  Feed = 'feed',
  Music = 'music',
  Live = 'live',
  Videos = 'videos',
  Films = 'films',
  Browser = 'browser',
  FavoriteGames = 'favorite_games',
  RemoteShare = 'remote_share',
  ScreenShare = 'screen_share',
  MotionWallpaper = 'motion_wallpaper',
  PerformanceGovernor = 'performance_governor',
  Marketplace = 'marketplace',
  Projects = 'projects',
  Settings = 'settings',
  Notifications = 'notifications',
  Welcome = 'welcome',

  // Placeholders/System
  Unknown = 'unknown',
  Empty = 'empty',
}

/**
 * Modo de exibição de um módulo.
 */
export enum ModuleMode {
  /** Ocupa um painel inteiro no layout. */
  Docked = 'docked',
  /** Flutua em uma janela separada. */
  Widget = 'widget',
}

/**
 * Configuração de um módulo específico, incluindo seus metadados.
 */
export interface ModuleConfig {
  /** Identificador único do módulo. */
  id: ModuleId;
  /** Nome de exibição do módulo. */
  name: string;
  /** Ícone associado ao módulo (usado na UI). */
  icon: string; // Pode ser um nome de ícone de uma biblioteca ou um SVG
  /** Tamanho mínimo que o módulo pode ocupar (largura/altura em pixels). */
  minSize: {
    width: number;
    height: number;
  };
}
