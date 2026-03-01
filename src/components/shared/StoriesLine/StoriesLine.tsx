import React from 'react';
import { StoryItem } from './StoryItem';

interface StoriesLineProps {
  stories: Array<{
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    hasNewStory: boolean;
  }>;
  currentUserAvatar?: string;
}

/**
 * Linha horizontal de stories com scroll sutil.
 */
export function StoriesLine({ stories, currentUserAvatar }: StoriesLineProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '12px',
      overflowX: 'auto',
      width: '100%',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      alignItems: 'center'
    }}>
      {/* Primeiro item sempre é o do usuário atual */}
      <StoryItem 
        userId="me" 
        username="Você" 
        avatarUrl={currentUserAvatar} 
        isMe={true} 
      />

      {stories.map(story => (
        <StoryItem 
          key={story.id}
          userId={story.userId}
          username={story.username}
          avatarUrl={story.avatarUrl}
          hasNewStory={story.hasNewStory}
        />
      ))}
    </div>
  );
}
