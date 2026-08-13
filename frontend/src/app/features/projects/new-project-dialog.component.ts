import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectsService } from '../../core/services/projects.service';

@Component({
  selector: 'app-new-project-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatButtonToggleModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Create New Project</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" placeholder="payment-service" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>

        <label class="source-label">Source</label>
        <mat-button-toggle-group formControlName="source_type" class="source-toggle">
          <mat-button-toggle value="github">🔗 GitHub URL</mat-button-toggle>
          <mat-button-toggle value="upload">📁 Upload Files</mat-button-toggle>
        </mat-button-toggle-group>

        @if (form.value.source_type === 'github') {
          <mat-form-field appearance="outline" class="full-width mt">
            <mat-label>GitHub Repository URL</mat-label>
            <input matInput formControlName="github_url" placeholder="https://github.com/org/repo" />
          </mat-form-field>
        } @else {
          <div class="upload-zone">
            <p>📁 File upload support coming in Phase 2</p>
          </div>
        }

        @if (error()) { <p class="error-msg">{{ error() }}</p> }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="loading()">
        @if (loading()) { <mat-spinner diameter="18" /> } @else { Analyze }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width:100%; }
    .mt { margin-top:12px; }
    .source-label { font-size:13px; color:#666; display:block; margin-bottom:8px; }
    .source-toggle { width:100%; margin-bottom:4px; }
    .upload-zone { border:2px dashed #ccc; border-radius:8px; padding:32px; text-align:center; color:#999; margin-top:12px; }
    .error-msg { color:#d32f2f; font-size:13px; }
    mat-dialog-content { min-width:460px; }
  `]
})
export class NewProjectDialogComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    source_type: ['github'],
    github_url: [''],
  });
  loading = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private projectsService: ProjectsService, private dialogRef: MatDialogRef<NewProjectDialogComponent>) {}

  submit() {
    if (this.form.invalid || !this.form.value.name) return;
    this.loading.set(true);
    this.error.set('');
    const { name, description, source_type, github_url } = this.form.value;
    this.projectsService.create({ name: name!, description: description || undefined, source_type: source_type as 'github' | 'upload', github_url: github_url || undefined }).subscribe({
      next: () => { this.loading.set(false); this.dialogRef.close(true); },
      error: (e) => { this.error.set(e.error?.detail || 'Failed to create project'); this.loading.set(false); },
    });
  }
}
