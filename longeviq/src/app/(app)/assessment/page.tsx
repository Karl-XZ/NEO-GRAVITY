'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ClipboardList,
  Database,
  Footprints,
  HeartPulse,
  LoaderCircle,
  MoonStar,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/components/AppState';
import type { QuestionnaireAssessmentInput, Sex } from '@/types';

const CONDITION_OPTIONS = [
  { id: 'hypertension', label: 'Bluthochdruck' },
  { id: 'type2_diabetes', label: 'Typ-2-Diabetes' },
  { id: 'dyslipidaemia', label: 'Dyslipidämie' },
  { id: 'obesity', label: 'Adipositas' },
  { id: 'sleep_apnea', label: 'Schlafapnoe' },
];

const QUESTIONNAIRE_DEFAULTS: QuestionnaireAssessmentInput = {
  age: 42,
  sex: 'female',
  country: 'Germany',
  heightCm: 168,
  weightKg: 72,
  smokingStatus: 'never',
  alcoholUnitsWeekly: 4,
  exerciseSessionsWeekly: 3,
  sedentaryHoursDay: 7,
  sleepHours: 6.8,
  sleepSatisfaction: 6,
  stressLevel: 5,
  dietQualityScore: 6,
  fruitVegServingsDaily: 3,
  waterGlassesDaily: 6,
  selfRatedHealth: 3,
  chronicConditions: [],
};

const SOURCE_CARDS = [
  {
    icon: HeartPulse,
    title: 'Klinische Ausgangslage',
    copy: 'Neue Nutzer können einen kurzen Intake ausfüllen, statt sofort einen vollständigen EHR-Export bereitzustellen.',
  },
  {
    icon: MoonStar,
    title: 'Verhaltensschicht',
    copy: 'Schlaf, Stress, Bewegung, Ernährung und Sitzzeit ergänzen das Präventionsmodell auch ohne Laborwerte.',
  },
  {
    icon: Footprints,
    title: 'Twin-Projektion',
    copy: 'Der Twin vergleicht weiterhin Adhärenz mit Nicht-Adhärenz, startet hier aber mit einer geschätzten selbstberichteten Ausgangslage.',
  },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-[#475569]">{children}</label>;
}

function getCaseBadgeLabel(displayName: string) {
  return displayName
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AssessmentPage() {
  const router = useRouter();
  const { featuredPatients, loadPatient, runQuestionnaireAssessment, loading, error } = useAppState();
  const [form, setForm] = useState<QuestionnaireAssessmentInput>(QUESTIONNAIRE_DEFAULTS);
  const [loadingPatientId, setLoadingPatientId] = useState<string | null>(null);

  const updateField = <Key extends keyof QuestionnaireAssessmentInput>(
    key: Key,
    value: QuestionnaireAssessmentInput[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleCondition = (conditionId: string) => {
    setForm((current) => ({
      ...current,
      chronicConditions: current.chronicConditions.includes(conditionId)
        ? current.chronicConditions.filter((item) => item !== conditionId)
        : [...current.chronicConditions, conditionId],
    }));
  };

  const handleSelectPatient = async (patientId: string) => {
    setLoadingPatientId(patientId);
    try {
      const success = await loadPatient(patientId);
      if (success) {
        router.push('/result');
      }
    } finally {
      setLoadingPatientId(null);
    }
  };

  const handleQuestionnaireSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runQuestionnaireAssessment(form);
    if (success) {
      router.push('/result');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="animate-fade-up">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1 text-xs font-medium text-[#0D9488]">
          <ClipboardList className="h-3.5 w-3.5" />
          Intake für neue Nutzer + reale Fallansicht
        </div>
        <h1 className="mb-1 text-2xl font-semibold text-[#0F172A]">Wählen Sie Ihren Einstieg</h1>
        <p className="max-w-2xl text-sm text-[#64748B]">
          Neue Nutzer sollen nicht an fehlenden Rohdaten scheitern. Starten Sie mit dem Fragebogen für eine geschätzte
          Ausgangslage oder öffnen Sie einen realen Supabase-Fall mit importierten Datensätzen.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-100">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#2563EB]">
                <Sparkles className="h-3.5 w-3.5" />
                Fragebogen für neue Nutzer
              </div>
              <h2 className="text-lg font-semibold text-[#0F172A]">Mit einer geführten Selbsteinschätzung starten</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748B]">
                Dieser Pfad schätzt Laborwerte, Wearable-Basis und Twin-Trajektorie aus Ihren Antworten. Er dient dem
                Onboarding und der Präventionsplanung, nicht der Diagnose.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleQuestionnaireSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Alter</FieldLabel>
                <Input type="number" min={18} max={95} value={form.age} onChange={(event) => updateField('age', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Geschlecht</FieldLabel>
                <select
                  value={form.sex}
                  onChange={(event) => updateField('sex', event.target.value as Sex)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-[#0F172A] outline-none focus-visible:border-ring"
                >
                  <option value="female">Weiblich</option>
                  <option value="male">Männlich</option>
                  <option value="other">Divers</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Land</FieldLabel>
                <Input value={form.country} onChange={(event) => updateField('country', event.target.value)} />
              </div>
              <div>
                <FieldLabel>Größe (cm)</FieldLabel>
                <Input type="number" min={130} max={220} value={form.heightCm} onChange={(event) => updateField('heightCm', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Gewicht (kg)</FieldLabel>
                <Input type="number" min={35} max={220} value={form.weightKg} onChange={(event) => updateField('weightKg', Number(event.target.value))} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>Rauchen</FieldLabel>
                <select
                  value={form.smokingStatus}
                  onChange={(event) => updateField('smokingStatus', event.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-[#0F172A] outline-none focus-visible:border-ring"
                >
                  <option value="never">Nie</option>
                  <option value="former">Früher</option>
                  <option value="current">Aktuell</option>
                </select>
              </div>
              <div>
                <FieldLabel>Alkohol / Woche</FieldLabel>
                <Input type="number" min={0} max={40} value={form.alcoholUnitsWeekly} onChange={(event) => updateField('alcoholUnitsWeekly', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Bewegung / Woche</FieldLabel>
                <Input type="number" min={0} max={14} value={form.exerciseSessionsWeekly} onChange={(event) => updateField('exerciseSessionsWeekly', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Sitzstunden / Tag</FieldLabel>
                <Input type="number" min={1} max={16} step="0.5" value={form.sedentaryHoursDay} onChange={(event) => updateField('sedentaryHoursDay', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Schlafstunden / Nacht</FieldLabel>
                <Input type="number" min={4} max={10} step="0.1" value={form.sleepHours} onChange={(event) => updateField('sleepHours', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Schlafzufriedenheit (1-10)</FieldLabel>
                <Input type="number" min={1} max={10} value={form.sleepSatisfaction} onChange={(event) => updateField('sleepSatisfaction', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Stressniveau (1-10)</FieldLabel>
                <Input type="number" min={1} max={10} value={form.stressLevel} onChange={(event) => updateField('stressLevel', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Ernährungsqualität (1-10)</FieldLabel>
                <Input type="number" min={1} max={10} value={form.dietQualityScore} onChange={(event) => updateField('dietQualityScore', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Selbsteingeschätzte Gesundheit (1-5)</FieldLabel>
                <Input type="number" min={1} max={5} value={form.selfRatedHealth} onChange={(event) => updateField('selfRatedHealth', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Obst & Gemüse / Tag</FieldLabel>
                <Input type="number" min={0} max={10} step="0.5" value={form.fruitVegServingsDaily} onChange={(event) => updateField('fruitVegServingsDaily', Number(event.target.value))} />
              </div>
              <div>
                <FieldLabel>Gläser Wasser / Tag</FieldLabel>
                <Input type="number" min={0} max={16} value={form.waterGlassesDaily} onChange={(event) => updateField('waterGlassesDaily', Number(event.target.value))} />
              </div>
            </div>

            <div>
              <FieldLabel>Bekannte Vorerkrankungen</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map((option) => {
                  const active = form.chronicConditions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleCondition(option.id)}
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? '#0D9488' : '#F8FAFC',
                        borderColor: active ? '#0D9488' : '#E2E8F0',
                        color: active ? 'white' : '#475569',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#DBEAFE] bg-[#EFF6FF] p-4">
              <p className="text-xs leading-relaxed text-[#2563EB]">
                Dieser Pfad schätzt Biomarker und Wearable-Signale aus selbst berichteten Angaben. Er ist für Personen
                gedacht, die noch keine importierten Labor- oder Gerätedaten haben.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0D9488] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#0F766E] disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Meine Ausgangslage berechnen
            </button>
          </form>
        </Card>

        <div className="space-y-4 animate-fade-up delay-200">
          <Card className="rounded-[28px] border border-[#E2E8F0] bg-white p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1 text-xs font-medium text-[#0D9488]">
                <Database className="h-3.5 w-3.5" />
              Reale Supabase-Fälle
              </div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Oder importierte Patientenakten prüfen</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
              Dieser Pfad bleibt für Demos, Stakeholder-Reviews und die Validierung des Produkts anhand realer
              strukturierter Datensätze erhalten.
            </p>
          </Card>

          {SOURCE_CARDS.map(({ icon: Icon, title, copy }) => (
            <Card key={title} className="rounded-[24px] border border-[#E2E8F0] bg-white p-5">
              <Icon className="h-5 w-5 text-[#0D9488]" />
              <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#64748B]">{copy}</p>
            </Card>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] animate-fade-up delay-200">
          {error}
        </div>
      ) : null}

      <section className="space-y-4 animate-fade-up delay-300">
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A]">Ausgewählte reale Fälle</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Öffnen Sie einen de-identifizierten Datensatz aus Supabase, wenn Sie den vollständig importierten Pfad aus
            EHR-, Lifestyle- und Wearable-Daten sehen möchten.
          </p>
        </div>

        {featuredPatients.map((patient) => (
          <Card key={patient.patientId} className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-none">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#0D9488] to-[#6366F1] text-sm font-semibold text-white">
                    {getCaseBadgeLabel(patient.displayName)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0F172A]">{patient.displayName}</h2>
                    <p className="text-xs text-[#64748B]">
                      {patient.age} Jahre, {patient.country}
                    </p>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-[#475569]">{patient.shortSummary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {patient.keyRisks.map((risk) => (
                    <span key={risk} className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-medium text-[#475569]">
                      {risk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_55%,#34d399_100%)] p-5 text-white">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">Fallfokus</p>
                <h3 className="mt-2 text-xl font-semibold">{patient.primaryConcern}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Laden Sie das vollständige importierte Bundle, um Ergebnisse, Empfehlungen und den Health Twin für
                  Adhärenz versus Nicht-Adhärenz zu berechnen.
                </p>
                <button
                  onClick={() => void handleSelectPatient(patient.patientId)}
                  disabled={loading || loadingPatientId !== null}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#0F172A] transition-all hover:bg-[#F8FAFC] disabled:opacity-60"
                >
                  {loadingPatientId === patient.patientId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Realen Fall öffnen
                </button>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
