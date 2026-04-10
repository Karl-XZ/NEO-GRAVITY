'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  MessageCircle,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/components/AppState';
import { HealthCompanion } from '@/components/dashboard';

const RISK_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#EF4444',
  moderate: '#F59E0B',
  low: '#10B981',
};

const RISK_BG: Record<string, string> = {
  critical: '#FEF2F2',
  high: '#FEF2F2',
  moderate: '#FFFBEB',
  low: '#F0FDF4',
};

export default function ResultPage() {
  const router = useRouter();
  const { result, selectedPatient } = useAppState();
  const isQuestionnaire = selectedPatient?.source === 'questionnaire';
  const isPersona = selectedPatient?.source === 'persona';

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
          <BarChart3 className="h-8 w-8 text-[#94A3B8]" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[#0F172A]">Noch kein Fall geladen</h2>
        <p className="mb-6 text-sm text-[#64748B]">Starten Sie zuerst mit dem Fragebogen oder laden Sie einen Persona-Account, um die Ergebnisansicht zu berechnen.</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-5 py-2.5 text-sm font-medium text-white"
        >
          Zur Startseite <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const { overallScore, bioAgeEstimate, riskScores, risks, opportunities } = result;
  const topDimension = [...riskScores].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-6 pb-20">
        <div className="animate-fade-up">
          <h1 className="mb-1 text-2xl font-semibold text-[#0F172A]">Ihre Gesundheitsergebnisse</h1>
          <p className="text-sm text-[#64748B]">
            {selectedPatient ? `${selectedPatient.displayName} - ` : ''}
            Berechnet am {new Date(result.timestamp).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-100">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex-shrink-0">
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={overallScore >= 70 ? '#10B981' : overallScore >= 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${overallScore * 3.14} 314`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold text-[#0F172A]">{overallScore}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#64748B]">/ 100</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">Gesamt-Gesundheitsscore</h2>
                <p className="mt-0.5 text-sm text-[#64748B]">Zusammengeführt über sechs Präventionsdimensionen.</p>
              </div>
              <Badge
                variant="outline"
                className="rounded-full px-3 text-xs font-medium"
                style={{
                  background: overallScore >= 70 ? '#F0FDF4' : overallScore >= 50 ? '#FFFBEB' : '#FEF2F2',
                  borderColor: RISK_COLORS[overallScore >= 70 ? 'low' : overallScore >= 50 ? 'moderate' : 'high'],
                  color: RISK_COLORS[overallScore >= 70 ? 'low' : overallScore >= 50 ? 'moderate' : 'high'],
                }}
              >
                {overallScore >= 70 ? 'Gut' : overallScore >= 50 ? 'Mittel' : 'Aufmerksamkeit nötig'}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F8FAFC] p-3">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Biologisches Alter</p>
                <p
                  className="text-xl font-semibold"
                  style={{ color: bioAgeEstimate <= (selectedPatient?.age ?? 40) ? '#10B981' : '#EF4444' }}
                >
                  {bioAgeEstimate} <span className="text-sm font-normal text-[#64748B]">Jahre</span>
                </p>
                {selectedPatient ? (
                  <p className="text-[10px] text-[#64748B]">
                    {bioAgeEstimate < selectedPatient.age
                    ? `${selectedPatient.age - bioAgeEstimate} Jahre jünger`
                      : `${bioAgeEstimate - selectedPatient.age} Jahre älter`}{' '}
                    als das chronologische Alter
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-3">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Schwächste Dimension</p>
                <p className="text-sm font-semibold text-[#0F172A]">{topDimension?.dimension ?? 'Aktivität'}</p>
                <p className="text-[10px] text-[#64748B]">Niedrigster Teilscore</p>
              </div>
            </div>
          </div>
        </div>
        </Card>

        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-200">
        <h3 className="mb-4 text-sm font-semibold text-[#0F172A]">Gesundheitsdimensionen</h3>
        <div className="space-y-4">
          {riskScores.map((dimension) => (
            <div key={dimension.dimension}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B]">{dimension.dimension}</span>
                <span className="text-xs font-semibold text-[#0F172A]">{dimension.score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${dimension.score}%`,
                    background:
                      dimension.score >= 70 ? '#10B981' : dimension.score >= 50 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        </Card>

        {risks.length > 0 ? (
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-300">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-[#0F172A]">Bereiche mit Handlungsbedarf</h3>
          </div>
          <div className="space-y-3">
            {risks.map((risk) => (
              <div key={risk.id} className="rounded-xl border border-[#E2E8F0] p-4" style={{ background: RISK_BG[risk.severity] }}>
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${RISK_COLORS[risk.severity]}20` }}
                  >
                    <AlertTriangle className="h-3 w-3" style={{ color: RISK_COLORS[risk.severity] }} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-[#0F172A]">{risk.title}</h4>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{ background: `${RISK_COLORS[risk.severity]}20`, color: RISK_COLORS[risk.severity] }}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <p className="mb-2 text-xs leading-relaxed text-[#64748B]">{risk.description}</p>
                    {risk.nextAction ? (
                      <div className="flex items-center gap-1.5 text-[#0D9488]">
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs font-medium">{risk.nextAction}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </Card>
        ) : null}

        {opportunities.length > 0 ? (
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-400">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0D9488]" />
            <h3 className="text-sm font-semibold text-[#0F172A]">Verbesserungschancen</h3>
            <span className="ml-auto text-[10px] text-[#64748B]">Höchster Effekt zuerst</span>
          </div>
          <div className="space-y-3">
            {opportunities.map((opportunity, index) => (
              <div key={opportunity.id} className="rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#0D9488]/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-xs font-semibold text-[#0D9488]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-[#0F172A]">{opportunity.title}</h4>
                      <span className="text-xs font-semibold text-[#0D9488]">
                        +{Math.round((overallScore * opportunity.impactScore) / 100 * 0.3)} pts
                      </span>
                    </div>
                    <p className="mb-2 text-xs leading-relaxed text-[#64748B]">{opportunity.description}</p>
                    <div className="flex gap-3 text-[10px] text-[#94A3B8]">
                      <span>~{opportunity.timelineWeeks} Wochen</span>
                      <span>|</span>
                      <span className="capitalize">Aufwand: {opportunity.effortLevel}</span>
                      <span>|</span>
                      <span>Wirkung: {opportunity.impactScore}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </Card>
        ) : null}

        <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] p-4 animate-fade-up delay-500">
          <p className="text-xs leading-relaxed text-[#0D9488]">
            <strong>Dies ist keine medizinische Diagnose.</strong> {isQuestionnaire
              ? 'Diese Ergebnisse werden ausschließlich aus Ihren selbst berichteten Fragebogenangaben für präventive Orientierung geschätzt.'
              : isPersona
                ? 'Diese Ergebnisse werden aus dem aktiven Persona-Account und seinen dazu passenden Demo-Daten ausschließlich für präventive Orientierung berechnet.'
                : 'Diese Ergebnisse werden aus importierten EHR-, Umfrage- und Wearable-Daten ausschließlich für präventive Orientierung berechnet.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 animate-fade-up delay-500 sm:flex-row">
          <button
            onClick={() => router.push('/coach')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0D9488] px-5 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:bg-[#0F766E]"
          >
            <MessageCircle className="h-4 w-4" /> KI-Coach fragen
          </button>
          <button
            onClick={() => router.push('/health-twin')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-5 py-3.5 text-sm font-medium text-[#0F172A] transition-all hover:border-[#0D9488]"
          >
            <Activity className="h-4 w-4" /> Gesundheitszwilling öffnen
          </button>
        </div>
      </div>

      <aside className="hidden w-[380px] shrink-0 xl:block">
        <div className="sticky top-0">
          <HealthCompanion />
        </div>
      </aside>
    </div>
  );
}
