export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          department: string
          section: string | null
          role: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          department: string
          section?: string | null
          role?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          department?: string
          section?: string | null
          role?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shift_entries: {
        Row: {
          id: string
          employee_id: string
          date: string
          shift_type: string
          other_remark: string | null
          approved: boolean
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          shift_type: string
          other_remark?: string | null
          approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          date?: string
          shift_type?: string
          other_remark?: string | null
          approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}