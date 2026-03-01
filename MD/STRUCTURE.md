# STRUCTURE.md — Organização de Pastas

> **ATENÇÃO PARA A IA:** Siga esta estrutura de pastas EXATAMENTE como definida. Não criar pastas fora desta estrutura. Não renomear pastas ou arquivos. Se um arquivo não está listado aqui e você precisa criar um, criar dentro da pasta mais próxima do contexto descrito.

---

## REGRAS FUNDAMENTAIS DE ORGANIZAÇÃO

### 1. Módulos são ilhas isoladas
- Um módulo NUNCA importa diretamente de outro módulo
- `modules/Chat/` nunca faz `import from '../Music/'`
- Comunicação entre módulos APENAS via `events.store.ts`

### 1.1 Navegação interna é por Flow (sem React Router)
- Telas internas de módulos (ex: criar post/story, adicionar música, detalhes de jogo) **NUNCA** viram rotas
- Módulos controlam telas internas por estado `view/flow` no store do próprio módulo
- Cruzar módulos ou acionar flows via `events.store.ts` (eventos), nunca import direto


### 2. Componentes têm hierarquia clara
- `components/ui/` → primitivos (Button, Input, Avatar) — sem lógica de negócio
- `components/shared/` → compostos reutilizáveis por 2+ módulos — podem ter lógica
- `components/profile/` → componentes do User Profile Core — usados em todo o app
- `modules/X/components/` → componentes exclusivos do módulo X — nunca usados fora dele

### 3. CSS sempre em módulo próprio
- Todo componente tem seu `.module.css` junto (mesmo diretório)
- Nunca CSS global exceto em `styles/`
- Nunca inline styles
- Nunca Tailwind

### 4. Stores são por domínio
- Um store por domínio de negócio
- Stores de módulo ficam em `store/modules/`
- Stores globais ficam em `store/`

### 5. Convenções de nomenclatura
- Componentes React → `PascalCase` (ex: `MessageBubble.tsx`)
- Hooks → `camelCase` com prefixo `use` (ex: `usePresence.ts`)
- Stores → `camelCase` com sufixo `.store.ts` (ex: `chat.store.ts`)
- Services → `camelCase` com sufixo `.service.ts` (ex: `message.service.ts`)
- Types → `PascalCase` com sufixo `.types.ts` (ex: `message.types.ts`)
- CSS Modules → mesmo nome do componente com `.module.css` (ex: `MessageBubble.module.css`)
- Constantes → `SCREAMING_SNAKE_CASE` (ex: `MAX_MESSAGE_LENGTH`)

### 6. Ordem de imports em todo arquivo .tsx/.ts
```ts
// 1. React e hooks do React
import { useState, useEffect } from 'react'

// 2. Libs externas (tauri, supabase, etc)
import { invoke } from '@tauri-apps/api/core'

// 3. Types
import type { Message } from '@/types/message.types'

// 4. Stores
import { useChatStore } from '@/store/modules/chat.store'

// 5. Hooks customizados
import { usePresence } from '@/hooks/usePresence'

// 6. Services
import { messageService } from '@/services/message.service'

// 7. Componentes
import { Avatar } from '@/components/ui/Avatar/Avatar'

// 8. Estilos (sempre por último)
import styles from './ComponentName.module.css'
```

---

## ESTRUTURA RAIZ

```
/
├── src-tauri/                  # Backend Rust (Tauri)
├── src/                        # Frontend React + Vite
├── public/                     # Assets estáticos (favicon, etc)
├── SCOPE.md                    # Escopo completo do projeto
├── STRUCTURE.md                # Este arquivo
├── PLAN.md                     # Plano de desenvolvimento por fases
├── PATTERNS.md                 # Padrões obrigatórios de código
├── DATABASE.md                 # Schema do Supabase
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## SRC-TAURI/

```
src-tauri/
├── src/
│   ├── main.rs                 # Entry point Tauri — configura janelas e plugins
│   ├── lib.rs                  # Registra todos os commands do Tauri
│   │
│   ├── commands/               # Funções Rust expostas ao frontend via invoke()
│   │   ├── mod.rs              # Re-exporta todos os commands
│   │   ├── hardware.rs         # CPU %, GPU %, RAM, velocidade de rede
│   │   ├── processes.rs        # Detecta jogos/apps ativos no sistema
│   │   ├── storage.rs          # Migração Hot→Cold (compressão zstd)
│   │   ├── wallpaper.rs        # Aplica wallpaper no desktop do Windows
│   │   └── remote.rs           # RemoteShare: captura e controle remoto
│   │
│   ├── shortcuts/
│   │   └── mod.rs              # Registra Ctrl+Alt+Space e outros atalhos globais
│   │                           # via tauri-plugin-global-shortcut
│   │
│   ├── tray/
│   │   └── mod.rs              # Ícone na bandeja do sistema + menu de contexto
│   │
│   ├── windows/
│   │   └── mod.rs              # Helpers para criar/mostrar/esconder janelas
│   │                           # Aplica Mica/Acrylic via window-vibrancy
│   │
│   └── jobs/
│       └── cold_storage.rs     # Job diário: migra mensagens antigas para R2 (zstd)
│
├── icons/                      # Ícones do app para todas as plataformas
├── tauri.conf.json             # Configuração de janelas, permissões, plugins
└── Cargo.toml                  # Dependências Rust
```

---

## SRC/ — VISÃO GERAL

```
src/
├── main.tsx                    # Entry point React — monta <App />
├── App.tsx                     # Router raiz — Welcome ou AppLayout
├── vite-env.d.ts
│
├── assets/                     # Assets importados pelo código
│   ├── fonts/                  # Arquivos de fonte
│   └── images/                 # Imagens estáticas do app (logos, etc)
│
├── styles/                     # Estilos globais — NADA de estilos de componente aqui
│   ├── global.module.css       # Reset CSS, estilos do body, scrollbar
│   ├── tokens.css              # Importa o tema ativo (dark por padrão)
│   ├── animations.css          # @keyframes globais reutilizáveis
│   └── themes/
│       ├── dark.css            # Variáveis CSS do tema escuro (padrão)
│       ├── light.css           # Variáveis CSS do tema claro
│       └── custom.css          # Template vazio para temas do Marketplace
│
├── i18n/                       # Internacionalização
│   ├── index.ts                # Configura i18next
│   └── locales/
│       ├── pt-BR.json          # Idioma padrão
│       ├── en-US.json
│       └── es-ES.json
│
├── config/                     # Configurações e clientes de serviços externos
│   ├── supabase.ts             # Cria e exporta o cliente Supabase
│   │                           # NUNCA importar supabase de outro lugar
│   ├── r2.ts                   # Cria e exporta o cliente Cloudflare R2
│   └── constants.ts            # Constantes globais (ex: COLD_STORAGE_DAYS = 30)
│
├── types/                      # TypeScript types globais
│   ├── user.types.ts           # User, UserStatus, UserSettings
│   ├── message.types.ts        # Message, MessageEdit, MessageReaction
│   ├── module.types.ts         # ModuleId, ModuleConfig, ModuleMode
│   ├── layout.types.ts         # LayoutNode, LayoutSplit, LayoutModule
│   ├── status.types.ts         # PresenceStatus, ActivityStatus
│   ├── event.types.ts          # AppEvent, EventType (todos os eventos do app)
│   └── index.ts                # Re-exporta tudo
│
├── store/                      # Zustand stores
│   ├── index.ts                # Re-exporta todos os stores
│   ├── auth.store.ts           # Sessão do usuário autenticado
│   ├── layout.store.ts         # Árvore de layout (LayoutNode tree)
│   ├── theme.store.ts          # Tema ativo: dark | light | custom-{id}
│   ├── presence.store.ts       # Status de presença do usuário atual
│   ├── events.store.ts         # Event bus cross-módulo (ver PATTERNS.md seção 4)
│   ├── offline.store.ts        # Fila de ações offline + estado de conexão
│   ├── notification.store.ts   # Lista de notificações não lidas
│   ├── search.store.ts         # Estado do Global Search
│   ├── hardware.store.ts       # CPU%, GPU%, RAM, velocidade de rede
│   └── modules/                # Store por módulo — isolados entre si
│       ├── chat.store.ts       # Estado do módulo Chat
│       ├── feed.store.ts       # Estado do módulo Feed
│       ├── music.store.ts      # Estado do módulo Music
│       ├── live.store.ts       # Estado do módulo Live
│       ├── games.store.ts      # Estado do módulo Games
│       └── projects.store.ts   # Estado do módulo Projects
│
├── hooks/                      # Hooks React customizados globais
│   ├── useRealtime.ts          # Subscribe/unsubscribe em canais Supabase Realtime
│   ├── usePresence.ts          # Lê e atualiza status de presença
│   ├── useHardware.ts          # Lê CPU/GPU/RAM via invoke() do Tauri
│   ├── useLayout.ts            # Manipula a árvore de layout
│   ├── useDragHandle.ts        # Lógica do drag handle hover reveal
│   ├── useContextMenu.ts       # Abre/fecha context menu global
│   ├── useSearch.ts            # Lógica do Global Search
│   ├── useStorage.ts           # Upload/download R2, hot→cold
│   ├── useOffline.ts           # Detecta offline, gerencia fila de reenvio
│   ├── useOptimistic.ts        # Padrão de optimistic updates (ver PATTERNS.md seção 1)
│   ├── useDeepLink.ts          # Escuta eventos de deep link app://
│   ├── useShortcuts.ts         # Registra e gerencia atalhos de teclado
│   ├── useTheme.ts             # Troca de tema sem reload
│   └── useI18n.ts              # Wrapper do i18next
│
├── services/                   # Camada de acesso a dados — toda chamada ao Supabase/R2 passa por aqui
│   ├── auth.service.ts         # Login, logout, sessão
│   ├── user.service.ts         # CRUD de perfil, follows, blocks
│   ├── message.service.ts      # CRUD de mensagens, edições, favoritos
│   ├── feed.service.ts         # Posts, reações, comentários
│   ├── music.service.ts        # Tracks, histórico
│   ├── live.service.ts         # Lives, viewers
│   ├── storage.service.ts      # Upload/download arquivos no R2
│   ├── notification.service.ts # Leitura e marcação de notificações
│   └── realtime.service.ts     # Gerencia inscrições em canais Realtime
│
├── utils/                      # Funções puras sem side effects
│   ├── format.ts               # Formatar datas, números, bytes, durações
│   ├── compress.ts             # Helpers de compressão zstd (cold storage)
│   ├── layout-tree.ts          # Operações na árvore binária de layout
│   │                           # (inserir nó, remover, dividir, calcular tamanhos)
│   ├── presence.ts             # Helpers de status de presença (label, cor)
│   ├── media.ts                # Helpers de mídia (tipo de arquivo, thumbnail)
│   └── deep-link.ts            # Parser de URLs app://
│
├── engine/                     # Sistemas core do app — não são módulos de produto
│   │
│   ├── layout/                 # Tiling Tree Split Engine
│   │   ├── LayoutEngine.tsx    # Componente raiz — renderiza a árvore de layout
│   │   ├── LayoutNode.tsx      # Renderiza um nó: módulo ou split
│   │   ├── SplitPane.tsx       # Painel dividido com ResizeHandle no meio
│   │   ├── ResizeHandle.tsx    # Handle de resize entre dois painéis
│   │   ├── EmptyPane.tsx       # Placeholder para painel vazio com context menu
│   │   └── layout.module.css
│   │
│   ├── drag/                   # Sistema de drag de módulos
│   │   ├── DragHandle.tsx      # Faixa invisível hover reveal (ver SCOPE.md seção 6)
│   │   ├── DragOverlay.tsx     # Overlay que mostra onde o módulo vai cair
│   │   └── drag.module.css
│   │
│   └── realtime/               # Motor de real-time
│       ├── RealtimeProvider.tsx # Context provider — inicializa conexões
│       ├── channels.ts          # Define TODOS os canais Supabase Realtime do app
│       └── handlers.ts          # Handlers por tipo de evento recebido
│
├── components/                 # Componentes React reutilizáveis
│   │
│   ├── ui/                     # Primitivos de UI — sem lógica de negócio
│   │   ├── Avatar/
│   │   │   ├── Avatar.tsx
│   │   │   └── Avatar.module.css
│   │   ├── Banner/
│   │   │   ├── Banner.tsx
│   │   │   └── Banner.module.css
│   │   ├── Button/
│   │   │   ├── Button.tsx      # Sempre radius --radius-interactive
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   ├── Input.tsx       # Sempre radius --radius-interactive
│   │   │   └── Input.module.css
│   │   ├── Badge/
│   │   │   ├── Badge.tsx
│   │   │   └── Badge.module.css
│   │   ├── Toggle/
│   │   │   ├── Toggle.tsx
│   │   │   └── Toggle.module.css
│   │   ├── Pill/
│   │   │   ├── Pill.tsx        # Filtros (Todos, Não lidas, etc)
│   │   │   └── Pill.module.css
│   │   ├── Skeleton/
│   │   │   ├── Skeleton.tsx    # Placeholder de carregamento — pulse de opacidade
│   │   │   └── Skeleton.module.css
│   │   ├── EmptyState/
│   │   │   ├── EmptyState.tsx  # Estado vazio com ícone, título, descrição e CTA opcional
│   │   │   └── EmptyState.module.css
│   │   └── Toast/
│   │       ├── Toast.tsx       # Notificações de feedback (success, error, info, warning)
│   │       ├── ToastContainer.tsx
│   │       └── Toast.module.css
│   │
│   ├── shared/                 # Componentes compostos usados por 2+ módulos
│   │   ├── ContextMenu/
│   │   │   ├── ContextMenu.tsx         # Menu de contexto global do app
│   │   │   ├── ContextMenuItem.tsx     # Item individual do menu
│   │   │   └── ContextMenu.module.css
│   │   ├── GlobalSearch/
│   │   │   ├── GlobalSearch.tsx        # Janela de search (roda na janela 'search')
│   │   │   ├── SearchResults.tsx       # Lista de resultados por categoria
│   │   │   ├── SearchResultItem.tsx    # Item individual de resultado
│   │   │   └── GlobalSearch.module.css
│   │   ├── StatusIndicator/
│   │   │   ├── StatusIndicator.tsx     # Ponto colorido de status de presença
│   │   │   └── StatusIndicator.module.css
│   │   ├── StoriesLine/
│   │   │   ├── StoriesLine.tsx         # Linha horizontal de stories com scroll
│   │   │   ├── StoryItem.tsx           # Item individual da linha
│   │   │   └── StoriesLine.module.css
│   │   ├── ModuleWrapper/
│   │   │   ├── ModuleWrapper.tsx       # Wrapper obrigatório para todo módulo
│   │   │   │                           # Contém DragHandle + radius + z-index correto
│   │   │   └── ModuleWrapper.module.css
│   │   └── OfflineBanner/
│   │       ├── OfflineBanner.tsx       # Banner "Sem conexão" no topo do app
│   │       └── OfflineBanner.module.css
│   │
│   └── profile/                # User Profile Core — usados em todo o app
│       ├── ProfileAvatar/
│       │   ├── ProfileAvatar.tsx       # Props: variant (mini|medium|full), userId
│       │   └── ProfileAvatar.module.css
│       ├── ProfileBanner/
│       │   ├── ProfileBanner.tsx       # Props: variant (card|chat|profile), userId
│       │   └── ProfileBanner.module.css
│       ├── ProfileStatus/
│       │   ├── ProfileStatus.tsx       # Status + atividade em tempo real
│       │   └── ProfileStatus.module.css
│       ├── ProfileMetrics/
│       │   ├── ProfileMetrics.tsx      # Posts, Seguidores, Seguindo clicáveis
│       │   └── ProfileMetrics.module.css
│       └── ProfileCard/
│           ├── ProfileCard.tsx         # Composição de Avatar + Status + Metrics
│           └── ProfileCard.module.css
│
├── modules/                    # Módulos de produto do app
│   │
│   ├── _base/                  # Componentes base compartilhados entre módulos
│   │   ├── ModuleHeader.tsx    # Header padrão com título e ações
│   │   ├── ModuleSection.tsx   # Área de conteúdo scrollável
│   │   ├── ModuleFooter.tsx    # Footer fixo na base do módulo
│   │   └── base.module.css
│   │
│   ├── Chat/
│   │   ├── index.tsx           # Entry point — gerencia qual tela mostrar
│   │   ├── Chat.module.css
│   │   ├── screens/
│   │   │   ├── Home/
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   ├── HomeHeader.tsx     # Stories + busca + filtros
│   │   │   │   ├── HomeSection.tsx    # Lista de conversas
│   │   │   │   ├── HomeFooter.tsx     # Botões + FAB
│   │   │   │   └── Home.module.css
│   │   │   ├── ChatDM/
│   │   │   │   ├── ChatDMScreen.tsx
│   │   │   │   ├── ChatDMHeader.tsx   # StoriesLine + card de perfil + ações
│   │   │   │   ├── ChatDMSection.tsx  # Área de mensagens
│   │   │   │   ├── ChatDMFooter.tsx   # Input + botões
│   │   │   │   └── ChatDM.module.css
│   │   │   └── ChatProfile/
│   │   │       ├── ChatProfileScreen.tsx
│   │   │       ├── ChatProfileHeader.tsx   # Foto + tabs
│   │   │       ├── ChatProfileSection.tsx  # Atividades recentes
│   │   │       ├── ChatProfileFooter.tsx   # Input + botões de controle
│   │   │       └── ChatProfile.module.css
│   │   └── components/         # Componentes exclusivos do Chat
│   │       ├── MessageBubble/  # Bolha de mensagem individual
│   │       ├── MessageGroup/   # Grupo colapsado de mensagens do mesmo autor
│   │       ├── MessageInput/   # Campo de texto com todos os botões
│   │       ├── ChatCard/       # Item da lista de conversas na Home
│   │       ├── StoryRing/      # Anel de story em volta do avatar
│   │       └── FloatingActions/ # FAB e submenu do footer da Home
│   │
│   ├── Feed/
│   │   ├── index.tsx
│   │   ├── Feed.module.css
│   │   ├── screens/
│   │   │   ├── FeedHome/
│   │   │   └── FeedPost/
│   │   └── components/
│   │       ├── PostCard/
│   │       ├── PostComposer/
│   │       └── ReactionBar/
│   │
│   ├── Music/
│   │   ├── index.tsx
│   │   ├── Music.module.css
│   │   ├── screens/
│   │   │   ├── MusicHome/
│   │   │   ├── MusicLibrary/
│   │   │   └── MusicPlayer/
│   │   └── components/
│   │       ├── TrackCard/
│   │       ├── PlayerControls/
│   │       └── MiniPlayer/     # Versão compacta para a BottomBar
│   │
│   ├── Live/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── LivePlayer/
│   │       ├── LiveChat/
│   │       └── PictureInPicture/
│   │
│   ├── Videos/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── VideoPlayer/
│   │       └── PictureInPicture/
│   │
│   ├── Films/
│   │   ├── index.tsx
│   │   └── components/
│   │
│   ├── Browser/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── BrowserBar/     # Barra de URL + navegação + tabs
│   │       └── BrowserView/    # WebView via Tauri
│   │
│   ├── FavoriteGames/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── GameCard/       # Capa + nome + status ativo + % uso
│   │       └── GameGrid/
│   │
│   ├── RemoteShare/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── RemoteView/
│   │       └── PermissionSelector/
│   │
│   ├── ScreenShare/
│   │   ├── index.tsx
│   │   └── components/
│   │       └── ScreenView/
│   │
│   ├── MotionWallpaper/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── WallpaperGrid/
│   │       └── WallpaperPreview/
│   │
│   ├── PerformanceGovernor/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── HardwareGraph/  # Gráfico histórico de CPU/GPU/RAM
│   │       ├── HardwareMini/   # Versão compacta para BottomBar
│   │       └── ModeSelector/   # Balanceado / Performance / Economia
│   │
│   ├── Marketplace/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── AssetCard/
│   │       └── AssetGrid/
│   │
│   ├── Projects/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── Board/
│   │       ├── ProjectColumn/
│   │       └── ProjectCard/
│   │
│   ├── Settings/
│   │   ├── index.tsx
│   │   ├── Settings.module.css
│   │   └── sections/
│   │       ├── SettingsAccount.tsx
│   │       ├── SettingsAppearance.tsx
│   │       ├── SettingsPrivacy.tsx
│   │       ├── SettingsNotifications.tsx
│   │       ├── SettingsLanguage.tsx
│   │       ├── SettingsModules.tsx
│   │       └── SettingsShortcuts.tsx
│   │
│   ├── Notifications/
│   │   ├── index.tsx
│   │   ├── Notifications.module.css
│   │   └── components/
│   │       ├── NotificationItem/
│   │       └── NotificationGroup/
│   │
│   └── Welcome/
│       ├── index.tsx
│       └── steps/
│           ├── StepProfile.tsx     # Foto, username, bio
│           ├── StepModules.tsx     # Escolha de módulos
│           ├── StepWallpaper.tsx   # Wallpaper inicial
│           └── StepTour.tsx        # Tour pelos módulos
│
└── layouts/                    # Layouts da aplicação
    ├── AppLayout.tsx           # Layout principal: LayoutEngine + BottomBar
    ├── BottomBar/
    │   ├── BottomBar.tsx       # Barra inferior global sempre visível
    │   └── BottomBar.module.css
    └── SearchOverlay/
        ├── SearchOverlay.tsx   # Wrapper do GlobalSearch na janela 'search'
        └── SearchOverlay.module.css
```

---

## CACHE LOCAL (Tauri Filesystem)

Arquivos persistidos localmente pelo app para funcionamento offline:

```
~/.app-name/cache/
├── messages/
│   └── {conversation_id}.json   # Últimas 100 mensagens da conversa
├── feed.json                    # Últimos 50 posts do feed
├── users/
│   └── {user_id}.json           # Perfis visitados recentemente
└── projects/
    └── {project_id}.json        # Boards em cache
```

Gerenciado pelo hook `useOffline.ts` e pelo `offline.store.ts`.
