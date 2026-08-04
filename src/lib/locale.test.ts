import { describe, expect, it } from "vitest";
import {
  arabicTextRatio,
  hasArabicScript,
  isArabicFacingText,
  normalizeAppLocale,
} from "./locale";

describe("locale helpers", () => {
  it("detects Arabic script", () => {
    expect(hasArabicScript("مدة الشحن غير ظاهرة")).toBe(true);
    expect(hasArabicScript("Shipping duration is missing")).toBe(false);
  });

  it("treats short non-Arabic tokens as acceptable facing text", () => {
    expect(isArabicFacingText("OK")).toBe(true);
    expect(isArabicFacingText("Shipping duration is clearly missing from checkout")).toBe(
      false
    );
  });

  it("normalizes locale with Arabic-first default", () => {
    expect(normalizeAppLocale("ar")).toBe("ar");
    expect(normalizeAppLocale("en-US")).toBe("en");
    expect(normalizeAppLocale("")).toBe("ar");
    expect(normalizeAppLocale(null)).toBe("ar");
  });

  it("computes Arabic text ratio", () => {
    expect(
      arabicTextRatio([
        "مدة الشحن غير ظاهرة على الصفحة",
        "Shipping policy is vague and unclear",
      ])
    ).toBe(0.5);
  });
});
