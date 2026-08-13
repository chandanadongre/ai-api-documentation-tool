import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectsService } from '../../core/services/projects.service';
import { Project } from '../../core/models/models';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-new-project-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatButtonToggleModule, MatProgressSpinnerModule],
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
          <mat-button-toggle value="upload">📁 Upload ZIP</mat-button-toggle>
        </mat-button-toggle-group>

        @if (form.value.source_type === 'github') {
          <mat-form-field appearance="outline" class="full-width mt">
            <mat-label>GitHub Repository URL</mat-label>
            <input matInput formControlName="github_url" placeholder="https://github.com/org/repo" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>GitHub Token (optional, for private repos)</mat-label>
            <input matInput formControlName="github_token" placeholder="ghp_xxxxxxxxxxxx" />
          </mat-form-field>
        } @else {
          <div class="upload-zone" (click)="fileInput.click()">
            @if (uploadedFile()) {
              <p>📄 {{ uploadedFile()!.name }}</p>
            } @else {
              <p>📁 Click to select a .zip file</p>
            }
            <input #fileInput type="file" accept=".zip" hidden (change)="onFileSelected($event)" />
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
    .source-toggle { width:100%; margin-bottom:12px; }
    .upload-zone { border:2px dashed #ccc; border-radius:8px; padding:32px; text-align:center; color:#999; margin-top:4px; cursor:pointer; transition:border-color 0.2s; }
    .upload-zone:hover { border-color:#1a73e8; color:#1a73e8; }
    .error-msg { color:#d32f2f; font-size:13px; margin-top:8px; }
    mat-dialog-content { min-width:460px; }
  `]
})
export class NewProjectDialogComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    source_type: ['github'],
    github_url: [''],
    github_token: [''],
  });
  loading = signal(false);
  error = signal('');
  uploadedFile = signal<File | null>(null);

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private dialogRef: MatDialogRef<NewProjectDialogComponent>,
    private router: Router,
  ) {}

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadedFile.set(file);
  }

  submit() {
    if (this.form.invalid || !this.form.value.name) return;
    this.loading.set(true);
    this.error.set('');

    const { name, description, source_type, github_url, github_token } = this.form.value;
    const isGithub = source_type === 'github';

    this.projectsService.create({
      name: name!,
      description: description || undefined,
      source_type: source_type as 'github' | 'upload',
      github_url: github_url || undefined,
    }).pipe(
      switchMap((project: Project) => {
        // Immediately trigger analysis after project creation
        if (isGithub && github_url) {
          return this.projectsService.analyzeGithub(project.id, github_url, github_token || undefined)
            .pipe(switchMap(() => of(project)));
        } else if (!isGithub && this.uploadedFile()) {
          return this.projectsService.analyzeUpload(project.id, this.uploadedFile()!)
            .pipe(switchMap(() => of(project)));
        }
        return of(project);
      })
    ).subscribe({
      next: (project: Project) => {
        this.loading.set(false);
        this.dialogRef.close(true);
        this.router.navigate(['/projects', project.id]);
      },
      error: (e) => {
        this.error.set(e.error?.detail || 'Failed to create or analyze project');
        this.loading.set(false);
      },
    });
  }
}
