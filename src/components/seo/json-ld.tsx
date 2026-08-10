type JsonLdProps = {
  data: Record<string, unknown> | readonly Record<string, unknown>[];
};

/** Server-safe JSON-LD emitter for public SEO / GEO surfaces. */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
