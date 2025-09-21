// In src/types/models.ts

// This file centralizes all the data structures for the application.
import { User as AuthUser } from './User';

export interface Privilege {
  id: number;
  name: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  privileges: Privilege[];
}

export interface Template {
  id: number;
  template_id: string;
  name: string;
  version: string;
  status: string;
  approved_at: string | null;
  document_data?: any;
  signatures?: any[];
  audit_trail?: any[];
}

export interface Record {
  id: number;
  record_id_display: string;
  status: string;
  created_at: string;
  created_by: AuthUser;
  template: Template;
  signatures?: any[];
  audit_trail?: any[];
}

export interface SystemSettings {
  [key: string]: any; // Allows for dynamic access
  session_timeout_minutes: number;
  time_zone: string;
  date_format: string;
  time_format: string;
}