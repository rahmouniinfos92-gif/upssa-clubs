export type ClubTypology = string;

export type ClubStatus =
  | 'SOUMIS'
  | 'EN_COURS_DE_REVUE'
  | 'APPROUVE'
  | 'REFUSE'
  | 'RETOUCHE_DEMANDEE';

export type MeetingFrequency = 'Hebdomadaire' | 'Bimensuel' | 'Mensuel';

export interface AdditionalMember {
  name: string;
  filiere: string;
  role: string;
  contact: string;
}

export interface ClubMember {
  id?: number;
  club_id: number;
  full_name: string;
  filiere: string;
  academic_year: string;
  loisir: string;
  competence: string;
  project_idea?: string;
  email?: string;
  phone?: string;
  joined_at?: string;
}

export interface ClubApplication {
  id?: number;
  tracking_code?: string;
  status?: ClubStatus;
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  members_count?: number;
  members?: ClubMember[];

  // 1. Identité & Catégorisation
  official_name: string;
  acronym?: string;
  slogan?: string;
  typology: ClubTypology;
  logo_url?: string;

  // 2. Bureau Exécutif & Membres Fondateurs
  president_name: string;
  president_filiere: string;
  president_email: string;
  president_phone: string;

  vp_name?: string;
  vp_filiere?: string;
  vp_contact?: string;

  sg_name?: string;
  sg_filiere?: string;
  sg_contact?: string;

  treasurer_name?: string;
  treasurer_filiere?: string;
  treasurer_contact?: string;

  comm_lead_name?: string;
  comm_lead_filiere?: string;
  comm_lead_contact?: string;

  additional_members?: AdditionalMember[];
  faculty_advisor_name?: string;
  advisor_agreement?: 'Oui' | 'En attente';

  // 3. Vision, Objectifs & Valeurs
  main_mission: string;
  measurable_objectives: string;
  campus_value_add: string;
  target_audience_type: 'Ouvert à toute l\'université' | 'Spécifique à certains cycles/filières';
  target_audience_details?: string;

  // 4. Plan d'Action Annuel Prévisionnel
  event1_title?: string;
  event1_description?: string;
  event1_date?: string;
  event1_logistics?: string;

  event2_title?: string;
  event2_description?: string;
  event2_date?: string;

  meeting_frequency?: MeetingFrequency;

  // 5. Estimation Budgétaire & Ressources
  annual_budget_mad: number;
  funding_sources: string[];
  facility_needs?: string;

  // 6. Engagement & Signature
  honor_declaration: boolean;
  charter_agreement: boolean;
  declarant_name: string;
  submission_date: string;

  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  changesRequested: number;
  typologyStats: { typology: string; count: number }[];
  budgetSum: number;
}

