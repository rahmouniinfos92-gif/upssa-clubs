import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubService } from '../../services/club.service';
import { PdfService } from '../../services/pdf.service';
import { ClubApplication } from '../../models/club.model';

@Component({
  selector: 'app-club-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="tracking-page">
      <div class="container">

        <!-- Search Bar Header -->
        <div class="search-header card">
          <div class="search-info">
            <span class="sub-badge">Espace Candidat</span>
            <h1 class="page-title">Suivi de Demande de Création</h1>
            <p class="page-desc">
              Saisissez votre référence de dossier (ex: <code>CLUB-2026-SP01</code>) pour consulter le statut d'instruction par la Commission de la Vie Étudiante.
            </p>
          </div>

          <form (submit)="searchTracking()" class="search-form">
            <div class="search-input-wrap">
              <input 
                type="text" 
                class="form-control search-input" 
                placeholder="Ex: CLUB-2026-XXXX" 
                [(ngModel)]="searchCode" 
                name="searchCode"
                required
              >
              <button type="submit" class="btn btn-primary search-btn" [disabled]="loading">
                <span *ngIf="!loading">🔍 Rechercher</span>
                <span *ngIf="loading">Recherche...</span>
              </button>
            </div>
            
            <div class="quick-examples">
              <span class="quick-label">Dossiers démos à tester :</span>
              <button type="button" class="quick-tag" (click)="quickSearch('CLUB-2026-SP01')">CLUB-2026-SP01 (Club Sport)</button>
              <button type="button" class="quick-tag" (click)="quickSearch('CLUB-2026-SC03')">CLUB-2026-SC03 (Club Scientifique)</button>
              <button type="button" class="quick-tag" (click)="quickSearch('CLUB-2026-SY05')">CLUB-2026-SY05 (Club Synapse)</button>
            </div>
          </form>
        </div>

        <!-- ERROR MESSAGE -->
        <div *ngIf="errorMessage" class="alert alert-danger mt-4">
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- CLUB DETAILS VIEW -->
        <div *ngIf="club" class="club-detail-container mt-4">

          <!-- STATUS PIPELINE CARD -->
          <div class="card status-overview-card">
            <div class="status-top-row">
              <div class="club-identity-snippet">
                <div class="club-logo-thumb" *ngIf="club.logo_url">
                  <img [src]="club.logo_url" alt="Logo {{ club.official_name }}">
                </div>
                <div>
                  <div class="tracking-pill">{{ club.tracking_code }}</div>
                  <h2 class="club-headline">{{ club.official_name }}</h2>
                  <div class="club-meta-sub">
                    <span class="typology-tag">{{ club.typology }}</span>
                    <span *ngIf="club.acronym" class="acronym-tag">({{ club.acronym }})</span>
                  </div>
                </div>
              </div>

              <div class="status-badge-wrap">
                <span class="badge" [ngClass]="'badge-' + club.status">
                  {{ getStatusLabel(club.status) }}
                </span>
                <button type="button" class="btn btn-primary btn-sm" (click)="downloadReceiptPdf()" [disabled]="isDownloadingPdf" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                  <span *ngIf="!isDownloadingPdf">📄 Télécharger Récépissé (PDF)</span>
                  <span *ngIf="isDownloadingPdf">⏳ En cours...</span>
                </button>
                <button type="button" class="btn btn-outline btn-sm print-btn" (click)="printPage()">
                  🖨️ Imprimer
                </button>
              </div>
            </div>

            <!-- STATUS PROGRESS BAR -->
            <div class="progress-pipeline">
              <div class="pipeline-step" [class.done]="isStepDone(1)">
                <div class="step-dot">1</div>
                <div class="step-label">Dossier Soumis</div>
                <div class="step-date">{{ club.submission_date }}</div>
              </div>
              <div class="pipeline-connector" [class.done]="isStepDone(2)"></div>
              <div class="pipeline-step" [class.done]="isStepDone(2)" [class.current]="club.status === 'EN_COURS_DE_REVUE'">
                <div class="step-dot">2</div>
                <div class="step-label">Commission d'Instruction</div>
                <div class="step-date" *ngIf="isStepDone(2)">En cours d'examen</div>
              </div>
              <div class="pipeline-connector" [class.done]="isStepDone(3)"></div>
              <div class="pipeline-step" [class.done]="isStepDone(3)" [class.approved]="club.status === 'APPROUVE'" [class.rejected]="club.status === 'REFUSE'" [class.changes]="club.status === 'RETOUCHE_DEMANDEE'">
                <div class="step-dot">3</div>
                <div class="step-label">Décision Finale</div>
                <div class="step-date" *ngIf="club.reviewed_at">{{ club.reviewed_at }}</div>
              </div>
            </div>

            <!-- COMMISSION NOTES / FEEDBACK -->
            <div *ngIf="club.admin_notes || club.status === 'APPROUVE'" class="commission-notice" [ngClass]="'notice-' + club.status">
              <div class="notice-header">
                <strong>🏛️ Avis & Décision de la Commission</strong>
                <span *ngIf="club.reviewed_by" class="notice-author">Par {{ club.reviewed_by }}</span>
              </div>
              <p class="notice-body">
                {{ club.admin_notes || 'Votre dossier a été validé favorablement. Le club est officiellement habilité à démarrer ses activités pour cette année universitaire.' }}
              </p>
            </div>
          </div>

          <!-- DOSSIER DETAILS GRID -->
          <div class="dossier-grid mt-4">

            <!-- 1. BUREAU EXÉCUTIF -->
            <div class="card dossier-card">
              <h3 class="card-section-title">👥 Bureau Exécutif & Parrainage</h3>
              <div class="member-list">
                <div class="member-item highlight">
                  <div class="member-role">Président(e)</div>
                  <div class="member-name">{{ club.president_name }}</div>
                  <div class="member-filiere">{{ club.president_filiere }}</div>
                  <div class="member-contact">📧 {{ club.president_email }} | 📞 {{ club.president_phone }}</div>
                </div>

                <div class="member-item" *ngIf="club.vp_name">
                  <div class="member-role">Vice-Président(e)</div>
                  <div class="member-name">{{ club.vp_name }}</div>
                  <div class="member-filiere">{{ club.vp_filiere }}</div>
                  <div class="member-contact">{{ club.vp_contact }}</div>
                </div>

                <div class="member-item" *ngIf="club.sg_name">
                  <div class="member-role">Secrétaire Général(e)</div>
                  <div class="member-name">{{ club.sg_name }}</div>
                  <div class="member-filiere">{{ club.sg_filiere }}</div>
                  <div class="member-contact">{{ club.sg_contact }}</div>
                </div>

                <div class="member-item" *ngIf="club.treasurer_name">
                  <div class="member-role">Trésorier(ère)</div>
                  <div class="member-name">{{ club.treasurer_name }}</div>
                  <div class="member-filiere">{{ club.treasurer_filiere }}</div>
                  <div class="member-contact">{{ club.treasurer_contact }}</div>
                </div>

                <div class="member-item" *ngIf="club.comm_lead_name">
                  <div class="member-role">Resp. Communication</div>
                  <div class="member-name">{{ club.comm_lead_name }}</div>
                  <div class="member-filiere">{{ club.comm_lead_filiere }}</div>
                  <div class="member-contact">{{ club.comm_lead_contact }}</div>
                </div>
              </div>

              <!-- FACULTY ADVISOR -->
              <div class="advisor-banner mt-3" *ngIf="club.faculty_advisor_name">
                <div class="advisor-label">Parrain / Tuteur pédagogique (Faculty Advisor) :</div>
                <div class="advisor-val"><strong>{{ club.faculty_advisor_name }}</strong></div>
                <div class="advisor-accord">Accord de principe : <span class="tag-accord" [class.yes]="club.advisor_agreement === 'Oui'">{{ club.advisor_agreement }}</span></div>
              </div>
            </div>

            <!-- 2. VISION & OBJECTIFS -->
            <div class="card dossier-card">
              <h3 class="card-section-title">🎯 Vision, Objectifs & Impact</h3>

              <div class="detail-block">
                <span class="detail-label">Mission Principale</span>
                <p class="detail-text">{{ club.main_mission }}</p>
              </div>

              <div class="detail-block">
                <span class="detail-label">Objectifs Mesurables pour l'Année</span>
                <p class="detail-text whitespace-pre">{{ club.measurable_objectives }}</p>
              </div>

              <div class="detail-block">
                <span class="detail-label">Valeur Ajoutée pour le Campus</span>
                <p class="detail-text">{{ club.campus_value_add }}</p>
              </div>

              <div class="detail-block">
                <span class="detail-label">Public Cible</span>
                <p class="detail-text">
                  {{ club.target_audience_type }}
                  <span *ngIf="club.target_audience_details"> ({{ club.target_audience_details }})</span>
                </p>
              </div>
            </div>

            <!-- 3. PLAN D'ACTION -->
            <div class="card dossier-card">
              <h3 class="card-section-title">📅 Plan d'Action & Réunions</h3>

              <div class="event-item" *ngIf="club.event1_title">
                <span class="event-pill">Semestre 1</span>
                <h4 class="event-name">{{ club.event1_title }}</h4>
                <p class="event-desc">{{ club.event1_description }}</p>
                <div class="event-sub-info">
                  <span *ngIf="club.event1_date">🗓️ Date : {{ club.event1_date }}</span>
                  <span *ngIf="club.event1_logistics">📦 Besoins : {{ club.event1_logistics }}</span>
                </div>
              </div>

              <div class="event-item mt-3" *ngIf="club.event2_title">
                <span class="event-pill s2">Semestre 2</span>
                <h4 class="event-name">{{ club.event2_title }}</h4>
                <p class="event-desc">{{ club.event2_description }}</p>
                <div class="event-sub-info">
                  <span *ngIf="club.event2_date">🗓️ Date : {{ club.event2_date }}</span>
                </div>
              </div>

              <div class="detail-block mt-3">
                <span class="detail-label">Rythme des Réunions Internes</span>
                <p class="detail-text">🔄 {{ club.meeting_frequency }}</p>
              </div>
            </div>

            <!-- 4. BUDGET & LOGISTIQUE -->
            <div class="card dossier-card">
              <h3 class="card-section-title">💰 Budget Prévisionnel & Espaces</h3>

              <div class="budget-stat-box">
                <span class="budget-num">{{ club.annual_budget_mad | number }} MAD</span>
                <span class="budget-lbl">Budget Annuel Global Estimé</span>
              </div>

              <div class="detail-block mt-3">
                <span class="detail-label">Sources de Financement Envisagées</span>
                <ul class="funding-chips-list">
                  <li *ngFor="let src of club.funding_sources" class="funding-chip">
                    ✓ {{ src }}
                  </li>
                </ul>
              </div>

              <div class="detail-block" *ngIf="club.facility_needs">
                <span class="detail-label">Besoins Matériels ou Espaces Permanents</span>
                <p class="detail-text">{{ club.facility_needs }}</p>
              </div>

              <div class="signature-block mt-3">
                <span class="detail-label">Déposé par :</span>
                <strong>{{ club.declarant_name }}</strong> le {{ club.submission_date }}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .tracking-page {
      padding: 2.5rem 0 4rem;
    }
    .search-header {
      padding: 2.25rem;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .page-desc {
      color: var(--text-muted);
      margin: 0.35rem 0 1.5rem;
    }
    .search-input-wrap {
      display: flex;
      gap: 0.75rem;
      max-width: 580px;
    }
    .search-input {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.15rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.8rem 1.1rem;
      border: 2px solid var(--border-color);
    }
    .search-btn {
      padding: 0.8rem 1.5rem;
      white-space: nowrap;
    }
    .quick-examples {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .quick-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .quick-tag {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 0.2rem 0.6rem;
      font-size: 0.78rem;
      font-family: 'JetBrains Mono', monospace;
      cursor: pointer;
      color: var(--primary);
      transition: all 0.15s;
    }
    .quick-tag:hover {
      background: var(--primary-light);
      border-color: var(--primary);
    }
    .status-overview-card {
      padding: 2rem;
    }
    .status-top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 1.5rem;
      gap: 1.5rem;
    }
    .club-identity-snippet {
      display: flex;
      gap: 1.25rem;
      align-items: center;
    }
    .club-logo-thumb {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      flex-shrink: 0;
    }
    .club-logo-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tracking-pill {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-light);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.35rem;
    }
    .club-headline {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .club-meta-sub {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.3rem;
    }
    .typology-tag {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .acronym-tag {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary);
    }
    .status-badge-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.65rem;
    }

    /* Pipeline */
    .progress-pipeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 2.25rem 0 1.5rem;
      padding: 0 1rem;
    }
    .pipeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 150px;
    }
    .step-dot {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.4rem;
      transition: all 0.3s;
    }
    .pipeline-step.done .step-dot {
      background: var(--success);
      color: #fff;
    }
    .pipeline-step.current .step-dot {
      background: var(--warning);
      color: #fff;
      box-shadow: 0 0 0 4px var(--warning-border);
    }
    .pipeline-step.approved .step-dot {
      background: var(--success);
      color: #fff;
    }
    .pipeline-step.rejected .step-dot {
      background: var(--danger);
      color: #fff;
    }
    .pipeline-step.changes .step-dot {
      background: #a21caf;
      color: #fff;
    }
    .step-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
    }
    .step-date {
      font-size: 0.72rem;
      color: #94a3b8;
    }
    .pipeline-connector {
      flex: 1;
      height: 3px;
      background: #e2e8f0;
      margin-bottom: 1.5rem;
    }
    .pipeline-connector.done {
      background: var(--success);
    }

    /* Commission notice */
    .commission-notice {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--primary);
      border-radius: var(--radius-sm);
      padding: 1.15rem 1.35rem;
      margin-top: 1.5rem;
    }
    .notice-APPROUVE {
      background: var(--success-bg);
      border-left-color: var(--success);
      border-color: var(--success-border);
    }
    .notice-REFUSE {
      background: var(--danger-bg);
      border-left-color: var(--danger);
      border-color: var(--danger-border);
    }
    .notice-RETOUCHE_DEMANDEE {
      background: #fdf4ff;
      border-left-color: #a21caf;
      border-color: #f0abfc;
    }
    .notice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.4rem;
      font-size: 0.9rem;
    }
    .notice-author {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .notice-body {
      font-size: 0.92rem;
      color: #334155;
      line-height: 1.5;
    }

    /* Dossier Grid */
    .dossier-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .card-section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--secondary);
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }
    .member-item {
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      background: #f8fafc;
      margin-bottom: 0.65rem;
    }
    .member-item.highlight {
      background: #eff6ff;
      border-left: 3px solid var(--primary);
    }
    .member-role {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--primary);
    }
    .member-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--secondary);
    }
    .member-filiere, .member-contact {
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .advisor-banner {
      background: #f1f5f9;
      padding: 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }
    .tag-accord {
      display: inline-block;
      padding: 0.1rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.75rem;
      background: #fee2e2;
      color: #991b1b;
    }
    .tag-accord.yes {
      background: #dcfce7;
      color: #166534;
    }
    .detail-block {
      margin-bottom: 1rem;
    }
    .detail-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .detail-text {
      font-size: 0.92rem;
      color: #334155;
      line-height: 1.5;
    }
    .whitespace-pre {
      white-space: pre-line;
    }
    .event-item {
      background: #f8fafc;
      padding: 1rem;
      border-radius: var(--radius-sm);
      border-left: 3px solid #3b82f6;
    }
    .event-pill {
      font-size: 0.7rem;
      font-weight: 700;
      background: #dbeafe;
      color: #1e40af;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .event-pill.s2 {
      background: #f3e8ff;
      color: #7e22ce;
    }
    .event-name {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0.35rem 0 0.25rem;
    }
    .event-desc {
      font-size: 0.85rem;
      color: #475569;
    }
    .event-sub-info {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.35rem;
      display: flex;
      gap: 1rem;
    }
    .budget-stat-box {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: var(--radius-sm);
      text-align: center;
      border: 1px solid var(--border-color);
    }
    .budget-num {
      display: block;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--primary);
    }
    .budget-lbl {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .funding-chips-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .funding-chip {
      font-size: 0.85rem;
      color: #334155;
      background: #f8fafc;
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      font-weight: 500;
    }
    .signature-block {
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.75rem;
      font-size: 0.85rem;
      color: #64748b;
    }
    @media (max-width: 860px) {
      .dossier-grid {
        grid-template-columns: 1fr;
      }
      .status-top-row {
        flex-direction: column;
      }
      .status-badge-wrap {
        align-items: flex-start;
      }
      .progress-pipeline {
        flex-direction: column;
        gap: 1.25rem;
      }
      .pipeline-connector {
        width: 3px;
        height: 25px;
        margin-bottom: 0;
      }
    }
  `]
})
export class ClubTrackingComponent implements OnInit {
  searchCode = '';
  loading = false;
  club: ClubApplication | null = null;
  errorMessage = '';

  isDownloadingPdf = false;

  constructor(
    private clubService: ClubService,
    private pdfService: PdfService,
    private route: ActivatedRoute
  ) {}

  async downloadReceiptPdf(): Promise<void> {
    if (!this.club || this.isDownloadingPdf) return;
    this.isDownloadingPdf = true;
    try {
      await this.pdfService.generateClubApplicationReceiptPdf(this.club, this.club.tracking_code || this.searchCode || '', true);
    } catch (err) {
      console.error('Erreur génération récépissé PDF:', err);
    } finally {
      this.isDownloadingPdf = false;
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.searchCode = params['code'];
        this.searchTracking();
      }
    });
  }

  quickSearch(code: string): void {
    this.searchCode = code;
    this.searchTracking();
  }

  searchTracking(): void {
    if (!this.searchCode.trim()) return;

    this.loading = true;
    this.errorMessage = '';
    this.club = null;

    this.clubService.trackClub(this.searchCode.trim()).subscribe({
      next: (data) => {
        this.club = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Aucun dossier correspondant à ce code de suivi.';
      }
    });
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'SOUMIS': return 'Dossier Soumis';
      case 'EN_COURS_DE_REVUE': return 'En Cours d\'Instruction';
      case 'APPROUVE': return 'Club Agréé & Validé';
      case 'REFUSE': return 'Demande Rejetée';
      case 'RETOUCHE_DEMANDEE': return 'Complément Requis';
      default: return status || 'Inconnu';
    }
  }

  isStepDone(stepNum: number): boolean {
    if (!this.club || !this.club.status) return false;
    if (stepNum === 1) return true;
    if (stepNum === 2) {
      return ['EN_COURS_DE_REVUE', 'APPROUVE', 'REFUSE', 'RETOUCHE_DEMANDEE'].includes(this.club.status);
    }
    if (stepNum === 3) {
      return ['APPROUVE', 'REFUSE', 'RETOUCHE_DEMANDEE'].includes(this.club.status);
    }
    return false;
  }

  printPage(): void {
    window.print();
  }
}

