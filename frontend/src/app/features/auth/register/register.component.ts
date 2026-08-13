import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title><span class="logo">⚡ API Doc AI</span></mat-card-title>
          <mat-card-subtitle>Create your account</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            @if (error) { <p class="error-msg">{{ error }}</p> }
            @if (success) { <p class="success-msg">Account created! <a routerLink="/login">Sign in</a></p> }
            <button mat-flat-button color="primary" class="full-width submit-btn" type="submit" [disabled]="loading || success">
              @if (loading) { <mat-spinner diameter="20" /> } @else { Create Account }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p class="login-link">Already have an account? <a routerLink="/login">Sign in</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f5f5f5; }
    .auth-card { width:400px; padding:24px; }
    .logo { font-size:22px; font-weight:700; color:#1a73e8; }
    .full-width { width:100%; margin-bottom:12px; }
    .submit-btn { margin-top:8px; height:44px; }
    .error-msg { color:#d32f2f; font-size:13px; }
    .success-msg { color:#2e7d32; font-size:13px; }
    .success-msg a, .login-link a { color:#1a73e8; text-decoration:none; }
    .login-link { text-align:center; font-size:13px; }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  loading = false;
  error = '';
  success = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, full_name, password } = this.form.value;
    this.auth.register(email!, full_name!, password!).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (e) => { this.error = e.error?.detail || 'Registration failed'; this.loading = false; },
    });
  }
}
