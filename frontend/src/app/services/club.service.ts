import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClubApplication, ClubMember, ClubStatus, DashboardStats } from '../models/club.model';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  // Seamlessly adapt between ng serve (port 4200) and Express server (port 3000)
  private apiUrl: string = (typeof window !== 'undefined' && window.location.port === '4200')
    ? 'http://localhost:3000/api'
    : '/api';

  constructor(private http: HttpClient) {}

  submitClub(club: ClubApplication): Observable<{ success: boolean; message: string; tracking_code: string; club: ClubApplication }> {
    return this.http.post<{ success: boolean; message: string; tracking_code: string; club: ClubApplication }>(
      `${this.apiUrl}/clubs`,
      club
    );
  }

  getClubs(status?: string, typology?: string, q?: string): Observable<ClubApplication[]> {
    let params = new HttpParams();
    if (status && status !== 'ALL') params = params.set('status', status);
    if (typology && typology !== 'ALL') params = params.set('typology', typology);
    if (q && q.trim()) params = params.set('q', q.trim());

    return this.http.get<ClubApplication[]>(`${this.apiUrl}/clubs`, { params });
  }

  getClubById(id: number): Observable<ClubApplication> {
    return this.http.get<ClubApplication>(`${this.apiUrl}/clubs/${id}`);
  }

  trackClub(code: string): Observable<ClubApplication> {
    return this.http.get<ClubApplication>(`${this.apiUrl}/clubs/track/${encodeURIComponent(code)}`);
  }

  updateStatus(id: number, status: ClubStatus, admin_notes: string, reviewed_by: string): Observable<{ success: boolean; club: ClubApplication }> {
    return this.http.patch<{ success: boolean; club: ClubApplication }>(
      `${this.apiUrl}/clubs/${id}/status`,
      { status, admin_notes, reviewed_by }
    );
  }

  updateClub(id: number, club: Partial<ClubApplication>): Observable<{ success: boolean; message: string; club: ClubApplication }> {
    return this.http.put<{ success: boolean; message: string; club: ClubApplication }>(
      `${this.apiUrl}/clubs/${id}`,
      club
    );
  }

  deleteClub(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/clubs/${id}`);
  }

  addMember(clubId: number, member: Partial<ClubMember>): Observable<{ success: boolean; message: string; member: ClubMember; total_members: number }> {
    return this.http.post<{ success: boolean; message: string; member: ClubMember; total_members: number }>(
      `${this.apiUrl}/clubs/${clubId}/members`,
      member
    );
  }

  getMembers(clubId: number): Observable<ClubMember[]> {
    return this.http.get<ClubMember[]>(`${this.apiUrl}/clubs/${clubId}/members`);
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  uploadLogo(file: File): Observable<{ success: boolean; url: string; filename: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ success: boolean; url: string; filename: string }>(
      `${this.apiUrl}/upload`,
      formData
    );
  }
}
