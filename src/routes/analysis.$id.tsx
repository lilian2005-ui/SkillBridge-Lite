import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { analyzeFit, type FitResult } from "@/lib/analysis.functions";
import { OPPORTUNITIES, useProfile, type Opportunity, type Profile } from "@/lib/data";

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

type State = "idle" | "analyzing" | "success" | "insufficient" | "unavailable" | "error";

type AnalysisResult = FitResult;

function parseSkills(p: Profile) {
  return p.skills.split(",").map((s) => s.trim()).filter(Boolean);
}

function hasEnoughData(p: Profile) {
  return parseSkills(p).length > 0 && (p.projects.trim().length > 0 || p.experience.trim().length > 0);
}

async function requestAnalysis(profile: Profile, o: Opportunity) {
  const { id: _id, ...opportunity } = o;
  return analyzeFit({ data: { profile, opportunity } });
}

function Analysis() {
  const o = Route.useLoaderData();
  const { profile, isSample } = useProfile();
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [message, setMessage] = useState("");

  const runAnalysis = useCallback(async () => {
    setShowDemo(false);
    setResult(null);
    if (!hasEnoughData(profile)) {
      setState("insufficient");
      return;
    }
    setState("analyzing");
    try {
      const r = await requestAnalysis(profile, o);
      if (r.ok) {
        setResult(r.result);
        setState("success");
      } else {
        setMessage(r.message);
        setState(r.kind === "unavailable" ? "unavailable" : "error");
      }
    } catch {
      setMessage("The analysis request didn't complete. Please check your connection and try again.");
      setState("error");
    }
  }, [profile, o]);

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
        {state === "idle" && (
          <Notice title="Ready to analyze your fit" body="We'll compare your profile against this opportunity and summarize your relevant skills, potential gaps, and recommended next steps.">
            <Button className="mt-4" onClick={runAnalysis}>Analyze My Fit</Button>
          </Notice>
        )}

        {state === "analyzing" && (
          <Notice title="Analyzing your profile…" body="This usually takes a few seconds. Please don't close this page.">
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
              Analysis in progress…
            </div>
          </Notice>
        )}

        {state === "insufficient" && (
          <Notice title="Not enough profile information" body="Add at least a few skills and some projects or experience to your profile before analyzing your fit.">
            <Button asChild className="mt-4"><Link to="/profile">Update profile</Link></Button>
          </Notice>
        )}

        {state === "unavailable" && (
          <>
            <Notice title="Real AI analysis is currently unavailable" body={`${message} No analysis was generated, and nothing below was produced by AI.`}>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={runAnalysis}>Try again</Button>
                <Button variant="outline" onClick={() => setShowDemo((v) => !v)}>
                  {showDemo ? "Hide demonstration example" : "Show demonstration example"}
                </Button>
                <Button variant="ghost" onClick={() => setState("idle")}>Back</Button>
              </div>
            </Notice>
            {showDemo && <Demo o={o} />}
          </>
        )}

        {state === "error" && (
          <Notice tone="error" title="Something went wrong" body={message || "The analysis request didn't complete. Please try again."}>
            <Button className="mt-4" onClick={runAnalysis}>Try again</Button>
          </Notice>
        )}

        {state === "success" && result && (
          <>
            <ResultSections result={result} />
            <p className="mt-4 text-xs text-muted-foreground">AI-generated from your profile only. This is guidance, not a prediction of hiring outcomes.</p>
            <Button variant="outline" className="mt-4" onClick={runAnalysis}>Run again</Button>
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

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      {children.length ? (
        <ul className="mt-3 space-y-3 text-sm">{children}</ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function ResultSections({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Section title="Relevant Skills" empty="No relevant skills were identified from your profile.">
        {result.relevantSkills.map((s, i) => (
          <li key={i}>
            <p className="font-medium">{s.item}</p>
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Evidence:</span> {s.evidence}</p>
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Relevance:</span> {s.relevance}</p>
          </li>
        ))}
      </Section>
      <Section title="Potential Gaps" empty="No gaps were identified.">
        {result.potentialGaps.map((g, i) => (
          <li key={i}>
            <p className="font-medium">{g.requirement}</p>
            <p className="text-muted-foreground">{g.reason}</p>
          </li>
        ))}
      </Section>
      <Section title="Recommended Next Steps" empty="No next steps were suggested.">
        {result.recommendedNextSteps.map((n, i) => (
          <li key={i}>
            <p className="font-medium">{n.action}</p>
            <p className="text-muted-foreground">{n.reason}</p>
          </li>
        ))}
      </Section>
    </div>
  );
}

function Demo({ o }: { o: Opportunity }) {
  const demo: AnalysisResult = {
    relevantSkills: [{ item: `Example: ${o.skills[0]}`, evidence: "Example: mentioned in a past project", relevance: "Example: listed as a required skill" }],
    potentialGaps: [{ requirement: `Example: ${o.skills[o.skills.length - 1]}`, reason: "Example: the profile does not mention it" }],
    recommendedNextSteps: [{ action: `Example: build a small project using ${o.skills[o.skills.length - 1]}`, reason: "Example: adds documented evidence" }],
  };
  return (
    <div className="mt-6 rounded-xl border-2 border-dashed border-primary/40 p-6">
      <p className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
        Demonstration example — not a real analysis
      </p>
      <div className="mt-5">
        <ResultSections result={demo} />
      </div>
    </div>
  );
}
