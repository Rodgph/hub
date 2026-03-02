import { useEffect, useRef } from 'react'
import { MessageGroup } from '../../components/MessageGroup/MessageGroup'
import styles from './ChatDM.module.css'

interface ChatDMSectionProps {
  messages: any[]
  currentUserId: string
}

export function ChatDMSection({ messages, currentUserId }: ChatDMSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Agrupar mensagens sequenciais do mesmo autor
  const groupedMessages = messages.reduce((groups, msg, index) => {
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup[0].sender_id === msg.sender_id) {
      lastGroup.push(msg)
    } else {
      groups.push([msg])
    }
    return groups
  }, [] as any[][])

  return (
    <div className={styles.section} ref={scrollRef}>
      {groupedMessages.map((group, index) => (
        <MessageGroup 
          key={index} 
          messages={group} 
          currentUserId={currentUserId} 
        />
      ))}
    </div>
  )
}
