import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, PageHero, CTASection, Note } from "@/components/site/shared";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import { faqs, faqCategories } from "@/data/faqs";
import { GENERAL_GUIDANCE_NOTE } from "@/data/site";

const title = "Study Abroad FAQs — Admissions, Exams, Visas & Costs | APEX";
const description =
  "Answers to the questions students and parents ask most about studying abroad: eligibility, IELTS, university choice, applications, visas and costs.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
  }),
  component: FaqPage,
});

const ALL = "All";

function FaqPage() {
  const [category, setCategory] = useState<string>(ALL);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter(
      (f) =>
        (category === ALL || f.category === category) &&
        (q === "" || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)),
    );
  }, [category, query]);

  return (
    <>
      <PageHero
        crumbs={[{ label: "FAQ" }]}
        eyebrow="FAQ"
        title="Questions Students and Parents Ask Us"
        text="Straight answers, including the things we cannot promise. If your question isn't here, ask us directly."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/contact">Ask Your Own Question</Link>
        </Button>
      </PageHero>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <nav aria-label="FAQ categories" className="mt-6 flex flex-wrap gap-2 lg:flex-col">
              {[ALL, ...faqCategories].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={
                    category === c
                      ? "rounded-md bg-navy-deep px-4 py-2 text-left text-sm font-semibold text-primary-foreground"
                      : "rounded-md border border-border bg-card px-4 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {c}
                </button>
              ))}
            </nav>
          </aside>

          <div>
            <p className="mb-4 text-xs text-muted-foreground" role="status">
              {results.length} question{results.length === 1 ? "" : "s"}
            </p>
            <FAQAccordion items={results} idPrefix="faq-page" />
            <Note>{GENERAL_GUIDANCE_NOTE}</Note>
          </div>
        </div>
      </Section>

      <CTASection heading="Still Have Questions?" />
    </>
  );
}
