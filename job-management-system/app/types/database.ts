// Hand-written to match supabase/migrations/*.sql while the project has no
// live Supabase instance to generate from yet. Once a project exists, replace
// this file with the output of:
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// and keep it regenerated after every migration. Shape follows the Supabase
// CLI's generated format so the switch-over is a drop-in file replacement.

export type Role = "admin" | "manager" | "sales" | "technician" | "customer";
export type CustomerType = "individual" | "business";
export type JobStatus =
  | "new_enquiry"
  | "scheduled"
  | "inspection_required"
  | "quote_pending"
  | "quote_sent"
  | "approved"
  | "work_in_progress"
  | "completed"
  | "invoice_issued"
  | "paid"
  | "archived"
  | "cancelled";
export type JobPriority = "low" | "normal" | "high" | "urgent";
export type JobSource = "phone" | "whatsapp" | "email" | "walk_in" | "website" | "referral";
export type JobNoteType =
  | "fault_finding"
  | "materials_required"
  | "labour_estimate"
  | "internal_comment"
  | "general";
export type CommChannel = "phone" | "whatsapp" | "email" | "in_person" | "sms";
export type CommDirection = "inbound" | "outbound";
export type AttachmentEntityType = "job" | "quote" | "invoice" | "customer";
export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type InvoiceStatus = "unpaid" | "partial" | "paid" | "overdue" | "cancelled";
export type DiscountType = "none" | "percent" | "fixed";
export type LineItemType = "labour" | "product";
export type PaymentMethod = "cash" | "eft" | "card" | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: Role;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: Role;
          is_active?: boolean;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          role?: Role;
          is_active?: boolean;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          customer_type: CustomerType;
          name: string;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          postal_code: string | null;
          notes: string | null;
          auth_user_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_type?: CustomerType;
          name: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          postal_code?: string | null;
          notes?: string | null;
          created_by: string;
        };
        Update: {
          customer_type?: CustomerType;
          name?: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          postal_code?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          job_number: string;
          customer_id: string;
          assigned_technician_id: string | null;
          service_requested: string;
          service_category: string | null;
          priority: JobPriority;
          status: JobStatus;
          source: JobSource;
          site_address_line1: string | null;
          site_address_line2: string | null;
          site_city: string | null;
          site_postal_code: string | null;
          preferred_date: string | null;
          scheduled_date: string | null;
          completed_at: string | null;
          archived_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          assigned_technician_id?: string | null;
          service_requested: string;
          service_category?: string | null;
          priority?: JobPriority;
          status?: JobStatus;
          source?: JobSource;
          site_address_line1?: string | null;
          site_address_line2?: string | null;
          site_city?: string | null;
          site_postal_code?: string | null;
          preferred_date?: string | null;
          scheduled_date?: string | null;
          created_by: string;
        };
        Update: {
          assigned_technician_id?: string | null;
          service_requested?: string;
          service_category?: string | null;
          priority?: JobPriority;
          status?: JobStatus;
          source?: JobSource;
          site_address_line1?: string | null;
          site_address_line2?: string | null;
          site_city?: string | null;
          site_postal_code?: string | null;
          preferred_date?: string | null;
          scheduled_date?: string | null;
          completed_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      job_status_history: {
        Row: {
          id: string;
          job_id: string;
          old_status: JobStatus | null;
          new_status: JobStatus;
          note: string | null;
          changed_by: string;
          changed_at: string;
        };
        Insert: never;
        Update: {
          note?: string | null;
        };
        Relationships: [];
      };
      job_notes: {
        Row: {
          id: string;
          job_id: string;
          note_type: JobNoteType;
          content: string;
          time_estimate_hours: number | null;
          author_id: string;
          created_at: string;
        };
        Insert: {
          job_id: string;
          note_type?: JobNoteType;
          content: string;
          time_estimate_hours?: number | null;
          author_id: string;
        };
        Update: never;
        Relationships: [];
      };
      communication_logs: {
        Row: {
          id: string;
          customer_id: string;
          job_id: string | null;
          channel: CommChannel;
          direction: CommDirection;
          summary: string;
          logged_by: string;
          occurred_at: string;
        };
        Insert: {
          customer_id: string;
          job_id?: string | null;
          channel: CommChannel;
          direction: CommDirection;
          summary: string;
          logged_by: string;
          occurred_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          entity_type: AttachmentEntityType;
          entity_id: string;
          file_path: string;
          file_type: string | null;
          caption: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          entity_type: AttachmentEntityType;
          entity_id: string;
          file_path: string;
          file_type?: string | null;
          caption?: string | null;
          uploaded_by: string;
        };
        Update: never;
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          quote_number: string;
          job_id: string;
          customer_id: string;
          status: QuoteStatus;
          issue_date: string;
          expiry_date: string | null;
          subtotal: number;
          discount_type: DiscountType;
          discount_value: number;
          discount_amount: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          terms_and_conditions: string | null;
          approved_at: string | null;
          approved_by_note: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          job_id: string;
          customer_id: string;
          status?: QuoteStatus;
          issue_date?: string;
          expiry_date?: string | null;
          discount_type?: DiscountType;
          discount_value?: number;
          tax_rate?: number;
          terms_and_conditions?: string | null;
          created_by: string;
        };
        Update: {
          status?: QuoteStatus;
          expiry_date?: string | null;
          discount_type?: DiscountType;
          discount_value?: number;
          tax_rate?: number;
          terms_and_conditions?: string | null;
          approved_at?: string | null;
          approved_by_note?: string | null;
        };
        Relationships: [];
      };
      quote_line_items: {
        Row: {
          id: string;
          quote_id: string;
          item_type: LineItemType;
          product_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          line_discount_percent: number;
          line_total: number;
          sort_order: number;
        };
        Insert: {
          quote_id: string;
          item_type?: LineItemType;
          product_id?: string | null;
          description: string;
          quantity?: number;
          unit_price?: number;
          line_discount_percent?: number;
          sort_order?: number;
        };
        Update: {
          item_type?: LineItemType;
          product_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          line_discount_percent?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          quote_id: string | null;
          job_id: string;
          customer_id: string;
          status: InvoiceStatus;
          issue_date: string;
          due_date: string | null;
          subtotal: number;
          discount_type: DiscountType;
          discount_value: number;
          discount_amount: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          amount_paid: number;
          balance_due: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          quote_id?: string | null;
          job_id: string;
          customer_id: string;
          issue_date?: string;
          due_date?: string | null;
          discount_type?: DiscountType;
          discount_value?: number;
          tax_rate?: number;
          created_by: string;
        };
        Update: {
          status?: InvoiceStatus;
          due_date?: string | null;
          discount_type?: DiscountType;
          discount_value?: number;
          tax_rate?: number;
        };
        Relationships: [];
      };
      invoice_line_items: {
        Row: {
          id: string;
          invoice_id: string;
          item_type: LineItemType;
          product_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          line_discount_percent: number;
          line_total: number;
          sort_order: number;
        };
        Insert: {
          invoice_id: string;
          item_type?: LineItemType;
          product_id?: string | null;
          description: string;
          quantity?: number;
          unit_price?: number;
          line_discount_percent?: number;
          sort_order?: number;
        };
        Update: {
          item_type?: LineItemType;
          product_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          line_discount_percent?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          payment_method: PaymentMethod;
          payment_date: string;
          reference_number: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          invoice_id: string;
          amount: number;
          payment_method: PaymentMethod;
          payment_date?: string;
          reference_number?: string | null;
          recorded_by: string;
        };
        Update: never;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
      customer_type: CustomerType;
      job_status: JobStatus;
      job_priority: JobPriority;
      job_source: JobSource;
      job_note_type: JobNoteType;
      comm_channel: CommChannel;
      comm_direction: CommDirection;
      attachment_entity_type: AttachmentEntityType;
      quote_status: QuoteStatus;
      invoice_status: InvoiceStatus;
      discount_type: DiscountType;
      line_item_type: LineItemType;
      payment_method: PaymentMethod;
    };
    CompositeTypes: Record<string, never>;
  };
}
