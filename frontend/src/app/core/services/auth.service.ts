import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User, AuthTokens } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:8000';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    if (token) this.loadMe();
  }

  register(email: string, full_name: string, password: string) {
    return this.http.post<User>(`${this.API}/auth/register`, { email, full_name, password });
  }

  login(email: string, password: string) {
    return this.http.post<AuthTokens>(`${this.API}/auth/login`, { email, password }).pipe(
      tap(tokens => {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        this.loadMe();
      })
    );
  }

  loadMe() {
    this.http.get<User>(`${this.API}/auth/me`).subscribe({
      next: user => this.currentUser.set(user),
      error: () => this.logout(),
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
