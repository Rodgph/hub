# R2_STRUCTURE.md — Estrutura de Paths no Cloudflare R2

> **ATENÇÃO PARA A IA:** Todo arquivo enviado ao R2 DEVE seguir exatamente os paths definidos aqui. Não inventar paths. Não usar nomes diferentes. Usar SEMPRE a função `buildR2Path()` definida no final deste documento para gerar paths — nunca construir strings de path manualmente.

---

## CONVENÇÕES GERAIS

- Todos os IDs usados nos paths são UUIDs sem hífens: `550e8400e29b41d4a716446655440000`
- Nomes de arquivo em minúsculas com hífens: `profile-photo.webp`
- Datas em formato `YYYY-MM`: `2024-01`
- Extensões sempre explícitas
- Nunca usar espaços ou caracteres especiais nos paths
- Imagens sempre convertidas para `.webp` antes de fazer upload
- Vídeos sempre em `.mp4` (H.264)
- Áudios sempre em `.ogg`

---

## ESTRUTURA COMPLETA DE PATHS

```
social-os-media/                              ← nome do bucket R2
│
├── avatars/
│   └── {userId}/
│       ├── main.webp                         ← foto principal de perfil
│       ├── slide-{index}.webp                ← fotos do slide (slide-0.webp, slide-1.webp...)
│       └── alt.webp                          ← imagem alternativa para não seguidores
│
├── banners/
│   └── {userId}/
│       └── banner.{ext}                      ← ext: webp | mp4 | gif
│
├── stories/
│   └── {userId}/
│       └── {storyId}.{ext}                   ← ext: webp | mp4 | gif
│
├── posts/
│   └── {userId}/
│       └── {postId}/
│           ├── media-0.{ext}                 ← primeira mídia do post
│           ├── media-1.{ext}                 ← segunda mídia (se houver)
│           └── media-{n}.{ext}
│
├── messages/
│   └── {conversationId}/
│       └── {messageId}/
│           ├── media-0.{ext}                 ← primeira mídia da mensagem
│           └── media-{n}.{ext}
│
├── cold/
│   └── {conversationId}/
│       └── {YYYY-MM}.zst                     ← ex: 2024-01.zst
│                                             ← bloco comprimido de msgs do mês
│
├── wallpapers/
│   └── {assetId}/
│       ├── preview.webp                      ← preview estático
│       └── wallpaper.{ext}                   ← ext: mp4 | gif | webp
│
├── themes/
│   └── {assetId}/
│       ├── preview.webp                      ← screenshot do tema
│       └── theme.css                         ← arquivo CSS do tema
│
└── marketplace/
    └── {assetId}/
        ├── preview.webp
        └── asset.{ext}                       ← extensão varia por tipo de asset
```

---

## TABELA DE PATHS POR CONTEXTO

| Contexto | Path | Extensão | Observação |
|---|---|---|---|
| Foto principal de perfil | `avatars/{userId}/main.webp` | webp | Sempre webp |
| Slide de perfil (índice n) | `avatars/{userId}/slide-{n}.webp` | webp | n começa em 0 |
| Foto alternativa de perfil | `avatars/{userId}/alt.webp` | webp | Para não seguidores |
| Banner de usuário | `banners/{userId}/banner.{ext}` | webp/mp4/gif | Depende do tipo |
| Story | `stories/{userId}/{storyId}.{ext}` | webp/mp4/gif | |
| Mídia de post | `posts/{userId}/{postId}/media-{n}.{ext}` | webp/mp4/gif | n começa em 0 |
| Mídia de mensagem | `messages/{convId}/{msgId}/media-{n}.{ext}` | webp/mp4/ogg | ogg para áudio |
| Cold storage | `cold/{convId}/{YYYY-MM}.zst` | zst | Agrupado por mês |
| Preview de wallpaper | `wallpapers/{assetId}/preview.webp` | webp | |
| Arquivo de wallpaper | `wallpapers/{assetId}/wallpaper.{ext}` | mp4/gif/webp | |
| Preview de tema | `themes/{assetId}/preview.webp` | webp | |
| CSS de tema | `themes/{assetId}/theme.css` | css | |
| Asset de marketplace | `marketplace/{assetId}/asset.{ext}` | varia | |

---

## FUNÇÃO buildR2Path — usar sempre esta função

```ts
// Em: src/utils/r2-paths.ts
// NUNCA construir paths R2 fora desta função

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

export function buildR2Path(ctx: R2PathContext): string {
  switch (ctx.type) {
    case 'avatar-main':
      return `avatars/${ctx.userId}/main.webp`

    case 'avatar-slide':
      return `avatars/${ctx.userId}/slide-${ctx.index}.webp`

    case 'avatar-alt':
      return `avatars/${ctx.userId}/alt.webp`

    case 'banner':
      return `banners/${ctx.userId}/banner.${ctx.ext}`

    case 'story':
      return `stories/${ctx.userId}/${ctx.storyId}.${ctx.ext}`

    case 'post-media':
      return `posts/${ctx.userId}/${ctx.postId}/media-${ctx.index}.${ctx.ext}`

    case 'message-media':
      return `messages/${ctx.conversationId}/${ctx.messageId}/media-${ctx.index}.${ctx.ext}`

    case 'cold-storage':
      return `cold/${ctx.conversationId}/${ctx.yearMonth}.zst`

    case 'wallpaper-preview':
      return `wallpapers/${ctx.assetId}/preview.webp`

    case 'wallpaper-file':
      return `wallpapers/${ctx.assetId}/wallpaper.${ctx.ext}`

    case 'theme-preview':
      return `themes/${ctx.assetId}/preview.webp`

    case 'theme-css':
      return `themes/${ctx.assetId}/theme.css`

    case 'marketplace-asset':
      return `marketplace/${ctx.assetId}/asset.${ctx.ext}`
  }
}

// Exemplos de uso:
// buildR2Path({ type: 'avatar-main', userId: 'abc123' })
//   → 'avatars/abc123/main.webp'

// buildR2Path({ type: 'cold-storage', conversationId: 'xyz', yearMonth: '2024-01' })
//   → 'cold/xyz/2024-01.zst'

// buildR2Path({ type: 'message-media', conversationId: 'xyz', messageId: 'abc', index: 0, ext: 'webp' })
//   → 'messages/xyz/abc/media-0.webp'
```

---

## REGRAS DE UPLOAD

### Antes de fazer upload, sempre:
1. Converter imagens para `.webp` (melhor compressão, suporte universal)
2. Converter vídeos para `.mp4` H.264 (compatível com WebView do Tauri)
3. Converter áudios para `.ogg` (menor tamanho)
4. Remover metadata EXIF de imagens (privacidade)
5. Validar tamanho máximo por tipo:

| Tipo | Tamanho máximo |
|---|---|
| Avatar / banner (imagem) | 5MB |
| Story (imagem) | 10MB |
| Story (vídeo) | 50MB |
| Mídia de mensagem (imagem) | 20MB |
| Mídia de mensagem (vídeo) | 100MB |
| Mídia de mensagem (áudio) | 20MB |
| Post (imagem) | 20MB |
| Post (vídeo) | 200MB |
| Wallpaper (vídeo) | 500MB |
| Tema (CSS) | 100KB |

### Ao deletar conteúdo, sempre deletar o arquivo no R2 também
- Deletar avatar → remover `avatars/{userId}/main.webp` do R2
- Deletar story → remover `stories/{userId}/{storyId}.{ext}` do R2
- Deletar mensagem para todos → remover `messages/{convId}/{msgId}/` do R2
- Soft delete (apenas `deleted_at`) → NÃO remover do R2 ainda (aguardar cleanup job)
