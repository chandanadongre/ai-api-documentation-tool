import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project, ProjectCreate } from '../models/models';

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
}
