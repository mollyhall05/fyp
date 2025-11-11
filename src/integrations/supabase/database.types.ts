export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            group_members: {
                Row: {
                    group_id: string
                    user_id: string
                    is_admin: boolean
                }
                Insert: {
                    group_id: string
                    is_admin: boolean
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
                    created_by: string | null
                    description: string | null
                    id: string
                    name: string
                    is_public: boolean
                }
                Insert: {
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    is_public: boolean
                }
                Update: {
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    is_public?: boolean
                }
                Relationships: []
            }
            study_sessions: {
                Row: {
                    description: string | null
                    duration_minutes: number
                    group_id: string
                    id: string
                    is_online: boolean
                    location: string | null
                    meeting_link: string | null
                    datetime: string
                    title: string
                }
                Insert: {
                    description?: string | null
                    duration_minutes?: number
                    group_id: string
                    id?: string
                    is_online?: boolean
                    location?: string | null
                    meeting_link?: string | null
                    datetime: string
                    title: string
                }
                Update: {
                    description?: string | null
                    duration_minutes?: number
                    group_id?: string
                    id?: string
                    is_online?: boolean
                    location?: string | null
                    meeting_link?: string | null
                    datetime?: string
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
                    username: string | null
                    id: string
                }
                Insert: {
                    email: string
                    username?: string | null
                    id: string
                }
                Update: {
                    email?: string
                    username?: string | null
                    id?: string
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
        Enums: {},
    },
} as const
