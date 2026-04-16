"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithSender } from "@/types";

export function useRealtimeChat(requestId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const messagesQuery = useQuery<MessageWithSender[]>({
    queryKey: ["messages", requestId],
    enabled: Boolean(requestId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
            *,
            sender:profiles!messages_sender_id_fkey(*)
          `,
        )
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as MessageWithSender[];
    },
  });

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`workspace-chat:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", requestId] });
        },
      )
      .subscribe();

    // React runs this cleanup before the next effect (when requestId changes),
    // so the old channel is removed before a new channel is created.
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId, queryClient, supabase]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!profile) throw new Error("Missing profile");
      const text = content.trim();
      if (!text) return;

      const { error } = await supabase.from("messages").insert({
        request_id: requestId,
        sender_id: profile.id,
        sender_role: profile.role,
        content: text,
      });

      if (error) throw error;
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending,
    sendMessage: (content: string) => sendMutation.mutateAsync(content),
  };
}
