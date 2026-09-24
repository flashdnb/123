"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-zinc-50 transition-opacity hover:opacity-80"
        >
          123<span className="text-violet-400">.</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <motion.a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
            whileHover={{ scale: 1.06, opacity: 1 }}
            whileTap={{ scale: 0.94 }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 opacity-90 transition-colors hover:bg-white/5 hover:text-zinc-50"
          >
            <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </motion.a>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-50 sm:px-4 sm:text-sm"
          >
            О проекте
          </motion.button>
        </nav>
      </div>
    </motion.header>
  );
}
