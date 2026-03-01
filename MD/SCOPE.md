# SCOPE.md — Desktop Social OS

> **ATENÇÃO PARA A IA:** Este documento é a fonte da verdade do projeto. Nunca tome decisões arquiteturais que conflitem com o que está aqui. Se houver dúvida entre o que está neste documento e o que parece "melhor prática", siga este documento. Não substitua tecnologias, não adicione libs não listadas, não mude nomes de módulos.

---

## 1. O QUE É ESSE PROJETO

Um app desktop social modular. O usuário pode organizar a interface como quiser, dividindo a tela em painéis e colocando módulos em cada painel. É como um sistema operacional social — chat, música, lives, feed, games e mais, tudo em uma janela.

Pense no Discord + Spotify + Twitter + Wallpaper Engine, mas tudo integrado e com layout totalmente customizável pelo usuário.

---

## 2. STACK — NÃO ALTERAR

Estas são as tecnologias do projeto. Não substituir por alternativas, não adicionar tecnologias fora desta lista sem aprovação explícita.

### Frontend
- **React 18** com hooks funcionais — nunca usar class components
- **Vite** como bundler — nunca webpack, nunca CRA
- **TypeScript** — nunca JavaScript puro, todo arquivo é .tsx ou .ts
- **CSS Modules** — nunca Tailwind, nunca styled-components, nunca inline styles, nunca classes globais. Todo estilo em arquivo `.module.css` próprio
- **Zustand** para estado global — nunca Redux, nunca Context API para estado global

### Desktop
- **Tauri 2** (Rust backend) — nunca Electron
- **window-vibrancy** — para efeitos Mica/Acrylic nativos do Windows
- **tauri-plugin-window-state** — para persistir posição/tamanho de janelas
- **tauri-plugin-global-shortcut** — para atalhos globais de teclado

### Backend & Dados
- **Supabase** — banco PostgreSQL, autenticação, Realtime, storage de metadados
- **Cloudflare R2** — storage de todos os arquivos de mídia
- **Supabase Realtime (WebSocket)** — comunicação em tempo real

### Internacionalização
- **i18next + react-i18next** — pt-BR como idioma padrão

---

## 3. AUTENTICAÇÃO

- Login e cadastro básico via Supabase Auth
- Sessão persistida no dispositivo (não pedir login toda vez)
- **FORA DO ESCOPO por enquanto:** 2FA, esqueci senha, verificação de email

---

## 4. REAL-TIME FIRST

**REGRA FUNDAMENTAL:** Todo dado que pode mudar precisa atualizar na tela sem o usuário precisar recarregar ou apertar qualquer botão. Nunca usar polling. Nunca usar setTimeout para "simular" real-time.

### O que atualiza em tempo real via Supabase Realtime
- Mensagens novas, editadas, deletadas
- Reações em mensagens e posts
- Status de "digitando..."
- Confirmações de leitura (✓✓)
- Presença: Online / Ausente / Não perturbe / Offline
- Atividade: `PLAYING — EA FC 24` / `LISTENING — Drake` / `WATCHING — Live`
- Novos posts no feed
- Novos stories
- Contador de viewers em live
- Notificações
- Sincronização de layout entre dispositivos

---

## 5. SISTEMA DE LAYOUT — TILING TREE SPLIT

### O que é
O layout da interface é uma árvore binária de painéis, igual ao sistema de split do VS Code. Cada painel pode conter um módulo, ou pode ser dividido em dois painéis filhos (horizontal ou vertical).

### Por que não usar biblioteca
Não usar react-mosaic, golden-layout ou similar. Construir do zero porque:
- Precisamos de drag handle customizado (ver seção 6)
- O context menu precisa ser o mesmo do resto do app
- Controle total sobre animações e min-sizes por módulo
- Libs externas geram conflitos com o sistema de eventos do app

### Estrutura de dados da árvore
```ts
// Em: src/types/layout.types.ts

type LayoutNode =
  | { type: 'module'; moduleId: string; id: string }
  | { type: 'split'; direction: 'horizontal' | 'vertical'; ratio: number; first: LayoutNode; second: LayoutNode; id: string }

// ratio vai de 0.1 a 0.9, representa o tamanho do primeiro filho em relação ao total
```

### Estados de um painel
- `module` → está mostrando um módulo
- `split` → está dividido em dois filhos
- Se o painel está vazio (nenhum módulo escolhido), mostrar o componente `EmptyPane` com context menu

### Comportamento de drag entre painéis
1. Usuário arrasta módulo pelo DragHandle (ver seção 6)
2. Ao passar por cima de outro painel, mostrar `DragOverlay` indicando onde vai cair (centro = substituir, borda = split)
3. Soltar no centro → substitui o módulo do painel alvo
4. Soltar na borda esquerda/direita → cria split vertical
5. Soltar na borda superior/inferior → cria split horizontal

### Restrições de tamanho mínimo por módulo
Nunca permitir resize abaixo dos valores mínimos:

| Módulo | Min Width | Min Height |
|---|---|---|
| Chat | 400px | 100% do painel |
| Feed | 400px | 100% do painel |
| Music | 400px | 100% do painel |
| Live | 400px | 100% do painel |
| Videos | 400px | 100% do painel |
| Films | 400px | 100% do painel |
| Browser | 400px | 100% do painel |
| Favorite Games/Apps | 100% do painel | 375px |
| RemoteShare | 400px | 100% do painel |
| ScreenShare | 400px | 100% do painel |
| MotionWallpaper | 400px | 100% do painel |
| Performance Governor | 400px | 100% do painel |
| Marketplace | 400px | 100% do painel |
| Projects | 400px | 100% do painel |
| Settings | 400px | 100% do painel |
| Notifications | 400px | 100% do painel |

### Persistência do layout
- Salvar no Supabase tabela `user_settings.saved_layouts` (campo jsonb)
- Sincronizar entre dispositivos via Supabase Realtime
- Suportar múltiplos layouts salvos com nome (ex: "Gaming", "Trabalho")
- Ter um layout padrão definido no código para novos usuários

### Context menu do painel (clique direito em área vazia)
- "Adicionar módulo" → abre seletor de módulos
- "Dividir vertical" → divide o painel atual em dois verticalmente
- "Dividir horizontal" → divide o painel atual em dois horizontalmente
- "Fechar painel" → remove o painel (só aparece se não for o único painel)
- "Salvar layout" → salva o layout atual com um nome
- "Carregar layout" → abre lista de layouts salvos
- "Resetar layout" → volta para o layout padrão

---

## 6. DRAG HANDLE — HOVER REVEAL

### O problema que isso resolve
Se o drag for ativado pelo conteúdo do módulo, qualquer clique em botão ou campo de texto pode acidentalmente iniciar um drag. Isso é inaceitável.

### A solução
Existe uma faixa invisível de 5px no topo de cada módulo. Quando o mouse passa por ela, ela se revela e permite iniciar o drag. O conteúdo do módulo NUNCA ativa drag.

### Comportamento exato
1. Estado normal: faixa de 5px no `top: 0` do módulo, `opacity: 0`, `z-index: 999`
2. Mouse entra na faixa: ela expande para 20px de altura com `opacity: 1`, cursor vira `grab`
3. O conteúdo do módulo faz `transform: translateY(15px)` para abrir espaço
4. Mouse sai sem arrastar: reverte para 5px e `opacity: 0` suavemente
5. Mouse clica e move mais de 8px: inicia o drag do módulo

### Código de referência — DragHandle.tsx
```tsx
// Em: src/engine/drag/DragHandle.tsx
// NUNCA usar draggable={true} do HTML nativo
// NUNCA usar bibliotecas de DnD como dnd-kit ou react-beautiful-dnd

import { useRef, useState } from 'react'
import styles from './DragHandle.module.css'

interface DragHandleProps {
  onDragStart: (e: MouseEvent) => void
  onRevealChange: (revealed: boolean) => void
}

export function DragHandle({ onDragStart, onRevealChange }: DragHandleProps) {
  const [revealed, setRevealed] = useState(false)
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const handleMouseEnter = () => {
    setRevealed(true)
    onRevealChange(true)
  }

  const handleMouseLeave = () => {
    if (!isDragging.current) {
      setRevealed(false)
      onRevealChange(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!mouseDownPos.current) return
      const dx = moveEvent.clientX - mouseDownPos.current.x
      const dy = moveEvent.clientY - mouseDownPos.current.y
      // Só inicia drag após 8px de movimento — clique simples nunca vira drag
      if (Math.hypot(dx, dy) > 8 && !isDragging.current) {
        isDragging.current = true
        onDragStart(moveEvent)
      }
    }

    const handleMouseUp = () => {
      mouseDownPos.current = null
      isDragging.current = false
      setRevealed(false)
      onRevealChange(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={`${styles.handle} ${revealed ? styles.revealed : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.indicator} />
    </div>
  )
}
```

### CSS de referência — DragHandle.module.css
```css
.handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  z-index: 999;
  cursor: grab;
  transition: height 0.15s ease, opacity 0.15s ease;
  opacity: 0;
  background: transparent;
  border-radius: var(--radius-module) var(--radius-module) 0 0;
}

.revealed {
  height: 20px;
  opacity: 1;
  background: rgba(255, 255, 255, 0.04);
}

.indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.revealed .indicator {
  opacity: 1;
}
```

### ModuleWrapper — como usar o DragHandle
```tsx
// Em: src/components/shared/ModuleWrapper/ModuleWrapper.tsx
// Todo módulo DEVE ser envolvido por este componente

import { useState } from 'react'
import { DragHandle } from '@/engine/drag/DragHandle'
import styles from './ModuleWrapper.module.css'

interface ModuleWrapperProps {
  children: React.ReactNode
  moduleId: string
}

export function ModuleWrapper({ children, moduleId }: ModuleWrapperProps) {
  const [handleRevealed, setHandleRevealed] = useState(false)

  const handleDragStart = (e: MouseEvent) => {
    // Avisar o LayoutEngine que este módulo está sendo arrastado
    // Via events.store — NUNCA manipular DOM diretamente
  }

  return (
    <div className={styles.wrapper}>
      <DragHandle
        onDragStart={handleDragStart}
        onRevealChange={setHandleRevealed}
      />
      {/* pointer-events: none APENAS durante drag ativo — restaura imediatamente ao soltar */}
      <div
        className={styles.content}
        style={{ transform: handleRevealed ? 'translateY(15px)' : 'translateY(0)' }}
        // NUNCA colocar onMouseDown aqui que possa propagar para o DragHandle
      >
        {children}
      </div>
    </div>
  )
}
```

---

## 7. MULTI-JANELA

### Janelas do app
O app tem múltiplas janelas Tauri configuradas no `tauri.conf.json`:

| Janela | Label | Visível por padrão | Decorações |
|---|---|---|---|
| Principal | `main` | Sim | Não (frameless) |
| Global Search | `search` | Não | Não |
| Widget (por módulo) | `widget-{moduleId}` | Não | Não |

### Janela de Global Search — configuração exata
```json
// Em: src-tauri/tauri.conf.json
{
  "label": "search",
  "title": "",
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": true,
  "center": true,
  "width": 680,
  "height": 500,
  "resizable": false,
  "visible": false,
  "skipTaskbar": true,
  "shadow": true,
  "vibrancy": "mica"
}
```

### Efeito Mica/Acrylic via window-vibrancy
```rust
// Em: src-tauri/src/main.rs
// Aplicar Mica na janela de search ao criá-la

use window_vibrancy::{apply_mica, apply_acrylic, NSVisualEffectMaterial};

// Windows 11
apply_mica(&window, Some(true)).expect("Unsupported platform");

// Fallback Windows 10
// apply_acrylic(&window, Some((0, 0, 0, 80))).expect("Unsupported platform");
```

### Comunicação entre janelas
NUNCA tentar acessar estado de outra janela diretamente. Comunicação APENAS via Tauri events:

```ts
// Emitir da janela principal para a janela de search
import { emit } from '@tauri-apps/api/event'
await emit('search:open', { query: '' })

// Escutar na janela de search
import { listen } from '@tauri-apps/api/event'
await listen('search:open', (event) => {
  // abrir e focar o input
})
```

### Persistência de posição/tamanho de janelas de widget
Usar `tauri-plugin-window-state` — ele persiste automaticamente posição e tamanho de cada janela pelo label.

---

## 8. GLOBAL SEARCH

Atalho: `Ctrl + Alt + Space` — funciona mesmo com o app em background.

### Comportamento
1. Atalho pressionado → janela `search` aparece centralizada na tela com efeito Mica
2. Input já focado automaticamente
3. Usuário digita → resultados aparecem em tempo real por categoria
4. Setas ↑↓ para navegar, Enter para abrir, Esc para fechar
5. Clicar fora da janela → fecha
6. Abrir resultado → janela some, módulo correto abre na janela principal

### Categorias de resultado (em ordem de exibição)
1. Pessoas (usuários, perfis)
2. Conversas (histórico de chat)
3. Músicas (tracks, álbuns, artistas)
4. Posts (feed)
5. Games & Apps (favoritos)
6. Arquivos (mídia de DMs)
7. Projetos (boards, cards)
8. Wallpapers (biblioteca e marketplace)
9. Configurações (atalho direto)
10. Comandos (ações: "abrir chat com @ana", "tocar drake")

### Registro do atalho global no Rust
```rust
// Em: src-tauri/src/shortcuts/mod.rs
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

app.global_shortcut().register(
  Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space),
  |app, _shortcut, _event| {
    let window = app.get_webview_window("search").unwrap();
    if window.is_visible().unwrap() {
      window.hide().unwrap();
    } else {
      window.show().unwrap();
      window.set_focus().unwrap();
    }
  }
)?;
```

---

## 9. MÓDULOS — MODOS DOCK E WIDGET

### Navegação interna — flows (sem rotas)

Dentro do app principal, telas como **Criar Post**, **Criar Story**, **Adicionar Músicas**, **Detalhes de Jogo** são **flows internos** do módulo.

- Não usar React Router para telas internas
- Controlar por estado `view/flow` no store do módulo
- Ações globais (Global Search, deep links, atalhos) disparam **eventos** no `events.store.ts` para abrir o flow correto

### Modo Dock
- Módulo encaixado na árvore de layout
- Ocupa 100% da altura do painel
- Respeita min-width definido na tabela da seção 5

### Modo Widget
- Janela Tauri separada, flutuante, sempre em cima
- Arrastável e redimensionável pelo usuário
- Posição e tamanho persistidos por `tauri-plugin-window-state`
- Live e Videos no modo widget viram Picture-in-Picture (sem chrome, só o player)

### Como alternar entre Dock e Widget
```ts
// Via events.store
emit('module:open-as-widget', { moduleId: 'music' })
emit('module:dock', { moduleId: 'music' })
```

---

## 10. MÓDULOS DETALHADOS

### Chat

**Home — Header**
- Linha de stories horizontais com scroll
- Story do usuário com botão "+" para criar
- Stories com story novo têm anel de gradiente (accent → accentAlt)
- Stories assistidos têm anel cinza
- Barra de busca de conversas (busca local primeiro, depois Supabase)
- Filtros em pills: Todos / Não lidas / Grupos / Favoritos

**Home — Section**
- Lista de conversas (DMs e grupos)
- Cada item: avatar, status online, nome (@username), preview da última msg, timestamp, badge de não lidas
- Conversas fixadas aparecem primeiro com ícone 📌
- Context menu (botão direito): Fixar / Favoritar / Silenciar / Arquivar / Excluir
- Ao clicar na conversa abre o ChatDM

**Home — Footer**
- BTN-MY-PROFILE → abre ChatProfile do próprio usuário
- BTN-CONFIG → abre configurações do módulo Chat
- BTN-FAVORITES → filtra favoritos
- BTN-QUIT → sai / minimiza
- BTN-CREATE (FAB flutuante, botão "+" que gira 45° ao abrir):
  - BTN-CREATE-STORIES → criar story
  - BTN-CREATE-GROUP → criar grupo
  - BTN-CREATE-SERVIDOR → criar servidor

**Home — Funcionalidades adicionais**
- Hover em conversa → aparece botão de expandir para resposta rápida sem abrir ChatDM
- BTN-TRASH → histórico de mensagens excluídas pelo usuário
- Toggle nas configurações: mostrar/ocultar preview de mensagens na home
- Toggle nas configurações: ficar invisível para grupos mas ver msgs se mencionado ou @all

**ChatDM — Header**
- Linha de stories dos participantes (StoriesLine)
- Card de perfil clicável: avatar com status online, nome, atividade atual (PLAYING/LISTENING)
- BTN-CALL (chamada de voz)
- BTN-VIDEO (chamada de vídeo)
- BTN-MORE (mais opções)

**ChatDM — Section**
- Bolhas de mensagem com agrupamento: várias msgs seguidas do mesmo autor viram grupo colapsado
- Msg do usuário: alinhada à direita, cor de destaque
- Msg do outro: alinhada à esquerda, cor neutra
- Status: ✓ enviado, ✓✓ lido (em tempo real)
- Indicador "digitando..." em tempo real
- Funcionalidades:
  - Enviar figurinha junto com texto
  - Enviar com senha de acesso (destinatário precisa digitar a senha para ver)
  - Agendar envio (data e hora programada)
  - Apagar mensagem mantendo registro no histórico de excluídas
  - Chamada de voz / vídeo
  - Log da conversa
  - ScreenShare direto da DM

**ChatDM — Context Menu de mensagem (botão direito)**
- Responder
- Múltipla resposta (selecionar várias e responder todas)
- Editar mensagem (a qualquer momento, sem restrição de tempo)
  - Salva histórico em `message_edits`
  - Se editar após 3min do envio: notifica o recebedor "Autor editou a mensagem"
  - Toggle por DM: ativar/desativar notificação de edição
  - BTN-HISTORY-EDIT: abre histórico de todas as edições da mensagem
- Reenviar / Editar imagem por cima (substituir imagem mantendo a mensagem)
- Copiar
- Fixar mensagem (aparece no topo da conversa)
- Favoritar (todos / apenas para mim)
- Excluir para todos / apenas para mim
- Download de imagem/arquivo
- Compartilhar seleção no Stories
- Salvar trecho de conversa (salva em `saved_conversation_excerpts`)
- Tema da conversa: gif / cor de bubbles / cor de fundo / imagem / vídeo / slide de fotos com tempo por foto

**ChatDM — Footer**
- INPUT-WRITE-MESSAGE (radius 100px, fundo --bg-module)
- BTN-SEND (aparece quando há texto) / BTN-RECORD-VOICE (aparece quando input vazio)
- BTN-EMOTE
- BTN-ATTACH

**ChatDM — Configurações**
- Bloquear usuário
- Seguir / Deixar de seguir
- Toggle: enviar confirmação de leitura somente após responder
- Toggle: foto de perfil do outro como background da conversa
- Toggle: mostrar fotos de perfil mixadas (recebedor e autor nas bolhas)
- Toggle: permitir chamadas
- Toggle: notificações desta conversa

**ChatProfile — Header**
- StoriesLine do usuário
- Foto de perfil grande (ocupa topo como banner+avatar em um só elemento)
- Username sobreposto com overlay escuro
- Status de presença + atividade em tempo real
- Tabs: BTN-POSTS / BTN-FOLLOWERS / BTN-FOLLOWING / BTN-BIO

**ChatProfile — Section**
- CARD-RECENTLY-ACTIVITIES: cards com imagem de background contextual
  - Música: capa do álbum como background, nome da música + artista
  - Jogo: capa do jogo como background, nome + "X minutes ago"
  - Live: thumbnail da live

**ChatProfile — Footer**
- INPUT-WRITE-MESSAGE
- BTN-SHOW/HIDE (mostrar/ocultar seção)
- BTN-MOVE (mover o perfil para outro painel)
- BTN-CONFIG (configurações do perfil)
- BTN-VOLUME (controle de volume da conversa)



### Feed

**FeedHome**
- Lista de posts em tempo real (Supabase Realtime)
- Paginação por cursor (infinite scroll)
- Filtros: Todos / Seguindo / Mídia / Salvos
- Composer rápido: placeholder “O que você quer postar?” abre o flow de criação

**Flow — Criar Post (compose)**
- Editor de texto com contador de caracteres
- Anexos: imagem (.webp), gif (.gif), vídeo (.mp4)
- Upload de mídia no Cloudflare R2 (ver R2_STRUCTURE.md) e salvar metadados no Supabase
- Visibilidade: `all` | `followers`
- Optimistic update: post aparece instantaneamente com status `posting`, rollback se falhar
- Edição gera versão (histórico) e marca “editado”
- Soft delete (nunca deletar fisicamente)

**PostCard**
- Header: avatar + display name + @username + timestamp
- Corpo: texto + mídia opcional (carrossel)
- Ações: Like / Comentário / Repost / Share
- Contadores em tempo real (likes/comments)
- Context menu (botão direito): Salvar / Denunciar / Ocultar / Copiar link

### Grupos & Servidores
> Em definição. Não implementar até decisão arquitetural.

---

## 11. USER PROFILE CORE

Estes componentes são usados em MÚLTIPLOS módulos. Ficam em `src/components/profile/`.

### Variantes de tamanho
- `mini` → usado em: lista de chats, StoriesLine, menções em mensagens
- `medium` → usado em: cards de preview, notificações
- `full` → usado em: tela de ChatProfile

### ProfileAvatar
- Foto única OU slide de fotos (array de URLs com tempo configurável por imagem em ms)
- Se o usuário não é seguidor: exibir `avatar_alt_url` se definido
- Visibilidade configurável: `all` / `followers` / `except` / `only`
- Anel de story ao redor: gradiente se tem story novo, cinza se assistido, nenhum se sem story
- Indicador de status online: ponto colorido na borda inferior direita

### ProfileBanner
Três variantes de contexto (prop `variant`):
- `card` → usado na lista de chats como fundo sutil atrás do item, blur forte, overlay escuro, altura reduzida
- `chat` → usado no header do ChatDM, altura média, overlay moderado
- `profile` → usado na tela ChatProfile, altura máxima, foto de perfil sobreposta

Tipos de banner aceitos (prop `type`):
- `image` → imagem estática do R2
- `gif` → gif do R2
- `video` → vídeo curto do R2 (autoplay, muted, loop)
- `color` → cor sólida CSS
- `gradient` → gradiente CSS

### ProfileStatus
Exibe o status de presença e atividade em tempo real:
- 🟢 Online → cor `--status-online` (#00FF66)
- 🟠 Ausente → cor `--status-away` (#FF7F50)
- 🔴 Não perturbe → cor `--status-dnd` (#C7001B)
- ⚫ Offline → cor `--status-offline` (#7A7A7A)
- Atividade: texto como "PLAYING — EA FC 24" ou "LISTENING — Drake"

### ProfileMetrics
Posts / Seguidores / Seguindo — todos clicáveis, abrem lista respectiva.

---

## 12. STORIES

- Editar antes de postar: crop, proporção, áudio, grid, texto, legenda
- Editar legenda após postar
- Apagar story (soft delete, expira em 24h de qualquer forma)
- Compartilhar seleção de conversa direto no story


### Flow — Criar Story (compose → editor → publish)

- Criar story a partir de:
  - imagem (.webp)
  - vídeo (.mp4) curto
  - texto (story de texto)
- Editor antes de postar:
  - crop/zoom
  - texto
  - stickers (fase posterior)
  - seleção de privacidade (all/followers)
- Upload no R2 e salvar metadados no Supabase
- Publicar é optimistic: aparece no próprio story ring como “enviando”, rollback se falhar


---

## 13. MÓDULO: NOTIFICATIONS
> Detalhamento de layout em aberto. Será um módulo próprio na árvore de layout.

Tipos de notificação (todos entregues via Supabase Realtime):
- Deixou de te seguir
- Nova publicação de alguém que você segue
- Novo story
- Nova mensagem
- Menção (@username)

---

## 14. MÓDULO: SETTINGS

### Seções
- **Conta:** alterar nome, username, email, senha, foto, banner, deletar conta, exportar dados
- **Aparência:** Dark / Light / Custom (tema do Marketplace)
- **Privacidade:** visibilidade de perfil, status, atividade
- **Notificações:** toggles por tipo
- **Idioma:** pt-BR / en-US / es-ES
- **Módulos:** ativar/desativar módulos no layout
- **Atalhos:** visualizar e customizar atalhos de teclado

---

## 15. MÓDULO: MUSIC

- Home / Library / Liked / Folders
- Gêneros
- Histórico de tocadas recentes
- Player completo com controles
- Mini player persistido na BottomBar global
- Ao tocar: emitir `music:playing` via events.store → Profile Core atualiza `LISTENING —`


### Flow — Adicionar Músicas (add)

- Entrada: arrastar arquivos locais suportados ou selecionar via file picker (implementação inicial)
- Indexação local: criar biblioteca local (metadados) e refletir estado no store
- Ações no flow:
  - “Adicionar à Biblioteca”
  - “Criar Playlist”
  - “Adicionar à Playlist existente”
- Não travar UI durante scan/index (se necessário: job assíncrono no backend em fase posterior)


---

## 16. MÓDULO: FAVORITE GAMES & APPS

- Grid de capas dos jogos/apps favoritos
- % de uso atual do jogo (via Tauri/Rust)
- Badge "ATIVO" quando o jogo está rodando
- Rust detecta processo ativo → emite `games:detected` via events.store → Profile Core atualiza `PLAYING —`


### Pinning — Drag & Drop

- Usuário pode arrastar atalhos (.lnk) e executáveis (.exe) para dentro do módulo
- Ao soltar, criar item “pinned” com: nome, caminho/localização, ícone/capa (placeholder se não tiver)
- Reordenar por drag dentro do grid
- Persistir em user_settings e sincronizar via Realtime

### Steam — Aceitar Jogos Steam (instalados)

- Importar biblioteca Steam instalada (apenas leitura local)
- Listar jogos Steam instalados como sugestões de “Adicionar aos Favoritos”
- Não depende de API externa na fase inicial
- Metadata avançada (capa/descrição/tags) é fase posterior


---

## 17. MÓDULO: LIVE

- Player com badge "LIVE ON" vermelho
- Contador de viewers em tempo real via Supabase Realtime
- Chat da live em tempo real
- Widget = Picture-in-Picture (só o player, sem chrome)
- Ao assistir: emitir `live:watching` via events.store → Profile Core atualiza `WATCHING —`

---

## 18. MÓDULO: REMOTESHARE

- Controle remoto de outra máquina
- Iniciar sessão direto de uma DM (botão no footer do ChatDM)
- Permissões: Visualizar apenas / Controle total
- Indicador de latência em ms em tempo real
- Ao iniciar: emitir `remoteshare:started` via events.store → BottomBar exibe ícone ativo

---

## 19. MÓDULO: SCREENSHARE

- Compartilhar tela para DM ou grupo
- Preview em tempo real via WebSocket
- Botão de iniciar no footer do ChatDM
- Ao iniciar: emitir `screenshare:started` via events.store → BottomBar exibe ícone ativo

---

## 20. MÓDULO: MOTIONWALLPAPER

- Gerenciador de wallpapers animados (igual Wallpaper Engine)
- Tipos: vídeo, gif, cenas interativas
- Wallpapers da comunidade via Marketplace
- **Integração com Performance Governor:** pausa automaticamente quando jogo está rodando (CPU alto)
- Rust aplica o wallpaper no desktop do Windows

---

## 21. MÓDULO: PERFORMANCE GOVERNOR

- Monitor em tempo real: CPU / GPU / RAM / Rede (via Tauri/Rust)
- Resumo compacto sempre visível na BottomBar
- Módulo completo: gráficos históricos + temperaturas
- Modos: Balanceado / Performance / Economia
- Escuta `games:detected` via events.store → aplica modo Performance automaticamente
- Emite evento quando CPU > threshold → MotionWallpaper pausa

---

## 22. MÓDULO: MARKETPLACE / WORKSHOP

- Loja de wallpapers, temas e widgets da comunidade
- Upload, download, sistema de avaliações (1-5 estrelas)
- Temas do Marketplace são injetados dinamicamente via CSS custom properties
- Arquivos no Cloudflare R2

---

## 23. MÓDULO: PROJECTS

- Kanban: boards, colunas, cards
- Colaboração em tempo real via Supabase Realtime
- Cards podem ser mencionados em mensagens do Chat via deep link

---

## 24. MÓDULO: WELCOME (ONBOARDING)

Tela fullscreen exibida apenas na primeira vez:
1. Setup de perfil: foto, username, bio
2. Escolha de módulos ativos
3. Escolha de wallpaper inicial
4. Tour pelos módulos
5. → Redirecionar para AppLayout principal

---

## 25. BARRA INFERIOR GLOBAL (BOTTOMBAR)

Sempre visível, em todas as telas, fixada na parte inferior do app.

Itens da esquerda para a direita:
- Ícone de configurações rápidas
- Ícone de câmera (ativo quando em chamada)
- Ícone de microfone (ativo quando em chamada)
- Ícone de screenshare (ativo quando compartilhando tela)
- Nome do grupo/tropa conectada
- Velocidade de download / upload (Rust → Tauri command)
- CPU % + GPU % (Rust → Tauri command)
- Mini player de música (nome, artista, controles básicos)
- Indicador de status de presença (clicável para mudar)

---

## 26. STORAGE — HOT vs COLD

### Por que isso existe
Mensagens antigas ocupam espaço desnecessário no Supabase (caro). Mensagens com mais de 30 dias são movidas para o Cloudflare R2 comprimidas com zstd (muito mais barato). A edição de mensagens continua funcionando independente de onde a mensagem está.

### Regra de migração para Cold Storage
Uma mensagem só migra quando TODAS as condições forem verdadeiras:
1. Tem mais de 30 dias desde a criação
2. Não foi editada nos últimos 30 dias
3. Não tem notificação de edição pendente
4. Campo `is_pinned = false`
5. Não aparece em nenhum `message_favorites` ativo

### Hot Storage (Supabase)
- Mensagens editáveis normalmente
- Supabase Realtime funcionando
- Histórico de edições em `message_edits`

### Cold Storage (Cloudflare R2)
- Blocos comprimidos com zstd, um arquivo por conversa por mês
- Formato do path no R2: `cold/dm_{conversation_id}_{YYYY}_{MM}.zst`
- Para editar mensagem fria:
  1. Download do bloco do R2
  2. Descomprime
  3. Edita a mensagem
  4. Recomprime
  5. Faz upload do bloco atualizado
  6. Move a mensagem de volta para o Supabase (hot) com timer reiniciado

### Proteções que mantêm a mensagem no Hot
- `is_pinned = true` → nunca migra enquanto pinada
- Existe em `message_favorites` → nunca migra enquanto favoritada
- `updated_at` nos últimos 30 dias → timer reinicia a cada edição

### Background Job (Rust — roda diariamente via cron do Tauri)
```
1. SELECT mensagens elegíveis (todas as condições acima)
2. Agrupar por conversation_id + mês
3. Para cada grupo: comprimir com zstd, upload para R2
4. UPDATE messages SET cold_ref = 'path/no/r2', content = NULL
5. Log do job executado
```

### Limites
- Sem limite de tamanho de arquivo no R2
- Sem limite de mensagens, posts ou stories por usuário

---

## 27. DESIGN TOKENS

**REGRA PARA A IA:** NUNCA usar valores de cor, tamanho ou radius hardcoded no CSS. Sempre usar as variáveis CSS definidas aqui. Se precisar de um valor não listado, usar derivações das variáveis existentes (ex: `rgba(var(--bg-module-rgb), 0.8)`).

### Arquivo: src/styles/themes/dark.css (tema padrão)
```css
:root[data-theme="dark"] {
  /* Backgrounds */
  --bg-base: #000000;           /* Background global do app */
  --bg-module: #020202;         /* Módulos, menus, botões, inputs */
  --bg-module-rgb: 2, 2, 2;     /* Versão RGB para usar em rgba() */

  /* Typography */
  --color-title: #FFFFFF;       /* Títulos, labels principais */
  --color-subtitle: #7A7A7A;    /* Subtítulos, placeholders, secundários */

  /* Status de presença */
  --status-online: #00FF66;     /* Online */
  --status-away: #FF7F50;       /* Ausente */
  --status-dnd: #C7001B;        /* Não perturbe */
  --status-offline: #7A7A7A;    /* Offline */

  /* Border Radius */
  --radius-module: 20px;        /* Módulos, cards, menus, itens */
  --radius-interactive: 100px;  /* Botões e inputs */
}
```

### Arquivo: src/styles/themes/light.css
```css
:root[data-theme="light"] {
  --bg-base: #F5F5F5;
  --bg-module: #FFFFFF;
  --bg-module-rgb: 255, 255, 255;
  --color-title: #0A0A0A;
  --color-subtitle: #6B6B6B;
  --status-online: #00CC55;
  --status-away: #E8722A;
  --status-dnd: #B00018;
  --status-offline: #9A9A9A;
  --radius-module: 20px;
  --radius-interactive: 100px;
}
```

### Temas do Marketplace
Temas customizados baixados do Marketplace são injetados como uma tag `<style>` no `<head>` com as mesmas variáveis CSS sobrescritas. O seletor usado é `:root[data-theme="custom-{theme-id}"]`.

### Regras absolutas de estilo
- Sem bordas de accent em nenhum elemento
- Sem outline em elementos focados (usar estilo próprio se necessário indicar foco)
- Profundidade visual APENAS pelo contraste entre `--bg-base` e `--bg-module`
- Border radius de módulos: sempre `--radius-module`
- Border radius de botões e inputs: sempre `--radius-interactive`
