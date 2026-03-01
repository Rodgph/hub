# SEARCH_WINDOW_FIX.md — Solução Completa: Janela de Search Global

> **CONTEXTO DO PROBLEMA:** A janela de search abre como aba oculta no Windows e não responde ao atalho global. Isso acontece por 3 razões combinadas:
> 1. Tauri 2 no Windows não aceita `visible: false` + `transparent: true` na config estática — a janela precisa ser **criada em runtime**, não declarada no `tauri.conf.json`
> 2. A janela precisa de `focus()` explícito depois de `show()` no Windows
> 3. O React precisa saber que está rodando na janela `search` para renderizar o componente correto (não o AppLayout inteiro)

---

## PASSO 1 — Remover a janela search do tauri.conf.json

```json
// src-tauri/tauri.conf.json
// REMOVER o objeto da janela "search" do array "windows"
// Deixar APENAS a janela "main"

{
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
      // ← SEM a janela "search" aqui
    ]
  }
}
```

---

## PASSO 2 — Criar a janela search em runtime no Rust

```rust
// src-tauri/src/windows/mod.rs
// A janela search é criada na primeira vez que o atalho é pressionado
// e depois apenas mostrada/escondida

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use window_vibrancy::{apply_mica, apply_acrylic};

pub fn toggle_search_window(app: &AppHandle) {
    // Tenta encontrar a janela search já criada
    if let Some(window) = app.get_webview_window("search") {
        // Janela já existe — apenas mostrar ou esconder
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_search_window(&window);
        }
        return;
    }

    // Janela não existe ainda — criar pela primeira vez
    match create_search_window(app) {
        Ok(window) => show_search_window(&window),
        Err(e) => eprintln!("Erro ao criar janela search: {}", e),
    }
}

fn create_search_window(app: &AppHandle) -> Result<tauri::WebviewWindow, Box<dyn std::error::Error>> {
    // Pegar o monitor onde a janela principal está
    let main_window = app.get_webview_window("main")
        .ok_or("janela main não encontrada")?;

    let monitor = main_window.current_monitor()?
        .ok_or("monitor não encontrado")?;

    let monitor_size = monitor.size();
    let monitor_pos = monitor.position();

    // Calcular posição centralizada no monitor
    let window_width: u32 = 680;
    let window_height: u32 = 500;
    let x = monitor_pos.x + ((monitor_size.width as i32 - window_width as i32) / 2);
    let y = monitor_pos.y + ((monitor_size.height as i32 - window_height as i32) / 3); // 1/3 do topo

    let window = WebviewWindowBuilder::new(
        app,
        "search",
        WebviewUrl::App("search.html".into()), // ← PONTO CHAVE: URL separada
    )
    .title("")
    .inner_size(window_width as f64, window_height as f64)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(true)
    .visible(false) // começa escondida
    .build()?;

    // Aplicar Mica/Acrylic na janela de search
    #[cfg(target_os = "windows")]
    {
        apply_mica(&window, Some(true))
            .unwrap_or_else(|_| {
                let _ = apply_acrylic(&window, Some((0, 0, 0, 180)));
            });
    }

    // Fechar ao perder foco (clicar fora)
    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            let _ = window_clone.hide();
        }
    });

    Ok(window)
}

fn show_search_window(window: &tauri::WebviewWindow) {
    // Sequência EXATA para Windows — cada passo é necessário
    let _ = window.show();

    // No Windows, set_focus() pode falhar na primeira chamada
    // Chamar duas vezes garante que funciona
    let _ = window.set_focus();

    // Emitir evento para o React focar o input
    let _ = window.emit("search:focused", ());
}
```

---

## PASSO 3 — Atualizar shortcuts/mod.rs

```rust
// src-tauri/src/shortcuts/mod.rs

use tauri::{AppHandle};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use crate::windows;

pub fn register_all(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::ALT),
        Code::Space
    );

    app.global_shortcut().register(shortcut, |app, _shortcut, _event| {
        windows::toggle_search_window(app);
    })?;

    Ok(())
}
```

---

## PASSO 4 — Atualizar lib.rs para registrar o módulo windows

```rust
// src-tauri/src/lib.rs

mod commands;
mod shortcuts;
mod tray;
pub mod windows; // ← tornar pub para usar em shortcuts
mod jobs;

// ... resto do lib.rs igual ao SETUP.md
```

---

## PASSO 5 — Criar search.html como entry point separado

O Vite precisa gerar um HTML separado para a janela de search.
Isso é o que resolve o problema de "segunda aba" — cada janela carrega seu próprio HTML.

```ts
// vite.config.ts — ATUALIZAR para build multi-page

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

    // ADICIONADO: build multi-page
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),        // janela principal
        search: resolve(__dirname, 'search.html'),       // janela de search
      },
    },
  },
})
```

---

## PASSO 6 — Criar search.html na raiz do projeto

```html
<!-- search.html — na raiz do projeto, ao lado do index.html -->
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Search</title>
    <!-- Fundo transparente para o Mica aparecer -->
    <style>
      html, body, #root {
        background: transparent !important;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/search-main.tsx"></script>
  </body>
</html>
```

---

## PASSO 7 — Criar src/search-main.tsx (entry point da janela search)

```tsx
// src/search-main.tsx
// Entry point SEPARADO para a janela de search
// NÃO importar AppLayout, stores de chat, etc.
// Apenas o necessário para o search funcionar

import React from 'react'
import ReactDOM from 'react-dom/client'

import './i18n/index'
import './styles/global.module.css'
import './styles/tokens.css'
import './styles/animations.css'

import { SearchApp } from './layouts/SearchOverlay/SearchApp'

// Aplicar tema salvo (lido do localStorage da janela principal via Tauri event)
document.documentElement.setAttribute('data-theme', 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SearchApp />
  </React.StrictMode>
)
```

---

## PASSO 8 — Criar src/layouts/SearchOverlay/SearchApp.tsx

```tsx
// src/layouts/SearchOverlay/SearchApp.tsx
// Componente raiz da janela de search
// Gerencia: foco no input, fechar com Esc, sincronizar tema

import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { GlobalSearch } from '@/components/shared/GlobalSearch/GlobalSearch'
import styles from './SearchApp.module.css'

export function SearchApp() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  // Focar input quando a janela ganhar foco
  useEffect(() => {
    // Escutar evento emitido pelo Rust ao mostrar a janela
    const unlistenFocus = listen('search:focused', () => {
      setQuery('') // limpar query anterior
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50) // pequeno delay para garantir que a janela está visível
    })

    // Fechar com Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        getCurrentWindow().hide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      unlistenFocus.then(fn => fn())
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className={styles.searchApp}>
      <GlobalSearch
        inputRef={inputRef}
        query={query}
        onQueryChange={setQuery}
        onClose={() => getCurrentWindow().hide()}
      />
    </div>
  )
}
```

```css
/* src/layouts/SearchOverlay/SearchApp.module.css */
.searchApp {
  width: 100vw;
  height: 100vh;
  background: transparent;  /* Deixa o Mica aparecer */
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
```

---

## PASSO 9 — Criar GlobalSearch.tsx

```tsx
// src/components/shared/GlobalSearch/GlobalSearch.tsx

import { RefObject } from 'react'
import styles from './GlobalSearch.module.css'

interface GlobalSearchProps {
  inputRef: RefObject<HTMLInputElement>
  query: string
  onQueryChange: (q: string) => void
  onClose: () => void
}

export function GlobalSearch({
  inputRef,
  query,
  onQueryChange,
  onClose
}: GlobalSearchProps) {
  return (
    <div className={styles.container}>
      {/* Input principal */}
      <div className={styles.inputWrapper}>
        <span className={styles.icon}>⌕</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Buscar pessoas, mensagens, músicas..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className={styles.clear} onClick={() => onQueryChange('')}>
            ✕
          </button>
        )}
      </div>

      {/* Resultados aparecem quando há query */}
      {query.length > 0 && (
        <div className={styles.results}>
          {/* SearchResults component aqui */}
          <p style={{ color: 'var(--color-subtitle)', padding: '16px' }}>
            Buscando por "{query}"...
          </p>
        </div>
      )}

      {/* Footer com dica de atalhos */}
      {query.length === 0 && (
        <div className={styles.hints}>
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> fechar</span>
        </div>
      )}
    </div>
  )
}
```

```css
/* src/components/shared/GlobalSearch/GlobalSearch.module.css */

.container {
  width: 100%;
  max-width: 640px;
  background: rgba(var(--bg-module-rgb, 2,2,2), 0.75);
  border-radius: var(--radius-module);
  overflow: hidden;
  /* Sem border — profundidade vem do Mica atrás */
}

.inputWrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  gap: 12px;
}

.icon {
  font-size: 20px;
  color: var(--color-subtitle);
  flex-shrink: 0;
}

.input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--color-title);
  caret-color: var(--color-title);
}

.input::placeholder {
  color: var(--color-subtitle);
}

.clear {
  background: transparent;
  border: none;
  color: var(--color-subtitle);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  border-radius: 50%;
  transition: color var(--duration-instant, 100ms) ease;
}

.clear:hover {
  color: var(--color-title);
}

.results {
  border-top: 1px solid rgba(255,255,255,0.06);
  max-height: 400px;
  overflow-y: auto;
}

.hints {
  display: flex;
  gap: 24px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.hints span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-subtitle);
}

.hints kbd {
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  color: var(--color-subtitle);
}
```

---

## RESUMO — O que cada passo resolve

| Passo | Problema que resolve |
|---|---|
| Remover search do conf | Janela não aparece mais como "segunda aba oculta" |
| Criar janela em runtime | Windows aceita `transparent + always_on_top` só em janelas criadas dinamicamente |
| `search.html` separado | Cada janela carrega seu próprio React — sem conflito de estado |
| `search-main.tsx` separado | Search não carrega stores do Chat, Music, etc. — inicialização rápida |
| `show()` + `set_focus()` duas vezes | Fix do bug do Windows onde foco falha na primeira chamada |
| `on_window_event(Focused(false))` | Fecha ao clicar fora automaticamente |
| Emit `search:focused` do Rust | React sabe exatamente quando focar o input |

---

## ORDEM DE EXECUÇÃO

1. Substituir `tauri.conf.json` (remover janela search)
2. Criar `src-tauri/src/windows/mod.rs`
3. Atualizar `src-tauri/src/lib.rs`
4. Atualizar `src-tauri/src/shortcuts/mod.rs`
5. Atualizar `vite.config.ts`
6. Criar `search.html` na raiz
7. Criar `src/search-main.tsx`
8. Criar `src/layouts/SearchOverlay/SearchApp.tsx`
9. Criar `src/components/shared/GlobalSearch/GlobalSearch.tsx`
10. Rodar `npm run tauri dev` e testar `Ctrl+Alt+Space`
