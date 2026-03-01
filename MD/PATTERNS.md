# PATTERNS.md — Padrões Obrigatórios de Desenvolvimento

> **ATENÇÃO PARA A IA:** Estes padrões são OBRIGATÓRIOS. Todo código gerado deve seguir estes padrões sem exceção. Não inventar alternativas. Não "simplificar" removendo partes. Se tiver dúvida sobre como aplicar um padrão, consultar os exemplos de código aqui.

---

## 1. OPTIMISTIC UPDATES

### O que é
Quando o usuário faz uma ação (enviar mensagem, reagir, postar), a UI atualiza IMEDIATAMENTE sem esperar o servidor confirmar. Se o servidor falhar, a UI reverte.

### Por que usar
Faz o app parecer instantâneo mesmo com latência de rede. É o padrão de apps modernos como WhatsApp e Twitter.

### Quando usar
TODA ação que grava no banco de dados deve ser otimista. Sem exceção.

### Quando NÃO usar
Leituras de dados (GET) — essas não precisam de optimistic update.

### O fluxo obrigatório
```
1. Usuário executa ação
2. Gerar ID temporário: const tempId = `temp_${crypto.randomUUID()}`
3. Criar objeto com { ...dados, id: tempId, status: 'sending' }
4. Adicionar ao estado LOCAL imediatamente (sem await)
5. Fazer a chamada assíncrona ao Supabase
6. Sucesso: substituir o objeto temp pelo objeto real do servidor
7. Falha: remover o objeto temp do estado, exibir toast de erro
```

### Hook useOptimistic — implementação de referência
```ts
// Em: src/hooks/useOptimistic.ts

import { useState } from 'react'
import toast from '../utils/toast' // wrapper do sistema de toast do app

interface OptimisticOptions<T> {
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
  errorMessage?: string
}

export function useOptimistic<T>(
  serverAction: () => Promise<T>,
  rollback: () => void,
  options?: OptimisticOptions<T>
) {
  const [isPending, setIsPending] = useState(false)

  const execute = async () => {
    setIsPending(true)
    try {
      const result = await serverAction()
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      rollback()
      toast.error(options?.errorMessage ?? 'Algo deu errado. Tente novamente.')
      options?.onError?.(error as Error)
    } finally {
      setIsPending(false)
    }
  }

  return { execute, isPending }
}
```

### Exemplo de uso: enviar mensagem
```ts
// Em: src/store/modules/chat.store.ts

sendMessage: async (conversationId: string, content: string) => {
  const tempId = `temp_${crypto.randomUUID()}`

  // PASSO 1: Adiciona na UI imediatamente
  const tempMessage: Message = {
    id: tempId,
    conversation_id: conversationId,
    sender_id: get().currentUserId,
    content,
    created_at: new Date().toISOString(),
    status: 'sending', // UI mostra indicador de carregamento
    // demais campos...
  }
  set(state => ({ messages: [...state.messages, tempMessage] }))

  try {
    // PASSO 2: Persiste no servidor
    const savedMessage = await messageService.send(conversationId, content)

    // PASSO 3: Substitui o temp pelo real
    set(state => ({
      messages: state.messages.map(m =>
        m.id === tempId ? { ...savedMessage, status: 'sent' } : m
      )
    }))
  } catch (error) {
    // PASSO 4: Reverte e notifica
    set(state => ({
      messages: state.messages.map(m =>
        m.id === tempId ? { ...m, status: 'failed' } : m
      )
    }))
    // status: 'failed' → UI mostra botão "Toque para reenviar"
  }
}
```

### Status de mensagem na UI
| Status | O que mostrar |
|---|---|
| `sending` | Relógio pequeno ou spinner ao lado do horário |
| `sent` | ✓ (checkmark único) |
| `read` | ✓✓ (dois checkmarks) |
| `failed` | Ícone de erro + "Toque para reenviar" |

---

## 2. OFFLINE MODE

### Detecção de conexão
```ts
// Em: src/hooks/useOffline.ts
// NUNCA usar navigator.onLine diretamente — é pouco confiável
// Usar combinação de navigator.onLine + teste de conexão real

import { useEffect } from 'react'
import { useOfflineStore } from '@/store/offline.store'

export function useOffline() {
  const { setOnline, setOffline, flushQueue } = useOfflineStore()

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Tenta conectar ao Supabase — se falhar, está offline
        await fetch('https://seu-projeto.supabase.co/health', {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000)
        })
        setOnline()
        await flushQueue() // Processa ações pendentes
      } catch {
        setOffline()
      }
    }

    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', setOffline)

    return () => {
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', setOffline)
    }
  }, [])
}
```

### Fila de ações offline
```ts
// Em: src/store/offline.store.ts

interface QueuedAction {
  id: string
  type: 'send_message' | 'edit_message' | 'send_reaction' | 'create_post' | 'update_card'
  payload: Record<string, unknown>
  created_at: number   // timestamp em ms
  retry_count: number  // quantas vezes tentou reenviar
}

interface OfflineState {
  isOnline: boolean
  isSyncing: boolean
  queue: QueuedAction[]

  setOnline: () => void
  setOffline: () => void
  addToQueue: (action: Omit<QueuedAction, 'id' | 'created_at' | 'retry_count'>) => void
  flushQueue: () => Promise<void>  // Processa a fila ao reconectar
  removeFromQueue: (id: string) => void
}
```

### Persistência da fila no Tauri filesystem
```ts
// A fila deve ser persistida em disco para sobreviver a reinicializações do app
// Usar invoke() do Tauri para ler/escrever arquivo JSON

import { invoke } from '@tauri-apps/api/core'

// Salvar fila
await invoke('save_offline_queue', { queue: JSON.stringify(queue) })

// Carregar fila ao iniciar o app
const saved = await invoke<string>('load_offline_queue')
const queue: QueuedAction[] = JSON.parse(saved || '[]')
```

### Regras da fila
- Ações com mais de 24h na fila são DESCARTADAS com toast de aviso
- Máximo de 3 tentativas por ação
- Processar em ordem FIFO (primeiro a entrar, primeiro a sair)
- Se uma ação falhar 3x, descartar e notificar o usuário

### Módulos por comportamento offline
| Módulo | Comportamento offline |
|---|---|
| Chat | Lê cache local. Msgs novas vão para a fila. |
| Feed | Lê posts em cache. Não carrega novos. |
| Music | Toca músicas baixadas localmente. |
| MotionWallpaper | Usa wallpapers já instalados. |
| Performance Governor | Funciona normalmente (local). |
| Projects | Lê boards em cache. Edições vão para a fila. |
| Browser | Não funciona — mostra EmptyState de sem conexão. |
| Live | Não funciona — mostra EmptyState. |
| RemoteShare | Não funciona — mostra EmptyState. |
| ScreenShare | Não funciona — mostra EmptyState. |

### Indicador visual de conexão
```tsx
// Em: src/components/shared/OfflineBanner/OfflineBanner.tsx
// Renderizado no AppLayout.tsx, acima do conteúdo principal

// Estados:
// isOnline = true → não renderizar nada (estado normal)
// isOnline = false → "Sem conexão — trabalhando offline"
// isOnline = true && isSyncing = true → "Sincronizando X ações pendentes..."
// reconectando → "Reconectando..."
```

---

## 3. EMPTY STATES & LOADING

### Skeleton Screens — regras obrigatórias
- Todo componente que carrega dados DEVE mostrar skeleton enquanto carrega
- NUNCA mostrar tela em branco, loader girando ou "Carregando..."
- O skeleton deve ter a mesma forma visual do conteúdo real (mesmo height, mesmo layout)
- Animação: pulse de opacidade, de `#0a0a0a` para `#141414`, ciclo de 1.5s

```tsx
// Em: src/components/ui/Skeleton/Skeleton.tsx

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 'var(--radius-module)',
  className
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius }}
    />
  )
}
```

```css
/* Skeleton.module.css */
.skeleton {
  background: #0a0a0a;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { background: #0a0a0a; }
  50% { background: #141414; }
}
```

### Empty States — componente obrigatório
Quando não há dados, SEMPRE usar o componente EmptyState. Nunca renderizar null ou div vazia.

```tsx
// Em: src/components/ui/EmptyState/EmptyState.tsx

interface EmptyStateProps {
  icon: string           // emoji ou componente de ícone
  title: string          // texto principal
  description?: string   // texto secundário opcional
  action?: {
    label: string
    onClick: () => void
  }
}
```

### Tabela de empty states do app
| Contexto | icon | title | description | action |
|---|---|---|---|---|
| Sem conversas | 💬 | "Nenhuma conversa ainda" | "Busque alguém para começar" | "Iniciar conversa" |
| Sem msgs na DM | 👋 | "Início da conversa" | "Diga oi!" | — |
| Busca sem resultado | 🔍 | `Nenhum resultado para "{query}"` | — | — |
| Sem posts no feed | 📰 | "Nada por aqui ainda" | "Siga pessoas para ver posts" | "Explorar" |
| Sem stories | ○ | "Sem stories hoje" | — | "Criar story" |
| Sem notificações | 🔔 | "Você está em dia!" | — | — |
| Sem projetos | 📋 | "Nenhum projeto ainda" | — | "Criar projeto" |
| Excluídos vazio | 🗑️ | "Nenhuma mensagem excluída" | — | — |
| Sem conexão (módulo) | 📡 | "Sem conexão" | "Este módulo precisa de internet" | — |
| Erro genérico | ⚠️ | "Algo deu errado" | "Tente novamente" | "Tentar novamente" |

---

## 4. COMUNICAÇÃO ENTRE MÓDULOS — EVENT BUS

### A regra mais importante
**Módulos NUNCA se comunicam diretamente.** Nenhum módulo importa de outro. Toda comunicação cross-módulo passa pelo `events.store.ts`.

### Por que isso é crítico
Sem esse padrão, o código vira uma teia de importações circulares impossível de manter. Com o event bus, cada módulo só conhece os eventos, nunca os outros módulos.

### events.store.ts — implementação completa
```ts
// Em: src/store/events.store.ts
// NUNCA usar EventEmitter do Node, CustomEvent do DOM, ou qualquer outra solução
// Usar APENAS este store para eventos cross-módulo

import { create } from 'zustand'
import type { AppEvent, EventType } from '@/types/event.types'

interface EventsState {
  emit: (type: EventType, payload?: unknown) => void
  on: (type: EventType, handler: (payload: unknown) => void) => () => void
  // retorna função de cleanup para usar no useEffect
}

export const useEventsStore = create<EventsState>((set, get) => {
  const listeners = new Map<EventType, Set<(payload: unknown) => void>>()

  return {
    emit: (type, payload) => {
      const handlers = listeners.get(type)
      handlers?.forEach(handler => handler(payload))
    },
    on: (type, handler) => {
      if (!listeners.has(type)) {
        listeners.set(type, new Set())
      }
      listeners.get(type)!.add(handler)

      // Retorna função de cleanup
      return () => {
        listeners.get(type)?.delete(handler)
      }
    }
  }
})
```

### event.types.ts — todos os eventos do app
```ts
// Em: src/types/event.types.ts
// Adicionar novo EventType AQUI quando precisar de nova comunicação cross-módulo
// NUNCA criar eventos fora deste tipo

export type EventType =
  // Música
  | 'music:playing'             // Music inicia → Profile Core, BottomBar
  | 'music:paused'              // Music pausa → Profile Core
  | 'music:stopped'             // Music para → Profile Core, BottomBar

  // Games
  | 'games:detected'            // Rust detecta jogo → Profile Core, BottomBar, Governor
  | 'games:closed'              // Jogo fechado → Profile Core, BottomBar, Governor

  // Live
  | 'live:watching'             // Usuário assistindo live → Profile Core
  | 'live:stopped'              // Parou de assistir → Profile Core

  // Screen / Remote Share
  | 'screenshare:started'       // ScreenShare inicia → BottomBar, ChatDM
  | 'screenshare:stopped'       // ScreenShare para → BottomBar, ChatDM
  | 'remoteshare:started'       // RemoteShare inicia → BottomBar
  | 'remoteshare:stopped'       // RemoteShare para → BottomBar

  // Presença
  | 'presence:changed'          // Status mudou → Profile Core, BottomBar

  // Tema
  | 'theme:changed'             // Tema trocado → aplica em todo o app

  // Layout
  | 'module:open-as-widget'     // Abre módulo como janela separada
  | 'module:dock'               // Recolhe módulo de volta ao layout

  // Offline
  | 'offline:queue:action'      // Ação adicionada à fila offline
  | 'offline:queue:flush'       // Reconectou — processar fila

  // Performance Governor
  | 'governor:high-cpu'         // CPU alta → MotionWallpaper pausa
  | 'governor:cpu-normal'       // CPU voltou ao normal → MotionWallpaper retoma

export interface AppEvent {
  type: EventType
  payload?: unknown
  timestamp: number
}

// Tipos dos payloads por evento
export interface MusicPlayingPayload {
  name: string
  artist: string
  albumArt?: string
}

export interface GamesDetectedPayload {
  name: string
  processId: number
  cpuUsage: number
}

export interface ThemeChangedPayload {
  theme: 'dark' | 'light' | `custom-${string}`
}
```

### Como emitir um evento (exemplo no módulo Music)
```ts
// Em: src/store/modules/music.store.ts
import { useEventsStore } from '@/store/events.store'
import type { MusicPlayingPayload } from '@/types/event.types'

// Ao iniciar reprodução:
const { emit } = useEventsStore.getState()
emit('music:playing', {
  name: 'God\'s Plan',
  artist: 'Drake',
  albumArt: 'https://...'
} as MusicPlayingPayload)
```

### Como escutar um evento (exemplo no Profile Core)
```ts
// Em: src/components/profile/ProfileStatus/ProfileStatus.tsx
import { useEffect } from 'react'
import { useEventsStore } from '@/store/events.store'
import type { MusicPlayingPayload } from '@/types/event.types'

export function ProfileStatus({ userId }: { userId: string }) {
  const { on } = useEventsStore()

  useEffect(() => {
    // Escutar e retornar cleanup (OBRIGATÓRIO para evitar memory leak)
    const unsubscribe = on('music:playing', (payload) => {
      const { name, artist } = payload as MusicPlayingPayload
      // Atualizar status local
    })

    return unsubscribe // Zustand cleanup automático ao desmontar
  }, [on])
}
```

---

## 5. DEEP LINKING

### Protocolo: `app://`

O app registra o protocolo `app://` no Tauri. Links neste formato abrem o módulo correto.

### Tabela completa de rotas
| URL | Destino | Parâmetros |
|---|---|---|
| `app://chat` | Chat — Home | — |
| `app://chat/@{username}` | ChatDM com o usuário | username |
| `app://profile/@{username}` | ChatProfile do usuário | username |
| `app://post/{id}` | Post específico no Feed | id |
| `app://story/{id}` | Story específico | id |
| `app://project/{id}` | Projeto específico | id |
| `app://project/{id}/card/{card_id}` | Card específico | id, card_id |
| `app://marketplace/{id}` | Asset no Marketplace | id |
| `app://settings` | Settings — primeira seção | — |
| `app://settings/{section}` | Settings — seção específica | section |

### Implementação no Rust (tauri.conf.json)
```json
{
  "plugins": {
    "deep-link": {
      "mobile": [],
      "desktop": ["app"]
    }
  }
}
```

### Handler no frontend
```ts
// Em: src/hooks/useDeepLink.ts
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { deepLinkParser } from '@/utils/deep-link'

export function useDeepLink() {
  useEffect(() => {
    const unlisten = onOpenUrl((urls) => {
      urls.forEach(url => {
        const route = deepLinkParser(url) // Parseia app://chat/@ana → { module: 'chat', params: { username: 'ana' } }
        // Emitir evento para abrir o módulo correto
        useEventsStore.getState().emit('module:navigate', route)
      })
    })

    return () => { unlisten.then(fn => fn()) }
  }, [])
}
```

---

## 6. ATALHOS DE TECLADO

### Atalhos globais (funcionam em qualquer contexto, mesmo app em background)
Registrados via `tauri-plugin-global-shortcut` no Rust.

| Atalho | Ação |
|---|---|
| `Ctrl + Alt + Space` | Abre/fecha Global Search |

### Atalhos dentro do app (quando app está focado)
Registrados via `useShortcuts.ts` no frontend.

**Globais dentro do app:**
| Atalho | Ação |
|---|---|
| `Ctrl + Alt + C` | Focar módulo Chat |
| `Ctrl + Alt + F` | Focar módulo Feed |
| `Ctrl + Alt + M` | Focar módulo Music |
| `Ctrl + Alt + G` | Focar módulo Games |
| `Ctrl + Alt + N` | Abrir Notifications |
| `Ctrl + Alt + S` | Abrir Settings |
| `Ctrl + /` | Abrir menu de atalhos |

**Dentro do Chat:**
| Atalho | Ação |
|---|---|
| `Ctrl + K` | Buscar conversa |
| `Enter` | Enviar mensagem |
| `Shift + Enter` | Quebra de linha no input |
| `Esc` | Fechar contexto atual / voltar |
| `Ctrl + F` | Buscar dentro da conversa |

**Dentro do Layout:**
| Atalho | Ação |
|---|---|
| `Ctrl + \` | Dividir painel ativo verticalmente |
| `Ctrl + Shift + \` | Dividir painel ativo horizontalmente |
| `Ctrl + W` | Fechar painel ativo |
| `Ctrl + Shift + S` | Salvar layout atual |

### Como registrar atalhos no frontend
```ts
// Em: src/hooks/useShortcuts.ts
// Centralizar TODOS os atalhos aqui — nunca usar onKeyDown em componentes individuais

import { useEffect } from 'react'

type ShortcutHandler = () => void

const shortcuts: Record<string, ShortcutHandler> = {}

export function useShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = buildShortcutKey(e) // ex: 'ctrl+alt+c'
      shortcuts[key]?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

export function registerShortcut(key: string, handler: ShortcutHandler) {
  shortcuts[key] = handler
}
```

### Menu de atalhos
- Acessível via `Ctrl + /` ou botão na BottomBar
- Lista todos os atalhos disponíveis no contexto atual
- Usuário pode customizar atalhos em Settings → Atalhos
- Atalhos customizados salvos em `user_settings.shortcuts` no Supabase

---

## 7. SISTEMA DE TEMAS

### Como trocar de tema
```ts
// Em: src/hooks/useTheme.ts
// NUNCA manipular classList diretamente fora deste hook

export function useTheme() {
  const { theme, setTheme } = useThemeStore()

  const applyTheme = (newTheme: string) => {
    // Troca o atributo data-theme no elemento raiz
    document.documentElement.setAttribute('data-theme', newTheme)
    setTheme(newTheme)
    // Salvar no Supabase via user_settings
  }

  const applyCustomTheme = (themeId: string, cssVars: string) => {
    // Injeta CSS do tema do Marketplace dinamicamente
    let styleEl = document.getElementById(`theme-${themeId}`)
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = `theme-${themeId}`
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = cssVars
    applyTheme(`custom-${themeId}`)
  }

  return { theme, applyTheme, applyCustomTheme }
}
```

---

## 8. TOAST NOTIFICATIONS — SISTEMA DE FEEDBACK

### Posição e comportamento
- Posição: canto inferior esquerdo, acima da BottomBar
- Máximo 3 toasts simultâneos (empilhados)
- Duração: success/info = 3s, error/warning = 5s
- Nunca bloquear interação do usuário
- Nunca usar `alert()` ou `confirm()` do browser

### API do sistema de toast
```ts
// Em: src/utils/toast.ts

const toast = {
  success: (message: string) => { /* ... */ },
  error: (message: string) => { /* ... */ },
  info: (message: string) => { /* ... */ },
  warning: (message: string) => { /* ... */ },
}

export default toast

// Uso:
toast.success('Mensagem enviada')
toast.error('Falha ao enviar. Toque para reenviar.')
toast.warning('Sem conexão — mensagem salva para envio posterior')
```

### Ações destrutivas — confirmação obrigatória
Para ações irreversíveis (excluir conversa, deletar conta, excluir post), SEMPRE pedir confirmação:

```
Modal simples:
- Título: "Excluir conversa?"
- Descrição: breve explicação do que vai acontecer
- Botão "Cancelar" (secundário)
- Botão "Excluir" (destrutivo, cor --status-dnd)
```

**NUNCA usar:**
- `window.confirm()`
- Checkboxes de confirmação "Tem certeza?"
- Múltiplos cliques de confirmação

---

## 9. TAURI COMMANDS — PADRÃO DE COMUNICAÇÃO COM RUST

### Como chamar um command Rust do frontend
```ts
// SEMPRE usar invoke com tipagem explícita
import { invoke } from '@tauri-apps/api/core'

// Buscar CPU usage
const cpuUsage = await invoke<number>('get_cpu_usage')

// Buscar jogos ativos
const activeGame = await invoke<string | null>('get_active_game')

// NUNCA deixar sem tratamento de erro
try {
  const result = await invoke<T>('command_name', { param: value })
} catch (error) {
  // Tratar o erro — nunca silenciar com catch vazio
  console.error('Command failed:', error)
  toast.error('Falha ao comunicar com o sistema.')
}
```

### Padrão dos commands no Rust
```rust
// Em: src-tauri/src/commands/hardware.rs
// Sempre retornar Result<T, String> — nunca panick

#[tauri::command]
pub fn get_cpu_usage() -> Result<f32, String> {
  // implementação
  Ok(cpu_percent)
}

#[tauri::command]
pub fn get_active_game() -> Result<Option<String>, String> {
  // implementação
  Ok(game_name)
}
```

---

## 11. NAVEGAÇÃO — FLOWS INTERNOS (SEM ROTAS)

> **Regra:** Dentro do app principal, navegação não é feita por React Router.  
> A UI muda por **estado do módulo** e por **eventos globais** (`events.store.ts`).

### Quando usar "rotas"
- Apenas para **contextos globais** do app (ex: AuthScreen, Welcome/Onboarding, AppLayout).
- Nunca para telas internas de módulos (ex: "criar post", "criar story", "adicionar música").

### Padrão obrigatório: Flow state por módulo
Cada módulo que tem múltiplas telas internas deve ter um estado `view/flow` no store do próprio módulo:

- `Feed`: `home | compose | post`
- `Stories`: `home | compose | editor | viewer`
- `Music`: `home | library | add | playlist`
- `FavoriteGames`: `grid | details | add`

### Padrão obrigatório: Eventos de navegação
Os módulos não importam uns aos outros. Para abrir flows internos ou saltar entre módulos, usar eventos.

**Nomenclatura:**
- `feed:open`
- `feed:compose`
- `stories:compose`
- `music:add`
- `games:pin`
- `module:focus` (troca foco do painel para um módulo específico)

**Exemplo (conceitual):**
- Global Search seleciona "Criar post" → emite `feed:compose`
- Feed recebe evento → `feed.store.setView('compose')`

### Deep links
Deep links `socialos://...` são traduzidos em eventos internos (nunca em rotas internas).
