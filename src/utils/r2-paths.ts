type R2PathContext =
  | { type: 'avatar-main';    userId: string }
  | { type: 'avatar-slide';   userId: string; index: number }
  | { type: 'avatar-alt';     userId: string }
  | { type: 'banner';         userId: string; ext: 'webp' | 'mp4' | 'gif' }
  | { type: 'story';          userId: string; storyId: string; ext: 'webp' | 'mp4' | 'gif' }
  | { type: 'post-media';     userId: string; postId: string; index: number; ext: 'webp' | 'mp4' | 'gif' }
  | { type: 'message-media';  conversationId: string; messageId: string; index: number; ext: 'webp' | 'mp4' | 'ogg' }
  | { type: 'cold-storage';   conversationId: string; yearMonth: string }  // yearMonth: '2024-01'
  | { type: 'wallpaper-preview'; assetId: string }
  | { type: 'wallpaper-file'; assetId: string; ext: 'mp4' | 'gif' | 'webp' }
  | { type: 'theme-preview';  assetId: string }
  | { type: 'theme-css';      assetId: string }
  | { type: 'marketplace-asset'; assetId: string; ext: string }

/**
 * Constrói o path relativo para o R2 baseado no contexto.
 * Garante que todos os arquivos sigam a mesma convenção.
 */
export function buildR2Path(ctx: R2PathContext): string {
  // Limpar UUIDs (remover hífens conforme convenção R2_STRUCTURE.md)
  const cleanId = (id: string) => id.replace(/-/g, '');

  switch (ctx.type) {
    case 'avatar-main':
      return `avatars/${cleanId(ctx.userId)}/main.webp`

    case 'avatar-slide':
      return `avatars/${cleanId(ctx.userId)}/slide-${ctx.index}.webp`

    case 'avatar-alt':
      return `avatars/${cleanId(ctx.userId)}/alt.webp`

    case 'banner':
      return `banners/${cleanId(ctx.userId)}/banner.${ctx.ext}`

    case 'story':
      return `stories/${cleanId(ctx.userId)}/${cleanId(ctx.storyId)}.${ctx.ext}`

    case 'post-media':
      return `posts/${cleanId(ctx.userId)}/${cleanId(ctx.postId)}/media-${ctx.index}.${ctx.ext}`

    case 'message-media':
      return `messages/${cleanId(ctx.conversationId)}/${cleanId(ctx.messageId)}/media-${ctx.index}.${ctx.ext}`

    case 'cold-storage':
      return `cold/${cleanId(ctx.conversationId)}/${ctx.yearMonth}.zst`

    case 'wallpaper-preview':
      return `wallpapers/${cleanId(ctx.assetId)}/preview.webp`

    case 'wallpaper-file':
      return `wallpapers/${cleanId(ctx.assetId)}/wallpaper.${ctx.ext}`

    case 'theme-preview':
      return `themes/${cleanId(ctx.assetId)}/preview.webp`

    case 'theme-css':
      return `themes/${cleanId(ctx.assetId)}/theme.css`

    case 'marketplace-asset':
      return `marketplace/${cleanId(ctx.assetId)}/asset.${ctx.ext}`
  }
}
