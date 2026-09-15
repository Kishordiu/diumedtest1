/**
 * DiuMed typed DB helpers
 * Wraps Supabase client calls with explicit casting to avoid TS inference issues
 * with complex recursive Database generics.
 */
import { supabase } from '../supabase'
import type {
  Database,
  MeasurementType, MeasurementQuality, MeasurementStatus,
  TriageSeverity, TriageSource,
  EmergencyEventType, EmergencyStatus,
  Json,
} from '../database.types'

type Tables = Database['public']['Tables']

// Type aliases for convenience
export type HealthMeasurementInsert = Tables['health_measurements']['Insert']
export type TriageAssessmentInsert = Tables['triage_assessments']['Insert']
export type EmergencyEventInsert = Tables['emergency_events']['Insert']

/** Insert a health measurement */
export async function insertMeasurement(data: HealthMeasurementInsert) {
  return supabase.from('health_measurements').insert(data as never)
}

/** Insert a triage assessment */
export async function insertTriage(data: TriageAssessmentInsert) {
  return supabase.from('triage_assessments').insert(data as never)
}

/** Insert an emergency event */
export async function insertEmergencyEvent(data: EmergencyEventInsert) {
  return supabase.from('emergency_events').insert(data as never)
}

/** Update profile */
export async function updateProfile(
  id: string,
  data: Tables['profiles']['Update']
) {
  return supabase.from('profiles').update(data as never).eq('id', id)
}

/** Update emergency event status */
export async function updateEmergencyStatus(
  userId: string,
  status: EmergencyStatus
) {
  return supabase
    .from('emergency_events')
    .update({ status } as never)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
}
