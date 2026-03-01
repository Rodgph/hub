import React from 'react'
import ReactDOM from 'react-dom/client'

import './i18n/index'
import './styles/global.module.css'
import './styles/tokens.css'
import './styles/animations.css'

import App from './App'
import { SearchOverlay } from './layouts/SearchOverlay/SearchOverlay'

document.documentElement.setAttribute('data-theme', 'dark')

async function main() {
  let windowLabel = 'main'
  try {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    windowLabel = getCurrentWebviewWindow().label
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
      <React.StrictMode><App /></React.StrictMode>
    )
  }
}

main()