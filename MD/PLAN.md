# PLAN.md — Plano de Desenvolvimento 0% → 100%

> **ATENÇÃO PARA A IA:** Execute as fases NESTA ORDEM. Não pular fases. Não começar uma fase sem a anterior estar completa. Cada fase lista exatamente o que precisa ser criado, em qual arquivo, e o que fazer. Consulte SCOPE.md, STRUCTURE.md, PATTERNS.md e DATABASE.md para detalhes de implementação.

---

## FILOSOFIA DO PLANO

- **Fundação primeiro** — nenhum módulo de produto antes da infraestrutura estar sólida
- **Cada fase entrega algo funcional** — ao final de cada fase, o app deve rodar sem erros
- **Dependências respeitadas** — Chat depende de Profile Core, Profile Core vem antes
- **Real-time desde o início** — não é adicionado depois, faz parte da fundação (Fase 3)
- **Padrões desde o início** — optimistic updates, offline, empty states desde a Fase 0

---

## FASE 0 — Fundação do Projeto
> **Objetivo:** App Tauri + React rodando, estrutura de pastas criada, design tokens funcionando, nenhuma feature de produto ainda.
> **Resultado esperado:** Janela do app abre mostrando um fundo preto com BottomBar vazia.

### 0.1 — Scaffold
- [ ] Criar projeto com `npm create tauri-app` — template React + TypeScript + Vite
- [ ] Instalar dependências: `zustand`, `i18next`, `react-i18next`, `@supabase/supabase-js`, `window-vibrancy`, `tauri-plugin-window-state`, `tauri-plugin-global-shortcut`
- [ ] Configurar aliases de path no `vite.config.ts`: `@/` aponta para `src/`
- [ ] Configurar `tsconfig.json` com paths correspondentes

### 0.2 — Design Tokens
- [ ] Criar `src/styles/themes/dark.css` com TODAS as variáveis CSS da seção 27 do SCOPE.md
- [ ] Criar `src/styles/themes/light.css` com variáveis do tema claro
- [ ] Criar `src/styles/themes/custom.css` como template vazio
- [ ] Criar `src/styles/global.module.css` com reset CSS + estilos do body + scrollbar oculta
- [ ] Criar `src/styles/animations.css` com keyframes globais (fadeIn, pulse, slideUp)
- [ ] Aplicar `data-theme="dark"` no `document.documentElement` por padrão no `main.tsx`

### 0.3 — i18n
- [ ] Criar `src/i18n/index.ts` com configuração do i18next (idioma padrão: pt-BR)
- [ ] Criar `src/i18n/locales/pt-BR.json` com todas as strings do app (começar com as da Fase 0)
- [ ] Criar `src/i18n/locales/en-US.json` com as mesmas chaves em inglês
- [ ] Criar `src/i18n/locales/es-ES.json` com as mesmas chaves em espanhol
- [ ] Inicializar i18next no `main.tsx` antes de montar o React

### 0.4 — Configurações e Clientes
- [ ] Criar `src/config/supabase.ts` — exporta instância única do cliente Supabase
  - Ler URL e anon key de variáveis de ambiente Vite (`.env`)
  - NUNCA hardcodar as keys no código
- [ ] Criar `src/config/r2.ts` — exporta cliente do R2 (S3-compatible)
- [ ] Criar `src/config/constants.ts` — exportar `COLD_STORAGE_DAYS = 30`, `MAX_RETRY_COUNT = 3`, etc.
- [ ] Criar `.env.example` com as variáveis necessárias documentadas

### 0.5 — Types globais
Criar todos os tipos em `src/types/` conforme listado no STRUCTURE.md:
- [ ] `user.types.ts` — `User`, `UserStatus`, `UserSettings`
- [ ] `message.types.ts` — `Message`, `MessageEdit`, `MessageReaction`, `MessageStatus`
- [ ] `module.types.ts` — `ModuleId` (enum com todos os módulos), `ModuleConfig`, `ModuleMode`
- [ ] `layout.types.ts` — `LayoutNode` (union type de LayoutModule | LayoutSplit)
- [ ] `status.types.ts` — `PresenceStatus`, `ActivityType`, `ActivityStatus`
- [ ] `event.types.ts` — `EventType` (todos os eventos), payloads de cada evento
- [ ] `index.ts` — re-exporta tudo

### 0.6 — Stores Zustand (vazios)
Criar os stores com estado inicial mas sem lógica ainda:
- [ ] `src/store/auth.store.ts`
- [ ] `src/store/layout.store.ts`
- [ ] `src/store/theme.store.ts`
- [ ] `src/store/presence.store.ts`
- [ ] `src/store/events.store.ts` — implementar COMPLETO (ver PATTERNS.md seção 4)
- [ ] `src/store/offline.store.ts` — implementar COMPLETO (ver PATTERNS.md seção 2)
- [ ] `src/store/notification.store.ts`
- [ ] `src/store/search.store.ts`
- [ ] `src/store/hardware.store.ts`
- [ ] `src/store/modules/chat.store.ts` (vazio)
- [ ] `src/store/index.ts` — re-exporta tudo

### 0.7 — Componentes Base
Criar componentes que serão usados em TODA a fase de desenvolvimento:
- [ ] `src/components/ui/Skeleton/` — ver implementação em PATTERNS.md seção 3
- [ ] `src/components/ui/EmptyState/` — ver implementação em PATTERNS.md seção 3
- [ ] `src/components/ui/Toast/` e `ToastContainer` — ver PATTERNS.md seção 8
- [ ] `src/components/ui/Button/` — radius `--radius-interactive`, sem borda de accent
- [ ] `src/components/ui/Input/` — radius `--radius-interactive`, sem borda de accent

### 0.8 — AppLayout e estrutura inicial
- [ ] Criar `src/layouts/AppLayout.tsx` — área central vazia + BottomBar placeholder
- [ ] Criar `src/layouts/BottomBar/BottomBar.tsx` — barra vazia no fundo, altura 48px
- [ ] Criar `src/App.tsx` — por enquanto renderiza sempre AppLayout (Welcome será Fase 19)
- [ ] Configurar janelas no `src-tauri/tauri.conf.json`:
  - Janela `main`: sem decorações, transparente, tamanho inicial 1280x800
  - Janela `search`: ver configuração exata no SCOPE.md seção 8
- [ ] Aplicar Mica na janela principal via `window-vibrancy` no `src-tauri/src/main.rs`

### 0.9 — Tauri Commands básicos (Rust)
- [ ] Criar `src-tauri/src/commands/hardware.rs` com funções vazias:
  - `get_cpu_usage() -> Result<f32, String>`
  - `get_gpu_usage() -> Result<f32, String>`
  - `get_ram_usage() -> Result<f32, String>`
  - `get_network_speed() -> Result<(f64, f64), String>` — (download, upload) em MB/s
- [ ] Registrar todos os commands em `src-tauri/src/lib.rs`


### 0.10 — Global Search (janela do sistema)
- [ ] Janela `search` criada no boot e inicia oculta
- [ ] Toggle via Ctrl+Alt+Space (backend)
- [ ] Show/Hide robusto: show → unminimize → focus
- [ ] Posicionar top 20px e centralizar horizontalmente
- [ ] Auto-hide ao perder foco e ao pressionar ESC
- [ ] Frontend exclusivo: `SearchOverlay` + `GlobalSearch`

---

## FASE 1 — Layout Engine (Tiling Tree Split)
> **Objetivo:** Sistema de painéis funcionando: criar splits, redimensionar, fechar painéis.
> **Resultado esperado:** Usuário consegue dividir a tela e redimensionar os painéis com o mouse.
> **Dependências:** Fase 0 completa.

- [ ] Criar `src/utils/layout-tree.ts` com funções puras:
  - `insertNode(tree, targetId, node, position)` — inserir módulo ou split
  - `removeNode(tree, nodeId)` — remover nó e limpar nó pai
  - `updateRatio(tree, nodeId, ratio)` — atualizar proporção de um split
  - `findNode(tree, nodeId)` — buscar nó por ID
  - `getLeafNodes(tree)` — retornar todos os painéis folha (módulos)
  - `calculateMinSize(node, minSizes)` — calcular tamanho mínimo respeitando os módulos filhos

- [ ] Implementar `src/store/layout.store.ts`:
  - Estado: `tree: LayoutNode`, `activeNodeId: string | null`
  - Actions: `splitNode`, `removeNode`, `updateRatio`, `setActiveNode`, `saveLayout`, `loadLayout`, `resetLayout`

- [ ] Criar `src/engine/layout/LayoutEngine.tsx`:
  - Renderiza a árvore recursivamente
  - Cada `LayoutModule` renderiza o módulo correspondente dentro de `ModuleWrapper`
  - Cada `LayoutSplit` renderiza `SplitPane` com dois filhos e `ResizeHandle` no meio

- [ ] Criar `src/engine/layout/SplitPane.tsx`:
  - Props: `direction: 'horizontal' | 'vertical'`, `ratio: number`, `first: ReactNode`, `second: ReactNode`
  - Não permite ratio menor que o mínimo dos módulos filhos

- [ ] Criar `src/engine/layout/ResizeHandle.tsx`:
  - Faixa de 4px entre dois painéis, cursor `col-resize` ou `row-resize`
  - Durante drag: atualiza ratio em tempo real via `layout.store.updateRatio`
  - NÃO usa `onMouseDown` nos painéis filhos — apenas no próprio handle

- [ ] Criar `src/engine/layout/EmptyPane.tsx`:
  - Mostra `EmptyState` com "Clique com o botão direito para adicionar módulo"
  - Context menu com opções do layout (ver SCOPE.md seção 5)

- [ ] Criar `src/components/shared/ContextMenu/`:
  - Abre na posição do cursor via `position: fixed`
  - Fecha ao clicar fora ou pressionar Esc
  - Suporte a items com ícone, label, separadores e items destrutivos

- [ ] Persistência do layout:
  - Salvar `tree` serializado em `user_settings.saved_layouts` no Supabase
  - Carregar ao iniciar o app
  - Sincronizar via Supabase Realtime canal `settings:{user_id}`

---

## FASE 2 — Drag Handle System
> **Objetivo:** Arrastar módulos entre painéis funcionando SEM interferir com cliques normais.
> **Resultado esperado:** Passar o mouse no topo de um módulo revela o handle. Arrastar move o módulo.
> **Dependências:** Fase 1 completa.

- [ ] Criar `src/engine/drag/DragHandle.tsx` — ver implementação EXATA no SCOPE.md seção 6
  - NÃO usar `draggable={true}` HTML nativo
  - NÃO usar react-dnd, dnd-kit ou similares
  - Threshold de 8px antes de iniciar drag (`Math.hypot(dx, dy) > 8`)

- [ ] Criar `src/engine/drag/DragOverlay.tsx`:
  - Overlay translúcido que aparece sobre o painel alvo durante drag
  - Divide o painel em 5 zonas: centro, topo, baixo, esquerda, direita
  - Centro = substituir, bordas = criar split na direção correspondente
  - Destaca a zona que vai receber o módulo

- [ ] Criar `src/components/shared/ModuleWrapper/ModuleWrapper.tsx` — ver SCOPE.md seção 6
  - Todo módulo DEVE ser envolvido por este componente
  - Contém DragHandle no topo
  - `pointer-events: none` no conteúdo APENAS durante drag ativo

- [ ] Testes manuais obrigatórios antes de avançar:
  - [ ] Clicar em botão dentro do módulo → não inicia drag
  - [ ] Clicar em input dentro do módulo → não inicia drag, input recebe foco
  - [ ] Scroll dentro do módulo → não inicia drag
  - [ ] Hover no topo do módulo → handle revela
  - [ ] Arrastar pelo handle → módulo se move
  - [ ] Soltar no centro de outro painel → módulos trocam de lugar
  - [ ] Soltar na borda → cria split

---

## FASE 3 — Real-time Engine + Offline Mode
> **Objetivo:** WebSocket e Supabase Realtime funcionando. Modo offline com fila de ações.
> **Resultado esperado:** App detecta quando perde conexão, enfileira ações, reprocessa ao reconectar.
> **Dependências:** Fase 0 (events.store, offline.store).

- [ ] Criar `src/engine/realtime/channels.ts`:
  - Definir TODOS os canais Realtime do app (ver DATABASE.md seção final)
  - Cada canal como constante: `CHANNELS.conversation(id)`, `CHANNELS.feed()`, etc.

- [ ] Criar `src/engine/realtime/handlers.ts`:
  - Handler para cada tipo de evento recebido
  - Cada handler atualiza o store correto E emite evento via `events.store`

- [ ] Criar `src/engine/realtime/RealtimeProvider.tsx`:
  - Context provider que inicializa conexões ao montar
  - Subscribe nos canais relevantes para o usuário logado
  - Unsubscribe ao desmontar (cleanup obrigatório)

- [ ] Criar `src/services/realtime.service.ts`:
  - `subscribe(channel, handler)` — retorna função de cleanup
  - `unsubscribe(channel)` — desinscreve do canal

- [ ] Implementar `src/hooks/useOffline.ts` — ver PATTERNS.md seção 2:
  - Detectar conexão com teste real (não só `navigator.onLine`)
  - Chamar `offline.store.flushQueue()` ao reconectar

- [ ] Implementar `src/store/offline.store.ts` — ver PATTERNS.md seção 2:
  - Fila persistida no Tauri filesystem via command Rust
  - Criar `src-tauri/src/commands/storage.rs` com `save_offline_queue` e `load_offline_queue`

- [ ] Criar `src/components/shared/OfflineBanner/OfflineBanner.tsx`:
  - Banner no topo do AppLayout
  - Estados: sem conexão / reconectando / sincronizando X ações

- [ ] Criar `src/hooks/useOptimistic.ts` — ver PATTERNS.md seção 1

- [ ] Implementar `src/hooks/usePresence.ts`:
  - Atualiza `user_status` ao montar (online) e ao desmontar (offline)
  - Atualiza a cada mudança de atividade via `events.store.on('music:playing', ...)`

---

## FASE 4 — Autenticação + User Profile Core + Stories
> **Objetivo:** Login funcionando. Componentes de perfil prontos para uso em todos os módulos.
> **Resultado esperado:** Usuário consegue fazer login/cadastro. Perfil renderiza com variantes mini/medium/full.
> **Dependências:** Fase 3. Database configurado no Supabase (tabelas users, user_status, user_settings, follows, stories).

### 4.1 — Autenticação
- [ ] Criar tela de login (email + senha)
- [ ] Criar tela de cadastro
- [ ] Implementar `src/services/auth.service.ts`:
  - `login(email, password)`
  - `signup(email, password)`
  - `logout()`
  - `getSession()` — retorna sessão atual
- [ ] Implementar `src/store/auth.store.ts`:
  - Estado: `user: User | null`, `isLoading: boolean`
  - Escutar `supabase.auth.onAuthStateChange`
- [ ] `src/App.tsx` — mostrar login se não autenticado, AppLayout se autenticado
- [ ] Tray icon com status de presença (via `src-tauri/src/tray/mod.rs`)

### 4.2 — User Profile Core
- [ ] Criar `src/services/user.service.ts`:
  - `getUser(userId)`, `updateUser(data)`, `getUserStatus(userId)`
- [ ] Criar `src/components/profile/ProfileAvatar/ProfileAvatar.tsx`:
  - Props: `userId: string`, `variant: 'mini' | 'medium' | 'full'`
  - Variante `mini`: 32px, sem nome
  - Variante `medium`: 48px, com nome
  - Variante `full`: 80px+, com nome e username
  - Exibir anel de story (gradiente se novo, cinza se assistido)
  - Exibir indicador de status online
  - Exibir `avatar_alt_url` se usuário não é seguidor
- [ ] Criar `src/components/profile/ProfileBanner/ProfileBanner.tsx`:
  - Props: `userId: string`, `variant: 'card' | 'chat' | 'profile'`
  - Variante `card`: altura 60px, blur 20px, overlay 60% opacidade
  - Variante `chat`: altura 120px, blur 10px, overlay 40% opacidade
  - Variante `profile`: altura 200px, sem blur, overlay 20% opacidade
  - Suportar todos os `banner_type`: image, gif, video (autoplay muted loop), color, gradient
- [ ] Criar `src/components/profile/ProfileStatus/ProfileStatus.tsx`:
  - Escuta eventos via `events.store` para atividade em tempo real
  - Exibe status de presença com cor correta (usar variáveis CSS)
  - Exibe atividade: "PLAYING — EA FC 24" ou "LISTENING — Drake"
- [ ] Criar `src/components/profile/ProfileMetrics/ProfileMetrics.tsx`:
  - Posts / Seguidores / Seguindo clicáveis
  - Atualiza em tempo real via Supabase Realtime
- [ ] Criar `src/components/profile/ProfileCard/ProfileCard.tsx`:
  - Composição de Avatar + Status + Metrics
  - Aceita todas as variantes dos componentes filhos

### 4.3 — Stories Core
- [ ] Criar `src/components/shared/StoriesLine/StoriesLine.tsx`:
  - Linha horizontal com scroll, sem scrollbar visível
  - Primeiro item: story do próprio usuário com botão "+"
- [ ] Criar `src/components/shared/StoriesLine/StoryItem.tsx`:
  - Anel de gradiente para story novo, cinza para assistido
  - Clique abre visualizador de story
- [ ] Implementar visualizador de story (tela fullscreen com timer)
- [ ] Upload de story (foto e vídeo) com edição: crop, proporção, texto, legenda
- [ ] Expiração automática em 24h (via campo `expires_at` na query)
- [ ] Soft delete de story

---

## FASE 5 — Global Search + Atalhos + Deep Links
> **Objetivo:** Search global funcionando como PowerToys Run. Atalhos de teclado e deep links ativos.
> **Resultado esperado:** Ctrl+Alt+Space abre janela com efeito Mica sobre qualquer janela do Windows.
> **Dependências:** Fase 0 (janela search configurada no tauri.conf.json).

### 5.1 — Global Search
- [ ] Registrar atalho global `Ctrl+Alt+Space` no Rust via `tauri-plugin-global-shortcut` (ver SCOPE.md seção 8)
- [ ] Implementar lógica de mostrar/esconder janela `search` ao pressionar atalho
- [ ] Criar `src/layouts/SearchOverlay/SearchOverlay.tsx` (roda na janela `search`)
- [ ] Criar `src/components/shared/GlobalSearch/GlobalSearch.tsx`:
  - Input com foco automático ao abrir
  - Fechar ao pressionar Esc ou clicar fora
- [ ] Criar `src/components/shared/GlobalSearch/SearchResults.tsx`:
  - Resultados em tempo real por categoria (ver SCOPE.md seção 8)
  - Busca local primeiro (Zustand stores), depois Supabase se sem resultado local
- [ ] Criar `src/store/search.store.ts`:
  - Gerenciar query, resultados, histórico de buscas
- [ ] Implementar `src/hooks/useSearch.ts`
- [ ] Navegação por teclado: setas ↑↓ navegam entre resultados, Enter abre

### 5.2 — Atalhos de teclado
- [ ] Implementar `src/hooks/useShortcuts.ts` — ver PATTERNS.md seção 6
- [ ] Registrar todos os atalhos da tabela do PATTERNS.md seção 6
- [ ] Criar componente de menu de atalhos (acessível via Ctrl+/)

### 5.3 — Deep Links
- [ ] Configurar protocolo `app://` no `tauri.conf.json`
- [ ] Criar `src/utils/deep-link.ts` — parser de URLs `app://`
- [ ] Implementar `src/hooks/useDeepLink.ts` — ver PATTERNS.md seção 5
- [ ] Testar todos os destinos listados na tabela do PATTERNS.md seção 5

---

## FASE 6 — Módulo Chat (0% → 100%)
> **Objetivo:** Chat funcional com todas as features do escopo.
> **Dependências:** Fases 1-5. Tabelas conversations, conversation_members, messages, message_edits, message_reads, message_reactions, message_favorites no Supabase.

### 6.1 — Chat Home
- [ ] Criar `src/modules/Chat/screens/Home/HomeHeader.tsx`:
  - StoriesLine completo com scroll
  - Barra de busca de conversas (busca em `chat.store.conversations`)
  - Filtros em pills: Todos / Não lidas / Grupos / Favoritos
- [ ] Criar `src/modules/Chat/screens/Home/HomeSection.tsx`:
  - Lista de conversas com `ChatCard` por item
  - Ordenação: fixadas primeiro, depois por última mensagem
  - Context menu por conversa: Fixar / Favoritar / Silenciar / Arquivar / Excluir
  - Badge de não lidas em tempo real via Supabase Realtime
  - Hover no card: botão de expandir para resposta rápida
- [ ] Criar `src/modules/Chat/components/ChatCard/ChatCard.tsx`:
  - Avatar com status online + banner como fundo sutil (variante `card`)
  - @username em negrito, preview da última msg, timestamp, badge de não lidas
  - Ícone de fixado se `is_pinned = true`
- [ ] Criar `src/modules/Chat/screens/Home/HomeFooter.tsx`:
  - Botões: MY-PROFILE, CONFIG, FAVORITES, QUIT
  - FAB (+) que gira 45° ao abrir submenu
  - Submenu do FAB: CREATE-STORIES, CREATE-GROUP, CREATE-SERVIDOR
  - BTN-TRASH: abre histórico de mensagens excluídas
- [ ] Implementar `src/store/modules/chat.store.ts`:
  - Carregar conversas do Supabase ao montar
  - Subscribe no canal Realtime de mensagens
  - Actions: `sendMessage`, `editMessage`, `deleteMessage`, etc.
  - Todos os `sendMessage` e `editMessage` com optimistic updates (ver PATTERNS.md seção 1)
- [ ] Toggles nas configurações do Chat:
  - Mostrar/ocultar preview de mensagens
  - Invisível para grupos

### 6.2 — ChatDM
- [ ] Criar `src/modules/Chat/screens/ChatDM/ChatDMHeader.tsx`:
  - StoriesLine dos participantes da conversa
  - ProfileCard clicável (abre ChatProfile)
  - BTN-CALL, BTN-VIDEO, BTN-MORE
- [ ] Criar `src/modules/Chat/screens/ChatDM/ChatDMSection.tsx`:
  - Renderiza lista de mensagens com auto-scroll para a última
  - Agrupamento: msgs sequenciais do mesmo autor em `MessageGroup`
  - Subscribe em Realtime do canal `conversation:{id}`
  - Indicador "digitando..." em tempo real
- [ ] Criar `src/modules/Chat/components/MessageBubble/MessageBubble.tsx`:
  - Props: mensagem, se é do usuário atual, se é continuação de grupo
  - Status: sending (🕐) / sent (✓) / read (✓✓) / failed (⚠️ + botão reenviar)
  - Context menu ao clicar com botão direito (ver SCOPE.md seção 10)
- [ ] Criar `src/modules/Chat/components/MessageGroup/MessageGroup.tsx`:
  - Agrupa msgs sequenciais do mesmo autor
  - Mostrando somente o avatar na primeira msg do grupo
- [ ] Criar `src/modules/Chat/screens/ChatDM/ChatDMFooter.tsx`:
  - INPUT-WRITE-MESSAGE com radius `--radius-interactive`
  - BTN-SEND aparece quando há texto, BTN-RECORD-VOICE quando vazio
  - BTN-EMOTE, BTN-ATTACH
- [ ] Implementar todas as funcionalidades do Context Menu de mensagem (ver SCOPE.md seção 10)
- [ ] Implementar configurações de DM com todos os toggles

### 6.3 — ChatProfile
- [ ] Criar `src/modules/Chat/screens/ChatProfile/ChatProfileHeader.tsx`:
  - StoriesLine
  - ProfileBanner variante `profile` com foto sobreposta
  - Status de presença + atividade em tempo real
  - Tabs: POSTS / FOLLOWERS / FOLLOWING / BIO
- [ ] Criar `src/modules/Chat/screens/ChatProfile/ChatProfileSection.tsx`:
  - Cards de atividades recentes com imagem de background contextual
  - Integração com `events.store` para atualizar em tempo real
- [ ] Criar `src/modules/Chat/screens/ChatProfile/ChatProfileFooter.tsx`:
  - INPUT-WRITE-MESSAGE
  - BTN-SHOW/HIDE, BTN-MOVE, BTN-CONFIG, BTN-VOLUME

### 6.4 — Hot/Cold Storage
- [ ] Criar background job Rust em `src-tauri/src/jobs/cold_storage.rs`:
  - Roda diariamente (via timer no Tauri)
  - Implementar lógica de migração (ver SCOPE.md seção 26)
  - Upload para R2 com zstd
  - UPDATE messages SET cold_ref = path, content = NULL

---

## FASE 6.5 — Advanced Chat Interactions
> **Objetivo:** Transformar o chat em uma ferramenta social de alta performance com interações ricas.
> **Dependências:** Fase 6 completa.

- [ ] **SyncShare:** Implementar sincronização de estado de player (Play/Pause/Seek) via canais Realtime específicos para ouvir música ou ver vídeos juntos.
- [ ] **Code Snippets:** Integrar Monaco Editor ou Prism.js para renderização de blocos de código com highlight e botão "Copiar".
- [ ] **Quick Reminders:** Implementar sistema de notificações agendadas via Tauri no Rust para lembretes sobre mensagens específicas.
- [ ] **Shared Whiteboard:** Criar componente Canvas para desenho rápido (300x300) e exportação em .webp para rascunhos instantâneos.
- [ ] **Screen Snip & Annotate:** Implementar captura de tela nativa no Rust e ferramentas de anotação no frontend.
- [ ] **Nudge (Janela Tremer):** Criar comando Rust `window_nudge` que manipula a posição da janela para simular o efeito de tremer.
- [ ] **Voice Transcription:** Integrar serviço de transcrição (local ou API) para transformar áudios em texto visível abaixo da bolha.

---

## FASE 6.6 — Chat Revolution (Experimental)
> **Objetivo:** Implementar as mecânicas que mudam o paradigma de como um chat funciona, tornando-o orgânico e gamificado.

- [ ] **Conversa Viva (Dynamic UI):** Motor que calcula a "temperatura" da conversa baseado no intervalo de mensagens e muda as variáveis CSS do tema localmente.
- [ ] **Identidade Camaleão:** Permitir override de `avatar_url` e `display_name` a nível de `conversation_members`.
- [ ] **Burn After Read:** Implementar componente de bolha que detecta o "Intersection Observer" e deleta a mensagem após X segundos de visualização.
- [ ] **Mensagens Trancadas (Tempo/Local):** UI de "Cadeado" para mensagens que têm `unlock_at` ou `unlock_location`. Bloqueio validado no frontend e backend.
- [ ] **Silent Messages & Vault:** Implementar envio de mensagem que ignora a fila de notificações e o "Cofre" local para esconder DMs.

---

## FASE 26 — Ghost Files (Social Cloud P2P)
- [ ] **Privacy Stripper (Rust):** Implementar biblioteca para limpar metadados de arquivos antes do stream.
- [ ] **Ghost Send Engine:** Lógica de streaming P2P com trigger de auto-deleção no receptor via Tauri FS.
- [ ] **Social Folder:** Sincronização de eventos de diretório (Watcher) com notificações Realtime.

## FASE 27 — Squad Launcher & Social Macros
- [ ] **Preset Engine:** Sistema de salvar estados (apps abertos, volume, performance).
- [ ] **Global Sync:** Disparo de presets para múltiplos clientes via canais de grupo.

---

## FASE 7 — BottomBar Global
> **Objetivo:** Barra inferior com todos os indicadores em tempo real.
> **Dependências:** Fases 3 (presença), 4 (perfil), 6 (chat), Rust commands de hardware.

- [ ] Implementar `src-tauri/src/commands/hardware.rs` com dados reais do sistema
- [ ] Implementar `src/hooks/useHardware.ts`:
  - Chama `invoke('get_cpu_usage')` e outros a cada 2 segundos via `setInterval`
  - Atualiza `hardware.store`
- [ ] Implementar `src/layouts/BottomBar/BottomBar.tsx` completo:
  - Ícones de câmera, mic, screenshare (ativos quando em uso)
  - Nome do grupo/tropa conectada
  - Download/Upload speed
  - CPU% e GPU%
  - MiniPlayer de música (placeholder até Fase 9)
  - Seletor de status de presença clicável

---

## FASE 8 — Módulo Feed (0% → 100%)
> **Dependências:** Fases 1-4. Tabelas posts, post_reactions, post_comments no Supabase.

### 8.1 — FeedHome (lista + realtime)
- [ ] FeedHome com lista de posts em tempo real
- [ ] PostCard com mídia (imagem/gif/vídeo) e ações (like/comment/share)
- [ ] Paginação por cursor (infinite scroll)
- [ ] Reactions e contadores em tempo real (Supabase Realtime)

### 8.2 — Flow Criar Post (compose)
- [ ] PostComposer (texto + anexos)
- [ ] Upload de mídia no Cloudflare R2 seguindo R2_STRUCTURE.md
- [ ] Salvar metadados no Supabase (url + type + dims + duration)
- [ ] Visibilidade do post: all | followers
- [ ] Optimistic update (status posting → posted / rollback com toast)

### 8.3 — Comentários e edição
- [ ] CommentsDrawer (lista + enviar comentário)
- [ ] Edição de post com versionamento (post_versions) e label “editado”
- [ ] Soft delete (deleted_at) + UI de “post removido”
## FASE 9 — Módulo Music (0% → 100%)
> **Dependências:** Fases 1-4.

### 9.1 — Player + Library base
- [ ] MusicHome com lista de playlists, artistas e músicas curtidas
- [ ] MiniPlayer integrado na BottomBar (play/pause/next)
- [ ] Estado global do player em `music.store.ts`

### 9.2 — Flow Adicionar Músicas (add)
- [ ] UI de adicionar (dropzone + seletor de arquivos)
- [ ] Indexar localmente (metadados) sem travar UI
- [ ] Criar playlist e adicionar faixas
- [ ] Evento: `music:add` abre o flow

### 9.3 — Integração com Presence
- [ ] Atualizar presence/activity: `LISTENING — {track}`
- [ ] Realtime: status de música visível conforme settings
## FASE 10 — Módulo Favorite Games & Apps (0% → 100%)
> **Dependências:** Fases 1-4.

### 10.1 — Grid + Detecção
- [ ] FavoriteGamesHome com grid de cards
- [ ] Detecção de app/jogo ativo via Rust (processes.rs)
- [ ] Atualizar activity: `PLAYING — {game}`

### 10.2 — Pinning (Drag & Drop)
- [ ] Aceitar drag & drop de `.lnk` e `.exe` para “pin”
- [ ] Reordenar cards por drag
- [ ] Persistir favoritos no user_settings e sincronizar via Realtime

### 10.3 — Steam (import local)
- [ ] Importar biblioteca Steam instalada (apenas leitura local)
- [ ] Listar jogos Steam instalados como sugestões
- [ ] Ação “Adicionar aos Favoritos” cria item pinned
- [ ] Metadata avançada (capas/descrições) é fase posterior
## FASE 11 — Módulo Live (0% → 100%)
> **Dependências:** Fases 1-4.

- [ ] LivePlayer com badge LIVE ON e contador em tempo real
- [ ] LiveChat com mensagens em tempo real
- [ ] Widget Picture-in-Picture (janela sem chrome)
- [ ] Ao assistir: `emit('live:watching')`

---

## FASE 12 — Performance Governor (0% → 100%)
> **Dependências:** Fase 7 (hardware hooks). events.store.

- [ ] HardwareGraph com histórico de 5 minutos
- [ ] Temperaturas de CPU/GPU via Rust
- [ ] ModeSelector: Balanceado / Performance / Economia
- [ ] Escutar `games:detected` → aplicar modo Performance
- [ ] Emitir `governor:high-cpu` quando CPU > 85%
- [ ] Emitir `governor:cpu-normal` quando CPU < 50%

---

## FASE 13 — MotionWallpaper (0% → 100%)
> **Dependências:** Fase 12. Rust command para aplicar wallpaper no Windows.

- [ ] Implementar `src-tauri/src/commands/wallpaper.rs`:
  - `set_wallpaper(path)` — aplica vídeo/gif como wallpaper no Windows
  - `pause_wallpaper()` — pausa sem remover
  - `resume_wallpaper()`
- [ ] WallpaperGrid e WallpaperPreview
- [ ] Escutar `governor:high-cpu` → `invoke('pause_wallpaper')`
- [ ] Escutar `governor:cpu-normal` → `invoke('resume_wallpaper')`
- [ ] Escutar `games:detected` → pausar wallpaper automaticamente

---

## FASE 14 — Browser (0% → 100%)
> **Dependências:** Fases 1-2.

- [ ] BrowserBar com URL, navegação, tabs
- [ ] BrowserView via WebView do Tauri
- [ ] Modo dock e modo widget

---

## FASE 15 — Videos & Films (0% → 100%)
> **Dependências:** Fases 1-2.

- [ ] VideoPlayer com controles completos
- [ ] Widget Picture-in-Picture (igual Live)
- [ ] Films: catálogo e player

---

## FASE 16 — ScreenShare & RemoteShare (0% → 100%)
> **Dependências:** Fase 6 (Chat). Rust commands.

- [ ] `src-tauri/src/commands/remote.rs`:
  - `start_screen_capture()` — captura frames da tela
  - `start_remote_control(targetId)` — inicia sessão remota
  - `stop_remote_control()`
- [ ] ScreenShare: captura + transmissão via WebSocket
- [ ] Integrar botão de ScreenShare no footer do ChatDM
- [ ] RemoteShare: controle remoto com seletor de permissões
- [ ] Ao iniciar: `emit('screenshare:started')` / `emit('remoteshare:started')`

---

## FASE 17 — Settings (0% → 100%)
> **Dependências:** Fases 4, 7.

- [ ] SettingsAccount — alterar todos os dados do perfil, deletar conta, exportar dados
- [ ] SettingsAppearance — seletor de tema com preview em tempo real
- [ ] SettingsPrivacy — todos os toggles de visibilidade
- [ ] SettingsNotifications — toggles por tipo
- [ ] SettingsLanguage — troca idioma sem reload
- [ ] SettingsModules — ativar/desativar módulos
- [ ] SettingsShortcuts — visualizar e customizar atalhos

---

## FASE 18 — Sistema de Temas (0% → 100%)
> **Dependências:** Fase 0 (tokens CSS), Fase 17 (Settings).

- [ ] Implementar `src/hooks/useTheme.ts` — ver PATTERNS.md seção 7
- [ ] Implementar `src/store/theme.store.ts` com persistência no Supabase
- [ ] Troca Dark ↔ Light funciona sem reload
- [ ] Temas do Marketplace injetados dinamicamente via `<style>` tag
- [ ] Tema salvo em `user_settings.theme` e sincronizado entre dispositivos

---

## FASE 19 — Multi-Janela (0% → 100%)
> **Dependências:** Todos os módulos implementados.

- [ ] Cada módulo exporta versão standalone para rodar em janela separada
- [ ] Implementar abertura de janela de widget via `emit('module:open-as-widget')`
- [ ] `tauri-plugin-window-state` persistindo posição/tamanho de cada widget
- [ ] Sincronização de estado entre janelas via Tauri events
- [ ] Live e Videos como Picture-in-Picture (janela sem decorações, sempre no topo)

---

## FASE 20 — Notifications (0% → 100%)
> **Detalhamento de layout em aberto — definir antes de implementar.**

- [ ] Definir layout do módulo Notifications
- [ ] NotificationItem por tipo
- [ ] NotificationGroup por data
- [ ] Marcar como lido / limpar tudo
- [ ] Badge no ícone de notificações da BottomBar

---

## FASE 21 — Projects (0% → 100%)
> **Dependências:** Fases 1-4. Tabelas projects, project_boards, project_cards.

- [ ] Board com colunas arrastáveis
- [ ] Cards com drag entre colunas
- [ ] Edição de card: título, descrição, assignee, prazo, tags
- [ ] Colaboração em tempo real via Supabase Realtime
- [ ] Mencionar card em DM via deep link `app://project/{id}/card/{card_id}`

---

## FASE 22 — Marketplace / Workshop (0% → 100%)
> **Dependências:** Fases 13 (wallpapers), 18 (temas).

- [ ] AssetGrid com filtros por tipo (wallpaper/tema/widget)
- [ ] AssetCard com preview, rating, contador de downloads
- [ ] Download de asset + instalação local
- [ ] Upload de conteúdo da comunidade
- [ ] Sistema de avaliações (1-5 estrelas + comentário)
- [ ] Aplicar tema baixado via `useTheme.applyCustomTheme()`

---

## FASE 23 — Welcome & Onboarding (0% → 100%)
> **Dependências:** Fase 4 (auth, perfil).

- [ ] StepProfile: foto, username, bio
- [ ] StepModules: checkboxes dos módulos a ativar
- [ ] StepWallpaper: galeria de wallpapers iniciais
- [ ] StepTour: tour interativo pelos módulos
- [ ] Após onboarding: redirecionar para AppLayout e marcar `is_onboarded = true` no Supabase

---

## FASE 24 — Polish & Produção
> **Objetivo:** App pronto para distribuição.

- [ ] Testes de performance (medir FPS, tempo de carregamento, uso de memória)
- [ ] Otimização de bundle Vite (code splitting por módulo)
- [ ] Revisar todos os empty states — nenhum componente renderiza vazio
- [ ] Revisar todas as strings — todas usando i18n, nenhum texto hardcoded
- [ ] Tray icon completo com todas as ações
- [ ] Autostart configurável nas configurações
- [ ] Sistema de updates automáticos via Tauri updater
- [ ] Build de produção: Windows (.msi), macOS (.dmg), Linux (.AppImage)
- [ ] Assinatura do app (Windows: code signing certificate)

---

## RESUMO — ORDEM DE EXECUÇÃO

```
FASE 0  → Fundação (scaffold, tokens, types, stores, componentes base)
FASE 1  → Layout Engine (tiling tree split)
FASE 2  → Drag Handle System
FASE 3  → Real-time Engine + Offline Mode
FASE 4  → Auth + Profile Core + Stories
FASE 5  → Global Search + Atalhos + Deep Links
FASE 6  → Chat (módulo principal — mais complexo)
FASE 7  → BottomBar Global
FASE 8  → Feed
FASE 9  → Music
FASE 10 → Favorite Games
FASE 11 → Live
FASE 12 → Performance Governor
FASE 13 → MotionWallpaper
FASE 14 → Browser
FASE 15 → Videos & Films
FASE 16 → ScreenShare & RemoteShare
FASE 17 → Settings
FASE 18 → Sistema de Temas
FASE 19 → Multi-Janela
FASE 20 → Notifications
FASE 21 → Projects
FASE 22 → Marketplace
FASE 23 → Welcome & Onboarding
FASE 24 → Polish & Produção
```
