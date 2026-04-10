'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Target, ArrowRight, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/components/AppState';

const JOURNEY_STEPS = [
  { stage: 'Data Intake', desc: 'Merge structured EHR, lifestyle, and wearable data into a single case view.' },
  { stage: 'Risk Synthesis', desc: 'Translate real signals into an understandable prevention score and the strongest risk area.' },
  { stage: 'Twin Projection', desc: 'Compare adherence and non-adherence using a cohort-based ML projection.' },
  { stage: 'Action Path', desc: 'Translate the strongest risk signal into a clinical step and a behavioral step.' },
  { stage: 'Follow-Up', desc: 'Track whether the next action was actually saved and carried out.' },
];

const USER_STORIES = [
  { metric: 'As a clinical operator', want: 'I want a merged case view from siloed data', so: 'so I can explain the signal without opening multiple systems.' },
  { metric: 'As a preventive patient', want: 'I want to compare the future with and without plan adherence', so: 'so the cost of poor adherence becomes visible.' },
  { metric: 'As a product owner', want: 'I want a demo with real datasets instead of personas', so: 'so the story is credible to stakeholders.' },
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
          Concept
        </div>
        <h1 className="mb-2 text-3xl font-semibold text-[#0F172A]">From Mock Personas to Real Cases</h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#64748B]">
          This concept page describes the updated product form: a preventive health platform based on real Supabase data with a twin that shows the practical consequences of plan adherence or non-adherence.
        </p>
      </div>

      <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-100">
            <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Why This Version Matters</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <p className="mb-1 text-xs font-semibold text-[#0F172A]">Data Credibility</p>
                <p className="text-xs leading-relaxed text-[#64748B]">
              De-identified cohort cases, biomarkers, and wearable signals drive the demo instead of fabricated journeys.
                </p>
              </div>
          <div className="rounded-xl bg-[#F8FAFC] p-4">
            <p className="mb-1 text-xs font-semibold text-[#0F172A]">Twin Credibility</p>
            <p className="text-xs leading-relaxed text-[#64748B]">
              The Health Twin now uses a cohort-based KNN projection to estimate changes with better or worse adherence.
            </p>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] p-4">
            <p className="mb-1 text-xs font-semibold text-[#0F172A]">Clinical Framing</p>
            <p className="text-xs leading-relaxed text-[#64748B]">
              The UI stays preventive and action-oriented rather than simulating a diagnosis.
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
            <p className="mb-1 text-xs font-medium opacity-70">North Star Metric</p>
            <h3 className="mb-1 text-base font-semibold">Share of loaded cases with at least one saved next-best action</h3>
            <p className="text-xs leading-relaxed opacity-70">
              This connects the interpretation of real patient signals with actual behavioral planning, which is exactly what the demo aims to show.
            </p>
          </div>
        </div>
      </Card>

      <div className="animate-fade-up delay-300">
        <h2 className="mb-1 text-xl font-semibold text-[#0F172A]">Featured Real Cases</h2>
        <p className="mb-5 text-sm text-[#64748B]">These cards are now loaded from the active Supabase cohort.</p>
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
                  <p className="text-xs text-[#64748B]">{patient.age} years</p>
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
                Open <ChevronRight className="h-3 w-3" />
              </span>
            </Card>
          ))}
        </div>
      </div>

      <div className="animate-fade-up delay-400">
        <h2 className="mb-5 text-xl font-semibold text-[#0F172A]">Updated Journey</h2>
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
        <h2 className="mb-5 text-xl font-semibold text-[#0F172A]">User Stories</h2>
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
          Back to App
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
