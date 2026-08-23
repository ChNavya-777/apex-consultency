import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection, Note } from "@/components/site/shared";
import { BlogCard } from "@/components/site/cards";
import { blogPosts, blogCategories } from "@/data/blog";
import { GENERAL_GUIDANCE_NOTE } from "@/data/site";

const title = "Study Abroad Resources & Guides | APEX Global Education";
const description =
  "Practical guides on planning your study-abroad journey: choosing a country, SOP writing, IELTS preparation, funding, visa documents and pre-departure steps.";

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/resources" },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
  }),
  component: ResourcesIndex,
});

const ALL = "All";

function ResourcesIndex() {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogPosts.filter(
      (p) =>
        (category === ALL || p.category === category) &&
        (q === "" || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)),
    );
  }, [category, query]);

  const featured = results[0];
  const rest = results.slice(1);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Resources" }]}
        eyebrow="Resource centre"
        title="Read Before You Apply"
        text="Guides written the way we explain things in counselling sessions — plainly, with the trade-offs included."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Ask a Counsellor Directly</Link>
        </Button>
      </PageHero>

      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="block w-full max-w-sm">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Search articles</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SOP, IELTS, visa, funding…"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <p className="text-xs text-muted-foreground" role="status">
            {results.length} article{results.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[ALL, ...blogCategories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={
                category === c
                  ? "rounded-full bg-navy-deep px-4 py-2 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {c}
            </button>
          ))}
        </div>

        {featured && (
          <div className="mt-10">
            <BlogCard p={featured} />
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <BlogCard key={p.slug} p={p} />
          ))}
        </div>

        {results.length === 0 && (
          <p className="mt-10 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No articles match that search yet.
          </p>
        )}

        <Note>{GENERAL_GUIDANCE_NOTE}</Note>
      </Section>

      <CTASection />
    </>
  );
}
