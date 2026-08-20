import { describe, expect, it } from "vitest";
import { withTimeout } from "@/lib/with-timeout";

describe("withTimeout", () => {
  it("returns the resolved value when it finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 50, "fallback")).resolves.toBe("ok");
  });

  it("returns the fallback when the promise exceeds the deadline", async () => {
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 80);
    });
    await expect(withTimeout(slow, 20, "fallback")).resolves.toBe("fallback");
  });

  it("returns the fallback when the promise rejects", async () => {
    await expect(withTimeout(Promise.reject(new Error("boom")), 50, "fallback")).resolves.toBe(
      "fallback"
    );
  });
});
