"use client";

import { useMemo, useState } from "react";
import {
  BookOpenText,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FlaskConical,
  MapPinned,
  ShieldCheck,
  Stethoscope,
  TestTubeDiagonal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPersonaLabel, getUiModeLabel } from "@/lib/profile";
import type {
  CoachSuggestion,
  ComputedFeatures,
  EhrRecord,
  LifestyleSurvey,
  PersonaHint,
  TrafficLight,
  UiMode,
  UserProfile,
  WearableTelemetry,
} from "@/lib/types";

type TrendDatum = {
  date: string;
  readiness: number;
  recovery: number;
};

type VitalTrendDatum = {
  date: string;
  resting_hr: number;
  hrv: number;
};

export type DashboardExperienceData = {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
  features: ComputedFeatures;
  dailyScoreData: TrendDatum[];
  vitalChartData: VitalTrendDatum[];
  priorityCoachSuggestions: CoachSuggestion[];
};

type ExperienceProps = DashboardExperienceData & {
  profile: UserProfile;
};

const personaTabs: { value: PersonaHint; label: string }[] = [
  { value: "preventive-performer", label: "Aktive Vorsorge" },
  { value: "concerned-preventer", label: "Einfach & Sicher" },
  { value: "digital-optimizer", label: "Daten & Trends" },
  { value: "clinic-anchored-loyalist", label: "Klinikbegleitung" },
];

const uiModeTabs: { value: UiMode; label: string }[] = [
  { value: "simple", label: "Kompakt" },
  { value: "standard", label: "Standard" },
  { value: "expert", label: "Detailliert" },
];

function StatusBadge({ status }: { status: TrafficLight }) {
  const styles: Record<TrafficLight, string> = {
    green: "bg-status-normal/12 text-status-normal",
    yellow: "bg-status-warning/12 text-status-warning",
    red: "bg-status-critical/12 text-status-critical",
  };

  const labels: Record<TrafficLight, string> = {
    green: "Gruen",
    yellow: "Gelb",
    red: "Rot",
  };

  return (
    <Badge className={`rounded-full border-0 px-2.5 py-1 text-xs ${styles[status]}`}>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-current" />
        {labels[status]}
      </span>
    </Badge>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <Badge className="border-0 bg-primary/10 text-primary">{eyebrow}</Badge>
      <div>
        <h2 className="text-fluid-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function SimpleMetric({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        tone === "primary" ? "border-primary/20 bg-primary/6" : "border-border bg-background"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{helper}</p>
    </div>
  );
}

function LargeActionButton({
  children,
  variant = "default",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  onClick?: () => void;
}) {
  return (
    <Button size="lg" variant={variant} className="h-12 w-full justify-center text-base" onClick={onClick}>
      {children}
    </Button>
  );
}

function ExpertMetricRail({
  items,
}: {
  items: Array<{ label: string; value: string; helper?: string }>;
}) {
  return (
    <section className="grid gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
          {item.helper ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.helper}</p>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function buildCsv(data: DashboardExperienceData) {
  const rows = [
    ["bereich", "wert", "inhalt"],
    ["profil", "patient_id", data.ehr.patient_id],
    ["ehr", "alter", String(data.ehr.age)],
    ["ehr", "bmi", String(data.ehr.bmi)],
    ["ehr", "sys", String(data.ehr.sbp_mmhg)],
    ["ehr", "dia", String(data.ehr.dbp_mmhg)],
    ["merkmale", "bio_age", String(data.features.bioAge.bioAge)],
    ["merkmale", "kardio_status", data.features.cardioRisk.status],
    ["merkmale", "recovery_score", String(data.features.recoveryScore.score)],
    ["merkmale", "vo2max", String(data.features.vo2max.vo2max)],
  ];

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DashboardExperienceSwitcher({
  profile,
  onPersonaChange,
  onUiModeChange,
}: {
  profile: UserProfile;
  onPersonaChange: (value: string) => void;
  onUiModeChange: (value: string) => void;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-[28px] border border-border bg-surface-0 px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ansicht</p>
          <h1 className="mt-2 text-fluid-3xl font-semibold tracking-tight text-foreground">
            {getPersonaLabel(profile.persona_hint)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Waehlen Sie Darstellungsstil und Detailgrad fuer Ihre Uebersicht.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="rounded-2xl">
                  {getPersonaLabel(profile.persona_hint)}
                  <ChevronDown />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Ansicht waehlen</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={profile.persona_hint ?? "concerned-preventer"}
                  onValueChange={onPersonaChange}
                >
                  {personaTabs.map((tab) => (
                    <DropdownMenuRadioItem key={tab.value} value={tab.value}>
                      {tab.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="rounded-2xl">
                  {getUiModeLabel(profile.ui_mode)}
                  <ChevronDown />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Detailgrad waehlen</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={profile.ui_mode} onValueChange={onUiModeChange}>
                  {uiModeTabs.map((tab) => (
                    <DropdownMenuRadioItem key={tab.value} value={tab.value}>
                      {tab.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}

function PreventivePerformerExperience({ features, ehr, profile }: ExperienceProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<"sleep" | "zone2" | "strength">(
    "sleep"
  );

  const diagnostics = [
    {
      title: "Erweitertes Lipidprofil",
      description: "ApoB, Lp(a) und Partikelprofil fuer eine genauere kardiovaskulaere Einordnung.",
      priority: ehr.ldl_mmol >= 2.6 ? "Empfohlen" : "Optional",
    },
    {
      title: "VO2max-Test im Labor",
      description: "Praezise Kalibrierung der Trainingszonen und Ueberpruefung des aktuellen Schaetzwerts.",
      priority: features.vo2max.vo2max < 45 ? "Empfohlen" : "Sinnvolle Ergaenzung",
    },
    {
      title: "DEXA / Koerperzusammensetzung",
      description: "Verlauf von Muskelmasse, Fettverteilung und Belastungsreserve.",
      priority: "Zusatzangebot",
    },
  ];

  const interventionLab = {
    sleep: {
      title: "Schlaf stabilisieren",
      preview: "+3 Punkte Erholung, +4 Punkte Belastbarkeit in 6 Wochen",
      detail: "Mehr Schlafgelegenheit und eine konstantere Einschlafzeit im Alltag.",
    },
    zone2: {
      title: "Ausdauer aufbauen",
      preview: "+1,8 VO2max-Prognose, +5 Punkte im Langzeitprofil in 8 Wochen",
      detail: "Zwei zusaetzliche Ausdauereinheiten mit niedriger bis mittlerer Intensitaet.",
    },
    strength: {
      title: "Kraft gezielt staerken",
      preview: "+2 Punkte Stabilitaet, +1,5 Punkte Belastungsreserve in 6 Wochen",
      detail: "Zwei strukturierte Krafteinheiten fuer Unterkoerper und Rumpf pro Woche.",
    },
  } as const;

  const vo2Target = features.vo2max.vo2max < 40 ? 42 : features.vo2max.vo2max < 45 ? 46 : 50;
  const goalProgress = Math.min(100, Math.round((features.vo2max.vo2max / vo2Target) * 100));
  const showSupportPanels = profile.ui_mode !== "simple";
  const showExpertPanels = profile.ui_mode === "expert";
  const isSimpleMode = profile.ui_mode === "simple";

  if (isSimpleMode) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <SectionTitle
          eyebrow="Aktive Vorsorge"
          title="Grosse Uebersicht fuer heute"
          description="Wenige grosse Bausteine zeigen den aktuellen Stand, das Wochenziel und den naechsten sinnvollen Schritt."
        />

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Heute im Blick</CardTitle>
            <CardDescription className="text-base">
              Biologisches Alter {features.bioAge.bioAge.toFixed(1)} Jahre und VO2max-Ziel {vo2Target}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <SimpleMetric
              label="Biologisches Alter"
              value={`${features.bioAge.bioAge.toFixed(1)} J.`}
              helper="Ein zusammengefasster Wert aus Aktivitaet, Schlaf und Erholung."
              tone="primary"
            />
            <SimpleMetric
              label="Tagesform"
              value={`${features.recoveryScore.score}`}
              helper="Hilft bei der Entscheidung zwischen Training und Erholung."
            />
            <SimpleMetric
              label="VO2max-Ziel"
              value={`${vo2Target}`}
              helper={`Fortschritt ${goalProgress}% bis zum naechsten Ziel.`}
            />
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Diese Woche</CardTitle>
            <CardDescription className="text-base">
              Eine ausgewaehlte Massnahme mit dem groessten Nutzen fuer den naechsten Abschnitt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-primary/8 px-5 py-5">
              <p className="text-lg font-semibold text-foreground">{interventionLab[selectedIntervention].title}</p>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {interventionLab[selectedIntervention].detail}
              </p>
              <p className="mt-3 text-sm font-medium text-primary">{interventionLab[selectedIntervention].preview}</p>
            </div>
            <Tabs value={selectedIntervention} onValueChange={(value) => setSelectedIntervention(value as "sleep" | "zone2" | "strength")}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
                <TabsTrigger value="sleep">Schlaf</TabsTrigger>
                <TabsTrigger value="zone2">Ausdauer</TabsTrigger>
                <TabsTrigger value="strength">Kraft</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Naechster Schritt</CardTitle>
            <CardDescription className="text-base">
              Wenn zusaetzliche Sicherheit noetig ist, kann eine weiterfuehrende Untersuchung eingeplant werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnostics.slice(0, 2).map((diagnostic) => (
              <div key={diagnostic.title} className="rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-base font-semibold text-foreground">{diagnostic.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{diagnostic.description}</p>
              </div>
            ))}
            <LargeActionButton>
              <FlaskConical />
              Untersuchung vormerken
            </LargeActionButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle
        eyebrow="Aktive Vorsorge"
        title="Leistung, Belastbarkeit und naechster Entwicklungsschritt"
        description="Diese Ansicht buendelt Training, Erholung und Vorsorge in einer kompakten Uebersicht."
      />

      {showExpertPanels ? (
        <ExpertMetricRail
          items={[
            { label: "Bio Age Delta", value: features.bioAge.delta.toFixed(1) },
            { label: "VO2max", value: features.vo2max.vo2max.toFixed(1) },
            { label: "Recovery", value: String(features.recoveryScore.score) },
            { label: "Cardio Load", value: String(features.cardioLoad.index) },
          ]}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Biologisches Alter</CardTitle>
            <CardDescription>
              Schaetzwert {features.bioAge.bioAge.toFixed(1)} Jahre, Abweichung {features.bioAge.delta.toFixed(1)} Jahre zum tatsaechlichen Alter.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <SimpleMetric
              label="Biologisches Alter"
              value={`${features.bioAge.bioAge.toFixed(1)} J.`}
              helper="Zusammengefuehrt aus Erholung, Aktivitaet, Schlaf und Laborumfeld."
              tone="primary"
            />
            <SimpleMetric
              label="Langzeitprofil"
              value={`${features.longevityPercentile}%`}
              helper="Einordnung innerhalb des aktuellen Praeventionsmodells."
            />
            <SimpleMetric
              label="Ruhepuls"
              value={features.rhrZscore.flag ? "Ausserhalb der Basis" : "Stabil"}
              helper="Zeigt, ob der aktuelle Verlauf vom ueblichen Muster abweicht."
            />
            <div className="md:col-span-3 rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hauptfaktoren</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {features.bioAge.drivers.map((driver) => (
                  <Badge key={driver} variant="outline">
                    {driver}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>VO2max-Ziel</CardTitle>
            <CardDescription>
              Aktueller Schaetzwert {features.vo2max.vo2max.toFixed(1)}  -  naechstes Ziel {vo2Target}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={goalProgress} />
            <SimpleMetric
              label="Fortschritt"
              value={`${goalProgress}%`}
              helper="Zeigt, wie nah der aktuelle Wert am naechsten Ziel liegt."
              tone="primary"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <SimpleMetric
                label="Tagesform"
                value={`${features.recoveryScore.score}`}
                helper="Nuetzlicher Richtwert fuer Belastung oder Erholung am heutigen Tag."
              />
              <SimpleMetric
                label="Ausdauerlast"
                value={`${features.cardioLoad.index}`}
                helper="Einfacher Ueberblick zur aktuellen Trainingslast."
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Belastbarkeit heute</CardTitle>
            <CardDescription>Hilft bei der Entscheidung zwischen Aufbauen, Halten und Erholen.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <SimpleMetric
              label="Erholung"
              value={`${features.recoveryScore.score}`}
              helper="Kombiniert HRV, Ruhepuls und Tiefschlaf."
            />
            <SimpleMetric
              label="HRV-Verlauf"
              value={features.hrv30dTrend.slope >= 0 ? "Verbessert sich" : "Geht zurueck"}
              helper="Zeigt, ob sich die Erholung ueber die letzten Wochen eher stabilisiert oder abschwaecht."
            />
            <SimpleMetric
              label="Trainingsfreigabe"
              value={features.strainRecovery.flag ? "Erst erholen" : "Belastung moeglich"}
              helper="Ein einfacher Tageshinweis fuer die Trainingsplanung."
            />
            {showExpertPanels ? (
              <div className="md:col-span-3 rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mehr Details</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Im detaillierten Modus bleiben Belastung, VO2max, HRV und Abweichung des biologischen Alters sichtbar.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Interventionen vergleichen</CardTitle>
            <CardDescription>Zeigt, welche Massnahme als Naechstes den groessten Hebel haben kann.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={selectedIntervention}
              onValueChange={(value) => setSelectedIntervention(value as "sleep" | "zone2" | "strength")}
            >
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
                <TabsTrigger value="sleep">Schlaf</TabsTrigger>
                <TabsTrigger value="zone2">Ausdauer</TabsTrigger>
                <TabsTrigger value="strength">Kraft</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="rounded-2xl border border-primary/20 bg-primary/6 px-4 py-4">
              <p className="text-sm font-medium text-foreground">{interventionLab[selectedIntervention].title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {interventionLab[selectedIntervention].detail}
              </p>
              <p className="mt-3 text-sm font-medium text-primary">
                {interventionLab[selectedIntervention].preview}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {showSupportPanels ? (
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Diagnostik</CardTitle>
            <CardDescription>Zusaetzliche Untersuchungen koennen die naechste Entscheidung absichern.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {diagnostics.map((diagnostic) => (
              <div key={diagnostic.title} className="rounded-2xl border border-border bg-background px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <TestTubeDiagonal className="mt-0.5 size-4 text-primary" />
                  <Badge variant="outline">{diagnostic.priority}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{diagnostic.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {diagnostic.description}
                </p>
                <Button className="mt-4 w-full">
                  <FlaskConical />
                  Zur Planung hinzufuegen
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ConcernedPreventerExperience({ features, profile }: ExperienceProps) {
  const [plainLanguageMode, setPlainLanguageMode] = useState(true);
  const [weeklyActionDone, setWeeklyActionDone] = useState(false);
  const [memoryCheckOpen, setMemoryCheckOpen] = useState(false);
  const [memoryCheckCompleted, setMemoryCheckCompleted] = useState(false);
  const [memoryConfidence, setMemoryConfidence] = useState(3);
  const [moodState, setMoodState] = useState(3);
  const [sleepStability, setSleepStability] = useState(3);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpRequested, setFollowUpRequested] = useState(false);

  const weeklyAction =
    features.cardioRisk.status === "red"
      ? {
          title: "Praxis-Termin anfragen",
          detail: "Lassen Sie Herz-Kreislauf-Risiken zeitnah aerztlich einordnen.",
          reason: "Bei mehreren auffaelligen Signalen ist die naechste aerztliche Ruecksprache der sinnvollste Schritt.",
        }
      : {
          title: "An vier Tagen 20 Minuten zuegig gehen",
          detail: "Regelmaessige Bewegung stuetzt Herz, Stimmung und Schlaf gleichzeitig.",
          reason: "Diese Massnahme ist einfach umzusetzen und verbessert mehrere Vorsorgesignale auf einmal.",
        };

  const heartBody = plainLanguageMode
    ? features.cardioRisk.status === "green"
      ? "Die heutigen Herz-Kreislauf-Signale wirken stabil."
      : features.cardioRisk.status === "yellow"
        ? "Die heutigen Signale verdienen Aufmerksamkeit, sind aber kein Notfallhinweis."
        : "Die heutigen Signale sollten zeitnah mit einer Aerztin oder einem Arzt besprochen werden."
    : "Der aktuelle Status basiert auf Blutdruck, Risikoprofil und weiteren Vorsorgesignalen.";

  const memoryBody = plainLanguageMode
    ? features.wellbeing.depressionFlag
      ? "Stimmung und Belastbarkeit wirken etwas eingeschraenkt. Eine kurze Ruecksprache mit der Praxis kann sinnvoll sein."
      : "Gedaechtnis- und Stimmungssignale wirken im Moment eher unauffaellig."
    : "Die Einschaetzung kombiniert Wohlbefinden, Schlaf und kognitive Reserve.";

  const explainBullets = plainLanguageMode
    ? [
        features.cardioRisk.status === "green"
          ? "Ihr Herz-Kreislauf-Status wirkt heute ruhig."
          : features.cardioRisk.status === "yellow"
            ? "Einige Werte verdienen Aufmerksamkeit, aber ohne akuten Alarm."
            : "Mehrere Signale sprechen dafuer, zeitnah aerztlich nachzufassen.",
        features.sleepFragmentation.flagged
          ? "Unruhiger Schlaf kann Erholung und Stimmung spuerbar beeinflussen."
          : "Der Schlaf wirkt in den letzten Tagen eher stabil.",
        "Dies ist keine Diagnose, sondern ein Vorsorgehinweis.",
      ]
    : [
        `Kardiostatus: ${features.cardioRisk.status}.`,
        `Schlafunterbrechung: ${features.sleepFragmentation.flagged ? "auffaellig" : "nicht auffaellig"}.`,
        `Wohlbefinden: WHO-5 ${features.wellbeing.who5}.`,
      ];

  const checkInAverage = (memoryConfidence + moodState + sleepStability) / 3;
  const memoryCheckRecommendation =
    checkInAverage <= 2
      ? "Die Rueckmeldung deutet auf zusaetzlichen Unterstuetzungsbedarf hin. Ein Gespraech mit der Praxis ist sinnvoll."
      : checkInAverage < 4
        ? "Die Rueckmeldung ist gemischt. Behalten Sie den Verlauf im Blick und halten Sie den Wochenplan einfach."
        : "Die Rueckmeldung wirkt stabil. Beobachten Sie den Verlauf weiterhin in Ruhe.";

  const showExtra = profile.ui_mode !== "simple";
  const isSimpleMode = profile.ui_mode === "simple";

  if (isSimpleMode) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <SectionTitle
          eyebrow="Einfach & Sicher"
          title="Grosse und ruhige Tagesansicht"
          description="Die wichtigsten Hinweise erscheinen in grossen Karten mit klarer Sprache und wenigen Entscheidungen."
        />

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Herz heute</CardTitle>
            <CardDescription className="text-base">{heartBody}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-3xl border border-border bg-background px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-foreground">Aktueller Status</p>
                <StatusBadge status={features.cardioRisk.status} />
              </div>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Blutdruck {features.bpControl.sbp}/{features.bpControl.dbp}
              </p>
            </div>
            <LargeActionButton variant={plainLanguageMode ? "default" : "outline"} onClick={() => setPlainLanguageMode((current) => !current)}>
              <BookOpenText />
              Einfache Sprache {plainLanguageMode ? "an" : "aus"}
            </LargeActionButton>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Diese Woche</CardTitle>
            <CardDescription className="text-base">{weeklyAction.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-primary/8 px-5 py-5">
              <p className="text-base leading-relaxed text-muted-foreground">{weeklyAction.detail}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{weeklyAction.reason}</p>
            </div>
            <LargeActionButton variant={weeklyActionDone ? "secondary" : "default"} onClick={() => setWeeklyActionDone(true)}>
              <CalendarCheck2 />
              {weeklyActionDone ? "Im Wochenplan gespeichert" : "Zum Wochenplan hinzufuegen"}
            </LargeActionButton>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Praxiskontakt</CardTitle>
            <CardDescription className="text-base">
              Bei Bedarf kann direkt eine einfache Ruecksprache mit der Praxis angefragt werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border bg-background px-5 py-5">
              <p className="text-base leading-relaxed text-muted-foreground">
                Diese Anwendung gibt nur praeventive Hinweise. Erhoehte Risiken sollten medizinisch bestaetigt werden.
              </p>
            </div>
            <LargeActionButton variant={followUpRequested ? "secondary" : "default"} onClick={() => setFollowUpOpen(true)}>
              <Stethoscope />
              {followUpRequested ? "Anfrage pruefen" : "Praxis-Ruecksprache anfragen"}
            </LargeActionButton>
            <LargeActionButton variant={memoryCheckCompleted ? "secondary" : "outline"} onClick={() => setMemoryCheckOpen(true)}>
              <Brain />
              {memoryCheckCompleted ? "Check-in ansehen" : "2-Minuten-Check starten"}
            </LargeActionButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle
        eyebrow="Einfach & Sicher"
        title="Klare Einordnung mit einer ueberschaubaren naechsten Massnahme"
        description="Diese Ansicht reduziert Komplexitaet und fuehrt bei Bedarf direkt zur naechsten sinnvollen Ruecksprache."
      />

      {profile.ui_mode === "expert" ? (
        <ExpertMetricRail
          items={[
            { label: "WHO-5", value: String(features.wellbeing.who5) },
            { label: "Kognitive Reserve", value: features.cognitiveReserve.level },
            { label: "SBP", value: String(features.bpControl.sbp) },
            { label: "DBP", value: String(features.bpControl.dbp) },
          ]}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={plainLanguageMode ? "default" : "outline"}
          size="sm"
          onClick={() => setPlainLanguageMode((current) => !current)}
        >
          <BookOpenText />
          Einfache Sprache {plainLanguageMode ? "an" : "aus"}
        </Button>
        <StatusBadge status={features.cardioRisk.status} />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Herz heute</CardTitle>
            <CardDescription>Kurze Einordnung der heutigen Herz-Kreislauf-Signale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-background px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Aktuelle Einschaetzung</p>
                <StatusBadge status={features.cardioRisk.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{heartBody}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SimpleMetric
                label="Blutdruck"
                value={`${features.bpControl.sbp}/${features.bpControl.dbp}`}
                helper="Ein zentraler Vorsorgewert fuer den Alltag."
              />
              <SimpleMetric
                label="Kardiorisiko"
                value={features.cardioRisk.status === "green" ? "Stabil" : features.cardioRisk.status === "yellow" ? "Beobachten" : "Abklaeren"}
                helper="Keine Diagnose, sondern eine Einordnung fuer den naechsten Schritt."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Eine Sache diese Woche</CardTitle>
            <CardDescription>Nur eine klare Massnahme, damit der Plan realistisch bleibt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-primary/6 px-4 py-4">
              <p className="text-sm font-medium text-foreground">{weeklyAction.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {weeklyAction.detail}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {weeklyAction.reason}
              </p>
            </div>
            <Button
              variant={weeklyActionDone ? "secondary" : "default"}
              onClick={() => setWeeklyActionDone(true)}
            >
              <CalendarCheck2 />
              {weeklyActionDone ? "Im Wochenplan gespeichert" : "Zum Wochenplan hinzufuegen"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Einfach erklaert</CardTitle>
            <CardDescription>
              {plainLanguageMode
                ? "Die Hinweise werden bewusst ruhig und verstaendlich formuliert."
                : "Der Text ist etwas technischer formuliert."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {explainBullets.map((bullet) => (
              <div key={bullet} className="flex gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <span className="mt-1 size-2 rounded-full bg-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">{bullet}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Gedaechtnis & Stimmung</CardTitle>
            <CardDescription>Kurzer Check-in fuer Alltag, Belastung und Schlaf.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Aktuelle Einordnung</p>
                <StatusBadge
                  status={features.wellbeing.depressionFlag ? "yellow" : "green"}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{memoryBody}</p>
            </div>
            {showExtra ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <SimpleMetric
                  label="Wohlbefinden"
                  value={`${features.wellbeing.who5}`}
                  helper="Kurzueberblick zum aktuellen Befinden."
                />
                <SimpleMetric
                  label="Kognitive Reserve"
                  value={features.cognitiveReserve.level}
                  helper="Einfacher Hinweis auf geistige Stabilitaet und Alltagsfunktion."
                />
              </div>
            ) : null}
            <Button
              variant={memoryCheckCompleted ? "secondary" : "outline"}
              onClick={() => setMemoryCheckOpen(true)}
            >
              <Brain />
              {memoryCheckCompleted ? "Check-in ansehen" : "2-Minuten-Check starten"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="border-0 bg-surface-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-xs uppercase tracking-[0.18em]">Naechster Schritt</span>
          </div>
          <CardTitle>Praxisnaher weiterer Weg</CardTitle>
          <CardDescription>Bei Bedarf geht es direkt in eine einfache Ruecksprache mit der Praxis.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {followUpRequested ? "Anfrage an die Praxis wurde vorgemerkt." : "Direkte Weiterleitung ohne unnoetige Zwischenschritte."}
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Diese Anwendung gibt nur praeventive Hinweise. Bei erhoehtem Risiko sollten Ergebnisse mit einer Aerztin oder einem Arzt bestaetigt werden.
            </p>
          </div>
          <Button onClick={() => setFollowUpOpen(true)} variant={followUpRequested ? "secondary" : "default"}>
            <Stethoscope />
            {followUpRequested ? "Anfrage pruefen" : "Praxis-Ruecksprache anfragen"}
          </Button>
        </CardContent>
      </Card>

      <Sheet open={memoryCheckOpen} onOpenChange={setMemoryCheckOpen}>
        <SheetContent side="right" className="w-full max-w-xl gap-0">
          <SheetHeader className="border-b">
            <SheetTitle>Gedaechtnis- und Stimmungs-Check</SheetTitle>
            <SheetDescription>
              Eine kurze Selbstabfrage fuer Vertrauen, Stimmung und Schlaf.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 p-4">
            {[
              {
                label: "Wie sicher fuehlen Sie sich aktuell im Alltag mit Gedaechtnis und Konzentration?",
                value: memoryConfidence,
                setValue: setMemoryConfidence,
              },
              {
                label: "Wie gut fuehlen Sie sich im Moment emotional getragen?",
                value: moodState,
                setValue: setMoodState,
              },
              {
                label: "Wie stabil war Ihr Schlaf in den letzten Tagen?",
                value: sleepStability,
                setValue: setSleepStability,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Button
                      key={score}
                      variant={item.value === score ? "default" : "outline"}
                      onClick={() => item.setValue(score)}
                    >
                      {score}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Aktuelle Zusammenfassung</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">{memoryCheckRecommendation}</p>
            </div>
          </div>
          <SheetFooter className="border-t">
            <Button variant="outline" onClick={() => setMemoryCheckOpen(false)}>
              Schliessen
            </Button>
            <Button
              onClick={() => {
                setMemoryCheckCompleted(true);
                setMemoryCheckOpen(false);
              }}
            >
              <ClipboardCheck />
              Check-in speichern
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <SheetContent side="right" className="w-full max-w-xl gap-0">
          <SheetHeader className="border-b">
            <SheetTitle>Praxis-Ruecksprache</SheetTitle>
            <SheetDescription>
              Ein einfacher Uebergang zur weiteren Abklaerung in der Praxis.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 p-4">
            <SimpleMetric
              label="Empfohlener naechster Schritt"
              value={features.cardioRisk.status === "red" ? "Kardiovaskulaere Vorsorge-Sprechstunde" : "Praeventive Nachbesprechung"}
              helper="Der naechste Schritt soll einfach, verstaendlich und gut anschlussfaehig sein."
            />
            <SimpleMetric
              label="Zeitfenster"
              value={features.cardioRisk.status === "red" ? "Innerhalb von 7 Tagen" : "Innerhalb von 14 bis 30 Tagen"}
              helper="Bei erhoehtem Risiko sollte die Ruecksprache nicht aufgeschoben werden."
            />
          </div>
          <SheetFooter className="border-t">
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                setFollowUpRequested(true);
                setFollowUpOpen(false);
              }}
            >
              <CheckCircle2 />
              Anfrage bestaetigen
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DigitalOptimizerExperience({
  ehr,
  wearable,
  lifestyle,
  features,
  dailyScoreData,
  vitalChartData,
  priorityCoachSuggestions,
  profile,
}: ExperienceProps) {
  const [activeProtocol, setActiveProtocol] = useState("sleep-reset");

  const driftFlags = features.biomarkerDrift.metrics.filter((metric) => metric.flagged);
  const protocols = [
    {
      id: "sleep-reset",
      title: "Schlaf stabilisieren",
      description: "Schlafzeiten beruhigen und Erholung ueber die naechsten Tage vertiefen.",
      outcome: "Unterstuetzt circadiane Stabilitaet, HRV und Erholung am Folgetag.",
    },
    {
      id: "metabolic-trim",
      title: "Stoffwechsel entlasten",
      description: "Essenszeiten und Belastung so anpassen, dass Glukose und Energie ruhiger verlaufen.",
      outcome: "Unterstuetzt Stoffwechsel, Entzuendungsprofil und Energiebalance.",
    },
    {
      id: "recovery-deload",
      title: "Belastung reduzieren",
      description: "Kumulierte Belastung kurz senken, damit Ruhepuls und Erholung zurueckfinden.",
      outcome: "Zielt auf das Verhaeltnis von Belastung zu Erholung und auf fruehzeitige Drift-Korrektur.",
    },
  ];

  const exportPayload = useMemo(
    () => ({
      ehr,
      lifestyle,
      features,
      wearable: wearable.slice(-14),
    }),
    [ehr, lifestyle, features, wearable]
  );

  const showExpertPanels = profile.ui_mode === "expert";
  const isSimpleMode = profile.ui_mode === "simple";

  if (isSimpleMode) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <SectionTitle
          eyebrow="Daten & Trends"
          title="Wichtige Veraenderungen auf einen Blick"
          description="Die kompakte Ansicht zeigt nur die wichtigsten Trends, den naechsten Plan und den Export."
        />

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Heute wichtig</CardTitle>
            <CardDescription className="text-base">
              Erholung {features.recoveryScore.score}, Belastungsverhaeltnis {features.strainRecovery.ratio.toFixed(2)} und Rhythmus {features.circadianConsistency.score}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <SimpleMetric label="Erholung" value={`${features.recoveryScore.score}`} helper="Kombiniert HRV, Ruhepuls und Tiefschlaf." tone="primary" />
            <SimpleMetric label="Rhythmus" value={`${features.circadianConsistency.score}`} helper="Zeigt, wie regelmaessig Schlaf und Aktivitaet verlaufen." />
            <SimpleMetric label="Entzuendung" value={features.inflammation.level} helper={`Modellwert ${features.inflammation.score}.`} />
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Naechstes Protokoll</CardTitle>
            <CardDescription className="text-base">Ein klarer Plan fuer den naechsten sinnvollen Anpassungsschritt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {protocols
              .filter((protocol) => protocol.id === activeProtocol)
              .map((protocol) => (
                <div key={protocol.id} className="rounded-3xl bg-primary/8 px-5 py-5">
                  <p className="text-lg font-semibold text-foreground">{protocol.title}</p>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{protocol.description}</p>
                  <p className="mt-3 text-sm font-medium text-primary">{protocol.outcome}</p>
                </div>
              ))}
            <Tabs value={activeProtocol} onValueChange={setActiveProtocol}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
                {protocols.map((protocol) => (
                  <TabsTrigger key={protocol.id} value={protocol.id}>
                    {protocol.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Export</CardTitle>
            <CardDescription className="text-base">Daten fuer Praxis, Coaching oder eigene Auswertung herunterladen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <LargeActionButton
              variant="outline"
              onClick={() =>
                triggerDownload(
                  "longeviq-export.csv",
                  buildCsv({ ehr, wearable, lifestyle, features, dailyScoreData, vitalChartData, priorityCoachSuggestions }),
                  "text/csv;charset=utf-8"
                )
              }
            >
              <Download />
              CSV herunterladen
            </LargeActionButton>
            <LargeActionButton
              variant="outline"
              onClick={() =>
                triggerDownload(
                  "longeviq-export.json",
                  JSON.stringify(exportPayload, null, 2),
                  "application/json;charset=utf-8"
                )
              }
            >
              <Download />
              JSON herunterladen
            </LargeActionButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle
        eyebrow="Daten & Trends"
        title="Verlauf, Drift und exportfaehige Uebersicht"
        description="Diese Ansicht richtet sich an Nutzerinnen und Nutzer, die Veraenderungen frueh erkennen und systematisch nachsteuern moechten."
      />

      {showExpertPanels ? (
        <ExpertMetricRail
          items={[
            { label: "Recovery", value: String(features.recoveryScore.score) },
            { label: "Strain Ratio", value: features.strainRecovery.ratio.toFixed(2) },
            { label: "Circadian", value: String(features.circadianConsistency.score) },
            { label: "Inflammation", value: features.inflammation.level },
          ]}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <SimpleMetric
          label="Erholung"
          value={`${features.recoveryScore.score}`}
          helper="Kombiniert HRV, Ruhepuls und Tiefschlaf."
          tone="primary"
        />
        <SimpleMetric
          label="Belastungsverhaeltnis"
          value={features.strainRecovery.ratio.toFixed(2)}
          helper="Zeigt das Verhaeltnis von Belastung zu aktueller Erholung."
        />
        <SimpleMetric
          label="Rhythmus"
          value={`${features.circadianConsistency.score}`}
          helper="Einfacher Hinweis, wie regelmaessig Schlaf und Aktivitaet verlaufen."
        />
        <SimpleMetric
          label="Entzuendung"
          value={features.inflammation.level}
          helper={`Aktueller Modellwert: ${features.inflammation.score}.`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Protokolle</CardTitle>
            <CardDescription>Mehrere Signale werden in einen klaren Handlungsplan uebersetzt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeProtocol} onValueChange={setActiveProtocol}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
                {protocols.map((protocol) => (
                  <TabsTrigger key={protocol.id} value={protocol.id}>
                    {protocol.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {protocols
              .filter((protocol) => protocol.id === activeProtocol)
              .map((protocol) => (
                <div key={protocol.id} className="rounded-2xl border border-primary/20 bg-primary/6 px-4 py-4">
                  <p className="text-sm font-medium text-foreground">{protocol.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {protocol.description}
                  </p>
                  <p className="mt-3 text-sm font-medium text-primary">{protocol.outcome}</p>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Fruehe Abweichungen</CardTitle>
            <CardDescription>Zeigt an, welche Signale sich langsam vom bisherigen Muster entfernen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {driftFlags.length > 0 ? (
              driftFlags.map((flag) => (
                <div key={flag.name} className="rounded-2xl border border-border bg-background px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{flag.name}</p>
                    <StatusBadge status="yellow" />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Drift-Wert {flag.drift.toFixed(2)}. Dieses Signal weicht staerker als ueblich vom bisherigen Verlauf ab.
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-sm font-medium text-foreground">Derzeit keine deutlichen Abweichungen</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  In der letzten Auswertung wurden keine auffaelligen Veraenderungen gegenueber dem Basisverlauf erkannt.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Biomarker-Verlauf</CardTitle>
            <CardDescription>Fasst Labor- und Erholungssignale in ihrer Richtung zusammen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <SimpleMetric label="LDL" value={`${ehr.ldl_mmol.toFixed(1)} mmol/L`} helper="Wichtiger Marker fuer den Herz-Kreislauf-Kontext." />
              <SimpleMetric label="HbA1c" value={`${ehr.hba1c_pct.toFixed(1)} %`} helper="Zeigt die Stoffwechsellage ueber laengere Zeit." />
              <SimpleMetric label="CRP" value={`${ehr.crp_mg_l.toFixed(1)} mg/L`} helper="Hilft bei der Einordnung des Entzuendungsumfelds." />
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Einordnung</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Entscheidend ist nicht nur der einzelne Messwert, sondern die Richtung ueber mehrere Zeitpunkte hinweg.
              </p>
            </div>
            {showExpertPanels ? (
              <div className="grid gap-3 md:grid-cols-2">
                <SimpleMetric
                  label="Energiebalance"
                  value={features.insights.energyBalance.direction}
                  helper="Vereinfacht, ob sich Belastung und Energie gerade eher ausgleichen oder auseinanderlaufen."
                />
                <SimpleMetric
                  label="Erholungsprognose"
                  value={`${features.insights.recoveryPrediction.predictedRecovery}`}
                  helper="Kurzer Ausblick fuer die naechste Erholungsphase."
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Datenexport</CardTitle>
            <CardDescription>Daten koennen fuer Praxis, Coaching oder externe Auswertung exportiert werden.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-primary/6 px-4 py-4">
              <p className="text-sm font-medium text-foreground">Aktuelles Exportpaket</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enthaelt Basisdaten, Fragebogen, die letzten Wearable-Daten und berechnete Merkmale.
              </p>
            </div>
            <div className="grid gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  triggerDownload(
                    "longeviq-export.csv",
                    buildCsv({
                      ehr,
                      wearable,
                      lifestyle,
                      features,
                      dailyScoreData,
                      vitalChartData,
                      priorityCoachSuggestions,
                    }),
                    "text/csv;charset=utf-8"
                  )
                }
              >
                <Download />
                CSV herunterladen
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  triggerDownload(
                    "longeviq-export.json",
                    JSON.stringify(exportPayload, null, 2),
                    "application/json;charset=utf-8"
                  )
                }
              >
                <Download />
                JSON herunterladen
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ClinicAnchoredLoyalistExperience({ features, profile }: ExperienceProps) {
  const [visitPrepOpen, setVisitPrepOpen] = useState(false);
  const [visitPrepDone, setVisitPrepDone] = useState(false);

  const oneNumberScore = Math.round(
    (features.clinicEngagement.score +
      features.walkStreak.days * 8 +
      (features.bpControl.status === "green" ? 28 : features.bpControl.status === "yellow" ? 20 : 10) +
      (features.fallRisk.level === "green" ? 24 : features.fallRisk.level === "yellow" ? 16 : 8)) /
      3
  );

  const doctorVoice = [
    "Bringen Sie Ihre aktuelle Medikamentenliste und die letzten Blutdruckwerte zum Termin mit.",
    "Halten Sie die woechentliche Geh-Routine moeglichst konstant.",
    "Bei staerkerer Muedigkeit oder Schwindel sollte die Praxis den Blutdruck zeitnah erneut pruefen.",
  ];

  const showExtended = profile.ui_mode !== "simple";
  const isSimpleMode = profile.ui_mode === "simple";

  if (isSimpleMode) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <SectionTitle
          eyebrow="Klinikbegleitung"
          title="Ruhige Uebersicht fuer den naechsten Termin"
          description="Die kompakte Ansicht fasst nur den Status, die wichtigsten Hinweise und die Terminvorbereitung zusammen."
        />

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Uebersichtswert</CardTitle>
            <CardDescription className="text-base">Ein zentraler Wert fuer den naechsten Praxis-Kontakt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[28px] bg-primary/8 px-6 py-8 text-center">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Aktueller Wert</p>
              <p className="mt-2 text-6xl font-semibold tracking-tight text-foreground">{oneNumberScore}</p>
            </div>
            <SimpleMetric
              label="Blutdruck"
              value={`${features.bpControl.sbp}/${features.bpControl.dbp}`}
              helper="Wichtiger Basiswert fuer den Arztkontakt."
              tone="primary"
            />
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Hinweise aus der Praxis</CardTitle>
            <CardDescription className="text-base">Kurze Empfehlungen fuer den Alltag bis zum Termin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctorVoice.slice(0, 2).map((note) => (
              <div key={note} className="rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-base leading-relaxed text-muted-foreground">{note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Termin vorbereiten</CardTitle>
            <CardDescription className="text-base">Die wichtigsten Unterlagen in wenigen Schritten vorbereiten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LargeActionButton onClick={() => setVisitPrepOpen(true)}>
              <MapPinned />
              {visitPrepDone ? "Vorbereitung pruefen" : "Vorbereitung oeffnen"}
            </LargeActionButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle
        eyebrow="Klinikbegleitung"
        title="Eine uebersichtliche Vorbereitung fuer den naechsten Arztkontakt"
        description="Diese Ansicht verdichtet die wichtigsten Informationen fuer eine ruhige, praxisnahe Nachbesprechung."
      />

      {profile.ui_mode === "expert" ? (
        <ExpertMetricRail
          items={[
            { label: "Klinikbindung", value: String(features.clinicEngagement.score) },
            { label: "Walk Streak", value: String(features.walkStreak.days) },
            { label: "SBP", value: String(features.bpControl.sbp) },
            { label: "Fall Risk", value: features.fallRisk.level },
          ]}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Uebersichtswert</CardTitle>
            <CardDescription>Ein zusammengefasster Score fuer den naechsten Praxis-Kontakt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[28px] bg-primary/8 px-6 py-8 text-center">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Aktueller Wert</p>
              <p className="mt-2 text-6xl font-semibold tracking-tight text-foreground">{oneNumberScore}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Zusammengesetzt aus Praxisbindung, Blutdruck, Geh-Routine und Sturzrisiko.
              </p>
            </div>
            <Progress value={oneNumberScore} />
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Hinweise aus der Praxis</CardTitle>
            <CardDescription>Kurze, klare Empfehlungen in einer ruhigen medizinischen Sprache.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctorVoice.map((note, index) => (
              <div key={note} className="rounded-2xl border border-border bg-background px-4 py-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="size-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Hinweis {index + 1}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Zusammenfassung fuer die Praxis</CardTitle>
            <CardDescription>Konzentriert sich auf wenige Werte, die im Termin wirklich hilfreich sind.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <SimpleMetric
              label="Blutdruck"
              value={`${features.bpControl.sbp}/${features.bpControl.dbp}`}
              helper="Wichtiger Basiswert fuer den naechsten Arztkontakt."
              tone="primary"
            />
            <SimpleMetric
              label="Prediabetes"
              value={features.prediabetes.status}
              helper="Ein Hinweis auf Stoffwechselrisiko, noch keine Diagnose."
            />
            <SimpleMetric
              label="Medikamente"
              value={`${features.medicationBurden.count}`}
              helper="Anzahl der aktuell hinterlegten Medikamente."
            />
            <SimpleMetric
              label="Sturzrisiko"
              value={features.fallRisk.level}
              helper={features.fallRisk.factors.length > 0 ? features.fallRisk.factors.join(", ") : "Keine auffaelligen Faktoren sichtbar."}
            />
            {showExtended ? (
              <div className="sm:col-span-2 rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Praxisbindung</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Der aktuelle Verlauf zeigt, wie eng die Nutzerin oder der Nutzer bereits an bestehende Versorgungswege angebunden ist.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle>Termin vorbereiten</CardTitle>
            <CardDescription>Hilft dabei, den naechsten Praxisbesuch klar und ruhig vorzubereiten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-primary/6 px-4 py-4">
              <p className="text-sm font-medium text-foreground">Naechster Termin</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Bringen Sie die wichtigsten Unterlagen mit und notieren Sie eine klare Frage fuer das Gespraech.
              </p>
            </div>
            <Button onClick={() => setVisitPrepOpen(true)}>
              <MapPinned />
              {visitPrepDone ? "Vorbereitung pruefen" : "Vorbereitung oeffnen"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Sheet open={visitPrepOpen} onOpenChange={setVisitPrepOpen}>
        <SheetContent side="right" className="w-full max-w-xl gap-0">
          <SheetHeader className="border-b">
            <SheetTitle>Terminvorbereitung</SheetTitle>
            <SheetDescription>Eine kurze Checkliste fuer das naechste Gespraech in der Praxis.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 p-4">
            {[
              "Aktuelle Medikamentenliste mit Dosierungen bereitlegen.",
              "Die letzten Blutdruckwerte notieren.",
              "Eine konkrete Frage oder ein Symptom fuer das Gespraech festhalten.",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-sm font-medium text-foreground">Schritt {index + 1}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
          <SheetFooter className="border-t">
            <Button variant="outline" onClick={() => setVisitPrepOpen(false)}>
              Schliessen
            </Button>
            <Button
              onClick={() => {
                setVisitPrepDone(true);
                setVisitPrepOpen(false);
              }}
            >
              <CheckCircle2 />
              Vorbereitung speichern
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function PersonaDashboard({
  profile,
  data,
  onPersonaChange,
  onUiModeChange,
}: {
  profile: UserProfile;
  data: DashboardExperienceData;
  onPersonaChange: (value: string) => void;
  onUiModeChange: (value: string) => void;
}) {
  const persona = profile.persona_hint ?? "concerned-preventer";

  return (
    <div className="flex flex-col gap-8">
      <DashboardExperienceSwitcher
        profile={profile}
        onPersonaChange={onPersonaChange}
        onUiModeChange={onUiModeChange}
      />

      {persona === "preventive-performer" ? (
        <PreventivePerformerExperience {...data} profile={profile} />
      ) : persona === "digital-optimizer" ? (
        <DigitalOptimizerExperience {...data} profile={profile} />
      ) : persona === "clinic-anchored-loyalist" ? (
        <ClinicAnchoredLoyalistExperience {...data} profile={profile} />
      ) : (
        <ConcernedPreventerExperience {...data} profile={profile} />
      )}
    </div>
  );
}


