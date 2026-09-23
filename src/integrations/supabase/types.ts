export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      counsellor_student_notes: {
        Row: {
          category: string
          counsellor_email: string
          counsellor_id: string | null
          counsellor_name: string
          created_at: string
          id: string
          is_pinned: boolean
          note_text: string
          student_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          counsellor_email: string
          counsellor_id?: string | null
          counsellor_name: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          note_text: string
          student_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          counsellor_email?: string
          counsellor_id?: string | null
          counsellor_name?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          note_text?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counsellor_student_notes_counsellor_id_fkey"
            columns: ["counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counsellor_student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      counsellors: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          status: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      demo_call_requests: {
        Row: {
          email: string
          full_name: string
          id: string
          phone: string
          submitted_at: string
          webhook_status: string | null
          whatsapp: string | null
        }
        Insert: {
          email: string
          full_name: string
          id?: string
          phone: string
          submitted_at?: string
          webhook_status?: string | null
          whatsapp?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          id?: string
          phone?: string
          submitted_at?: string
          webhook_status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          dedup_key: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read_at: string | null
          recipient_role: string
          recipient_user_id: string
          student_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          dedup_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read_at?: string | null
          recipient_role: string
          recipient_user_id: string
          student_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          dedup_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read_at?: string | null
          recipient_role?: string
          recipient_user_id?: string
          student_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      session_questions: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          position: number | null
          question: string | null
          session_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          position?: number | null
          question?: string | null
          session_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          position?: number | null
          question?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          booking_event: string | null
          booking_status: string | null
          booking_uid: string
          calendly_event_type_uri: string | null
          calendly_invitee_uri: string | null
          calendly_location: string | null
          cancel_url: string | null
          counsellor_email: string | null
          counsellor_id: string | null
          counsellor_name: string | null
          counsellor_notes: string | null
          counsellor_outcome: string | null
          counsellor_user_uri: string | null
          created_at: string
          end_time: string | null
          event_uri: string | null
          id: string
          invitee_status: string | null
          outcome_updated_at: string | null
          reschedule_url: string | null
          rescheduled: boolean | null
          session_name: string | null
          start_time: string | null
          status: string | null
          student_email: string
          student_id: string | null
          student_name: string | null
          timezone: string | null
        }
        Insert: {
          booking_event?: string | null
          booking_status?: string | null
          booking_uid: string
          calendly_event_type_uri?: string | null
          calendly_invitee_uri?: string | null
          calendly_location?: string | null
          cancel_url?: string | null
          counsellor_email?: string | null
          counsellor_id?: string | null
          counsellor_name?: string | null
          counsellor_notes?: string | null
          counsellor_outcome?: string | null
          counsellor_user_uri?: string | null
          created_at?: string
          end_time?: string | null
          event_uri?: string | null
          id?: string
          invitee_status?: string | null
          outcome_updated_at?: string | null
          reschedule_url?: string | null
          rescheduled?: boolean | null
          session_name?: string | null
          start_time?: string | null
          status?: string | null
          student_email: string
          student_id?: string | null
          student_name?: string | null
          timezone?: string | null
        }
        Update: {
          booking_event?: string | null
          booking_status?: string | null
          booking_uid?: string
          calendly_event_type_uri?: string | null
          calendly_invitee_uri?: string | null
          calendly_location?: string | null
          cancel_url?: string | null
          counsellor_email?: string | null
          counsellor_id?: string | null
          counsellor_name?: string | null
          counsellor_notes?: string | null
          counsellor_outcome?: string | null
          counsellor_user_uri?: string | null
          created_at?: string
          end_time?: string | null
          event_uri?: string | null
          id?: string
          invitee_status?: string | null
          outcome_updated_at?: string | null
          reschedule_url?: string | null
          rescheduled?: boolean | null
          session_name?: string | null
          start_time?: string | null
          status?: string | null
          student_email?: string
          student_id?: string | null
          student_name?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_counsellor_id_fkey"
            columns: ["counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_applications: {
        Row: {
          application_deadline: string | null
          application_number: string | null
          course_name: string
          created_at: string
          created_by_counsellor_id: string | null
          degree_level: string
          id: string
          intake: string
          notes: string | null
          shortlist_id: string | null
          status: string
          student_id: string
          submission_date: string | null
          university_id: string
          updated_at: string
          updated_by_counsellor_id: string | null
        }
        Insert: {
          application_deadline?: string | null
          application_number?: string | null
          course_name: string
          created_at?: string
          created_by_counsellor_id?: string | null
          degree_level: string
          id?: string
          intake: string
          notes?: string | null
          shortlist_id?: string | null
          status?: string
          student_id: string
          submission_date?: string | null
          university_id: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
        }
        Update: {
          application_deadline?: string | null
          application_number?: string | null
          course_name?: string
          created_at?: string
          created_by_counsellor_id?: string | null
          degree_level?: string
          id?: string
          intake?: string
          notes?: string | null
          shortlist_id?: string | null
          status?: string
          student_id?: string
          submission_date?: string | null
          university_id?: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_applications_created_by_counsellor_id_fkey"
            columns: ["created_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_shortlist_id_fkey"
            columns: ["shortlist_id"]
            isOneToOne: false
            referencedRelation: "student_shortlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_updated_by_counsellor_id_fkey"
            columns: ["updated_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          category: string
          created_at: string
          doc_type: string | null
          file_size: number
          id: string
          mime_type: string
          original_filename: string
          rejection_reason: string | null
          status: string
          storage_path: string
          student_id: string
          updated_at: string
          uploaded_by_counsellor_id: string | null
          uploaded_by_counsellor_name: string
          verified_at: string | null
          verified_by_counsellor_id: string | null
          verified_by_counsellor_name: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          doc_type?: string | null
          file_size: number
          id?: string
          mime_type: string
          original_filename: string
          rejection_reason?: string | null
          status?: string
          storage_path: string
          student_id: string
          updated_at?: string
          uploaded_by_counsellor_id?: string | null
          uploaded_by_counsellor_name: string
          verified_at?: string | null
          verified_by_counsellor_id?: string | null
          verified_by_counsellor_name?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          doc_type?: string | null
          file_size?: number
          id?: string
          mime_type?: string
          original_filename?: string
          rejection_reason?: string | null
          status?: string
          storage_path?: string
          student_id?: string
          updated_at?: string
          uploaded_by_counsellor_id?: string | null
          uploaded_by_counsellor_name?: string
          verified_at?: string | null
          verified_by_counsellor_id?: string | null
          verified_by_counsellor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_uploaded_by_counsellor_id_fkey"
            columns: ["uploaded_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_verified_by_counsellor_id_fkey"
            columns: ["verified_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
        ]
      }
      student_offers: {
        Row: {
          application_id: string
          conditions: string | null
          created_at: string
          created_by_counsellor_id: string | null
          decision_date: string | null
          decision_status: string
          deposit_amount: number | null
          deposit_deadline: string | null
          deposit_required: boolean
          id: string
          offer_letter_document_id: string | null
          offer_type: string
          updated_at: string
          updated_by_counsellor_id: string | null
        }
        Insert: {
          application_id: string
          conditions?: string | null
          created_at?: string
          created_by_counsellor_id?: string | null
          decision_date?: string | null
          decision_status?: string
          deposit_amount?: number | null
          deposit_deadline?: string | null
          deposit_required?: boolean
          id?: string
          offer_letter_document_id?: string | null
          offer_type: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
        }
        Update: {
          application_id?: string
          conditions?: string | null
          created_at?: string
          created_by_counsellor_id?: string | null
          decision_date?: string | null
          decision_status?: string
          deposit_amount?: number | null
          deposit_deadline?: string | null
          deposit_required?: boolean
          id?: string
          offer_letter_document_id?: string | null
          offer_type?: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "student_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_offers_created_by_counsellor_id_fkey"
            columns: ["created_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_offers_offer_letter_document_id_fkey"
            columns: ["offer_letter_document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_offers_updated_by_counsellor_id_fkey"
            columns: ["updated_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          additional_info: string | null
          branch: string | null
          budget: string | null
          cgpa: string | null
          created_at: string
          current_degree: string | null
          email: string
          english_test: string | null
          graduation_year: string | null
          id: string
          phone: string | null
          preferred_country: string | null
          preferred_course: string | null
          preferred_intake: string | null
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          additional_info?: string | null
          branch?: string | null
          budget?: string | null
          cgpa?: string | null
          created_at?: string
          current_degree?: string | null
          email: string
          english_test?: string | null
          graduation_year?: string | null
          id?: string
          phone?: string | null
          preferred_country?: string | null
          preferred_course?: string | null
          preferred_intake?: string | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          additional_info?: string | null
          branch?: string | null
          budget?: string | null
          cgpa?: string | null
          created_at?: string
          current_degree?: string | null
          email?: string
          english_test?: string | null
          graduation_year?: string | null
          id?: string
          phone?: string | null
          preferred_country?: string | null
          preferred_course?: string | null
          preferred_intake?: string | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_shortlists: {
        Row: {
          category: string
          course_name: string
          created_at: string
          created_by_counsellor_id: string | null
          degree_level: string
          id: string
          intake: string
          notes: string | null
          status: string
          student_id: string
          university_id: string
          updated_at: string
          updated_by_counsellor_id: string | null
        }
        Insert: {
          category?: string
          course_name: string
          created_at?: string
          created_by_counsellor_id?: string | null
          degree_level: string
          id?: string
          intake: string
          notes?: string | null
          status?: string
          student_id: string
          university_id: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
        }
        Update: {
          category?: string
          course_name?: string
          created_at?: string
          created_by_counsellor_id?: string | null
          degree_level?: string
          id?: string
          intake?: string
          notes?: string | null
          status?: string
          student_id?: string
          university_id?: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_shortlists_created_by_counsellor_id_fkey"
            columns: ["created_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_shortlists_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_shortlists_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_shortlists_updated_by_counsellor_id_fkey"
            columns: ["updated_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
        ]
      }
      student_tasks: {
        Row: {
          assigned_to_counsellor_id: string
          category: string
          completed_at: string | null
          completed_by_counsellor_id: string | null
          created_at: string
          created_by_counsellor_id: string
          description: string | null
          due_at: string | null
          id: string
          priority: string
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_counsellor_id: string
          category?: string
          completed_at?: string | null
          completed_by_counsellor_id?: string | null
          created_at?: string
          created_by_counsellor_id: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_counsellor_id?: string
          category?: string
          completed_at?: string | null
          completed_by_counsellor_id?: string | null
          created_at?: string
          created_by_counsellor_id?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_tasks_assigned_to_counsellor_id_fkey"
            columns: ["assigned_to_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_tasks_completed_by_counsellor_id_fkey"
            columns: ["completed_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_tasks_created_by_counsellor_id_fkey"
            columns: ["created_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_tracking: {
        Row: {
          created_at: string
          current_stage: string
          id: string
          stage_notes: string | null
          student_id: string
          updated_at: string
          updated_by_counsellor_id: string | null
          updated_by_counsellor_name: string | null
        }
        Insert: {
          created_at?: string
          current_stage?: string
          id?: string
          stage_notes?: string | null
          student_id: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
          updated_by_counsellor_name?: string | null
        }
        Update: {
          created_at?: string
          current_stage?: string
          id?: string
          stage_notes?: string | null
          student_id?: string
          updated_at?: string
          updated_by_counsellor_id?: string | null
          updated_by_counsellor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_tracking_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_tracking_updated_by_counsellor_id_fkey"
            columns: ["updated_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
        ]
      }
      student_tracking_history: {
        Row: {
          changed_by_counsellor_id: string | null
          changed_by_counsellor_name: string | null
          created_at: string
          id: string
          notes: string | null
          previous_stage: string | null
          stage: string
          student_id: string
        }
        Insert: {
          changed_by_counsellor_id?: string | null
          changed_by_counsellor_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          previous_stage?: string | null
          stage: string
          student_id: string
        }
        Update: {
          changed_by_counsellor_id?: string | null
          changed_by_counsellor_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          previous_stage?: string | null
          stage?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_tracking_history_changed_by_counsellor_id_fkey"
            columns: ["changed_by_counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_tracking_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          account_status: string | null
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          account_status?: string | null
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
        }
        Update: {
          account_status?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: string
          name: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string
          id?: string
          name: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "super_admin" | "counsellor" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "counsellor", "student"],
    },
  },
} as const
