"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Send, Bot, User, Loader2, Maximize2, Minimize2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function HealthCompanion() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hallo! Ich bin dein AI Health Companion. Ich habe Zugriff auf deine Gesundheitsdaten und kann dir helfen, sie zu verstehen. Was möchtest du wissen?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isExpanded) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `Fehler: ${err.error ?? "Unbekannter Fehler"}`,
          };
          return copy;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: copy[copy.length - 1].content + parsed.content,
                };
                return copy;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Verbindungsfehler. Bitte versuche es erneut.",
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function renderCompanionCard(expanded: boolean) {
    return (
      <div
        className={cn(
          "flex flex-col border border-border bg-card transition-all duration-300",
          expanded
            ? "h-full overflow-hidden rounded-2xl border-border/80 shadow-2xl"
            : "h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] rounded-xl",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
              <Bot className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">AI Health Companion</p>
              <p className="text-[11px] text-muted-foreground">
                {expanded ? "Erweiterte Ansicht" : "Dein Gesundheitsassistent"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={expanded ? "Chat verkleinern" : "Chat erweitern"}
            aria-expanded={expanded}
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              expanded ? "size-9" : "size-8",
            )}
          >
            {expanded ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className={cn(
            "flex-1 space-y-3 overflow-y-auto px-4 py-3",
            expanded && "px-5 py-4 sm:px-6",
          )}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "assistant"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="size-3.5" />
                ) : (
                  <User className="size-3.5" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 leading-relaxed",
                  expanded ? "max-w-[80%] text-sm sm:max-w-[75%]" : "max-w-[85%] text-[13px]",
                  msg.role === "assistant"
                    ? "bg-surface-2 text-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {msg.content ||
                  (isStreaming && i === messages.length - 1 ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : null)}
              </div>
            </div>
          ))}
        </div>

        <div className={cn("border-t border-border px-3 py-2.5", expanded && "px-4 py-3 sm:px-6")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Frag mich etwas..."
              disabled={isStreaming}
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              {isStreaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isExpanded ? renderCompanionCard(false) : null}
      {isExpanded
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Chat schließen"
                className="fixed inset-0 z-[110] bg-background/72 backdrop-blur-sm"
                onClick={() => setIsExpanded(false)}
              />
              <div className="fixed inset-0 z-[120] p-4 sm:p-6 lg:p-8">
                <div className="mx-auto h-full w-full max-w-6xl">
                  {renderCompanionCard(true)}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
