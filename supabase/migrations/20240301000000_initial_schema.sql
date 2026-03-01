-- 1. FUNÇÕES GLOBAIS E TRIGGERS DE DATA
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CRIAÇÃO DAS TABELAS CORE
CREATE TABLE IF NOT EXISTS public.users (
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

CREATE TABLE IF NOT EXISTS public.user_status (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          text DEFAULT 'offline' CHECK (status IN ('online','away','dnd','offline')),
  activity_type   text CHECK (activity_type IN ('playing','listening','watching',NULL)),
  activity_name   text,
  last_seen_at    timestamptz,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  theme           text DEFAULT 'dark',
  language        text DEFAULT 'pt-BR' CHECK (language IN ('pt-BR','en-US','es-ES')),
  saved_layouts   jsonb DEFAULT '{}',
  active_layout   text DEFAULT 'default',
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  media_url       text NOT NULL,
  media_type      text NOT NULL CHECK (media_type IN ('image','video','gif')),
  caption         text,
  expires_at      timestamptz NOT NULL,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- 3. SEGURANÇA (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_public') THEN
        CREATE POLICY "users_select_public" ON public.users FOR SELECT USING (is_public = true OR auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_insert_own') THEN
        CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_own') THEN
        CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_status' AND policyname = 'status_select_all') THEN
        CREATE POLICY "status_select_all" ON public.user_status FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_status' AND policyname = 'status_update_own') THEN
        CREATE POLICY "status_update_own" ON public.user_status FOR UPDATE USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_status' AND policyname = 'status_insert_own') THEN
        CREATE POLICY "status_insert_own" ON public.user_status FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'settings_own') THEN
        CREATE POLICY "settings_own" ON public.user_settings USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'stories_select_public') THEN
        CREATE POLICY "stories_select_public" ON public.stories FOR SELECT USING (deleted_at IS NULL AND expires_at > now());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'stories_insert_own') THEN
        CREATE POLICY "stories_insert_own" ON public.stories FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- 4. AUTOMAÇÃO (TRIGGERS)
DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_status ON public.user_status;
CREATE TRIGGER set_updated_at_status BEFORE UPDATE ON public.user_status FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_settings BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1) || floor(random()*1000)::text, NEW.email);

  INSERT INTO public.user_status (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- 5. REALTIME
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_status;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
