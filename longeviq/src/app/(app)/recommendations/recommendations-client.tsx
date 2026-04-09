'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Bookmark,
  Check,
  Filter,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/components/AppState';
import type { RecommendationCategory } from '@/types';

const CATEGORIES: {
  id: RecommendationCategory | 'all';
  label: string;
  icon: React.ElementType;
}[] = [
  { id: 'all', label: 'Alle', icon: Filter },
  { id: 'checkup', label: 'Checks', icon: Stethoscope },
  { id: 'diagnostic', label: 'Diagnostik', icon: Activity },
  { id: 'specialist', label: 'Fachärzte', icon: Stethoscope },
  { id: 'nutrition', label: 'Ernährung', icon: UtensilsCrossed },
  { id: 'lifestyle', label: 'Lebensstil', icon: Activity },
];

const URGENCY_COLORS: Record<string, string> = {
  priority: '#EF4444',
  suggested: '#F59E0B',
  routine: '#10B981',
};

const URGENCY_BG: Record<string, string> = {
  priority: '#FEF2F2',
  suggested: '#FFFBEB',
  routine: '#F0FDF4',
};

function urgencyLabel(urgency: string) {
  if (urgency === 'priority') return 'Priorität';
  if (urgency === 'suggested') return 'Empfohlen';
  return 'Routine';
}

function categoryLabel(category: RecommendationCategory) {
  if (category === 'checkup') return 'Check';
  if (category === 'diagnostic') return 'Diagnostik';
  if (category === 'specialist') return 'Facharzt';
  if (category === 'nutrition') return 'Ernährung';
  return 'Lebensstil';
}

export default function RecommendationsClient({ focus }: { focus?: string }) {
  const router = useRouter();
  const { recommendations, toggleRecommendation, result, selectedPatient } =
    useAppState();
  const initialCategory: RecommendationCategory | 'all' = 'all';
  const [activeCategory, setActiveCategory] =
    useState<RecommendationCategory | 'all'>(initialCategory);
  const isQuestionnaire = selectedPatient?.source === 'questionnaire';

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? recommendations
        : recommendations.filter((item) => item.category === activeCategory),
    [activeCategory, recommendations],
  );

  const addedCount = recommendations.filter((item) => item.added).length;
  const priorityCount = recommendations.filter(
    (item) => item.urgency === 'priority',
  ).length;
  const suggestedCount = recommendations.filter(
    (item) => item.urgency === 'suggested',
  ).length;
  const topRecommendation =
    recommendations.find((item) => item.id === focus) ?? recommendations[0];
  const topOpportunity = result?.opportunities?.[0];

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
          <Bookmark className="h-8 w-8 text-[#94A3B8]" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[#0F172A]">
          Kein Fall geladen
        </h2>
        <p className="mb-6 text-sm text-[#64748B]">
          Starten Sie mit dem Fragebogen oder öffnen Sie einen realen Fall, um
          Empfehlungen zu sehen.
        </p>
        <button
          onClick={() => router.push('/assessment')}
          className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-5 py-2.5 text-sm font-medium text-white"
        >
          Assessment starten <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="animate-fade-up">
        <h1 className="mb-1 text-2xl font-semibold text-[#0F172A]">
          Empfehlungen
        </h1>
        <p className="text-sm text-[#64748B]">
          Personalisiert für{' '}
          {selectedPatient?.displayName || 'den aktiven Fall'} auf Basis von{' '}
          {isQuestionnaire
            ? 'Ihrer fragebogenbasierten Ausgangslage.'
            : 'realen Patientendaten.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] animate-fade-up delay-75">
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#64748B]">
            Nächste beste Maßnahme
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
            {topRecommendation?.title ?? 'Präventiven Aktionsplan öffnen'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
            {topRecommendation?.description ??
              'Wählen Sie einen Schritt aus, um Ihren präventiven Plan zu konkretisieren.'}
          </p>
          {topRecommendation?.reason ? (
            <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#94A3B8]">
                Warum jetzt
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                {topRecommendation.reason}
              </p>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#94A3B8]">
              Priorität
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#0F172A]">
              {priorityCount}
            </p>
            <p className="text-xs text-[#64748B]">
              Maßnahmen mit zeitnahem Follow-up
            </p>
          </Card>
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#94A3B8]">
              Geplant
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#0F172A]">
              {addedCount}
            </p>
            <p className="text-xs text-[#64748B]">
              Einträge bereits zu Ihrem Plan hinzugefügt
            </p>
          </Card>
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#94A3B8]">
              Chancen
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#0F172A]">
              {suggestedCount}
            </p>
            <p className="text-xs text-[#64748B]">
              {topOpportunity
                ? `Top-Fokus: ${topOpportunity.title}`
                : 'Mehrere alltagstaugliche Verbesserungen verfügbar'}
            </p>
          </Card>
        </div>
      </div>

      {addedCount > 0 ? (
        <Card className="rounded-2xl border border-[#0D9488]/20 bg-[#F0FDFA] p-4 animate-fade-up delay-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0D9488]">
                {addedCount} Eintrag{addedCount > 1 ? 'e' : ''} zu Ihrem Plan
                hinzugefügt
              </p>
              <p className="text-xs text-[#0D9488]/70">
                Ihr personalisierter Gesundheits-Aktionsplan
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-4 py-2 text-xs font-medium text-white transition-all hover:bg-[#0F766E]">
              Auswahl buchen <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up delay-100">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: activeCategory === id ? '#0D9488' : '#F1F5F9',
              color: activeCategory === id ? 'white' : '#64748B',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3 animate-fade-up delay-200">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#94A3B8]">
            Keine Empfehlungen in dieser Kategorie.
          </div>
        ) : null}

        {filtered.map((rec) => (
          <Card
            key={rec.id}
            className={`rounded-2xl border bg-white p-5 transition-all ${
              focus === rec.id
                ? 'border-[#0D9488] shadow-[0_18px_40px_-30px_rgba(13,148,136,0.35)]'
                : 'border-[#E2E8F0] hover:border-[#0D9488]/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => toggleRecommendation(rec.id)}
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  rec.added
                    ? 'border-[#0D9488] bg-[#0D9488]'
                    : 'border-[#E2E8F0] hover:border-[#0D9488]'
                }`}
              >
                {rec.added ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : null}
              </button>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    {rec.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 rounded-full text-[10px] font-medium"
                    style={{
                      background: URGENCY_BG[rec.urgency],
                      color: URGENCY_COLORS[rec.urgency],
                      borderColor: `${URGENCY_COLORS[rec.urgency]}40`,
                    }}
                  >
                    {urgencyLabel(rec.urgency)}
                  </Badge>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-[#64748B]">
                  {rec.description}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {rec.price ? (
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {rec.price}
                    </span>
                  ) : null}
                  {rec.provider ? (
                    <span className="text-xs text-[#94A3B8]">• {rec.provider}</span>
                  ) : null}
                  <span className="rounded-full bg-[#F8FAFC] px-2 py-1 text-[10px] font-medium text-[#475569]">
                    {categoryLabel(rec.category)}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="rounded-xl bg-[#F8FAFC] p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#94A3B8]">
                      Begründung
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                      {rec.reason}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRecommendation(rec.id)}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                        rec.added
                          ? 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                          : 'bg-[#ECFDF5] text-[#0D9488] hover:bg-[#D1FAE5]'
                      }`}
                    >
                      {rec.added ? 'Im Plan gespeichert' : 'Zu meinem Plan'}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#E2E8F0] px-4 py-2 text-xs font-medium text-[#475569] transition-colors hover:border-[#0D9488]/30 hover:text-[#0D9488]"
                    >
                      Leistung ansehen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] p-4 animate-fade-up delay-300">
        <p className="text-xs leading-relaxed text-[#0D9488]">
          <strong>Dies ist keine medizinische Diagnose.</strong> Diese
          Empfehlungen sind priorisierte Präventionsmaßnahmen, abgeleitet aus{' '}
          {isQuestionnaire
            ? 'Ihren Selbstauskünften und der geschätzten Ausgangslage.'
            : 'den importierten Falldaten.'}
        </p>
      </div>
    </div>
  );
}
