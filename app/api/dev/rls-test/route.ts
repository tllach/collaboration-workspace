import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**  
 * Endpoint for testing Row Level Security (RLS) in the design requests. 
 * It includes functionality to authenticate users, perform various access checks based on user roles, and return the results of these checks. 
 * The implementation ensures that the endpoint is only accessible in the development environment and handles errors gracefully.
 */

type CheckResult = {
  name: string;
  passed: boolean;
  details: string;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function buildAdminClient(): SupabaseClient {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

async function createAuthedClient(email: string, password: string): Promise<{
  client: SupabaseClient;
  userId: string;
}> {
  const client = buildAdminClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message ?? "unknown error"}`);
  }
  return { client, userId: data.user.id };
}

async function resolveSeedRequestIds(admin: SupabaseClient): Promise<{
  request1Id: string;
  request2Id: string;
}> {
  const { data: r1, error: r1Error } = await admin
    .from("design_requests")
    .select("id")
    .eq("title", "Rebranding Café Nómada")
    .limit(1)
    .maybeSingle();

  if (r1Error || !r1?.id) {
    throw new Error(
      `Unable to resolve Request 1 id: ${r1Error?.message ?? "not found by title"}`,
    );
  }

  const { data: r2, error: r2Error } = await admin
    .from("design_requests")
    .select("id")
    .eq("title", "App Launch Campaign — Flowr")
    .limit(1)
    .maybeSingle();

  if (r2Error || !r2?.id) {
    throw new Error(
      `Unable to resolve Request 2 id: ${r2Error?.message ?? "not found by title"}`,
    );
  }

  return { request1Id: r1.id, request2Id: r2.id };
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "RLS test endpoint is only available in development." },
      { status: 403 },
    );
  }

  try {
    const admin = buildAdminClient();
    const { request1Id, request2Id } = await resolveSeedRequestIds(admin);

    const checks: CheckResult[] = [];

    // CHECK 1 — Brand isolation
    {
      const { client, userId } = await createAuthedClient("brand1@grayola.io", "grayola123");
      const { data, error } = await client
        .from("design_requests")
        .select("id,brand_id,title")
        .order("created_at", { ascending: true });

      if (error) {
        checks.push({
          name: "CHECK 1 — Brand isolation",
          passed: false,
          details: `Query failed: ${error.message}`,
        });
      } else {
        const rows = data ?? [];
        const onlyOwn = rows.every((row) => row.brand_id === userId);
        const containsBrand2 = rows.some((row) => row.brand_id !== userId);
        checks.push({
          name: "CHECK 1 — Brand isolation",
          passed: rows.length > 0 && onlyOwn && !containsBrand2,
          details: `rows=${rows.length}, onlyOwn=${onlyOwn}, containsOtherBrands=${containsBrand2}`,
        });
      }
    }

    // CHECK 2 — Brand cross-access
    {
      const { client } = await createAuthedClient("brand2@grayola.io", "grayola123");
      const { data, error } = await client
        .from("messages")
        .select("id")
        .eq("request_id", request1Id);

      if (error) {
        checks.push({
          name: "CHECK 2 — Brand cross-access",
          passed: false,
          details: `Query failed: ${error.message}`,
        });
      } else {
        const rows = data ?? [];
        checks.push({
          name: "CHECK 2 — Brand cross-access",
          passed: rows.length === 0,
          details: `rows=${rows.length} for request1=${request1Id}`,
        });
      }
    }

    // CHECK 3 — Designer access
    {
      const { client } = await createAuthedClient("designer@grayola.io", "grayola123");
      const { data, error } = await client
        .from("design_requests")
        .select("id,title")
        .order("created_at", { ascending: true });

      if (error) {
        checks.push({
          name: "CHECK 3 — Designer access",
          passed: false,
          details: `Query failed: ${error.message}`,
        });
      } else {
        const rows = data ?? [];
        const ids = rows.map((row) => row.id);
        const hasRequest1 = ids.includes(request1Id);
        const hasRequest2 = ids.includes(request2Id);
        checks.push({
          name: "CHECK 3 — Designer access",
          passed: hasRequest1 && !hasRequest2,
          details: `rows=${rows.length}, hasRequest1=${hasRequest1}, hasRequest2=${hasRequest2}`,
        });
      }
    }

    // CHECK 4 — Designer message access
    {
      const { client } = await createAuthedClient("designer@grayola.io", "grayola123");
      const { data, error } = await client
        .from("messages")
        .select("id")
        .eq("request_id", request1Id);

      if (error) {
        checks.push({
          name: "CHECK 4 — Designer message access",
          passed: false,
          details: `Query failed: ${error.message}`,
        });
      } else {
        const rows = data ?? [];
        checks.push({
          name: "CHECK 4 — Designer message access",
          passed: rows.length > 0,
          details: `rows=${rows.length} for request1=${request1Id}`,
        });
      }
    }

    // CHECK 5 — Designer cross-access
    {
      const { client } = await createAuthedClient("designer@grayola.io", "grayola123");
      const { data, error } = await client
        .from("messages")
        .select("id")
        .eq("request_id", request2Id);

      if (error) {
        checks.push({
          name: "CHECK 5 — Designer cross-access",
          passed: false,
          details: `Query failed: ${error.message}`,
        });
      } else {
        const rows = data ?? [];
        checks.push({
          name: "CHECK 5 — Designer cross-access",
          passed: rows.length === 0,
          details: `rows=${rows.length} for request2=${request2Id}`,
        });
      }
    }

    return NextResponse.json({
      checks,
      allPassed: checks.every((check) => check.passed),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown RLS test error",
      },
      { status: 500 },
    );
  }
}
