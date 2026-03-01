# SETUP.md — Configuração Completa do Projeto

> **ATENÇÃO PARA A IA:** Este arquivo contém os arquivos de configuração COMPLETOS e EXATOS. Não modificar valores sem razão explícita. Não adicionar campos não listados.

---

## .env (variáveis de ambiente — nunca commitar este arquivo)

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_R2_ACCOUNT_ID=seu-account-id
VITE_R2_ACCESS_KEY_ID=sua-access-key
VITE_R2_SECRET_ACCESS_KEY=sua-secret-key
VITE_R2_BUCKET_NAME=social-os-media
VITE_R2_PUBLIC_URL=https://media.seudominio.com
```

## .env.example (versão sem valores — commitar este)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_R2_ACCOUNT_ID=
VITE_R2_ACCESS_KEY_ID=
VITE_R2_SECRET_ACCESS_KEY=
VITE_R2_BUCKET_NAME=
VITE_R2_PUBLIC_URL=
```

---

## src-tauri/tauri.conf.json — COMPLETO

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
      },
      {
        "label": "search",
        "title": "",
        "width": 680,
        "height": 500,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": false,
        "center": true,
        "visible": false,
        "skipTaskbar": true,
        "shadow": true,
}
    ],
    "security": {
      "csp": null
    },
    "trayIcon": {
      "iconPath": "icons/tray.png",
      "title": "SocialOS",
      "tooltip": "SocialOS"
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
  },
  "plugins": {
    "window-state": {
      "stateFlags": 31
    },
    "deep-link": {
      "mobile": [],
      "desktop": ["socialos"]
    },
    "global-shortcut": {}
  }
}
```

---

## src-tauri/src/main.rs — COMPLETO

```rust
// src-tauri/src/main.rs
// Ponto de entrada do processo Tauri
// NÃO adicionar lógica aqui — apenas configuração

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    social_os_lib::run()
}
```

---

## src-tauri/src/lib.rs — COMPLETO

```rust
// src-tauri/src/lib.rs
// Registra todos os plugins, commands e handlers

mod commands;
mod shortcuts;
mod tray;
mod windows;
mod jobs;

use tauri::Manager;
use window_vibrancy::{apply_mica, apply_acrylic};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        // Commands expostos ao frontend
        .invoke_handler(tauri::generate_handler![
            commands::hardware::get_cpu_usage,
            commands::hardware::get_gpu_usage,
            commands::hardware::get_ram_usage,
            commands::hardware::get_network_speed,
            commands::processes::get_active_game,
            commands::processes::get_process_cpu_usage,
            commands::storage::save_offline_queue,
            commands::storage::load_offline_queue,
            commands::wallpaper::set_wallpaper,
            commands::wallpaper::pause_wallpaper,
            commands::wallpaper::resume_wallpaper,
        ])
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();

            // Aplicar efeito Mica no Windows 11
            #[cfg(target_os = "windows")]
            {
                apply_mica(&main_window, Some(true))
                    .unwrap_or_else(|_| {
                        // Fallback para Windows 10: usar Acrylic
                        apply_acrylic(&main_window, Some((0, 0, 0, 120)))
                            .unwrap_or(());
                    });
            }

            // Configurar janela de search com Mica também
            if let Some(search_window) = app.get_webview_window("search") {
                #[cfg(target_os = "windows")]
                {
                    apply_mica(&search_window, Some(true))
                        .unwrap_or_else(|_| {
                            apply_acrylic(&search_window, Some((0, 0, 0, 180)))
                                .unwrap_or(());
                        });
                }
            }

            // Registrar atalhos globais
            shortcuts::register_all(app.handle())?;

            // Configurar tray icon
            tray::setup(app)?;

            // Iniciar background jobs
            let app_handle = app.handle().clone();
            tokio::spawn(async move {
                jobs::cold_storage::start(app_handle).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o app");
}
```

---

## src-tauri/src/shortcuts/mod.rs — COMPLETO

```rust
// src-tauri/src/shortcuts/mod.rs
// Registra TODOS os atalhos globais (funcionam mesmo com app em background)

use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

pub fn register_all(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Ctrl+Alt+Space → mostrar/esconder Global Search
    let shortcut = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::ALT),
        Code::Space
    );

    app.global_shortcut().register(shortcut, |app, _shortcut, _event| {
        if let Some(window) = app.get_webview_window("search") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    })?;

    Ok(())
}
```

---

## src/config/supabase.ts — COMPLETO

```ts
// src/config/supabase.ts
// Instância única do cliente Supabase
// IMPORTAR APENAS DESTE ARQUIVO — nunca criar outro cliente

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase.types' // gerado pelo Supabase CLI

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidos no .env'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,         // Sessão persiste entre reinicializações do app
    autoRefreshToken: true,       // Renova token automaticamente
    detectSessionInUrl: false,    // App desktop não usa URL para auth
  },
  realtime: {
    params: {
      eventsPerSecond: 10,        // Limite de eventos por segundo
    },
  },
})
```

---

## src/config/r2.ts — COMPLETO

```ts
// src/config/r2.ts
// Cliente Cloudflare R2 (compatível com S3)
// Cloudflare R2 não tem SDK próprio — usa AWS SDK S3 com endpoint customizado

// ATENÇÃO: Upload de arquivos grandes deve ser feito via multipart upload
// NÃO usar este cliente para uploads acima de 100MB

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL

// Gera URL pública de um arquivo no R2
// Usar sempre esta função ao montar URLs de mídia
export function getR2Url(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path  // já é URL completa
  return `${R2_PUBLIC_URL}/${path}`
}

// Upload via fetch para endpoint R2
export async function uploadToR2(
  path: string,
  file: File | Blob,
  contentType: string
): Promise<string> {
  // Upload via Supabase Storage como proxy para R2
  // ou via presigned URL gerada pelo backend
  // Implementar conforme estratégia de auth escolhida
  throw new Error('Implementar upload para R2')
}
```

---

## src/config/constants.ts — COMPLETO

```ts
// src/config/constants.ts
// Constantes globais do app
// Qualquer valor "mágico" no código deve vir daqui

// Storage
export const COLD_STORAGE_DAYS = 30          // Dias antes de migrar para cold storage
export const MAX_MESSAGES_CACHE = 100        // Máx mensagens em cache local por conversa
export const MAX_FEED_CACHE = 50             // Máx posts em cache local

// Retry
export const MAX_RETRY_COUNT = 3             // Tentativas máximas na fila offline
export const QUEUE_EXPIRY_HOURS = 24         // Horas até ação expirar na fila

// UI
export const DRAG_THRESHOLD_PX = 8           // Pixels de movimento para ativar drag
export const DRAG_HANDLE_HEIGHT_DEFAULT = 5  // px — altura padrão do handle
export const DRAG_HANDLE_HEIGHT_REVEALED = 20 // px — altura ao revelar
export const DRAG_HANDLE_CONTENT_SHIFT = 15  // px — translateY do conteúdo

// Hardware polling
export const HARDWARE_POLL_INTERVAL_MS = 2000 // Intervalo de leitura de CPU/GPU/RAM

// Toast
export const TOAST_DURATION_SHORT = 3000     // ms — success, info
export const TOAST_DURATION_LONG = 5000      // ms — error, warning
export const TOAST_MAX_VISIBLE = 3           // Máx toasts simultâneos

// Stories
export const STORY_EXPIRY_HOURS = 24         // Horas até story expirar
export const STORY_DEFAULT_DURATION_MS = 5000 // Duração padrão por story

// Layout
export const LAYOUT_MIN_RATIO = 0.15         // Ratio mínimo de split (15%)
export const LAYOUT_MAX_RATIO = 0.85         // Ratio máximo de split (85%)

// Presença
export const PRESENCE_AWAY_AFTER_MS = 5 * 60 * 1000  // 5 min sem interação → Away

// Módulos — tamanhos mínimos
export const MODULE_MIN_SIZES: Record<string, { width: number; height: number }> = {
  Chat:                { width: 400, height: 0 },
  Feed:                { width: 400, height: 0 },
  Music:               { width: 400, height: 0 },
  Live:                { width: 400, height: 0 },
  Videos:              { width: 400, height: 0 },
  Films:               { width: 400, height: 0 },
  Browser:             { width: 400, height: 0 },
  FavoriteGames:       { width: 0,   height: 375 },
  RemoteShare:         { width: 400, height: 0 },
  ScreenShare:         { width: 400, height: 0 },
  MotionWallpaper:     { width: 400, height: 0 },
  PerformanceGovernor: { width: 400, height: 0 },
  Marketplace:         { width: 400, height: 0 },
  Projects:            { width: 400, height: 0 },
  Settings:            { width: 400, height: 0 },
  Notifications:       { width: 400, height: 0 },
}
```

---

## .gitignore

```
# Dependências
node_modules/
target/

# Ambiente
.env
.env.local

# Build
dist/
dist-ssr/

# Tauri
src-tauri/target/
src-tauri/gen/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Cache local do app (gerado em runtime)
*.cache.json
```
