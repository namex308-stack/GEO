import type { Metadata } from "next";
import Link from "next/link";
import { Home, Search, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Logo showWordmark={false} size={56} />
        </div>

        <div className="font-display text-7xl font-extrabold gradient-text mb-2">404</div>
        <h1 className="font-display text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild className="rounded-full">
            <Link href="/">
              <Home className="size-4 mr-1.5" /> Back home
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/pricing">
              View pricing <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/docs">
              <Search className="size-4 mr-1.5" /> Docs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
