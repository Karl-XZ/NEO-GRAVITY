"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Send, Bot, User, Loader2, Maximize2, Minimize2, Mic, MicOff, Paperclip, X, FileText } from "lucide-react";

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

interface UploadedFile {
  name: string;
  content: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: UploadedFile[];
}

const starterQuestions = [
  "What matters most in my health data right now?",
  "What should I focus on this week?",
  "Can you explain my readiness and recovery scores?",
] as const;

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
  const [supportsSTT, setSupportsSTT] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setSupportsSTT(getSpeechRecognitionConstructor() !== null);
  }, []);

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf") {
        setIsParsingFile(true);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          try {
            const res = await fetch("/api/parse-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64 }),
            });
            if (res.ok) {
              const { text } = await res.json();
              setAttachedFiles((prev) => [...prev, { name: file.name, content: text }]);
            } else {
              const err = await res.json();
              setAttachedFiles((prev) => [...prev, { name: file.name, content: `[PDF error: ${err.error}]` }]);
            }
          } catch {
            setAttachedFiles((prev) => [...prev, { name: file.name, content: "[PDF could not be read]" }]);
          } finally {
            setIsParsingFile(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Text-based files
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          setAttachedFiles((prev) => [...prev, { name: file.name, content }]);
        };
        reader.readAsText(file);
      }
    });

    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend(prefilledText?: string) {
    const text = (prefilledText ?? input).trim();
    if (!text || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setAttachedFiles([]);
    setIsStreaming(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => {
            let content = m.content;
            if (m.files && m.files.length > 0) {
              const fileContext = m.files
                .map((f) => `[File: ${f.name}]\n${f.content}`)
                .join("\n\n");
              content = `${content}\n\n--- Attached Files ---\n${fileContext}`;
            }
            return { role: m.role, content };
          }),
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

  function renderAssistantContent(content: string) {
    return content.split(/\n{2,}/).map((block, index) => (
      <p
        key={`${index}-${block.slice(0, 24)}`}
        className="mb-2 whitespace-pre-wrap last:mb-0"
      >
        {block}
      </p>
    ));
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
                {msg.files && msg.files.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1">
                    {msg.files.map((f, fi) => (
                      <span
                        key={fi}
                        className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-medium"
                      >
                        <FileText className="size-3" />
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
                {msg.content ? (
                  msg.role === "assistant" ? (
                    renderAssistantContent(msg.content)
                  ) : (
                    msg.content
                  )
                ) : (
                  isStreaming && i === messages.length - 1 ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={cn("border-t border-border/70 bg-background/55 px-3 py-3", expanded && "px-4 py-3 sm:px-6")}>
          {isParsingFile && (
            <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Processing PDF...
            </div>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            {starterQuestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={isStreaming || isParsingFile}
                onClick={() => void handleSend(question)}
                className="rounded-full border border-border/80 bg-white/85 px-3 py-1.5 text-left text-[11px] font-medium leading-snug text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                {question}
              </button>
            ))}
          </div>
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {attachedFiles.map((file, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-white/80 px-2 py-1 text-[11px] font-medium text-foreground"
                >
                  <FileText className="size-3 text-muted-foreground" />
                  {file.name}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.csv,.json,.md,.xml,.html,.log,.tsv,.yml,.yaml,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-40"
              title="Attach file"
            >
              <Paperclip className="size-4" />
            </button>
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
              disabled={!input.trim() || isStreaming || isParsingFile}
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
