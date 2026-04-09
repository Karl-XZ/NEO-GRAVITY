'use client';

import { useRouter } from 'next/navigation';
import { User, Calendar, Bookmark, RotateCcw, ChevronRight, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/components/AppState';

function getCaseBadgeLabel(displayName: string) {
  return displayName
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { selectedPatient, result, recommendations, clearPatient } = useAppState();
  const addedRecs = recommendations.filter((recommendation) => recommendation.added);
  const isQuestionnaire = selectedPatient?.source === 'questionnaire';

  return (
    <div className="space-y-6 pb-20">
      <div className="animate-fade-up">
        <h1 className="mb-1 text-2xl font-semibold text-[#0F172A]">Profil</h1>
        <p className="text-sm text-[#64748B]">Aktiver Assessment-Kontext, gespeicherte Planpunkte und aktuelle Datenquelle.</p>
      </div>

      {selectedPatient ? (
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-100">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0D9488] to-[#6366F1] text-lg font-semibold text-white">
              {getCaseBadgeLabel(selectedPatient.displayName)}
            </div>
            <div className="flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0F172A]">{selectedPatient.displayName}</h2>
                <Badge variant="outline" className="rounded-full text-[10px] capitalize">
                  {isQuestionnaire ? selectedPatient.sourceLabel : selectedPatient.country}
                </Badge>
              </div>
              <p className="mb-1 text-sm text-[#64748B]">
                {selectedPatient.age} Jahre - {selectedPatient.sex}
              </p>
              <p className="text-xs text-[#94A3B8]">{selectedPatient.shortSummary}</p>
            </div>
          </div>
          <button
            onClick={clearPatient}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] py-2.5 text-sm text-[#64748B] transition-all hover:border-[#EF4444]/30 hover:text-[#EF4444]"
          >
            <RotateCcw className="h-4 w-4" /> Aktiven Fall zurücksetzen
          </button>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 animate-fade-up delay-100">
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9]">
              <User className="h-7 w-7 text-[#94A3B8]" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-[#0F172A]">Kein Fall geladen</h3>
            <p className="mb-4 text-xs text-[#64748B]">Starten Sie mit dem Fragebogen oder öffnen Sie auf der Assessment-Seite einen realen Fall.</p>
            <button
              onClick={() => router.push('/assessment')}
              className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#0F766E]"
            >
              Assessment starten <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {result ? (
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-5 animate-fade-up delay-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#64748B]" />
              <h3 className="text-sm font-semibold text-[#0F172A]">Letzte Berechnung</h3>
            </div>
            <span className="text-xs text-[#94A3B8]">
              {new Date(result.timestamp).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#F8FAFC] p-3 text-center">
              <p className="mb-0.5 text-xs text-[#64748B]">Gesamtscore</p>
              <p className="text-lg font-semibold text-[#0F172A]">{result.overallScore}</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] p-3 text-center">
              <p className="mb-0.5 text-xs text-[#64748B]">Biologisches Alter</p>
              <p className="text-lg font-semibold text-[#0F172A]">{result.bioAgeEstimate}</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] p-3 text-center">
              <p className="mb-0.5 text-xs text-[#64748B]">Risiken</p>
              <p className="text-lg font-semibold text-[#0F172A]">{result.risks.length}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/result')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F0FDFA] py-2.5 text-sm font-medium text-[#0D9488] transition-all hover:bg-[#0D9488] hover:text-white"
          >
            Vollständige Ergebnisse <ChevronRight className="h-4 w-4" />
          </button>
        </Card>
      ) : null}

      {addedRecs.length > 0 ? (
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-5 animate-fade-up delay-300">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-[#64748B]" />
              <h3 className="text-sm font-semibold text-[#0F172A]">Im Plan gespeichert</h3>
            </div>
            <Badge className="rounded-full bg-[#F0FDFA] text-[10px] text-[#0D9488]">{addedRecs.length}</Badge>
          </div>
          <div className="space-y-2">
            {addedRecs.map((recommendation) => (
              <div key={recommendation.id} className="flex items-center gap-3 border-b border-[#F1F5F9] py-2 last:border-0">
                <Bookmark className="h-3.5 w-3.5 flex-shrink-0 text-[#0D9488]" />
                <span className="flex-1 text-xs text-[#0F172A]">{recommendation.title}</span>
                {recommendation.price ? <span className="text-xs font-medium text-[#64748B]">{recommendation.price}</span> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-5 animate-fade-up delay-400">
        <h3 className="mb-4 text-sm font-semibold text-[#0F172A]">{isQuestionnaire ? 'Assessment-Quelle' : 'Verbundene Datenquellen'}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-[#F1F5F9] py-3">
            <Smartphone className="h-4 w-4 text-[#94A3B8]" />
            <div className="flex-1">
              <p className="text-xs font-medium text-[#0F172A]">Wearables</p>
              <p className="text-[10px] text-[#94A3B8]">
                {isQuestionnaire ? 'Geschätzt aus Schlaf-, Aktivitäts- und Stressangaben' : 'Quelle: wearable_telemetry'}
              </p>
            </div>
            <span className="text-[10px] text-[#0D9488]">{isQuestionnaire ? 'Geschätzt' : 'Verbunden'}</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <User className="h-4 w-4 text-[#94A3B8]" />
            <div className="flex-1">
              <p className="text-xs font-medium text-[#0F172A]">{isQuestionnaire ? 'Fragebogenangaben' : 'Klinische + Lifestyle-Daten'}</p>
              <p className="text-[10px] text-[#94A3B8]">
                {isQuestionnaire ? 'Quelle: Ihre Intake-Antworten' : 'Quelle: ehr_records und lifestyle_survey'}
              </p>
            </div>
            <span className="text-[10px] text-[#0D9488]">{isQuestionnaire ? 'Aktiv' : 'Verbunden'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
