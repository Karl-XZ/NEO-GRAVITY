'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/components/AppState';
import { BodyComparisonMap } from '@/components/BodyComparisonMap';
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
      'Follow plan': point.bioAge,
      'Ignore plan': twin.nonAdherencePath.points[index].bioAge,
      'Health score (plan)': point.healthScore,
      'Health score (no plan)': twin.nonAdherencePath.points[index].healthScore,
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
        <h2 className="mb-2 text-lg font-semibold text-[#0F172A]">Please open a case first</h2>
        <p className="mb-6 text-sm text-[#64748B]">
          The health twin requires either a questionnaire-based baseline or a real patient bundle with ML projection context.
        </p>
        <button
          onClick={() => router.push('/assessment')}
          className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-5 py-2.5 text-sm font-medium text-white"
        >
          Start assessment <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const adherenceEnd = twin.adherencePath.points[twin.adherencePath.points.length - 1];
  const nonAdherenceEnd = twin.nonAdherencePath.points[twin.nonAdherencePath.points.length - 1];
  const currentGap = twin.chronologicalAge - twin.currentBioAge;
  const projectedGap = nonAdherenceEnd.bioAge - adherenceEnd.bioAge;

  return (
    <div className="space-y-6 pb-20">
      <div className="animate-fade-up">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1 text-xs font-medium text-[#0D9488]">
          <Sparkles className="h-3.5 w-3.5" />
          KNN twin based on 1,000 real patients
        </div>
        <h1 className="mb-1 text-2xl font-semibold text-[#0F172A]">Health Twin</h1>
        <p className="max-w-2xl text-sm text-[#64748B]">
          {selectedPatient.displayName} is now using a {isQuestionnaire ? 'questionnaire-based' : 'data-based'} counterfactual twin: one path assumes plan adherence, the other declining adherence.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4 animate-fade-up delay-100">
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Chronological Age</p>
          <p className="text-2xl font-semibold text-[#0F172A]">{twin.chronologicalAge}</p>
          <p className="text-[10px] text-[#94A3B8]">years</p>
        </Card>
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Current Biological Age</p>
          <p className="text-2xl font-semibold" style={{ color: currentGap >= 0 ? '#0F766E' : '#B91C1C' }}>
            {twin.currentBioAge}
          </p>
          <p className="text-[10px] text-[#94A3B8]">
            {currentGap >= 0 ? `${currentGap.toFixed(2)} years younger` : `${Math.abs(currentGap).toFixed(2)} years older`}
          </p>
        </Card>
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">Health Score</p>
          <p className="text-2xl font-semibold text-[#0F172A]">{twin.currentScore}</p>
          <p className="text-[10px] text-[#94A3B8]">/ 100</p>
        </Card>
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">12-Month Divergence</p>
          <p className="text-2xl font-semibold text-[#0F172A]">{projectedGap.toFixed(2)}</p>
          <p className="text-[10px] text-[#94A3B8]">years biological age gap</p>
        </Card>
      </div>

      <Card className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-200">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Two Projected Futures</h2>
            <p className="text-xs leading-relaxed text-[#64748B]">
              The chart compares the monthly progression of biological age under adherence versus non-adherence.
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
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length < 2) return null;
                  const adherence = payload[0].value as number;
                  const nonAdherence = payload[1].value as number;
                  const diff = nonAdherence - adherence;
                  return (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '8px 12px', fontSize: 12 }}>
                      <p style={{ color: '#64748B', marginBottom: 4 }}>{label}</p>
                      <p style={{ color: '#0F766E' }}>Follow plan: {adherence.toFixed(1)}</p>
                      <p style={{ color: '#B91C1C' }}>Ignore plan: {nonAdherence.toFixed(1)}</p>
                      <p style={{ color: '#0F172A', fontWeight: 600, marginTop: 4, borderTop: '1px solid #E2E8F0', paddingTop: 4 }}>
                        Difference: {diff.toFixed(1)} years
                      </p>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Follow plan" name="Follow plan" stroke="#0F766E" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Ignore plan" name="Ignore plan" stroke="#B91C1C" strokeWidth={3} dot={false} strokeDasharray="6 6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] bg-[#F0FDFA] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#0F766E]">
              <TrendingUp className="h-4 w-4" />
              <h3 className="text-sm font-semibold">If the plan is followed</h3>
            </div>
            <p className="text-sm leading-relaxed text-[#475569]">{twin.adherencePath.description}</p>
            <p className="mt-3 text-xs font-medium text-[#0F766E]">
              Month 12: biological age {adherenceEnd.bioAge}, health score {adherenceEnd.healthScore}
            </p>
          </div>
          <div className="rounded-[22px] bg-[#FEF2F2] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#B91C1C]">
              <TrendingUp className="h-4 w-4 rotate-180" />
              <h3 className="text-sm font-semibold">If the plan is not followed</h3>
            </div>
            <p className="text-sm leading-relaxed text-[#475569]">{twin.nonAdherencePath.description}</p>
            <p className="mt-3 text-xs font-medium text-[#B91C1C]">
              Month 12: biological age {nonAdherenceEnd.bioAge}, health score {nonAdherenceEnd.healthScore}
            </p>
          </div>
        </div>
      </Card>

      <Card className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-300">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Body Zone Comparison</h2>
            <p className="text-xs leading-relaxed text-[#64748B]">
              The arrows indicate the regions most likely to change under plan adherence or non-adherence.
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
              <h2 className="text-lg font-semibold">Next Best Action</h2>
              <Badge variant="outline" className="rounded-full border-white/20 bg-white/10 text-white">
                {twin.nextBestActionDays} days
              </Badge>
            </div>
            <p className="text-base font-semibold">{twin.nextBestAction}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{twin.nextBestActionReason}</p>
            <p className="mt-4 text-xs text-white/75">
              Prediction context: {twin.predictionMeta.cohortSize} patients, {twin.predictionMeta.featureCount} features, {twin.predictionMeta.targetWindow}.
            </p>
          </div>
        </div>
      </Card>

      <button
        onClick={() => router.push('/recommendations')}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0D9488] px-5 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#0F766E] animate-fade-up delay-500"
      >
        <Calendar className="h-4 w-4" /> Open recommended actions
      </button>
    </div>
  );
}
