import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, PageHero, CTASection, Note, Breadcrumbs, SectionHeader } from "@/components/site/shared";
import { BlogCard } from "@/components/site/cards";
import { blogPosts, getPost } from "@/data/blog";
import { GENERAL_GUIDANCE_NOTE } from "@/data/site";

export const Route = createFileRoute("/resources/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Article not found — APEX Global Education" }, { name: "robots", content: "noindex" }],
      };
    }
    const p = loaderData.post;
    return {
      meta: [
        { title: `${p.title} | APEX Global Education` },
        { name: "description", content: p.excerpt },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/resources/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/resources/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: p.title,
            description: p.excerpt,
            datePublished: p.date,
            author: { "@type": "Organization", name: "APEX Global Education" },
          }),
        },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: ArticleDetail,
});

function PostNotFound() {
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Resources", to: "/resources" }, { label: "Not found" }]} />
      <h1 className="mt-6 text-3xl font-bold">Article not found</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">This article isn't part of the prototype yet.</p>
      <Button asChild className="mt-6">
        <Link to="/resources">Back to resources</Link>
      </Button>
    </Section>
  );
}

function ArticleDetail() {
  const { post } = Route.useLoaderData();
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Resources", to: "/resources" }, { label: post.category }]}
        eyebrow={`${post.category} · ${post.displayDate} · ${post.readingTime}`}
        title={post.title}
        text={post.excerpt}
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-lg shadow-lift">
            <img
              src={post.image}
              alt={post.imageAlt}
              width={1600}
              height={900}
              className="aspect-[16/9] size-full object-cover"
            />
          </div>

          <article className="mt-10">
            {post.body.map((block, i) => (
              <section key={i} className="mt-8 first:mt-0">
                {block.heading && (
                  <h2 className="font-display text-2xl font-bold leading-snug">{block.heading}</h2>
                )}
                {block.paragraphs.map((para, j) => (
                  <p key={j} className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {para}
                  </p>
                ))}
                {block.bullets && (
                  <ul className="mt-5 space-y-2">
                    {block.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>

          <Note>{GENERAL_GUIDANCE_NOTE}</Note>

          <div className="mt-8 rounded-lg border border-border bg-surface p-6">
            <p className="font-display text-lg font-bold">Have a question about this?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              A counsellor can apply this to your own profile in a free consultation.
            </p>
            <Button asChild variant="gold" className="mt-4">
              <Link to="/consultation">Book a Free Consultation</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="Keep reading" title="Related Articles" />
        <div className="grid gap-6 md:grid-cols-3">
          {related.map((p) => (
            <BlogCard key={p.slug} p={p} />
          ))}
        </div>
      </Section>

      <CTASection />
    </>
  );
}
