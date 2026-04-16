"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAuth } from "@/lib/auth/context";

type AIPanelProps = {
  requestId: string;
  requestTitle: string;
};

const getTextContent = (
  parts: Array<{ type: string; text?: string }>,
): string =>
  parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

export function AIPanel({ requestId, requestTitle }: AIPanelProps) {
  const { profile } = useAuth();
  const isBrand = profile?.role === "brand";
  const role = profile?.role ?? "brand";
  const userName = profile?.full_name ?? "there";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [copiedMoodboard, setCopiedMoodboard] = useState(false);
  const lastQuickActionRef = useRef<string | null>(null);
  const moodboardMessageIdRef = useRef<string | null>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/assist",
      body: { requestId },
    }),
    onFinish: ({ message }) => {
      if (lastQuickActionRef.current === "moodboard") {
        moodboardMessageIdRef.current = message.id;
      }
      lastQuickActionRef.current = null;
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
    }
  }, [input]);

  const handleQuickAction = (action: string, message: string) => {
    lastQuickActionRef.current = action;
    setCopiedMoodboard(false);
    sendMessage(
      { text: message },
      { body: { requestId, quickAction: action } },
    );
  };

  const handlePlainAppend = (message: string) => {
    sendMessage({ text: message });
  };

  const handleClear = () => {
    setMessages([]);
    moodboardMessageIdRef.current = null;
    setCopiedMoodboard(false);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const text = input;
        setInput("");
        sendMessage({ text });
      }
    }
  };

  const handleCopyMoodboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMoodboard(true);
      setTimeout(() => setCopiedMoodboard(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const subtitle = isBrand ? "Brief coach" : "Creative director";

  return (
    <div className="flex h-full flex-col max-h-[95dvh]">
      {/* ── Header ── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border-tertiary)] px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
            AI Assistant
            <span className="text-[var(--role-accent)]">✦</span>
          </div>
          <p className="text-[11px] leading-none text-[var(--muted)]">
            {subtitle}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--color-background-secondary)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Quick actions ── */}
      <QuickActions
        isBrand={isBrand}
        isLoading={isLoading}
        onQuickAction={handleQuickAction}
        onPlainAppend={handlePlainAppend}
      />

      {/* ── Message list ── */}
      <div className="h-full min-h-0 max-h-[75dvh] themed-scrollbar flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <WelcomeCard
            role={role}
            userName={userName}
            requestTitle={requestTitle}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const text = getTextContent(m.parts);
              const isMoodboardResult =
                m.role === "assistant" &&
                m.id === moodboardMessageIdRef.current;

              return (
                <div key={m.id}>
                  <div
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "assistant" && (
                      <span className="mr-2 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--role-accent)] text-[9px] font-bold leading-none text-white">
                        AI
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                        m.role === "user"
                          ? "bg-[var(--role-accent-light)] text-[var(--foreground)]"
                          : "bg-[var(--color-background-secondary)] text-[var(--foreground)]"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <SimpleMarkdown content={text} />
                      ) : (
                        text
                      )}
                    </div>
                  </div>
                  {isMoodboardResult && !isLoading && (
                    <div className="ml-7 mt-1.5">
                      <button
                        onClick={() => handleCopyMoodboard(text)}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border-soft)] px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--role-accent)] hover:text-[var(--foreground)]"
                      >
                        {copiedMoodboard ? (
                          <>
                            <CheckIcon />
                            Copied!
                          </>
                        ) : (
                          <>
                            <ClipboardIcon />
                            Copy all prompts
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <span className="mr-2 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--role-accent)] text-[9px] font-bold leading-none text-white">
                  AI
                </span>
                <div className="rounded-lg bg-[var(--color-background-secondary)] px-3 py-2">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <form
        onSubmit={handleFormSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-[var(--color-border-tertiary)] px-4 py-3"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI assistant…"
          disabled={isLoading}
          rows={1}
          className="themed-scrollbar min-h-[5dvh] flex-1 resize-none rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--role-accent)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="self-center flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--role-accent)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      {/* ── Footer ── */}
      <p className="shrink-0 pb-2 text-center text-[10px] text-[var(--muted)] opacity-60">
        Powered by Claude AI
      </p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function QuickActions({
  isBrand,
  isLoading,
  onQuickAction,
  onPlainAppend,
}: {
  isBrand: boolean;
  isLoading: boolean;
  onQuickAction: (action: string, message: string) => void;
  onPlainAppend: (message: string) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[var(--color-border-tertiary)] px-4 py-2">
      {isBrand ? (
        <>
          <QuickActionButton
            label="Improve brief"
            disabled={isLoading}
            onClick={() =>
              onQuickAction("brief_feedback", "Help me improve my brief")
            }
          />
          <QuickActionButton
            label="Draft feedback"
            disabled={isLoading}
            onClick={() =>
              onQuickAction(
                "brief_feedback",
                "Help me write feedback for my designer",
              )
            }
          />
          <QuickActionButton
            label="Summarize"
            disabled={isLoading}
            onClick={() =>
              onQuickAction("summarize", "Give me a project summary")
            }
          />
        </>
      ) : (
        <>
          <QuickActionButton
            label="Creative directions"
            disabled={isLoading}
            onClick={() =>
              onQuickAction(
                "directions",
                "Give me 3 creative directions for this project",
              )
            }
          />
          <QuickActionButton
            label="Moodboard prompts"
            disabled={isLoading}
            onClick={() =>
              onQuickAction(
                "moodboard",
                "Generate image generation prompts for this project",
              )
            }
          />
          <QuickActionButton
            label="Draft update"
            disabled={isLoading}
            onClick={() =>
              onQuickAction(
                "draft_update",
                "Help me write a status update for my client",
              )
            }
          />
          <QuickActionButton
            label="Clarifying questions"
            disabled={isLoading}
            onClick={() =>
              onPlainAppend(
                "What questions should I ask the client to better understand this brief?",
              )
            }
          />
        </>
      )}
    </div>
  );
}

function QuickActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-[var(--border-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--role-accent)] hover:text-[var(--foreground)] disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function WelcomeCard({
  role,
  userName,
  requestTitle,
}: {
  role: string;
  userName: string;
  requestTitle: string;
}) {
  const firstName = userName.split(" ")[0] || userName;

  if (role === "brand") {
    return (
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--color-background-secondary)] px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground)]">
        <p>
          Hi <span className="font-medium">{firstName}</span>! I have context
          on your <span className="font-medium">{requestTitle}</span> project.
        </p>
        <p className="mt-2 text-[var(--muted)]">
          I can help you improve your brief, draft feedback for your designer,
          or summarize where things stand. What do you need?
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--color-background-secondary)] px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground)]">
      <p>
        Hi <span className="font-medium">{firstName}</span>! I&apos;m your
        creative director for{" "}
        <span className="font-medium">{requestTitle}</span>.
      </p>
      <p className="mt-2 text-[var(--muted)]">
        I can help you interpret the brief, generate creative directions, create
        moodboard prompts for AI image tools, or draft client updates. Where do
        you want to start?
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--muted)]"
          style={{
            animation: "ai-typing-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </span>
  );
}

/* ── Icons ──────────────────────────────────────────────────── */

function ClipboardIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Simple markdown renderer ───────────────────────────────────*/

function SimpleMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isBulletList = lines.every(
          (l) => /^\s*[-*•]\s/.test(l) || l.trim() === "",
        );
        const isNumberedList = lines.every(
          (l) => /^\s*\d+[.)]\s/.test(l) || l.trim() === "",
        );

        if (isBulletList) {
          return (
            <ul key={i} className="list-disc space-y-0.5 pl-4">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => (
                  <li key={j}>
                    {formatInline(line.replace(/^\s*[-*•]\s/, ""))}
                  </li>
                ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={i} className="list-decimal space-y-0.5 pl-4">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => (
                  <li key={j}>
                    {formatInline(line.replace(/^\s*\d+[.)]\s/, ""))}
                  </li>
                ))}
            </ol>
          );
        }

        return (
          <p key={i}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {formatInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function formatInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-[12px]"
        >
          {match[4]}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length <= 1 ? parts[0] ?? "" : <>{parts}</>;
}
