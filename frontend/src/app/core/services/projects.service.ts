import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project, ProjectCreate, Endpoint, DTO } from '../models/models';

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
}
