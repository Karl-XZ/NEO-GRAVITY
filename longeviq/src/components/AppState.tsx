"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AssessmentResult,
  ChatMessage,
  HealthTwin,
  PatientRecord,
  PatientSource,
  PatientSummary,
  QuestionnaireAssessmentInput,
  Recommendation,
} from "@/types";

interface PatientBundleResponse {
  patient: PatientRecord;
  result: AssessmentResult;
  recommendations: Recommendation[];
  twin: HealthTwin;
}

interface StoredState {
  patientId: string | null;
  patientSource: PatientSource | null;
  questionnaireBundle: PatientBundleResponse | null;
  chatHistory: ChatMessage[];
  savedRecommendationIds: string[];
}

interface AppState {
  featuredPatients: PatientSummary[];
  selectedPatient: PatientRecord | null;
  result: AssessmentResult | null;
  recommendations: Recommendation[];
  chatHistory: ChatMessage[];
  twin: HealthTwin | null;
  activeTab: string;
  loading: boolean;
  error: string | null;
  loadPatient: (patientId: string) => Promise<boolean>;
  runQuestionnaireAssessment: (
    payload: QuestionnaireAssessmentInput,
  ) => Promise<boolean>;
  clearPatient: () => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setActiveTab: (tab: string) => void;
  toggleRecommendation: (id: string) => void;
}

const STORAGE_KEY = "longevity_real_patient_state_v1";

const DEFAULT_STORED_STATE: StoredState = {
  patientId: null,
  patientSource: null,
  questionnaireBundle: null,
  chatHistory: [],
  savedRecommendationIds: [],
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const AppContext = createContext<AppState | null>(null);

function loadStoredState(): StoredState {
  if (typeof window === "undefined") return DEFAULT_STORED_STATE;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_STORED_STATE;
    const parsed = JSON.parse(saved) as StoredState;
    const patientSource =
      parsed.patientSource === "supabase" ||
      parsed.patientSource === "questionnaire"
        ? parsed.patientSource
        : parsed.patientId
          ? "supabase"
          : null;
    return {
      patientId: parsed.patientId ?? null,
      patientSource,
      questionnaireBundle:
        parsed.questionnaireBundle &&
        typeof parsed.questionnaireBundle === "object" &&
        "patient" in parsed.questionnaireBundle &&
        "result" in parsed.questionnaireBundle &&
        "recommendations" in parsed.questionnaireBundle &&
        "twin" in parsed.questionnaireBundle
          ? (parsed.questionnaireBundle as PatientBundleResponse)
          : null,
      chatHistory: Array.isArray(parsed.chatHistory) ? parsed.chatHistory : [],
      savedRecommendationIds: Array.isArray(parsed.savedRecommendationIds)
        ? parsed.savedRecommendationIds
        : [],
    };
  } catch {
    return DEFAULT_STORED_STATE;
  }
}

function applySavedRecommendations(
  recommendations: Recommendation[],
  savedRecommendationIds: string[],
) {
  return recommendations.map((recommendation) => ({
    ...recommendation,
    added: savedRecommendationIds.includes(recommendation.id),
  }));
}

function applySavedBundle(
  bundle: PatientBundleResponse,
  savedRecommendationIds: string[],
): PatientBundleResponse {
  return {
    ...bundle,
    recommendations: applySavedRecommendations(
      bundle.recommendations,
      savedRecommendationIds,
    ),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialState = useMemo(() => loadStoredState(), []);
  const [featuredPatients, setFeaturedPatients] = useState<PatientSummary[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(
    null,
  );
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(
    initialState.chatHistory,
  );
  const [twin, setTwin] = useState<HealthTwin | null>(null);
  const [savedRecommendationIds, setSavedRecommendationIds] = useState<
    string[]
  >(initialState.savedRecommendationIds);
  const [activeTab, setActiveTab] = useState("adherence");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didRestoreInitialState = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedPatients = async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch("/api/patients", { cache: "no-store" });
          if (!response.ok) throw new Error("Patientenliste konnte nicht geladen werden");

          const data = (await response.json()) as { patients: PatientSummary[] };
          if (!cancelled) {
            startTransition(() => {
              setFeaturedPatients(data.patients);
              setError(null);
            });
          }
          return;
        } catch (fetchError) {
          lastError =
            fetchError instanceof Error
              ? fetchError
              : new Error("Patientenliste konnte nicht geladen werden");

          if (attempt === 1 || cancelled) break;
          await sleep(700);
        }
      }

      if (!cancelled) {
        setError(lastError?.message ?? "Patientenliste konnte nicht geladen werden");
      }
    };

    void fetchFeaturedPatients();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (didRestoreInitialState.current) {
      return;
    }
    didRestoreInitialState.current = true;

    if (
      initialState.patientSource === "questionnaire" &&
      initialState.questionnaireBundle
    ) {
      const nextBundle = applySavedBundle(
        initialState.questionnaireBundle,
        initialState.savedRecommendationIds,
      );
      startTransition(() => {
        setSelectedPatient(nextBundle.patient);
        setResult(nextBundle.result);
        setRecommendations(nextBundle.recommendations);
        setTwin(nextBundle.twin);
        setError(null);
      });
      return;
    }

    if (initialState.patientSource === "supabase" && initialState.patientId) {
      void loadPatientBundle(initialState.patientId);
    }
  }, [initialState]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const questionnaireBundle =
      selectedPatient?.source === "questionnaire" && selectedPatient && result && twin
        ? {
            patient: selectedPatient,
            result,
            recommendations,
            twin,
          }
        : null;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        patientId:
          selectedPatient?.source === "supabase"
            ? selectedPatient.patientId
            : null,
        patientSource: selectedPatient?.source ?? null,
        questionnaireBundle,
        chatHistory,
        savedRecommendationIds,
      } satisfies StoredState),
    );
  }, [chatHistory, recommendations, result, savedRecommendationIds, selectedPatient, twin]);

  async function loadPatientBundle(patientId: string): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Patientenfall konnte nicht geladen werden");
      const bundle = (await response.json()) as PatientBundleResponse;
      const nextBundle = applySavedBundle(bundle, savedRecommendationIds);

      setSelectedPatient(nextBundle.patient);
      setResult(nextBundle.result);
      setRecommendations(nextBundle.recommendations);
      setTwin(nextBundle.twin);
      if (chatHistory.length === 0) {
        setChatHistory([
          {
            id: "intro",
            role: "assistant",
            content: `${nextBundle.patient.displayName} wurde geladen. ${
              nextBundle.patient.source === "supabase"
                ? "Dieser Fall nutzt echte EHR-, Lifestyle- und Wearable-Daten aus Supabase."
                : "Diese Einschätzung nutzt Ihre Fragebogenantworten, um eine präventive Ausgangslage zu schätzen."
            } Fragen Sie nach dem wichtigsten Risikobereich oder öffnen Sie den Gesundheitszwilling für den Szenarienvergleich.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      return true;
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Patientenfall konnte nicht geladen werden",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function runQuestionnaireAssessment(
    payload: QuestionnaireAssessmentInput,
  ): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("Fragebogen-Auswertung konnte nicht erstellt werden");

      const bundle = (await response.json()) as PatientBundleResponse;
      const nextBundle = applySavedBundle(bundle, savedRecommendationIds);

      setSelectedPatient(nextBundle.patient);
      setResult(nextBundle.result);
      setRecommendations(nextBundle.recommendations);
      setTwin(nextBundle.twin);
      setChatHistory([
        {
          id: "intro",
          role: "assistant",
          content:
            "Ihre fragebogenbasierte Ausgangslage wurde geladen. Diese Werte werden aus den Selbstauskünften geschätzt und anschließend im Präventionsmodell sowie im Gesundheitszwilling weiterverarbeitet.",
          timestamp: new Date().toISOString(),
        },
      ]);

      return true;
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Fragebogen-Auswertung konnte nicht erstellt werden",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  const clearPatient = () => {
    setSelectedPatient(null);
    setResult(null);
    setRecommendations([]);
    setChatHistory([]);
    setTwin(null);
    setSavedRecommendationIds([]);
    setError(null);
  };

  const addChatMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((previous) => [...previous, newMessage]);
  };

  const toggleRecommendation = (id: string) => {
    setSavedRecommendationIds((previous) =>
      previous.includes(id)
        ? previous.filter((savedId) => savedId !== id)
        : [...previous, id],
    );

    setRecommendations((previous) =>
      previous.map((recommendation) =>
        recommendation.id === id
          ? { ...recommendation, added: !recommendation.added }
          : recommendation,
      ),
    );
  };

  return (
    <AppContext.Provider
      value={{
        featuredPatients,
        selectedPatient,
        result,
        recommendations,
        chatHistory,
        twin,
        activeTab,
        loading,
        error,
        loadPatient: loadPatientBundle,
        runQuestionnaireAssessment,
        clearPatient,
        addChatMessage,
        setActiveTab,
        toggleRecommendation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used within AppProvider");
  return context;
}
