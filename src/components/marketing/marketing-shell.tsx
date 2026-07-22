"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/language-store";

/** Public marketing layout — landing navbar + footer. */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  const { language, dir } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir} lang={language}>
      <Navbar />
      <main className="flex-1 flex flex-col pt-16">{children}</main>
      <Footer />
    </div>
  );
}
