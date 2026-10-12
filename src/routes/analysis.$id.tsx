import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AI_CONFIGURED, OPPORTUNITIES, useProfile, type Opportunity, type Profile } from "@/lib/data";

export const Route = createFileRoute("/analysis/$id")({
  loader: ({ params }) => {
    const o = OPPORTUNITIES.find((x) => x.id === params.id);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `AI Fit Analysis${loaderData ? ` — ${loaderData.title}` : ""} — SkillBridge Lite` },
      { name: "description", content: "Relevant skills, potential gaps, and recommended next steps." },
      { property: "og:title", content: "AI Fit Analysis — SkillBridge Lite" },
      { property: "og:description", content: "Relevant skills, potential gaps, and recommended next steps." },
    ],
  }),
  component: Analysis,
});

type State = "loading" | "insufficient" | "unavailable" | "error" | "ready";

function parseSkills(p: Profile) {
  return p.skills.split(",").map((s) => s.trim()).filter(Boolean);
}

function Analysis() {
  const o = Route.useLoaderData();
  const { profile, isSample } = useProfile();
  const [state, setState] = useState<State>("loading");
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    setState("loading");
    const t = setTimeout(() => {
      try {
        if (parseSkills(profile).length === 0 || (!profile.projects.trim() && !profile.experience.trim())) {
          setState("insufficient");
        } else if (!AI_CONFIGURED) {
          setState("unavailable");
        } else {
          setState("ready");
        }
      } catch {
        setState("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [profile, o.id]);

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/opportunities/$id" params={{ id: o.id }} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to {o.title}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">AI Fit Analysis</h1>
      <p className="mt-2 text-muted-foreground">
        {o.title} at {o.company} · Profile: {profile.name || "Unnamed"}{isSample && " (sample profile)"}
      </p>

      <div className="mt-8">
        {state === "loading" && <Notice title="Checking your profile…" body="Preparing the analysis." />}
        {state === "insufficient" && (
          <Notice title="Not enough profile information" body="Add at least a few skills and some projects or experience to your profile before analyzing your fit.">
            <Button asChild className="mt-4"><Link to="/profile">Update profile</Link></Button>
          </Notice>
        )}
        {state === "error" && (
          <Notice tone="error" title="Something went wrong" body="The analysis could not be prepared. Please try again.">
            <Button className="mt-4" onClick={() => setState("loading")}>Try again</Button>
          </Notice>
        )}
        {state === "unavailable" && (
          <>
            <Notice title="Real AI analysis is currently unavailable" body="No AI service is configured for this prototype, so no real analysis has been performed on your profile.">
              <Button variant="outline" className="mt-4" onClick={() => setShowDemo((v) => !v)}>
                {showDemo ? "Hide demonstration example" : "Show demonstration example"}
              </Button>
            </Notice>
            {showDemo && <Demo o={o} />}
          </>
        )}
      </div>
    </section>
  );
}

function Notice({ title, body, tone, children }: { title: string; body: string; tone?: "error"; children?: React.ReactNode }) {
  return (
    <div className={`rounded-xl border bg-card p-6 shadow-sm ${tone === "error" ? "border-destructive/40" : ""}`}>
      <h2 className={`font-semibold ${tone === "error" ? "text-destructive" : ""}`}>{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}

function Demo({ o }: { o: Opportunity }) {
  const sections = [
    { title: "Relevant Skills", items: [`Example: experience with ${o.skills[0]} shown in a past project`] },
    { title: "Potential Gaps", items: [`Example: no documented work with ${o.skills[o.skills.length - 1]}`] },
    { title: "Recommended Next Steps", items: [`Example: build a small project using ${o.skills[o.skills.length - 1]}`, "Example: describe project outcomes in your profile"] },
  ];
  return (
    <div className="mt-6 rounded-xl border-2 border-dashed border-primary/40 p-6">
      <p className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
        Demonstration example — not a real analysis
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {sections.map((s) => (
          <div key={s.title} className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">{s.title}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {s.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
