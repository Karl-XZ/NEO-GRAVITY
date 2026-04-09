'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Target, ArrowRight, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/components/AppState';

const JOURNEY_STEPS = [
  { stage: 'Datenaufnahme', desc: 'Strukturierte EHR-, Lifestyle- und Wearable-Daten in einer Fallansicht zusammenführen.' },
  { stage: 'Risikosynthese', desc: 'Reale Signale in einen verständlichen Präventionsscore und den stärksten Risikobereich übersetzen.' },
  { stage: 'Twin-Projektion', desc: 'Adhärenz und Nicht-Adhärenz mit einer kohortenbasierten ML-Projektion vergleichen.' },
  { stage: 'Aktionspfad', desc: 'Das stärkste Risikosignal in einen klinischen und einen Verhaltensschritt übersetzen.' },
  { stage: 'Nachverfolgung', desc: 'Nachhalten, ob die nächste Aktion tatsächlich gespeichert und umgesetzt wurde.' },
];

const USER_STORIES = [
  { metric: 'Als klinischer Operator', want: 'möchte ich eine zusammengeführte Fallansicht aus Silodaten', so: 'damit ich das Signal erklären kann, ohne mehrere Systeme zu öffnen.' },
  { metric: 'Als präventiver Patient', want: 'möchte ich Zukunft mit und ohne Plan-Adhärenz vergleichen', so: 'damit die Kosten schlechter Adhärenz sichtbar werden.' },
  { metric: 'Als Product Owner', want: 'möchte ich eine Demo mit realen Datensätzen statt Personas', so: 'damit die Story gegenüber Stakeholdern glaubwürdig wirkt.' },
];

function getCaseBadgeLabel(displayName: string) {
  return displayName
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ConceptPage() {
  const router = useRouter();
  const { featuredPatients, loadPatient } = useAppState();

  return (
    <div className="space-y-10 pb-20">
      <div className="animate-fade-up">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1.5 text-xs font-medium text-[#0D9488]">
          <BookOpen className="h-3 w-3" />
          Konzept
        </div>
        <h1 className="mb-2 text-3xl font-semibold text-[#0F172A]">Von Mock-Personas zu realen Fällen</h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#64748B]">
          Diese Konzeptseite beschreibt die aktualisierte Produktform: eine präventive Gesundheitsplattform auf Basis realer Supabase-Daten mit einem Twin, der die praktischen Folgen von Plan-Adhärenz oder Nicht-Adhärenz zeigt.
        </p>
      </div>

      <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-100">
            <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Warum diese Version wichtig ist</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <p className="mb-1 text-xs font-semibold text-[#0F172A]">Daten-Glaubwürdigkeit</p>
                <p className="text-xs leading-relaxed text-[#64748B]">
              De-identifizierte Kohortenfälle, Biomarker und Wearable-Signale treiben die Demo statt erfundener Journeys.
                </p>
              </div>
          <div className="rounded-xl bg-[#F8FAFC] p-4">
            <p className="mb-1 text-xs font-semibold text-[#0F172A]">Twin-Glaubwürdigkeit</p>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Der Health Twin nutzt jetzt eine kohortenbasierte KNN-Projektion, um Veränderungen bei besserer oder schlechterer Adhärenz zu schätzen.
            </p>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] p-4">
            <p className="mb-1 text-xs font-semibold text-[#0F172A]">Klinisches Framing</p>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Die UI bleibt präventiv und handlungsorientiert, statt eine Diagnose vorzutäuschen.
            </p>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-0 bg-gradient-to-br from-[#0D9488] to-[#6366F1] p-6 text-white animate-fade-up delay-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium opacity-70">North-Star-Metrik</p>
            <h3 className="mb-1 text-base font-semibold">Anteil geladener Fälle mit mindestens einer gespeicherten Next-Best-Action</h3>
            <p className="text-xs leading-relaxed opacity-70">
              Das verbindet die Interpretation realer Patientensignale mit echter Verhaltensplanung und genau das soll die Demo zeigen.
            </p>
          </div>
        </div>
      </Card>

      <div className="animate-fade-up delay-300">
        <h2 className="mb-1 text-xl font-semibold text-[#0F172A]">Ausgewählte reale Fälle</h2>
        <p className="mb-5 text-sm text-[#64748B]">Diese Karten werden jetzt aus der aktiven Supabase-Kohorte geladen.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {featuredPatients.map((patient) => (
            <Card
              key={patient.patientId}
              className="group cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-all hover:border-[#0D9488]/40"
              onClick={() => {
                void loadPatient(patient.patientId);
                router.push('/dashboard');
              }}
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0D9488] to-[#6366F1] font-semibold text-white">
                  {getCaseBadgeLabel(patient.displayName)}
                </div>
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#0F172A]">{patient.displayName}</h3>
                    <Badge variant="outline" className="rounded-full text-[10px] capitalize">
                      {patient.country}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#64748B]">{patient.age} Jahre</p>
                </div>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-[#94A3B8]">{patient.shortSummary}</p>
              <div className="mb-3 flex flex-wrap gap-1">
                {patient.keyRisks.map((risk) => (
                  <span key={risk} className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] capitalize text-[#D97706]">
                    {risk}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-0.5 text-xs font-medium text-[#0D9488] transition-all group-hover:gap-1.5">
                Öffnen <ChevronRight className="h-3 w-3" />
              </span>
            </Card>
          ))}
        </div>
      </div>

      <div className="animate-fade-up delay-400">
        <h2 className="mb-5 text-xl font-semibold text-[#0F172A]">Aktualisierte Journey</h2>
        <div className="relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-[#0D9488] via-[#6366F1] to-transparent" />
          <div className="space-y-4">
            {JOURNEY_STEPS.map((step, index) => (
              <div key={step.stage} className="flex items-start gap-4">
                <div className="z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#0D9488] bg-white">
                  <span className="text-[10px] font-semibold text-[#0D9488]">{index + 1}</span>
                </div>
                <Card className="flex-1 rounded-xl border border-[#E2E8F0] bg-white p-4">
                  <h4 className="mb-1 text-sm font-semibold text-[#0F172A]">{step.stage}</h4>
                  <p className="text-xs leading-relaxed text-[#64748B]">{step.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-fade-up delay-500">
        <h2 className="mb-5 text-xl font-semibold text-[#0F172A]">Nutzer-Storys</h2>
        <div className="space-y-3">
          {USER_STORIES.map((story, index) => (
            <Card key={story.metric} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-xs font-semibold text-[#0D9488]">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-[#0F172A]">
                  <span className="font-semibold">{story.metric}, </span>
                  <span>{story.want}, </span>
                  <span className="text-[#64748B]">{story.so}</span>
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="animate-fade-up delay-500 text-center">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#0D9488]/20 transition-all hover:bg-[#0F766E]"
        >
          Zurück zur App
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
