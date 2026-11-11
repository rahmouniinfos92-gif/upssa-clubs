import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClubService } from '../../services/club.service';
import { QrService } from '../../services/qr.service';
import { PdfService } from '../../services/pdf.service';
import { ClubApplication, ClubMember } from '../../models/club.model';

@Component({
  selector: 'app-club-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="directory-page">
      <div class="container">
        
        <!-- Header -->
        <div class="directory-header">
          <div>
            <span class="sub-badge">Vie Associative & Campus</span>
            <h1 class="page-title">Annuaire des Clubs Agréés</h1>
            <p class="page-desc">
              Découvrez la diversité des associations étudiantes reconnues par l'université, rejoignez leurs activités via QR Code ou gérez leurs fiches officielles.
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-outline" (click)="downloadPaperFormPdf()" title="Télécharger le dossier officiel vierge de création de club au format papier à imprimer">
              📄 Dossier Papier (PDF)
            </button>
            <a routerLink="/nouveau-club" class="btn btn-primary">
              ➕ Créer un Nouveau Club
            </a>
          </div>
        </div>

        <!-- Notification Toast -->
        <div class="toast-banner mt-3" *ngIf="notificationMessage" [class.toast-error]="notificationType === 'error'">
          <div class="toast-content">
            <span class="toast-icon">{{ notificationType === 'error' ? '⚠️' : '✓' }}</span>
            <span>{{ notificationMessage }}</span>
          </div>
          <button type="button" class="toast-close" (click)="notificationMessage = ''">✕</button>
        </div>

        <!-- Filter bar -->
        <div class="filter-strip card mt-4">
          <div class="search-input-box">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Rechercher par nom, mot-clé ou thématique..." 
              [(ngModel)]="searchQuery"
              (input)="filterClubs()"
            >
          </div>
          <div class="chips-row">
            <button 
              type="button" 
              class="chip-btn" 
              [class.active]="selectedTypology === 'ALL'"
              (click)="selectTypology('ALL')"
            >
              Tous ({{ approvedClubs.length }})
            </button>
            <button 
              *ngFor="let typ of typologies" 
              type="button" 
              class="chip-btn" 
              [class.active]="selectedTypology === typ"
              (click)="selectTypology(typ)"
            >
              {{ typ }}
            </button>
          </div>
        </div>

        <!-- Clubs Grid -->
        <div class="clubs-grid mt-4" *ngIf="filteredClubs.length > 0">
          <div *ngFor="let c of filteredClubs" class="club-card-v2">
            
            <!-- Top Status Bar & Category -->
            <div class="card-top-bar">
              <div class="category-pill-group">
                <span class="cat-pill">
                  <span class="cat-icon">{{ getCategoryIcon(c.typology) }}</span>
                  <span class="cat-text">{{ c.typology }}</span>
                </span>
                <span class="verified-accreditation-pill" title="Club officiellement agréé par la Commission de l'UPSSA">
                  ✓ Agréé
                </span>
              </div>
              <button 
                type="button" 
                class="members-count-pill" 
                (click)="openMembersModal(c)" 
                title="Cliquer pour afficher la liste des membres inscrits"
              >
                👥 <strong>{{ c.members_count || 0 }}</strong> membre{{ (c.members_count || 0) > 1 ? 's' : '' }}
              </button>
            </div>

            <!-- Identity Header (Logo + Names) -->
            <div class="card-identity-row">
              <div class="card-avatar-box">
                <img *ngIf="c.logo_url" [src]="c.logo_url" [alt]="c.official_name" class="club-avatar-img">
                <div *ngIf="!c.logo_url" class="club-avatar-fallback">
                  {{ c.acronym || getInitials(c.official_name) }}
                </div>
              </div>
              <div class="card-title-group">
                <h3 class="card-club-title" [title]="c.official_name">{{ c.official_name }}</h3>
                <div class="card-badges-sub">
                  <span class="acronym-tag" *ngIf="c.acronym">{{ c.acronym }}</span>
                  <span class="tracking-code-tag" *ngIf="c.tracking_code">{{ c.tracking_code }}</span>
                </div>
              </div>
            </div>

            <!-- Slogan & Mission Body -->
            <div class="card-body-content">
              <p class="club-slogan-styled" *ngIf="c.slogan">
                <span class="quote-mark">“</span>{{ c.slogan }}<span class="quote-mark">”</span>
              </p>
              <p class="club-mission-text" [title]="c.main_mission">
                {{ c.main_mission }}
              </p>
            </div>

            <!-- Next Major Event Banner (if available) -->
            <div class="card-event-banner" *ngIf="c.event1_title">
              <div class="event-icon-badge">📅</div>
              <div class="event-details">
                <span class="event-pre-label">Prochain événement phare</span>
                <strong class="event-title-text">{{ c.event1_title }}</strong>
              </div>
            </div>

            <!-- Supervision & Executive Info Grid -->
            <div class="card-supervision-grid">
              <div class="sup-item">
                <span class="sup-label">👤 Président(e)</span>
                <strong class="sup-name">{{ c.president_name }}</strong>
                <span class="sup-sub" *ngIf="c.president_filiere">{{ c.president_filiere }}</span>
              </div>
              <div class="sup-item">
                <span class="sup-label">🎓 Tuteur Référent</span>
                <strong class="sup-name">{{ c.faculty_advisor_name || 'Dr. Loubna Agouzal' }}</strong>
                <span class="sup-sub">Enseignant UPSSA</span>
              </div>
            </div>

            <!-- Primary Student Actions (Join, Sheet, QR) -->
            <div class="card-primary-actions">
              <a [routerLink]="['/rejoindre', c.id]" class="btn-cta-join" title="Rejoindre ce club en tant que membre">
                ✍️ Rejoindre
              </a>
              <button 
                type="button" 
                class="btn-action-outline btn-sheet" 
                (click)="downloadClubSheet(c)" 
                [disabled]="downloadingSheetClubId === c.id"
                title="Télécharger la Fiche Officielle d'Agrément (PDF)"
              >
                <span *ngIf="downloadingSheetClubId !== c.id">📄 Fiche PDF</span>
                <span *ngIf="downloadingSheetClubId === c.id">⏳ ...</span>
              </button>
              <button 
                type="button" 
                class="btn-action-outline btn-qr" 
                (click)="openQrModal(c)" 
                title="Afficher et scanner le QR code pour rejoindre"
              >
                📲 QR Code
              </button>
            </div>

            <!-- Management & Contact Bottom Strip -->
            <div class="card-bottom-strip">
              <a [href]="'mailto:' + c.president_email" class="contact-email-btn" title="Envoyer un email au bureau du club">
                ✉️ Contacter
              </a>
              <div class="mgmt-actions-group">
                <button 
                  type="button" 
                  class="btn-mgmt btn-edit" 
                  (click)="openEditModal(c)" 
                  title="Modifier les informations de ce club"
                >
                  ✏️ Modifier
                </button>
                <button 
                  type="button" 
                  class="btn-mgmt btn-delete" 
                  (click)="openDeleteModal(c)" 
                  title="Supprimer ce club de l'annuaire"
                >
                  🗑️
                </button>
              </div>
            </div>

          </div>
        </div>

        <div class="empty-state card mt-4" *ngIf="filteredClubs.length === 0">
          <div class="empty-icon">🏛️</div>
          <h3>Aucun club trouvé</h3>
          <p class="text-muted">Aucun club agréé ne correspond à votre filtre actuel.</p>
        </div>

      </div>

      <!-- ================= MODAL QR CODE D'ADHÉSION ================= -->
      <div class="modal-overlay" *ngIf="qrModalClub" (click)="closeQrModal()">
        <div class="modal-box modal-box-sm card qr-modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-pill">{{ qrModalClub.acronym || 'UPSSA' }}</span>
              <h2 class="modal-title">QR Code d'Adhésion</h2>
            </div>
            <button type="button" class="close-btn" (click)="closeQrModal()" title="Fermer">✕</button>
          </div>

          <div class="qr-content-area">
            <div class="qr-frame">
              <img *ngIf="qrModalDataUrl" [src]="qrModalDataUrl" alt="QR Code d'adhésion" class="qr-img">
              <div *ngIf="!qrModalDataUrl" class="qr-loading">Génération du QR Code...</div>
            </div>

            <h3 class="qr-club-name">{{ qrModalClub.official_name }}</h3>
            <p class="qr-subtext">
              Scannez ce QR Code avec l'appareil photo de votre smartphone pour ouvrir directement le formulaire d'inscription et rejoindre le club en tant que membre.
            </p>

            <div class="qr-url-box">
              <input type="text" readonly [value]="qrModalUrl" class="qr-url-input">
              <button type="button" class="btn-copy-url" (click)="copyQrLink()">
                <span *ngIf="!copiedQrLink">📋 Copier</span>
                <span *ngIf="copiedQrLink" class="text-success">✓ Copié !</span>
              </button>
            </div>
          </div>

          <div class="modal-footer qr-footer">
            <a [routerLink]="['/rejoindre', qrModalClub.id]" class="btn btn-primary" (click)="closeQrModal()">
              ✍️ Ouvrir la page d'inscription
            </a>
            <a 
              *ngIf="qrModalDataUrl" 
              [href]="qrModalDataUrl" 
              [download]="'QRCode-' + (qrModalClub.acronym || qrModalClub.official_name) + '.png'" 
              class="btn btn-secondary"
            >
              💾 Télécharger le QR Code
            </a>
          </div>
        </div>
      </div>

      <!-- ================= MODAL VISUALISATION DES MEMBRES DU CLUB ================= -->
      <div class="modal-overlay" *ngIf="membersModalClub" (click)="closeMembersModal()">
        <div class="modal-box modal-box-lg card members-modal-box" (click)="$event.stopPropagation()">
          
          <!-- MODAL HEADER -->
          <div class="modal-header members-modal-header">
            <div class="header-club-brand">
              <div class="header-avatar" *ngIf="membersModalClub.logo_url">
                <img [src]="membersModalClub.logo_url" alt="{{ membersModalClub.official_name }}">
              </div>
              <div>
                <div class="modal-badge-row">
                  <span class="modal-pill">{{ membersModalClub.acronym || 'UPSSA' }}</span>
                  <span class="modal-typ-tag">{{ membersModalClub.typology }}</span>
                </div>
                <h2 class="modal-title">Membres du {{ membersModalClub.official_name }}</h2>
                <p class="modal-sub-slogan" *ngIf="membersModalClub.slogan">« {{ membersModalClub.slogan }} »</p>
              </div>
            </div>
            
            <div class="header-right-tools">
              <button 
                type="button" 
                class="btn btn-primary btn-sm btn-modal-sheet" 
                (click)="downloadAllMembersPdf()"
                [disabled]="generatingAllPdf || membersList.length === 0"
                title="Télécharger le registre officiel de toutes les inscriptions au format PDF"
                style="margin-right: 0.35rem;"
              >
                <span *ngIf="!generatingAllPdf">📋 Registre Inscriptions (PDF)</span>
                <span *ngIf="generatingAllPdf">⏳ Téléchargement...</span>
              </button>
              <button 
                type="button" 
                class="btn btn-outline btn-sm btn-modal-sheet" 
                (click)="downloadClubSheet(membersModalClub)"
                [disabled]="downloadingSheetClubId === membersModalClub.id"
                title="Télécharger la fiche officielle d'agrément de ce club au format PDF"
              >
                <span *ngIf="downloadingSheetClubId !== membersModalClub.id">📄 Fiche d'Agrément (PDF)</span>
                <span *ngIf="downloadingSheetClubId === membersModalClub.id">⏳ Téléchargement...</span>
              </button>
              <div class="members-total-counter">
                <span class="counter-num">👥 {{ membersList.length }}</span>
                <span class="counter-label">membres inscrits</span>
              </div>
              <button type="button" class="close-btn" (click)="closeMembersModal()" title="Fermer">✕</button>
            </div>
          </div>

          <!-- TAB SWITCHER (MEMBRES ADHÉRENTS / BUREAU EXÉCUTIF) -->
          <div class="members-tabs-bar">
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="activeMembersTab === 'adherents'"
              (click)="activeMembersTab = 'adherents'"
            >
              👥 Membres Adhérents Inscrits
              <span class="tab-count-badge">{{ membersList.length }}</span>
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="activeMembersTab === 'bureau'"
              (click)="activeMembersTab = 'bureau'"
            >
              🏛️ Bureau Exécutif & Fondateurs
            </button>
          </div>

          <!-- ================= TAB 1: MEMBRES ADHÉRENTS ================= -->
          <div *ngIf="activeMembersTab === 'adherents'" class="tab-content-pane">

            <!-- SEARCH & FACULTY FILTER BAR -->
            <div class="members-controls-strip">
              <div class="members-search-box">
                <span class="search-icon">🔍</span>
                <input 
                  type="text" 
                  class="form-control members-search-input" 
                  placeholder="Rechercher par nom, faculté, loisir, compétence..." 
                  [(ngModel)]="membersSearchQuery"
                  (input)="filterMembers()"
                >
                <button 
                  type="button" 
                  class="search-clear-btn" 
                  *ngIf="membersSearchQuery" 
                  (click)="membersSearchQuery = ''; filterMembers()"
                >✕</button>
              </div>

              <!-- FACULTY FILTER PILLS -->
              <div class="faculty-filter-pills">
                <button 
                  type="button" 
                  class="fac-pill" 
                  [class.active]="selectedFacultyFilter === 'ALL'"
                  (click)="setFacultyFilter('ALL')"
                >
                  Toutes les facultés ({{ membersList.length }})
                </button>
                <button 
                  type="button" 
                  class="fac-pill pill-sante" 
                  [class.active]="selectedFacultyFilter === 'UPSSA Santé'"
                  (click)="setFacultyFilter('UPSSA Santé')"
                >
                  🏥 UPSSA Santé ({{ countByFaculty('UPSSA Santé') }})
                </button>
                <button 
                  type="button" 
                  class="fac-pill pill-ingenierie" 
                  [class.active]="selectedFacultyFilter === 'UPSSA Ingénierie'"
                  (click)="setFacultyFilter('UPSSA Ingénierie')"
                >
                  ⚙️ UPSSA Ingénierie ({{ countByFaculty('UPSSA Ingénierie') }})
                </button>
                <button 
                  type="button" 
                  class="fac-pill pill-business" 
                  [class.active]="selectedFacultyFilter === 'UPSSA Business School'"
                  (click)="setFacultyFilter('UPSSA Business School')"
                >
                  💼 UPSSA Business School ({{ countByFaculty('UPSSA Business School') }})
                </button>
              </div>
            </div>

            <!-- LOADING STATE -->
            <div class="members-loading card" *ngIf="loadingMembers">
              <div class="spinner"></div>
              <p>Chargement des membres du club...</p>
            </div>

            <!-- EMPTY STATE: NO MEMBERS YET -->
            <div class="members-empty-state card" *ngIf="!loadingMembers && membersList.length === 0">
              <div class="empty-icon-wrap">👥</div>
              <h3 class="empty-title">Aucun membre inscrit pour le moment</h3>
              <p class="empty-desc">
                Soyez le premier à rejoindre le <strong>{{ membersModalClub.official_name }}</strong> ou scannez le QR code pour lancer la campagne d'adhésion sur le campus !
              </p>
              <div class="empty-actions">
                <a [routerLink]="['/rejoindre', membersModalClub.id]" class="btn btn-primary" (click)="closeMembersModal()">
                  ✍️ Rejoindre le Club
                </a>
                <button type="button" class="btn btn-secondary" (click)="openQrFromMembers()">
                  📲 Afficher le QR Code
                </button>
              </div>
            </div>

            <!-- EMPTY SEARCH RESULTS -->
            <div class="members-empty-state card" *ngIf="!loadingMembers && membersList.length > 0 && filteredMembersList.length === 0">
              <div class="empty-icon-wrap">🔎</div>
              <h3 class="empty-title">Aucun membre ne correspond à votre recherche</h3>
              <p class="empty-desc">Essayez de modifier votre mot-clé ou réinitialisez les filtres.</p>
              <button type="button" class="btn btn-outline btn-sm" (click)="resetMemberFilters()">
                ↺ Réinitialiser les filtres
              </button>
            </div>

            <!-- MEMBERS CARDS GRID -->
            <div class="members-grid" *ngIf="!loadingMembers && filteredMembersList.length > 0">
              <div *ngFor="let m of filteredMembersList" class="member-detail-card card">
                
                <div class="member-card-header">
                  <div class="member-avatar-badge" [ngClass]="getFacultyClass(m.filiere)">
                    {{ getInitials(m.full_name) }}
                  </div>
                  <div class="member-primary-info">
                    <h4 class="member-name">{{ m.full_name }}</h4>
                    <div class="member-fac-tags">
                      <span class="fac-tag" [ngClass]="getFacultyClass(m.filiere)">
                        {{ m.filiere }}
                      </span>
                      <span class="year-tag">{{ m.academic_year }}</span>
                    </div>
                  </div>
                  <div class="member-meta-top">
                    <span class="member-id-pill">UPSSA-MBR-{{ membersModalClub.id }}-{{ m.id }}</span>
                    <span class="member-join-date" *ngIf="m.joined_at">
                      <span class="join-icon">📅</span>
                      <span>{{ m.joined_at | date:'dd/MM/yyyy' }}</span>
                    </span>
                  </div>
                </div>

                <div class="member-card-body">
                  <!-- Loisir & Compétence -->
                  <div class="member-info-row" *ngIf="m.loisir">
                    <span class="info-label">🎨 Loisirs :</span>
                    <span class="info-val">{{ m.loisir }}</span>
                  </div>

                  <div class="member-info-row" *ngIf="m.competence">
                    <span class="info-label">⚡ Compétences :</span>
                    <span class="info-val">{{ m.competence }}</span>
                  </div>

                  <!-- Idée de projet -->
                  <div class="member-project-box" *ngIf="m.project_idea">
                    <span class="project-tag">💡 Idée de projet proposée :</span>
                    <p class="project-text">« {{ m.project_idea }} »</p>
                  </div>
                </div>

                <!-- Member Contact Bar -->
                <div class="member-contact-bar" *ngIf="m.email || m.phone">
                  <a *ngIf="m.email" [href]="'mailto:' + m.email" class="contact-link" title="Envoyer un email">
                    ✉️ {{ m.email }}
                  </a>
                  <a *ngIf="m.phone" [href]="'tel:' + m.phone" class="contact-link" title="Téléphone ou WhatsApp">
                    📞 {{ m.phone }}
                  </a>
                </div>

                <!-- Member Card Action Buttons (Attestation PDF & Fiche Détail) -->
                <div class="member-actions-row mt-3">
                  <button 
                    type="button" 
                    class="btn-member-pdf" 
                    (click)="downloadMemberPdf(m)"
                    [disabled]="generatingPdfMemberId === m.id"
                    title="Télécharger la Fiche Officielle d'Inscription au format PDF"
                  >
                    <span *ngIf="generatingPdfMemberId === m.id">⏳ Génération...</span>
                    <span *ngIf="generatingPdfMemberId !== m.id">📄 Fiche Inscription (PDF)</span>
                  </button>
                  <button 
                    type="button" 
                    class="btn-member-detail" 
                    (click)="viewMemberDetail(m)"
                    title="Consulter la fiche complète d'inscription de cet étudiant"
                  >
                    🔍 Fiche Détail
                  </button>
                </div>

              </div>
            </div>

          </div>

          <!-- ================= TAB 2: BUREAU EXÉCUTIF ================= -->
          <div *ngIf="activeMembersTab === 'bureau'" class="tab-content-pane">
            
            <!-- PRESIDENT HERO CARD -->
            <div class="bureau-leader-card card">
              <div class="leader-badge-top">👑 Direction du Club</div>
              <div class="leader-row">
                <div class="leader-avatar">
                  {{ getInitials(membersModalClub.president_name) }}
                </div>
                <div class="leader-info">
                  <span class="leader-role">Président(e) Officiel(le)</span>
                  <h3 class="leader-name">{{ membersModalClub.president_name }}</h3>
                  <div class="leader-details">
                    <span class="detail-item" *ngIf="membersModalClub.president_filiere">
                      🎓 {{ membersModalClub.president_filiere }}
                    </span>
                    <span class="detail-item" *ngIf="membersModalClub.president_email">
                      ✉️ {{ membersModalClub.president_email }}
                    </span>
                    <span class="detail-item" *ngIf="membersModalClub.president_phone">
                      📞 {{ membersModalClub.president_phone }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- EXECUTIVE OFFICERS GRID -->
            <h4 class="bureau-sec-title mt-4">🏛️ Membres du Bureau Exécutif</h4>
            <div class="bureau-grid">
              
              <!-- Vice-Président -->
              <div class="bureau-card card" *ngIf="membersModalClub.vp_name">
                <div class="bureau-role-tag badge-vp">Vice-Président(e)</div>
                <h4 class="bureau-name">{{ membersModalClub.vp_name }}</h4>
                <div class="bureau-sub" *ngIf="membersModalClub.vp_filiere">{{ membersModalClub.vp_filiere }}</div>
                <div class="bureau-contact" *ngIf="membersModalClub.vp_contact">📞 {{ membersModalClub.vp_contact }}</div>
              </div>

              <!-- Secrétaire Général -->
              <div class="bureau-card card" *ngIf="membersModalClub.sg_name">
                <div class="bureau-role-tag badge-sg">Secrétaire Général(e)</div>
                <h4 class="bureau-name">{{ membersModalClub.sg_name }}</h4>
                <div class="bureau-sub" *ngIf="membersModalClub.sg_filiere">{{ membersModalClub.sg_filiere }}</div>
                <div class="bureau-contact" *ngIf="membersModalClub.sg_contact">📞 {{ membersModalClub.sg_contact }}</div>
              </div>

              <!-- Trésorier -->
              <div class="bureau-card card" *ngIf="membersModalClub.treasurer_name">
                <div class="bureau-role-tag badge-tres">Trésorier(ère)</div>
                <h4 class="bureau-name">{{ membersModalClub.treasurer_name }}</h4>
                <div class="bureau-sub" *ngIf="membersModalClub.treasurer_filiere">{{ membersModalClub.treasurer_filiere }}</div>
                <div class="bureau-contact" *ngIf="membersModalClub.treasurer_contact">📞 {{ membersModalClub.treasurer_contact }}</div>
              </div>

              <!-- Resp. Communication -->
              <div class="bureau-card card" *ngIf="membersModalClub.comm_lead_name">
                <div class="bureau-role-tag badge-com">Resp. Communication</div>
                <h4 class="bureau-name">{{ membersModalClub.comm_lead_name }}</h4>
                <div class="bureau-sub" *ngIf="membersModalClub.comm_lead_filiere">{{ membersModalClub.comm_lead_filiere }}</div>
                <div class="bureau-contact" *ngIf="membersModalClub.comm_lead_contact">📞 {{ membersModalClub.comm_lead_contact }}</div>
              </div>

            </div>

            <!-- ADDITIONAL FOUNDING MEMBERS -->
            <div class="additional-bureau-block mt-4" *ngIf="membersModalClub.additional_members && membersModalClub.additional_members.length > 0">
              <h4 class="bureau-sec-title">👥 Membres Fondateurs & Responsables de Pôles</h4>
              <div class="bureau-grid">
                <div *ngFor="let m of membersModalClub.additional_members" class="bureau-card card">
                  <div class="bureau-role-tag badge-additional">{{ m.role || 'Membre Fondateur' }}</div>
                  <h4 class="bureau-name">{{ m.name }}</h4>
                  <div class="bureau-sub" *ngIf="m.filiere">{{ m.filiere }}</div>
                  <div class="bureau-contact" *ngIf="m.contact">📞 {{ m.contact }}</div>
                </div>
              </div>
            </div>

            <!-- FACULTY ADVISOR -->
            <div class="advisor-box card mt-4" *ngIf="membersModalClub.faculty_advisor_name">
              <div class="advisor-icon">🎓</div>
              <div>
                <span class="advisor-lbl">Enseignant / Tuteur Référent :</span>
                <strong class="advisor-name">{{ membersModalClub.faculty_advisor_name }}</strong>
                <p class="advisor-text">
                  Supervise les orientations scientifiques, pédagogiques et déontologiques du club au sein de l'UPSSA.
                </p>
              </div>
            </div>

          </div>

          <!-- MODAL FOOTER -->
          <div class="modal-footer members-modal-footer">
            <div class="footer-left-tools">
              <button 
                type="button" 
                class="btn btn-outline btn-sm" 
                (click)="exportMembersCsv()" 
                [disabled]="membersList.length === 0"
                title="Télécharger la liste complète des membres au format CSV"
              >
                📥 Exporter (CSV)
              </button>
              <button 
                type="button" 
                class="btn btn-outline btn-sm" 
                (click)="printMembersList()" 
                title="Imprimer le registre des membres"
              >
                🖨️ Imprimer
              </button>
            </div>

            <div class="footer-right-actions">
              <a 
                [routerLink]="['/rejoindre', membersModalClub.id]" 
                class="btn btn-primary" 
                (click)="closeMembersModal()"
                title="Inscrire un nouvel étudiant"
              >
                ✍️ Rejoindre le Club
              </a>
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="openQrFromMembers()"
                title="Afficher le QR Code d'adhésion"
              >
                📲 QR Code
              </button>
              <button 
                type="button" 
                class="btn btn-outline" 
                (click)="closeMembersModal()"
              >
                Fermer
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ================= MODAL FICHE DÉTAILLÉE D'UN MEMBRE ================= -->
      <div class="modal-overlay" *ngIf="detailedMember && membersModalClub" (click)="closeMemberDetail()">
        <div class="modal-box modal-box-md card member-detail-modal-box" (click)="$event.stopPropagation()">
          
          <div class="modal-header">
            <div>
              <span class="modal-pill">UPSSA-MBR-{{ membersModalClub.id }}-{{ detailedMember.id }}</span>
              <h2 class="modal-title">Fiche d'Inscription Étudiant</h2>
              <span class="text-muted">{{ membersModalClub.official_name }} • Exercice 2026-2027</span>
            </div>
            <button type="button" class="close-btn" (click)="closeMemberDetail()" title="Fermer">✕</button>
          </div>

          <div class="modal-body detail-modal-body">
            
            <!-- STUDENT PROFILE HERO -->
            <div class="student-profile-banner" [ngClass]="getFacultyClass(detailedMember.filiere)">
              <div class="student-avatar-large">
                {{ getInitials(detailedMember.full_name) }}
              </div>
              <div class="student-hero-info">
                <span class="student-role-tag">Étudiant Adhérent Validé</span>
                <h3 class="student-hero-name">{{ detailedMember.full_name }}</h3>
                <div class="student-hero-tags">
                  <span class="hero-fac-tag">{{ detailedMember.filiere }}</span>
                  <span class="hero-year-tag">{{ detailedMember.academic_year }}</span>
                </div>
              </div>
            </div>

            <!-- REGISTRATION DETAILS GRID -->
            <div class="detail-fields-grid mt-3">
              
              <div class="detail-field-card">
                <span class="field-label">🎓 Faculté d'Études</span>
                <strong class="field-val">{{ detailedMember.filiere }}</strong>
              </div>

              <div class="detail-field-card">
                <span class="field-label">📅 Année Scolaire / Niveau</span>
                <strong class="field-val">{{ detailedMember.academic_year }}</strong>
              </div>

              <div class="detail-field-card">
                <span class="field-label">🏛️ Club Rejoint</span>
                <strong class="field-val">{{ membersModalClub.official_name }}</strong>
                <span class="field-sub">{{ membersModalClub.typology }}</span>
              </div>

              <div class="detail-field-card">
                <span class="field-label">🕒 Date & Heure d'Adhésion</span>
                <strong class="field-val">{{ detailedMember.joined_at | date:'dd/MM/yyyy à HH:mm' }}</strong>
                <span class="field-sub">Enregistrement numérique certifié</span>
              </div>

            </div>

            <!-- SURVEY FIELDS (LOISIRS, COMPÉTENCES, IDÉE DE PROJET) -->
            <div class="detail-survey-section mt-3">
              
              <div class="survey-block">
                <div class="survey-title-row">
                  <span class="survey-icon">🎨</span>
                  <strong class="survey-title">Loisir(s) & Passions :</strong>
                </div>
                <p class="survey-text">{{ detailedMember.loisir || 'Aucun loisir renseigné' }}</p>
              </div>

              <div class="survey-block mt-2">
                <div class="survey-title-row">
                  <span class="survey-icon">⚡</span>
                  <strong class="survey-title">Compétence(s) & Savoir-faire :</strong>
                </div>
                <p class="survey-text">{{ detailedMember.competence || 'Aucune compétence renseignée' }}</p>
              </div>

              <div class="survey-block mt-2 project-survey-block">
                <div class="survey-title-row">
                  <span class="survey-icon">💡</span>
                  <strong class="survey-title">Idée de Projet Proposée pour le Club :</strong>
                </div>
                <p class="survey-text project-quote">
                  {{ detailedMember.project_idea ? '« ' + detailedMember.project_idea + ' »' : 'Aucune idée particulière formulée lors de l\'adhésion.' }}
                </p>
              </div>

            </div>

            <!-- CONTACT DETAILS -->
            <div class="detail-contact-box mt-3" *ngIf="detailedMember.email || detailedMember.phone">
              <span class="contact-box-title">📬 Coordonnées de Contact</span>
              <div class="contact-box-row">
                <div class="contact-item" *ngIf="detailedMember.email">
                  <span class="c-lbl">Email Universitaire :</span>
                  <a [href]="'mailto:' + detailedMember.email" class="c-val">{{ detailedMember.email }}</a>
                </div>
                <div class="contact-item" *ngIf="detailedMember.phone">
                  <span class="c-lbl">Téléphone / WhatsApp :</span>
                  <a [href]="'tel:' + detailedMember.phone" class="c-val">{{ detailedMember.phone }}</a>
                </div>
              </div>
            </div>

          </div>

          <!-- MODAL FOOTER -->
          <div class="modal-footer detail-modal-footer">
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="downloadMemberPdf(detailedMember)"
              [disabled]="generatingPdfMemberId === detailedMember.id"
            >
              <span *ngIf="generatingPdfMemberId === detailedMember.id">Génération...</span>
              <span *ngIf="generatingPdfMemberId !== detailedMember.id">📄 Télécharger la Fiche d'Inscription (PDF)</span>
            </button>
            <button type="button" class="btn btn-secondary" (click)="printMemberDetail()">
              🖨️ Imprimer la Fiche
            </button>
            <button type="button" class="btn btn-outline" (click)="closeMemberDetail()">
              Fermer
            </button>
          </div>

        </div>
      </div>

      <!-- ================= MODAL D'ÉDITION ================= -->
      <div class="modal-overlay" *ngIf="editingClub" (click)="closeEditModal()">
        <div class="modal-box card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-pill">{{ editingClub.tracking_code }}</span>
              <h2 class="modal-title">Modifier le Club</h2>
            </div>
            <button type="button" class="close-btn" (click)="closeEditModal()" title="Fermer">✕</button>
          </div>

          <form (submit)="saveClubEdit()" class="modal-form">
            
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Nom officiel du club <span class="required">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.official_name" 
                  name="official_name" 
                  required
                >
              </div>
              <div class="form-group">
                <label class="form-label">Acronyme / Sigle</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.acronym" 
                  name="acronym"
                  placeholder="Ex: CSP, CART..."
                >
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Typologie <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="editForm.typology" name="typology" required>
                  <option *ngFor="let typ of typologies" [value]="typ">{{ typ }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Logo (URL de l'image)</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.logo_url" 
                  name="logo_url" 
                  placeholder="https://... ou /upssa-logo.png"
                >
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Slogan / Devise</label>
              <input 
                type="text" 
                class="form-control" 
                [(ngModel)]="editForm.slogan" 
                name="slogan"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Mission principale <span class="required">*</span></label>
              <textarea 
                rows="3" 
                class="form-control" 
                [(ngModel)]="editForm.main_mission" 
                name="main_mission" 
                required
              ></textarea>
            </div>

            <div class="form-section-subtitle">📅 Événement Phare</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Prochain événement phare</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.event1_title" 
                  name="event1_title"
                >
              </div>
              <div class="form-group">
                <label class="form-label">Date prévisionnelle</label>
                <input 
                  type="date" 
                  class="form-control" 
                  [(ngModel)]="editForm.event1_date" 
                  name="event1_date"
                >
              </div>
            </div>

            <div class="form-section-subtitle">👤 Bureau Exécutif & Tuteur</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Nom du Président(e) <span class="required">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.president_name" 
                  name="president_name" 
                  required
                >
              </div>
              <div class="form-group">
                <label class="form-label">Filière du Président(e)</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.president_filiere" 
                  name="president_filiere"
                >
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Email universitaire <span class="required">*</span></label>
                <input 
                  type="email" 
                  class="form-control" 
                  [(ngModel)]="editForm.president_email" 
                  name="president_email" 
                  required
                >
              </div>
              <div class="form-group">
                <label class="form-label">Téléphone</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.president_phone" 
                  name="president_phone"
                >
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Tuteur pédagogique (Faculty Advisor)</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="editForm.faculty_advisor_name" 
                  name="faculty_advisor_name"
                >
              </div>
              <div class="form-group">
                <label class="form-label">Budget prévisionnel annuel (MAD)</label>
                <input 
                  type="number" 
                  class="form-control" 
                  [(ngModel)]="editForm.annual_budget_mad" 
                  name="annual_budget_mad"
                >
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()" [disabled]="saving">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                <span *ngIf="!saving">💾 Enregistrer les modifications</span>
                <span *ngIf="saving">Enregistrement...</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- ================= MODAL DE SUPPRESSION ================= -->
      <div class="modal-overlay" *ngIf="deletingClub" (click)="closeDeleteModal()">
        <div class="modal-box modal-box-sm card" (click)="$event.stopPropagation()">
          <div class="delete-icon-wrap">
            🗑️
          </div>
          <h3 class="delete-title">Supprimer le Club</h3>
          <p class="delete-desc">
            Êtes-vous certain de vouloir supprimer définitivement le club 
            <strong>« {{ deletingClub.official_name }} »</strong> 
            (<code>{{ deletingClub.tracking_code }}</code>) ?
          </p>
          <div class="delete-warning">
            ⚠️ Cette action est irréversible et supprimera le club de la base de données.
          </div>

          <div class="modal-footer delete-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDeleteModal()" [disabled]="deleting">
              Annuler
            </button>
            <button type="button" class="btn btn-danger" (click)="confirmDeleteClub()" [disabled]="deleting">
              <span *ngIf="!deleting">🗑️ Confirmer la suppression</span>
              <span *ngIf="deleting">Suppression...</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .directory-page {
      padding: 2.5rem 0 4rem;
    }
    .directory-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .page-desc {
      color: var(--text-muted);
      margin-top: 0.35rem;
    }
    .filter-strip {
      padding: 1.25rem;
    }
    .chips-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .chip-btn {
      background: #f1f5f9;
      border: 1px solid transparent;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip-btn:hover {
      background: #e2e8f0;
      color: var(--secondary);
    }
    .chip-btn.active {
      background: var(--primary);
      color: #fff;
    }
    .clubs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.75rem;
    }
    .club-card-v2 {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 15px -3px rgba(0, 56, 68, 0.05), 0 2px 6px -2px rgba(0, 56, 68, 0.03);
      overflow: hidden;
    }
    .club-card-v2::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #009aa6 0%, #028090 50%, #003844 100%);
    }
    .club-card-v2:hover {
      transform: translateY(-5px);
      border-color: #009aa6;
      box-shadow: 0 16px 30px -6px rgba(0, 56, 68, 0.12), 0 4px 12px -2px rgba(0, 56, 68, 0.06);
    }

    /* Top Bar */
    .card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.1rem;
      flex-wrap: wrap;
    }
    .category-pill-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .cat-pill {
      background: #e6f6f7;
      color: #007a84;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.22rem 0.6rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: 1px solid rgba(0, 154, 166, 0.25);
    }
    .verified-accreditation-pill {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.18rem 0.5rem;
      border-radius: 9999px;
      letter-spacing: 0.02em;
    }
    .members-count-pill {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.22rem 0.6rem;
      border-radius: 9999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.2s ease;
    }
    .members-count-pill strong {
      color: #0f172a;
      font-weight: 800;
    }
    .members-count-pill:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: scale(1.03);
    }

    /* Identity Row */
    .card-identity-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 0.9rem;
    }
    .card-avatar-box {
      width: 58px;
      height: 58px;
      border-radius: 14px;
      overflow: hidden;
      border: 1.5px solid #e2e8f0;
      flex-shrink: 0;
      background: #f8fafc;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .club-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .club-avatar-fallback {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #e6f6f7 0%, #cffafe 100%);
      color: #007a84;
      font-weight: 800;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -0.02em;
    }
    .card-title-group {
      flex: 1;
      min-width: 0;
    }
    .card-club-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #003844;
      line-height: 1.3;
      margin-bottom: 0.35rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-badges-sub {
      display: flex;
      gap: 0.4rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .acronym-tag {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 700;
      font-size: 0.72rem;
      padding: 0.1rem 0.45rem;
      border-radius: 6px;
      letter-spacing: 0.03em;
    }
    .tracking-code-tag {
      background: #f8fafc;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    /* Slogan & Mission */
    .card-body-content {
      margin-bottom: 0.95rem;
    }
    .club-slogan-styled {
      font-style: italic;
      color: #028090;
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 0.5rem;
      padding-left: 0.5rem;
      border-left: 2.5px solid #009aa6;
    }
    .quote-mark {
      font-size: 1rem;
      color: #009aa6;
      font-weight: 800;
    }
    .club-mission-text {
      font-size: 0.86rem;
      color: #334155;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Event Banner */
    .card-event-banner {
      background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%);
      border: 1px solid #ccfbf1;
      border-radius: 12px;
      padding: 0.65rem 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.95rem;
    }
    .event-icon-badge {
      font-size: 1.1rem;
      background: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }
    .event-details {
      flex: 1;
      min-width: 0;
    }
    .event-pre-label {
      display: block;
      font-size: 0.66rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #0d9488;
    }
    .event-title-text {
      display: block;
      font-size: 0.84rem;
      color: #003844;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Supervision Grid */
    .card-supervision-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 0.75rem;
      margin-top: auto;
      margin-bottom: 1rem;
    }
    .sup-item {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .sup-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.15rem;
    }
    .sup-name {
      font-size: 0.82rem;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 700;
    }
    .sup-sub {
      font-size: 0.72rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Primary Actions */
    .card-primary-actions {
      display: grid;
      grid-template-columns: 1.4fr 1fr 0.9fr;
      gap: 0.45rem;
      margin-bottom: 0.85rem;
    }
    .btn-cta-join {
      background: linear-gradient(135deg, #009aa6 0%, #028090 100%);
      color: #ffffff;
      padding: 0.55rem 0.75rem;
      border-radius: 10px;
      font-size: 0.84rem;
      font-weight: 700;
      text-align: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      box-shadow: 0 2px 6px rgba(0, 154, 166, 0.25);
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn-cta-join:hover {
      background: linear-gradient(135deg, #00828c 0%, #003844 100%);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0, 154, 166, 0.35);
    }
    .btn-action-outline {
      padding: 0.55rem 0.6rem;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      transition: all 0.15s ease;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-action-outline.btn-sheet {
      background: #f0fdf4;
      border: 1.5px solid #10b981;
      color: #047857;
    }
    .btn-action-outline.btn-sheet:hover {
      background: #10b981;
      color: #ffffff;
      transform: translateY(-1px);
    }
    .btn-action-outline.btn-qr {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      color: #334155;
    }
    .btn-action-outline.btn-qr:hover {
      background: #003844;
      border-color: #003844;
      color: #ffffff;
      transform: translateY(-1px);
    }

    /* Management Bottom Strip */
    .card-bottom-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px dashed #e2e8f0;
    }
    .contact-email-btn {
      color: #009aa6;
      font-size: 0.76rem;
      font-weight: 700;
      background: #f0fdfe;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      border: 1px solid rgba(0, 154, 166, 0.2);
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      text-decoration: none;
    }
    .contact-email-btn:hover {
      background: #009aa6;
      color: #ffffff;
    }
    .mgmt-actions-group {
      display: flex;
      gap: 0.35rem;
    }
    .btn-mgmt {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 6px;
      padding: 0.25rem 0.55rem;
      font-size: 0.74rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .btn-mgmt.btn-edit:hover {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
    }
    .btn-mgmt.btn-delete:hover {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #b91c1c;
    }

    /* Toast banner */
    .toast-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--success-bg);
      border: 1px solid var(--success-border);
      color: var(--success);
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-sm);
      animation: fadeIn 0.2s ease;
    }
    .toast-banner.toast-error {
      background: var(--danger-bg);
      border-color: var(--danger-border);
      color: var(--danger);
    }
    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.92rem;
      font-weight: 600;
    }
    .toast-icon {
      font-size: 1.1rem;
    }
    .toast-close {
      background: transparent;
      border: none;
      font-size: 1rem;
      color: inherit;
      opacity: 0.7;
      cursor: pointer;
    }
    .toast-close:hover {
      opacity: 1;
    }

    /* Modal System */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.15s ease;
    }
    .modal-box {
      width: 100%;
      max-width: 780px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease;
    }
    .modal-box-sm {
      max-width: 480px;
      text-align: center;
      padding: 2.25rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .modal-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-light);
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }
    .modal-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .close-btn {
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }
    .close-btn:hover {
      background: #e2e8f0;
      color: var(--secondary);
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-section-subtitle {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin: 1.25rem 0 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.35rem;
    }
    .modal-footer {
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .modal-box-lg {
      max-width: 960px;
      width: 100%;
    }

    /* Members Modal Specific */
    .members-modal-header {
      align-items: center;
    }
    .header-club-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-avatar {
      width: 54px;
      height: 54px;
      border-radius: 12px;
      overflow: hidden;
      border: 1.5px solid var(--border-color);
      flex-shrink: 0;
      background: #f8fafc;
    }
    .header-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .modal-badge-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .modal-typ-tag {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.74rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }
    .modal-sub-slogan {
      font-style: italic;
      color: #64748b;
      font-size: 0.85rem;
      margin-top: 0.2rem;
    }
    .header-right-tools {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .members-total-counter {
      background: var(--primary-light);
      border: 1px solid var(--info-border);
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      text-align: right;
    }
    .counter-num {
      display: block;
      font-weight: 800;
      color: var(--primary);
      font-size: 0.95rem;
      line-height: 1.2;
    }
    .counter-label {
      font-size: 0.7rem;
      color: #475569;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    /* Tabs Bar */
    .members-tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 1.25rem;
      padding-bottom: 0.15rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      padding: 0.6rem 1rem;
      font-size: 0.92rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease;
      margin-bottom: -2px;
    }
    .tab-btn:hover {
      color: var(--primary);
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .tab-count-badge {
      background: var(--primary-light);
      color: var(--primary);
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .tab-btn.active .tab-count-badge {
      background: var(--primary);
      color: #ffffff;
    }

    /* Controls Strip (Search & Faculty Filters) */
    .members-controls-strip {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .members-search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 0.85rem;
      font-size: 0.9rem;
      color: #94a3b8;
      pointer-events: none;
    }
    .members-search-input {
      padding-left: 2.35rem;
      padding-right: 2rem;
    }
    .search-clear-btn {
      position: absolute;
      right: 0.75rem;
      background: #e2e8f0;
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 0.75rem;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .faculty-filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .fac-pill {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .fac-pill:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .fac-pill.active {
      background: var(--secondary);
      color: #ffffff;
      border-color: var(--secondary);
    }
    .fac-pill.pill-sante.active {
      background: #009aa6;
      border-color: #00828c;
      color: #ffffff;
    }
    .fac-pill.pill-ingenierie.active {
      background: #4f46e5;
      border-color: #4338ca;
      color: #ffffff;
    }
    .fac-pill.pill-business.active {
      background: #d97706;
      border-color: #b45309;
      color: #ffffff;
    }

    /* Members Loading & Empty States */
    .members-loading {
      text-align: center;
      padding: 2.5rem 1rem;
      color: #64748b;
    }
    .members-loading .spinner {
      margin: 0 auto 0.75rem;
    }
    .members-empty-state {
      text-align: center;
      padding: 2.5rem 1.5rem;
    }
    .empty-icon-wrap {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .empty-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.35rem;
    }
    .empty-desc {
      color: #64748b;
      font-size: 0.88rem;
      max-width: 480px;
      margin: 0 auto 1.25rem;
      line-height: 1.5;
    }
    .empty-actions {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
    }

    /* Members Grid */
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1rem;
      max-height: 520px;
      overflow-y: auto;
      padding: 0.25rem;
    }
    .member-detail-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
    }
    .member-detail-card:hover {
      border-color: #99e2e6;
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .member-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 0.65rem;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 0.65rem;
    }
    .member-avatar-badge {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.95rem;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
    }
    .member-avatar-badge.fac-sante {
      background: linear-gradient(135deg, #009aa6 0%, #028090 100%);
    }
    .member-avatar-badge.fac-ingenierie {
      background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
    }
    .member-avatar-badge.fac-business {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
    .member-avatar-badge.fac-default {
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    }

    .member-primary-info {
      flex: 1;
      min-width: 0;
    }
    .member-name {
      font-size: 1rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .member-fac-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: center;
    }
    .fac-tag {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .fac-tag.fac-sante {
      background: #e6f6f7;
      color: #007a84;
      border: 1px solid #b2e6ea;
    }
    .fac-tag.fac-ingenierie {
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
    }
    .fac-tag.fac-business {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .fac-tag.fac-default {
      background: #f1f5f9;
      color: #475569;
    }
    .year-tag {
      font-size: 0.7rem;
      font-weight: 600;
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
    }
    .member-join-date {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      white-space: nowrap;
    }
    .member-meta-top {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .member-id-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-light);
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .member-actions-row {
      display: flex;
      gap: 0.5rem;
      padding-top: 0.65rem;
      border-top: 1px dashed #e2e8f0;
      margin-top: auto;
    }
    .btn-member-pdf {
      flex: 1;
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 0.4rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 154, 166, 0.2);
    }
    .btn-member-pdf:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }
    .btn-member-pdf:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn-member-detail {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      transition: all 0.15s ease;
    }
    .btn-member-detail:hover {
      background: #e2e8f0;
      color: var(--secondary);
      border-color: #94a3b8;
    }

    /* Member Detail Modal Specific */
    .modal-box-md {
      max-width: 680px;
      width: 100%;
    }
    .member-detail-modal-box {
      padding: 2rem;
    }
    .detail-modal-body {
      padding: 0.5rem 0;
    }
    .student-profile-banner {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-md);
      color: #ffffff;
    }
    .student-profile-banner.fac-sante {
      background: linear-gradient(135deg, #009aa6 0%, #005668 100%);
    }
    .student-profile-banner.fac-ingenierie {
      background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
    }
    .student-profile-banner.fac-business {
      background: linear-gradient(135deg, #d97706 0%, #78350f 100%);
    }
    .student-profile-banner.fac-default {
      background: linear-gradient(135deg, #003844 0%, #00222a 100%);
    }
    .student-avatar-large {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 800;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
    .student-role-tag {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 700;
    }
    .student-hero-name {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0.15rem 0 0.35rem;
      color: #ffffff;
    }
    .student-hero-tags {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .hero-fac-tag {
      background: rgba(255, 255, 255, 0.25);
      padding: 0.15rem 0.6rem;
      border-radius: 4px;
      font-size: 0.76rem;
      font-weight: 700;
    }
    .hero-year-tag {
      background: rgba(0, 0, 0, 0.2);
      padding: 0.15rem 0.6rem;
      border-radius: 4px;
      font-size: 0.76rem;
      font-weight: 600;
    }

    .detail-fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .detail-field-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      padding: 0.85rem;
      border-radius: var(--radius-sm);
    }
    .field-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.2rem;
    }
    .field-val {
      display: block;
      font-size: 0.95rem;
      color: var(--secondary);
    }
    .field-sub {
      display: block;
      font-size: 0.74rem;
      color: #64748b;
      margin-top: 0.15rem;
    }

    .detail-survey-section {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 1rem;
    }
    .survey-block {
      padding: 0.4rem 0;
    }
    .survey-title-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.25rem;
    }
    .survey-title {
      font-size: 0.85rem;
      color: var(--secondary);
    }
    .survey-text {
      font-size: 0.88rem;
      color: #334155;
      margin: 0;
      line-height: 1.45;
    }
    .project-survey-block {
      border-left: 3px solid var(--primary);
      padding-left: 0.85rem;
      background: #f0fafb;
      border-radius: 0 4px 4px 0;
      padding-top: 0.6rem;
      padding-bottom: 0.6rem;
      margin-top: 0.5rem;
    }
    .project-quote {
      font-style: italic;
      color: #0f172a;
      font-weight: 500;
    }

    .detail-contact-box {
      background: #f8fafc;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
    }
    .contact-box-title {
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.4rem;
    }
    .contact-box-row {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .contact-item {
      font-size: 0.82rem;
    }
    .c-lbl {
      color: #64748b;
      margin-right: 0.35rem;
    }
    .c-val {
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
    }
    .c-val:hover {
      text-decoration: underline;
    }
    .detail-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
      margin-top: 1.25rem;
    }

    .member-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.84rem;
      flex: 1;
    }
    .member-info-row {
      line-height: 1.45;
    }
    .info-label {
      font-weight: 700;
      color: var(--secondary);
      margin-right: 0.35rem;
    }
    .info-val {
      color: #334155;
    }
    .member-project-box {
      background: #f8fafc;
      border-left: 3px solid var(--primary);
      padding: 0.45rem 0.65rem;
      border-radius: 0 6px 6px 0;
      margin-top: 0.3rem;
    }
    .project-tag {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.15rem;
    }
    .project-text {
      font-style: italic;
      color: #334155;
      font-size: 0.82rem;
      line-height: 1.4;
      margin: 0;
    }
    .member-contact-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-top: 0.65rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #e2e8f0;
      font-size: 0.78rem;
    }
    .contact-link {
      color: #64748b;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      transition: color 0.15s;
    }
    .contact-link:hover {
      color: var(--primary);
      text-decoration: underline;
    }

    /* Bureau Tab Specific */
    .bureau-leader-card {
      background: linear-gradient(135deg, #003844 0%, #005668 100%);
      color: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-md);
      position: relative;
    }
    .leader-badge-top {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(4px);
      color: #ffffff;
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .leader-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .leader-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    }
    .leader-role {
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a5f3fc;
      font-weight: 700;
    }
    .leader-name {
      font-size: 1.3rem;
      font-weight: 800;
      margin: 0.15rem 0 0.35rem;
      color: #ffffff;
    }
    .leader-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.82rem;
      color: #e2e8f0;
    }
    .bureau-sec-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.75rem;
    }
    .bureau-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.85rem;
    }
    .bureau-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      padding: 0.9rem;
      border-radius: var(--radius-sm);
    }
    .bureau-role-tag {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 0.35rem;
    }
    .badge-vp {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .badge-sg {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .badge-tres {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-com {
      background: #fdf2f8;
      color: #be185d;
      border: 1px solid #fbcfe8;
    }
    .badge-additional {
      background: #f8fafc;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .bureau-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.2rem;
    }
    .bureau-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 0.3rem;
    }
    .bureau-contact {
      font-size: 0.76rem;
      color: #0284c7;
    }
    .advisor-box {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      background: #f8fafc;
      border-left: 4px solid var(--accent);
      padding: 1rem 1.25rem;
    }
    .advisor-icon {
      font-size: 1.8rem;
    }
    .advisor-lbl {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      display: block;
    }
    .advisor-name {
      font-size: 1.05rem;
      color: var(--secondary);
      display: block;
      margin: 0.15rem 0;
    }
    .advisor-text {
      font-size: 0.84rem;
      color: #475569;
      margin: 0;
    }

    /* Members Modal Footer */
    .members-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .footer-left-tools {
      display: flex;
      gap: 0.5rem;
    }
    .footer-right-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* QR Modal Specific */
    .qr-modal-box {
      text-align: center;
    }
    .qr-content-area {
      padding: 0.5rem 0;
    }
    .qr-frame {
      background: #ffffff;
      border: 3px solid var(--primary);
      border-radius: 16px;
      padding: 1rem;
      display: inline-block;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-md);
    }
    .qr-img {
      width: 220px;
      height: 220px;
      display: block;
    }
    .qr-loading {
      width: 220px;
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 0.85rem;
    }
    .qr-club-name {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.4rem;
    }
    .qr-subtext {
      color: #475569;
      font-size: 0.88rem;
      line-height: 1.45;
      margin-bottom: 1rem;
    }
    .qr-url-box {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .qr-url-input {
      flex: 1;
      padding: 0.45rem 0.75rem;
      font-size: 0.82rem;
      font-family: 'JetBrains Mono', monospace;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: #f8fafc;
      color: #475569;
    }
    .btn-copy-url {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.45rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .qr-modal-footer {
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Delete modal specific */
    .delete-icon-wrap {
      font-size: 2.75rem;
      margin-bottom: 0.75rem;
    }
    .delete-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--danger);
      margin-bottom: 0.5rem;
    }
    .delete-desc {
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .delete-warning {
      background: var(--danger-bg);
      border: 1px solid var(--danger-border);
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .delete-footer {
      justify-content: center;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 680px) {
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
      .directory-header {
        flex-direction: column;
      }
    }
  `]
})
export class ClubDirectoryComponent implements OnInit {
  approvedClubs: ClubApplication[] = [];
  filteredClubs: ClubApplication[] = [];
  selectedTypology = 'ALL';
  searchQuery = '';

  typologies = [
    'Académique / Scientifique & Médical',
    'Culturel & Artistique',
    'Sport & Bien-être',
    'Citoyenneté, Humanitaire & RSE',
    'Entrepreneuriat, Débat & Innovation'
  ];

  // Edit State
  editingClub: ClubApplication | null = null;
  editForm: Partial<ClubApplication> = {};
  saving = false;

  // Delete State
  deletingClub: ClubApplication | null = null;
  deleting = false;

  // QR Modal State
  qrModalClub: ClubApplication | null = null;
  qrModalDataUrl = '';
  qrModalUrl = '';
  copiedQrLink = false;

  // Members Modal State
  membersModalClub: ClubApplication | null = null;
  membersList: ClubMember[] = [];
  filteredMembersList: ClubMember[] = [];
  loadingMembers = false;
  activeMembersTab: 'adherents' | 'bureau' = 'adherents';
  membersSearchQuery = '';
  selectedFacultyFilter = 'ALL';

  // Individual Member Detail Modal State
  detailedMember: ClubMember | null = null;
  generatingPdfMemberId: number | null = null;
  generatingAllPdf = false;
  downloadingSheetClubId: number | null = null;

  // Feedback Notification
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  private notifTimer: any = null;

  constructor(
    private clubService: ClubService,
    private qrService: QrService,
    private pdfService: PdfService
  ) { }

  async downloadClubSheet(club: ClubApplication): Promise<void> {
    if (!club || this.downloadingSheetClubId === club.id) return;
    this.downloadingSheetClubId = club.id || -1;
    try {
      await this.pdfService.generateClubSheetPdf(club, true);
      this.showNotification(`Fiche d'agrément officielle du club « ${club.official_name} » téléchargée avec succès.`);
    } catch (err) {
      console.error('Erreur téléchargement fiche club:', err);
      this.showNotification('Erreur lors de la génération de la fiche PDF.', 'error');
    } finally {
      this.downloadingSheetClubId = null;
    }
  }

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.clubService.getClubs().subscribe({
      next: (clubs) => {
        // Show approved clubs, or if none approved yet, show all active
        const approved = clubs.filter(c => c.status === 'APPROUVE');
        this.approvedClubs = approved.length > 0 ? approved : clubs;
        this.filterClubs();
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
        this.showNotification('Impossible de charger la liste des clubs.', 'error');
      }
    });
  }

  selectTypology(typ: string): void {
    this.selectedTypology = typ;
    this.filterClubs();
  }

  filterClubs(): void {
    this.filteredClubs = this.approvedClubs.filter(c => {
      const matchTyp = this.selectedTypology === 'ALL' || c.typology === this.selectedTypology;
      const q = this.searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        c.official_name.toLowerCase().includes(q) ||
        (c.acronym && c.acronym.toLowerCase().includes(q)) ||
        c.main_mission.toLowerCase().includes(q);
      return matchTyp && matchQuery;
    });
  }

  // QR Code Methods
  async openQrModal(club: ClubApplication): Promise<void> {
    this.qrModalClub = club;
    this.qrModalUrl = this.qrService.getJoinUrl(club.id!);
    this.copiedQrLink = false;
    this.qrModalDataUrl = await this.qrService.generateDataUrl(this.qrModalUrl, 260);
  }

  closeQrModal(): void {
    this.qrModalClub = null;
    this.qrModalDataUrl = '';
    this.qrModalUrl = '';
  }

  copyQrLink(): void {
    if (this.qrModalUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.qrModalUrl);
      this.copiedQrLink = true;
      setTimeout(() => this.copiedQrLink = false, 2500);
    }
  }

  // Edit Methods
  openEditModal(club: ClubApplication): void {
    this.editingClub = club;
    this.editForm = {
      official_name: club.official_name,
      acronym: club.acronym || '',
      typology: club.typology,
      logo_url: club.logo_url || '',
      slogan: club.slogan || '',
      main_mission: club.main_mission,
      event1_title: club.event1_title || '',
      event1_date: club.event1_date || '',
      president_name: club.president_name,
      president_filiere: club.president_filiere,
      president_email: club.president_email,
      president_phone: club.president_phone || '',
      faculty_advisor_name: club.faculty_advisor_name || '',
      annual_budget_mad: club.annual_budget_mad || 0
    };
  }

  closeEditModal(): void {
    this.editingClub = null;
    this.editForm = {};
  }

  saveClubEdit(): void {
    if (!this.editingClub || !this.editingClub.id) return;
    if (!this.editForm.official_name?.trim() || !this.editForm.main_mission?.trim() || !this.editForm.president_name?.trim()) {
      this.showNotification('Veuillez remplir les champs obligatoires (Nom, Mission, Président).', 'error');
      return;
    }

    this.saving = true;
    this.clubService.updateClub(this.editingClub.id, this.editForm).subscribe({
      next: (res) => {
        this.saving = false;
        // Update local clubs array
        const idx = this.approvedClubs.findIndex(c => c.id === this.editingClub!.id);
        if (idx !== -1) {
          this.approvedClubs[idx] = { ...this.approvedClubs[idx], ...res.club };
          this.filterClubs();
        }
        this.showNotification(`Le club « ${res.club.official_name} » a été modifié avec succès.`);
        this.closeEditModal();
      },
      error: (err) => {
        this.saving = false;
        console.error('Error updating club:', err);
        this.showNotification('Erreur lors de la modification du club.', 'error');
      }
    });
  }

  // Delete Methods
  openDeleteModal(club: ClubApplication): void {
    this.deletingClub = club;
  }

  closeDeleteModal(): void {
    this.deletingClub = null;
  }

  confirmDeleteClub(): void {
    if (!this.deletingClub || !this.deletingClub.id) return;

    const clubName = this.deletingClub.official_name;
    const clubId = this.deletingClub.id;

    this.deleting = true;
    this.clubService.deleteClub(clubId).subscribe({
      next: () => {
        this.deleting = false;
        // Remove from list
        this.approvedClubs = this.approvedClubs.filter(c => c.id !== clubId);
        this.filterClubs();
        this.showNotification(`Le club « ${clubName} » a été supprimé de l'annuaire.`);
        this.closeDeleteModal();
      },
      error: (err) => {
        this.deleting = false;
        console.error('Error deleting club:', err);
        this.showNotification('Erreur lors de la suppression du club.', 'error');
      }
    });
  }

  // Members Modal Methods
  openMembersModal(club: ClubApplication): void {
    this.membersModalClub = club;
    this.activeMembersTab = 'adherents';
    this.membersSearchQuery = '';
    this.selectedFacultyFilter = 'ALL';
    this.loadingMembers = true;
    this.membersList = [];
    this.filteredMembersList = [];

    this.clubService.getMembers(club.id!).subscribe({
      next: (members) => {
        this.membersList = members || [];
        this.filterMembers();
        this.loadingMembers = false;
        // Keep counter in sync
        club.members_count = this.membersList.length;
      },
      error: (err) => {
        console.error('Error fetching members:', err);
        this.loadingMembers = false;
        this.showNotification('Impossible de charger les membres du club.', 'error');
      }
    });
  }

  closeMembersModal(): void {
    this.membersModalClub = null;
    this.membersList = [];
    this.filteredMembersList = [];
    this.membersSearchQuery = '';
  }

  openQrFromMembers(): void {
    if (!this.membersModalClub) return;
    const c = this.membersModalClub;
    this.closeMembersModal();
    this.openQrModal(c);
  }

  setFacultyFilter(fac: string): void {
    this.selectedFacultyFilter = fac;
    this.filterMembers();
  }

  resetMemberFilters(): void {
    this.membersSearchQuery = '';
    this.selectedFacultyFilter = 'ALL';
    this.filterMembers();
  }

  filterMembers(): void {
    const q = this.membersSearchQuery.toLowerCase().trim();
    this.filteredMembersList = this.membersList.filter(m => {
      const matchFaculty = this.selectedFacultyFilter === 'ALL' || m.filiere === this.selectedFacultyFilter;
      const matchQuery = !q ||
        (m.full_name && m.full_name.toLowerCase().includes(q)) ||
        (m.filiere && m.filiere.toLowerCase().includes(q)) ||
        (m.academic_year && m.academic_year.toLowerCase().includes(q)) ||
        (m.loisir && m.loisir.toLowerCase().includes(q)) ||
        (m.competence && m.competence.toLowerCase().includes(q)) ||
        (m.project_idea && m.project_idea.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q));
      return matchFaculty && matchQuery;
    });
  }

  countByFaculty(faculty: string): number {
    return this.membersList.filter(m => m.filiere === faculty).length;
  }

  getInitials(name: string): string {
    if (!name) return 'UP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getFacultyClass(filiere: string): string {
    if (!filiere) return 'fac-default';
    if (filiere.includes('Santé') || filiere.includes('Médecine') || filiere.includes('Pharmacie')) return 'fac-sante';
    if (filiere.includes('Ingénierie') || filiere.includes('Génie')) return 'fac-ingenierie';
    if (filiere.includes('Business') || filiere.includes('Management')) return 'fac-business';
    return 'fac-default';
  }

  getCategoryIcon(typology: string): string {
    if (!typology) return '🏛️';
    const t = typology.toLowerCase();
    if (t.includes('médical') || t.includes('santé') || t.includes('scientifique') || t.includes('académique')) return '🩺';
    if (t.includes('sport') || t.includes('bien-être')) return '⚽';
    if (t.includes('culture') || t.includes('artistique') || t.includes('art')) return '🎨';
    if (t.includes('citoyen') || t.includes('humanitaire') || t.includes('rse')) return '🤝';
    if (t.includes('entrepreneuriat') || t.includes('tech') || t.includes('innovation') || t.includes('débat')) return '💡';
    return '🎓';
  }

  exportMembersCsv(): void {
    if (!this.membersModalClub || this.membersList.length === 0) return;
    const headers = ['Nom & Prénom', 'Faculté', 'Année Scolaire / Niveau', 'Loisirs', 'Compétences', 'Idée de projet', 'Email', 'Téléphone', 'Date adhésion'];
    const rows = this.membersList.map(m => [
      `"${(m.full_name || '').replace(/"/g, '""')}"`,
      `"${(m.filiere || '').replace(/"/g, '""')}"`,
      `"${(m.academic_year || '').replace(/"/g, '""')}"`,
      `"${(m.loisir || '').replace(/"/g, '""')}"`,
      `"${(m.competence || '').replace(/"/g, '""')}"`,
      `"${(m.project_idea || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.phone || '').replace(/"/g, '""')}"`,
      `"${m.joined_at || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `Membres_${(this.membersModalClub.acronym || this.membersModalClub.official_name).replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    this.showNotification(`Export CSV téléchargé : ${filename}`);
  }

  printMembersList(): void {
    window.print();
  }

  downloadPaperFormPdf(): void {
    this.pdfService.generateBlankClubCreationFormPdf(true)
      .then(() => {
        this.showNotification('Dossier officiel de création (version papier A4) téléchargé avec succès !');
      })
      .catch((err) => {
        console.error('Error generating paper PDF:', err);
        this.showNotification('Erreur lors du téléchargement du formulaire papier.', 'error');
      });
  }

  downloadAllMembersPdf(): void {
    if (!this.membersModalClub || this.membersList.length === 0) return;
    this.generatingAllPdf = true;
    this.pdfService.generateClubMembersListPdf(this.membersModalClub, this.membersList, true)
      .then(() => {
        this.generatingAllPdf = false;
        this.showNotification(`Registre officiel des inscriptions généré en PDF pour « ${this.membersModalClub?.official_name} »`);
      })
      .catch((err) => {
        this.generatingAllPdf = false;
        console.error('Error generating members list PDF:', err);
        this.showNotification('Erreur lors de la génération du registre PDF.', 'error');
      });
  }

  // Individual Member PDF & Detail Modal
  downloadMemberPdf(member: ClubMember): void {
    if (!this.membersModalClub) return;
    this.generatingPdfMemberId = member.id || null;
    this.pdfService.generateMembershipPdf(this.membersModalClub, member, true)
      .then(() => {
        this.generatingPdfMemberId = null;
        this.showNotification(`Fiche officielle d'inscription générée pour ${member.full_name}`);
      })
      .catch((err) => {
        this.generatingPdfMemberId = null;
        console.error('Error generating PDF:', err);
        this.showNotification('Erreur lors de la génération du PDF.', 'error');
      });
  }

  viewMemberDetail(member: ClubMember): void {
    this.detailedMember = member;
  }

  closeMemberDetail(): void {
    this.detailedMember = null;
  }

  printMemberDetail(): void {
    window.print();
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success'): void {
    this.notificationMessage = msg;
    this.notificationType = type;
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notifTimer = setTimeout(() => {
      this.notificationMessage = '';
    }, 4500);
  }
}
