import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OPPORTUNITIES } from "@/lib/data";

export const Route = createFileRoute("/opportunities/")({
  head: () => ({
    meta: [
      { title: "Opportunities — SkillBridge Lite" },
      { name: "description", content: "Browse sample opportunities and check your fit." },
      { property: "og:title", content: "Opportunities — SkillBridge Lite" },
      { property: "og:description", content: "Browse sample opportunities and check your fit." },
    ],
  }),
  component: List,
});

export function SkillTags({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <span key={s} className="rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{s}</span>
      ))}
    </div>
  );
}

function List() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold">Opportunities</h1>
      <p className="mt-2 text-muted-foreground">Three sample opportunities to compare your profile against.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {OPPORTUNITIES.map((o) => (
          <article key={o.id} className="flex flex-col rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{o.company}</p>
            <h2 className="mt-1 font-display text-lg font-semibold">{o.title}</h2>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{o.description}</p>
            <div className="mt-4"><SkillTags skills={o.skills} /></div>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/opportunities/$id" params={{ id: o.id }}>View details</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
