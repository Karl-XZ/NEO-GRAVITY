"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Mic, MicOff } from "lucide-react";

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
        "Hallo! Ich bin dein AI Health Companion. Ich habe Zugriff auf deine Gesundheitsdaten und kann dir helfen, sie zu verstehen. Was möchtest du wissen?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
          <Bot className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">AI Health Companion</p>
          <p className="text-[11px] text-muted-foreground">Dein Gesundheitsassistent</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
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
              className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-surface-2 text-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {msg.content ||
                (isStreaming && i === messages.length - 1 ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : null)}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2.5">
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
          {supportsSTT && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isStreaming}
              className={`flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              title={isListening ? "Aufnahme stoppen" : "Spracheingabe"}
            >
              {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
          )}
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
