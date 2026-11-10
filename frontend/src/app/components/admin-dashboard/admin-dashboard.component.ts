import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from '../../services/club.service';
import { PdfService } from '../../services/pdf.service';
import { ClubApplication, ClubStatus, DashboardStats } from '../../models/club.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  clubs: ClubApplication[] = [];
  filteredClubs: ClubApplication[] = [];
  stats: DashboardStats | null = null;
  loading = false;

  selectedClub: ClubApplication | null = null;
  reviewStatus: ClubStatus = 'APPROUVE';
  reviewNotes = '';
  reviewerName = 'Commission de la Vie Étudiante';
  isUpdating = false;
  isGeneratingPdf = false;
  successNotice = '';

  // Filters
  filterStatus = 'ALL';
  filterTypology = 'ALL';
  searchQuery = '';

  typologies = [
    'Académique / Scientifique & Médical',
    'Culturel & Artistique',
    'Sport & Bien-être',
    'Citoyenneté, Humanitaire & RSE',
    'Entrepreneuriat, Débat & Innovation'
  ];

  constructor(
    private clubService: ClubService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.clubService.getStats().subscribe({
      next: (s) => (this.stats = s),
      error: (e) => console.error('Stats error:', e)
    });

    this.clubService.getClubs(this.filterStatus, this.filterTypology, this.searchQuery).subscribe({
      next: (data) => {
        this.clubs = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Fetch clubs error:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadData();
  }

  resetFilters(): void {
    this.filterStatus = 'ALL';
    this.filterTypology = 'ALL';
    this.searchQuery = '';
    this.loadData();
  }

  openReviewModal(club: ClubApplication): void {
    this.selectedClub = club;
    this.reviewStatus = (club.status as ClubStatus) || 'EN_COURS_DE_REVUE';
    this.reviewNotes = club.admin_notes || '';
    this.reviewerName = club.reviewed_by || 'Commission de la Vie Étudiante';
    this.successNotice = '';

    const targetId = club.id || club.tracking_code;
    if (targetId) {
      this.clubService.getClubById(targetId).subscribe({
        next: (fullClub) => {
          this.selectedClub = fullClub;
          if (fullClub.status) {
            this.reviewStatus = fullClub.status;
          }
        },
        error: (err) => {
          console.warn('Could not load full club details, using summary:', err);
        }
      });
    }
  }

  closeModal(): void {
    this.selectedClub = null;
    this.successNotice = '';
  }

  saveDecision(): void {
    if (!this.selectedClub) return;
    const targetId = this.selectedClub.id || this.selectedClub.tracking_code;
    if (!targetId) return;

    this.isUpdating = true;
    this.clubService.updateStatus(
      targetId,
      this.reviewStatus,
      this.reviewNotes,
      this.reviewerName
    ).subscribe({
      next: async (res) => {
        this.isUpdating = false;
        this.selectedClub = res.club;
        this.loadData();

        if (this.reviewStatus === 'APPROUVE') {
          this.successNotice = 'Club approuvé et agréé avec succès ! La Fiche Officielle du Club a été générée et téléchargée.';
          try {
            await this.pdfService.generateClubSheetPdf(res.club, true);
          } catch (pdfErr) {
            console.warn('PDF club sheet generation warning:', pdfErr);
          }
        } else {
          this.successNotice = 'Décision enregistrée avec succès !';
        }
      },
      error: (err) => {
        this.isUpdating = false;
        alert('Erreur lors de la sauvegarde : ' + (err.error?.error || err.message));
      }
    });
  }

  async downloadClubSheet(club?: ClubApplication | null): Promise<void> {
    const target = club || this.selectedClub;
    if (!target || this.isGeneratingPdf) return;
    this.isGeneratingPdf = true;
    try {
      await this.pdfService.generateClubSheetPdf(target, true);
    } catch (err) {
      console.error('Erreur génération fiche du club:', err);
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  deleteApplication(id?: number | string): void {
    const targetId = id || this.selectedClub?.id || this.selectedClub?.tracking_code;
    if (!targetId) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce dossier ?')) {
      this.clubService.deleteClub(targetId).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: (err) => alert('Erreur lors de la suppression : ' + (err.error?.error || err.message))
      });
    }
  }

  getStatusBadgeClass(status?: string): string {
    return 'badge-' + (status || 'SOUMIS');
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'SOUMIS': return 'Soumis';
      case 'EN_COURS_DE_REVUE': return 'En instruction';
      case 'APPROUVE': return 'Validé / Agréé';
      case 'REFUSE': return 'Refusé';
      case 'RETOUCHE_DEMANDEE': return 'Retouche requise';
      default: return status || 'Inconnu';
    }
  }

  printDossier(): void {
    window.print();
  }

  exportMembersCsv(): void {
    if (!this.selectedClub || !this.selectedClub.members || this.selectedClub.members.length === 0) return;
    const headers = ['Nom & Prénom', 'Faculté', 'Niveau', 'Loisirs', 'Compétences', 'Idée de projet', 'Email', 'Téléphone', 'Date adhésion'];
    const rows = this.selectedClub.members.map(m => [
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
    link.download = `Membres_${(this.selectedClub.acronym || this.selectedClub.official_name).replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

