import { useState } from 'react'
import styles from './ChatDM.module.css'

interface ChatDMFooterProps {
  onSendMessage: (content: string) => void
}

export function ChatDMFooter({ onSendMessage }: ChatDMFooterProps) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    onSendMessage(text)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inputContainer}>
        <button className={styles.iconBtn}>😊</button>
        <button className={styles.iconBtn}>📎</button>
        
        <textarea 
          className={styles.input}
          placeholder="Escreva uma mensagem..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {text.trim() ? (
          <button className={styles.sendBtn} onClick={handleSend}>➔</button>
        ) : (
          <button className={styles.sendBtn}>🎙️</button>
        )}
      </div>
    </footer>
  )
}
