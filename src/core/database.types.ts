// DiuMed Database Types
// Generated from the Supabase schema — update when schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MeasurementType = 'heart_rate' | 'spo2' | 'respiratory_rate' | 'hrv' | 'estimated_hemoglobin' | 'anemia_screening' | 'sclera_screening' | 'lab_biomarker'
export type MeasurementQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNKNOWN'
export type MeasurementStatus = 'PENDING' | 'SAVED' | 'FAILED' | 'DISCARDED'
export type TriageSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN'
export type TriageSource = 'OFFLINE_RULE_ENGINE' | 'ONLINE_AI_ASSISTANCE'
export type EmergencyEventType = 'CALL_112' | 'CALL_CUSTOM' | 'SMS_CUSTOM'
export type EmergencyStatus = 'INITIATED' | 'HANDED_OFF' | 'UNVERIFIABLE' | 'FAILED'
export type UserRole = 'user' | 'admin'
export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type Language = 'en' | 'ta' | 'hi'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          date_of_birth: string | null
          sex: Sex | null
          preferred_language: Language
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          date_of_birth?: string | null
          sex?: Sex | null
          preferred_language?: Language
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          avatar_url?: string | null
        }
        Update: {
          full_name?: string | null
          date_of_birth?: string | null
          sex?: Sex | null
          preferred_language?: Language
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          avatar_url?: string | null
        }
      }
      consents: {
        Row: {
          id: string
          user_id: string
          consent_type: string
          version: string
          granted: boolean
          granted_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          consent_type: string
          version?: string
          granted?: boolean
          granted_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          granted?: boolean
          revoked_at?: string | null
        }
      }
      device_sessions: {
        Row: {
          id: string
          user_id: string
          session_id: string
          platform: string | null
          browser: string | null
          started_at: string
          ended_at: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          user_id: string
          session_id: string
          platform?: string | null
          browser?: string | null
          started_at?: string
          ended_at?: string | null
          metadata?: Json
        }
        Update: {
          ended_at?: string | null
          metadata?: Json
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: UserRole
          granted_by: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          role?: UserRole
          granted_by?: string | null
        }
        Update: {
          role?: UserRole
        }
      }
      health_measurements: {
        Row: {
          id: string
          user_id: string
          measurement_type: MeasurementType
          value_numeric: number | null
          unit: string | null
          quality: MeasurementQuality
          status: MeasurementStatus
          captured_at: string
          duration_seconds: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          user_id: string
          measurement_type: MeasurementType
          value_numeric?: number | null
          unit?: string | null
          quality?: MeasurementQuality
          status?: MeasurementStatus
          captured_at?: string
          duration_seconds?: number | null
          metadata?: Json
        }
        Update: {
          status?: MeasurementStatus
          quality?: MeasurementQuality
        }
      }
      triage_assessments: {
        Row: {
          id: string
          user_id: string
          symptoms: string[]
          symptom_text: string | null
          input_language: string
          severity: TriageSeverity
          recommendation: string
          source: TriageSource
          confidence: number | null
          model_metadata: Json | null
          limitations: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          symptoms?: string[]
          symptom_text?: string | null
          input_language?: string
          severity: TriageSeverity
          recommendation: string
          source: TriageSource
          confidence?: number | null
          model_metadata?: Json | null
          limitations?: string | null
        }
        Update: {
          severity?: TriageSeverity
          recommendation?: string
        }
      }
      emergency_events: {
        Row: {
          id: string
          user_id: string
          event_type: EmergencyEventType
          target: string | null
          status: EmergencyStatus
          initiated_at: string
          metadata: Json
          created_at: string
        }
        Insert: {
          user_id: string
          event_type: EmergencyEventType
          target?: string | null
          status?: EmergencyStatus
          initiated_at?: string
          metadata?: Json
        }
        Update: {
          status?: EmergencyStatus
          metadata?: Json
        }
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          admin_user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
        }
        Update: {
          metadata?: Json
        }
      }
    }
  }
}
