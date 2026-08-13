export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  source_type: 'github' | 'upload';
  github_url: string | null;
  status: 'pending' | 'analyzing' | 'ready' | 'failed';
  language: string;
  endpoint_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  source_type: 'github' | 'upload';
  github_url?: string;
}
