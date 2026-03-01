# PHASE_0_FINAL.md — Fase 0 à Prova de Erros

> Baseado nos erros reais que aconteceram na execução anterior. Cada aviso abaixo
> é baseado em uma falha real documentada no log.

---

## OS 4 ERROS QUE ACONTECERAM — leia antes de começar

### ERRO 1 — tokens.css com conteúdo antes do @import
**Sintoma:** `[vite:css] @import must precede all other statements`  
**Causa:** AI colocou variáveis CSS antes do `@import` no tokens.css  
**Fix:** tokens.css deve ter EXATAMENTE 1 linha. Só o @import. Nada mais.

### ERRO 2 — dark.css corrompido pela ferramenta de patch
**Sintoma:** `Unclosed string` em dark.css linha 16  
**Causa:** A ferramenta de patch do Windsurf appenda texto como `*** End Patch***` após o `}` final  
**Fix:** Nunca usar patch parcial em arquivos CSS. Sempre deletar e recriar o arquivo inteiro.

### ERRO 3 — capabilities com `opener:default` inexistente
**Sintoma:** `Permission opener:default not found`  
**Causa:** AI adicionou `opener:default` que não existe no Tauri 2  
**Fix:** Usar APENAS as permissões listadas neste documento. Zero adições.

### ERRO 4 — tauri.conf.json com formatos errados
**Sintoma 4a:** `invalid type: map, expected unit` → `window-state` estava como objeto `{stateFlags: 31}`  
**Sintoma 4b:** `data did not match any variant of untagged enum DesktopProtocol` → `deep-link.desktop` era `["socialos"]` em vez de `{"schemes": ["socialos"]}`  
**Fix:** Copiar o tauri.conf.json EXATO deste documento. Sem alterar nenhum valor.

---

## REGRAS ABSOLUTAS

1. Cada passo cria/substitui **um único arquivo**
2. Copiar o conteúdo **exatamente** — sem adicionar comentários, sem remover linhas
3. CSS files: **nunca usar patch parcial** — sempre deletar e recriar completo
4. Após cada arquivo criado, rodar a **verificação indicada**
5. **Não avançar** se a verificação falhou

---

## PASSO 1 — Scaffold

```bash
cd D:\hub
npm create tauri-app@latest social-os -- --template react-ts
```

Quando pedir `Identifier`: digitar `com.socialos.app`  
Tudo mais: pressionar Enter (aceitar padrão)

**Verificação:**
```bash
dir D:\hub\social-os\src-tauri\tauri.conf.json
```
Deve listar o arquivo. Se não existir, o scaffold falhou — repetir.

---

## PASSO 2 — Instalar pacotes

```bash
cd D:\hub\social-os
npm install zustand@4.5.0 i18next@23.7.16 react-i18next@14.0.5 @supabase/supabase-js@2.39.3 @tauri-apps/plugin-global-shortcut@2.0.1 @tauri-apps/plugin-window-state@2.0.1 @tauri-apps/plugin-deep-link@2.0.0
```

**Verificação:**
```bash
findstr "zustand" D:\hub\social-os\package.json
```
Deve mostrar `"zustand": "4.5.0"`.

---

## PASSO 3 — package.json

Deletar o arquivo existente. Criar `D:\hub\social-os\package.json`.  
Conteúdo exato:

```json
{
  "name": "social-os",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri": "tauri"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.3",
    "@tauri-apps/api": "^2.1.1",
    "@tauri-apps/plugin-deep-link": "^2.0.0",
    "@tauri-apps/plugin-global-shortcut": "^2.0.1",
    "@tauri-apps/plugin-window-state": "^2.0.1",
    "i18next": "^23.7.16",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^14.0.5",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.1.0",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
```

```bash
cd D:\hub\social-os && npm install
```

---

## PASSO 4 — vite.config.ts

Deletar o arquivo existente. Criar `D:\hub\social-os\vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
```

---

## PASSO 5 — tsconfig.json

Deletar o arquivo existente. Criar `D:\hub\social-os\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## PASSO 6 — Criar pastas

```bash
mkdir D:\hub\social-os\src\styles\themes
mkdir D:\hub\social-os\src\i18n\locales
mkdir D:\hub\social-os\src\config
mkdir D:\hub\social-os\src\layouts\BottomBar
mkdir D:\hub\social-os\src\layouts\SearchOverlay
mkdir D:\hub\social-os\src\components\shared\GlobalSearch
mkdir D:\hub\social-os\src-tauri\capabilities
```

**Verificação:**
```bash
dir D:\hub\social-os\src\styles\themes
dir D:\hub\social-os\src-tauri\capabilities
```
Ambas as pastas devem existir.

---

## PASSO 7 — dark.css

> ⚠️ ATENÇÃO ESPECIAL — ERRO 2 ACONTECEU AQUI  
> Se usar patch parcial, a ferramenta vai appender lixo após o `}` quebrando o CSS.  
> **OBRIGATÓRIO:** Deletar qualquer dark.css existente. Criar o arquivo do zero.  
> O arquivo deve terminar exatamente no `}` da última linha. Nada depois.

Criar `D:\hub\social-os\src\styles\themes\dark.css`:

```css
:root[data-theme="dark"] {
  --bg-base: #000000;
  --bg-module: #020202;
  --bg-module-rgb: 2, 2, 2;
  --color-title: #FFFFFF;
  --color-subtitle: #7A7A7A;
  --status-online: #00FF66;
  --status-away: #FF7F50;
  --status-dnd: #C7001B;
  --status-offline: #7A7A7A;
  --radius-module: 20px;
  --radius-interactive: 100px;
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-skeleton: 1500ms;
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Verificação — rodar e inspecionar visualmente:**
```bash
type D:\hub\social-os\src\styles\themes\dark.css
```
A última linha visível deve ser `}`. Se aparecer qualquer texto depois (especialmente `*** End Patch***` ou `Function Execution`), o arquivo está corrompido. Deletar e recriar.

---

## PASSO 8 — light.css

Criar `D:\hub\social-os\src\styles\themes\light.css`:

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
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-skeleton: 1500ms;
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Verificação:**
```bash
type D:\hub\social-os\src\styles\themes\light.css
```
Última linha visível: `}`. Nada depois.

---

## PASSO 9 — tokens.css

> ⚠️ ATENÇÃO ESPECIAL — ERRO 1 ACONTECEU AQUI  
> Este arquivo deve ter EXATAMENTE 1 LINHA.  
> Apenas o `@import`. Sem variáveis. Sem comentários. Sem linhas em branco extras.  
> O erro `@import must precede all other statements` acontece quando tem qualquer  
> coisa antes do @import — incluindo linhas em branco no início do arquivo.

Criar `D:\hub\social-os\src\styles\tokens.css`:

```css
@import './themes/dark.css';
```

**Verificação:**
```bash
type D:\hub\social-os\src\styles\tokens.css
```
Deve mostrar APENAS a linha: `@import './themes/dark.css';`  
Se mostrar mais alguma coisa, deletar e recriar.

---

## PASSO 10 — global.module.css

Criar `D:\hub\social-os\src\styles\global.module.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--color-title);
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## PASSO 11 — animations.css

Criar `D:\hub\social-os\src\styles\animations.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

---

## PASSO 12 — VERIFICAÇÃO CSS ← não pular

```bash
cd D:\hub\social-os && npm run build
```

**Esperado:** `✓ built in X.XXs`

**Se aparecer `@import must precede`:** tokens.css tem conteúdo antes do import → deletar e recriar o passo 9.  
**Se aparecer `Unclosed string` em dark.css:** dark.css tem lixo após o `}` → deletar e recriar o passo 7.  
**Qualquer outro erro de CSS:** identificar o arquivo no erro → deletar e recriar aquele arquivo.

**Não avançar se o build falhar.**

---

## PASSO 13 — .env

Criar `D:\hub\social-os\.env`:

```
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key
VITE_R2_PUBLIC_URL=https://placeholder.r2.dev
```

---

## PASSO 14 — constants.ts

Criar `D:\hub\social-os\src\config\constants.ts`:

```ts
export const DRAG_THRESHOLD_PX = 8
export const DRAG_HANDLE_HEIGHT_DEFAULT = 5
export const DRAG_HANDLE_HEIGHT_REVEALED = 20
export const DRAG_HANDLE_CONTENT_SHIFT = 15
export const HARDWARE_POLL_INTERVAL_MS = 2000
export const TOAST_DURATION_SHORT = 3000
export const TOAST_DURATION_LONG = 5000
export const TOAST_MAX_VISIBLE = 3
export const STORY_EXPIRY_HOURS = 24
export const STORY_DEFAULT_DURATION_MS = 5000
export const LAYOUT_MIN_RATIO = 0.15
export const LAYOUT_MAX_RATIO = 0.85
export const PRESENCE_AWAY_AFTER_MS = 5 * 60 * 1000
export const COLD_STORAGE_DAYS = 30
export const MAX_MESSAGES_CACHE = 100
export const MAX_FEED_CACHE = 50
export const MAX_RETRY_COUNT = 3
export const QUEUE_EXPIRY_HOURS = 24
```

---

## PASSO 15 — supabase.ts

Criar `D:\hub\social-os\src\config\supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder'

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
```

---

## PASSO 16 — i18n locales (3 arquivos)

Criar `D:\hub\social-os\src\i18n\locales\pt-BR.json`:

```json
{
  "search": {
    "placeholder": "Buscar pessoas, mensagens, músicas...",
    "navigate": "navegar",
    "open": "abrir",
    "close": "fechar"
  },
  "common": {
    "loading": "Carregando...",
    "error": "Algo deu errado. Tente novamente.",
    "retry": "Tentar novamente"
  }
}
```

Criar `D:\hub\social-os\src\i18n\locales\en-US.json`:

```json
{
  "search": {
    "placeholder": "Search people, messages, music...",
    "navigate": "navigate",
    "open": "open",
    "close": "close"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong. Try again.",
    "retry": "Try again"
  }
}
```

Criar `D:\hub\social-os\src\i18n\locales\es-ES.json`:

```json
{
  "search": {
    "placeholder": "Buscar personas, mensajes, música...",
    "navigate": "navegar",
    "open": "abrir",
    "close": "cerrar"
  },
  "common": {
    "loading": "Cargando...",
    "error": "Algo salió mal. Inténtalo de nuevo.",
    "retry": "Intentar de nuevo"
  }
}
```

---

## PASSO 17 — i18n/index.ts

Criar `D:\hub\social-os\src\i18n\index.ts`:

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from './locales/pt-BR.json'
import enUS from './locales/en-US.json'
import esES from './locales/es-ES.json'

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
    'es-ES': { translation: esES },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
})

export default i18n
```

---

## PASSO 18 — BottomBar.tsx

Criar `D:\hub\social-os\src\layouts\BottomBar\BottomBar.tsx`:

```tsx
export function BottomBar() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: 'rgba(2, 2, 2, 0.95)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 1000,
      }}
    />
  )
}
```

---

## PASSO 19 — AppLayout.tsx

Criar `D:\hub\social-os\src\layouts\AppLayout.tsx`:

```tsx
import { BottomBar } from './BottomBar/BottomBar'

export function AppLayout() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-base, #000000)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <main style={{ flex: 1, overflow: 'hidden' }} />
      <BottomBar />
    </div>
  )
}
```

---

## PASSO 20 — GlobalSearch.module.css

Criar `D:\hub\social-os\src\components\shared\GlobalSearch\GlobalSearch.module.css`:

```css
.container {
  width: 640px;
  background: rgba(2, 2, 2, 0.88);
  border-radius: 20px;
  overflow: hidden;
}

.inputWrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  gap: 12px;
}

.icon {
  font-size: 22px;
  color: var(--color-subtitle, #7A7A7A);
  flex-shrink: 0;
}

.input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--color-title, #ffffff);
  caret-color: var(--color-title, #ffffff);
}

.input::placeholder {
  color: var(--color-subtitle, #7A7A7A);
}

.clear {
  background: transparent;
  border: none;
  color: var(--color-subtitle, #7A7A7A);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  line-height: 1;
}

.clear:hover {
  color: var(--color-title, #ffffff);
}

.results {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  max-height: 380px;
  overflow-y: auto;
}

.resultsPlaceholder {
  padding: 16px;
  color: var(--color-subtitle, #7A7A7A);
  font-size: 14px;
}

.hints {
  display: flex;
  gap: 20px;
  padding: 10px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.hints span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-subtitle, #7A7A7A);
}

.hints kbd {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  border: none;
  color: var(--color-subtitle, #7A7A7A);
}
```

---

## PASSO 21 — GlobalSearch.tsx

Criar `D:\hub\social-os\src\components\shared\GlobalSearch\GlobalSearch.tsx`:

```tsx
import { RefObject, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import styles from './GlobalSearch.module.css'

interface GlobalSearchProps {
  inputRef: RefObject<HTMLInputElement>
}

export function GlobalSearch({ inputRef }: GlobalSearchProps) {
  const [query, setQuery] = useState('')

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('')
      try {
        await getCurrentWindow().hide()
      } catch {
        // fora do Tauri (browser dev) — ignorar
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <span className={styles.icon}>⌕</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Buscar pessoas, mensagens, músicas..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className={styles.clear} onClick={() => setQuery('')}>
            ✕
          </button>
        )}
      </div>

      {query.length > 0 && (
        <div className={styles.results}>
          <p className={styles.resultsPlaceholder}>
            Buscando por "{query}"…
          </p>
        </div>
      )}

      <div className={styles.hints}>
        <span><kbd>↑↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Esc</kbd> fechar</span>
      </div>
    </div>
  )
}
```

---

## PASSO 22 — SearchOverlay.module.css

Criar `D:\hub\social-os\src\layouts\SearchOverlay\SearchOverlay.module.css`:

```css
.overlay {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
  box-sizing: border-box;
  background: transparent;
}
```

---

## PASSO 23 — SearchOverlay.tsx

Criar `D:\hub\social-os\src\layouts\SearchOverlay\SearchOverlay.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { GlobalSearch } from '@/components/shared/GlobalSearch/GlobalSearch'
import styles from './SearchOverlay.module.css'

export function SearchOverlay() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen('search:focused', () => {
          setTimeout(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
          }, 50)
        })
      } catch {
        // fora do Tauri — ignorar
      }
    }

    setup()
    return () => { if (unlisten) unlisten() }
  }, [])

  return (
    <div className={styles.overlay}>
      <GlobalSearch inputRef={inputRef} />
    </div>
  )
}
```

---

## PASSO 24 — App.tsx

Deletar o arquivo existente. Criar `D:\hub\social-os\src\App.tsx`:

```tsx
// Placeholder — auth implementada na Fase 4
export default function App() {
  return null
}
```

---

## PASSO 25 — main.tsx

Deletar o arquivo existente. Criar `D:\hub\social-os\src\main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import './i18n/index'
import './styles/global.module.css'
import './styles/tokens.css'
import './styles/animations.css'

import { AppLayout } from './layouts/AppLayout'
import { SearchOverlay } from './layouts/SearchOverlay/SearchOverlay'

document.documentElement.setAttribute('data-theme', 'dark')

async function main() {
  let windowLabel = 'main'
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    windowLabel = (await getCurrentWindow()).label
  } catch {
    windowLabel = 'main'
  }

  const root = document.getElementById('root')!

  if (windowLabel === 'search') {
    ReactDOM.createRoot(root).render(
      <React.StrictMode><SearchOverlay /></React.StrictMode>
    )
  } else {
    ReactDOM.createRoot(root).render(
      <React.StrictMode><AppLayout /></React.StrictMode>
    )
  }
}

main()
```

---

## PASSO 26 — VERIFICAÇÃO FRONTEND ← não pular

```bash
cd D:\hub\social-os && npm run build
```

**Esperado:** `✓ built in X.XXs`  
**Não avançar para o BLOCO RUST se falhar.**

---

## PASSO 27 — Cargo.toml

> ⚠️ Deletar o arquivo existente. Criar do zero. Não fazer merge.

Criar `D:\hub\social-os\src-tauri\Cargo.toml`:

```toml
[package]
name = "social-os"
version = "0.1.0"
description = "Social OS Desktop App"
authors = ["you"]
edition = "2021"

[lib]
name = "social_os_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.1", features = ["tray-icon"] }
tauri-plugin-window-state = "2.0"
tauri-plugin-global-shortcut = "2.0"
tauri-plugin-deep-link = "2.0"
window-vibrancy = "0.5"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sysinfo = "0.30"
tokio = { version = "1", features = ["full"] }
```

---

## PASSO 28 — tauri.conf.json

> ⚠️ ATENÇÃO ESPECIAL — ERROS 3 E 4 ACONTECERAM AQUI  
>
> **REGRA 1:** `window-state` deve ser `null` — não um objeto, não `{}`, não `{stateFlags: 31}`  
> **REGRA 2:** `global-shortcut` deve ser `null`  
> **REGRA 3:** `deep-link.desktop` deve ser `{"schemes": ["socialos"]}` — não `["socialos"]`  
> **REGRA 4:** A janela `search` NÃO existe aqui — é criada em runtime no Rust  
>
> Deletar o arquivo existente. Criar do zero com o conteúdo EXATO abaixo:

Criar `D:\hub\social-os\src-tauri\tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "SocialOS",
  "version": "0.1.0",
  "identifier": "com.socialos.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "SocialOS",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "shadow": true,
        "center": true,
        "visible": true,
        "skipTaskbar": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "plugins": {
    "window-state": null,
    "global-shortcut": null,
    "deep-link": {
      "desktop": {
        "schemes": ["socialos"]
      }
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Verificação — conferir os 3 valores críticos:**
```bash
findstr "window-state" D:\hub\social-os\src-tauri\tauri.conf.json
findstr "schemes" D:\hub\social-os\src-tauri\tauri.conf.json
```
Linha 1 deve mostrar: `"window-state": null,`  
Linha 2 deve mostrar: `"schemes": ["socialos"]`

---

## PASSO 29 — capabilities/default.json

> ⚠️ ATENÇÃO ESPECIAL — ERRO 3 ACONTECEU AQUI  
>
> A lista abaixo contém APENAS permissões que existem no Tauri 2.  
> `opener:default` NÃO existe — remover se aparecer.  
> Não adicionar nenhuma permissão que não esteja nesta lista.  
> Não remover nenhuma permissão desta lista.

Criar `D:\hub\social-os\src-tauri\capabilities\default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Permissoes padrao para janelas main e search",
  "windows": ["main", "search"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:window:default",
    "core:window:allow-hide",
    "core:window:allow-show",
    "core:window:allow-set-focus",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-position",
    "core:window:allow-inner-size",
    "core:window:allow-current-monitor",
    "core:window:allow-available-monitors",
    "core:window:allow-is-visible",
    "core:window:allow-is-minimized",
    "core:window:allow-unminimize",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered",
    "window-state:default",
    "deep-link:default",
    "deep-link:allow-get-current"
  ]
}
```

---

## PASSO 30 — main.rs

> Este arquivo cria a janela `search` em runtime — não no tauri.conf.json.  
> Isso resolve o bug do Windows com `transparent + always_on_top` em janelas estáticas.

Deletar o arquivo existente. Criar `D:\hub\social-os\src-tauri\src\main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use window_vibrancy::{apply_acrylic, apply_mica};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            {
                if apply_mica(&main_window, Some(true)).is_err() {
                    let _ = apply_acrylic(&main_window, Some((0, 0, 0, 120)));
                }
            }

            create_search_window(app.handle())?;

            let handle = app.handle().clone();
            app.global_shortcut().register(
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space),
                move |_app, _shortcut, _event| {
                    toggle_search(&handle);
                },
            )?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o app");
}

fn create_search_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let main_win = app
        .get_webview_window("main")
        .ok_or("janela main nao encontrada")?;

    let monitor = main_win
        .current_monitor()?
        .ok_or("monitor nao encontrado")?;

    let screen_size = monitor.size();
    let screen_pos = monitor.position();

    let win_w: i32 = 680;
    let win_h: i32 = 500;

    let x = screen_pos.x + (screen_size.width as i32 - win_w) / 2;
    let y = screen_pos.y + 20;

    let search_win = WebviewWindowBuilder::new(
        app,
        "search",
        WebviewUrl::App("index.html".into()),
    )
    .title("")
    .inner_size(win_w as f64, win_h as f64)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(true)
    .visible(false)
    .build()?;

    #[cfg(target_os = "windows")]
    {
        if apply_mica(&search_win, Some(true)).is_err() {
            let _ = apply_acrylic(&search_win, Some((0, 0, 0, 200)));
        }
    }

    let win_clone = search_win.clone();
    search_win.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            let _ = win_clone.hide();
        }
    });

    Ok(())
}

fn toggle_search(app: &AppHandle) {
    let Some(win) = app.get_webview_window("search") else {
        return;
    };

    if win.is_visible().unwrap_or(false) {
        let _ = win.hide();
    } else {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        let _ = win.set_focus(); // intencional: fix bug Windows
        let _ = win.emit("search:focused", ());
    }
}
```

---

## PASSO 31 — VERIFICAÇÃO RUST ← não pular

```bash
cd D:\hub\social-os\src-tauri && cargo check 2>&1
```

**Esperado:** `Finished checking` sem nenhuma linha começando com `error[`

**Erros conhecidos e solução:**

| Erro | Causa | Solução |
|---|---|---|
| `Permission opener:default not found` | capabilities tem permissão inválida | Verificar passo 29 — remover `opener:default` se existir |
| `invalid type: map, expected unit` | `window-state` está como objeto | Verificar passo 28 — deve ser `null` |
| `data did not match any variant of untagged enum` | deep-link formato errado | Verificar passo 28 — `desktop` deve ser `{"schemes": [...]}` |
| `unresolved import tauri_plugin_global_shortcut` | crate não baixou | Rodar `cargo update` |

**Não avançar para o passo 32 se houver erros.**

---

## PASSO 32 — Rodar o app

Se a porta 1420 estiver em uso:
```bash
npx kill-port 1420
```

Rodar o app:
```bash
cd D:\hub\social-os && npm run tauri dev
```

**Teste manual — confirmar todos os itens:**

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | App abre | Janela principal com fundo Mica/transparente |
| 2 | `Ctrl+Alt+Space` | Janela de search aparece centralizada no topo |
| 3 | Digitar qualquer texto | Texto aparece no input |
| 4 | `Esc` | Janela de search some |
| 5 | `Ctrl+Alt+Space` de novo | Janela de search aparece novamente |
| 6 | Clicar fora da janela search | Janela some automaticamente |

**Se `Ctrl+Alt+Space` não funcionar:**
- Fechar PowerToys ou qualquer app que use o mesmo atalho
- Verificar no terminal se aparece erro de registro do shortcut
- O atalho funciona mesmo sem foco no app

---

## CHECKLIST COMPLETO

```
[ ] Passo 1  — Scaffold
[ ] Passo 2  — npm install pacotes
[ ] Passo 3  — package.json + npm install
[ ] Passo 4  — vite.config.ts
[ ] Passo 5  — tsconfig.json
[ ] Passo 6  — Criar pastas
[ ] Passo 7  — dark.css         ← verificar que termina em }
[ ] Passo 8  — light.css
[ ] Passo 9  — tokens.css       ← APENAS 1 linha
[ ] Passo 10 — global.module.css
[ ] Passo 11 — animations.css
[ ] Passo 12 — npm run build ✓  ← não avançar se falhar
[ ] Passo 13 — .env
[ ] Passo 14 — constants.ts
[ ] Passo 15 — supabase.ts
[ ] Passo 16 — 3 arquivos JSON de locale
[ ] Passo 17 — i18n/index.ts
[ ] Passo 18 — BottomBar.tsx
[ ] Passo 19 — AppLayout.tsx
[ ] Passo 20 — GlobalSearch.module.css
[ ] Passo 21 — GlobalSearch.tsx
[ ] Passo 22 — SearchOverlay.module.css
[ ] Passo 23 — SearchOverlay.tsx
[ ] Passo 24 — App.tsx
[ ] Passo 25 — main.tsx
[ ] Passo 26 — npm run build ✓  ← não avançar se falhar
[ ] Passo 27 — Cargo.toml
[ ] Passo 28 — tauri.conf.json  ← window-state: null, deep-link com schemes
[ ] Passo 29 — capabilities/default.json ← sem opener:default
[ ] Passo 30 — main.rs
[ ] Passo 31 — cargo check ✓   ← não avançar se houver erros
[ ] Passo 32 — npm run tauri dev + testar Ctrl+Alt+Space ✓
```
