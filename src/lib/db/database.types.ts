export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string
          active: boolean
          color: string
          created_at: string
          currency: string
          id: string
          include_in_net_worth: boolean
          institution: string | null
          name: string
          opening_balance_minor: number
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          active?: boolean
          color?: string
          created_at?: string
          currency?: string
          id?: string
          include_in_net_worth?: boolean
          institution?: string | null
          name: string
          opening_balance_minor?: number
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_type?: string
          active?: boolean
          color?: string
          created_at?: string
          currency?: string
          id?: string
          include_in_net_worth?: boolean
          institution?: string | null
          name?: string
          opening_balance_minor?: number
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_records: {
        Row: {
          active_minutes: number | null
          calories: number | null
          created_at: string
          distance_m: number | null
          external_id: string | null
          id: string
          record_date: string
          source: string
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          calories?: number | null
          created_at?: string
          distance_m?: number | null
          external_id?: string | null
          id?: string
          record_date: string
          source?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          active_minutes?: number | null
          calories?: number | null
          created_at?: string
          distance_m?: number | null
          external_id?: string | null
          id?: string
          record_date?: string
          source?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          source: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          source?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          budget_id: string
          category_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          budget_id: string
          category_id: string
          created_at?: string
          user_id?: string
        }
        Update: {
          budget_id?: string
          category_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'budget_categories_budget_id_user_id_fkey'
            columns: ['budget_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'budgets'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'budget_categories_category_id_user_id_fkey'
            columns: ['category_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'transaction_categories'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      budgets: {
        Row: {
          active: boolean
          amount_minor: number
          created_at: string
          currency: string
          id: string
          name: string
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount_minor: number
          created_at?: string
          currency?: string
          id?: string
          name: string
          period?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          active?: boolean
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          name?: string
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean
          color: string
          created_at: string
          description: string | null
          ends_at: string
          external_id: string | null
          external_provider: string | null
          goal_id: string | null
          id: string
          life_area_id: string | null
          location: string | null
          project_id: string | null
          repeat_rule: Json | null
          repeat_until: string | null
          starts_at: string
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          color?: string
          created_at?: string
          description?: string | null
          ends_at: string
          external_id?: string | null
          external_provider?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string | null
          location?: string | null
          project_id?: string | null
          repeat_rule?: Json | null
          repeat_until?: string | null
          starts_at: string
          task_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          all_day?: boolean
          color?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          external_id?: string | null
          external_provider?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string | null
          location?: string | null
          project_id?: string | null
          repeat_rule?: Json | null
          repeat_until?: string | null
          starts_at?: string
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'calendar_events_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'calendar_events_life_area_id_user_id_fkey'
            columns: ['life_area_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'life_areas'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'calendar_events_project_id_user_id_fkey'
            columns: ['project_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'calendar_events_task_id_user_id_fkey'
            columns: ['task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      daily_reviews: {
        Row: {
          created_at: string
          highlights: string | null
          id: string
          notes: string | null
          review_date: string
          stats: NonNullable<Json>
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highlights?: string | null
          id?: string
          notes?: string | null
          review_date: string
          stats?: NonNullable<Json>
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          highlights?: string | null
          id?: string
          notes?: string | null
          review_date?: string
          stats?: NonNullable<Json>
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          equipment: string | null
          id: string
          muscle_group: string | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          equipment?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          equipment?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          goal_id: string
          id: string
          position: number
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          goal_id: string
          id?: string
          position?: number
          target_value?: number | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          goal_id?: string
          id?: string
          position?: number
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goal_milestones_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      goal_progress_logs: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          logged_at: string
          note: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          logged_at?: string
          note?: string | null
          user_id?: string
          value: number
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'goal_progress_logs_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      goals: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          current_value: number
          deadline: string | null
          description: string | null
          id: string
          life_area_id: string | null
          linked_account_id: string | null
          notes: string | null
          progress_source: string
          start_date: string
          start_value: number
          status: string
          target_type: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          id?: string
          life_area_id?: string | null
          linked_account_id?: string | null
          notes?: string | null
          progress_source?: string
          start_date?: string
          start_value?: number
          status?: string
          target_type?: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          id?: string
          life_area_id?: string | null
          linked_account_id?: string | null
          notes?: string | null
          progress_source?: string
          start_date?: string
          start_value?: number
          status?: string
          target_type?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goals_life_area_id_user_id_fkey'
            columns: ['life_area_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'life_areas'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'goals_linked_account_id_user_id_fkey'
            columns: ['linked_account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'account_balances'
            referencedColumns: ['account_id', 'user_id']
          },
          {
            foreignKeyName: 'goals_linked_account_id_user_id_fkey'
            columns: ['linked_account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          note: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          note?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'habit_logs_habit_id_user_id_fkey'
            columns: ['habit_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'habits'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          color: string
          created_at: string
          description: string | null
          end_date: string | null
          frequency: string
          goal_id: string | null
          habit_type: string
          icon: string | null
          id: string
          interval_days: number | null
          life_area_id: string | null
          name: string
          position: number
          reminder_time: string | null
          start_date: string
          target: number
          times_per_week: number | null
          unit: string | null
          updated_at: string
          user_id: string
          weekdays: number[]
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          goal_id?: string | null
          habit_type?: string
          icon?: string | null
          id?: string
          interval_days?: number | null
          life_area_id?: string | null
          name: string
          position?: number
          reminder_time?: string | null
          start_date?: string
          target?: number
          times_per_week?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          goal_id?: string | null
          habit_type?: string
          icon?: string | null
          id?: string
          interval_days?: number | null
          life_area_id?: string | null
          name?: string
          position?: number
          reminder_time?: string | null
          start_date?: string
          target?: number
          times_per_week?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: 'habits_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'habits_life_area_id_user_id_fkey'
            columns: ['life_area_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'life_areas'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      integrations: {
        Row: {
          connected_at: string | null
          created_at: string
          id: string
          provider: string
          settings: NonNullable<Json>
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          id?: string
          provider: string
          settings?: NonNullable<Json>
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          id?: string
          provider?: string
          settings?: NonNullable<Json>
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          could_be_better: string | null
          created_at: string
          entry_date: string
          id: string
          mood: number | null
          today_text: string | null
          tomorrow_text: string | null
          updated_at: string
          user_id: string
          went_well: string | null
        }
        Insert: {
          could_be_better?: string | null
          created_at?: string
          entry_date: string
          id?: string
          mood?: number | null
          today_text?: string | null
          tomorrow_text?: string | null
          updated_at?: string
          user_id?: string
          went_well?: string | null
        }
        Update: {
          could_be_better?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          mood?: number | null
          today_text?: string | null
          tomorrow_text?: string | null
          updated_at?: string
          user_id?: string
          went_well?: string | null
        }
        Relationships: []
      }
      life_areas: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_reviews: {
        Row: {
          challenges: string | null
          created_at: string
          id: string
          month_start: string
          next_focus: string | null
          stats: NonNullable<Json>
          updated_at: string
          user_id: string
          wins: string | null
        }
        Insert: {
          challenges?: string | null
          created_at?: string
          id?: string
          month_start: string
          next_focus?: string | null
          stats?: NonNullable<Json>
          updated_at?: string
          user_id?: string
          wins?: string | null
        }
        Update: {
          challenges?: string | null
          created_at?: string
          id?: string
          month_start?: string
          next_focus?: string | null
          stats?: NonNullable<Json>
          updated_at?: string
          user_id?: string
          wins?: string | null
        }
        Relationships: []
      }
      note_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          note_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'note_links_note_id_user_id_fkey'
            columns: ['note_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      note_tags: {
        Row: {
          created_at: string
          note_id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          tag_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          note_id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'note_tags_note_id_user_id_fkey'
            columns: ['note_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'note_tags_tag_id_user_id_fkey'
            columns: ['tag_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      notes: {
        Row: {
          archived_at: string | null
          content: string
          content_text: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          content?: string
          content_text?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          content?: string
          content_text?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedupe_key: string
          href?: string | null
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dedupe_key?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          onboarded_at: string | null
          plan: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          onboarded_at?: string | null
          plan?: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onboarded_at?: string | null
          plan?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          color: string
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          goal_id: string | null
          id: string
          life_area_id: string | null
          name: string
          priority: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string | null
          name: string
          priority?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string | null
          name?: string
          priority?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'projects_life_area_id_user_id_fkey'
            columns: ['life_area_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'life_areas'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      recurring_transactions: {
        Row: {
          account_id: string
          active: boolean
          amount_minor: number
          auto_post: boolean
          category_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          merchant: string | null
          next_date: string
          repeat_rule: NonNullable<Json>
          transfer_account_id: string | null
          txn_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          active?: boolean
          amount_minor: number
          auto_post?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          merchant?: string | null
          next_date: string
          repeat_rule: NonNullable<Json>
          transfer_account_id?: string | null
          txn_type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string
          active?: boolean
          amount_minor?: number
          auto_post?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          merchant?: string | null
          next_date?: string
          repeat_rule?: NonNullable<Json>
          transfer_account_id?: string | null
          txn_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recurring_transactions_account_id_user_id_fkey'
            columns: ['account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'account_balances'
            referencedColumns: ['account_id', 'user_id']
          },
          {
            foreignKeyName: 'recurring_transactions_account_id_user_id_fkey'
            columns: ['account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'recurring_transactions_category_id_user_id_fkey'
            columns: ['category_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'transaction_categories'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'recurring_transactions_transfer_account_id_user_id_fkey'
            columns: ['transfer_account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'account_balances'
            referencedColumns: ['account_id', 'user_id']
          },
          {
            foreignKeyName: 'recurring_transactions_transfer_account_id_user_id_fkey'
            columns: ['transfer_account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      routine_items: {
        Row: {
          created_at: string
          duration_minutes: number | null
          habit_id: string | null
          id: string
          position: number
          routine_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          habit_id?: string | null
          id?: string
          position?: number
          routine_id: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          habit_id?: string | null
          id?: string
          position?: number
          routine_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'routine_items_habit_id_user_id_fkey'
            columns: ['habit_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'habits'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'routine_items_routine_id_user_id_fkey'
            columns: ['routine_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'routines'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      routine_runs: {
        Row: {
          completed_at: string | null
          completed_item_ids: string[]
          created_at: string
          id: string
          routine_id: string
          run_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_item_ids?: string[]
          created_at?: string
          id?: string
          routine_id: string
          run_date: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          completed_item_ids?: string[]
          created_at?: string
          id?: string
          routine_id?: string
          run_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'routine_runs_routine_id_user_id_fkey'
            columns: ['routine_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'routines'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      routines: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          life_area_id: string | null
          name: string
          position: number
          routine_type: string
          start_time: string | null
          updated_at: string
          user_id: string
          weekdays: number[]
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          life_area_id?: string | null
          name: string
          position?: number
          routine_type?: string
          start_time?: string | null
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          life_area_id?: string | null
          name?: string
          position?: number
          routine_type?: string
          start_time?: string | null
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: 'routines_life_area_id_user_id_fkey'
            columns: ['life_area_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'life_areas'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      shopping_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          list_id: string
          name: string
          position: number
          purchased: boolean
          purchased_at: string | null
          quantity: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          list_id: string
          name: string
          position?: number
          purchased?: boolean
          purchased_at?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          list_id?: string
          name?: string
          position?: number
          purchased?: boolean
          purchased_at?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shopping_items_list_id_user_id_fkey'
            columns: ['list_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'shopping_lists'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      shopping_lists: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          id: string
          name: string
          storage_path: string | null
          task_id: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          storage_path?: string | null
          task_id: string
          url?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          storage_path?: string | null
          task_id?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_attachments_task_id_user_id_fkey'
            columns: ['task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          task_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_dependencies_depends_on_task_id_user_id_fkey'
            columns: ['depends_on_task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'task_dependencies_task_id_user_id_fkey'
            columns: ['task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      task_tags: {
        Row: {
          created_at: string
          tag_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          task_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_tags_tag_id_user_id_fkey'
            columns: ['tag_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'task_tags_task_id_user_id_fkey'
            columns: ['task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          duration_minutes: number | null
          goal_id: string | null
          id: string
          is_someday: boolean
          life_area_id: string | null
          notes: string | null
          parent_task_id: string | null
          position: number
          priority: number
          project_id: string | null
          reminder_at: string | null
          repeat_rule: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          duration_minutes?: number | null
          goal_id?: string | null
          id?: string
          is_someday?: boolean
          life_area_id?: string | null
          notes?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: number
          project_id?: string | null
          reminder_at?: string | null
          repeat_rule?: Json | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          duration_minutes?: number | null
          goal_id?: string | null
          id?: string
          is_someday?: boolean
          life_area_id?: string | null
          notes?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: number
          project_id?: string | null
          reminder_at?: string | null
          repeat_rule?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'tasks_life_area_id_user_id_fkey'
            columns: ['life_area_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'life_areas'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'tasks_parent_task_id_user_id_fkey'
            columns: ['parent_task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'tasks_project_id_user_id_fkey'
            columns: ['project_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      training_plan_sessions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          plan_id: string
          target_distance_m: number | null
          target_duration_minutes: number | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
          week: number | null
          weekday: number
          workout_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_id: string
          target_distance_m?: number | null
          target_duration_minutes?: number | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
          week?: number | null
          weekday: number
          workout_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          target_distance_m?: number | null
          target_duration_minutes?: number | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          week?: number | null
          weekday?: number
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'training_plan_sessions_plan_id_user_id_fkey'
            columns: ['plan_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'training_plans'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'training_plan_sessions_template_id_user_id_fkey'
            columns: ['template_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'workout_templates'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      training_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          goal_id: string | null
          id: string
          name: string
          start_date: string
          updated_at: string
          user_id: string
          weeks: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          name: string
          start_date?: string
          updated_at?: string
          user_id?: string
          weeks?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
          user_id?: string
          weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: 'training_plans_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      transaction_categories: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          icon: string | null
          id: string
          kind: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          kind: string
          name: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          kind?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount_minor: number
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          description: string | null
          id: string
          merchant: string | null
          occurred_on: string
          recurring_id: string | null
          source: string
          tags: string[]
          transfer_account_id: string | null
          transfer_amount_minor: number | null
          txn_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_minor: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          occurred_on?: string
          recurring_id?: string | null
          source?: string
          tags?: string[]
          transfer_account_id?: string | null
          transfer_amount_minor?: number | null
          txn_type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string
          amount_minor?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          occurred_on?: string
          recurring_id?: string | null
          source?: string
          tags?: string[]
          transfer_account_id?: string | null
          transfer_amount_minor?: number | null
          txn_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_user_id_fkey'
            columns: ['account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'account_balances'
            referencedColumns: ['account_id', 'user_id']
          },
          {
            foreignKeyName: 'transactions_account_id_user_id_fkey'
            columns: ['account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'transactions_category_id_user_id_fkey'
            columns: ['category_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'transaction_categories'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'transactions_recurring_id_user_id_fkey'
            columns: ['recurring_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'recurring_transactions'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'transactions_transfer_account_id_user_id_fkey'
            columns: ['transfer_account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'account_balances'
            referencedColumns: ['account_id', 'user_id']
          },
          {
            foreignKeyName: 'transactions_transfer_account_id_user_id_fkey'
            columns: ['transfer_account_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      user_preferences: {
        Row: {
          accent: string
          created_at: string
          currency: string
          dashboard_layout: NonNullable<Json>
          date_format: string
          focus_date: string | null
          focus_text: string | null
          interests: string[]
          language: string
          last_used: NonNullable<Json>
          notification_settings: NonNullable<Json>
          theme: string
          timezone: string
          units: string
          updated_at: string
          user_id: string
          week_start: number
        }
        Insert: {
          accent?: string
          created_at?: string
          currency?: string
          dashboard_layout?: NonNullable<Json>
          date_format?: string
          focus_date?: string | null
          focus_text?: string | null
          interests?: string[]
          language?: string
          last_used?: NonNullable<Json>
          notification_settings?: NonNullable<Json>
          theme?: string
          timezone?: string
          units?: string
          updated_at?: string
          user_id?: string
          week_start?: number
        }
        Update: {
          accent?: string
          created_at?: string
          currency?: string
          dashboard_layout?: NonNullable<Json>
          date_format?: string
          focus_date?: string | null
          focus_text?: string | null
          interests?: string[]
          language?: string
          last_used?: NonNullable<Json>
          notification_settings?: NonNullable<Json>
          theme?: string
          timezone?: string
          units?: string
          updated_at?: string
          user_id?: string
          week_start?: number
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          challenges: string | null
          created_at: string
          id: string
          next_priorities: string | null
          stats: NonNullable<Json>
          updated_at: string
          user_id: string
          week_start: string
          wins: string | null
        }
        Insert: {
          challenges?: string | null
          created_at?: string
          id?: string
          next_priorities?: string | null
          stats?: NonNullable<Json>
          updated_at?: string
          user_id?: string
          week_start: string
          wins?: string | null
        }
        Update: {
          challenges?: string | null
          created_at?: string
          id?: string
          next_priorities?: string | null
          stats?: NonNullable<Json>
          updated_at?: string
          user_id?: string
          week_start?: string
          wins?: string | null
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          updated_at?: string
          user_id?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_exercises_workout_id_user_id_fkey'
            columns: ['workout_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'workouts'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean
          created_at: string
          duration_seconds: number | null
          id: string
          reps: number | null
          rest_seconds: number | null
          rpe: number | null
          set_number: number
          updated_at: string
          user_id: string
          weight_kg: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          rest_seconds?: number | null
          rpe?: number | null
          set_number: number
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          rest_seconds?: number | null
          rpe?: number | null
          set_number?: number
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_sets_workout_exercise_id_user_id_fkey'
            columns: ['workout_exercise_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'workout_exercises'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          position: number
          rest_seconds: number | null
          target_reps: number | null
          target_sets: number | null
          target_weight_kg: number | null
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          position?: number
          rest_seconds?: number | null
          target_reps?: number | null
          target_sets?: number | null
          target_weight_kg?: number | null
          template_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          position?: number
          rest_seconds?: number | null
          target_reps?: number | null
          target_sets?: number | null
          target_weight_kg?: number | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_template_exercises_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_template_exercises_template_id_user_id_fkey'
            columns: ['template_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'workout_templates'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          workout_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          avg_heart_rate: number | null
          calories: number | null
          created_at: string
          distance_m: number | null
          duration_minutes: number | null
          elevation_m: number | null
          ended_at: string | null
          external_id: string | null
          goal_id: string | null
          id: string
          life_area_id: string | null
          name: string
          notes: string | null
          performed_on: string
          plan_session_id: string | null
          source: string
          splits: Json | null
          started_at: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
          workout_type: string
        }
        Insert: {
          avg_heart_rate?: number | null
          calories?: number | null
          created_at?: string
          distance_m?: number | null
          duration_minutes?: number | null
          elevation_m?: number | null
          ended_at?: string | null
          external_id?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string | null
          name: string
          notes?: string | null
          performed_on?: string
          plan_session_id?: string | null
          source?: string
          splits?: Json | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Update: {
          avg_heart_rate?: number | null
          calories?: number | null
          created_at?: string
          distance_m?: number | null
          duration_minutes?: number | null
          elevation_m?: number | null
          ended_at?: string | null
          external_id?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string | null
          name?: string
          notes?: string | null
          performed_on?: string
          plan_session_id?: string | null
          source?: string
          splits?: Json | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workouts_goal_id_user_id_fkey'
            columns: ['goal_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'workouts_life_area_id_user_id_fkey'
            columns: ['life_area_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'life_areas'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'workouts_plan_session_id_user_id_fkey'
            columns: ['plan_session_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'training_plan_sessions'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'workouts_template_id_user_id_fkey'
            columns: ['template_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'workout_templates'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
    }
    Views: {
      account_balances: {
        Row: {
          account_id: string | null
          balance_minor: number | null
          currency: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          balance_minor?: never
          currency?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          balance_minor?: never
          currency?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      attach_updated_at: { Args: { p_table: unknown }; Returns: undefined }
      can_use_exercise: { Args: { p_exercise_id: string }; Returns: boolean }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_valid_timezone: { Args: { p_tz: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
