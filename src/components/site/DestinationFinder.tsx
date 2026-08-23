import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { destinations } from "@/data/destinations";
import { cn } from "@/lib/utils";

/**
 * Prototype destination finder — simple rule-based scoring over mock data.
 * Not an AI recommendation engine.
 */

const questions = [
  {
    key: "field",
    label: "What do you want to study?",
    options: [
      { value: "computing", label: "Computing & Data" },
      { value: "core", label: "Core Engineering" },
      { value: "business", label: "Business & Management" },
      { value: "science", label: "Sciences & Pharma" },
    ],
  },
  {
    key: "budget",
    label: "Preferred budget?",
    options: [
      { value: "low", label: "Lower budget" },
      { value: "mid", label: "Moderate" },
      { value: "high", label: "Flexible" },
    ],
  },
  {
    key: "region",
    label: "Preferred region?",
    options: [
      { value: "North America", label: "North America" },
      { value: "UK & Ireland", label: "UK & Ireland" },
      { value: "Europe", label: "Europe" },
      { value: "Asia-Pacific", label: "Asia-Pacific" },
      { value: "any", label: "Open to any" },
    ],
  },
  {
    key: "intake",
    label: "Preferred intake?",
    options: [
      { value: "sep", label: "Sep / Fall 2026" },
      { value: "jan", label: "Jan 2027" },
      { value: "later", label: "Later / not decided" },
    ],
  },
] as const;

const fieldMatch: Record<string, string[]> = {
  computing: ["usa", "ireland", "canada"],
  core: ["germany", "uk", "australia"],
  business: ["uk", "australia", "canada"],
  science: ["ireland", "germany", "uk"],
};

export function DestinationFinder() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string[] | null>(null);

  const complete = questions.every((q) => answers[q.key]);

  const run = () => {
    const scores = new Map<string, number>();
    for (const d of destinations) {
      let score = 0;
      if (fieldMatch[answers.field]?.includes(d.slug)) score += 3;
      if (answers.budget === "low" && d.budgetBand === "moderate") score += 2;
      if (answers.budget === "high") score += 1;
      if (answers.region !== "any" && d.region === answers.region) score += 2;
      if (answers.intake === "jan" && ["usa", "uk", "canada", "ireland"].includes(d.slug)) score += 1;
      scores.set(d.slug, score);
    }
    const top = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug]) => destinations.find((d) => d.slug === slug)!.country);
    setResult(top);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-soft md:p-8">
      <div className="grid gap-7 md:grid-cols-2">
        {questions.map((q, i) => (
          <fieldset key={q.key}>
            <legend className="text-sm font-semibold">
              <span className="mr-2 font-display text-gold">{i + 1}.</span>
              {q.label}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {q.options.map((o) => {
                const active = answers[q.key] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [q.key]: o.value }));
                      setResult(null);
                    }}
                    className={cn(
                      "rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-brand-blue bg-brand-blue text-brand-blue-foreground"
                        : "border-border bg-background hover:bg-accent",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button type="button" variant="default" size="lg" onClick={run} disabled={!complete}>
          Show my suggestions
        </Button>
        {!complete && (
          <p className="text-sm text-muted-foreground">Answer all four questions to continue.</p>
        )}
      </div>

      {result && (
        <div className="animate-rise mt-7 rounded-md border border-gold/40 bg-gold-soft/30 p-6" role="status">
          <p className="font-display text-lg font-semibold">
            Based on your preferences, you may want to explore{" "}
            {result.slice(0, -1).join(", ")} and {result[result.length - 1]}.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This is an indicative prototype suggestion. A counsellor will consider your academic
            record, budget and career goals before recommending a shortlist.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="gold">
              <Link to="/consultation">Talk to an APEX Counsellor</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/destinations">Compare Destinations</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
