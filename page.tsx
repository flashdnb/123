import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import SummarizerInput from "@/components/SummarizerInput";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(167,139,250,0.18),transparent)]"
      />

      <Header />

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 pb-24 pt-4 sm:pt-8">
        <Hero />
        <SummarizerInput />
      </main>

      <Footer />
    </div>
  );
}
