import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "My Profile" },
  { to: "/opportunities", label: "Opportunities" },
] as const;

export function Nav() {
  return (
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="font-display text-lg font-bold text-foreground">
          SkillBridge <span className="text-primary">Lite</span>
        </Link>
        <div className="flex gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 bg-accent text-accent-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
