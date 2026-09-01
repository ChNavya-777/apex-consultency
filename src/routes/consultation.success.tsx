import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Section } from "@/components/site/shared";
import { Button } from "@/components/ui/button";

const title = "Consultation Booked Successfully | APEX Global Education";
const description =
  "Your consultation has been scheduled with APEX Global Education. Our counselling team will meet you at the time you selected.";

export const Route = createFileRoute("/consultation/success")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/consultation/success" }],
  }),
  component: ConsultationSuccess,
});

function ConsultationSuccess() {
  return (
    <Section>
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-8 text-center shadow-soft md:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-brand-blue">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">Consultation Booked Successfully</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your consultation has been scheduled with APEX Global Education.
        </p>
        <div className="mt-7">
          <Button asChild variant="gold" size="lg">
            <Link to="/">Back to APEX</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
