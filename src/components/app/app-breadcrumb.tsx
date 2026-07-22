"use client";

import * as React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Crumb } from "@/lib/nav-config";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-store";
import { cn } from "@/lib/utils";

export function AppBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const t = useT();
  const { dir } = useLanguage();
  if (!crumbs.length) return null;

  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList className={cn(dir === "rtl" && "flex-row-reverse")}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          const label = crumb.label ?? t(crumb.labelKey);
          return (
            <React.Fragment key={`${crumb.labelKey}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
