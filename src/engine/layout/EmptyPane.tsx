import React from 'react';
import styles from './layout.module.css';
import { useLayoutStore } from '@/store/layout.store';
import { useAuthStore } from '@/store/auth.store';
import { ModuleId } from '@/types/module.types';
import { useContextMenu } from '@/hooks/useContextMenu';
import { MenuItem } from '@/store/context-menu.store';

interface EmptyPaneProps {
    nodeId: string;
}

export function EmptyPane({ nodeId }: EmptyPaneProps) {
    const { openContextMenu } = useContextMenu();
    const insertNode = useLayoutStore(state => state.insertNode);

    const handleContextMenu = (e: React.MouseEvent) => {
        const menuItems: MenuItem[] = [
            { id: 'add-nav', label: 'Navegação (Barra)', action: () => insertNode(nodeId, ModuleId.Nav, 'center'), icon: '🧭' },
            { id: 'sep-p', type: 'separator' } as any,
            { id: 'add-chat', label: 'Chat DM', action: () => insertNode(nodeId, ModuleId.Chat, 'center'), icon: '💬' },
            { id: 'add-feed', label: 'Feed Social', action: () => insertNode(nodeId, ModuleId.Feed, 'center'), icon: '📰' },
            { id: 'add-music', label: 'Música & Player', action: () => insertNode(nodeId, ModuleId.Music, 'center'), icon: '🎵' },
            { id: 'add-games', label: 'Jogos & Apps', action: () => insertNode(nodeId, ModuleId.FavoriteGames, 'center'), icon: '🎮' },
            { id: 'add-live', label: 'Lives ao Vivo', action: () => insertNode(nodeId, ModuleId.Live, 'center'), icon: '📺' },
            { id: 'sep-h', type: 'separator' } as any,
            { 
                id: 'hardware', 
                label: 'Monitores de Hardware', 
                icon: '⚡',
                children: [
                    { id: 'add-cpu', label: 'Uso de CPU', action: () => insertNode(nodeId, ModuleId.CPU, 'center'), icon: '⚡' },
                    { id: 'add-ram', label: 'Memória RAM', action: () => insertNode(nodeId, ModuleId.RAM, 'center'), icon: '🧠' },
                    { id: 'add-gpu', label: 'Placa de Vídeo', action: () => insertNode(nodeId, ModuleId.GPU, 'center'), icon: '🎮' },
                    { id: 'add-hd', label: 'Armazenamento', action: () => insertNode(nodeId, ModuleId.Storage, 'center'), icon: '💾' },
                ]
            },
            { id: 'add-settings', label: 'Configurações', action: () => insertNode(nodeId, ModuleId.Settings, 'center'), icon: '⚙️' },
            { id: 'separator-1', type: 'separator' } as any,
            { id: 'split-vertical', label: 'Dividir na Vertical', action: () => insertNode(nodeId, ModuleId.Empty, 'right'), icon: '↔️' },
            { id: 'split-horizontal', label: 'Dividir na Horizontal', action: () => insertNode(nodeId, ModuleId.Empty, 'bottom'), icon: '↕️' },
            { id: 'separator-2', type: 'separator' } as any,
            { 
                id: 'logoff', 
                label: 'Sair do Sistema', 
                action: () => {
                    useAuthStore.getState().signOut();
                }, 
                icon: '🚪',
                isDestructive: true 
            },
        ];
        openContextMenu(e, menuItems);
    };

    return (
        <div className={styles.emptyPane} onContextMenu={handleContextMenu}>
            <span>Painel Vazio</span>
            <span style={{ fontSize: '12px' }}>Clique com o botão direito para adicionar um módulo</span>
        </div>
    );
}
