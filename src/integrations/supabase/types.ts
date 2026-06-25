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
      ai_search_results: {
        Row: {
          id: string
          professional_user_id: string
          rank: number
          rationale: string | null
          score: number
          session_id: string
          was_contacted: boolean
          was_hired: boolean
          was_shortlisted: boolean
        }
        Insert: {
          id?: string
          professional_user_id: string
          rank: number
          rationale?: string | null
          score: number
          session_id: string
          was_contacted?: boolean
          was_hired?: boolean
          was_shortlisted?: boolean
        }
        Update: {
          id?: string
          professional_user_id?: string
          rank?: number
          rationale?: string | null
          score?: number
          session_id?: string
          was_contacted?: boolean
          was_hired?: boolean
          was_shortlisted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_search_results_professional_user_id_fkey"
            columns: ["professional_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_search_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_sessions: {
        Row: {
          candidate_pool_size: number | null
          created_at: string
          employer_user_id: string
          error_message: string | null
          id: string
          latency_ms: number | null
          model_used: string | null
          query_text: string
          results_returned: number | null
          tokens_completion: number | null
          tokens_prompt: number | null
        }
        Insert: {
          candidate_pool_size?: number | null
          created_at?: string
          employer_user_id: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model_used?: string | null
          query_text: string
          results_returned?: number | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
        }
        Update: {
          candidate_pool_size?: number | null
          created_at?: string
          employer_user_id?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model_used?: string | null
          query_text?: string
          results_returned?: number | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_search_sessions_employer_user_id_fkey"
            columns: ["employer_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_user_id: string
          cover_note: string | null
          employer_notes: string | null
          id: string
          job_posting_id: string
          status: string
          status_updated_at: string
          submitted_at: string
        }
        Insert: {
          applicant_user_id: string
          cover_note?: string | null
          employer_notes?: string | null
          id?: string
          job_posting_id: string
          status?: string
          status_updated_at?: string
          submitted_at?: string
        }
        Update: {
          applicant_user_id?: string
          cover_note?: string | null
          employer_notes?: string | null
          id?: string
          job_posting_id?: string
          status?: string
          status_updated_at?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_type: string
          consented: boolean
          consented_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          consent_type: string
          consented: boolean
          consented_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          consent_type?: string
          consented?: boolean
          consented_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_user_id: string
          resolved_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_user_id: string
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_user_id?: string
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          employer_unread_count: number
          employer_user_id: string
          id: string
          initiated_by: string
          is_archived_employer: boolean
          is_archived_professional: boolean
          job_posting_id: string | null
          last_message_at: string
          professional_unread_count: number
          professional_user_id: string
        }
        Insert: {
          created_at?: string
          employer_unread_count?: number
          employer_user_id: string
          id?: string
          initiated_by: string
          is_archived_employer?: boolean
          is_archived_professional?: boolean
          job_posting_id?: string | null
          last_message_at?: string
          professional_unread_count?: number
          professional_user_id: string
        }
        Update: {
          created_at?: string
          employer_unread_count?: number
          employer_user_id?: string
          id?: string
          initiated_by?: string
          is_archived_employer?: boolean
          is_archived_professional?: boolean
          job_posting_id?: string | null
          last_message_at?: string
          professional_unread_count?: number
          professional_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_employer_user_id_fkey"
            columns: ["employer_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_professional_user_id_fkey"
            columns: ["professional_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          admin_notes: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_deletion_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "data_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          about: string | null
          accepts_sponsored_workers: boolean
          city: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          last_search_at: string | null
          linkedin_url: string | null
          lmia_capable: boolean
          ontario_business_number: string | null
          org_name: string
          org_type: string | null
          org_type_id: string | null
          region_id: string | null
          total_searches_run: number
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          about?: string | null
          accepts_sponsored_workers?: boolean
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_search_at?: string | null
          linkedin_url?: string | null
          lmia_capable?: boolean
          ontario_business_number?: string | null
          org_name: string
          org_type?: string | null
          org_type_id?: string | null
          region_id?: string | null
          total_searches_run?: number
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          about?: string | null
          accepts_sponsored_workers?: boolean
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_search_at?: string | null
          linkedin_url?: string | null
          lmia_capable?: boolean
          ontario_business_number?: string | null
          org_name?: string
          org_type?: string | null
          org_type_id?: string | null
          region_id?: string | null
          total_searches_run?: number
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_org_type_id_fkey"
            columns: ["org_type_id"]
            isOneToOne: false
            referencedRelation: "ref_org_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "ref_ontario_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employer_profiles_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employer_team_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          member_user_id: string
          org_owner_user_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          member_user_id: string
          org_owner_user_id: string
          role?: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          member_user_id?: string
          org_owner_user_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_team_members_member_user_id_fkey"
            columns: ["member_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employer_team_members_org_owner_user_id_fkey"
            columns: ["org_owner_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_count: number
          application_deadline: string | null
          benefits: string[]
          city: string | null
          created_at: string
          description: string | null
          employer_id: string
          employment_type: string | null
          flagged_discriminatory_language: boolean
          id: string
          is_active: boolean
          moderation_status: string
          open_to_sponsorship: boolean
          org_type_id: string | null
          positions_available: number
          profession: string
          profession_id: string | null
          region_id: string | null
          remote_possible: boolean
          requirements: string | null
          requires_current_registration: boolean
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          specialty: string | null
          specialty_id: string | null
          start_date: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          application_count?: number
          application_deadline?: string | null
          benefits?: string[]
          city?: string | null
          created_at?: string
          description?: string | null
          employer_id: string
          employment_type?: string | null
          flagged_discriminatory_language?: boolean
          id?: string
          is_active?: boolean
          moderation_status?: string
          open_to_sponsorship?: boolean
          org_type_id?: string | null
          positions_available?: number
          profession: string
          profession_id?: string | null
          region_id?: string | null
          remote_possible?: boolean
          requirements?: string | null
          requires_current_registration?: boolean
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          specialty?: string | null
          specialty_id?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          application_count?: number
          application_deadline?: string | null
          benefits?: string[]
          city?: string | null
          created_at?: string
          description?: string | null
          employer_id?: string
          employment_type?: string | null
          flagged_discriminatory_language?: boolean
          id?: string
          is_active?: boolean
          moderation_status?: string
          open_to_sponsorship?: boolean
          org_type_id?: string | null
          positions_available?: number
          profession?: string
          profession_id?: string | null
          region_id?: string | null
          remote_possible?: boolean
          requirements?: string | null
          requires_current_registration?: boolean
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          specialty?: string | null
          specialty_id?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_postings_org_type_id_fkey"
            columns: ["org_type_id"]
            isOneToOne: false
            referencedRelation: "ref_org_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "ref_professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "ref_ontario_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "ref_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          id: string
          is_read: boolean
          sender_user_id: string
          sent_at: string
        }
        Insert: {
          body: string
          conversation_id: string
          id?: string
          is_read?: boolean
          sender_user_id: string
          sent_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          id?: string
          is_read?: boolean
          sender_user_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_credentials: {
        Row: {
          completed_at: string | null
          created_at: string
          custom_step_name: string | null
          id: string
          notes: string | null
          started_at: string | null
          status: string
          step_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          custom_step_name?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          step_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          custom_step_name?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          step_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_credentials_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "ref_credential_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_documents: {
        Row: {
          doc_label: string
          doc_type: string
          file_name: string
          file_size_bytes: number | null
          id: string
          is_sensitive: boolean
          is_verified: boolean
          mime_type: string | null
          storage_path: string
          uploaded_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          doc_label: string
          doc_type: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          is_sensitive?: boolean
          is_verified?: boolean
          mime_type?: string | null
          storage_path: string
          uploaded_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          doc_label?: string
          doc_type?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          is_sensitive?: boolean
          is_verified?: boolean
          mime_type?: string | null
          storage_path?: string
          uploaded_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "professional_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_language_proficiencies: {
        Row: {
          created_at: string
          id: string
          language_code: string
          proficiency_level: string | null
          test_date: string | null
          test_id: string | null
          test_score: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language_code: string
          proficiency_level?: string | null
          test_date?: string | null
          test_id?: string | null
          test_score?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language_code?: string
          proficiency_level?: string | null
          test_date?: string | null
          test_id?: string | null
          test_score?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_language_proficiencies_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "ref_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "professional_language_proficiencies_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ref_language_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_language_proficiencies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          available_from: string | null
          bio: string | null
          completeness_score: number
          consent_work_auth_visible: boolean
          country_of_training: string
          country_of_training_code: string | null
          created_at: string
          credentials_status: string | null
          current_city: string | null
          currently_in_canada: boolean
          desired_employment_types: string[]
          desired_role_types: string[]
          id: string
          is_searchable: boolean
          languages: string[]
          last_active_at: string | null
          license_exam_status: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          preferred_cities: string[]
          preferred_region_ids: string[]
          profession: string
          profession_id: string | null
          profile_view_count: number
          salary_expectation_max: number | null
          salary_expectation_min: number | null
          salary_period: string | null
          specialty: string | null
          specialty_id: string | null
          updated_at: string
          user_id: string
          willing_to_relocate: boolean
          work_auth_type_id: string | null
          work_authorization: string | null
          work_authorized_without_sponsorship: boolean | null
          years_experience: number
        }
        Insert: {
          available_from?: string | null
          bio?: string | null
          completeness_score?: number
          consent_work_auth_visible?: boolean
          country_of_training: string
          country_of_training_code?: string | null
          created_at?: string
          credentials_status?: string | null
          current_city?: string | null
          currently_in_canada?: boolean
          desired_employment_types?: string[]
          desired_role_types?: string[]
          id?: string
          is_searchable?: boolean
          languages?: string[]
          last_active_at?: string | null
          license_exam_status?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_cities?: string[]
          preferred_region_ids?: string[]
          profession: string
          profession_id?: string | null
          profile_view_count?: number
          salary_expectation_max?: number | null
          salary_expectation_min?: number | null
          salary_period?: string | null
          specialty?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id: string
          willing_to_relocate?: boolean
          work_auth_type_id?: string | null
          work_authorization?: string | null
          work_authorized_without_sponsorship?: boolean | null
          years_experience?: number
        }
        Update: {
          available_from?: string | null
          bio?: string | null
          completeness_score?: number
          consent_work_auth_visible?: boolean
          country_of_training?: string
          country_of_training_code?: string | null
          created_at?: string
          credentials_status?: string | null
          current_city?: string | null
          currently_in_canada?: boolean
          desired_employment_types?: string[]
          desired_role_types?: string[]
          id?: string
          is_searchable?: boolean
          languages?: string[]
          last_active_at?: string | null
          license_exam_status?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_cities?: string[]
          preferred_region_ids?: string[]
          profession?: string
          profession_id?: string | null
          profile_view_count?: number
          salary_expectation_max?: number | null
          salary_expectation_min?: number | null
          salary_period?: string | null
          specialty?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id?: string
          willing_to_relocate?: boolean
          work_auth_type_id?: string | null
          work_authorization?: string | null
          work_authorized_without_sponsorship?: boolean | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_country_of_training_code_fkey"
            columns: ["country_of_training_code"]
            isOneToOne: false
            referencedRelation: "ref_countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "professional_profiles_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "ref_professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profiles_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "ref_specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "professional_profiles_work_auth_type_id_fkey"
            columns: ["work_auth_type_id"]
            isOneToOne: false
            referencedRelation: "ref_work_auth_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_view_events: {
        Row: {
          id: string
          professional_user_id: string
          view_source: string
          viewed_at: string
        }
        Insert: {
          id?: string
          professional_user_id: string
          view_source: string
          viewed_at?: string
        }
        Update: {
          id?: string
          professional_user_id?: string
          view_source?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_view_events_professional_user_id_fkey"
            columns: ["professional_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ref_countries: {
        Row: {
          code: string
          name: string
          region: string | null
        }
        Insert: {
          code: string
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      ref_credential_steps: {
        Row: {
          cost_cad: number | null
          description: string | null
          governing_body: string | null
          id: string
          info_url: string | null
          profession_id: string
          step_name: string
          step_order: number
          typical_duration_weeks: number | null
        }
        Insert: {
          cost_cad?: number | null
          description?: string | null
          governing_body?: string | null
          id: string
          info_url?: string | null
          profession_id: string
          step_name: string
          step_order: number
          typical_duration_weeks?: number | null
        }
        Update: {
          cost_cad?: number | null
          description?: string | null
          governing_body?: string | null
          id?: string
          info_url?: string | null
          profession_id?: string
          step_name?: string
          step_order?: number
          typical_duration_weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ref_credential_steps_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "ref_professions"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_language_tests: {
        Row: {
          accepted_by_professions: string[]
          full_name: string | null
          id: string
          language: string
          name: string
          notes: string | null
          website: string | null
        }
        Insert: {
          accepted_by_professions?: string[]
          full_name?: string | null
          id: string
          language?: string
          name: string
          notes?: string | null
          website?: string | null
        }
        Update: {
          accepted_by_professions?: string[]
          full_name?: string | null
          id?: string
          language?: string
          name?: string
          notes?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ref_languages: {
        Row: {
          code: string
          name: string
          native_name: string | null
          sort_order: number
        }
        Insert: {
          code: string
          name: string
          native_name?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          name?: string
          native_name?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      ref_ontario_regions: {
        Row: {
          display_name: string
          id: string
          population_tier: number
          region_category: string
        }
        Insert: {
          display_name: string
          id: string
          population_tier?: number
          region_category: string
        }
        Update: {
          display_name?: string
          id?: string
          population_tier?: number
          region_category?: string
        }
        Relationships: []
      }
      ref_org_types: {
        Row: {
          display_name: string
          id: string
          sort_order: number
        }
        Insert: {
          display_name: string
          id: string
          sort_order?: number
        }
        Update: {
          display_name?: string
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      ref_professions: {
        Row: {
          college_id: string | null
          created_at: string
          display_name: string
          id: string
          is_regulated: boolean
          noc_codes: string[]
          sort_order: number
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          display_name: string
          id: string
          is_regulated?: boolean
          noc_codes?: string[]
          sort_order?: number
        }
        Update: {
          college_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_regulated?: boolean
          noc_codes?: string[]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ref_professions_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "ref_regulatory_colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_regulatory_colleges: {
        Row: {
          created_at: string
          full_name: string
          id: string
          name: string
          register_url: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          name: string
          register_url?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          name?: string
          register_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ref_specialties: {
        Row: {
          display_name: string
          id: string
          profession_id: string
          sort_order: number
        }
        Insert: {
          display_name: string
          id: string
          profession_id: string
          sort_order?: number
        }
        Update: {
          display_name?: string
          id?: string
          profession_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ref_specialties_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "ref_professions"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_work_auth_types: {
        Row: {
          can_work_immediately: boolean
          display_name: string
          employer_display: string
          id: string
          notes: string | null
          requires_sponsorship: boolean
        }
        Insert: {
          can_work_immediately?: boolean
          display_name: string
          employer_display: string
          id: string
          notes?: string | null
          requires_sponsorship?: boolean
        }
        Update: {
          can_work_immediately?: boolean
          display_name?: string
          employer_display?: string
          id?: string
          notes?: string | null
          requires_sponsorship?: boolean
        }
        Relationships: []
      }
      shortlists: {
        Row: {
          created_at: string
          employer_user_id: string
          id: string
          list_name: string
          notes: string | null
          professional_user_id: string
        }
        Insert: {
          created_at?: string
          employer_user_id: string
          id?: string
          list_name?: string
          notes?: string | null
          professional_user_id: string
        }
        Update: {
          created_at?: string
          employer_user_id?: string
          id?: string
          list_name?: string
          notes?: string | null
          professional_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_employer_user_id_fkey"
            columns: ["employer_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shortlists_professional_user_id_fkey"
            columns: ["professional_user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_consent_status"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_consent_status: {
        Row: {
          ai_processing_accepted: boolean | null
          data_sharing_accepted: boolean | null
          privacy_accepted: boolean | null
          tos_accepted: boolean | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_user_data: {
        Args: { _admin_user_id: string; _user_id: string }
        Returns: undefined
      }
      assign_employer_role: { Args: never; Returns: undefined }
      calc_profile_completeness: { Args: { _user_id: string }; Returns: number }
      employer_daily_search_count: {
        Args: { _employer_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_professional_profiles: {
        Args: {
          _limit?: number
          _min_years_experience?: number
          _profession_id?: string
          _work_authorized_only?: boolean
        }
        Returns: {
          available_from: string
          bio: string
          country_of_training: string
          credentials_status: string
          current_city: string
          currently_in_canada: boolean
          desired_employment_types: string[]
          desired_role_types: string[]
          languages: string[]
          license_exam_status: string
          preferred_cities: string[]
          profession: string
          profession_id: string
          specialty: string
          user_id: string
          willing_to_relocate: boolean
          work_authorized_without_sponsorship: boolean
          years_experience: number
        }[]
      }
      set_initial_user_role: { Args: { _role: string }; Returns: undefined }
      user_has_required_consents: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "professional" | "employer"
      app_role: "admin" | "professional" | "employer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      account_type: ["professional", "employer"],
      app_role: ["admin", "professional", "employer"],
    },
  },
} as const
