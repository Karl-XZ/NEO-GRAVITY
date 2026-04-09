"use client";

import { BiomarkerSection } from "@/components/biomarkers/biomarker-section";
import type { BiomarkerRowProps } from "@/components/biomarkers/biomarker-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { bioAgeEstimate, hrv30dTrend, vo2maxProxy } from "@/lib/features";
import type { EhrRecord, WearableTelemetry } from "@/lib/types";

function getHrStatus(hr: number): "normal" | "warning" | "critical" {
  if (hr <= 70) return "normal";
  if (hr <= 80) return "warning";
  return "critical";
}

function getHrvStatus(hrv: number): "normal" | "warning" | "critical" {
  if (hrv >= 40) return "normal";
  if (hrv >= 25) return "warning";
  return "critical";
}

function getSpo2Status(spo2: number): "normal" | "warning" | "critical" {
  if (spo2 >= 96) return "normal";
  if (spo2 >= 93) return "warning";
  return "critical";
}

function categoryBadge(markers: BiomarkerRowProps[]) {
  const warn = markers.filter(
    (marker) => marker.status === "warning" || marker.status === "critical",
  ).length;
  if (warn === 0) return null;
  return warn;
}

function priorityClasses(priority: "Hoch" | "Mittel" | "Basis") {
  if (priority === "Hoch") return "border-status-critical/30 text-status-critical";
  if (priority === "Mittel") return "border-status-warning/30 text-status-warning";
  return "border-primary/20 text-primary";
}

interface BiomarkersClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
}

export function BiomarkersClient({ ehr, wearable }: BiomarkersClientProps) {
  const latestWearable = wearable[wearable.length - 1];
  const bioAge = bioAgeEstimate(ehr, wearable);
  const vo2max = vo2maxProxy(ehr, wearable);
  const hrvTrend = hrv30dTrend(wearable);

  const cardiovascularMarkers: BiomarkerRowProps[] = [
    {
      name: "Blutdruck",
      subtitle: "Systolisch / Diastolisch",
      value: `${ehr.sbp_mmhg}/${ehr.dbp_mmhg}`,
      unit: "mmHg",
      status:
        ehr.sbp_mmhg < 120 && ehr.dbp_mmhg < 80
          ? "normal"
          : ehr.sbp_mmhg < 140 && ehr.dbp_mmhg < 90
            ? "warning"
            : "critical",
      reference: "Ziel: < 120/80 mmHg",
      rangePercent: Math.round((ehr.sbp_mmhg / 180) * 100),
    },
    {
      name: "Gesamtcholesterin",
      value: Number(ehr.total_cholesterol_mmol).toFixed(1),
      unit: "mmol/L",
      status:
        Number(ehr.total_cholesterol_mmol) > 5.0 ? "warning" : "normal",
      reference: "Ziel: < 5.0 mmol/L",
      rangePercent: Math.round((Number(ehr.total_cholesterol_mmol) / 8) * 100),
    },
    {
      name: "LDL-Cholesterin",
      value: Number(ehr.ldl_mmol).toFixed(1),
      unit: "mmol/L",
      status:
        Number(ehr.ldl_mmol) > 3.0
          ? "critical"
          : Number(ehr.ldl_mmol) > 2.6
            ? "warning"
            : "normal",
      reference: "Ziel: < 2.6 mmol/L",
      rangePercent: Math.round((Number(ehr.ldl_mmol) / 5) * 100),
    },
    {
      name: "HDL-Cholesterin",
      value: Number(ehr.hdl_mmol).toFixed(1),
      unit: "mmol/L",
      status: Number(ehr.hdl_mmol) >= 1.0 ? "normal" : "warning",
      reference: "Ziel: > 1.0 mmol/L",
      rangePercent: Math.round((Number(ehr.hdl_mmol) / 2.5) * 100),
    },
    {
      name: "Triglyzeride",
      value: Number(ehr.triglycerides_mmol).toFixed(1),
      unit: "mmol/L",
      status: Number(ehr.triglycerides_mmol) < 2.0 ? "normal" : "warning",
      reference: "Ziel: < 2.0 mmol/L",
      rangePercent: Math.round((Number(ehr.triglycerides_mmol) / 4) * 100),
    },
  ];

  const metabolicMarkers: BiomarkerRowProps[] = [
    {
      name: "HbA1c",
      subtitle: "Langzeit-Blutzucker",
      value: Number(ehr.hba1c_pct).toFixed(1),
      unit: "%",
      status:
        Number(ehr.hba1c_pct) < 5.7
          ? "normal"
          : Number(ehr.hba1c_pct) < 6.5
            ? "warning"
            : "critical",
      reference: "Ziel: < 5.7%",
      rangePercent: Math.round((Number(ehr.hba1c_pct) / 10) * 100),
    },
    {
      name: "Nuchternglukose",
      value: Number(ehr.fasting_glucose_mmol).toFixed(1),
      unit: "mmol/L",
      status: Number(ehr.fasting_glucose_mmol) <= 5.5 ? "normal" : "warning",
      reference: "Ziel: 3.9 - 5.5 mmol/L",
      rangePercent: Math.round((Number(ehr.fasting_glucose_mmol) / 10) * 100),
    },
    {
      name: "BMI",
      subtitle: "Body-Mass-Index",
      value: Number(ehr.bmi).toFixed(1),
      unit: "kg/m2",
      status:
        Number(ehr.bmi) >= 18.5 && Number(ehr.bmi) <= 24.9
          ? "normal"
          : "warning",
      reference: "Ziel: 18.5 - 24.9",
      rangePercent: Math.round((Number(ehr.bmi) / 40) * 100),
    },
  ];

  const renalInflammatoryMarkers: BiomarkerRowProps[] = [
    {
      name: "eGFR",
      subtitle: "Geschatzte glomerulare Filtrationsrate",
      value: String(ehr.egfr_ml_min),
      unit: "mL/min",
      status:
        Number(ehr.egfr_ml_min) >= 90
          ? "normal"
          : Number(ehr.egfr_ml_min) >= 60
            ? "warning"
            : "critical",
      reference: "Ziel: > 90 mL/min",
      rangePercent: Math.round((Number(ehr.egfr_ml_min) / 120) * 100),
    },
    {
      name: "CRP",
      subtitle: "C-reaktives Protein",
      value: Number(ehr.crp_mg_l).toFixed(1),
      unit: "mg/L",
      status:
        Number(ehr.crp_mg_l) < 1.0
          ? "normal"
          : Number(ehr.crp_mg_l) < 3.0
            ? "warning"
            : "critical",
      reference: "Ziel: < 1.0 mg/L",
      rangePercent: Math.round((Number(ehr.crp_mg_l) / 5) * 100),
    },
  ];

  const vitalsMarkers: BiomarkerRowProps[] = latestWearable
    ? [
        {
          name: "Ruheherzfrequenz",
          subtitle: `Letzter Tag: ${latestWearable.date}`,
          value: String(latestWearable.resting_hr_bpm),
          unit: "bpm",
          status: getHrStatus(latestWearable.resting_hr_bpm),
          reference: "Ziel: 50 - 70 bpm",
          rangePercent: Math.round((latestWearable.resting_hr_bpm / 120) * 100),
        },
        {
          name: "Herzratenvariabilitat",
          subtitle: "HRV (RMSSD)",
          value: String(latestWearable.hrv_rmssd_ms),
          unit: "ms",
          status: getHrvStatus(Number(latestWearable.hrv_rmssd_ms)),
          reference: "Ziel: > 40 ms",
          rangePercent: Math.round((Number(latestWearable.hrv_rmssd_ms) / 100) * 100),
        },
        {
          name: "Sauerstoffsattigung",
          subtitle: "SpO2 Durchschnitt",
          value: String(latestWearable.spo2_avg_pct),
          unit: "%",
          status: getSpo2Status(Number(latestWearable.spo2_avg_pct)),
          reference: "Ziel: > 96%",
          rangePercent: Math.round(
            ((Number(latestWearable.spo2_avg_pct) - 88) / (100 - 88)) * 100,
          ),
        },
      ]
    : [];

  const allMarkers = [
    ...cardiovascularMarkers,
    ...metabolicMarkers,
    ...renalInflammatoryMarkers,
    ...vitalsMarkers,
  ];

  const countByStatus = {
    normal: allMarkers.filter((marker) => marker.status === "normal").length,
    warning: allMarkers.filter((marker) => marker.status === "warning").length,
    critical: allMarkers.filter((marker) => marker.status === "critical").length,
  };

  const diagnostics = [
    {
      title: "ApoB + Lp(a)",
      priority: ehr.ldl_mmol >= 2.6 ? "Hoch" : "Mittel",
      reason:
        ehr.ldl_mmol >= 2.6
          ? "LDL liegt uber dem Prevention-Ziel und sollte tiefer aufgesplittet werden."
          : "Erganzt den Basis-Lipidcheck um Residualrisiko und Genetik.",
    },
    {
      title: "Formaler VO2max Test",
      priority: vo2max.vo2max < 45 ? "Hoch" : "Mittel",
      reason:
        "Kalibriert Trainingszonen, validiert den Proxy und macht Interventionen messbar.",
    },
    {
      title: "CGM Snapshot fur 14 Tage",
      priority: ehr.hba1c_pct >= 5.7 ? "Hoch" : "Basis",
      reason:
        "Zeigt, wie Mahlzeiten, Schlaf und Training auf die Glukoseantwort einzahlen.",
    },
  ] as const;

  const breakdownCards = [
    {
      label: "Bio-Age",
      value: `${bioAge.bioAge}`,
      note: `${bioAge.delta > 0 ? "+" : ""}${bioAge.delta} Jahre vs. chronologisch`,
    },
    {
      label: "VO2max Proxy",
      value: `${vo2max.vo2max}`,
      note: vo2max.percentile,
    },
    {
      label: "HRV Trend",
      value: `${hrvTrend.slope > 0 ? "+" : ""}${hrvTrend.slope}`,
      note: hrvTrend.interpretation,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-in mb-8">
        <Badge className="w-fit border-0 bg-primary/12 text-primary">
          Preventive Performer
        </Badge>
        <h1 className="mt-3 text-fluid-2xl font-semibold tracking-tight text-foreground">
          Biomarker und Biological Age Breakdown
        </h1>
        <p className="mt-2 max-w-3xl text-fluid-base text-muted-foreground">
          Ein kompakter Ueberblick zuerst, die Detailwerte direkt darunter nach Kategorie sortiert.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="gap-1.5 border-status-normal/30 text-status-normal">
            <span className="inline-block size-1.5 rounded-full bg-status-normal" />
            <span className="font-data">{countByStatus.normal}</span>
            <span>Normal</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-status-warning/30 text-status-warning">
            <span className="inline-block size-1.5 rounded-full bg-status-warning" />
            <span className="font-data">{countByStatus.warning}</span>
            <span>Grenzwertig</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-status-critical/30 text-status-critical">
            <span className="inline-block size-1.5 rounded-full bg-status-critical" />
            <span className="font-data">{countByStatus.critical}</span>
            <span>Erhoht</span>
          </Badge>
        </div>
      </header>

      <section className="animate-in stagger-1 mb-8 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              Age & Fitness Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {breakdownCards.map((item) => (
                <div key={item.label} className="rounded-2xl bg-surface-2/60 p-4">
                  <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 font-data text-3xl text-foreground">{item.value}</p>
                  <p className="mt-1 text-fluid-xs text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-surface-2/50 p-4">
              <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                Haupttreiber
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bioAge.drivers.map((driver) => (
                  <span
                    key={driver}
                    className="rounded-full bg-surface-0 px-3 py-1 text-fluid-xs text-foreground/80 ring-1 ring-border"
                  >
                    {driver}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              Priorisierte Diagnostik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-fluid-sm leading-relaxed text-muted-foreground">
              Nur die naechsten Tests mit dem groessten Zusatznutzen fuer Risiko, Kalibrierung und Training.
            </p>
            {diagnostics.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-surface-2/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-fluid-base font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-fluid-sm leading-relaxed text-muted-foreground">
                      {item.reason}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={priorityClasses(item.priority)}
                  >
                    {item.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="cardiovascular" className="animate-in stagger-2">
        <TabsList variant="line" className="mb-8 w-full flex-wrap gap-1">
          <TabsTrigger value="cardiovascular" className="gap-1.5">
            Kardiovaskular
            {categoryBadge(cardiovascularMarkers) && (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-status-warning/15 text-[10px] font-data text-status-warning">
                {categoryBadge(cardiovascularMarkers)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="metabolic" className="gap-1.5">
            Metabolisch
            {categoryBadge(metabolicMarkers) && (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-status-warning/15 text-[10px] font-data text-status-warning">
                {categoryBadge(metabolicMarkers)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="renal" className="gap-1.5">
            Niere & Entzundung
            {categoryBadge(renalInflammatoryMarkers) && (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-status-warning/15 text-[10px] font-data text-status-warning">
                {categoryBadge(renalInflammatoryMarkers)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vitals" className="gap-1.5">
            Vitaldaten
            {categoryBadge(vitalsMarkers) && (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-status-warning/15 text-[10px] font-data text-status-warning">
                {categoryBadge(vitalsMarkers)}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cardiovascular">
          <BiomarkerSection
            title="Kardiovaskulare Marker"
            description="Blutdruck- und Lipidprofil zur Einschatzung des Herz-Kreislauf-Risikos."
            markers={cardiovascularMarkers}
          />
        </TabsContent>

        <TabsContent value="metabolic">
          <BiomarkerSection
            title="Metabolische Marker"
            description="Blutzucker- und Stoffwechselwerte zur Beurteilung des metabolischen Gesundheitszustands."
            markers={metabolicMarkers}
          />
        </TabsContent>

        <TabsContent value="renal">
          <BiomarkerSection
            title="Nieren- und Entzundungsmarker"
            description="Nierenfunktion und systemische Entzundungsparameter."
            markers={renalInflammatoryMarkers}
          />
        </TabsContent>

        <TabsContent value="vitals">
          <BiomarkerSection
            title="Vitaldaten"
            description="Aktuelle Wearable-Messwerte vom letzten erfassten Tag."
            markers={vitalsMarkers}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-12 border-t border-border pt-6">
        <p className="text-fluid-xs leading-relaxed text-muted-foreground">
          Referenzwerte dienen der Orientierung. Fuer die tatsaechliche Priorisierung sollten auffaellige Marker und empfohlene Zusatzdiagnostik zusammen betrachtet werden.
        </p>
      </div>
    </div>
  );
}
