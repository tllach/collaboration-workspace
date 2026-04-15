-- Design marketplace collaboration workspace — initial schema
-- Requires: pgcrypto (gen_random_uuid; crypt() used in seed.sql)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('brand', 'designer')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE public.design_requests (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  brief text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'delivered')
  ),
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
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX idx_messages_request_id ON public.messages (request_id);
CREATE INDEX idx_messages_created_at ON public.messages (created_at);

-- Index on designer_assignments(request_id): satisfied by UNIQUE(request_id)
CREATE INDEX idx_design_requests_brand_id ON public.design_requests (brand_id);

-- ---------------------------------------------------------------------------
-- TRIGGER: auto-update design_requests.updated_at
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
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- profiles: SELECT — authenticated users can read all profiles
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id IN (
      SELECT brand_id FROM design_requests WHERE brand_id = auth.uid()
    )
    OR id IN (
      SELECT designer_id FROM designer_assignments WHERE designer_id = auth.uid()
    )
  );

-- profiles: UPDATE — users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- design_requests: SELECT — brand sees own; designer sees assigned
CREATE POLICY "design_requests_select_brand_or_assigned_designer"
  ON public.design_requests
  FOR SELECT
  TO authenticated
  USING (
    brand_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.designer_assignments da
      WHERE da.request_id = design_requests.id
        AND da.designer_id = auth.uid()
    )
  );

-- design_requests: INSERT — only brands
CREATE POLICY "design_requests_insert_brand_only"
  ON public.design_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'brand'
    )
  );

-- design_requests: UPDATE — brand updates own; designer updates assigned
CREATE POLICY "design_requests_update_brand_or_assigned_designer"
  ON public.design_requests
  FOR UPDATE
  TO authenticated
  USING (
    brand_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.designer_assignments da
      WHERE da.request_id = design_requests.id
        AND da.designer_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_id = auth.uid()

    OR

    (
      EXISTS (
        SELECT 1
        FROM public.designer_assignments da
        WHERE da.request_id = design_requests.id
          AND da.designer_id = auth.uid()
      )
      AND status IN ('in_progress', 'completed')
    )
  );

-- designer_assignments: SELECT — brand of the request OR the designer
CREATE POLICY "designer_assignments_select_brand_or_designer"
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

-- designer_assignments: INSERT — only designers (uniqueness of request_id enforced by UNIQUE)
CREATE POLICY "designer_assignments_insert_designer_if_unassigned"
  ON public.designer_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    designer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'designer'
    )
  );

-- messages: SELECT — brand of request OR assigned designer
CREATE POLICY "messages_select_participants"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.design_requests dr
      WHERE dr.id = messages.request_id
        AND dr.brand_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.designer_assignments da
      WHERE da.request_id = messages.request_id
        AND da.designer_id = auth.uid()
    )
  );

-- messages: INSERT — sender must be brand or assigned designer for that request
CREATE POLICY "messages_insert_participants_only"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM public.design_requests dr
        WHERE dr.id = messages.request_id
          AND dr.brand_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.designer_assignments da
        WHERE da.request_id = messages.request_id
          AND da.designer_id = auth.uid()
      )
    )
  );

-- messages: UPDATE - sender can edit their own message
CREATE POLICY "messages_update_own"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());