import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClubService } from '../../services/club.service';
import { QrService } from '../../services/qr.service';
import { PdfService } from '../../services/pdf.service';
import { ClubApplication, ClubMember } from '../../models/club.model';

@Component({
  selector: 'app-join-club',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="join-page">
      <div class="container join-container">

        <!-- LOADING STATE -->
        <div class="loading-state card" *ngIf="loading">
          <div class="spinner"></div>
          <p>Chargement des informations du club...</p>
        </div>

        <!-- ERROR STATE -->
        <div class="card error-card text-center" *ngIf="!loading && !club">
          <div class="error-icon">⚠️</div>
          <h2>Club introuvable</h2>
          <p class="text-muted">
            Le club demandé n'a pas été trouvé ou le lien d'adhésion est incorrect.
          </p>
          <a routerLink="/clubs" class="btn btn-primary mt-3">
            ← Retour à l'annuaire des clubs
          </a>
        </div>

        <!-- MAIN JOIN CONTENT -->
        <div *ngIf="!loading && club">

          <!-- SUCCESS SCREEN: MEMBERSHIP CONFIRMED -->
          <div class="success-card card" *ngIf="submitted && registeredMember">
            <div class="success-badge-top">
              <span>🎉 Adhésion Confirmée !</span>
            </div>

            <h1 class="success-title">Bienvenue dans le {{ club.official_name }} !</h1>
            <p class="success-desc">
              Votre demande d'adhésion en tant que membre a été enregistrée avec succès. Vous faites désormais partie de l'aventure associative UPSSA pour l'année universitaire 2026-2027.
            </p>

            <!-- OFFICIAL STUDENT MEMBERSHIP CARD -->
            <div class="membership-badge-card" id="printable-membership-card">
              <div class="badge-card-header">
                <div class="badge-logo-area">
                  <img src="/upssa-logo.png" alt="Logo UPSSA" class="badge-univ-logo">
                  <div class="badge-header-text">
                    <span class="univ-tag">UPSSA • Vie Associative</span>
                    <strong class="card-type-tag">Carte de Membre Officielle</strong>
                  </div>
                </div>
                <div class="badge-year-pill">2026 - 2027</div>
              </div>

              <div class="badge-card-body">
                <div class="badge-club-info">
                  <div class="badge-club-avatar" *ngIf="club.logo_url">
                    <img [src]="club.logo_url" alt="{{ club.official_name }}">
                  </div>
                  <div>
                    <span class="badge-club-cat">{{ club.typology }}</span>
                    <h3 class="badge-club-name">{{ club.official_name }}</h3>
                    <span class="badge-club-acronym" *ngIf="club.acronym">{{ club.acronym }}</span>
                  </div>
                </div>

                <div class="badge-divider"></div>

                <div class="badge-member-grid">
                  <div class="member-detail">
                    <span class="detail-label">Nom & Prénom de l'Étudiant(e)</span>
                    <strong class="detail-val highlight">{{ registeredMember.full_name }}</strong>
                  </div>
                  <div class="member-detail">
                    <span class="detail-label">Faculté</span>
                    <strong class="detail-val">{{ registeredMember.filiere }}</strong>
                  </div>
                  <div class="member-detail">
                    <span class="detail-label">Année Scolaire / Niveau</span>
                    <strong class="detail-val">{{ registeredMember.academic_year }}</strong>
                  </div>
                  <div class="member-detail">
                    <span class="detail-label">Date d'Adhésion</span>
                    <strong class="detail-val">{{ registeredMember.joined_at | date:'dd/MM/yyyy' }}</strong>
                  </div>
                </div>

                <div class="badge-extra-block" *ngIf="registeredMember.loisir || registeredMember.competence">
                  <div *ngIf="registeredMember.loisir">
                    <span class="detail-label">🎨 Loisirs :</span>
                    <span class="detail-text">{{ registeredMember.loisir }}</span>
                  </div>
                  <div *ngIf="registeredMember.competence" class="mt-1">
                    <span class="detail-label">⚡ Compétences :</span>
                    <span class="detail-text">{{ registeredMember.competence }}</span>
                  </div>
                  <div *ngIf="registeredMember.project_idea" class="mt-1">
                    <span class="detail-label">💡 Idée de projet :</span>
                    <span class="detail-text">{{ registeredMember.project_idea }}</span>
                  </div>
                </div>
              </div>

              <div class="badge-card-footer">
                <div class="footer-sign">
                  <span>Président(e) du Club : <strong>{{ club.president_name }}</strong></span>
                </div>
                <div class="badge-id-code">
                  UPSSA-MBR-{{ club.id }}-{{ registeredMember.id }}
                </div>
              </div>
            </div>

            <div class="alert alert-success mt-3" style="display: flex; align-items: center; gap: 0.6rem; border-left: 4px solid var(--success);">
              <span style="font-size: 1.3rem;">📄</span>
              <div>
                <strong>Attestation d'inscription officielle générée en PDF !</strong>
                <p style="margin: 0; font-size: 0.85rem; color: #166534;">
                  Le fichier PDF officiel a été automatiquement généré et téléchargé sur votre appareil. Vous pouvez également le réimprimer ou le retélécharger ci-dessous.
                </p>
              </div>
            </div>

            <!-- SUCCESS ACTIONS -->
            <div class="success-actions mt-4">
              <button type="button" class="btn btn-primary" (click)="downloadPdf()">
                📄 Télécharger l'Attestation (PDF)
              </button>
              <button type="button" class="btn btn-secondary" (click)="printCard()">
                🖨️ Imprimer la Carte de Membre
              </button>
              <a routerLink="/clubs" class="btn btn-outline">
                🎓 Voir tous les clubs agréés
              </a>
              <button type="button" class="btn btn-outline" (click)="resetForm()">
                ➕ Inscrire un autre étudiant
              </button>
            </div>

          </div>

          <!-- REGISTRATION FORM -->
          <div *ngIf="!submitted" class="join-flow">

            <!-- CLUB HERO BANNER -->
            <div class="club-hero-card card">
              <div class="hero-top">
                <div class="hero-left">
                  <div class="club-avatar" *ngIf="club.logo_url">
                    <img [src]="club.logo_url" alt="{{ club.official_name }}">
                  </div>
                  <div>
                    <span class="club-hero-cat">{{ club.typology }}</span>
                    <h1 class="club-hero-title">{{ club.official_name }}</h1>
                    <span class="club-hero-acronym" *ngIf="club.acronym">{{ club.acronym }}</span>
                    <p class="club-hero-slogan" *ngIf="club.slogan">« {{ club.slogan }} »</p>
                  </div>
                </div>

                <div class="hero-right">
                  <div class="campaign-pill">
                    <span class="pulse-dot"></span>
                    <span>Campagne d'adhésion ouverte</span>
                  </div>
                  <div class="members-counter-pill" *ngIf="club.members_count !== undefined">
                    👥 <strong>{{ club.members_count }}</strong> membres inscrits
                  </div>
                </div>
              </div>

              <div class="hero-mission mt-3">
                <strong>Mission du Club :</strong>
                <p>{{ club.main_mission }}</p>
              </div>

              <div class="hero-event mt-2" *ngIf="club.event1_title">
                <span class="event-tag">✨ Prochain événement :</span>
                <strong>{{ club.event1_title }}</strong>
                <span *ngIf="club.event1_date" class="event-date">({{ club.event1_date | date:'dd/MM/yyyy' }})</span>
              </div>
            </div>

            <!-- THE JOIN REGISTRATION FORM -->
            <div class="card mt-4 form-card">
              <div class="form-header-bar">
                <div>
                  <span class="form-section-tag">Formulaire Étudiant</span>
                  <h2 class="form-section-title">Rejoindre ce Club en tant que Membre</h2>
                  <p class="form-section-desc">
                    Complétez vos coordonnées pour officialiser votre intégration au bureau et aux activités du club.
                  </p>
                </div>
                <div class="qr-mini-box" *ngIf="qrDataUrl">
                  <img [src]="qrDataUrl" alt="QR Code" class="qr-mini-img">
                  <span class="qr-mini-caption">Scanner & Partager</span>
                </div>
              </div>

              <!-- ERROR ALERT -->
              <div class="alert alert-danger mt-3" *ngIf="errorMessage">
                <span>⚠️</span>
                <span>{{ errorMessage }}</span>
              </div>

              <form (submit)="submitMembership()" class="mt-4">

                <!-- 1. NOM ET PRÉNOM -->
                <div class="form-group">
                  <label class="form-label">
                    Nom et Prénom de l'Étudiant(e) <span class="required">*</span>
                  </label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="Ex: Yasmine Tazi, Omar El Fassi..." 
                    [(ngModel)]="formData.full_name" 
                    name="full_name" 
                    required
                  >
                </div>

                <!-- 2. FILIÈRE & ANNÉE SCOLAIRE (2 COLUMNS) -->
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">
                      Faculté <span class="required">*</span>
                    </label>
                    <select class="form-select" [(ngModel)]="formData.filiere" name="filiere" required>
                      <option value="" disabled selected>-- Sélectionnez votre faculté --</option>
                      <option *ngFor="let f of faculties" [value]="f">{{ f }}</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      L'Année Scolaire / Niveau <span class="required">*</span>
                    </label>
                    <select class="form-select" [(ngModel)]="formData.academic_year" name="academic_year" required>
                      <option value="" disabled selected>-- Sélectionnez votre niveau --</option>
                      <option *ngFor="let a of academicYears" [value]="a">{{ a }}</option>
                    </select>
                  </div>
                </div>

                <!-- 3. LOISIR & COMPÉTENCE (2 COLUMNS) -->
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">
                      Loisir(s) <span class="required">*</span>
                    </label>
                    <textarea 
                      rows="3" 
                      class="form-control" 
                      placeholder="Ex: Football, dessin, lecture, échecs, randonnée, natation, musique..." 
                      [(ngModel)]="formData.loisir" 
                      name="loisir" 
                      required
                    ></textarea>
                    <span class="form-hint">Vos passions personnelles et activités favorites hors des cours.</span>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      Compétence(s) <span class="required">*</span>
                    </label>
                    <textarea 
                      rows="3" 
                      class="form-control" 
                      placeholder="Ex: Secourisme, conception graphique, organisation d'événements, programmation, montage vidéo, animation..." 
                      [(ngModel)]="formData.competence" 
                      name="competence" 
                      required
                    ></textarea>
                    <span class="form-hint">Ce que vous pouvez apporter et développer au sein de l'équipe du club.</span>
                  </div>
                </div>

                <!-- 4. IDÉE DE PROJET PROPOSÉE -->
                <div class="form-group">
                  <label class="form-label">
                    Idée de Projet Proposée pour le Club
                  </label>
                  <textarea 
                    rows="3" 
                    class="form-control" 
                    placeholder="Ex: Proposer un tournoi inter-facultés, animer un atelier de simulation clinique, organiser une journée de don de sang, lancer un podcast étudiant..." 
                    [(ngModel)]="formData.project_idea" 
                    name="project_idea"
                  ></textarea>
                  <span class="form-hint">Une idée d'activité, d'événement ou d'atelier que vous souhaiteriez organiser avec le club.</span>
                </div>

                <!-- 5. COORDONNÉES DE CONTACT (OPTIONNELLES MAIS UTILES) -->
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Email Universitaire</label>
                    <input 
                      type="email" 
                      class="form-control" 
                      placeholder="prenom.nom@upssa.ac.ma" 
                      [(ngModel)]="formData.email" 
                      name="email"
                    >
                  </div>
                  <div class="form-group">
                    <label class="form-label">Téléphone (WhatsApp)</label>
                    <input 
                      type="tel" 
                      class="form-control" 
                      placeholder="+212 6 XX XX XX XX" 
                      [(ngModel)]="formData.phone" 
                      name="phone"
                    >
                  </div>
                </div>

                <!-- SUBMIT ACTIONS -->
                <div class="form-actions mt-4">
                  <button type="submit" class="btn btn-primary submit-join-btn" [disabled]="submitting">
                    <span *ngIf="!submitting">🚀 Valider mon Adhésion au Club</span>
                    <span *ngIf="submitting">Enregistrement en cours...</span>
                  </button>
                  <a routerLink="/clubs" class="btn btn-secondary">
                    Annuler
                  </a>
                </div>

              </form>

            </div>

          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .join-page {
      padding: 2.5rem 0 4.5rem;
    }
    .join-container {
      max-width: 860px;
    }

    /* Club Hero Card */
    .club-hero-card {
      border-top: 5px solid var(--primary);
      background: #ffffff;
      padding: 2rem;
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .hero-left {
      display: flex;
      gap: 1.25rem;
      align-items: center;
    }
    .club-avatar {
      width: 72px;
      height: 72px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      flex-shrink: 0;
      background: #f8fafc;
    }
    .club-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .club-hero-cat {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
      display: block;
    }
    .club-hero-title {
      font-size: 1.65rem;
      font-weight: 800;
      color: var(--secondary);
      line-height: 1.2;
      margin: 0.2rem 0;
    }
    .club-hero-acronym {
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
    }
    .club-hero-slogan {
      font-style: italic;
      color: #475569;
      font-size: 0.92rem;
      margin-top: 0.35rem;
    }
    .hero-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .campaign-pill {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .members-counter-pill {
      background: var(--primary-light);
      color: var(--primary);
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
    }
    .hero-mission {
      background: #f8fafc;
      padding: 0.9rem 1.15rem;
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--primary);
      font-size: 0.92rem;
      color: #334155;
      line-height: 1.5;
    }
    .hero-mission strong {
      color: var(--secondary);
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .hero-event {
      font-size: 0.88rem;
      color: var(--secondary);
    }
    .event-tag {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary);
      margin-right: 0.35rem;
    }
    .event-date {
      color: #64748b;
      margin-left: 0.35rem;
      font-size: 0.82rem;
    }

    /* Form Card */
    .form-card {
      padding: 2.25rem;
    }
    .form-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1.25rem;
    }
    .form-section-tag {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary);
      display: block;
      margin-bottom: 0.2rem;
    }
    .form-section-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .form-section-desc {
      color: var(--text-muted);
      font-size: 0.88rem;
      margin-top: 0.25rem;
    }
    .qr-mini-box {
      text-align: center;
      border: 1px solid var(--border-color);
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      background: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .qr-mini-img {
      width: 72px;
      height: 72px;
      display: block;
      margin: 0 auto;
    }
    .qr-mini-caption {
      font-size: 0.65rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .submit-join-btn {
      padding: 0.75rem 1.75rem;
      font-size: 1rem;
      font-weight: 700;
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    /* Success Membership Card */
    .success-card {
      padding: 2.5rem;
      text-align: center;
      border-top: 5px solid var(--success);
    }
    .success-badge-top span {
      background: #ecfdf5;
      color: #059669;
      font-size: 0.85rem;
      font-weight: 800;
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
      display: inline-block;
      margin-bottom: 1rem;
    }
    .success-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .success-desc {
      color: #475569;
      font-size: 1rem;
      max-width: 650px;
      margin: 0.5rem auto 1.75rem;
      line-height: 1.5;
    }

    /* Printable Membership Badge */
    .membership-badge-card {
      background: linear-gradient(135deg, #003844 0%, #00222a 100%);
      color: #ffffff;
      border-radius: 16px;
      max-width: 620px;
      margin: 0 auto;
      text-align: left;
      box-shadow: 0 16px 36px -6px rgba(0, 34, 42, 0.35);
      border: 2px solid #009aa6;
      overflow: hidden;
      position: relative;
    }
    .badge-card-header {
      background: rgba(255, 255, 255, 0.08);
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .badge-logo-area {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .badge-univ-logo {
      height: 38px;
      background: #ffffff;
      padding: 3px 6px;
      border-radius: 6px;
    }
    .badge-header-text {
      display: flex;
      flex-direction: column;
    }
    .univ-tag {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7dd3fc;
      font-weight: 700;
    }
    .card-type-tag {
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffffff;
    }
    .badge-year-pill {
      background: var(--primary);
      color: #ffffff;
      font-size: 0.76rem;
      font-weight: 800;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      letter-spacing: 0.05em;
    }
    .badge-card-body {
      padding: 1.5rem;
    }
    .badge-club-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .badge-club-avatar {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      overflow: hidden;
      background: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
    }
    .badge-club-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .badge-club-cat {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #38bdf8;
      display: block;
    }
    .badge-club-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }
    .badge-club-acronym {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
    }
    .badge-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.12);
      margin: 1.25rem 0;
    }
    .badge-member-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .member-detail {
      display: flex;
      flex-direction: column;
    }
    .detail-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 0.2rem;
    }
    .detail-val {
      font-size: 0.95rem;
      color: #ffffff;
      font-weight: 600;
    }
    .detail-val.highlight {
      color: #38bdf8;
      font-size: 1.15rem;
      font-weight: 800;
    }
    .badge-extra-block {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      margin-top: 1.15rem;
      font-size: 0.85rem;
    }
    .detail-text {
      color: #e2e8f0;
      margin-left: 0.35rem;
    }
    .badge-card-footer {
      background: rgba(0, 0, 0, 0.25);
      padding: 0.9rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      color: #94a3b8;
    }
    .footer-sign strong {
      color: #ffffff;
    }
    .badge-id-code {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.05em;
    }

    .success-actions {
      display: flex;
      gap: 0.85rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #printable-membership-card, #printable-membership-card * {
        visibility: visible;
      }
      #printable-membership-card {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 100%;
      }
    }

    @media (max-width: 640px) {
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
      .badge-member-grid {
        grid-template-columns: 1fr;
      }
      .hero-top {
        flex-direction: column;
      }
      .hero-right {
        align-items: flex-start;
      }
      .form-header-bar {
        flex-direction: column-reverse;
        align-items: flex-start;
      }
    }
  `]
})
export class JoinClubComponent implements OnInit {
  clubId: number | null = null;
  club: ClubApplication | null = null;
  loading = true;
  submitting = false;
  submitted = false;
  errorMessage = '';

  qrDataUrl = '';

  // Registration Form
  formData: {
    full_name: string;
    filiere: string;
    academic_year: string;
    loisir: string;
    competence: string;
    project_idea: string;
    email: string;
    phone: string;
  } = {
    full_name: '',
    filiere: '',
    academic_year: '',
    loisir: '',
    competence: '',
    project_idea: '',
    email: '',
    phone: ''
  };

  registeredMember: ClubMember | null = null;

  faculties: string[] = [
    'UPSSA Santé',
    'UPSSA Ingénierie',
    'UPSSA Business School'
  ];

  filieres = this.faculties;

  academicYears: string[] = [
    '1ère année',
    '2ème année',
    '3ème année',
    '4ème année'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clubService: ClubService,
    private qrService: QrService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.clubId = parseInt(idParam, 10);
        this.loadClub(this.clubId);
      } else {
        // Check query params ?id= or ?club=
        this.route.queryParamMap.subscribe(qParams => {
          const qId = qParams.get('id') || qParams.get('club');
          if (qId) {
            this.clubId = parseInt(qId, 10);
            this.loadClub(this.clubId);
          } else {
            this.loading = false;
          }
        });
      }
    });
  }

  loadClub(id: number): void {
    this.loading = true;
    this.clubService.getClubById(id).subscribe({
      next: async (club) => {
        this.club = club;
        this.loading = false;

        // Generate QR code for this join page
        const joinUrl = this.qrService.getJoinUrl(club.id!);
        this.qrDataUrl = await this.qrService.generateDataUrl(joinUrl, 200);
      },
      error: (err) => {
        console.error('Error fetching club for join:', err);
        this.loading = false;
        this.club = null;
      }
    });
  }

  submitMembership(): void {
    if (!this.club || !this.club.id) return;

    if (!this.formData.full_name.trim()) {
      this.errorMessage = 'Veuillez saisir votre nom et prénom.';
      return;
    }
    if (!this.formData.filiere) {
      this.errorMessage = 'Veuillez sélectionner votre faculté.';
      return;
    }
    if (!this.formData.academic_year) {
      this.errorMessage = 'Veuillez sélectionner votre année scolaire.';
      return;
    }
    if (!this.formData.loisir.trim()) {
      this.errorMessage = 'Veuillez renseigner vos loisirs.';
      return;
    }
    if (!this.formData.competence.trim()) {
      this.errorMessage = 'Veuillez renseigner vos compétences.';
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    this.clubService.addMember(this.club.id, {
      full_name: this.formData.full_name,
      filiere: this.formData.filiere,
      academic_year: this.formData.academic_year,
      loisir: this.formData.loisir,
      competence: this.formData.competence,
      project_idea: this.formData.project_idea,
      email: this.formData.email,
      phone: this.formData.phone
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        this.registeredMember = res.member;
        this.submitted = true;
        if (this.club) {
          this.club.members_count = res.total_members;
          // Automatiquement générer et télécharger l'attestation officielle en PDF
          this.pdfService.generateMembershipPdf(this.club, this.registeredMember, true).catch(err => {
            console.warn('PDF generation warning:', err);
          });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.submitting = false;
        console.error('Error submitting membership:', err);
        this.errorMessage = err.error?.error || 'Erreur lors de l\'enregistrement de votre adhésion.';
      }
    });
  }

  downloadPdf(): void {
    if (this.club && this.registeredMember) {
      this.pdfService.generateMembershipPdf(this.club, this.registeredMember, true);
    }
  }

  printCard(): void {
    window.print();
  }

  resetForm(): void {
    this.submitted = false;
    this.registeredMember = null;
    this.formData = {
      full_name: '',
      filiere: '',
      academic_year: '',
      loisir: '',
      competence: '',
      project_idea: '',
      email: '',
      phone: ''
    };
  }
}

