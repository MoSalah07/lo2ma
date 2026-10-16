import type { Graph, Thing, WithContext } from 'schema-dts';

/**
 * Structured data for search engines and AI answers, as a JSON-LD script. `<` is escaped, so no text inside can
 * end the script early. It is a data block, not code, so React never warns about it, even when it rebuilds a page.
 */
export function JsonLd({ data }: { data: Graph | WithContext<Thing> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
