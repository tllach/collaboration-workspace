-- Seed: design marketplace collaboration workspace
-- Run after migrations (e.g. `supabase db reset`). Uses fixed UUIDs for stable references.

-- ---------------------------------------------------------------------------
-- Fixed IDs
-- ---------------------------------------------------------------------------
-- brand1@briefed.app
-- brand2@briefed.app
-- designer@briefed.app
-- ---------------------------------------------------------------------------

-- pgcrypto (password hashing) — usually already enabled by migration
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- auth.users (Supabase email/password pattern)
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111101',
    'authenticated',
    'authenticated',
    'brand1@briefed.app',
    extensions.crypt('demo1234', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111102',
    'authenticated',
    'authenticated',
    'brand2@briefed.app',
    extensions.crypt('demo1234', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111103',
    'authenticated',
    'authenticated',
    'designer@briefed.app',
    extensions.crypt('demo1234', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

-- ---------------------------------------------------------------------------
-- auth.identities (required for email sign-in)
-- ---------------------------------------------------------------------------
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    '55555555-5555-4555-8555-555555555501',
    '11111111-1111-4111-8111-111111111101',
    jsonb_build_object(
      'sub',
      '11111111-1111-4111-8111-111111111101',
      'email',
      'brand1@briefed.app',
      'email_verified',
      true
    ),
    'email',
    '11111111-1111-4111-8111-111111111101',
    now(),
    now(),
    now()
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    '11111111-1111-4111-8111-111111111102',
    jsonb_build_object(
      'sub',
      '11111111-1111-4111-8111-111111111102',
      'email',
      'brand2@briefed.app',
      'email_verified',
      true
    ),
    'email',
    '11111111-1111-4111-8111-111111111102',
    now(),
    now(),
    now()
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    '11111111-1111-4111-8111-111111111103',
    jsonb_build_object(
      'sub',
      '11111111-1111-4111-8111-111111111103',
      'email',
      'designer@briefed.app',
      'email_verified',
      true
    ),
    'email',
    '11111111-1111-4111-8111-111111111103',
    now(),
    now(),
    now()
  );

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role, avatar_url, created_at)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'brand1@briefed.app',
    'Sofia Ramirez',
    'brand',
    null,
    now()
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'brand2@briefed.app',
    'Carlos Mendez',
    'brand',
    null,
    now()
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'designer@briefed.app',
    'Alex Torres',
    'designer',
    null,
    now()
  );

-- ---------------------------------------------------------------------------
-- design_requests
-- ---------------------------------------------------------------------------
INSERT INTO public.design_requests (
  id,
  brand_id,
  assigned_designer_id,
  title,
  brief,
  status,
  reference_urls,
  deliverable_type,
  deadline,
  created_at,
  updated_at
)
VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111103',
    'Rebranding Café Nómada',
$brief1$
Café Nómada is a growing chain of coffee shops built for people who work on the road: reliable Wi-Fi, quiet corners, and baristas who remember your order without making a fuss. We are not trying to look like a corporate café or a trendy pop-up; we want a brand that feels warm, minimal, and unmistakably modern—inviting enough for a first-time visitor, confident enough that a regular feels at home in any city.

The rebrand should cover a primary logo system (wordmark and simple mark), a restrained color palette with one bold accent, and typography that works across menus, packaging, and digital screens. Photography and illustration direction should lean toward soft daylight, natural textures, and real workspaces—not staged “laptop lifestyle” clichés. We want the identity to scale from a single kiosk to a flagship without losing clarity.

We admire the clarity of Blue Bottle and the playful sincerity of Oatly, but we are not asking for a copy of either—use them as reference for craft and tone, then give us something that could only be Café Nómada. Deliverables: logo suite, color and type guidelines, and a one-page “voice and visuals” summary we can hand to franchise partners.
$brief1$,
    'in_progress',
    ARRAY[
      'https://bluebottlecoffee.com',
      'https://oatly.com'
    ]::text[],
    'brand identity',
    (current_date + interval '45 days')::date,
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111102',
    null,
    'App Launch Campaign — Flowr',
    $brief2$
Flowr is a mindfulness app for busy professionals who want small, repeatable rituals—not another guilt-driven streak system. Our launch campaign needs visuals that feel calm, soft, and grounded: think gentle gradients, breathable whitespace, and typography that whispers instead of shouts. The audience is roughly 25-40, often juggling work and family, and skeptical of “wellness” brands that overpromise.

We need campaign concepts that work across App Store screenshots, a lightweight landing page hero, and a small set of social templates. The story should emphasize focus, recovery, and emotional steadiness rather than hyper-productivity. We are open to subtle motion references (slow fades, breathing cues) but want static assets first so we can test messaging quickly.

Please avoid neon palettes, aggressive gradients, or stock “meditation on a cliff” imagery. We want the aesthetic to feel like a quiet room with good light—trustworthy, inclusive, and premium without feeling cold. Status for this request can remain exploratory until we lock copy with marketing.
$brief2$,
    'pending',
    ARRAY[]::text[],
    'campaign visuals',
    (current_date + interval '60 days')::date,
    now(),
    now()
  );

-- ---------------------------------------------------------------------------
-- designer_assignments — designer on Request 1 only
-- ---------------------------------------------------------------------------
INSERT INTO public.designer_assignments (id, request_id, designer_id, assigned_at)
VALUES (
  '33333333-3333-4333-8333-333333333301',
  '22222222-2222-4222-8222-222222222201',
  '11111111-1111-4111-8111-111111111103',
  now()
);

-- ---------------------------------------------------------------------------
-- messages — Request 1, alternating brand / designer, last ~3 days
-- ---------------------------------------------------------------------------
INSERT INTO public.messages (id, request_id, sender_id, sender_role, content, created_at)
VALUES
  (
    '44444444-4444-4444-8444-444444444401',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'brand',
    'Hi Alex — thanks for picking up Café Nómada. Quick context: we are piloting two new locations this quarter, so timing on the master logo is tight but I would rather move thoughtfully than rush something we will regret.',
    now() - interval '3 days'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111103',
    'designer',
    'Thanks Sofia. I read the brief end-to-end and pulled references around modular wordmarks and soft industrial textures—closer to Blue Bottle craft than loud coffee-shop clichés. I will share three mark directions by mid-week; first pass will be black/white only so we lock silhouette before color.',
    now() - interval '2 days 9 hours'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'brand',
    'Love the black/white-first approach. One guardrail: please keep “Nómada” legible at small sizes on cup sleeves—we have had issues before with script-heavy marks that look great on a deck and fall apart in production.',
    now() - interval '2 days 1 hour'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111103',
    'designer',
    'Makes sense. I am testing a sturdy sans for “Café” with a lighter companion for “Nómada,” and a small path-based mark that reads at ~16px. I will mock sleeve + favicon sizes in the next PDF so we can stress-test legibility together.',
    now() - interval '1 day 14 hours'
  ),
  (
    '44444444-4444-4444-8444-444444444405',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'brand',
    'Perfect. Also flagging: franchise partners will ask for a one-page cheat sheet—if you can leave space in the guidelines for “do / dont” examples, that will save us weeks of back-and-forth.',
    now() - interval '20 hours'
  ),
  (
    '44444444-4444-4444-8444-444444444406',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111103',
    'designer',
    'On it. I will include a tight do/dont grid (clearspace, min size, co-branded lockups) and a short voice note on how the mark pairs with photography so ops teams do not “helpfully” add drop shadows in Canva.',
    now() - interval '3 hours'
  );