import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProfile, type Profile } from "@/lib/data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SkillBridge Lite" },
      { name: "description", content: "Edit your skills, projects, and experience." },
      { property: "og:title", content: "My Profile — SkillBridge Lite" },
      { property: "og:description", content: "Edit your skills, projects, and experience." },
    ],
  }),
  component: ProfilePage,
});

const fields: { key: keyof Profile; label: string; area?: boolean; hint?: string }[] = [
  { key: "name", label: "Name" },
  { key: "headline", label: "Headline" },
  { key: "about", label: "About", area: true },
  { key: "skills", label: "Skills", hint: "Comma-separated, e.g. Python, React, APIs" },
  { key: "projects", label: "Projects", area: true },
  { key: "experience", label: "Experience", area: true },
];

function ProfilePage() {
  const { profile, isSample, save } = useProfile();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const input = "w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold">My Profile</h1>
      {isSample && (
        <p className="mt-3 rounded-md border border-primary/30 bg-accent px-4 py-3 text-sm text-accent-foreground">
          Sample profile — this is example data, not your information. Edit and save to use your own.
        </p>
      )}
      <form
        className="mt-8 space-y-5 rounded-xl border bg-card p-6 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); save(form); setSaved(true); }}
      >
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-sm font-medium">{f.label}</span>
            {f.area ? (
              <textarea rows={3} className={`${input} mt-1.5`} value={form[f.key]}
                onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setSaved(false); }} />
            ) : (
              <input className={`${input} mt-1.5`} value={form[f.key]}
                onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setSaved(false); }} />
            )}
            {f.hint && <span className="mt-1 block text-xs text-muted-foreground">{f.hint}</span>}
          </label>
        ))}
        <div className="flex items-center gap-3">
          <Button type="submit">Save profile</Button>
          {saved && <span className="text-sm text-primary">Saved.</span>}
        </div>
      </form>
    </section>
  );
}
