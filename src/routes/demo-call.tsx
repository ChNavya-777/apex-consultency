import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero, Section, SectionHeader } from "@/components/site/shared";

const title = "Book a Demo Call — APEX Global Education";
const description =
  "Schedule a one-to-one demo call with an APEX counsellor. The booking form will be available here shortly.";

export const Route = createFileRoute("/demo-call")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/demo-call" },
    ],
    links: [{ rel: "canonical", href: "/demo-call" }],
  }),
  component: DemoCallPage,
});

function DemoCallPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Demo Call" }]}
        eyebrow="Coming soon"
        title="Book a Demo Call"
        text="A dedicated demo-call booking flow is on its way. For now, you can still request a free consultation or speak to us directly."
      />

      <Section>
        <SectionHeader
          eyebrow="Placeholder"
          title="Demo Call Form — Under Construction"
          text="This page will soon let you pick a convenient time and speak with an APEX counsellor about your study-abroad plans."
          align="center"
        />
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            In the meantime, you can book a free consultation through your student account or contact us by phone or email.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold">
              <Link to="/student/login">Login / Sign Up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact APEX</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
