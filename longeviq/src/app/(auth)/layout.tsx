import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding / ambient background */}
      <div className="relative hidden w-[60%] items-center justify-center overflow-hidden lg:flex">
        {/* Layered radial gradients for a subtle medical-tech feel */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background: [
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(5,150,105,0.06) 0%, transparent 70%)",
              "radial-gradient(ellipse 50% 80% at 30% 70%, rgba(5,150,105,0.04) 0%, transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 70% 30%, rgba(37,99,235,0.03) 0%, transparent 50%)",
            ].join(", "),
          }}
        />

        {/* Faint grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <div className="relative flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Activity className="size-10 text-primary" strokeWidth={1.5} />
            <span className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              LongevIQ
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Personalisierte Longevity-Insights
          </p>
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[40%] lg:border-l lg:border-border lg:px-12">
        {/* Mobile-only logo */}
        <div className="mb-10 flex items-center gap-2 lg:hidden">
          <Activity className="size-6 text-primary" strokeWidth={1.5} />
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
            LongevIQ
          </span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
