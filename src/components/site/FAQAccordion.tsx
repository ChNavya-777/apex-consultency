import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQAccordion({
  items,
  idPrefix = "faq",
}: {
  items: { q: string; a: string }[];
  idPrefix?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No questions match your search. Try a different keyword.
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((f, i) => (
        <AccordionItem key={`${idPrefix}-${i}`} value={`${idPrefix}-${i}`} className="border-b-0 px-5 md:px-6">
          <AccordionTrigger className="py-5 text-left font-display text-base font-semibold hover:no-underline">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
