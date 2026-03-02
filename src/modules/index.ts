import React from 'react';
import { ModuleId } from '@/types/module.types';
import { ChatModule } from './Chat/ChatModule';
import { FeedModule } from './Feed/FeedModule';
import { ProfileModule } from './Profile/ProfileModule';
import { NavModule } from './Nav/NavModule';
import { SettingsModule } from './Settings/SettingsModule';
import { CPUModule, RAMModule, GPUModule, StorageModule } from './Hardware/HardwareModules';
import { FeedModule } from './Feed/FeedModule';
import { MusicModule } from './Music/MusicModule';
import { FavoriteGamesModule } from './FavoriteGames/FavoriteGamesModule';
import { LiveModule } from './Live/LiveModule';

/**
 * Mapeia os IDs de módulos para seus componentes reais.
 */
export const ModuleRegistry: Record<string, React.ComponentType<any>> = {
  [ModuleId.Chat]: ChatModule,
  [ModuleId.Feed]: FeedModule,
  [ModuleId.Profile]: ProfileModule,
  [ModuleId.Nav]: NavModule,
  [ModuleId.Settings]: SettingsModule,
  [ModuleId.CPU]: CPUModule,
  [ModuleId.RAM]: RAMModule,
  [ModuleId.GPU]: GPUModule,
  [ModuleId.Storage]: StorageModule,
  [ModuleId.Music]: MusicModule,
  [ModuleId.FavoriteGames]: FavoriteGamesModule,
  [ModuleId.Live]: LiveModule,
};
