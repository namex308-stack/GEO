import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Log In",
  description: "Log in to your convaudit account to run AI product page audits.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
