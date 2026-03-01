import React from 'react';
import { ModuleId } from '@/types/module.types';
import { ChatModule } from './Chat/ChatModule';
import { FeedModule } from './Feed/FeedModule';

/**
 * Mapeia os IDs de módulos para seus componentes reais.
 */
export const ModuleRegistry: Record<string, React.ComponentType<any>> = {
  [ModuleId.Chat]: ChatModule,
  [ModuleId.Feed]: FeedModule,
};
