export type Sex = "male" | "female" | "other";
export type PatientSource = "supabase" | "questionnaire";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type RecommendationCategory =
  | "checkup"
  | "diagnostic"
  | "specialist"
  | "nutrition"
  | "lifestyle";
export type PredictionTrend = "improving" | "stable" | "declining";
export type TwinScenarioId = "adherence" | "non_adherence";
export type BodyRegionId =
  | "brain"
  | "heart"
  | "metabolic"
  | "recovery"
  | "inflammation";
export type AppPage =
  | "home"
  | "dashboard"
  | "assessment"
  | "result"
  | "coach"
  | "health-twin"
  | "recommendations"
  | "profile"
  | "concept";

export interface PatientSummary {
  patientId: string;
  displayName: string;
  source: PatientSource;
  sourceLabel: string;
  tag: string;
  age: number;
  sex: Sex;
  country: string;
  chronicConditions: string[];
  keyRisks: string[];
  primaryConcern: string;
  shortSummary: string;
}

export interface PatientLifestyle {
  surveyDate: string;
  smokingStatus: string;
  alcoholUnitsWeekly: number;
  dietQualityScore: number;
  fruitVegServingsDaily: number;
  mealFrequencyDaily: number;
  exerciseSessionsWeekly: number;
  sedentaryHoursDay: number;
  stressLevel: number;
  sleepSatisfaction: number;
  mentalWellbeingWho5: number;
  selfRatedHealth: number;
  waterGlassesDaily: number;
}

export interface PatientTelemetrySnapshot {
  startDate: string;
  endDate: string;
  avgRestingHr: number;
  avgHrv: number;
  avgSteps: number;
  avgActiveMinutes: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  avgDeepSleepPct: number;
  avgSpo2: number;
}

export interface PatientRecord extends PatientSummary {
  bmi: number;
  heightCm: number;
  weightKg: number;
  systolicBp: number;
  diastolicBp: number;
  totalCholesterolMmol: number;
  ldlMmol: number;
  hba1cPct: number;
  fastingGlucoseMmol: number;
  crpMgL: number;
  egfrMlMin: number;
  medications: string[];
  visitCount2yr: number;
  lifestyle: PatientLifestyle;
  telemetry: PatientTelemetrySnapshot;
}

export interface RiskScore {
  dimension: string;
  score: number;
  level: RiskLevel;
  label: string;
  trend?: PredictionTrend;
}

export interface RiskItem {
  id: string;
  dimension: string;
  title: string;
  description: string;
  severity: RiskLevel;
  actionable: boolean;
  nextAction?: string;
  biomarkerKey?: string;
}

export interface OpportunityItem {
  id: string;
  dimension: string;
  title: string;
  description: string;
  impactScore: number;
  effortLevel: "low" | "medium" | "high";
  timelineWeeks: number;
}

export interface AssessmentResult {
  overallScore: number;
  bioAgeEstimate: number;
  riskScores: RiskScore[];
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  northStarMetric?: string;
  aiSummary: string;
  timestamp: string;
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  reason: string;
  urgency: "routine" | "suggested" | "priority";
  price?: string;
  provider?: string;
  added?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface TrajectoryPoint {
  week: number;
  bioAge: number;
  healthScore: number;
  cardioScore: number;
  metabolicScore: number;
  recoveryScore: number;
}

export interface TrajectoryScenario {
  id: TwinScenarioId;
  label: string;
  description: string;
  color: string;
  points: TrajectoryPoint[];
}

export interface BodyComparisonRegion {
  id: BodyRegionId;
  label: string;
  bodyPart: string;
  currentValue: string;
  adherenceValue: string;
  nonAdherenceValue: string;
  adherenceChange: string;
  nonAdherenceChange: string;
  adherenceTrend: PredictionTrend;
  nonAdherenceTrend: PredictionTrend;
  explanation: string;
}

export interface PredictionMeta {
  modelType: string;
  cohortSize: number;
  featureCount: number;
  targetWindow: string;
}

export interface HealthTwin {
  currentBioAge: number;
  chronologicalAge: number;
  currentScore: number;
  adherencePath: TrajectoryScenario;
  nonAdherencePath: TrajectoryScenario;
  nextBestAction: string;
  nextBestActionReason: string;
  nextBestActionDays: number;
  bodyComparison: BodyComparisonRegion[];
  predictionMeta: PredictionMeta;
}

export interface PatientBundle {
  patient: PatientRecord;
  result: AssessmentResult;
  recommendations: Recommendation[];
  twin: HealthTwin;
}

export interface QuestionnaireAssessmentInput {
  age: number;
  sex: Sex;
  country: string;
  heightCm: number;
  weightKg: number;
  smokingStatus: string;
  alcoholUnitsWeekly: number;
  exerciseSessionsWeekly: number;
  sedentaryHoursDay: number;
  sleepHours: number;
  sleepSatisfaction: number;
  stressLevel: number;
  dietQualityScore: number;
  fruitVegServingsDaily: number;
  waterGlassesDaily: number;
  selfRatedHealth: number;
  chronicConditions: string[];
}
