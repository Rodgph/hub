-- 1. LIMPEZA TOTAL
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_members CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.post_reactions CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.user_status CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. FUNÇÕES GLOBAIS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAÇÃO DAS TABELAS (UUID)

CREATE TABLE public.users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE NOT NULL,
  display_name    text NOT NULL,
  bio             text,
  avatar_url      text,
  banner_url      text,
  banner_type     text DEFAULT 'color' CHECK (banner_type IN ('image','gif','video','color','gradient')),
  is_public       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.user_status (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          text DEFAULT 'offline' CHECK (status IN ('online','away','dnd','offline')),
  activity_type   text CHECK (activity_type IN ('playing','listening','watching',NULL)),
  activity_name   text,
  last_seen_at    timestamptz,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.user_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  theme           text DEFAULT 'dark',
  language        text DEFAULT 'pt-BR' CHECK (language IN ('pt-BR','en-US','es-ES')),
  saved_layouts   jsonb DEFAULT '{}'::jsonb,
  active_layout   text DEFAULT 'default',
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.follows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE public.stories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  media_url       text NOT NULL,
  media_type      text NOT NULL CHECK (media_type IN ('image','video','gif')),
  caption         text,
  duration_ms     int DEFAULT 5000,
  expires_at      timestamptz NOT NULL,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.story_views (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (story_id, viewer_id)
);

CREATE TABLE public.posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         text,
  media_urls      text[] DEFAULT '{}',
  media_types     text[] DEFAULT '{}',
  visibility      text DEFAULT 'all' CHECK (visibility IN ('all','followers')),
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  -- Campos adicionados para compatibilidade com o frontend (conforme DATABASE.md permite adições no final)
  likes_count     int DEFAULT 0,
  comments_count  int DEFAULT 0
);

CREATE TABLE public.post_reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji           text NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id, emoji)
);

-- Tabela post_likes mantida para compatibilidade com o código atual do frontend
CREATE TABLE public.post_likes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

CREATE TABLE public.post_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content         text NOT NULL,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('dm', 'group', 'server')),
    name TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.users(id),
    theme JSONB DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    is_pinned BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 4. SEGURANÇA (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "users_read" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "status_read" ON public.user_status FOR SELECT USING (true);
CREATE POLICY "status_update_own" ON public.user_status FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "settings_all_own" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "follows_read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (follower_id = auth.uid());

CREATE POLICY "stories_read" ON public.stories FOR SELECT USING (deleted_at IS NULL AND expires_at > now());
CREATE POLICY "stories_insert_own" ON public.stories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "stories_update_own" ON public.stories FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "posts_read" ON public.posts FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "post_likes_read" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_own" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "post_comments_read" ON public.post_comments FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "conv_member_read" ON public.conversations FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid()));

CREATE POLICY "msg_member_read" ON public.messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

CREATE POLICY "msg_member_insert" ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

-- 5. REPARO DE DADOS
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        INSERT INTO public.users (id, username, display_name)
        VALUES (
            user_record.id, 
            split_part(user_record.email, '@', 1) || floor(random()*1000)::text,
            split_part(user_record.email, '@', 1)
        ) ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.user_status (user_id)
        VALUES (user_record.id) ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO public.user_settings (user_id)
        VALUES (user_record.id) ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
END $$;

-- 6. TRIGGERS
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_status BEFORE UPDATE ON public.user_status FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_settings BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_messages BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_posts BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_stories BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para atualizar contadores de posts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (TG_TABLE_NAME = 'post_likes') THEN
      UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_TABLE_NAME = 'post_comments') THEN
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (TG_TABLE_NAME = 'post_likes') THEN
      UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    ELSIF (TG_TABLE_NAME = 'post_comments') THEN
      UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_like_added AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();
CREATE TRIGGER on_post_comment_added AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

-- Trigger para novos usuários
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1) || floor(random()*1000)::text, split_part(NEW.email, '@', 1));
  INSERT INTO public.user_status (user_id) VALUES (NEW.id);
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- 7. REALTIME
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.messages, 
  public.user_status, 
  public.conversations, 
  public.conversation_members,
  public.posts,
  public.stories;
