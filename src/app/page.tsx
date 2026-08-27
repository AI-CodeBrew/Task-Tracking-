import Link from "next/link";

const FEATURES = [
  {
    title: "Kanban board",
    description:
      "Drag issues between To Do, In Progress, Pending, and Done with smooth, real drag-and-drop.",
    icon: (
      <path
        d="M4 4h4v16H4V4zm6 0h4v10h-4V4zm6 0h4v7h-4V4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Assignees & priority",
    description: "Assign work to teammates, set priority from low to urgent, and track ownership.",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    title: "File attachments",
    description: "Drop screenshots, logs, or docs straight onto an issue — stored securely, ready when needed.",
    icon: (
      <path
        d="M8 12.5l5.5-5.5a3 3 0 114.2 4.2L10 18.9a5 5 0 01-7-7l7.8-7.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Projects & teams",
    description: "Spin up a project in seconds, invite teammates by email, and keep every team's work separate.",
    icon: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create a project",
    description: "Name it, give it a short key like ENG or OPS, and you're ready to go.",
  },
  {
    step: "02",
    title: "Add & assign issues",
    description: "Log bugs, tasks, and stories. Assign them, set priority, attach files.",
  },
  {
    step: "03",
    title: "Move work forward",
    description: "Drag issues across the board as work progresses, from To Do to Done.",
  },
];

const MOCK_ISSUES: Record<string, { title: string; priority: "low" | "medium" | "high" | "urgent"; assignee: string }[]> = {
  "To Do": [
    { title: "Set up CI pipeline", priority: "medium", assignee: "A" },
    { title: "Design empty states", priority: "low", assignee: "M" },
  ],
  "In Progress": [{ title: "Fix pagination bug", priority: "high", assignee: "J" }],
  Done: [
    { title: "Ship onboarding flow", priority: "medium", assignee: "A" },
    { title: "Migrate auth provider", priority: "urgent", assignee: "M" },
  ],
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-300",
  medium: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500",
};

const AVATAR_BG: Record<string, string> = {
  A: "bg-violet-600",
  M: "bg-emerald-600",
  J: "bg-blue-600",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-100/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              T
            </div>
            <span className="text-base font-semibold">Task Tracker</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-500"
            >
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-[-8rem] -z-10 flex justify-center blur-3xl"
            aria-hidden
          >
            <div className="h-[28rem] w-[52rem] rounded-full bg-gradient-to-tr from-indigo-200 via-violet-100 to-transparent opacity-70" />
          </div>

          <div className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center sm:pt-28">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Boards, assignees, and attachments in one place
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              Ship work, not spreadsheets.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-500">
              A focused, Jira-style issue tracker for small teams &mdash; kanban boards, priorities,
              and file attachments, without the setup overhead.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
              >
                Get started &mdash; it&apos;s free
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Product mockup */}
          <div className="mx-auto max-w-4xl px-6 pb-24">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
              <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-3 rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-500">
                  ENG
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto bg-slate-50/60 p-4 sm:p-5">
                {Object.entries(MOCK_ISSUES).map(([column, items]) => (
                  <div key={column} className="w-48 flex-shrink-0 sm:w-56">
                    <div className="mb-2 flex items-center gap-1.5 px-1">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          column === "Done"
                            ? "bg-emerald-500"
                            : column === "In Progress"
                              ? "bg-blue-500"
                              : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-600">{column}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((issue) => (
                        <div
                          key={issue.title}
                          className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1"
                        >
                          <div
                            className={`absolute inset-y-0 left-0 w-1 ${PRIORITY_DOT[issue.priority]}`}
                          />
                          <p className="mb-2 pl-1 text-xs font-medium leading-snug text-slate-800">
                            {issue.title}
                          </p>
                          <div className="flex justify-end pl-1">
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-medium text-white ${AVATAR_BG[issue.assignee]}`}
                            >
                              {issue.assignee}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-100 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                Everything a small team needs
              </h2>
              <p className="mt-2 text-slate-500">Nothing you don&apos;t.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="relative">
                <span className="mb-3 block font-mono text-sm font-semibold text-indigo-400">
                  {s.step}
                </span>
                <h3 className="mb-1.5 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-100">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Ready to organize your work?
            </h2>
            <p className="mt-2 text-slate-500">Create your first project in under a minute.</p>
            <Link
              href="/signup"
              className="mt-7 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
            >
              Sign up free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-slate-400 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Task Tracker.</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-600">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-slate-600">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
