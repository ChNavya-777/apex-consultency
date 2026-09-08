import { createFileRoute } from "@tanstack/react-router";
import { DemoCallForm } from "@/components/site/forms";
import { PageHero, Section } from "@/components/site/shared";

const title = "Book a Demo Call — APEX Global Education";
const description =
  "Request a one-to-one demo call with an APEX counsellor. Share your contact details and our team will reach out to schedule a convenient time.";

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
        eyebrow="One-to-one demo"
        title="Book a Demo Call"
        text="Tell us how to reach you. An APEX counsellor will call you back to confirm a time that works for you."
      />

      <Section>
        <div className="mx-auto max-w-2xl">
          <DemoCallForm />
        </div>
      </Section>
    </>
  );
}
