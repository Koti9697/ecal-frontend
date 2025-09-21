// Ensure 'export' is present on both interfaces to make them available to other files.

export interface Group {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  groups: Group[];
}