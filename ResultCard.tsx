"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Copy, Sparkles } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-zinc-50 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-zinc-50 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-zinc-50 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-zinc-300 last:mb-0 sm:text-base">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-300 last:mb-0 sm:text-base">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-zinc-300 last:mb-0 sm:text-base">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
    >
      {children}
    </a>
  ),
};

interface ResultCardProps {
  completion: string;
  isLoading: boolean;
  error: string | null;
}

export default function ResultCard({ completion, isLoading, error }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    await navigator.clipboard.writeText(completion);
    setCopied(true);
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-6"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" strokeWidth={1.75} />
        <p className="text-sm leading-relaxed text-rose-300">{error}</p>
      </motion.div>
    );
  }

  if (isLoading && completion.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-2 text-sm text-violet-300">
          <Sparkles className="h-4 w-4 animate-pulse" strokeWidth={1.75} />
          <span>ИИ анализирует и печатает...</span>
        </div>
        <div className="space-y-3">
          {[100, 90, 75].map((w, i) => (
            <div
              key={i}
              className="h-3 animate-pulse rounded-full bg-white/10"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!completion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20"
    >
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-50"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.75} />
            Скопировано!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
            Копировать
          </>
        )}
      </button>

      <div className="pr-16 sm:pr-24">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {completion}
        </ReactMarkdown>
      </div>

      {isLoading && (
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-violet-400/70 align-middle" />
      )}
    </motion.div>
  );
}
