import Link from "next/link";
import { ShieldCheck, MessageCircle, Zap, Globe, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-sm border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">MEDSAFE</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-500">
          <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How it Works</a>
          <a href="#for-manufacturers" className="hover:text-zinc-900 transition-colors">For Manufacturers</a>
          <a href="#impact" className="hover:text-zinc-900 transition-colors">Impact</a>
        </div>
       {/*  <Link
          href="/login"
          className="rounded-full bg-zinc-900 hover:bg-zinc-700 transition-colors px-4 py-2 text-sm font-medium text-white border border-zinc-900"
        >
          Manufacturer Login
        </Link> */}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-6 overflow-hidden">
        {/* subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-green-100 blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter uppercase mb-6 text-zinc-900">
              VERIFY YOUR<br />
              <span className="text-green-500">DRUGS</span><br />
              ON WHATSAPP
            </h1>
            <p className="text-zinc-500 text-lg leading-relaxed mb-8 max-w-md">
              Send a photo of any drug pack to MedSafe on WhatsApp and know instantly if it&apos;s real or a deadly counterfeit — no app download required.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/+14155238886?text=join+war-natural"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-green-500 hover:bg-green-600 transition-colors px-6 py-3 text-sm font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Get Started
              </a>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-colors px-6 py-3 text-sm font-medium text-zinc-700"
              >
                See how it works
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right — Phone Mockup */}
          <div className="flex justify-center md:justify-end">
            <PhoneMockup>
              <WhatsAppChat
                messages={[
                  { from: "user", text: "Hi Medsafe" },
                  {
                    from: "bot",
                    text: "Hello! 👋 I'm Medsafe \n\nSend me a drug batch ID or a photo of the drug packaging and I'll check if it's genuine.",
                  },
                  { from: "user", text: "MSF-2024-AMX-001" },
                  {
                    from: "bot",
                    verified: true,
                    text: "✅ VERIFIED\n\nAmoxicillin 500mg\nFidson Healthcare Plc\nMfg: Jan 2024 · Exp: Dec 2026\n\nThis batch is registered on the MedSafe network.",
                  },
                ]}
              />
            </PhoneMockup>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="impact" className="border-y border-zinc-100 bg-zinc-50 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <Stat value="500,000+" label="Deaths per year from fake drugs in Africa" source="UNODC 2023" />
          <Stat value="1 in 10" label="Medicines in Africa is fake or substandard" source="WHO" />
          <Stat value="$200B+" label="Lost annually to counterfeit pharmaceuticals" source="Global estimate" />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-green-600 text-sm font-bold tracking-widest uppercase mb-4">How it works</p>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-16 text-zinc-900">
            VERIFY IN SECONDS.<br />
            <span className="text-zinc-300">NOT HOURS.</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Steps */}
            <div className="space-y-8">
              <Step
                number="01"
                title="Send a message on WhatsApp"
                description="Open WhatsApp and message MedSafe's bot. Type a batch ID or snap a photo of the drug packaging — that's it."
              />
              <Step
                number="02"
                title="AI reads the batch code"
                description="Our AI (Gemini 2.5 Flash) extracts the batch ID from your photo automatically. No need to type anything."
              />
              <Step
                number="03"
                title="Checked against an immutable ledger"
                description="The batch ID is verified against records signed by manufacturers on the Nostr protocol — tamper-proof and publicly auditable."
              />
              <Step
                number="04"
                title="Instant result: Real or Fake"
                description="You receive ✅ Verified, ❌ Not Found (possible fake), or ⚠️ Anomaly detected — within seconds."
              />
            </div>

            {/* Phone mockup 2 */}
            <div className="flex justify-center">
              <PhoneMockup>
                <WhatsAppChat
                  messages={[
                    { from: "user", text: "🖼️ [Photo of drug pack]", isImage: true },
                    {
                      from: "bot",
                      text: "🔍 Scanning packaging...\n\nBatch ID detected: PCM-2025-001",
                    },
                    {
                      from: "bot",
                      verified: true,
                      text: "✅ VERIFIED\n\nParacetamol 500mg\nEmzor Pharmaceuticals\nMfg: Mar 2025 · Exp: Feb 2027\n\nSafe to use.",
                    },
                  ]}
                />
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fake drug result demo ── */}
      <section className="py-24 px-6 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="flex justify-center order-2 md:order-1">
            <PhoneMockup>
              <WhatsAppChat
                messages={[
                  { from: "user", text: "XYZ-FAKE-999" },
                  {
                    from: "bot",
                    fake: true,
                    text: "❌ NOT FOUND\n\nThis batch ID is not registered on the MedSafe network.\n\n⚠️ This medicine may be counterfeit. Do NOT consume it.\n\nReport to your nearest NAFDAC office.",
                  },
                ]}
              />
            </PhoneMockup>
          </div>

          <div className="order-1 md:order-2">
            <p className="text-red-500 text-sm font-bold tracking-widest uppercase mb-4">Fake detection</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6 text-zinc-900">
              CATCH FAKES<br />
              <span className="text-red-500">BEFORE THEY</span><br />
              CATCH YOU.
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed mb-6">
              When a batch ID doesn&apos;t match any registered record, MedSafe instantly alerts you — protecting you and your family before it&apos;s too late.
            </p>
            <ul className="space-y-3 text-sm text-zinc-600">
              {[
                "No app download needed — just WhatsApp",
                "Works on any phone, any network",
                "Designed for every African, everywhere",
                "Anomaly detection flags counterfeit hotspots",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── For Manufacturers ── */}
      <section id="for-manufacturers" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50/60 to-white border border-green-200 p-10 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-green-700 text-sm font-bold tracking-widest uppercase mb-4">For manufacturers</p>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6 text-zinc-900">
                  REGISTER YOUR<br />
                  BATCHES ON<br />
                  <span className="text-green-600">THE BLOCKCHAIN.</span>
                </h2>
                <p className="text-zinc-600 text-lg leading-relaxed mb-8">
                  Publish your drug batch records to the Nostr protocol — immutable, tamper-evident, and publicly auditable. A small Bitcoin Lightning micropayment prevents spam entries.
                </p>
                <div className="flex flex-wrap gap-4 mb-10">
                  <FeaturePill icon={<Zap className="h-3.5 w-3.5" />} label="Bitcoin Lightning payment" />
                  <FeaturePill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Nostr-signed records" />
                  <FeaturePill icon={<Globe className="h-3.5 w-3.5" />} label="Publicly verifiable" />
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 hover:bg-zinc-700 transition-colors px-6 py-3 text-sm font-bold text-white"
                >
                  Access Manufacturer Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Dashboard preview card */}
              <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">MedSafe Dashboard</p>
                    <p className="text-xs text-zinc-400">Manufacturer Portal</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Registered Batches", value: "142" },
                    { label: "Total Verifications", value: "4,891" },
                    { label: "Active Alerts", value: "2", alert: true },
                    { label: "Countries Reached", value: "7" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                      <p className={`text-xl font-black ${item.alert ? "text-amber-500" : "text-zinc-900"}`}>
                        {item.value}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                  <p className="text-xs text-zinc-400 mb-2">Recent Registrations</p>
                  {[
                    { id: "AMX-2025-001", drug: "Amoxicillin 500mg", status: "verified" },
                    { id: "PCM-2025-042", drug: "Paracetamol 500mg", status: "verified" },
                    { id: "ARV-2025-007", drug: "Artemether 20mg", status: "pending" },
                  ].map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-zinc-900">{b.id}</p>
                        <p className="text-xs text-zinc-400">{b.drug}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === "verified"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anomaly Detection ── */}
      <section className="py-24 px-6 border-t border-zinc-100">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6 text-zinc-900">
            ANOMALY DETECTION<br />
            <span className="text-zinc-300">BEFORE IT SPREADS.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            MedSafe monitors verification patterns across regions. When the same batch is being verified by thousands of users in multiple locations simultaneously, the system flags it — alerting manufacturers and regulators to a potential mass-distribution of a fake batch.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: "🔍",
                title: "Pattern Recognition",
                description: "Detects unusual spikes in batch verification requests from disparate regions.",
              },
              {
                icon: "⚠️",
                title: "Instant Alerts",
                description: "Manufacturers and regulators receive immediate notification of suspicious activity.",
              },
              {
                icon: "🗺️",
                title: "Regional Mapping",
                description: "Visualise counterfeit hotspots to guide NAFDAC and health ministry responses.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-6">
                <span className="text-2xl mb-3 block">{card.icon}</span>
                <h3 className="font-bold mb-2 text-zinc-900">{card.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6 text-zinc-900">
            ONE MESSAGE<br />
            <span className="text-green-500">SAVES A LIFE.</span>
          </h2>
          <p className="text-zinc-500 text-xl mb-10 max-w-xl mx-auto">
            No app. No registration. Just WhatsApp. Start verifying drugs right now.
          </p>
          <a
            href="https://wa.me/+14155238886?text=join+war-natural"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors px-8 py-4 text-base font-bold text-white"
          >
            <MessageCircle className="h-5 w-5" />
            Open MedSafe on WhatsApp
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900">MEDSAFE</span>
          </div>
          <p className="text-zinc-400 text-xs text-center">
            MedSafe — Building trust in every medicine. Built for Hack4Freedom 2026.
          </p>
          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <Link href="/login" className="hover:text-zinc-900 transition-colors">Manufacturer Login</Link>
            <a
              href="https://github.com/oyingrace/medsafe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function Stat({ value, label, source }: { value: string; label: string; source: string }) {
  return (
    <div>
      <p className="text-4xl md:text-5xl font-black text-zinc-900 mb-2">{value}</p>
      <p className="text-zinc-600 text-sm leading-relaxed mb-1">{label}</p>
      <p className="text-zinc-400 text-xs">{source}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-5">
      <span className="text-4xl font-black text-green-200 leading-none shrink-0 w-10">{number}</span>
      <div>
        <h3 className="font-bold text-zinc-900 mb-1">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
      {icon}
      {label}
    </span>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[260px] rounded-[40px] bg-zinc-900 border-4 border-zinc-700 shadow-2xl overflow-hidden">
      {/* Status bar */}
      <div className="bg-zinc-900 px-5 py-3 flex items-center justify-between">
        <span className="text-[10px] text-white font-semibold">9:41</span>
        <div className="w-20 h-4 rounded-full bg-zinc-800" />
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-white/60" />
          <div className="h-2 w-2 rounded-full bg-white/60" />
          <div className="h-2 w-2 rounded-full bg-white/60" />
        </div>
      </div>
      {/* WhatsApp header */}
      <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-white text-xs font-semibold">MedSafe ✦</p>
          <p className="text-zinc-400 text-[10px]">MedSafe Drug Verifier</p>
        </div>
      </div>
      {/* Chat area */}
      <div className="bg-[#0b141a] min-h-[360px] max-h-[420px] overflow-y-auto p-3">
        {children}
      </div>
      {/* Input bar */}
      <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
        <div className="flex-1 rounded-full bg-[#2a3942] px-3 py-1.5">
          <p className="text-zinc-500 text-[10px]">Message</p>
        </div>
        <div className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center">
          <MessageCircle className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

type Message = {
  from: "user" | "bot";
  text: string;
  verified?: boolean;
  fake?: boolean;
  isImage?: boolean;
};

function WhatsAppChat({ messages }: { messages: Message[] }) {
  return (
    <div className="space-y-2">
      <div className="text-center">
        <span className="text-[9px] text-zinc-500 bg-[#182229] px-2 py-0.5 rounded-full">Today</span>
      </div>
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-lg px-3 py-1.5 text-[10px] leading-relaxed whitespace-pre-wrap ${
              msg.from === "user"
                ? "bg-[#005c4b] text-white rounded-tr-none"
                : msg.verified
                ? "bg-[#1a3a2a] border border-green-500/30 text-green-100 rounded-tl-none"
                : msg.fake
                ? "bg-[#3a1a1a] border border-red-500/30 text-red-100 rounded-tl-none"
                : "bg-[#202c33] text-zinc-200 rounded-tl-none"
            }`}
          >
            {msg.isImage ? (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span>📷</span>
                <span className="italic">{msg.text}</span>
              </div>
            ) : (
              msg.text
            )}
            <span className="block text-right text-[8px] text-zinc-500 mt-0.5">
              {["10:22", "10:23", "10:23", "10:24"][i % 4]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
