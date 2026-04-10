'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/components/AppState';
import { BodyComparisonMap } from '@/components/BodyComparisonMap';
import { HealthCompanion } from '@/components/dashboard';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function HealthTwinPage() {
  const router = useRouter();
  const { twin, selectedPatient } = useAppState();
  const isQuestionnaire = selectedPatient?.source === 'questionnaire';

  const chartData = useMemo(() => {
    if (!twin) return [];
    return twin.adherencePath.points.map((point, index) => ({
      month: `M${index}`,
      'Plan umsetzen': point.bioAge,
      'Aktuelles Muster fortführen': twin.nonAdherencePath.points[index].bioAge,
      'Gesundheitsscore (Plan)': point.healthScore,
      'Gesundheitsscore (ohne Umsetzung)': twin.nonAdherencePath.points[index].healthScore,
    }));
  }, [twin]);

  const bioAgeDomain = useMemo<[number, number]>(() => {
    if (!twin || twin.adherencePath.points.length === 0) {
      return [30, 50];
    }

    const startingBioAge = twin.adherencePath.points[0].bioAge;
    const min = Math.max(0, Math.floor(startingBioAge - 10));
    const max = Math.ceil(startingBioAge + 10);

    return [min, max];
  }, [twin]);

  if (!twin || !selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
          <Activity className="h-8 w-8 text-[#94A3B8]" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[#0F172A]">Bitte zuerst einen Fall öffnen</h2>
        <p className="mb-6 text-sm text-[#64748B]">
          Der Gesundheitszwilling benötigt entweder eine fragebogenbasierte Ausgangslage oder einen geladenen Fall mit Ergebnis- und Empfehlungskontext.
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

  const adherenceEnd = twin.adherencePath.points[twin.adherencePath.points.length - 1];
  const nonAdherenceEnd = twin.nonAdherencePath.points[twin.nonAdherencePath.points.length - 1];
  const currentGap = twin.chronologicalAge - twin.currentBioAge;
  const projectedGap = nonAdherenceEnd.bioAge - adherenceEnd.bioAge;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-6 pb-20">
        <div className="animate-fade-up">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1 text-xs font-medium text-[#0D9488]">
            <Sparkles className="h-3.5 w-3.5" />
            Szenariomodell für die nächsten 12 Monate
          </div>
          <h1 className="mb-1 text-2xl font-semibold text-[#0F172A]">Gesundheitszwilling</h1>
          <p className="max-w-2xl text-sm text-[#64748B]">
            {selectedPatient.displayName} nutzt jetzt einen {isQuestionnaire ? 'fragebogenbasierten' : 'datenbasierten'} Szenario-Zwilling: Ein Pfad nimmt eine konsequente Umsetzung der Empfehlungen an, der andere ein Fortführen des aktuellen Musters.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4 animate-fade-up delay-100">
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Chronologisches Alter</p>
          <p className="text-2xl font-semibold text-[#0F172A]">{twin.chronologicalAge}</p>
          <p className="text-[10px] text-[#94A3B8]">Jahre</p>
        </Card>
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Aktuelles biologisches Alter</p>
          <p className="text-2xl font-semibold" style={{ color: currentGap >= 0 ? '#0F766E' : '#B91C1C' }}>
            {twin.currentBioAge}
          </p>
          <p className="text-[10px] text-[#94A3B8]">
            {currentGap >= 0 ? `${currentGap} Jahre jünger` : `${Math.abs(currentGap)} Jahre älter`}
          </p>
        </Card>
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Gesundheitsscore</p>
          <p className="text-2xl font-semibold text-[#0F172A]">{twin.currentScore}</p>
          <p className="text-[10px] text-[#94A3B8]">/ 100</p>
        </Card>
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">12-Monats-Divergenz</p>
          <p className="text-2xl font-semibold text-[#0F172A]">{projectedGap}</p>
          <p className="text-[10px] text-[#94A3B8]">Jahre biologisches Alter Abstand</p>
        </Card>
        </div>

        <Card className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-200">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Zwei projizierte Zukünfte</h2>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Das Diagramm vergleicht die monatliche Entwicklung des biologischen Alters bei konsequenter Umsetzung gegenüber einem weitgehend unveränderten Muster.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-full border-[#0F766E]/20 bg-[#F0FDFA] text-[#0F766E]">
              {twin.adherencePath.label}
            </Badge>
            <Badge variant="outline" className="rounded-full border-[#B91C1C]/20 bg-[#FEF2F2] text-[#B91C1C]">
              {twin.nonAdherencePath.label}
            </Badge>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis
                domain={bioAgeDomain}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickCount={5}
              />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, fontSize: 12 }}
                labelStyle={{ color: '#64748B' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Plan umsetzen" name="Plan umsetzen" stroke="#0F766E" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Aktuelles Muster fortführen" name="Aktuelles Muster fortführen" stroke="#B91C1C" strokeWidth={3} dot={false} strokeDasharray="6 6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] bg-[#F0FDFA] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#0F766E]">
              <TrendingUp className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Wenn der Plan befolgt wird</h3>
            </div>
            <p className="text-sm leading-relaxed text-[#475569]">{twin.adherencePath.description}</p>
            <p className="mt-3 text-xs font-medium text-[#0F766E]">
              Monat 12: biologisches Alter {adherenceEnd.bioAge}, Gesundheitsscore {adherenceEnd.healthScore}
            </p>
          </div>
          <div className="rounded-[22px] bg-[#FEF2F2] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#B91C1C]">
              <TrendingUp className="h-4 w-4 rotate-180" />
              <h3 className="text-sm font-semibold">Wenn der Plan nicht befolgt wird</h3>
            </div>
            <p className="text-sm leading-relaxed text-[#475569]">{twin.nonAdherencePath.description}</p>
            <p className="mt-3 text-xs font-medium text-[#B91C1C]">
              Monat 12: biologisches Alter {nonAdherenceEnd.bioAge}, Gesundheitsscore {nonAdherenceEnd.healthScore}
            </p>
          </div>
        </div>
        </Card>

        <Card className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-300">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Körperzonen-Vergleich</h2>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Die Gegenüberstellung zeigt, welche Regionen sich bei stabiler Umsetzung oder ausbleibender Umsetzung am stärksten verändern würden.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-[#E2E8F0] bg-white text-[#475569]">
            {twin.predictionMeta.modelType}
          </Badge>
        </div>
        <BodyComparisonMap regions={twin.bodyComparison} />
        </Card>

        <Card className="rounded-[28px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_55%,#34d399_100%)] p-6 text-white animate-fade-up delay-400">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">Nächster plausibler Schritt</h2>
              <Badge variant="outline" className="rounded-full border-white/20 bg-white/10 text-white">
                {Math.round(twin.nextBestActionDays / 7)} Wochen Modellhorizont
              </Badge>
            </div>
            <p className="text-base font-semibold">{twin.nextBestAction}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{twin.nextBestActionReason}</p>
            <p className="mt-4 text-xs text-white/75">
              Modellkontext: {twin.predictionMeta.featureCount} Eingangssignale, {twin.predictionMeta.targetWindow}.
            </p>
          </div>
        </div>
        </Card>

        <button
          onClick={() => router.push('/recommendations')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0D9488] px-5 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#0F766E] animate-fade-up delay-500"
        >
          <Calendar className="h-4 w-4" /> Empfohlene Aktionen öffnen
        </button>
      </div>

      <aside className="hidden w-[380px] shrink-0 xl:block">
        <div className="sticky top-0">
          <HealthCompanion />
        </div>
      </aside>
    </div>
  );
}
