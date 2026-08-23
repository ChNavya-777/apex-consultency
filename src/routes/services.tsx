import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection } from "@/components/site/shared";
import { ServiceCard } from "@/components/site/cards";
import { services } from "@/data/services";
import { journeySteps } from "@/data/site";

const title = "Study Abroad Services — Counselling to Pre-Departure | APEX";
const description =
  "Profile evaluation, course counselling, university shortlisting, application assistance, scholarship and visa guidance, and pre-departure support.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

function Services() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Services" }]}
        eyebrow="Services"
        title="Guidance at Every Stage, Not Just at Application Time"
        text="Seven connected services that take a student from an uncertain starting point to a prepared departure."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Book a Free Consultation</Link>
        </Button>
        <Button asChild variant="onDark" size="lg">
          <Link to="/destinations">Explore Destinations</Link>
        </Button>
      </PageHero>

      <Section>
        <SectionHeader
          eyebrow="What we do"
          title="Our Study Abroad Services"
          text="Each service has a clear output, so you always know what you are receiving."
          align="center"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <ServiceCard key={s.slug} s={s} index={i} />
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="Sequence" title="How the Services Fit Together" align="center" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((s) => (
            <li key={s.no} className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <span className="font-display text-2xl font-bold text-gold-soft">{s.no}</span>
              <h3 className="mt-2 font-display text-base font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <CTASection />
    </>
  );
}
