"use client";

import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-auto border-t border-white/5 py-8"
    >
      <p className="mx-auto max-w-5xl px-6 text-center text-xs text-zinc-600">
        © 2026 123.info · Работает на Claude · Создано с помощью AI
      </p>
    </motion.footer>
  );
}
