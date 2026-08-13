import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, Endpoint } from '../../../core/models/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatListModule, MatDividerModule, MatCardModule],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/dashboard"><mat-icon>arrow_back</mat-icon></button>
      <span class="brand">⚡ API Doc AI</span>
      <span class="spacer"></span>
      <span class="user-name">{{ auth.currentUser()?.full_name }}</span>
      <button mat-button (click)="auth.logout()">Logout</button>
    </mat-toolbar>

    @if (!project()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <!-- Analyzing state -->
      @if (project()!.status === 'analyzing' || project()!.status === 'pending') {
        <div class="progress-container">
          <mat-card class="progress-card">
            <mat-card-header>
              <mat-card-title>Analyzing Repository</mat-card-title>
              <mat-card-subtitle>{{ project()!.name }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="progress-steps">
                <div class="step done">✓ Project created</div>
                <div class="step active">⟳ Fetching repository files...</div>
                <div class="step pending">○ Parsing Java annotations</div>
                <div class="step pending">○ Extracting endpoints &amp; DTOs</div>
                <div class="step pending">○ Storing API model</div>
              </div>
              <mat-spinner diameter="40" class="spinner" />
              <p class="hint">This may take a moment depending on repository size.</p>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Failed state -->
      @if (project()!.status === 'failed') {
        <div class="progress-container">
          <mat-card class="progress-card error-card">
            <mat-card-header>
              <mat-card-title>Analysis Failed</mat-card-title>
              <mat-card-subtitle>{{ project()!.name }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Could not analyze the repository. Please check the URL or ZIP file and try again.</p>
              <button mat-flat-button color="primary" routerLink="/dashboard">Back to Dashboard</button>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Ready state -->
      @if (project()!.status === 'ready') {
        <div class="explorer-layout">
          <!-- Sidebar -->
          <div class="sidebar">
            <div class="sidebar-header">
              <h2>{{ project()!.name }}</h2>
              <div class="stats">
                <span class="stat">{{ project()!.endpoint_count }} endpoints</span>
                <span class="stat">☕ Java</span>
              </div>
            </div>
            <mat-divider />
            <div class="method-counts">
              @for (m of methodCounts(); track m.method) {
                <div class="method-row">
                  <span [class]="'badge badge-' + m.method.toLowerCase()">{{ m.method }}</span>
                  <span class="count">{{ m.count }}</span>
                </div>
              }
            </div>
            <mat-divider />
            <div class="endpoint-list">
              @for (ep of endpoints(); track ep.id) {
                <div class="endpoint-item" [class.active]="selectedEndpoint()?.id === ep.id" (click)="selectEndpoint(ep)">
                  <span [class]="'badge badge-' + ep.http_method.toLowerCase()">{{ ep.http_method }}</span>
                  <span class="ep-path">{{ ep.path }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Detail panel -->
          <div class="detail-panel">
            @if (!selectedEndpoint()) {
              <div class="empty-detail">
                <mat-icon>api</mat-icon>
                <p>Select an endpoint from the list to view details</p>
              </div>
            } @else {
              <div class="endpoint-detail">
                <div class="detail-header">
                  <span [class]="'badge-lg badge-' + selectedEndpoint()!.http_method.toLowerCase()">
                    {{ selectedEndpoint()!.http_method }}
                  </span>
                  <span class="detail-path">{{ selectedEndpoint()!.path }}</span>
                </div>

                <div class="detail-meta">
                  <span>Controller: <strong>{{ selectedEndpoint()!.controller_name || '—' }}</strong></span>
                  <span>Method: <strong>{{ selectedEndpoint()!.method_name || '—' }}</strong></span>
                  <span>Auth: <strong>{{ selectedEndpoint()!.auth_required ? '🔐 Required' : '🔓 None' }}</strong></span>
                </div>

                @if (selectedEndpoint()!.parameters.length > 0) {
                  <h3>Parameters</h3>
                  <table class="params-table">
                    <thead><tr><th>Name</th><th>Type</th><th>In</th><th>Required</th></tr></thead>
                    <tbody>
                      @for (p of selectedEndpoint()!.parameters; track p.id) {
                        <tr>
                          <td><code>{{ p.name }}</code></td>
                          <td>{{ p.data_type || '—' }}</td>
                          <td><span class="param-badge">{{ p.param_type }}</span></td>
                          <td>{{ p.required ? '✓' : '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <p class="no-params">No parameters detected.</p>
                }

                <div class="detail-actions">
                  <button mat-flat-button color="primary">🚀 Try It (Phase 3)</button>
                  <button mat-stroked-button>🧪 Generate Tests (Phase 6)</button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    mat-toolbar { position:sticky; top:0; z-index:100; }
    .brand { font-size:18px; font-weight:700; margin-left:8px; }
    .spacer { flex:1; }
    .user-name { margin-right:12px; font-size:14px; opacity:0.9; }
    .center { display:flex; justify-content:center; padding:80px; }

    /* Progress */
    .progress-container { display:flex; justify-content:center; padding:60px 24px; }
    .progress-card { width:480px; padding:24px; }
    .error-card { border-left:4px solid #d32f2f; }
    .progress-steps { display:flex; flex-direction:column; gap:12px; margin:20px 0; }
    .step { font-size:14px; padding:8px 12px; border-radius:6px; }
    .step.done { color:#2e7d32; background:#e8f5e9; }
    .step.active { color:#e65100; background:#fff3e0; font-weight:500; }
    .step.pending { color:#999; background:#f5f5f5; }
    .spinner { margin:20px auto; }
    .hint { text-align:center; color:#999; font-size:13px; }

    /* Explorer layout */
    .explorer-layout { display:flex; height:calc(100vh - 64px); }
    .sidebar { width:300px; min-width:300px; border-right:1px solid #e0e0e0; overflow-y:auto; background:#fafafa; }
    .sidebar-header { padding:16px; }
    .sidebar-header h2 { margin:0 0 8px; font-size:16px; }
    .stats { display:flex; gap:12px; font-size:12px; color:#666; }
    .method-counts { padding:12px 16px; display:flex; flex-direction:column; gap:6px; }
    .method-row { display:flex; align-items:center; gap:8px; font-size:13px; }
    .count { color:#666; }
    .endpoint-list { padding:8px 0; }
    .endpoint-item { display:flex; align-items:center; gap:8px; padding:8px 16px; cursor:pointer; font-size:13px; }
    .endpoint-item:hover { background:#f0f0f0; }
    .endpoint-item.active { background:#e3f2fd; }
    .ep-path { font-family:monospace; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    /* Badges */
    .badge, .badge-lg { display:inline-block; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700; min-width:52px; text-align:center; }
    .badge-lg { font-size:13px; padding:4px 10px; }
    .badge-get { background:#e3f2fd; color:#1565c0; }
    .badge-post { background:#e8f5e9; color:#2e7d32; }
    .badge-put { background:#fff3e0; color:#e65100; }
    .badge-delete { background:#ffebee; color:#c62828; }
    .badge-patch { background:#f3e5f5; color:#6a1b9a; }

    /* Detail panel */
    .detail-panel { flex:1; overflow-y:auto; padding:32px; }
    .empty-detail { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#bbb; }
    .empty-detail mat-icon { font-size:64px; width:64px; height:64px; }
    .detail-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
    .detail-path { font-family:monospace; font-size:20px; font-weight:600; }
    .detail-meta { display:flex; gap:24px; font-size:13px; color:#666; margin-bottom:24px; flex-wrap:wrap; }
    h3 { font-size:14px; font-weight:600; margin-bottom:10px; color:#333; }
    .params-table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px; }
    .params-table th { text-align:left; padding:8px 12px; background:#f5f5f5; border-bottom:2px solid #e0e0e0; font-weight:600; }
    .params-table td { padding:8px 12px; border-bottom:1px solid #f0f0f0; }
    .param-badge { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:11px; }
    code { background:#f5f5f5; padding:2px 5px; border-radius:3px; font-size:12px; }
    .no-params { color:#999; font-size:13px; }
    .detail-actions { display:flex; gap:12px; margin-top:8px; }
  `]
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  project = signal<Project | null>(null);
  endpoints = signal<Endpoint[]>([]);
  selectedEndpoint = signal<Endpoint | null>(null);
  methodCounts = signal<{ method: string; count: number }[]>([]);

  private pollSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private projectsService: ProjectsService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadProject(id);
  }

  loadProject(id: string) {
    this.projectsService.getById(id).subscribe(p => {
      this.project.set(p);
      if (p.status === 'ready') {
        this.loadEndpoints(id);
      } else if (p.status === 'analyzing' || p.status === 'pending') {
        this.startPolling(id);
      }
    });
  }

  startPolling(id: string) {
    this.pollSub = interval(3000).pipe(
      switchMap(() => this.projectsService.getById(id)),
      takeWhile(p => p.status === 'analyzing' || p.status === 'pending', true),
    ).subscribe(p => {
      this.project.set(p);
      if (p.status === 'ready') this.loadEndpoints(id);
    });
  }

  loadEndpoints(id: string) {
    this.projectsService.getEndpoints(id).subscribe(eps => {
      this.endpoints.set(eps);
      this.computeMethodCounts(eps);
    });
  }

  computeMethodCounts(eps: Endpoint[]) {
    const counts: Record<string, number> = {};
    eps.forEach(e => counts[e.http_method] = (counts[e.http_method] || 0) + 1);
    this.methodCounts.set(Object.entries(counts).map(([method, count]) => ({ method, count })));
  }

  selectEndpoint(ep: Endpoint) {
    this.selectedEndpoint.set(ep);
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }
}
