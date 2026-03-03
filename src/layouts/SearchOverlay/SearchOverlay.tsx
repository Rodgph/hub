import { useEffect, useRef } from 'react'
import { GlobalSearch } from '@/components/shared/GlobalSearch/GlobalSearch'
import { useSearchStore } from '@/store/search.store'
import styles from './SearchOverlay.module.css'

export function SearchOverlay() {
  const inputRef = useRef<HTMLInputElement>(null)
  const clearSearch = useSearchStore(state => state.clearSearch)

  useEffect(() => {
    let unlistenEvent: (() => void) | null = null
    let unlistenFocus: (() => void) | null = null

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
        
        const appWindow = getCurrentWebviewWindow()

        const doFocus = () => {
          if (inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
          }
        }

        // 1. Escuta o evento customizado do Rust (emitido no toggle)
        unlistenEvent = await listen('search:focused', () => {
          clearSearch()
          setTimeout(doFocus, 10)
          setTimeout(doFocus, 150) // Backup robusto
        })

        // 2. Escuta o foco da janela (garante foco se o usuário clicar na barra de tarefas)
        unlistenFocus = await appWindow.onFocusChanged(({ payload: focused }) => {
          if (focused) {
            setTimeout(doFocus, 50)
          }
        })

      } catch (e) {
        console.warn('[SearchOverlay] Ambiente fora do Tauri ou erro nos listeners:', e)
      }
    }

    setup()
    return () => { 
      if (unlistenEvent) unlistenEvent()
      if (unlistenFocus) unlistenFocus()
    }
  }, [clearSearch])

  return (
    <div className={styles.overlay} onMouseDown={() => setTimeout(() => inputRef.current?.focus(), 10)}>
      <GlobalSearch inputRef={inputRef} />
    </div>
  )
}
