import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { translate as t } from "@/lib/locale/t";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Logo showWordmark={false} size={56} />
        </div>

        <div className="font-display text-7xl font-extrabold gradient-text mb-2">404</div>
        <h1 className="font-display text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">{t("notFound.desc")}</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild className="rounded-full">
            <Link href="/">
              <Home className="size-4 me-1.5" /> {t("notFound.backHome")}
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/pricing">
              {t("notFound.viewPricing")} <ArrowRight className="size-4 ms-1.5 rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
