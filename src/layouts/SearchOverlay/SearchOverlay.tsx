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