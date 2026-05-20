export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      group_members: {
        Row: {
          group_id: string
          is_admin: boolean
          user_id: string
        }
        Insert: {
          group_id: string
          is_admin?: boolean
          user_id: string
        }
        Update: {
          group_id?: string
          is_admin?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
              foreignKeyName: "group_members_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "users"
              referencedColumns: ["id"]
          }
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          users: string[]
        }
        Insert: {
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          users?: string[]
        }
        Update: {
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          users?: string[]
        }
        Relationships: []
      }
      session_rsvps: {
        Row: {
          created_at: string
          id: string
          session_id: string
          status: "attending" | "maybe" | "not_attending"
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          status: "attending" | "maybe" | "not_attending"
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          status?: "attending" | "maybe" | "not_attending"
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_rsvps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_sessions: {
        Row: {
          datetime: string
          description: string | null
          duration_minutes: number
          group_id: string
          id: string
          is_online: boolean
          location: string | null
          meeting_link: string | null
          title: string
        }
        Insert: {
          datetime: string
          description?: string | null
          duration_minutes?: number
          group_id: string
          id?: string
          is_online?: boolean
          location?: string | null
          meeting_link?: string | null
          title: string
        }
        Update: {
          datetime?: string
          description?: string | null
          duration_minutes?: number
          group_id?: string
          id?: string
          is_online?: boolean
          location?: string | null
          meeting_link?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
          username: string | null
        }
        Insert: {
          email: string
          id: string
          username?: string | null
        }
        Update: {
          email?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_group_creator: { Args: { group_id: string }; Returns: boolean }
      is_group_member: { Args: { group_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}