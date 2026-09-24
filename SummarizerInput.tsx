"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clapperboard,
  FileText,
  Link as LinkIcon,
  Loader2,
  RotateCcw,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import ResultCard from "@/components/ResultCard";

export type SummarizerMode = "link" | "text" | "youtube";
export type SummarizerQuality = "fast" | "quality";

const MODE_TO_TYPE: Record<"link" | "text", "url" | "text"> = {
  link: "url",
  text: "text",
};

const TABS: { id: SummarizerMode; label: string; icon: LucideIcon }[] = [
  { id: "link", label: "Ссылка", icon: LinkIcon },
  { id: "text", label: "Текст", icon: FileText },
  { id: "youtube", label: "YouTube", icon: Clapperboard },
];

// Соответствует моделям из lib/ai.ts: fast → Haiku, quality → Sonnet.
const QUALITY_OPTIONS: {
  id: SummarizerQuality;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    id: "fast",
    label: "Быстро",
    hint: "Haiku · дёшево и быстро, для простых статей",
    icon: Zap,
  },
  {
    id: "quality",
    label: "Качественно",
    hint: "Sonnet · для сложных отчётов и аналитики",
    icon: Target,
  },
];

const urlSchema = z
  .string()
  .trim()
  .min(1, "Вставьте ссылку на статью")
  .url("Введите корректный URL, например https://example.com");

const GENERIC_ERROR = "Не удалось получить ответ от модели. Попробуйте ещё раз.";

export default function SummarizerInput() {
  const [activeTab, setActiveTab] = useState<SummarizerMode>("link");
  const [value, setValue] = useState("");
  const [quality, setQuality] = useState<SummarizerQuality>("fast");
  const [formError, setFormError] = useState<string | null>(null);

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeQuality = QUALITY_OPTIONS.find((q) => q.id === quality)!;
  const isYoutubeStub = activeTab === "youtube";
  const isSubmitDisabled = isLoading || isYoutubeStub || value.trim().length === 0;
  const hasResult = isLoading || completion.length > 0 || streamError !== null;

  function handleTabChange(tab: SummarizerMode) {
    setActiveTab(tab);
    setFormError(null);
    setValue("");
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    setValue(e.target.value);
    if (formError) setFormError(null);

    if (activeTab === "text" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }

  function handleReset() {
    abortRef.current?.abort();
    setCompletion("");
    setStreamError(null);
    setIsLoading(false);
    setValue("");
    setFormError(null);
  }

  async function handleSubmit() {
    if (isYoutubeStub) return;

    if (activeTab === "link") {
      const parsed = urlSchema.safeParse(value);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? "Некорректная ссылка");
        return;
      }
    } else if (value.trim().length === 0) {
      setFormError("Вставьте текст для анализа");
      return;
    }

    setFormError(null);
    setStreamError(null);
    setCompletion("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: value.trim(),
          type: MODE_TO_TYPE[activeTab],
          quality,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let message = GENERIC_ERROR;
        try {
          const data = await response.json();
          if (typeof data?.error === "string") message = data.error;
        } catch {
          // response body wasn't JSON — fall back to the generic message
        }
        setStreamError(message);
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        setCompletion((prev) => prev + decoder.decode(chunk, { stream: true }));
      }

      setIsLoading(false);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStreamError(GENERIC_ERROR);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-4">
        {/* Tabs */}
        <div className="relative flex w-fit gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm",
                  isActive ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-tab-pill"
                    transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
                    className="absolute inset-0 -z-10 rounded-full bg-zinc-50"
                  />
                )}
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input area */}
        <div className="mt-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {isYoutubeStub ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
                  <Clapperboard className="h-5 w-5 text-zinc-500" strokeWidth={1.5} />
                  <p className="text-sm text-zinc-500">
                    Поддержка YouTube-ссылок скоро появится
                  </p>
                </div>
              ) : activeTab === "text" ? (
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleChange}
                  placeholder="Вставь сюда URL или текст..."
                  rows={1}
                  className="max-h-72 min-h-[3.25rem] w-full resize-none rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-base text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-400/50 focus:bg-white/[0.04]"
                />
              ) : (
                <input
                  type="text"
                  inputMode="url"
                  value={value}
                  onChange={handleChange}
                  placeholder="Вставь сюда URL или текст..."
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-base text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-400/50 focus:bg-white/[0.04]"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 px-1 text-xs text-rose-400"
            >
              {formError}
            </motion.p>
          )}
        </div>

        {/* Quality toggle + submit */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              {QUALITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = opt.id === quality;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setQuality(opt.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-violet-500/20 text-violet-200"
                        : "text-zinc-400 hover:text-zinc-100"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 px-1 text-xs text-zinc-500">{activeQuality.hint}</p>
          </div>

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            whileHover={!isSubmitDisabled ? { scale: 1.02 } : undefined}
            whileTap={!isSubmitDisabled ? { scale: 0.98 } : undefined}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors sm:w-auto sm:px-7",
              isSubmitDisabled
                ? "cursor-not-allowed bg-white/10 text-zinc-500"
                : "bg-zinc-50 text-zinc-950 hover:bg-white"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Анализирую...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" strokeWidth={2} />
                Получить суть 1-2-3
              </>
            )}
          </motion.button>
        </div>
      </div>

      {hasResult && (
        <div className="mt-6 w-full space-y-3">
          <ResultCard completion={completion} isLoading={isLoading} error={streamError} />

          {!isLoading && (
            <motion.button
              type="button"
              onClick={handleReset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-50"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Новый запрос
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
