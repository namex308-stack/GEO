import { describe, expect, it } from "vitest";
import { arabicTextRatio, hasArabicScript } from "@/lib/locale";

describe("Arabic enforcement for AI findings", () => {
  it("rejects English recommendation copy that would leak into Arabic UI", () => {
    const englishProblem = "Add clear pricing near the buy button to reduce friction.";
    const arabicProblem = "اجعل السعر واضحًا بجانب زر الشراء لتقليل التردد.";
    expect(hasArabicScript(englishProblem)).toBe(false);
    expect(hasArabicScript(arabicProblem)).toBe(true);
    expect(arabicTextRatio([englishProblem, arabicProblem])).toBe(0.5);
  });

  it("accepts a fully Arabic recommendation set", () => {
    const texts = [
      "لا توجد تقييمات ظاهرة على صفحة المنتج.",
      "أضف مراجعات حقيقية وعدد التقييمات قرب السعر.",
      "مدة الشحن غير محددة وقد تضعف ثقة المشتري.",
    ];
    expect(arabicTextRatio(texts)).toBe(1);
  });
});
