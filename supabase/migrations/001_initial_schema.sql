-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- ENUMS 🔥
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('brand', 'designer');
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed');

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.design_requests (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_designer_id uuid REFERENCES public.profiles (id),
  title text NOT NULL,
  brief text NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  reference_urls text[] NOT NULL DEFAULT '{}',
  deliverable_type text,
  deadline date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.designer_assignments (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.design_requests (id) ON DELETE CASCADE,
  designer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT designer_assignments_request_id_key UNIQUE (request_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.design_requests (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  sender_role user_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX idx_messages_request_id ON public.messages (request_id);
CREATE INDEX idx_messages_created_at ON public.messages (created_at);
CREATE INDEX idx_design_requests_brand_id ON public.design_requests (brand_id);

-- ---------------------------------------------------------------------------
-- TRIGGER
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_design_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_design_requests_updated
  BEFORE UPDATE ON public.design_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_design_requests_updated_at();

-- ---------------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- DESIGN REQUESTS
-- ---------------------------------------------------------------------------

CREATE POLICY "design_requests_select"
ON public.design_requests
FOR SELECT
TO authenticated
USING (
  brand_id = auth.uid()
  OR assigned_designer_id = auth.uid()
);

CREATE POLICY "design_requests_insert"
ON public.design_requests
FOR INSERT
TO authenticated
WITH CHECK (
  brand_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'brand'
  )
);

CREATE POLICY "design_requests_update"
ON public.design_requests
FOR UPDATE
TO authenticated
USING (
  brand_id = auth.uid()
  OR assigned_designer_id = auth.uid()
)
WITH CHECK (
  -- Brand full control
  brand_id = auth.uid()

  OR

  -- Designer limited control
  (
    assigned_designer_id = auth.uid()
    AND status IN ('in_progress', 'completed')
  )
);

-- ---------------------------------------------------------------------------
-- DESIGNER ASSIGNMENTS
-- ---------------------------------------------------------------------------

CREATE POLICY "designer_assignments_select"
ON public.designer_assignments
FOR SELECT
TO authenticated
USING (
  designer_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.design_requests dr
    WHERE dr.id = designer_assignments.request_id
      AND dr.brand_id = auth.uid()
  )
);

CREATE POLICY "designer_assignments_insert"
ON public.designer_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  designer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'designer'
  )
);

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------

CREATE POLICY "messages_select"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.design_requests dr
    WHERE dr.id = messages.request_id
      AND (
        dr.brand_id = auth.uid()
        OR dr.assigned_designer_id = auth.uid()
      )
  )
);

CREATE POLICY "messages_insert"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.design_requests dr
    WHERE dr.id = messages.request_id
      AND (
        dr.brand_id = auth.uid()
        OR dr.assigned_designer_id = auth.uid()
      )
  )
);

CREATE POLICY "messages_update_own"
ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());