const benefits = [
  {
    title: "Generate Complete Campaign Kits",
    description:
      "Turn one brief into coordinated social posts, billboard copy, website hero content, email campaigns, and taglines.",
  },
  {
    title: "Stay On Brand",
    description:
      "Use uploaded brand guidelines, product facts, previous campaigns, and reference materials to keep every asset consistent.",
  },
  {
    title: "Evaluate Every Asset",
    description:
      "Score outputs for brand alignment, grounding, compliance, emotional strength, memorability, and cross-format consistency.",
  },
  {
    title: "Learn From Revisions",
    description:
      "Capture edits, approvals, and rejected outputs so future campaigns better match user preferences.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload References",
    description:
      "Add brand guidelines, product PDFs, screenshots, mood boards, campaign notes, or images.",
  },
  {
    number: "02",
    title: "Create Strategy",
    description:
      "Braind generates a shared core message, emotional hook, memorability device, and visual direction.",
  },
  {
    number: "03",
    title: "Generate Assets",
    description:
      "Create campaign-ready content across multiple selected formats from one unified direction.",
  },
  {
    number: "04",
    title: "Evaluate & Revise",
    description:
      "Review scores, request changes in natural language, and track version history.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f8f4] text-[#111111]">
      <header className="sticky top-0 z-50 bg-[#f8f8f4]/80 px-8 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-4xl font-bold tracking-tight">Braind</div>

          <nav className="hidden rounded-full bg-[#d7d7d2]/90 px-10 py-5 shadow-sm backdrop-blur-md md:flex md:items-center md:gap-10">
            <a href="#benefits" className="text-lg font-bold tracking-tight">
              Product
            </a>
            <a href="#workflow" className="text-lg font-bold tracking-tight">
              How it Works
            </a>
            <a href="#demo" className="text-lg font-bold tracking-tight">
              Demo
            </a>
            <a href="#dashboard" className="text-lg font-bold tracking-tight">
              Dashboard
            </a>
          </nav>

          <a
            href="/create"
            className="rounded-full bg-[#40540a] px-8 py-4 text-lg font-bold tracking-tight text-white transition hover:opacity-90"
          >
            Start Creating →
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 pb-24 pt-12">
        <div className="max-w-6xl">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
            Multimodal AI Campaign Platform
          </p>

          <h1 className="max-w-6xl text-5xl font-normal italic leading-[1.02] tracking-tight md:text-7xl lg:text-8xl">
            Generate campaigns that feel unmistakably on-brand.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#666666]">
            Braind turns brand guidelines, uploaded references, product
            documents, and creative briefs into complete multi-format campaign
            kits — with evaluation, revision tracking, and feedback memory built
            in.
          </p>
        </div>

        <div className="mt-20 rounded-[2rem] bg-[#9aaa82] p-4 shadow-2xl">
          <div className="rounded-[1.5rem] border border-white/30 bg-white/70 p-6 backdrop-blur">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Campaign Overview</p>
                <h2 className="mt-2 text-3xl font-medium">
                  Summer Refresh Launch
                </h2>
              </div>

              <span className="rounded-full bg-[#e5f2c8] px-4 py-2 text-sm font-medium text-[#40540a]">
                92% Brand Alignment
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {["Instagram", "Billboard", "Website Hero", "Email"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-black/10 bg-white p-5"
                  >
                    <p className="text-sm text-[#777777]">{item}</p>
                    <p className="mt-8 text-xl font-medium">
                      Refresh every shared moment.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-7xl px-8 py-24">
        <p className="mb-8 text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
          Benefits
        </p>

        <h2 className="max-w-4xl text-5xl font-normal leading-tight md:text-6xl">
          We’ve cracked the campaign workflow.
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#666666]">
          Generate, evaluate, revise, and improve brand campaigns from one
          connected AI workflow.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="border-t border-black/10 pt-8">
              <div className="mb-8 text-2xl">✦</div>
              <h3 className="text-xl font-medium">{benefit.title}</h3>
              <p className="mt-4 leading-7 text-[#666666]">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-8 py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div className="border-t border-black/10 pt-14">
              <h2 className="text-5xl font-normal leading-tight md:text-6xl">
                See the full campaign picture.
              </h2>

              <p className="mt-8 max-w-xl text-lg leading-8 text-[#666666]">
                Braind does not generate isolated copy. It creates one shared
                campaign direction, then adapts it across every selected
                channel.
              </p>

              <div className="mt-12">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="grid grid-cols-[48px_1fr] border-t border-black/10 py-5"
                  >
                    <p className="text-[#666666]">{step.number}</p>
                    <div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="mt-2 leading-7 text-[#666666]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#d8c8a8] p-8">
            <div className="flex h-full min-h-[520px] flex-col justify-between rounded-[1.5rem] bg-[#f8f8f4] p-8">
              <div>
                <p className="text-sm text-[#666666]">Campaign Strategy</p>
                <h3 className="mt-4 text-4xl font-normal">
                  One message. Many formats.
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  "Core message",
                  "Emotional hook",
                  "Memorability device",
                  "Visual direction",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-black/10 bg-white p-5"
                  >
                    <p className="text-sm text-[#666666]">{item}</p>
                    <p className="mt-2 font-medium">
                      Shared summer moments made memorable.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-8 py-24">
        <div className="rounded-[2rem] bg-[#111111] p-10 text-white md:p-16">
          <p className="mb-8 text-sm font-medium uppercase tracking-[0.2em] text-[#dff2b8]">
            Recruiter Demo
          </p>

          <h2 className="max-w-4xl text-5xl font-normal leading-tight md:text-6xl">
            Open the app, choose a sample brand, and generate a full campaign
            kit in minutes.
          </h2>

          <a
            href="/create"
            className="mt-10 inline-block rounded-full bg-[#dff2b8] px-6 py-3 text-sm font-semibold text-[#40540a]"
            >
                Try Demo →
            </a>
        </div>
      </section>

      <section id="dashboard" className="mx-auto max-w-7xl px-8 py-24">
        <p className="mb-8 text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
          Evaluation Dashboard
        </p>

        <h2 className="max-w-4xl text-5xl font-normal leading-tight md:text-6xl">
          Every asset gets measured before it gets approved.
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            ["Brand Alignment", "94%"],
            ["Grounding", "89%"],
            ["Memorability", "91%"],
            ["Compliance Safety", "96%"],
            ["Cross-Format Consistency", "93%"],
            ["Average Latency", "2.1s"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-black/10 bg-white p-8"
            >
              <p className="text-sm text-[#666666]">{label}</p>
              <p className="mt-6 text-5xl font-normal">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl items-center justify-between border-t border-black/10 px-8 py-10 text-sm text-[#666666]">
        <p>© 2026 Braind</p>
        <p>Generate. Evaluate. Improve.</p>
      </footer>
    </main>
  );
}