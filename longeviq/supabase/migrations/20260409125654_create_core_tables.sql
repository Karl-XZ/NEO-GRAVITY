-- ============================================================
-- LongevIQ — Core tables for EHR, Wearable & Lifestyle data
-- ============================================================

-- 1. EHR Records (one row per patient, clinical baseline)
create table if not exists ehr_records (
  patient_id   text primary key,
  age          integer not null,
  sex          text not null,
  country      text not null,
  height_cm    numeric not null,
  weight_kg    numeric not null,
  bmi          numeric not null,
  smoking_status text not null,
  alcohol_units_weekly integer not null,
  chronic_conditions text not null default '',
  icd_codes    text not null default '',
  n_chronic_conditions integer not null default 0,
  medications  text not null default '',
  n_visits_2yr integer not null default 0,
  visit_history text,
  sbp_mmhg     integer not null,
  dbp_mmhg     integer not null,
  total_cholesterol_mmol numeric not null,
  ldl_mmol     numeric not null,
  hdl_mmol     numeric not null,
  triglycerides_mmol numeric not null,
  hba1c_pct    numeric not null,
  fasting_glucose_mmol numeric not null,
  crp_mg_l     numeric not null,
  egfr_ml_min  integer not null
);

-- 2. Wearable Telemetry (one row per patient per day)
create table if not exists wearable_telemetry (
  patient_id        text not null,
  date              date not null,
  resting_hr_bpm    integer not null,
  hrv_rmssd_ms      numeric not null,
  steps             integer not null,
  active_minutes    integer not null,
  sleep_duration_hrs numeric not null,
  sleep_quality_score integer not null,
  deep_sleep_pct    numeric not null,
  spo2_avg_pct      numeric not null,
  calories_burned_kcal integer not null,
  primary key (patient_id, date)
);

-- 3. Lifestyle Survey (one row per patient per survey date)
create table if not exists lifestyle_survey (
  patient_id              text not null,
  survey_date             date not null,
  smoking_status          text not null,
  alcohol_units_weekly    integer not null,
  diet_quality_score      integer not null,
  fruit_veg_servings_daily numeric not null,
  meal_frequency_daily    integer not null,
  exercise_sessions_weekly integer not null,
  sedentary_hrs_day       numeric not null,
  stress_level            integer not null,
  sleep_satisfaction      integer not null,
  mental_wellbeing_who5   integer not null,
  self_rated_health       integer not null,
  water_glasses_daily     integer not null,
  primary key (patient_id, survey_date)
);

-- 4. Profiles table (links auth.users to patient data)
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  patient_id    text unique,
  display_name  text,
  ui_mode       text not null default 'standard' check (ui_mode in ('simple', 'standard', 'expert')),
  persona_hint  text check (persona_hint in ('preventive-performer', 'concerned-preventer', 'digital-optimizer', 'clinic-anchored-loyalist')),
  created_at    timestamptz not null default now()
);

-- 5. Derived features (pre-computed, JSONB)
create table if not exists derived_features (
  patient_id  text primary key,
  features    jsonb not null default '{}',
  computed_at timestamptz not null default now()
);

-- 6. Daily scores (readiness / recovery)
create table if not exists daily_scores (
  patient_id      text not null,
  date            date not null,
  readiness_score numeric,
  recovery_score  numeric,
  primary key (patient_id, date)
);

-- Foreign keys to ehr_records
alter table wearable_telemetry
  add constraint fk_wearable_patient foreign key (patient_id) references ehr_records(patient_id);

alter table lifestyle_survey
  add constraint fk_lifestyle_patient foreign key (patient_id) references ehr_records(patient_id);

alter table derived_features
  add constraint fk_derived_patient foreign key (patient_id) references ehr_records(patient_id);

alter table daily_scores
  add constraint fk_daily_scores_patient foreign key (patient_id) references ehr_records(patient_id);

-- Indexes for common queries
create index idx_wearable_patient_date on wearable_telemetry(patient_id, date desc);
create index idx_lifestyle_patient on lifestyle_survey(patient_id);
create index idx_daily_scores_patient_date on daily_scores(patient_id, date desc);

-- Row Level Security
alter table ehr_records enable row level security;
alter table wearable_telemetry enable row level security;
alter table lifestyle_survey enable row level security;
alter table profiles enable row level security;
alter table derived_features enable row level security;
alter table daily_scores enable row level security;

-- RLS policies: users can only read their own data (via profiles.patient_id)
create policy "Users read own EHR" on ehr_records
  for select using (
    patient_id = (select patient_id from profiles where id = auth.uid())
  );

create policy "Users read own wearable" on wearable_telemetry
  for select using (
    patient_id = (select patient_id from profiles where id = auth.uid())
  );

create policy "Users read own lifestyle" on lifestyle_survey
  for select using (
    patient_id = (select patient_id from profiles where id = auth.uid())
  );

create policy "Users read own profile" on profiles
  for select using (id = auth.uid());

create policy "Users update own profile" on profiles
  for update using (id = auth.uid());

create policy "Users read own derived" on derived_features
  for select using (
    patient_id = (select patient_id from profiles where id = auth.uid())
  );

create policy "Users read own scores" on daily_scores
  for select using (
    patient_id = (select patient_id from profiles where id = auth.uid())
  );
