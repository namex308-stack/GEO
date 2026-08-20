import { describe, expect, it } from "vitest";
import type { Recommendation } from "@/lib/types";
import {
  dedupeByFindingTopic,
  enrichRecommendation,
  findingTopic,
  isGenericSolution,
  solutionForFinding,
} from "@/lib/audit/finding-copy";
import { dedupeAndSortRecommendations } from "@/lib/ai/recommendations";

function rec(
  partial: Partial<Recommendation> & Pick<Recommendation, "id" | "problem">
): Recommendation {
  return {
    pillar: "seo",
    severity: "warning",
    impact: "medium",
    solution: "fix",
    ...partial,
  };
}

describe("finding copy", () => {
  it("maps issue types to specific Arabic steps", () => {
    expect(solutionForFinding("لا توجد تقييمات أو عدد مراجعات واضح.")).toMatch(/مراجعات/);
    expect(solutionForFinding("لا توجد تقييمات أو عدد مراجعات واضح.")).not.toMatch(
      /عالج هذه النقطة/
    );
    expect(solutionForFinding("طرق الدفع المحلية غير ظاهرة (مدى، تابي).")).toMatch(/مدى/);
    expect(solutionForFinding("لا يوجد محتوى أسئلة شائعة أو مخطط FAQPage.")).toMatch(
      /FAQPage/
    );
    expect(solutionForFinding("مخطط المنتج مفقود، فتصعب على أنظمة AI التعرف على كيان المنتج.")).toMatch(
      /Product JSON-LD/
    );
  });

  it("detects generic placeholder solutions", () => {
    expect(
      isGenericSolution("عالج هذه النقطة أولًا لأنها تؤثر بقوة على درجة المتجر.")
    ).toBe(true);
    expect(isGenericSolution("فرصة تحسين إضافية لتعزيز التجربة.")).toBe(true);
    expect(
      isGenericSolution("Address this point first as it strongly impacts the store's score")
    ).toBe(true);
    expect(isGenericSolution("أضف Product JSON-LD يتضمن الاسم والصورة.")).toBe(false);
  });

  it("rewrites generic solutions from the problem type", () => {
    const next = enrichRecommendation(
      rec({
        id: "seo-f1",
        problem: "لا توجد بيانات منظمة Schema.org على الصفحة.",
        solution: "عالج هذه النقطة أولًا لأنها تؤثر بقوة على درجة المتجر.",
      })
    );
    expect(next?.solution).toMatch(/Product JSON-LD/);
    expect(next?.solution).not.toMatch(/عالج هذه النقطة/);
  });

  it("drops empty additional-opportunity recommendations", () => {
    expect(
      enrichRecommendation(
        rec({
          id: "x",
          problem: "فرصة تحسين إضافية لتعزيز التجربة.",
          solution: "فرصة تحسين إضافية لتعزيز التجربة.",
        })
      )
    ).toBeNull();
  });

  it("classifies FAQ without schema separately from missing FAQ content", () => {
    expect(findingTopic("توجد أسئلة شائعة بدون مخطط FAQPage.")).toBe("faq-schema");
    expect(findingTopic("تغطية الأسئلة الشائعة ضعيفة لمحركات الإجابة.")).toBe("faq");
  });
});

describe("schema/FAQ topic dedupe", () => {
  it("keeps Product JSON-LD and drops a generic Schema.org duplicate", () => {
    const out = dedupeByFindingTopic([
      rec({
        id: "seo-schema",
        problem: "لا توجد بيانات منظمة Schema.org على الصفحة.",
        solution: "أضف أي schema.",
      }),
      rec({
        id: "geo-product",
        pillar: "geo",
        severity: "critical",
        impact: "high",
        problem: "مخطط المنتج مفقود، فتصعب على أنظمة AI التعرف على كيان المنتج.",
        solution: "أضف Product JSON-LD يتضمن الاسم والصورة والعلامة والعروض.",
      }),
    ]);
    expect(out.map((r) => r.id)).toEqual(["geo-product"]);
  });

  it("keeps one FAQ action when content and FAQPage items overlap", () => {
    const out = dedupeAndSortRecommendations([
      rec({
        id: "geo-faq",
        pillar: "geo",
        problem: "تغطية الأسئلة الشائعة ضعيفة لمحركات الإجابة والاستشهاد بالذكاء الاصطناعي.",
        solution: "أضف 5–8 أسئلة مع FAQPage.",
      }),
      rec({
        id: "geo-faq-schema",
        pillar: "geo",
        problem: "توجد أسئلة شائعة بدون مخطط FAQPage.",
        solution: "غلّف الأسئلة في FAQPage JSON-LD.",
      }),
      rec({
        id: "h-faq",
        pillar: "geo",
        problem: "لا يوجد محتوى أسئلة شائعة أو مخطط FAQPage.",
        solution: "أضف أسئلة شائعة.",
      }),
    ]);
    const faqItems = out.filter((r) => findingTopic(r.problem) === "faq" || findingTopic(r.problem) === "faq-schema");
    expect(faqItems).toHaveLength(1);
    expect(faqItems[0]!.solution).not.toMatch(/فرصة تحسين إضافية/);
  });
});
