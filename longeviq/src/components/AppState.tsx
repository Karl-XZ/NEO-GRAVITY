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
  EhrRecord,
  LifestyleSurvey,
  UserProfile,
  WearableTelemetry,
} from "@/lib/types";
import type {
  ChatMessage,
  PatientBundle,
  PatientRecord,
  PatientSource,
  PatientSummary,
  QuestionnaireAssessmentInput,
  Recommendation,
} from "@/types";

interface StoredState {
  patientId: string | null;
  patientSource: PatientSource | null;
  profile: UserProfile | null;
  questionnaireBundle: PatientBundle | null;
  chatHistory: ChatMessage[];
  savedRecommendationIds: string[];
}

interface AppState {
  featuredPatients: PatientSummary[];
  currentProfile: UserProfile;
  selectedPatient: PatientRecord | null;
  ehr: EhrRecord | null;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey | null;
  recommendations: Recommendation[];
  chatHistory: ChatMessage[];
  twin: PatientBundle["twin"] | null;
  result: PatientBundle["result"] | null;
  activeTab: string;
  loading: boolean;
  error: string | null;
  loadPatient: (patientId: string) => Promise<boolean>;
  runQuestionnaireAssessment: (
    payload: QuestionnaireAssessmentInput,
  ) => Promise<boolean>;
  startQuestionnaireSignup: () => void;
  clearPatient: () => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setActiveTab: (tab: string) => void;
  toggleRecommendation: (id: string) => void;
  updateCurrentProfile: (patch: Partial<UserProfile>) => void;
}

const STORAGE_KEY = "longeviq_demo_session_v2";

const DEFAULT_PROFILE: UserProfile = {
  id: "demo-guest-profile",
  patient_id: "DEMO-GUEST",
  display_name: "Demo-Zugang",
  ui_mode: "standard",
  persona_hint: null,
  created_at: "2026-04-10T08:00:00.000Z",
  email: "demo@longeviq.local",
  role_label: "Demo",
  plan_label: "Persona-Bibliothek",
  city: "Berlin",
  country_code: "DE",
  timezone: "Europe/Berlin",
  alert_mode: "simple",
  primary_goal: "Fall waehlen oder neue Registrierung mit Fragebogen starten.",
  focus_areas: ["Fallauswahl", "Fragebogen", "Ergebnisansicht"],
};

const QUESTIONNAIRE_PROFILE: UserProfile = {
  id: "demo-questionnaire-profile",
  patient_id: "Q-SELF-BASELINE",
  display_name: "Neue Registrierung",
  ui_mode: "standard",
  persona_hint: null,
  created_at: "2026-04-10T08:00:00.000Z",
  email: "questionnaire@longeviq.local",
  role_label: "Fragebogenprofil",
  plan_label: "Intake-Start",
  city: "Berlin",
  country_code: "DE",
  timezone: "Europe/Berlin",
  alert_mode: "simple",
  primary_goal: "Eine erste praeventive Ausgangslage ueber den Fragebogen aufbauen.",
  focus_areas: ["Selbstauskunft", "Praeventionsscore", "Szenariomodell"],
};

const DEFAULT_STORED_STATE: StoredState = {
  patientId: null,
  patientSource: null,
  profile: null,
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
      parsed.patientSource === "persona" ||
      parsed.patientSource === "supabase" ||
      parsed.patientSource === "questionnaire"
        ? parsed.patientSource
        : parsed.patientId
          ? "persona"
          : null;

    return {
      patientId: parsed.patientId ?? null,
      patientSource,
      profile:
        parsed.profile &&
        typeof parsed.profile === "object" &&
        "display_name" in parsed.profile
          ? (parsed.profile as UserProfile)
          : null,
      questionnaireBundle:
        parsed.questionnaireBundle &&
        typeof parsed.questionnaireBundle === "object" &&
        "patient" in parsed.questionnaireBundle &&
        "result" in parsed.questionnaireBundle &&
        "recommendations" in parsed.questionnaireBundle &&
        "twin" in parsed.questionnaireBundle &&
        "profile" in parsed.questionnaireBundle &&
        "ehr" in parsed.questionnaireBundle &&
        "wearable" in parsed.questionnaireBundle &&
        "lifestyle" in parsed.questionnaireBundle
          ? (parsed.questionnaireBundle as PatientBundle)
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
  bundle: PatientBundle,
  savedRecommendationIds: string[],
): PatientBundle {
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
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(
    initialState.profile ?? DEFAULT_PROFILE,
  );
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(
    null,
  );
  const [ehr, setEhr] = useState<EhrRecord | null>(null);
  const [wearable, setWearable] = useState<WearableTelemetry[]>([]);
  const [lifestyle, setLifestyle] = useState<LifestyleSurvey | null>(null);
  const [result, setResult] = useState<PatientBundle["result"] | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(
    initialState.chatHistory,
  );
  const [twin, setTwin] = useState<PatientBundle["twin"] | null>(null);
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
          if (!response.ok) {
            throw new Error("Fallliste konnte nicht geladen werden");
          }

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
              : new Error("Fallliste konnte nicht geladen werden");

          if (attempt === 1 || cancelled) break;
          await sleep(700);
        }
      }

      if (!cancelled) {
        setError(lastError?.message ?? "Fallliste konnte nicht geladen werden");
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
        setCurrentProfile(nextBundle.profile);
        setSelectedPatient(nextBundle.patient);
        setEhr(nextBundle.ehr);
        setWearable(nextBundle.wearable);
        setLifestyle(nextBundle.lifestyle);
        setResult(nextBundle.result);
        setRecommendations(nextBundle.recommendations);
        setTwin(nextBundle.twin);
        setError(null);
      });
      return;
    }

    if (
      (initialState.patientSource === "persona" ||
        initialState.patientSource === "supabase") &&
      initialState.patientId
    ) {
      void loadPatientBundle(initialState.patientId);
      return;
    }

    if (initialState.profile) {
      setCurrentProfile(initialState.profile);
    }
  }, [initialState]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const questionnaireBundle =
      selectedPatient?.source === "questionnaire" &&
      selectedPatient &&
      result &&
      twin &&
      ehr &&
      lifestyle &&
      wearable.length > 0
        ? {
            profile: currentProfile,
            patient: selectedPatient,
            ehr,
            wearable,
            lifestyle,
            result,
            recommendations,
            twin,
          }
        : null;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        patientId:
          selectedPatient &&
          selectedPatient.source !== "questionnaire"
            ? selectedPatient.patientId
            : null,
        patientSource: selectedPatient?.source ?? null,
        profile: currentProfile,
        questionnaireBundle,
        chatHistory,
        savedRecommendationIds,
      } satisfies StoredState),
    );
  }, [
    chatHistory,
    currentProfile,
    ehr,
    lifestyle,
    recommendations,
    result,
    savedRecommendationIds,
    selectedPatient,
    twin,
    wearable,
  ]);

  async function loadPatientBundle(patientId: string): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Fall konnte nicht geladen werden");

      const bundle = (await response.json()) as PatientBundle;
      const isNewAccount = selectedPatient?.patientId !== patientId;
      const activeSavedIds = isNewAccount ? [] : savedRecommendationIds;
      const nextBundle = applySavedBundle(bundle, activeSavedIds);

      if (isNewAccount) {
        setSavedRecommendationIds([]);
      }

      setCurrentProfile(nextBundle.profile);
      setSelectedPatient(nextBundle.patient);
      setEhr(nextBundle.ehr);
      setWearable(nextBundle.wearable);
      setLifestyle(nextBundle.lifestyle);
      setResult(nextBundle.result);
      setRecommendations(nextBundle.recommendations);
      setTwin(nextBundle.twin);
      setChatHistory([
        {
          id: "intro",
          role: "assistant",
          content:
            `${nextBundle.patient.displayName} wurde geladen. ` +
            (nextBundle.patient.source === "persona"
              ? "Dieser Demo-Login basiert auf dem Persona-Fall aus dem Longevity-Personas-Pitchdeck."
              : "Dieser Fall nutzt importierte Gesundheitsdaten.") +
            " Fragen Sie nach dem wichtigsten Risikobereich oder oeffnen Sie den Gesundheitszwilling fuer den Szenarienvergleich.",
          timestamp: new Date().toISOString(),
        },
      ]);
      return true;
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Fall konnte nicht geladen werden",
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
      if (!response.ok) {
        throw new Error("Fragebogen-Auswertung konnte nicht erstellt werden");
      }

      const bundle = (await response.json()) as PatientBundle;
      const nextBundle = applySavedBundle(bundle, []);

      setSavedRecommendationIds([]);
      setCurrentProfile(nextBundle.profile);
      setSelectedPatient(nextBundle.patient);
      setEhr(nextBundle.ehr);
      setWearable(nextBundle.wearable);
      setLifestyle(nextBundle.lifestyle);
      setResult(nextBundle.result);
      setRecommendations(nextBundle.recommendations);
      setTwin(nextBundle.twin);
      setChatHistory([
        {
          id: "intro",
          role: "assistant",
          content:
            "Ihre fragebogenbasierte Ausgangslage wurde geladen. Diese Werte werden aus den Selbstauskuenften geschaetzt und anschliessend im Praeventionsmodell sowie im Gesundheitszwilling weiterverarbeitet.",
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
    setCurrentProfile(DEFAULT_PROFILE);
    setSelectedPatient(null);
    setEhr(null);
    setWearable([]);
    setLifestyle(null);
    setResult(null);
    setRecommendations([]);
    setChatHistory([]);
    setTwin(null);
    setSavedRecommendationIds([]);
    setError(null);
  };

  const startQuestionnaireSignup = () => {
    clearPatient();
    setCurrentProfile({
      ...QUESTIONNAIRE_PROFILE,
      created_at: new Date().toISOString(),
    });
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

  const updateCurrentProfile = (patch: Partial<UserProfile>) => {
    setCurrentProfile((previous) => ({
      ...previous,
      ...patch,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        featuredPatients,
        currentProfile,
        selectedPatient,
        ehr,
        wearable,
        lifestyle,
        recommendations,
        chatHistory,
        twin,
        result,
        activeTab,
        loading,
        error,
        loadPatient: loadPatientBundle,
        runQuestionnaireAssessment,
        startQuestionnaireSignup,
        clearPatient,
        addChatMessage,
        setActiveTab,
        toggleRecommendation,
        updateCurrentProfile,
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
