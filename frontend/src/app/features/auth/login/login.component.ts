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
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>
            <span class="logo">⚡ API Doc AI</span>
          </mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="you@example.com" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            @if (error) {
              <p class="error-msg">{{ error }}</p>
            }
            <button mat-flat-button color="primary" class="full-width submit-btn" type="submit" [disabled]="loading">
              @if (loading) { <mat-spinner diameter="20" /> } @else { Sign In }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p class="register-link">Don't have an account? <a routerLink="/register">Register</a></p>
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
    .error-msg { color:#d32f2f; font-size:13px; margin-bottom:8px; }
    .register-link { text-align:center; font-size:13px; }
    .register-link a { color:#1a73e8; text-decoration:none; }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => { this.error = e.error?.detail || 'Login failed'; this.loading = false; },
    });
  }
}
