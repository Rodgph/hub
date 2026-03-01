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
            { id: 'add-chat', label: 'Adicionar Chat', action: () => insertNode(nodeId, ModuleId.Chat, 'center'), icon: '💬' },
            { id: 'add-feed', label: 'Adicionar Feed', action: () => insertNode(nodeId, ModuleId.Feed, 'center'), icon: '📰' },
            { id: 'add-music', label: 'Adicionar Música', action: () => insertNode(nodeId, ModuleId.Music, 'center'), icon: '🎵' },
            { id: 'separator-1', isSeparator: true, label: '', action: () => {} },
            { id: 'split-vertical', label: 'Dividir na Vertical', action: () => insertNode(nodeId, ModuleId.Empty, 'right'), icon: '↔️' },
            { id: 'split-horizontal', label: 'Dividir na Horizontal', action: () => insertNode(nodeId, ModuleId.Empty, 'bottom'), icon: '↕️' },
            { id: 'separator-2', isSeparator: true, label: '', action: () => {} },
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
