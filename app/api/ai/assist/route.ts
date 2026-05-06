import { createServerClient } from "@/lib/supabase/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) {
    return new Response("Unauthorized", { status: 401 });
  }

  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count, error: rateLimitError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .gte("created_at", oneHourAgo);

  if (rateLimitError) {
    return new Response("Unable to verify rate limit", { status: 500 });
  }

  if ((count ?? 0) > 50) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile) return new Response("Profile not found", { status: 404 });

  const {
    messages,
    requestId,
    quickAction,
  }: { messages: UIMessage[]; requestId: string; quickAction?: string } =
    await req.json();

  const { data: designRequest } = await supabase
    .from("design_requests")
    .select("title, brief, status, deliverable_type, deadline")
    .eq("id", requestId)
    .maybeSingle();
  if (!designRequest)
    return new Response("Request not found or access denied", { status: 403 });

  const systemPrompt = buildSystemPrompt({
    role: profile.role,
    userName: profile.full_name,
    request: designRequest,
    quickAction,
  });

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}


function buildSystemPrompt({
  role,
  userName,
  request,
  quickAction,
}: {
  role: string;
  userName: string;
  request: {
    title: string;
    brief: string;
    status: string;
    deliverable_type: string | null;
    deadline: string | null;
  };
  quickAction?: string;
}) {
  const briefContext = `
PROJECT: ${request.title}
TYPE: ${request.deliverable_type ?? "Not specified"}
STATUS: ${request.status}
DEADLINE: ${request.deadline ?? "Not specified"}

BRIEF:
${request.brief}
  `.trim();

  if (role === "brand") {
    const base = `You are a creative brief coach helping ${userName}, a brand owner, get the most out of their collaboration with a designer on Briefed.

You have full context on their current project:
${briefContext}

Your role:
- Help them clarify or improve their brief
- Help them articulate feedback to the designer clearly and constructively
- Summarize conversation history when asked
- Suggest what information might be missing from the brief
- Keep responses concise — 2-4 paragraphs max unless asked for more
- Be warm, practical, and direct`;

    if (quickAction === "brief_feedback") {
      return (
        base +
        "\n\nThe user wants to draft feedback for their designer. Ask them what they want to communicate, then help them write a clear, specific, and constructive message they can send directly in the chat."
      );
    }
    if (quickAction === "summarize") {
      return (
        base +
        '\n\nThe user wants a summary of their project status. Based on the brief and any context provided, give a concise "where things stand" summary in 3-5 bullet points.'
      );
    }
    return base;
  }

  if (role === "designer") {
    const base = `You are a creative director assistant helping ${userName}, a designer, execute a project on Briefed.

You have full context on their current project:
${briefContext}

Your role:
- Help them interpret and break down the brief into actionable directions
- Generate creative direction options (not final designs — directions and concepts)
- Generate image prompts for AI image tools (Midjourney, DALL-E, Stable Diffusion)
- Help draft professional status update messages to send to the client
- Suggest what questions to ask the client if the brief is unclear
- Keep responses practical and design-focused`;

    if (quickAction === "moodboard") {
      return (
        base +
        "\n\nGenerate 4 detailed image generation prompts for this project. Each prompt should be usable directly in Midjourney or DALL-E. Format: numbered list, each prompt on its own line, 2-3 sentences per prompt. Include style references, mood, color palette hints, and composition notes."
      );
    }
    if (quickAction === "draft_update") {
      return (
        base +
        "\n\nHelp draft a professional status update message for the client. The message should be warm, specific about progress, and set clear expectations for next steps. Keep it under 150 words."
      );
    }
    if (quickAction === "directions") {
      return (
        base +
        "\n\nBreak down this brief into 3 distinct creative directions. For each direction: name it (2-3 words), describe the visual concept (2 sentences), suggest 2-3 key visual references or inspirations, and note the primary emotion/feeling it conveys."
      );
    }
    return base;
  }

  return "You are a helpful assistant for a design collaboration platform.";
}
