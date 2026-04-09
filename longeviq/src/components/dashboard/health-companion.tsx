"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Send, Bot, User, Loader2, Maximize2, Minimize2, Mic, MicOff } from "lucide-react";

import { cn } from "@/lib/utils";

type SpeechRecognitionType = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionType) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function HealthCompanion() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Health Companion. I have access to your health data and can help you understand it. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

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

  const supportsSTT = getSpeechRecognitionConstructor() !== null;

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
      inputRef.current?.focus();
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

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
            content: `Error: ${err.error ?? "Unknown error"}`,
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
          content: "Connection error. Please try again.",
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
          "flex flex-col border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,248,250,0.95)_100%)] transition-all duration-300",
          expanded
            ? "h-full overflow-hidden rounded-[1.9rem] border-border/40 shadow-[0_36px_90px_-42px_rgba(15,23,42,0.32)]"
            : "h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] rounded-[1.65rem] shadow-[0_26px_70px_-44px_rgba(15,23,42,0.3)]",
        )}
      >
        <div className="relative flex items-center justify-between gap-3 border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.12),transparent_42%)] px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
              <Bot className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">AI Health Companion</p>
              <p className="text-[11px] text-muted-foreground">
                {expanded ? "Expanded view" : "Live health assistant"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={expanded ? "Minimize chat" : "Expand chat"}
            aria-expanded={expanded}
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/85 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
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
            "flex-1 space-y-3 overflow-y-auto px-4 py-4",
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
                  "rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-[0_12px_30px_-22px_rgba(15,23,42,0.22)]",
                  expanded ? "max-w-[80%] text-sm sm:max-w-[75%]" : "max-w-[85%] text-[13px]",
                  msg.role === "assistant"
                    ? "border border-white/70 bg-white/90 text-foreground"
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

        <div className={cn("border-t border-border/70 bg-background/55 px-3 py-3", expanded && "px-4 py-3 sm:px-6")}>
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
              placeholder="Ask me something..."
              disabled={isStreaming}
              className="flex-1 rounded-xl border border-input/80 bg-white/85 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
            {supportsSTT && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={isStreaming}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
                  isListening
                    ? "animate-pulse bg-destructive text-destructive-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
                title={isListening ? "Stop recording" : "Voice input"}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
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
                aria-label="Close chat"
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
