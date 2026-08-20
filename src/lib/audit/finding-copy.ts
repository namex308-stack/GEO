import type { Recommendation, ScorePillar } from "@/lib/types";

const GENERIC_SOLUTION_RE = [
  /عالج هذه النقطة أول/,
  /تؤثر بقوة على درجة المتجر/,
  /حسّن هذه النقطة لرفع الدرجة/,
  /فرصة تحسين إضافية/,
  /تعزيز التجربة/,
  /نفّذ تحسين الصفحة حسب أولوية الأثر/,
  /حسّن عنصر الصفحة المرتبط/,
  /address this point first/i,
  /strongly impacts the store/i,
  /additional improvement opportunity/i,
  /enhance the experience/i,
];

const VAGUE_PROBLEM_RE = [
  /^فرصة تحسين إضافية/,
  /تعزيز التجربة/,
  /additional improvement opportunity/i,
  /enhance the experience/i,
];

export type FindingTopic =
  | "reviews"
  | "payments"
  | "shipping"
  | "returns"
  | "exchange"
  | "price"
  | "image"
  | "cta"
  | "description"
  | "title"
  | "meta"
  | "schema-generic"
  | "schema-product"
  | "schema-org"
  | "schema-breadcrumb"
  | "faq"
  | "faq-schema"
  | "brand"
  | "content"
  | "headings"
  | "links"
  | "entities"
  | "clarity"
  | "other";

/** More-specific topics replace these coarser duplicates in the same report. */
const SUBSUMED_BY: Partial<Record<FindingTopic, FindingTopic[]>> = {
  "schema-product": ["schema-generic"],
  faq: ["faq-schema"],
};

const SOLUTIONS: Record<Exclude<FindingTopic, "other">, string> = {
  reviews:
    "أظهر تقييمات العملاء على صفحة المنتج مع عدد المراجعات والنجوم بجانب السعر.\nأضف قسم مراجعات حقيقية (اسم، تاريخ، نص قصير) يمكن للمتسوق قراءته قبل الشراء.\nضمّن AggregateRating داخل مخطط Product JSON-LD حتى يظهر التقييم في البحث والمساعدات الذكية.",
  payments:
    "أظهر بوضوح بجانب السعر أو زر الشراء وسائل الدفع المحلية التي يدعمها متجرك فعليًا: مدى و/أو تابي و/أو تمارا و/أو Apple Pay و/أو الدفع عند الاستلام.\nاستخدم أيقونات + جملة قصيرة مثل «ادفع بمدى أو قسّط مع تابي».\nلا تذكر وسيلة غير مفعّلة عند الدفع حتى لا تنكسر الثقة.",
  shipping:
    "اكتب مدة شحن رقمية ظاهرة قرب المنتج، مثل «التوصيل خلال 3–5 أيام عمل».\nتجنّب عبارات عامة مثل «شحن سريع» من دون رقم.\nأظهر نفس المدة في صفحة السياسات وفي صفحة المنتج.",
  returns:
    "أضف سياسة إرجاع واضحة على صفحة المنتج: المدة والشروط (مثل «إرجاع خلال 14 يومًا مع الفاتورة»).\nضع رابطًا ظاهرًا لصفحة الإرجاع بجانب زر الشراء أو في تذييل بطاقة المنتج.\nتجنّب صياغة غامضة مثل «إرجاع سهل» من دون تفاصيل.",
  exchange:
    "وضّح سياسة الاستبدال بمدة وشروط محددة (مثل «استبدال خلال 7 أيام للمنتجات غير المستخدمة»).\nاعرضها بجانب سياسة الإرجاع حتى يطمئن المشتري قبل الدفع.",
  price:
    "اجعل السعر النهائي ظاهرًا في HTML بجانب زر الشراء، لا داخل صورة فقط.\nأضف السعر والعملة في مخطط Offer داخل Product JSON-LD.\nإن وُجد سعر قبل الخصم، أظهره بوضوح مع السعر الحالي.",
  image:
    "أضف صورة منتج عالية الجودة ظاهرة فوق الطيّة، مع نص بديل يصف المنتج.\nعيّن og:image بنفس الصورة حتى تظهر عند المشاركة وفي نتائج البحث.\nاربط الصورة في مخطط Product JSON-LD عبر خاصية image.",
  cta:
    "اجعل زر الشراء واضحًا بالنص والحجم واللون فوق الطيّة (مثل «أضف إلى السلة» أو «اشترِ الآن»).\nثبّت الزر أو كرّره بعد المواصفات حتى لا يضيع أثناء التمرير.\nاربط الزر بسعر ظاهر وطرق دفع واضحة في نفس المنطقة.",
  description:
    "وسّع وصف المنتج بفقرة افتتاحية توضّح لمن المنتج وما الفائدة الأساسية.\nأضف نقاط مواصفات (المكونات، الحجم، طريقة الاستخدام) بدل جملة تسويقية واحدة.\nاجعل النص قابلاً للقراءة في HTML وليس داخل صورة.",
  title:
    "ضع عنوان صفحة فريدًا يتضمن اسم المنتج والعلامة إن أمكن (30–60 حرفًا).\nاستخدم نفس الاسم في H1 الظاهر للمتسوق.\nتجنّب عنوانًا عامًا مثل اسم المتجر فقط.",
  meta:
    "اكتب وصفًا تعريفيًا من 120–160 حرفًا يوضح المنتج والفائدة ودعوة خفيفة للشراء.\nطابق الوصف مع المحتوى الظاهر حتى لا يبدو مضلّلاً.\nأضف og:title وog:description بنفس المعنى.",
  "schema-generic":
    "أضف مخطط Product JSON-LD في رأس الصفحة يتضمن: الاسم، الصورة، العلامة، السعر، التوفر.\nإن وُجدت أسئلة شائعة، أضف FAQPage JSON-LD منفصلاً.\nاختبر المخطط بأداة النتائج المنسّقة من Google بعد النشر.",
  "schema-product":
    "أضف مخطط Product JSON-LD يتضمن name وimage وbrand وoffers (السعر والعملة والتوفر).\nإن توفرت تقييمات، أضف aggregateRating داخل نفس المخطط.\nتأكد أن القيم في JSON-LD تطابق النص الظاهر على الصفحة.",
  "schema-org":
    "أضف مخطط Organization JSON-LD باسم المتجر والرابط الرسمي وشعار مربع.\nاربطه من صفحات المنتج حتى تتعرّف أنظمة البحث والذكاء الاصطناعي على العلامة.",
  "schema-breadcrumb":
    "أضف مخطط BreadcrumbList يعكس المسار: الرئيسية ← الفئة ← المنتج.\nاعرض نفس المسار كروابط ظاهرة أعلى صفحة المنتج.",
  faq:
    "أضف 5–8 أسئلة شائعة يسألها المشتري فعليًا (الشحن، المقاس، المكونات، الإرجاع) مع إجابات مباشرة.\nضع قسم الأسئلة في HTML ظاهر، لا داخل تبويب مخفي فقط.\nأضف مخطط FAQPage JSON-LD لنفس الأسئلة حتى يسهل الاستشهاد بها في المساعدات الذكية.",
  "faq-schema":
    "حوّل الأسئلة والأجوبة الظاهرة حاليًا إلى مخطط FAQPage JSON-LD.\nكل سؤال = Question.name وكل جواب = acceptedAnswer.text بنفس الصياغة الظاهرة.\nاختبر المخطط بعد النشر حتى تقرأه محركات الإجابة.",
  brand:
    "أظهر اسم العلامة التجارية بوضوح بجانب اسم المنتج وفي الترويسة.\nأضف brand في مخطط Product JSON-LD.\nاربط الشعار بصفحة المتجر أو سياسة الضمان إن وُجدت.",
  content:
    "وسّع محتوى الصفحة بفقرات قصيرة وعناوين فرعية وقوائم نقطية تغطي الفوائد والمواصفات والاستخدام.\nاجعل النص كافيًا للإجابة عن أسئلة المشتري دون الاعتماد على الصور وحدها.",
  headings:
    "استخدم H1 واحدًا لاسم المنتج، ثم H2/H3 لأقسام مثل الفوائد والمواصفات وطريقة الاستخدام والأسئلة الشائعة.\nتجنّب صفحة بلا عناوين أو بعناوين كلها بنفس المستوى.",
  links:
    "أضف روابط داخلية إلى منتجات ذات صلة وصفحة الفئة ودليل الاستخدام أو السياسات.\nاستخدم نص رابط وصفيًا (ليس «اضغط هنا»).",
  entities:
    "أظهر في النص الظاهر: اسم المنتج، العلامة، السعر، والفئة إن وُجدت.\nكرر هذه الكيانات في Product JSON-LD حتى توصي المساعدات الذكية بالمنتج بدقة.",
  clarity:
    "أضف جملة في أعلى الصفحة: لمن هذا المنتج وما المشكلة التي يحلّها في سطر واحد.\nمثال: «سيروم للبشرة الجافة يمنح ترطيبًا يدوم 24 ساعة».",
};

export function isGenericSolution(text: string | null | undefined): boolean {
  const value = (text ?? "").trim();
  if (!value) return true;
  return GENERIC_SOLUTION_RE.some((re) => re.test(value));
}

export function isVagueProblem(text: string | null | undefined): boolean {
  const value = (text ?? "").trim();
  if (!value) return true;
  return VAGUE_PROBLEM_RE.some((re) => re.test(value));
}

export function findingTopic(text: string): FindingTopic {
  const t = text.toLowerCase();

  if (
    /الأسئلة الشائعة|أسئلة شائعة|\bfaq\b|faqpage/.test(t) &&
    /بدون مخطط|بدون faq/.test(t)
  ) {
    return "faq-schema";
  }
  if (/الأسئلة الشائعة|أسئلة شائعة|\bfaq\b|faqpage/.test(t)) return "faq";

  if (/breadcrumb|مسار التنقل/.test(t)) return "schema-breadcrumb";
  if (/organization|مخطط المؤسسة|العلامة التجارية مفقود/.test(t) && /مخطط|schema|json/.test(t)) {
    return "schema-org";
  }
  if (/مخطط المنتج|product json-ld|product schema/.test(t)) return "schema-product";
  if (/schema\.org|json-ld|jsonld|بيانات منظمة|أنواع schema|\bschema\b/.test(t)) {
    return "schema-generic";
  }

  if (/كيانات المنتج|العلامة، السعر/.test(t)) return "entities";
  if (/مراجعات|تقييمات|\breviews?\b|aggregaterating/.test(t)) return "reviews";
  if (/طرق الدفع|مدى|تابي|تمارا|apple pay|الدفع عند الاستلام/.test(t)) return "payments";
  if (/استبدال/.test(t)) return "exchange";
  if (/إرجاع|الاسترجاع|return policy/.test(t)) return "returns";
  if (/شحن|التوصيل|shipping/.test(t)) return "shipping";
  if (/سعر|price|offer/.test(t)) return "price";
  if (/cta|دعوة الشراء|زر الشراء|أضف إلى السلة/.test(t)) return "cta";
  if (/og:image|صورة منتج|صور كافية|product image/.test(t)) return "image";
  if (/عنوان الصفحة|title/.test(t) && /مفقود|فارغ|missing/.test(t)) return "title";
  if (/وصف تعريف|meta description|og:description/.test(t)) return "meta";
  if (/وصف المنتج/.test(t)) return "description";
  if (/هوية العلامة|العلامة التجارية غير واضحة/.test(t)) return "brand";
  if (/h1|عناوين|هيكل العناوين/.test(t)) return "headings";
  if (/روابط داخلية|internal link/.test(t)) return "links";
  if (/عبارة فائدة|جمهور/.test(t)) return "clarity";
  if (/محتوى الصفحة قليل|المحتوى النصي ضعيف|غير منظم/.test(t)) return "content";
  if (/مخطط المؤسسة/.test(t)) return "schema-org";

  return "other";
}

export function solutionForFinding(problem: string, _pillar?: ScorePillar): string {
  const topic = findingTopic(problem);
  if (topic !== "other") return SOLUTIONS[topic];
  const trimmed = problem.trim();
  if (!trimmed) {
    return "حدّد العنصر الناقص على صفحة المنتج، طبّق التعديل في لوحة المتجر، ثم انشر الصفحة وتحقق منها مباشرة.";
  }
  return `عالج المشكلة التالية على صفحة المنتج بخطوات واضحة يمكن تنفيذها اليوم:\n${trimmed}\nبعد التعديل انشر الصفحة وتحقق أن النص الظاهر والبيانات المنظمة متطابقان.`;
}

export function enrichRecommendation(rec: Recommendation): Recommendation | null {
  const problem = (rec.problem || "").trim();
  if (isVagueProblem(problem)) return null;

  const solution = isGenericSolution(rec.solution)
    ? solutionForFinding(problem, rec.pillar)
    : rec.solution.trim();

  return { ...rec, problem, solution };
}

export function dedupeByFindingTopic(recs: Recommendation[]): Recommendation[] {
  const present = new Set(recs.map((r) => findingTopic(r.problem)));
  const drop = new Set<FindingTopic>();
  for (const [keeper, subsumed] of Object.entries(SUBSUMED_BY) as [
    FindingTopic,
    FindingTopic[],
  ][]) {
    if (!present.has(keeper)) continue;
    for (const extra of subsumed) drop.add(extra);
  }

  const byTopic = new Map<FindingTopic, Recommendation>();
  const others: Recommendation[] = [];

  for (const rec of recs) {
    const topic = findingTopic(rec.problem);
    if (topic === "other") {
      others.push(rec);
      continue;
    }
    if (drop.has(topic)) continue;
    const existing = byTopic.get(topic);
    if (!existing) {
      byTopic.set(topic, rec);
      continue;
    }
    const preferNew =
      rec.severity === "critical" && existing.severity !== "critical"
        ? true
        : rec.solution.length > existing.solution.length && rec.severity === existing.severity;
    if (preferNew) byTopic.set(topic, rec);
  }

  return [...byTopic.values(), ...others];
}
