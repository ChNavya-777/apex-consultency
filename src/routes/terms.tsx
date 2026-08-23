import { createFileRoute } from "@tanstack/react-router";
import { Section, PageHero, Note } from "@/components/site/shared";

const title = "Terms of Use | APEX Global Education";
const description =
  "Terms covering the use of the APEX Global Education website, the nature of guidance provided, and the limits of admission and visa outcomes.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

const sections = [
  {
    heading: "Nature of information",
    body: "Content on this website — including costs, intakes, admission requirements and university details — is provided as general guidance and should be verified for the relevant intake before you rely on it.",
  },
  {
    heading: "No guaranteed outcomes",
    body: "Admission and visa decisions are made by universities and government authorities. APEX prepares and supports applications but cannot guarantee any admission, scholarship or visa outcome.",
  },
  {
    heading: "Student responsibilities",
    body: "You are responsible for the accuracy of the documents and information you provide. Misrepresentation can lead to rejection by universities or visa authorities.",
  },
  {
    heading: "Prototype notice",
    body: "This website is a Phase 1 prototype. University names, statistics, testimonials and articles are illustrative placeholders, and forms do not submit or store data.",
  },
];

function Terms() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Terms of Use" }]}
        eyebrow="Legal"
        title="Terms of Use"
        text="What this website is, and the limits of the guidance it provides."
      />
      <Section>
        <div className="mx-auto max-w-3xl">
          {sections.map((s) => (
            <section key={s.heading} className="mt-8 first:mt-0">
              <h2 className="font-display text-xl font-bold">{s.heading}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
          <Note>
            Prototype terms text — replace with terms reviewed by your legal advisor before launch.
          </Note>
        </div>
      </Section>
    </>
  );
}
