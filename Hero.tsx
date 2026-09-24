"use client";

import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function Hero() {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={container}
      className="flex flex-col items-center gap-4 pb-12 pt-8 text-center sm:pb-16 sm:pt-14"
    >
      <motion.h1
        variants={fadeUp}
        className="max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl"
      >
        Суть любого текста за 3&nbsp;пункта
      </motion.h1>
      <motion.p
        variants={fadeUp}
        className="max-w-sm text-balance text-base leading-relaxed text-zinc-400 sm:max-w-md sm:text-lg"
      >
        Вставь ссылку на статью, YouTube-видео или текст — получи выжимку за 5
        секунд
      </motion.p>
    </motion.section>
  );
}
