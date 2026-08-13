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

export interface Parameter {
  id: string;
  name: string;
  param_type: 'path' | 'query' | 'header' | 'body';
  data_type: string | null;
  required: boolean;
  description: string | null;
}

export interface Endpoint {
  id: string;
  project_id: string;
  http_method: string;
  path: string;
  controller_name: string | null;
  method_name: string | null;
  description: string | null;
  auth_required: boolean;
  source_file: string | null;
  parameters: Parameter[];
}

export interface DTOField {
  name: string;
  type: string;
  required: boolean;
}

export interface DTO {
  id: string;
  name: string;
  dto_type: string | null;
  source_file: string | null;
  fields: DTOField[] | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface TestSuite {
  id: string;
  format: 'junit' | 'pytest' | 'postman';
  created_at: string;
}
