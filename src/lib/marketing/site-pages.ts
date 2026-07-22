import type { PageSection } from "@/components/marketing/content-page";
import type { Localized } from "@/lib/marketing/localized";

const L = (en: string, ar: string): Localized => ({ en, ar });

export const HOW_IT_WORKS_CONTENT = {
  title: L("How it works", "كيف يعمل"),
  subtitle: L(
    "Paste a product URL and get a full conversion, SEO, GEO, and trust audit in under 60 seconds.",
    "الصق رابط منتج واحصل على تحليل كامل للتحويل وSEO وGEO والثقة في أقل من 60 ثانية."
  ),
  sections: [
    {
      heading: L("Three steps to a better product page", "ثلاث خطوات لصفحة منتج أفضل"),
      paragraphs: [
        L(
          "convaudit turns any public product URL into an actionable optimization report. No code, no agency, no waiting weeks for results.",
          "convaudit يحوّل أي رابط منتج عام إلى تقرير تحسين قابل للتنفيذ. بدون كود، بدون وكالة، وبدون انتظار أسابيع."
        ),
      ],
      bullets: [
        L("Paste your product page URL — Shopify, WooCommerce, Salla, Zid, or any public store.", "الصق رابط صفحة المنتج — Shopify أو WooCommerce أو Salla أو Zid أو أي متجر عام."),
        L("Our engines crawl and analyze 14+ dimensions: CRO, SEO, GEO visibility, trust, performance, and more.", "محركاتنا تزحف وتحلل أكثر من 14 بُعداً: CRO وSEO وظهور GEO والثقة والأداء وغيرها."),
        L("Receive prioritized fixes, AI-generated copy, and a PDF report you can share with your team.", "احصل على إصلاحات مرتبة حسب الأولوية، ونصوص مولّدة بالذكاء الاصطناعي، وتقرير PDF لمشاركته مع فريقك."),
      ],
    },
    {
      heading: L("What happens during an audit", "ماذا يحدث أثناء التحليل"),
      paragraphs: [
        L(
          "Firecrawl renders your page like a real browser. Gemini interprets the content for AI-readiness. Our rule engines score conversion blockers, metadata gaps, schema markup, trust signals, and mobile UX.",
          "Firecrawl يعرض صفحتك كمتصفح حقيقي. Gemini يفسّر المحتوى لجاهزية AI. محركات القواعد لدينا تقيّم عوائق التحويل، فجوات البيانات الوصفية، Schema، إشارات الثقة، وتجربة الجوال."
        ),
        L(
          "Each issue includes severity, business impact, and a plain-language explanation so you know exactly what to fix first.",
          "كل مشكلة تتضمن مستوى الخطورة، والأثر على الأعمال، وشرحاً بلغة بسيطة لتعرف بالضبط ما الذي تصلحه أولاً."
        ),
      ],
    },
    {
      heading: L("After your first audit", "بعد أول تحليل"),
      paragraphs: [
        L(
          "Upgrade to Pro for full-site crawls, competitor benchmarking, AI content generation, PDF exports, and continuous monitoring with email alerts when scores drop.",
          "ترقّ إلى Pro للزحف الكامل للموقع، ومقارنة المنافسين، وتوليد المحتوى بالذكاء الاصطناعي، وتصدير PDF، والمراقبة المستمرة مع تنبيهات بريدية عند انخفاض الدرجات."
        ),
      ],
      bullets: [
        L("Re-run audits after fixes to track score improvements over time.", "أعد التحليل بعد الإصلاحات لتتبع تحسن الدرجات بمرور الوقت."),
        L("Use the AI Generator to rewrite titles, meta descriptions, FAQs, and product copy.", "استخدم مولد AI لإعادة كتابة العناوين والوصف التعريفي وFAQs ونص المنتج."),
        L("Set up Watch to get notified when competitors or your own pages change.", "فعّل المراقبة لتصلك إشعارات عند تغيّر صفحات المنافسين أو صفحاتك."),
      ],
    },
  ] satisfies PageSection[],
};

export const AI_GENERATOR_CONTENT = {
  title: L("AI Generator", "مولد AI"),
  subtitle: L(
    "Gemini-powered copy fixes tailored to your audit findings — titles, descriptions, FAQs, and product content.",
    "إصلاحات نصية مدعومة بـ Gemini مخصصة لنتائج تحليلك — العناوين والأوصاف وFAQs ومحتوى المنتج."
  ),
  sections: [
    {
      heading: L("Fix issues with one click", "أصلح المشاكل بنقرة واحدة"),
      paragraphs: [
        L(
          "Every audit surfaces specific gaps — a weak meta title, missing FAQ schema, thin product description, or unclear value proposition. The AI Generator reads your page context and audit results, then produces ready-to-paste improvements.",
          "كل تحليل يكشف فجوات محددة — عنوان meta ضعيف، Schema FAQ مفقود، وصف منتج رقيق، أو عرض قيمة غير واضح. مولد AI يقرأ سياق صفحتك ونتائج التحليل، ثم ينتج تحسينات جاهزة للنسخ."
        ),
      ],
    },
    {
      heading: L("What you can generate", "ما يمكنك توليده"),
      bullets: [
        L("SEO meta titles and descriptions optimized for click-through and character limits.", "عناوين meta وأوصاف SEO محسّنة للنقر وحدود الأحرف."),
        L("FAQ blocks with structured Q&A that improve GEO visibility in ChatGPT and Perplexity.", "كتل FAQ بأسئلة وأجوبة منظمة تحسّن ظهور GEO في ChatGPT وPerplexity."),
        L("Product descriptions rewritten for clarity, benefits, and AI citability.", "أوصاف منتجات معاد كتابتها للوضوح والفوائد وقابلية الاقتباس من AI."),
        L("Trust copy suggestions — shipping, returns, and policy summaries for product pages.", "اقتراحات نصوص ثقة — الشحن والإرجاع وملخصات السياسات لصفحات المنتج."),
      ],
    },
    {
      heading: L("Where to use it", "أين تستخدمه"),
      paragraphs: [
        L(
          "After any audit, open the Generate tab on your report to create fixes issue-by-issue. Pro users also get the standalone Content Improver tool for bulk rewrites.",
          "بعد أي تحليل، افتح تبويب Generate في تقريرك لإنشاء إصلاحات لكل مشكلة. مستخدمو Pro يحصلون أيضاً على أداة Content Improver المنفصلة لإعادة الكتابة الجماعية."
        ),
        L(
          "All generated content is grounded in your actual page data — not generic templates — so it matches your brand voice and product specs.",
          "كل المحتوى المولّد مبني على بيانات صفحتك الفعلية — وليس قوالب عامة — ليتوافق مع أسلوب علامتك ومواصفات منتجك."
        ),
      ],
    },
  ] satisfies PageSection[],
};

export const GEO_VISIBILITY_CONTENT = {
  title: L("GEO Visibility", "الظهور في GEO"),
  subtitle: L(
    "Generative Engine Optimization — get your products cited by ChatGPT, Perplexity, and AI search.",
    "تحسين محركات التوليد — اجعل منتجاتك تُقتبس في ChatGPT وPerplexity والبحث بالذكاء الاصطناعي."
  ),
  sections: [
    {
      heading: L("Why GEO matters for e-commerce", "لماذا GEO مهم للتجارة الإلكترونية"),
      paragraphs: [
        L(
          "Shoppers increasingly ask AI assistants for product recommendations instead of scrolling Google results. If your store isn't structured for AI to read, cite, and recommend — you're invisible in the fastest-growing discovery channel.",
          "المتسوقون يطلبون توصيات المنتجات من مساعدي AI بدلاً من تصفح نتائج Google. إذا لم يكن متجرك مهيأ لقراءة AI والاقتباس والتوصية — فأنت غير مرئي في أسرع قناة اكتشاف نمواً."
        ),
        L(
          "GEO (Generative Engine Optimization) is the practice of making your product pages machine-readable, quotable, and authoritative so AI models surface your brand in answers.",
          "GEO (تحسين محركات التوليد) هو جعل صفحات منتجاتك قابلة للقراءة آلياً والاقتباس والموثوقية حتى تعرض نماذج AI علامتك في الإجابات."
        ),
      ],
    },
    {
      heading: L("What convaudit checks", "ما يفحصه convaudit"),
      bullets: [
        L("Structured data — Product, FAQ, Organization, and Breadcrumb schema.", "البيانات المنظمة — Product وFAQ وOrganization وBreadcrumb schema."),
        L("FAQ coverage — real buyer questions answered in plain text, not buried in images.", "تغطية FAQ — أسئلة المشترين الحقيقية مجابة بنص واضح، وليس مدفونة في صور."),
        L("Entity clarity — brand name, product name, and category signals AI can extract.", "وضوح الكيان — اسم العلامة واسم المنتج وإشارات الفئة التي يستخرجها AI."),
        L("Quotable content — specs, comparisons, and use-case paragraphs AI can cite verbatim.", "محتوى قابل للاقتباس — مواصفات ومقارنات وفقرات حالات استخدام يمكن لـ AI اقتباسها."),
        L("Citation readiness — depth, freshness, and internal linking that build topical authority.", "جاهزية الاقتباس — عمق وحداثة وروابط داخلية تبني سلطة الموضوع."),
      ],
    },
    {
      heading: L("Improve your GEO score", "حسّن درجة GEO"),
      paragraphs: [
        L(
          "Run a free audit on your top product URL to see your GEO score and top recommendations. Fix the highest-impact issues first — FAQ schema and structured product data typically move the needle fastest.",
          "أجرِ تحليلاً مجانياً على أهم رابط منتج لرؤية درجة GEO وأهم التوصيات. أصلح المشاكل الأعلى تأثيراً أولاً — FAQ schema وبيانات المنتج المنظمة عادة تحقق أسرع تحسن."
        ),
        L(
          "Re-audit monthly on Pro to track visibility gains as AI search algorithms and your content evolve.",
          "أعد التحليل شهرياً على Pro لتتبع مكاسب الظهور مع تطور خوارزميات البحث بالAI ومحتواك."
        ),
      ],
    },
  ] satisfies PageSection[],
};

export const ABOUT_CONTENT = {
  title: L("About convaudit", "حول convaudit"),
  subtitle: L(
    "AI-powered e-commerce intelligence built for merchants who want to win on conversion, search, and AI discovery.",
    "ذكاء تجارة إلكترونية مدعوم بالAI للتجار الذين يريدون الفوز في التحويل والبحث واكتشاف AI."
  ),
  sections: [
    {
      heading: L("Our mission", "مهمتنا"),
      paragraphs: [
        L(
          "convaudit helps online merchants audit, benchmark, and optimize every product page — across conversion, SEO, GEO visibility, and trust — in seconds instead of weeks.",
          "convaudit يساعد التجار الإلكترونيين على تحليل ومقارنة وتحسين كل صفحة منتج — عبر التحويل وSEO وظهور GEO والثقة — في ثوانٍ بدلاً من أسابيع."
        ),
        L(
          "We built convaudit for the MENA e-commerce ecosystem — Shopify, WooCommerce, Salla, and Zid stores — with bilingual EN/AR support from day one.",
          "بنينا convaudit لمنظومة التجارة الإلكترونية في MENA — متاجر Shopify وWooCommerce وSalla وZid — مع دعم ثنائي اللغة EN/AR من اليوم الأول."
        ),
      ],
    },
    {
      heading: L("What we believe", "ما نؤمن به"),
      bullets: [
        L("Every merchant deserves enterprise-grade optimization tools without enterprise pricing.", "كل تاجر يستحق أدوات تحسين بمستوى المؤسسات بدون أسعار المؤسسات."),
        L("AI should explain its recommendations in plain language, not hide behind black-box scores.", "يجب أن يشرح AI توصياته بلغة بسيطة، ولا يختبئ خلف درجات صندوق أسود."),
        L("GEO visibility is the next SEO — and merchants who start now will compound their advantage.", "ظهور GEO هو SEO التالي — والتجار الذين يبدأون الآن ستراكم ميزتهم."),
      ],
    },
    {
      heading: L("Powered by best-in-class AI", "مدعوم بأفضل AI"),
      paragraphs: [
        L(
          "convaudit combines Firecrawl for accurate page rendering, Google Gemini for content analysis and generation, and Supabase for secure, scalable infrastructure.",
          "convaudit يجمع Firecrawl لعرض الصفحات بدقة، وGoogle Gemini لتحليل وتوليد المحتوى، وSupabase لبنية تحتية آمنة وقابلة للتوسع."
        ),
      ],
    },
  ] satisfies PageSection[],
};

export const CONTACT_CONTENT = {
  title: L("Contact us", "اتصل بنا"),
  subtitle: L(
    "Questions about audits, billing, or partnerships? We're here to help.",
    "أسئلة حول التحليلات أو الفوترة أو الشراكات؟ نحن هنا للمساعدة."
  ),
  sections: [
    {
      heading: L("Support", "الدعم"),
      paragraphs: [
        L(
          "For product help, audit questions, or account issues, email our support team. We typically respond within one business day.",
          "للمساعدة في المنتج أو أسئلة التحليل أو مشاكل الحساب، راسل فريق الدعم. نرد عادة خلال يوم عمل واحد."
        ),
      ],
      bullets: [
        L("Email: support@convaudit.ai", "البريد: support@convaudit.ai"),
        L("Hours: Sunday–Thursday, 9 AM – 6 PM (Cairo / Riyadh)", "الساعات: الأحد–الخميس، 9 ص – 6 م (القاهرة / الرياض)"),
      ],
    },
    {
      heading: L("Sales & partnerships", "المبيعات والشراكات"),
      paragraphs: [
        L(
          "Interested in agency partnerships, volume licensing, or custom integrations? Reach out to discuss how convaudit can fit your workflow.",
          "مهتم بشراكات الوكالات أو التراخيص بالجملة أو التكاملات المخصصة؟ تواصل لمناقشة كيف يناسب convaudit سير عملك."
        ),
      ],
      bullets: [
        L("Email: hello@convaudit.ai", "البريد: hello@convaudit.ai"),
      ],
    },
    {
      heading: L("Before you write", "قبل أن تراسلنا"),
      paragraphs: [
        L(
          "Check our Docs and Blog for guides on scores, AI generation, and GEO optimization. Most setup questions are answered there.",
          "راجع Docs والمدونة للأدلة حول الدرجات وتوليد AI وتحسين GEO. معظم أسئلة الإعداد مجابة هناك."
        ),
      ],
    },
  ] satisfies PageSection[],
};

export const PRIVACY_CONTENT = {
  title: L("Privacy Policy", "سياسة الخصوصية"),
  subtitle: L(
    "Last updated: July 2026. How convaudit collects, uses, and protects your data.",
    "آخر تحديث: يوليو 2026. كيف يجمع convaudit بياناتك ويستخدمها ويحميها."
  ),
  sections: [
    {
      heading: L("Information we collect", "المعلومات التي نجمعها"),
      paragraphs: [
        L(
          "When you create an account, we collect your email address and optional profile details. When you run an audit, we store the URLs you submit and the resulting analysis data.",
          "عند إنشاء حساب، نجمع بريدك الإلكتروني وتفاصيل الملف الشخصي الاختيارية. عند تشغيل تحليل، نخزن الروابط التي ترسلها وبيانات التحليل الناتجة."
        ),
      ],
      bullets: [
        L("Account data: email, name, authentication tokens via Supabase Auth.", "بيانات الحساب: البريد والاسم ورموز المصادقة عبر Supabase Auth."),
        L("Usage data: audit URLs, scores, generated content, and plan usage counters.", "بيانات الاستخدام: روابط التحليل والدرجات والمحتوى المولّد وعدادات استخدام الخطة."),
        L("Payment data: processed by Kashier; we do not store full card numbers.", "بيانات الدفع: تُعالج عبر Kashier؛ لا نخزن أرقام البطاقات كاملة."),
      ],
    },
    {
      heading: L("How we use your data", "كيف نستخدم بياناتك"),
      bullets: [
        L("Provide audit, AI generation, monitoring, and billing services.", "تقديم خدمات التحليل وتوليد AI والمراقبة والفوترة."),
        L("Improve product quality through aggregated, anonymized analytics.", "تحسين جودة المنتج عبر تحليلات مجمّعة ومجهولة."),
        L("Send transactional emails (audit complete, alerts, billing receipts).", "إرسال رسائل معاملات (اكتمال التحليل، تنبيهات، إيصالات الفوترة)."),
      ],
    },
    {
      heading: L("Third-party services", "خدمات طرف ثالث"),
      paragraphs: [
        L(
          "We use Supabase (hosting & auth), Google Gemini (AI analysis), Firecrawl (page crawling), Kashier (payments), and Resend (email). Each provider processes data under their own privacy policies and our data processing agreements.",
          "نستخدم Supabase (الاستضافة والمصادقة)، Google Gemini (تحليل AI)، Firecrawl (زحف الصفحات)، Kashier (المدفوعات)، وResend (البريد). كل مزود يعالج البيانات وفق سياسات الخصوصية الخاصة به واتفاقيات معالجة البيانات لدينا."
        ),
      ],
    },
    {
      heading: L("Your rights", "حقوقك"),
      paragraphs: [
        L(
          "You may request access, correction, or deletion of your personal data by contacting support@convaudit.ai. You can delete your account from Settings at any time.",
          "يمكنك طلب الوصول أو التصحيح أو حذف بياناتك الشخصية عبر support@convaudit.ai. يمكنك حذف حسابك من الإعدادات في أي وقت."
        ),
      ],
    },
  ] satisfies PageSection[],
};

export const TERMS_CONTENT = {
  title: L("Terms of Service", "شروط الخدمة"),
  subtitle: L(
    "Last updated: July 2026. By using convaudit, you agree to these terms.",
    "آخر تحديث: يوليو 2026. باستخدام convaudit، فإنك توافق على هذه الشروط."
  ),
  sections: [
    {
      heading: L("Service description", "وصف الخدمة"),
      paragraphs: [
        L(
          "convaudit provides automated website and product page audits, AI-generated content suggestions, monitoring, and related e-commerce optimization tools on a subscription basis.",
          "convaudit يقدم تحليلات آلية لمواقع وصفحات المنتجات، اقتراحات محتوى بالAI، مراقبة، وأدوات تحسين تجارة إلكترونية ذات صلة على أساس اشتراك."
        ),
      ],
    },
    {
      heading: L("Acceptable use", "الاستخدام المقبول"),
      bullets: [
        L("You may only audit URLs you own or have permission to analyze.", "يمكنك تحليل روابط تملكها أو لديك إذن لتحليلها فقط."),
        L("Do not use the service to scrape, attack, or overload third-party websites.", "لا تستخدم الخدمة لاستخراج أو مهاجمة أو إoverload مواقع طرف ثالث."),
        L("AI-generated content is provided as suggestions — you are responsible for reviewing before publishing.", "المحتوى المولّد بالAI يُقدّم كاقتراحات — أنت مسؤول عن المراجعة قبل النشر."),
      ],
    },
    {
      heading: L("Subscriptions & billing", "الاشتراكات والفوترة"),
      paragraphs: [
        L(
          "Paid plans renew automatically unless cancelled before the billing date. Usage limits apply per plan tier as described on the Pricing page. Failed payments may result in downgrade to the free tier.",
          "الخطط المدفوعة تتجدد تلقائياً ما لم تُلغَ قبل تاريخ الفوترة. حدود الاستخدام تنطبق حسب مستوى الخطة كما هو موضح في صفحة الأسعار. فشل الدفع قد يؤدي إلى التخفيض للخطة المجانية."
        ),
      ],
    },
    {
      heading: L("Limitation of liability", "حدود المسؤولية"),
      paragraphs: [
        L(
          "convaudit provides analysis and recommendations for informational purposes. We do not guarantee specific ranking, traffic, or revenue outcomes. Our liability is limited to the amount paid in the 12 months preceding any claim.",
          "convaudit يقدم تحليلات وتوصيات لأغراض معلوماتية. لا نضمن نتائج ترتيب أو زيارات أو إيرادات محددة. مسؤوليتنا محدودة بالمبلغ المدفوع في الـ 12 شهراً السابقة لأي مطالبة."
        ),
      ],
    },
  ] satisfies PageSection[],
};

export const REFUND_CONTENT = {
  title: L("Refund Policy", "سياسة الاسترداد"),
  subtitle: L(
    "Last updated: July 2026. Refund eligibility, cancellations, and billing for convaudit.",
    "آخر تحديث: يوليو 2026. أهلية الاسترداد والإلغاء والفوترة لمنصة convaudit."
  ),
  sections: [
    {
      heading: L("Overview", "نظرة عامة"),
      paragraphs: [
        L(
          "convaudit is a subscription-based software-as-a-service (SaaS) platform that provides AI-powered product page audits, optimization insights, and related tools. By purchasing a paid plan, you agree to the billing and refund terms described in this policy.",
          "convaudit هي منصة برمجيات كخدمة (SaaS) قائمة على الاشتراك تقدّم تحليلات صفحات المنتجات بالذكاء الاصطناعي ورؤى التحسين والأدوات ذات الصلة. بشراء خطة مدفوعة، فإنك توافق على شروط الفوترة والاسترداد الموضحة في هذه السياسة."
        ),
        L(
          "This Refund Policy explains when refunds may be available, how cancellations work, and how to contact us about billing issues. It should be read together with our Terms of Service.",
          "توضّح سياسة الاسترداد هذه متى قد يتوفر الاسترداد، وكيف يعمل الإلغاء، وكيف تتواصل معنا بشأن مشاكل الفوترة. يجب قراءتها مع شروط الخدمة."
        ),
      ],
    },
    {
      heading: L("Free Plan", "الخطة المجانية"),
      paragraphs: [
        L(
          "The Free plan is permanently free of charge. Because no payment is collected for Free plan usage, refunds do not apply to the Free plan.",
          "الخطة المجانية مجانية بشكل دائم. وبما أنه لا يتم تحصيل أي مدفوعات لاستخدام الخطة المجانية، فإن الاسترداد لا ينطبق عليها."
        ),
      ],
    },
    {
      heading: L("Monthly Subscription", "الاشتراك الشهري"),
      paragraphs: [
        L(
          "You may cancel a monthly subscription at any time from your account billing settings. After cancellation, you retain access to paid features until the end of the current billing period.",
          "يمكنك إلغاء الاشتراك الشهري في أي وقت من إعدادات الفوترة في حسابك. بعد الإلغاء، تحتفظ بالوصول إلى الميزات المدفوعة حتى نهاية فترة الفوترة الحالية."
        ),
        L(
          "Once a monthly subscription period has started, we do not issue prorated refunds for unused time, unless required by applicable law.",
          "بمجرد بدء فترة الاشتراك الشهري، لا نقدّم استرداداً متناسباً عن الوقت غير المستخدم، ما لم يقتضِ القانون المعمول به خلاف ذلك."
        ),
      ],
    },
    {
      heading: L("Annual Subscription", "الاشتراك السنوي"),
      paragraphs: [
        L(
          "Annual subscriptions include a 14-day money-back guarantee from the date of the initial annual charge, provided all of the following conditions are met:",
          "تتضمن الاشتراكات السنوية ضمان استرداد خلال 14 يوماً من تاريخ الرسوم السنوية الأولى، شريطة استيفاء جميع الشروط التالية:"
        ),
      ],
      bullets: [
        L("The customer has not abused the service or violated our Terms of Service.", "لم يُسيء العميل استخدام الخدمة أو ينتهك شروط الخدمة."),
        L("Usage remains within reasonable limits consistent with normal business use of the platform.", "يظل الاستخدام ضمن حدود معقولة تتوافق مع الاستخدام التجاري العادي للمنصة."),
        L("No fraud, chargeback abuse, or other dishonest activity is detected in connection with the account or payment.", "لم يُكتشف أي احتيال أو إساءة استرداد أو نشاط غير نزيه مرتبط بالحساب أو الدفع."),
      ],
    },
    {
      heading: L("Non-refundable cases", "حالات غير قابلة للاسترداد"),
      paragraphs: [
        L(
          "Except where required by law, refunds are not available in the following situations:",
          "باستثناء ما يقتضيه القانون، لا تتوفر الاستردادات في الحالات التالية:"
        ),
      ],
      bullets: [
        L("Change of mind after heavy usage of the platform or AI features during the subscription period.", "تغيير الرأي بعد الاستخدام المكثف للمنصة أو ميزات الذكاء الاصطناعي خلال فترة الاشتراك."),
        L("Failure to cancel before an automatic renewal charge is processed.", "عدم الإلغاء قبل معالجة رسوم التجديد التلقائي."),
        L("Violation of our Terms of Service.", "انتهاك شروط الخدمة."),
        L("Abuse of AI credits, rate limits, or other metered resources.", "إساءة استخدام أرصدة الذكاء الاصطناعي أو حدود المعدل أو الموارد المقاسة الأخرى."),
      ],
    },
    {
      heading: L("Billing Errors", "أخطاء الفوترة"),
      paragraphs: [
        L(
          "If you believe you were charged in error—including duplicate charges or accidental payments—contact us promptly with your account email, transaction details, and a brief description of the issue.",
          "إذا كنت تعتقد أنه تم خصم رسوم بالخطأ — بما في ذلك الرسوم المكررة أو المدفوعات العرضية — فتواصل معنا فوراً مع بريد حسابك وتفاصيل المعاملة ووصفاً موجزاً للمشكلة."
        ),
        L(
          "We will fully investigate confirmed billing errors and issue a refund to the original payment method when the error is verified.",
          "سنحقق بالكامل في أخطاء الفوترة المؤكدة ونصدر استرداداً إلى طريقة الدفع الأصلية عند التحقق من الخطأ."
        ),
      ],
    },
    {
      heading: L("Contact", "التواصل"),
      paragraphs: [
        L(
          "To request a refund, report a billing error, or ask a question about this policy, email us at support@yourdomain.com. Please include the email address associated with your convaudit account and any relevant invoice or transaction identifiers.",
          "لطلب استرداد أو الإبلاغ عن خطأ في الفوترة أو طرح سؤال حول هذه السياسة، راسلنا على support@yourdomain.com. يُرجى تضمين عنوان البريد المرتبط بحساب convaudit وأي معرفات فاتورة أو معاملة ذات صلة."
        ),
        L(
          "Approved refunds are typically processed within 5–10 business days, though timing may vary depending on your payment provider.",
          "تُعالَج الاستردادات المعتمدة عادةً خلال 5–10 أيام عمل، وقد يختلف التوقيت حسب مزوّد الدفع."
        ),
      ],
    },
    {
      heading: L("Consumer protection notice", "إشعار حماية المستهلك"),
      paragraphs: [
        L(
          "Nothing in this Refund Policy limits any non-waivable rights you may have under local consumer protection laws. Where applicable law requires a broader refund right than described here, that law will prevail.",
          "لا يقيّد أي شيء في سياسة الاسترداد هذه أي حقوق غير قابلة للتنازل قد تتمتع بها بموجب قوانين حماية المستهلك المحلية. وحيثما يقتضي القانون المعمول به حق استرداد أوسع مما هو موضح هنا، يسود ذلك القانون."
        ),
      ],
    },
  ] satisfies PageSection[],
};
