import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectsService } from '../../core/services/projects.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/models';
import { NewProjectDialogComponent } from '../projects/new-project-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <span class="brand">⚡ API Doc AI</span>
      <span class="spacer"></span>
      <span class="user-name">{{ auth.currentUser()?.full_name }}</span>
      <button mat-button (click)="auth.logout()">Logout</button>
    </mat-toolbar>

    <div class="page-content">
      <div class="page-header">
        <h1>My Projects</h1>
        <button mat-flat-button color="primary" (click)="openNewProject()">+ New Project</button>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner /></div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <mat-icon>folder_open</mat-icon>
          <p>No projects yet. Connect a GitHub repo or upload source code to get started.</p>
          <button mat-flat-button color="primary" (click)="openNewProject()">Create First Project</button>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of projects(); track project.id) {
            <mat-card class="project-card">
              <mat-card-header>
                <mat-card-title>{{ project.name }}</mat-card-title>
                <mat-card-subtitle>{{ project.description || 'No description' }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="project-meta">
                  <span class="meta-item">📡 {{ project.endpoint_count }} endpoints</span>
                  <span class="meta-item">☕ {{ project.language }}</span>
                </div>
                <mat-chip [class]="'status-' + project.status">
                  {{ statusLabel(project.status) }}
                </mat-chip>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary" [routerLink]="['/projects', project.id]" [disabled]="project.status !== 'ready'">Open</button>
                <button mat-button color="warn" (click)="deleteProject(project.id)">Delete</button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toolbar { position:sticky; top:0; z-index:100; }
    .brand { font-size:18px; font-weight:700; }
    .spacer { flex:1; }
    .user-name { margin-right:12px; font-size:14px; opacity:0.9; }
    .page-content { max-width:1200px; margin:0 auto; padding:32px 24px; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
    .page-header h1 { margin:0; font-size:24px; }
    .projects-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px; }
    .project-card { cursor:pointer; transition:box-shadow 0.2s; }
    .project-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.12); }
    .project-meta { display:flex; gap:16px; margin-bottom:12px; font-size:13px; color:#666; }
    .center { display:flex; justify-content:center; padding:80px; }
    .empty-state { text-align:center; padding:80px 24px; color:#666; }
    .empty-state mat-icon { font-size:64px; width:64px; height:64px; opacity:0.3; }
    .empty-state p { margin:16px 0 24px; }
    .status-ready { background:#e8f5e9 !important; color:#2e7d32 !important; }
    .status-analyzing { background:#fff3e0 !important; color:#e65100 !important; }
    .status-pending { background:#f5f5f5 !important; color:#666 !important; }
    .status-failed { background:#ffebee !important; color:#c62828 !important; }
  `]
})
export class DashboardComponent implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(true);

  constructor(public auth: AuthService, private projectsService: ProjectsService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.projectsService.getAll().subscribe({
      next: (data) => { this.projects.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNewProject() {
    const ref = this.dialog.open(NewProjectDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  deleteProject(id: string) {
    this.projectsService.delete(id).subscribe(() => this.loadProjects());
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { ready: '✅ Ready', analyzing: '⟳ Analyzing', pending: '○ Pending', failed: '✗ Failed' };
    return map[status] || status;
  }
}
