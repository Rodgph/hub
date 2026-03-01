# DATABASE.md — Schema Supabase

> **ATENÇÃO PARA A IA:** Este é o schema EXATO do banco de dados. Não adicionar campos não listados. Não renomear campos. Não mudar tipos de dados. Não remover constraints. Se precisar de um campo novo, adicionar no final da tabela com comentário explicando o motivo.

---

## CONVENÇÕES GLOBAIS

- Todos os IDs são `uuid` gerados pelo Postgres: `DEFAULT gen_random_uuid()`
- Todos os campos de data são `timestamptz` (com timezone) — NUNCA `timestamp`
- `created_at DEFAULT now()` em todas as tabelas
- `updated_at DEFAULT now()` em todas as tabelas que podem ser editadas
- `updated_at` atualizado automaticamente por trigger (ver seção de Triggers)
- Soft delete via `deleted_at timestamptz DEFAULT NULL` — NUNCA deletar fisicamente
- RLS (Row Level Security) habilitado em TODAS as tabelas — `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- Nunca usar `SERIAL` ou `INT` como ID — sempre `uuid`

---

## CRIAÇÃO DO SCHEMA — ORDEM DE EXECUÇÃO

Executar as migrations nesta ordem (por dependências de FK):

1. `users`
2. `user_status`
3. `user_settings`
4. `follows`
5. `blocks`
6. `stories`
7. `story_views`
8. `posts`
9. `post_reactions`
10. `post_comments`
11. `conversations`
12. `conversation_members`
13. `messages`
14. `message_edits`
15. `message_reactions`
16. `message_reads`
17. `message_favorites`
18. `saved_conversation_excerpts`
19. `notifications`
20. `projects`
21. `project_boards`
22. `project_cards`
23. `marketplace_assets`
24. `marketplace_ratings`

---

## TABELAS

### users
Dados públicos de perfil. Extende `auth.users` do Supabase.
O Supabase cria automaticamente um registro em `auth.users` no signup.
Criar trigger para inserir em `users` quando `auth.users` recebe novo registro.

```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE NOT NULL,         -- @username, sem o @, minúsculas
  display_name    text NOT NULL,                -- Nome de exibição
  bio             text,                         -- Biografia (pode ser NULL)
  location        text,                         -- Localização ou tag livre (pode ser NULL)

  -- Foto de perfil
  avatar_url      text,                         -- URL única no R2
  avatar_urls     text[] DEFAULT '{}',          -- Array de URLs para slide de fotos
  avatar_slide_times int[] DEFAULT '{}',        -- Tempo em ms por foto (mesmo tamanho de avatar_urls)
  avatar_alt_url  text,                         -- Imagem alternativa para não seguidores

  -- Banner
  banner_url      text,                         -- URL da mídia do banner no R2
  banner_type     text DEFAULT 'color'
                  CHECK (banner_type IN ('image','gif','video','color','gradient')),
  banner_value    text DEFAULT '#020202',       -- URL (image/gif/video) ou valor CSS (color/gradient)

  -- Privacidade
  is_public       boolean DEFAULT true,         -- Perfil público ou privado
  avatar_visibility text DEFAULT 'all'
                  CHECK (avatar_visibility IN ('all','followers','except','only')),
  banner_visibility text DEFAULT 'all'
                  CHECK (banner_visibility IN ('all','followers','except','only')),
  post_permission text DEFAULT 'all'
                  CHECK (post_permission IN ('all','followers')),

  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver perfis públicos
CREATE POLICY "users_select_public" ON users
  FOR SELECT USING (is_public = true OR auth.uid() = id);

-- Apenas o próprio usuário insere
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Apenas o próprio usuário atualiza
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

### user_status
Presença em tempo real. Um registro por usuário.

```sql
CREATE TABLE user_status (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          text DEFAULT 'offline'
                  CHECK (status IN ('online','away','dnd','offline')),
  activity_type   text CHECK (activity_type IN ('playing','listening','watching',NULL)),
  activity_name   text,           -- Nome do jogo, música, live (pode ser NULL)
  activity_detail text,           -- Detalhe: artista, plataforma (pode ser NULL)
  status_visibility text DEFAULT 'all'
                  CHECK (status_visibility IN ('all','followers','none')),
  activity_visibility text DEFAULT 'all'
                  CHECK (activity_visibility IN ('all','followers','none')),
  last_seen_at    timestamptz,    -- Última vez que estava online
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Leitura baseada na visibilidade configurada pelo usuário
-- (simplificado — em produção verificar follows)
CREATE POLICY "status_select" ON user_status
  FOR SELECT USING (
    status_visibility = 'all'
    OR user_id = auth.uid()
  );

CREATE POLICY "status_update_own" ON user_status
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "status_insert_own" ON user_status
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

### user_settings
Preferências e configurações. Um registro por usuário.

```sql
CREATE TABLE user_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme           text DEFAULT 'dark',          -- 'dark' | 'light' | 'custom-{uuid}'
  theme_custom_id uuid,                         -- FK para marketplace_assets (tema customizado)
  language        text DEFAULT 'pt-BR'
                  CHECK (language IN ('pt-BR','en-US','es-ES')),
  active_modules  text[] DEFAULT '{"Chat","Feed","Music","FavoriteGames"}',
  saved_layouts   jsonb DEFAULT '{}',           -- { "Gaming": LayoutNode, "Trabalho": LayoutNode }
  active_layout   text DEFAULT 'default',       -- Nome do layout ativo

  -- Toggles de notificação
  notif_new_follower    boolean DEFAULT true,
  notif_new_post        boolean DEFAULT true,
  notif_new_story       boolean DEFAULT true,
  notif_new_message     boolean DEFAULT true,
  notif_mention         boolean DEFAULT true,

  -- Atalhos customizados: { "ctrl+alt+c": "focus_chat", ... }
  shortcuts       jsonb DEFAULT '{}',

  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS: apenas o próprio usuário
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_own" ON user_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### follows

```sql
CREATE TABLE follows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)           -- Não pode seguir a si mesmo
);

-- RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_public" ON follows FOR SELECT USING (true);

CREATE POLICY "follows_insert_own" ON follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete_own" ON follows
  FOR DELETE USING (follower_id = auth.uid());
```

---

### blocks

```sql
CREATE TABLE blocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- RLS: apenas o próprio usuário vê seus bloqueios
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_own" ON blocks
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());
```

---

### stories

```sql
CREATE TABLE stories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url       text NOT NULL,                -- URL no R2
  media_type      text NOT NULL
                  CHECK (media_type IN ('image','video','gif')),
  caption         text,                         -- Legenda editável
  duration_ms     int DEFAULT 5000,             -- Duração de exibição em ms
  expires_at      timestamptz NOT NULL,         -- Calculado: created_at + 24h
  deleted_at      timestamptz,                  -- Soft delete
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Seguidores (ou todos se perfil público) veem stories não expiradas
CREATE POLICY "stories_select" ON stories
  FOR SELECT USING (
    deleted_at IS NULL
    AND expires_at > now()
    AND (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = stories.user_id)
      OR EXISTS (SELECT 1 FROM users WHERE id = stories.user_id AND is_public = true)
    )
  );

CREATE POLICY "stories_insert_own" ON stories
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Apenas soft delete pelo próprio usuário
CREATE POLICY "stories_update_own" ON stories
  FOR UPDATE USING (user_id = auth.uid());
```

---

### story_views

```sql
CREATE TABLE story_views (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (story_id, viewer_id)
);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Autor da story vê quem assistiu
CREATE POLICY "story_views_select_author" ON story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
  );

-- Qualquer um que pode ver a story pode registrar view
CREATE POLICY "story_views_insert" ON story_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());
```

---

### posts

```sql
CREATE TABLE posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         text,                         -- Texto (pode ser NULL se só tiver mídia)
  media_urls      text[] DEFAULT '{}',          -- Array de URLs no R2
  media_types     text[] DEFAULT '{}',          -- 'image' | 'video' | 'gif' para cada URL
  visibility      text DEFAULT 'all'
                  CHECK (visibility IN ('all','followers')),
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON posts
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR visibility = 'all'
      OR EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = posts.user_id)
    )
  );

CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (user_id = auth.uid());
```

---

### post_reactions

```sql
CREATE TABLE post_reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji           text NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id, emoji)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reactions_select" ON post_reactions FOR SELECT USING (true);

CREATE POLICY "post_reactions_own" ON post_reactions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### post_comments

```sql
CREATE TABLE post_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES post_comments(id) ON DELETE CASCADE, -- NULL = comentário raiz
  content         text NOT NULL,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_select" ON post_comments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "post_comments_insert" ON post_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_comments_update_own" ON post_comments
  FOR UPDATE USING (user_id = auth.uid());
```

---

### conversations

```sql
CREATE TABLE conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text NOT NULL CHECK (type IN ('dm','group','server')),
  name            text,           -- NULL para DMs, obrigatório para group/server
  avatar_url      text,           -- NULL para DMs
  created_by      uuid NOT NULL REFERENCES users(id),
  theme           jsonb DEFAULT '{}', -- { type: 'color', value: '#020202' } ou gif/image/video
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Apenas membros da conversa podem ver
CREATE POLICY "conversations_select_members" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update_admin" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND role IN ('admin','owner')
    )
  );
```

---

### conversation_members

```sql
CREATE TABLE conversation_members (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                    text DEFAULT 'member' CHECK (role IN ('member','admin','owner')),

  -- Preferências desta conversa
  is_pinned               boolean DEFAULT false,
  is_muted                boolean DEFAULT false,
  is_archived             boolean DEFAULT false,
  is_invisible            boolean DEFAULT false,   -- Invisível ao grupo (toggle do Chat)
  show_read_receipt       boolean DEFAULT true,    -- Toggle: confirmação de leitura
  bg_profile_photo        boolean DEFAULT false,   -- Toggle: foto de perfil como bg
  mixed_profile_photos    boolean DEFAULT false,   -- Toggle: fotos mixadas nas bolhas
  allow_calls             boolean DEFAULT true,
  allow_notifications     boolean DEFAULT true,
  last_read_at            timestamptz,             -- Para calcular badge de não lidas

  joined_at               timestamptz DEFAULT now() NOT NULL,
  UNIQUE (conversation_id, user_id)
);

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Membros veem os outros membros
CREATE POLICY "conv_members_select" ON conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "conv_members_update_own" ON conversation_members
  FOR UPDATE USING (user_id = auth.uid());
```

---

### messages

```sql
CREATE TABLE messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id       uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id             uuid NOT NULL REFERENCES users(id),
  content               text,                       -- NULL quando migrado para cold storage
  media_urls            text[] DEFAULT '{}',
  media_types           text[] DEFAULT '{}',
  reply_to_id           uuid REFERENCES messages(id) ON DELETE SET NULL,
  sticker_id            text,                       -- ID da figurinha (NULL se não tem)
  is_scheduled          boolean DEFAULT false,
  scheduled_for         timestamptz,                -- Data/hora programada (NULL se não agendada)
  has_password          boolean DEFAULT false,
  password_hash         text,                       -- bcrypt hash (NULL se sem senha)
  is_deleted_for_all    boolean DEFAULT false,
  deleted_for_users     uuid[] DEFAULT '{}',        -- IDs que deletaram só para si
  is_pinned             boolean DEFAULT false,
  cold_ref              text,                       -- Path no R2 quando em cold storage (NULL = hot)
  deleted_at            timestamptz,                -- Soft delete
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL
) PARTITION BY RANGE (created_at);  -- Particionamento mensal

-- Criar partição para o mês atual (e futuras mensalmente)
CREATE TABLE messages_2024_01 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- (adicionar novas partições mensalmente via job automático)

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_members" ON messages
  FOR SELECT USING (
    deleted_at IS NULL
    AND is_deleted_for_all = false
    AND NOT (auth.uid() = ANY(deleted_for_users))
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_members" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE USING (sender_id = auth.uid());
```

---

### message_edits

```sql
CREATE TABLE message_edits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id          uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  editor_id           uuid NOT NULL REFERENCES users(id),
  content_before      text NOT NULL,          -- Conteúdo antes da edição
  edited_at           timestamptz DEFAULT now() NOT NULL,
  notified_recipient  boolean DEFAULT false   -- Se já notificou o recebedor desta edição
);

ALTER TABLE message_edits ENABLE ROW LEVEL SECURITY;

-- Membros da conversa veem o histórico de edições
CREATE POLICY "message_edits_select" ON message_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_edits.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "message_edits_insert_own" ON message_edits
  FOR INSERT WITH CHECK (editor_id = auth.uid());
```

---

### message_reactions

```sql
CREATE TABLE message_reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji           text NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_reactions_select" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "msg_reactions_own" ON message_reactions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### message_reads

```sql
CREATE TABLE message_reads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at         timestamptz DEFAULT now() NOT NULL,
  UNIQUE (message_id, user_id)
);

ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_reads_select" ON message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reads.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "msg_reads_insert" ON message_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

### message_favorites

```sql
CREATE TABLE message_favorites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope           text DEFAULT 'me' CHECK (scope IN ('me','all')),
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (message_id, user_id)
);

ALTER TABLE message_favorites ENABLE ROW LEVEL SECURITY;

-- Apenas o próprio usuário vê seus favoritos
CREATE POLICY "msg_favorites_own" ON message_favorites
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### saved_conversation_excerpts

```sql
CREATE TABLE saved_conversation_excerpts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_ids     uuid[] NOT NULL,            -- IDs das mensagens do trecho salvo
  note            text,                       -- Nota do usuário (opcional)
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE saved_conversation_excerpts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "excerpts_own" ON saved_conversation_excerpts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### notifications

```sql
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- Destinatário
  actor_id        uuid REFERENCES users(id) ON DELETE SET NULL,            -- Quem gerou
  type            text NOT NULL
                  CHECK (type IN ('follow','unfollow','post','story','message','mention','comment')),
  entity_type     text CHECK (entity_type IN ('post','message','story','comment',NULL)),
  entity_id       uuid,                       -- ID da entidade relacionada
  is_read         boolean DEFAULT false,
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Apenas o destinatário vê e marca como lida
CREATE POLICY "notifications_own" ON notifications
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### projects

```sql
CREATE TABLE projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  owner_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  members         uuid[] DEFAULT '{}',        -- Array de UUIDs dos membros
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_members" ON projects
  FOR SELECT USING (
    owner_id = auth.uid() OR auth.uid() = ANY(members)
  );

CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_members" ON projects
  FOR UPDATE USING (owner_id = auth.uid() OR auth.uid() = ANY(members));
```

---

### project_boards

```sql
CREATE TABLE project_boards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            text NOT NULL,
  position        int NOT NULL DEFAULT 0,     -- Ordem de exibição
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE project_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boards_project_members" ON project_boards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_boards.project_id
        AND (owner_id = auth.uid() OR auth.uid() = ANY(members))
    )
  );
```

---

### project_cards

```sql
CREATE TABLE project_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id        uuid NOT NULL REFERENCES project_boards(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  assignee_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date        timestamptz,
  position        int NOT NULL DEFAULT 0,     -- Ordem dentro do board
  tags            text[] DEFAULT '{}',
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE project_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards_project_members" ON project_cards
  FOR ALL USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM project_boards pb
      JOIN projects p ON p.id = pb.project_id
      WHERE pb.id = project_cards.board_id
        AND (p.owner_id = auth.uid() OR auth.uid() = ANY(p.members))
    )
  );
```

---

### marketplace_assets

```sql
CREATE TABLE marketplace_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('wallpaper','theme','widget')),
  name            text NOT NULL,
  description     text,
  preview_url     text NOT NULL,              -- URL da imagem de preview no R2
  asset_url       text NOT NULL,              -- URL do arquivo do asset no R2
  tags            text[] DEFAULT '{}',
  rating_avg      numeric(3,2) DEFAULT 0,     -- Média calculada automaticamente
  rating_count    int DEFAULT 0,              -- Atualizado automaticamente
  download_count  int DEFAULT 0,
  is_published    boolean DEFAULT false,      -- Precisa aprovação para aparecer
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE marketplace_assets ENABLE ROW LEVEL SECURITY;

-- Apenas assets publicados são visíveis para todos
CREATE POLICY "assets_select_published" ON marketplace_assets
  FOR SELECT USING (is_published = true AND deleted_at IS NULL OR author_id = auth.uid());

CREATE POLICY "assets_insert_own" ON marketplace_assets
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "assets_update_own" ON marketplace_assets
  FOR UPDATE USING (author_id = auth.uid());
```

---

### marketplace_ratings

```sql
CREATE TABLE marketplace_ratings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        uuid NOT NULL REFERENCES marketplace_assets(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (asset_id, user_id)
);

ALTER TABLE marketplace_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select" ON marketplace_ratings FOR SELECT USING (true);

CREATE POLICY "ratings_own" ON marketplace_ratings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## TRIGGERS E FUNÇÕES

### updated_at automático (aplicar em todas as tabelas com updated_at)
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em cada tabela:
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_messages
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Repetir para: user_settings, conversations, posts, post_comments,
-- project_cards, marketplace_assets
```

### Criar user_status e user_settings ao criar usuário
```sql
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela users (será populada depois pelo onboarding)
  INSERT INTO users (id, username, display_name)
  VALUES (NEW.id, '', '');

  -- Criar status inicial
  INSERT INTO user_status (user_id)
  VALUES (NEW.id);

  -- Criar settings com padrões
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION on_auth_user_created();
```

### Atualizar rating_avg ao avaliar asset
```sql
CREATE OR REPLACE FUNCTION update_asset_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_assets
  SET
    rating_avg = (SELECT ROUND(AVG(rating)::numeric, 2) FROM marketplace_ratings WHERE asset_id = NEW.asset_id),
    rating_count = (SELECT COUNT(*) FROM marketplace_ratings WHERE asset_id = NEW.asset_id)
  WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON marketplace_ratings
  FOR EACH ROW EXECUTE FUNCTION update_asset_rating();
```

### Expirar stories automaticamente (via Supabase cron)
```sql
CREATE OR REPLACE FUNCTION expire_stories()
RETURNS void AS $$
BEGIN
  UPDATE stories
  SET deleted_at = now()
  WHERE expires_at < now() AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Agendar via Supabase Dashboard → Database → Cron Jobs
-- Frequência: a cada hora
```

---

## ÍNDICES

```sql
-- Mensagens por conversa (query mais frequente do app)
CREATE INDEX idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_deleted_for_all = false;

-- Mensagens elegíveis para cold storage (background job diário)
CREATE INDEX idx_messages_hot
  ON messages(conversation_id, updated_at)
  WHERE cold_ref IS NULL AND deleted_at IS NULL AND is_pinned = false;

-- Badge de não lidas (query frequente)
CREATE INDEX idx_message_reads_user
  ON message_reads(user_id, message_id);

-- Posts do feed (por usuário seguido)
CREATE INDEX idx_posts_user_created
  ON posts(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Notificações não lidas
CREATE INDEX idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Stories ativos (exibir anel no avatar)
CREATE INDEX idx_stories_active
  ON stories(user_id, created_at DESC)
  WHERE deleted_at IS NULL AND expires_at > now();

-- Follows (para feed, visibilidade de posts/stories)
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Status de usuário (presença em tempo real)
CREATE INDEX idx_user_status ON user_status(user_id);

-- Membros de conversa (validar acesso)
CREATE INDEX idx_conv_members_user
  ON conversation_members(user_id, conversation_id);

-- Mensagens fixadas por conversa
CREATE INDEX idx_messages_pinned
  ON messages(conversation_id)
  WHERE is_pinned = true;
```

---

## REALTIME — CANAIS HABILITADOS

Habilitar Realtime nestas tabelas no Supabase Dashboard → Database → Replication:

| Tabela | Eventos | Canal Frontend |
|---|---|---|
| messages | INSERT, UPDATE, DELETE | `conversation:{id}` |
| message_reactions | INSERT, DELETE | `conversation:{id}` |
| message_reads | INSERT | `conversation:{id}` |
| user_status | UPDATE | `presence:global` |
| notifications | INSERT | `notifications:{user_id}` |
| posts | INSERT, UPDATE | `feed:global` |
| post_reactions | INSERT, DELETE | `post:{id}` |
| post_comments | INSERT, UPDATE, DELETE | `post:{id}` |
| stories | INSERT, DELETE | `stories:{user_id}` |
| project_cards | INSERT, UPDATE, DELETE | `project:{id}` |
| conversation_members | INSERT, UPDATE | `conversation:{id}` |
| user_settings | UPDATE | `settings:{user_id}` |
