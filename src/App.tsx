import React, { useEffect, useState } from 'react';
import '@/styles/global.module.css';
import '@/styles/tokens.css';
import '@/styles/themes/dark.css';
import { AppLayout } from './layouts/AppLayout';
import { LoginScreen } from './screens/LoginScreen';
import { RealtimeProvider } from './engine/realtime/RealtimeProvider';
import { useOffline } from './hooks/useOffline';
import { usePresence } from './hooks/usePresence';
import { useAuthStore } from './store/auth.store';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';

/**
 * Ponto de entrada principal da aplicação.
 * Gerencia os provedores globais e o roteamento entre janelas (Auth vs Main).
 */
export default function App() {
  const { user, isLoading, initialize } = useAuthStore();
  
  // Obtém o label da janela de forma síncrona
  const windowLabel = getCurrentWebviewWindow().label;

  // 1. Inicializa o sistema de autenticação
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 2. Efeito de Transição
  useEffect(() => {
    if (user && windowLabel === 'auth') {
      const transition = async () => {
        try {
          // 1. Avisa o Rust para mostrar a principal
          await invoke('show_main_window');
          
          // 2. A própria janela auth se fecha imediatamente
          const win = getCurrentWebviewWindow();
          await win.close();
        } catch (e) {
          console.error('[App] Erro na transição:', e);
        }
      };
      transition();
    }
  }, [user, windowLabel]);

  // Hooks globais
  useOffline();
  usePresence();

  // PRIORIDADE: Roteamento da Janela Principal
  if (windowLabel === 'main') {
    // Se não houver usuário ou ainda estiver carregando a sessão,
    // não renderiza ABSOLUTAMENTE NADA para a janela principal.
    // Isso garante que ela fique 100% oculta/vazia até o login.
    if (isLoading || !user) return null;

    return (
      <RealtimeProvider>
        <AppLayout />
      </RealtimeProvider>
    );
  }

  // Estado de Carregamento (Apenas para a janela de AUTH)
  if (isLoading) {
    return <div style={{ width: '100vw', height: '100vh', background: '#000' }} />;
  }

  // JANELA DE AUTENTICAÇÃO
  if (windowLabel === 'auth') {
    if (user) return <div style={{ width: '100vw', height: '100vh', background: '#000' }} />;
    return <LoginScreen />;
  }

  return null;
}
