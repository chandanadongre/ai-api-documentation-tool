import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project, ProjectCreate, Endpoint, DTO, ChatMessage } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly API = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Project[]>(`${this.API}/projects`);
  }

  getById(id: string) {
    return this.http.get<Project>(`${this.API}/projects/${id}`);
  }

  create(payload: ProjectCreate) {
    return this.http.post<Project>(`${this.API}/projects`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${this.API}/projects/${id}`);
  }

  analyzeGithub(project_id: string, github_url: string, github_token?: string) {
    return this.http.post(`${this.API}/repositories/analyze/github`, { project_id, github_url, github_token });
  }

  analyzeUpload(project_id: string, file: File) {
    const form = new FormData();
    form.append('project_id', project_id);
    form.append('file', file);
    return this.http.post(`${this.API}/repositories/analyze/upload`, form);
  }

  getEndpoints(project_id: string) {
    return this.http.get<Endpoint[]>(`${this.API}/projects/${project_id}/endpoints`);
  }

  getDTOs(project_id: string) {
    return this.http.get<DTO[]>(`${this.API}/projects/${project_id}/dtos`);
  }

  getOpenapiJson(project_id: string) {
    return this.http.get<any>(`${this.API}/projects/${project_id}/openapi.json`);
  }

  downloadOpenapiYaml(project_id: string) {
    return this.http.get(`${this.API}/projects/${project_id}/openapi.yaml`, { responseType: 'blob' });
  }

  playground(project_id: string, method: string, url: string, headers: Record<string, string>, body: any) {
    return this.http.post<any>(`${this.API}/projects/${project_id}/playground`, { method, url, headers, body });
  }

  getChatHistory(project_id: string) {
    return this.http.get<ChatMessage[]>(`${this.API}/projects/${project_id}/ai/history`);
  }

  clearChatHistory(project_id: string) {
    return this.http.delete(`${this.API}/projects/${project_id}/ai/history`);
  }

  chat(project_id: string, message: string) {
    return this.http.post<{ role: string; content: string }>(
      `${this.API}/projects/${project_id}/ai/chat`, { message }
    );
  }
}
