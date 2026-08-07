import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * URL values are always Latin content. Left to the default bidi
 * heuristics inside an RTL ancestor, the box aligns to the `start` side
 * (right) while the text itself still renders LTR — the classic
 * "misaligned input" look. Force LTR box + text for these types unless
 * the caller passes an explicit `dir`. Excludes "email"/"tel" since
 * some call sites position an icon inside the field using RTL-relative
 * logical offsets that assume the ambient (rtl) direction.
 */
const LTR_INPUT_TYPES = new Set(["url"]);

function Input({ className, type, dir, ...props }: React.ComponentProps<"input">) {
  const resolvedDir = dir ?? (type && LTR_INPUT_TYPES.has(type) ? "ltr" : undefined);
  return (
    <input
      type={type}
      dir={resolvedDir}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-11 w-full min-w-0 rounded-xl border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        resolvedDir === "ltr" && "text-left",
        className
      )}
      {...props}
    />
  )
}

export { Input }
