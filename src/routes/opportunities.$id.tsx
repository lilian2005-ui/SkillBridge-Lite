import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OPPORTUNITIES } from "@/lib/data";
import { SkillTags } from "./opportunities.index";

export const Route = createFileRoute("/opportunities/$id")({
  loader: ({ params }) => {
    const o = OPPORTUNITIES.find((x) => x.id === params.id);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} at ${loaderData.company} — SkillBridge Lite` : "Opportunity — SkillBridge Lite" },
      { name: "description", content: loaderData?.description ?? "Opportunity details" },
      { property: "og:title", content: loaderData?.title ?? "Opportunity" },
      { property: "og:description", content: loaderData?.description ?? "Opportunity details" },
    ],
  }),
  component: Details,
});

function Details() {
  const o = Route.useLoaderData();
  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">← All opportunities</Link>
      <div className="mt-4 rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{o.company}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{o.title}</h1>
        <p className="mt-4 text-muted-foreground">{o.description}</p>
        <h2 className="mt-8 font-semibold">Required skills</h2>
        <div className="mt-3"><SkillTags skills={o.skills} /></div>
        <h2 className="mt-8 font-semibold">Responsibilities</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {o.responsibilities.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <Button asChild size="lg" className="mt-8">
          <Link to="/analysis/$id" params={{ id: o.id }}>Analyze My Fit</Link>
        </Button>
      </div>
    </section>
  );
}
