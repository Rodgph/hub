# DEPENDENCIES.md — Versões Exatas dos Pacotes

> **ATENÇÃO PARA A IA:** Use EXATAMENTE estas versões. Não atualizar. Não substituir por alternativas. Estas versões foram escolhidas por serem compatíveis entre si. Usar versões diferentes pode quebrar o projeto de formas difíceis de debugar.

---

## package.json — Frontend

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

---

## Cargo.toml — Rust (src-tauri/Cargo.toml)

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
tauri-build = { version = "2.0.3", features = [] }

[dependencies]
tauri = { version = "2.1.1", features = ["tray-icon", "image-png"] }
tauri-plugin-window-state = "2.0.1"
tauri-plugin-global-shortcut = "2.0.1"
tauri-plugin-deep-link = "2.0.0"
window-vibrancy = "0.5.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
zstd = "0.13.0"          # compressão cold storage
sysinfo = "0.30.5"       # leitura de CPU, RAM, processos
tokio = { version = "1", features = ["full"] }   # async runtime

[features]
custom-protocol = ["tauri/custom-protocol"]
```

---

## vite.config.ts

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
  // Tauri precisa de porta fixa
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
  },
  // Tauri usa variáveis de ambiente com prefixo VITE_
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri suporta apenas ES modules
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
```

---

## tsconfig.json

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

## Por que essas versões

| Pacote | Motivo da versão |
|---|---|
| `tauri ^2.1.1` | Tauri 2 estável com suporte a múltiplas janelas e plugins v2 |
| `window-vibrancy 0.5.0` | Compatível com Tauri 2 — versões anteriores são para Tauri 1 |
| `@supabase/supabase-js ^2.39` | Versão com Realtime v2 estável |
| `zustand ^4.5` | Versão com suporte nativo a TypeScript sem boilerplate |
| `react ^18.3` | Hooks estáveis, Concurrent Mode, sem breaking changes do React 19 ainda |
| `i18next ^23` | Versão com React hooks maduros |
| `sysinfo 0.30` | API estável para leitura de processos e hardware |
| `zstd 0.13` | Versão com API síncrona e assíncrona |

---

## Instalação

```bash
# 1. Instalar dependências Node
npm install

# 2. Instalar Rust (se não tiver)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Instalar Tauri CLI
npm install -g @tauri-apps/cli@2.1.0

# 4. Rodar em desenvolvimento
npm run tauri dev
```

---

## PROIBIDO — Nunca instalar estas alternativas

| Proibido | Razão |
|---|---|
| `electron` | Projeto usa Tauri — não misturar |
| `react-dnd` ou `dnd-kit` | Drag implementado do zero (ver SCOPE.md seção 6) |
| `styled-components` ou `@emotion` | Projeto usa CSS Modules |
| `tailwindcss` | Projeto usa CSS Modules |
| `redux` ou `@reduxjs/toolkit` | Projeto usa Zustand |
| `axios` | Usar fetch nativo ou cliente Supabase |
| `react-query` ou `@tanstack/query` | Estado gerenciado pelo Zustand + Supabase Realtime |
| `socket.io` | Real-time via Supabase Realtime |
| `@radix-ui` ou `shadcn` | Componentes construídos do zero |
| `framer-motion` | Animações via CSS (ver ANIMATIONS.md) |
| `react-router-dom` | Navegação via Zustand store (não tem rotas de URL) |
