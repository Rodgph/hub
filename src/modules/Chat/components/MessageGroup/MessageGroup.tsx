import { MessageBubble } from '../MessageBubble/MessageBubble'
import styles from './MessageGroup.module.css'

interface MessageGroupProps {
  messages: any[]
  currentUserId: string
}

export function MessageGroup({ messages, currentUserId }: MessageGroupProps) {
  return (
    <div className={styles.group}>
      {messages.map((msg, index) => (
        <MessageBubble 
          key={msg.id} 
          message={msg} 
          isMine={msg.sender_id === currentUserId}
          isFirstInGroup={index === 0}
        />
      ))}
    </div>
  )
}
