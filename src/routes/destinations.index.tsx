import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection, Note } from "@/components/site/shared";
import { DestinationCard } from "@/components/site/cards";
import { DestinationFinder } from "@/components/site/DestinationFinder";
import { destinations } from "@/data/destinations";
import { GENERAL_GUIDANCE_NOTE } from "@/data/site";

const title = "Study Abroad Destinations — USA, UK, Canada & More | APEX";
const description =
  "Compare leading study destinations: popular courses, intakes, indicative costs, admission expectations and scholarship routes for Indian students.";

export const Route = createFileRoute("/destinations/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/destinations" },
    ],
    links: [{ rel: "canonical", href: "/destinations" }],
  }),
  component: DestinationsIndex,
});

const regions = ["North America", "UK & Ireland", "Europe", "Asia-Pacific"] as const;

function DestinationsIndex() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Destinations" }]}
        eyebrow="Destinations"
        title="Choose the Country That Fits Your Profile"
        text="Each destination suits a different combination of academic record, budget and career plan. Here is an honest overview of what each one asks for."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Get a Destination Recommendation</Link>
        </Button>
      </PageHero>

      {regions.map((region, i) => {
        const list = destinations.filter((d) => d.region === region);
        if (list.length === 0) return null;
        return (
          <Section key={region} tone={i % 2 === 1 ? "surface" : "default"}>
            <SectionHeader eyebrow={region} title={`Studying in ${region}`} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((d) => (
                <DestinationCard key={d.slug} d={d} />
              ))}
            </div>
          </Section>
        );
      })}

      <Section tone="surface">
        <SectionHeader
          eyebrow="Prototype tool"
          title="Not Sure Which Country Suits You?"
          text="Answer four questions for an indicative direction. A counsellor reviews everything properly before a shortlist is made."
          align="center"
        />
        <div className="mx-auto max-w-4xl">
          <DestinationFinder />
        </div>
        <Note>{GENERAL_GUIDANCE_NOTE}</Note>
      </Section>

      <CTASection />
    </>
  );
}
