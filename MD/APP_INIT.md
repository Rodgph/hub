# APP_INIT.md — Ordem de Inicialização do App

> **ATENÇÃO PARA A IA:** Esta é a ordem EXATA em que o app inicializa. Race conditions acontecem quando componentes tentam usar dados antes de estarem disponíveis. Seguir esta ordem evita telas em branco, erros de "undefined is not a function" e loops de redirecionamento.

---

## VISÃO GERAL — Do clique no ícone até o usuário ver a tela

```
1. Tauri abre a janela main (main.rs)
2. Tauri cria a janela search (oculta)
3. Aplica efeito Mica/Acrylic (main + search)
4. Registra atalhos globais
5. Configura tray icon
6. Inicia background jobs (cold storage)
7. Carrega React (main.tsx)
8. Inicializa i18n
9. Inicializa Supabase client
10. Monta <App />
11. App verifica sessão do usuário
11a. Sem sessão → exibe tela de Login
11b. Com sessão → inicia carregamento de dados
12. Carrega user_settings (tema, idioma, layout)
13. Aplica tema salvo
14. Inicializa RealtimeProvider (abre WebSocket)
15. Carrega dados iniciais (conversas, notificações)
16. Exibe AppLayout com dados
```


---

## main.tsx — Ponto de entrada React

```tsx
// src/main.tsx
// ORDEM IMPORTA — não reordenar

import React from 'react'
import ReactDOM from 'react-dom/client'

// 1. i18n ANTES de qualquer componente React
import './i18n/index'

// 2. Estilos globais ANTES de componentes
import './styles/global.module.css'
import './styles/tokens.css'
import './styles/animations.css'

// 3. App
import App from './App'

// 4. Aplicar tema padrão no elemento raiz ANTES de montar
// (evita flash de tema errado)
document.documentElement.setAttribute('data-theme', 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## App.tsx — Roteamento e providers

```tsx
// src/App.tsx
// Ordem dos providers IMPORTA — providers internos dependem dos externos

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { RealtimeProvider } from '@/engine/realtime/RealtimeProvider'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthScreen } from '@/modules/Auth/AuthScreen'
import { Welcome } from '@/modules/Welcome'
import { useDeepLink } from '@/hooks/useDeepLink'
import { useShortcuts } from '@/hooks/useShortcuts'
import { useOffline } from '@/hooks/useOffline'

export default function App() {
  const { user, isLoading, initialize } = useAuthStore()
  const { applyTheme } = useThemeStore()
  const [appReady, setAppReady] = useState(false)

  // Hooks globais — inicializam uma vez, ficam ativos para sempre
  useDeepLink()    // Escuta deep links app://
  useShortcuts()   // Registra atalhos de teclado
  useOffline()     // Detecta conexão/desconexão

  useEffect(() => {
    const init = async () => {
      // 1. Verifica sessão salva
      await initialize()
      setAppReady(true)
    }
    init()
  }, [])

  // 2. Aplica tema quando usuário carregar (pode ter tema salvo)
  useEffect(() => {
    if (user?.settings?.theme) {
      applyTheme(user.settings.theme)
    }
  }, [user?.settings?.theme])

  // App ainda inicializando — mostrar nada (fundo preto do Mica)
  if (!appReady || isLoading) {
    return null
  }

  // Não autenticado → login
  if (!user) {
    return <AuthScreen />
  }

  // Autenticado mas não completou onboarding
  if (!user.username) {
    return <Welcome />
  }

  // Autenticado e com perfil completo → app principal
  return (
    // RealtimeProvider só monta quando usuário está autenticado
    // (garante que temos user.id para os canais)
    <RealtimeProvider userId={user.id}>
      <AppLayout />
    </RealtimeProvider>
  )
}
```

---

## auth.store.ts — initialize() em detalhe

```ts
// src/store/auth.store.ts

initialize: async () => {
  set({ isLoading: true })

  try {
    // 1. Verificar sessão salva localmente
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      set({ user: null, isLoading: false })
      return
    }

    // 2. Buscar dados do perfil do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('*, user_settings(*), user_status(*)')
      .eq('id', session.user.id)
      .single()

    set({
      user: userData,
      session,
      isLoading: false
    })

    // 3. Marcar usuário como online
    await supabase
      .from('user_status')
      .update({ status: 'online' })
      .eq('user_id', session.user.id)

    // 4. Escutar mudanças de auth (logout em outro dispositivo, token expirado)
    supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null, session: null })
      }
      if (event === 'TOKEN_REFRESHED' && newSession) {
        set({ session: newSession })
      }
    })

  } catch (error) {
    // Sessão inválida — limpar e ir para login
    await supabase.auth.signOut()
    set({ user: null, isLoading: false })
  }
}
```

---

## RealtimeProvider — O que inicializa e em que ordem

```tsx
// src/engine/realtime/RealtimeProvider.tsx

export function RealtimeProvider({
  userId,
  children
}: {
  userId: string
  children: React.ReactNode
}) {
  useEffect(() => {
    // Ordem de subscribe importa — mais críticos primeiro

    // 1. Presença global (outros usuários vendo meu status)
    const presenceChannel = supabase.channel('presence:global')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_status' },
        handlers.onPresenceChange)
      .subscribe()

    // 2. Minhas notificações
    const notifChannel = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}` },
        handlers.onNotification)
      .subscribe()

    // 3. Minhas configurações (sincronização entre dispositivos)
    const settingsChannel = supabase.channel(`settings:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_settings',
        filter: `user_id=eq.${userId}` },
        handlers.onSettingsChange)
      .subscribe()

    // 4. Feed global
    const feedChannel = supabase.channel('feed:global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        handlers.onNewPost)
      .subscribe()

    // Cleanup obrigatório — sem isso, canais acumulam a cada remount
    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(settingsChannel)
      supabase.removeChannel(feedChannel)
    }
  }, [userId])  // Re-inicializa se userId mudar (troca de conta)

  return <>{children}</>
}

// NOTA: Canais de conversa (messages) são abertos/fechados
// pelo chat.store ao abrir/fechar uma conversa — não aqui.
// Apenas canais globais ficam abertos o tempo todo.
```

---

## AppLayout — O que renderiza e em que ordem

```tsx
// src/layouts/AppLayout.tsx

export function AppLayout() {
  // Carregar dados iniciais ao montar
  const { loadConversations } = useChatStore()
  const { loadNotifications } = useNotificationStore()
  const { loadHardwareData } = useHardwareStore()

  useEffect(() => {
    // Paralelo — todos ao mesmo tempo
    Promise.all([
      loadConversations(),
      loadNotifications(),
    ])
  }, [])

  // Hardware polling — separado pois usa Tauri invoke
  useHardware()  // hook que faz polling a cada HARDWARE_POLL_INTERVAL_MS

  return (
    <div className={styles.layout}>
      {/* 1. OfflineBanner — no topo, fora do fluxo */}
      <OfflineBanner />

      {/* 2. Área principal — LayoutEngine ocupa todo o espaço restante */}
      <main className={styles.main}>
        <LayoutEngine />
      </main>

      {/* 3. BottomBar — sempre visível, fixada no fundo */}
      <BottomBar />
    </div>
  )
}
```

---

## Estados de inicialização — O que mostrar em cada estado

| Estado | O que renderizar |
|---|---|
| `appReady = false` | `null` — fundo preto do Mica (sem flash) |
| `isLoading = true` | `null` — mesmo motivo |
| `user = null` | Tela de Login |
| `user.username = ''` | Tela de Welcome (onboarding) |
| `user` completo | AppLayout |

**Por que `null` e não um spinner de carregamento?**
O app usa Mica/Acrylic — o fundo já é bonito. Mostrar um spinner por 200-300ms seria ruído visual. O tempo de verificação de sessão é rápido o suficiente para não precisar de feedback.

---

## Cleanup ao sair do app

```ts
// src/store/auth.store.ts — logout()

logout: async () => {
  // 1. Marcar como offline antes de sair
  const userId = get().user?.id
  if (userId) {
    await supabase
      .from('user_status')
      .update({ status: 'offline', last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  // 2. Fechar todos os canais Realtime
  await supabase.removeAllChannels()

  // 3. Limpar sessão
  await supabase.auth.signOut()

  // 4. Limpar stores
  set({ user: null, session: null })
}
```

```rust
// src-tauri/src/main.rs — ao fechar a janela principal
// Emitir evento para o frontend antes de fechar
// para que o logout possa ser executado

.on_window_event(|window, event| {
  if let tauri::WindowEvent::CloseRequested { api, .. } = event {
    if window.label() == "main" {
      window.emit("app:closing", ()).unwrap();
      // Dar tempo para o frontend executar cleanup (500ms)
      std::thread::sleep(std::time::Duration::from_millis(500));
    }
  }
})
```
