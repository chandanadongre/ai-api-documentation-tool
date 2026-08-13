import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, Endpoint, ChatMessage, TestSuite } from '../../../core/models/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatToolbarModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, MatCardModule, MatTabsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSnackBarModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/dashboard"><mat-icon>arrow_back</mat-icon></button>
      <span class="brand">⚡ API Doc AI</span>
      @if (project()) { <span class="project-name">/ {{ project()!.name }}</span> }
      <span class="spacer"></span>
      <span class="user-name">{{ auth.currentUser()?.full_name }}</span>
      <button mat-button (click)="auth.logout()">Logout</button>
    </mat-toolbar>

    @if (!project()) {
      <div class="center"><mat-spinner /></div>

    } @else if (project()!.status === 'analyzing' || project()!.status === 'pending') {
      <div class="progress-container">
        <mat-card class="progress-card">
          <mat-card-header>
            <mat-card-title>Analyzing Repository</mat-card-title>
            <mat-card-subtitle>{{ project()!.name }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="progress-steps">
              <div class="step done">✓ Project created</div>
              <div class="step active">⟳ Fetching &amp; parsing Java files...</div>
              <div class="step pending">○ Extracting endpoints &amp; DTOs</div>
              <div class="step pending">○ Building API model</div>
            </div>
            <mat-spinner diameter="36" class="spinner" />
            <p class="hint">Polling every 3 seconds...</p>
          </mat-card-content>
        </mat-card>
      </div>

    } @else if (project()!.status === 'failed') {
      <div class="progress-container">
        <mat-card class="progress-card error-card">
          <mat-card-header><mat-card-title>Analysis Failed</mat-card-title></mat-card-header>
          <mat-card-content>
            <p>Could not analyze the repository. Check the URL or ZIP and try again.</p>
            <button mat-flat-button color="primary" routerLink="/dashboard" style="margin-top:16px">Back to Dashboard</button>
          </mat-card-content>
        </mat-card>
      </div>

    } @else {
      <div class="explorer-layout">

        <!-- Sidebar -->
        <div class="sidebar">
          <div class="sidebar-header">
            <div class="project-title">{{ project()!.name }}</div>
            <div class="project-stats">
              <span>{{ project()!.endpoint_count }} endpoints</span>
              <span>☕ Java</span>
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
              <div class="endpoint-item"
                [class.active]="selectedEndpoint()?.id === ep.id"
                (click)="selectEndpoint(ep)">
                <span [class]="'badge badge-' + ep.http_method.toLowerCase()">{{ ep.http_method }}</span>
                <span class="ep-path">{{ ep.path }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Main panel -->
        <div class="main-panel">
          <mat-tab-group animationDuration="150ms" class="detail-tabs">

            <!-- ===== DOCS TAB ===== -->
            <mat-tab label="📄 Documentation">
              <div class="tab-content">
                @if (!selectedEndpoint()) {
                  <div class="empty-state-inline">
                    <mat-icon>api</mat-icon>
                    <p>Select an endpoint from the sidebar to view its documentation.</p>
                  </div>
                } @else {
                  <div class="detail-header">
                    <span [class]="'badge-lg badge-' + selectedEndpoint()!.http_method.toLowerCase()">
                      {{ selectedEndpoint()!.http_method }}
                    </span>
                    <span class="detail-path">{{ selectedEndpoint()!.path }}</span>
                  </div>
                  <div class="detail-meta">
                    <div class="meta-item"><span class="meta-label">Controller</span><span>{{ selectedEndpoint()!.controller_name || '—' }}</span></div>
                    <div class="meta-item"><span class="meta-label">Method</span><span>{{ selectedEndpoint()!.method_name || '—' }}</span></div>
                    <div class="meta-item"><span class="meta-label">Auth</span><span>{{ selectedEndpoint()!.auth_required ? '🔐 JWT Bearer' : '🔓 None' }}</span></div>
                    <div class="meta-item"><span class="meta-label">Source</span><span class="mono">{{ selectedEndpoint()!.source_file || '—' }}</span></div>
                  </div>
                  @if (selectedEndpoint()!.parameters.length > 0) {
                    <h3>Parameters</h3>
                    <table class="params-table">
                      <thead><tr><th>Name</th><th>Type</th><th>In</th><th>Required</th></tr></thead>
                      <tbody>
                        @for (p of selectedEndpoint()!.parameters; track p.id) {
                          <tr>
                            <td><code>{{ p.name }}</code></td>
                            <td><code>{{ p.data_type || '—' }}</code></td>
                            <td><span class="param-in">{{ p.param_type }}</span></td>
                            <td>{{ p.required ? '✓' : '—' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  } @else {
                    <p class="muted">No parameters detected for this endpoint.</p>
                  }
                }
              </div>
            </mat-tab>

              <!-- ===== PLAYGROUND TAB ===== -->
              <mat-tab label="🚀 Playground">
                <div class="tab-content playground">
                  <div class="playground-layout">

                    <!-- Request side -->
                    <div class="request-panel">
                      <h3>Request</h3>

                      <div class="url-row">
                        <span [class]="'badge-lg badge-' + selectedEndpoint()!.http_method.toLowerCase()">
                          {{ selectedEndpoint()!.http_method }}
                        </span>
                        <mat-form-field appearance="outline" class="url-field">
                          <mat-label>Base URL</mat-label>
                          <input matInput [(ngModel)]="playgroundBaseUrl" placeholder="http://localhost:8080" />
                        </mat-form-field>
                      </div>

                      <div class="full-url">
                        <span class="muted">Full URL: </span>
                        <code>{{ playgroundBaseUrl }}{{ selectedEndpoint()!.path }}</code>
                      </div>

                      @if (selectedEndpoint()!.auth_required) {
                        <mat-form-field appearance="outline" class="full-width mt">
                          <mat-label>🔐 Bearer Token</mat-label>
                          <input matInput [(ngModel)]="playgroundToken" placeholder="eyJhbGciOiJIUzI1NiIs..." />
                        </mat-form-field>
                      }

                      @if (['POST','PUT','PATCH'].includes(selectedEndpoint()!.http_method)) {
                        <div class="body-section">
                          <label class="field-label">Request Body (JSON)</label>
                          <textarea
                            class="json-editor"
                            [(ngModel)]="playgroundBody"
                            rows="10"
                            placeholder='{ "key": "value" }'
                            spellcheck="false">
                          </textarea>
                        </div>
                      }

                      <button mat-flat-button color="primary" class="execute-btn"
                        (click)="executeRequest()" [disabled]="executing()">
                        @if (executing()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:8px" /> }
                        ▶ Execute
                      </button>
                    </div>

                    <!-- Response side -->
                    <div class="response-panel">
                      <h3>Response</h3>
                      @if (!playgroundResponse() && !playgroundError()) {
                        <div class="response-empty">
                          <p>Hit Execute to see the response</p>
                        </div>
                      }
                      @if (playgroundError()) {
                        <div class="response-error">
                          <p>{{ playgroundError() }}</p>
                        </div>
                      }
                      @if (playgroundResponse()) {
                        <div class="response-meta">
                          <span [class]="'status-badge status-' + statusClass(playgroundResponse()!.status_code)">
                            {{ playgroundResponse()!.status_code }}
                          </span>
                          <span class="elapsed">{{ playgroundResponse()!.elapsed_ms }}ms</span>
                        </div>
                        <label class="field-label">Response Body</label>
                        <pre class="response-body">{{ playgroundResponse()!.body | json }}</pre>
                      }
                    </div>

                  </div>
                </div>
              </mat-tab>

              <!-- ===== EXPORT TAB ===== -->
              <mat-tab label="📤 Export">
                <div class="tab-content export-tab">
                  <h3>OpenAPI 3.0 Specification</h3>
                  <p class="muted">Download the full OpenAPI 3.0 YAML spec for this project. Import it into Postman, Insomnia, or Swagger UI.</p>

                  <div class="export-actions">
                    <button mat-flat-button color="primary" (click)="downloadYaml()" [disabled]="downloading()">
                      @if (downloading()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:8px" /> }
                      ⬇ Download openapi.yaml
                    </button>
                    <button mat-stroked-button (click)="previewJson()" [disabled]="previewing()">
                      @if (previewing()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:8px" /> }
                      👁 Preview JSON
                    </button>
                  </div>

                  @if (openapiPreview()) {
                    <div class="preview-section">
                      <div class="preview-header">
                        <label class="field-label">OpenAPI JSON Preview</label>
                        <button mat-icon-button (click)="copyPreview()"><mat-icon>content_copy</mat-icon></button>
                      </div>
                      <pre class="response-body preview-body">{{ openapiPreview() | json }}</pre>
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- ===== AI ASSISTANT TAB ===== -->
              <mat-tab label="🤖 AI Assistant">
                <div class="tab-content ai-tab">
                  <div class="ai-layout">

                    <!-- Suggested questions -->
                    <div class="suggestions">
                      @for (q of SUGGESTED; track q) {
                        <button class="suggestion-chip" (click)="sendMessage(q)">{{ q }}</button>
                      }
                    </div>

                    <!-- Messages -->
                    <div class="chat-messages">
                      @if (chatMessages().length === 0 && !chatLoading()) {
                        <div class="chat-empty">
                          <span class="chat-bot-icon">🤖</span>
                          <p>Hello! I'm your AI assistant for <strong>{{ project()!.name }}</strong>.</p>
                          <p class="muted">Ask me anything about this API — endpoints, authentication, code examples, or test cases.</p>
                        </div>
                      }
                      @for (msg of chatMessages(); track msg.id) {
                        <div [class]="'chat-msg chat-msg-' + msg.role">
                          <span class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</span>
                          <div class="msg-bubble">
                            <pre class="msg-content">{{ msg.content }}</pre>
                          </div>
                        </div>
                      }
                      @if (chatLoading()) {
                        <div class="chat-msg chat-msg-assistant">
                          <span class="msg-avatar">🤖</span>
                          <div class="msg-bubble typing">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Input -->
                    <div class="chat-input-row">
                      <textarea
                        class="chat-input"
                        [(ngModel)]="chatInput"
                        (keydown)="onChatKeydown($event)"
                        placeholder="Ask anything about this API... (Enter to send)"
                        rows="2"
                        [disabled]="chatLoading()"
                      ></textarea>
                      <div class="chat-actions">
                        <button mat-flat-button color="primary" (click)="sendMessage()" [disabled]="chatLoading() || !chatInput.trim()">
                          @if (chatLoading()) { <mat-spinner diameter="16" /> } @else { Send }
                        </button>
                        <button mat-icon-button (click)="clearChat()" matTooltip="Clear history"><mat-icon>delete_outline</mat-icon></button>
                      </div>
                    </div>

                  </div>
                </div>
              </mat-tab>

              <!-- ===== TESTS TAB ===== -->
              <mat-tab label="🧪 Tests">
                <div class="tab-content tests-tab">
                  <h3>Test Generation</h3>
                  <p class="muted">Generate test suites for this API using AI. Choose a format and click Generate.</p>

                  <div class="tests-controls">
                    <mat-form-field appearance="outline">
                      <mat-label>Format</mat-label>
                      <mat-select [(ngModel)]="testFormat">
                        <mat-option value="junit">JUnit 5 (Java)</mat-option>
                        <mat-option value="pytest">pytest (Python)</mat-option>
                        <mat-option value="postman">Postman Collection</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="generateTests()" [disabled]="testGenerating()">
                      @if (testGenerating()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:8px" /> }
                      ⚡ Generate
                    </button>
                  </div>

                  @if (testSuites().length > 0) {
                    <h3 style="margin-top:28px">Generated Suites</h3>
                    <div class="suite-list">
                      @for (suite of testSuites(); track suite.id) {
                        <div class="suite-card" [class.active]="selectedSuite()?.id === suite.id" (click)="selectSuite(suite)">
                          <div class="suite-info">
                            <span class="suite-badge suite-{{ suite.format }}">{{ suite.format }}</span>
                            <span class="suite-date">{{ suite.created_at | date:'MMM d, HH:mm' }}</span>
                          </div>
                          <button mat-icon-button (click)="downloadSuite(suite, $event)" matTooltip="Download">
                            <mat-icon>download</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }

                  @if (selectedSuite()) {
                    <div class="suite-preview">
                      <div class="preview-header">
                        <label class="field-label">{{ selectedSuite()!.format }} — Preview</label>
                        <button mat-icon-button (click)="copySuite()" matTooltip="Copy"><mat-icon>content_copy</mat-icon></button>
                      </div>
                      <pre class="response-body suite-code">{{ selectedSuiteContent() }}</pre>
                    </div>
                  }
                </div>
              </mat-tab>

            </mat-tab-group>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    mat-toolbar { position:sticky; top:0; z-index:100; }
    .brand { font-size:18px; font-weight:700; margin-left:8px; }
    .project-name { font-size:14px; opacity:0.7; margin-left:8px; }
    .spacer { flex:1; }
    .user-name { margin-right:12px; font-size:14px; opacity:0.9; }
    .center { display:flex; justify-content:center; padding:80px; }

    /* Progress */
    .progress-container { display:flex; justify-content:center; padding:60px 24px; }
    .progress-card { width:480px; padding:24px; }
    .error-card { border-left:4px solid #d32f2f; }
    .progress-steps { display:flex; flex-direction:column; gap:10px; margin:20px 0; }
    .step { font-size:14px; padding:8px 12px; border-radius:6px; }
    .step.done { color:#2e7d32; background:#e8f5e9; }
    .step.active { color:#e65100; background:#fff3e0; font-weight:500; }
    .step.pending { color:#999; background:#f5f5f5; }
    .spinner { margin:20px auto; }
    .hint { text-align:center; color:#999; font-size:12px; }

    /* Layout */
    .explorer-layout { display:flex; height:calc(100vh - 64px); overflow:hidden; }

    /* Sidebar */
    .sidebar { width:280px; min-width:280px; border-right:1px solid #e0e0e0; overflow-y:auto; background:#fafafa; display:flex; flex-direction:column; }
    .sidebar-header { padding:14px 16px; }
    .project-title { font-size:15px; font-weight:600; margin-bottom:4px; }
    .project-stats { display:flex; gap:12px; font-size:12px; color:#888; }
    .method-counts { padding:10px 16px; display:flex; flex-direction:column; gap:5px; }
    .method-row { display:flex; align-items:center; gap:8px; font-size:13px; }
    .count { color:#666; font-weight:500; }
    .endpoint-list { flex:1; padding:4px 0; }
    .endpoint-item { display:flex; align-items:center; gap:8px; padding:7px 16px; cursor:pointer; font-size:12px; transition:background 0.1s; }
    .endpoint-item:hover { background:#efefef; }
    .endpoint-item.active { background:#e3f2fd; border-right:3px solid #1a73e8; }
    .ep-path { font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    /* Badges */
    .badge { display:inline-block; padding:2px 5px; border-radius:3px; font-size:10px; font-weight:700; min-width:48px; text-align:center; }
    .badge-lg { display:inline-block; padding:4px 10px; border-radius:4px; font-size:13px; font-weight:700; min-width:60px; text-align:center; }
    .badge-get, .badge-lg.badge-get { background:#e3f2fd; color:#1565c0; }
    .badge-post, .badge-lg.badge-post { background:#e8f5e9; color:#2e7d32; }
    .badge-put, .badge-lg.badge-put { background:#fff3e0; color:#e65100; }
    .badge-delete, .badge-lg.badge-delete { background:#ffebee; color:#c62828; }
    .badge-patch, .badge-lg.badge-patch { background:#f3e5f5; color:#6a1b9a; }

    /* Main panel */
    .main-panel { flex:1; overflow:hidden; display:flex; flex-direction:column; }
    .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#ccc; gap:12px; }
    .empty-state mat-icon { font-size:56px; width:56px; height:56px; }
    .detail-tabs { flex:1; overflow:hidden; }
    .tab-content { padding:28px 32px; overflow-y:auto; height:calc(100vh - 160px); }

    /* Docs tab */
    .detail-header { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
    .detail-path { font-family:monospace; font-size:20px; font-weight:600; }
    .detail-meta { display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; margin-bottom:28px; }
    .meta-item { display:flex; flex-direction:column; gap:2px; font-size:13px; }
    .meta-label { font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; }
    .mono { font-family:monospace; font-size:12px; }
    h3 { font-size:14px; font-weight:600; margin:0 0 12px; color:#333; }
    .params-table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px; }
    .params-table th { text-align:left; padding:8px 12px; background:#f5f5f5; border-bottom:2px solid #e0e0e0; font-weight:600; font-size:12px; }
    .params-table td { padding:8px 12px; border-bottom:1px solid #f0f0f0; }
    .param-in { background:#f0f0f0; padding:2px 7px; border-radius:10px; font-size:11px; }
    code { background:#f5f5f5; padding:2px 5px; border-radius:3px; font-size:12px; font-family:monospace; }
    .muted { color:#999; font-size:13px; }

    /* Playground tab */
    .playground { padding:24px 28px; }
    .playground-layout { display:grid; grid-template-columns:1fr 1fr; gap:28px; height:100%; }
    .request-panel, .response-panel { display:flex; flex-direction:column; gap:12px; }
    .url-row { display:flex; align-items:center; gap:10px; }
    .url-field { flex:1; }
    .full-url { font-size:12px; margin-top:-8px; }
    .full-url code { font-size:12px; }
    .full-width { width:100%; }
    .mt { margin-top:4px; }
    .field-label { font-size:12px; color:#666; font-weight:500; display:block; margin-bottom:6px; }
    .body-section { display:flex; flex-direction:column; }
    .json-editor { width:100%; font-family:monospace; font-size:13px; padding:12px; border:1px solid #ddd; border-radius:6px; resize:vertical; background:#fafafa; outline:none; line-height:1.5; }
    .json-editor:focus { border-color:#1a73e8; background:#fff; }
    .execute-btn { height:42px; margin-top:4px; }
    .response-empty { display:flex; align-items:center; justify-content:center; height:200px; color:#ccc; border:2px dashed #eee; border-radius:8px; }
    .response-error { padding:16px; background:#ffebee; border-radius:6px; color:#c62828; font-size:13px; }
    .response-meta { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
    .status-badge { padding:4px 10px; border-radius:4px; font-weight:700; font-size:13px; }
    .status-2xx { background:#e8f5e9; color:#2e7d32; }
    .status-4xx { background:#fff3e0; color:#e65100; }
    .status-5xx { background:#ffebee; color:#c62828; }
    .elapsed { font-size:12px; color:#888; }
    .response-body { background:#1e1e1e; color:#d4d4d4; padding:16px; border-radius:6px; font-size:12px; font-family:monospace; overflow:auto; max-height:400px; white-space:pre-wrap; word-break:break-all; }

    /* Export tab */
    .export-tab { max-width:700px; }
    .export-actions { display:flex; gap:12px; margin:20px 0; }
    .preview-section { margin-top:8px; }
    .preview-header { display:flex; align-items:center; justify-content:space-between; }
    .preview-body { max-height:500px; }

    /* AI tab */
    .ai-tab { padding:0 !important; height:calc(100vh - 160px); }
    .ai-layout { display:flex; flex-direction:column; height:100%; }
    .suggestions { display:flex; flex-wrap:wrap; gap:8px; padding:16px 20px 8px; border-bottom:1px solid #f0f0f0; }
    .suggestion-chip { background:#f0f4ff; border:1px solid #c5d0f5; color:#3d5afe; border-radius:16px; padding:5px 12px; font-size:12px; cursor:pointer; transition:background 0.15s; white-space:nowrap; }
    .suggestion-chip:hover { background:#dce4ff; }
    .chat-messages { flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-direction:column; gap:16px; }
    .chat-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; color:#666; gap:8px; }
    .chat-bot-icon { font-size:40px; }
    .chat-msg { display:flex; gap:10px; align-items:flex-start; }
    .chat-msg-user { flex-direction:row-reverse; }
    .msg-avatar { font-size:20px; flex-shrink:0; margin-top:2px; }
    .msg-bubble { max-width:75%; padding:10px 14px; border-radius:12px; font-size:13px; line-height:1.6; }
    .chat-msg-user .msg-bubble { background:#1a73e8; color:#fff; border-bottom-right-radius:3px; }
    .chat-msg-assistant .msg-bubble { background:#f5f5f5; color:#1a1a1a; border-bottom-left-radius:3px; }
    .msg-content { margin:0; white-space:pre-wrap; word-break:break-word; font-family:inherit; font-size:13px; }
    .chat-msg-user .msg-content { color:#fff; }
    .typing { display:flex; gap:4px; align-items:center; padding:12px 16px !important; }
    .typing span { width:7px; height:7px; background:#999; border-radius:50%; animation:bounce 1.2s infinite; }
    .typing span:nth-child(2) { animation-delay:0.2s; }
    .typing span:nth-child(3) { animation-delay:0.4s; }
    @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-6px); } }
    .chat-input-row { display:flex; gap:8px; padding:12px 20px; border-top:1px solid #e0e0e0; align-items:flex-end; background:#fff; }
    .chat-input { flex:1; font-family:inherit; font-size:13px; padding:10px 12px; border:1px solid #ddd; border-radius:8px; resize:none; outline:none; line-height:1.5; }
    .chat-input:focus { border-color:#1a73e8; }
    .chat-actions { display:flex; flex-direction:column; gap:4px; }

    /* Tests tab */
    .tests-tab { max-width:800px; }
    .tests-controls { display:flex; align-items:center; gap:16px; margin:16px 0; }
    .tests-controls mat-form-field { width:220px; }
    .suite-list { display:flex; flex-direction:column; gap:8px; margin-bottom:20px; }
    .suite-card { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border:1px solid #e0e0e0; border-radius:8px; cursor:pointer; transition:background 0.1s; }
    .suite-card:hover { background:#f5f5f5; }
    .suite-card.active { background:#e3f2fd; border-color:#1a73e8; }
    .suite-info { display:flex; align-items:center; gap:12px; }
    .suite-badge { padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase; }
    .suite-junit { background:#fff3e0; color:#e65100; }
    .suite-pytest { background:#e8f5e9; color:#2e7d32; }
    .suite-postman { background:#fce4ec; color:#c62828; }
    .suite-date { font-size:12px; color:#888; }
    .suite-preview { margin-top:8px; }
    .suite-code { max-height:500px; }

    /* Shared empty state */
    .empty-state-inline { display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; color:#ccc; gap:12px; }
    .empty-state-inline mat-icon { font-size:48px; width:48px; height:48px; }
  `]
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  project = signal<Project | null>(null);
  endpoints = signal<Endpoint[]>([]);
  selectedEndpoint = signal<Endpoint | null>(null);
  methodCounts = signal<{ method: string; count: number }[]>([]);

  // Playground state
  playgroundBaseUrl = 'http://localhost:8080';
  playgroundToken = '';
  playgroundBody = '';
  executing = signal(false);
  playgroundResponse = signal<any>(null);
  playgroundError = signal('');

  // Export state
  downloading = signal(false);
  previewing = signal(false);
  openapiPreview = signal<any>(null);

  // AI chat state
  chatMessages = signal<ChatMessage[]>([]);
  chatInput = '';
  chatLoading = signal(false);
  readonly SUGGESTED = [
    'How do I authenticate with this API?',
    'What endpoints are available?',
    'Generate a curl example for the first POST endpoint.',
    'What fields are required for creating a resource?',
  ];

  // Test generation state
  testFormat = 'pytest';
  testGenerating = signal(false);
  testSuites = signal<TestSuite[]>([]);
  selectedSuite = signal<TestSuite | null>(null);
  selectedSuiteContent = signal('');

  private pollSub?: Subscription;
  private projectId = '';

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService,
    private projectsService: ProjectsService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id')!;
    this.loadProject();
  }

  loadProject() {
    this.projectsService.getById(this.projectId).subscribe(p => {
      this.project.set(p);
      if (p.status === 'ready') this.loadEndpoints();
      else if (p.status === 'analyzing' || p.status === 'pending') this.startPolling();
    });
  }

  startPolling() {
    this.pollSub = interval(3000).pipe(
      switchMap(() => this.projectsService.getById(this.projectId)),
      takeWhile(p => p.status === 'analyzing' || p.status === 'pending', true),
    ).subscribe(p => {
      this.project.set(p);
      if (p.status === 'ready') this.loadEndpoints();
    });
  }

  loadEndpoints() {
    this.projectsService.getEndpoints(this.projectId).subscribe(eps => {
      this.endpoints.set(eps);
      const counts: Record<string, number> = {};
      eps.forEach(e => counts[e.http_method] = (counts[e.http_method] || 0) + 1);
      this.methodCounts.set(Object.entries(counts).map(([method, count]) => ({ method, count })));
    });
    this.loadChatHistory();
    this.loadTestSuites();
  }

  selectEndpoint(ep: Endpoint) {
    this.selectedEndpoint.set(ep);
    this.playgroundResponse.set(null);
    this.playgroundError.set('');
    // Pre-fill body from body parameters
    const bodyParam = ep.parameters.find(p => p.param_type === 'body');
    this.playgroundBody = bodyParam ? `{\n  \n}` : '';
  }

  executeRequest() {
    const ep = this.selectedEndpoint()!;
    this.executing.set(true);
    this.playgroundResponse.set(null);
    this.playgroundError.set('');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.playgroundToken) headers['Authorization'] = `Bearer ${this.playgroundToken}`;

    let body = null;
    if (this.playgroundBody.trim()) {
      try { body = JSON.parse(this.playgroundBody); }
      catch { this.playgroundError.set('Invalid JSON in request body'); this.executing.set(false); return; }
    }

    const url = `${this.playgroundBaseUrl}${ep.path}`;
    this.projectsService.playground(this.projectId, ep.http_method, url, headers, body).subscribe({
      next: (res) => { this.playgroundResponse.set(res); this.executing.set(false); },
      error: (e) => { this.playgroundError.set(e.error?.detail || 'Request failed'); this.executing.set(false); },
    });
  }

  statusClass(code: number): string {
    if (code >= 200 && code < 300) return '2xx';
    if (code >= 400 && code < 500) return '4xx';
    return '5xx';
  }

  downloadYaml() {
    this.downloading.set(true);
    this.projectsService.downloadOpenapiYaml(this.projectId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.project()!.name}-openapi.yaml`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => { this.snackBar.open('Download failed', 'Close', { duration: 3000 }); this.downloading.set(false); },
    });
  }

  previewJson() {
    this.previewing.set(true);
    this.projectsService.getOpenapiJson(this.projectId).subscribe({
      next: (spec) => { this.openapiPreview.set(spec); this.previewing.set(false); },
      error: () => { this.snackBar.open('Preview failed', 'Close', { duration: 3000 }); this.previewing.set(false); },
    });
  }

  copyPreview() {
    navigator.clipboard.writeText(JSON.stringify(this.openapiPreview(), null, 2));
    this.snackBar.open('Copied to clipboard', '', { duration: 2000 });
  }

  loadChatHistory() {
    this.projectsService.getChatHistory(this.projectId).subscribe({
      next: (msgs) => this.chatMessages.set(msgs),
      error: () => {},
    });
  }

  sendMessage(text?: string) {
    const message = (text || this.chatInput).trim();
    if (!message || this.chatLoading()) return;
    this.chatInput = '';
    this.chatLoading.set(true);

    // Optimistically add user message
    this.chatMessages.update(msgs => [...msgs, { id: Date.now().toString(), role: 'user', content: message }]);

    this.projectsService.chat(this.projectId, message).subscribe({
      next: (res) => {
        this.chatMessages.update(msgs => [...msgs, { id: (Date.now() + 1).toString(), role: 'assistant', content: res.content }]);
        this.chatLoading.set(false);
        setTimeout(() => this.scrollChat(), 50);
      },
      error: () => {
        this.chatMessages.update(msgs => [...msgs, { id: (Date.now() + 1).toString(), role: 'assistant', content: '⚠️ Failed to get a response. Check your Groq API key.' }]);
        this.chatLoading.set(false);
      },
    });
  }

  clearChat() {
    this.projectsService.clearChatHistory(this.projectId).subscribe(() => this.chatMessages.set([]));
  }

  scrollChat() {
    const el = document.querySelector('.chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  onChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  loadTestSuites() {
    this.projectsService.listTestSuites(this.projectId).subscribe({
      next: (suites) => this.testSuites.set(suites),
      error: () => {},
    });
  }

  generateTests() {
    this.testGenerating.set(true);
    this.projectsService.generateTests(this.projectId, this.testFormat).subscribe({
      next: () => {
        this.testGenerating.set(false);
        this.loadTestSuites();
        this.snackBar.open('Tests generated!', '', { duration: 2500 });
      },
      error: () => {
        this.testGenerating.set(false);
        this.snackBar.open('Generation failed', 'Close', { duration: 3000 });
      },
    });
  }

  selectSuite(suite: TestSuite) {
    if (this.selectedSuite()?.id === suite.id) { this.selectedSuite.set(null); return; }
    this.selectedSuite.set(suite);
    this.projectsService.downloadTestSuite(this.projectId, suite.id).subscribe({
      next: (content) => this.selectedSuiteContent.set(content),
      error: () => this.snackBar.open('Failed to load suite', 'Close', { duration: 3000 }),
    });
  }

  downloadSuite(suite: TestSuite, event: Event) {
    event.stopPropagation();
    this.projectsService.downloadTestSuite(this.projectId, suite.id).subscribe({
      next: (content) => {
        const ext = suite.format === 'junit' ? 'java' : suite.format === 'pytest' ? 'py' : 'json';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `tests-${suite.format}.${ext}`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Close', { duration: 3000 }),
    });
  }

  copySuite() {
    navigator.clipboard.writeText(this.selectedSuiteContent());
    this.snackBar.open('Copied to clipboard', '', { duration: 2000 });
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); }
}
