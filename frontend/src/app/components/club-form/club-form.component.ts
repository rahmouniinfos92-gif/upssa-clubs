import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClubService } from '../../services/club.service';
import { QrService } from '../../services/qr.service';
import { ClubApplication, ClubTypology, MeetingFrequency, AdditionalMember } from '../../models/club.model';

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './club-form.component.html',
  styleUrls: ['./club-form.component.css']
})
export class ClubFormComponent {
  currentStep = 1;
  isSubmitting = false;
  submissionSuccess = false;
  trackingCode = '';
  errorMessage = '';
  copiedCode = false;
  uploadingLogo = false;

  createdClub: ClubApplication | null = null;
  joinQrDataUrl = '';
  joinUrl = '';

  steps = [
    { number: 1, title: 'Identité', subtitle: 'Nom & Typologie', icon: '🏷️' },
    { number: 2, title: 'Bureau Exécutif', subtitle: 'Membres & Rôles', icon: '👥' },
    { number: 3, title: 'Vision & Valeurs', subtitle: 'Mission & KPIs', icon: '🎯' },
    { number: 4, title: 'Plan d\'Action', subtitle: 'Événements & Rythme', icon: '📅' },
    { number: 5, title: 'Validation', subtitle: 'Signature & Envoi', icon: '✍️' }
  ];

  getProgressPercentage(): number {
    return Math.round(((this.currentStep - 1) / (this.steps.length - 1)) * 100);
  }

  getCurrentStepMeta() {
    return this.steps[this.currentStep - 1];
  }

  typologies: ClubTypology[] = [
    'Académique / Scientifique & Médical',
    'Culturel & Artistique',
    'Sport & Bien-être',
    'Citoyenneté, Humanitaire & RSE',
    'Entrepreneuriat, Débat & Innovation'
  ];

  isCustomTypology = false;
  customTypology = '';

  selectTypology(typ: string): void {
    this.isCustomTypology = false;
    this.formData.typology = typ;
  }

  enableCustomTypology(): void {
    this.isCustomTypology = true;
    this.formData.typology = this.customTypology.trim();
  }

  onCustomTypologyInput(): void {
    const val = this.customTypology.trim();
    this.formData.typology = val;
  }

  cancelCustomTypology(): void {
    this.isCustomTypology = false;
    this.customTypology = '';
    this.formData.typology = this.typologies[0];
  }

  confirmAndAddCustom(): void {
    const val = this.customTypology.trim();
    if (val) {
      if (!this.typologies.includes(val)) {
        this.typologies.push(val);
      }
      this.formData.typology = val;
      this.isCustomTypology = false;
    }
  }

  meetingFrequencies: MeetingFrequency[] = ['Hebdomadaire', 'Bimensuel', 'Mensuel'];

  availableFundingSources = [
    'Cotisations des membres',
    'Sponsoring / Partenariats externes',
    'Subvention demandée à l\'université',
    'Ventes / Activités d\'autofinancement'
  ];

  formData: ClubApplication = {
    // 1. Identité & Catégorisation
    official_name: '',
    acronym: '',
    slogan: '',
    typology: 'Académique / Scientifique & Médical',
    logo_url: '',

    // 2. Bureau Exécutif
    president_name: '',
    president_filiere: '',
    president_email: '',
    president_phone: '',

    vp_name: '',
    vp_filiere: '',
    vp_contact: '',

    sg_name: '',
    sg_filiere: '',
    sg_contact: '',

    treasurer_name: '',
    treasurer_filiere: '',
    treasurer_contact: '',

    comm_lead_name: '',
    comm_lead_filiere: '',
    comm_lead_contact: '',

    additional_members: [],
    faculty_advisor_name: 'Dr. Loubna Agouzal',
    advisor_agreement: 'Oui',

    // 3. Vision, Objectifs & Valeurs
    main_mission: '',
    measurable_objectives: '',
    campus_value_add: '',
    target_audience_type: 'Ouvert à toute l\'université',
    target_audience_details: '',

    // 4. Plan d'Action Annuel Prévisionnel
    event1_title: '',
    event1_description: '',
    event1_date: '',
    event1_logistics: '',

    event2_title: '',
    event2_description: '',
    event2_date: '',

    meeting_frequency: 'Bimensuel',

    // 5. Estimation Budgétaire & Ressources
    annual_budget_mad: 15000,
    funding_sources: ['Cotisations des membres', 'Sponsoring / Partenariats externes'],
    facility_needs: '',

    // 6. Engagement & Signature
    honor_declaration: false,
    charter_agreement: false,
    declarant_name: '',
    submission_date: new Date().toISOString().slice(0, 10)
  };

  constructor(
    private clubService: ClubService,
    private qrService: QrService,
    private router: Router
  ) {}

  setStep(step: number): void {
    if (step > this.currentStep && !this.validateCurrentStep()) {
      return;
    }
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < 5) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  validateCurrentStep(): boolean {
    this.errorMessage = '';

    if (this.currentStep === 1) {
      if (!this.formData.official_name.trim()) {
        this.errorMessage = 'Veuillez saisir le nom officiel du club.';
        return false;
      }
      if (this.isCustomTypology && (!this.formData.typology || !this.formData.typology.trim())) {
        this.errorMessage = 'Veuillez préciser votre typologie personnalisée.';
        return false;
      }
      if (!this.formData.typology || !this.formData.typology.trim()) {
        this.errorMessage = 'Veuillez sélectionner ou préciser la typologie du club.';
        return false;
      }
    } else if (this.currentStep === 2) {
      if (!this.formData.president_name.trim() || !this.formData.president_filiere.trim()) {
        this.errorMessage = 'Veuillez renseigner le nom complet et la filière du/de la Président(e).';
        return false;
      }
      if (!this.formData.president_email.trim() || !this.formData.president_phone.trim()) {
        this.errorMessage = 'Veuillez renseigner l\'email universitaire et le numéro de téléphone du/de la Président(e).';
        return false;
      }
      if (!this.formData.vp_name?.trim() || !this.formData.sg_name?.trim() || !this.formData.treasurer_name?.trim()) {
        this.errorMessage = 'Pour respecter la règle des membres fondateurs, veuillez au moins renseigner le VP, le Secrétaire Général et le Trésorier.';
        return false;
      }
    } else if (this.currentStep === 3) {
      if (!this.formData.main_mission.trim()) {
        this.errorMessage = 'Veuillez décrire la mission principale du club (2-3 phrases).';
        return false;
      }
      if (!this.formData.measurable_objectives.trim()) {
        this.errorMessage = 'Veuillez définir au moins 2 à 3 objectifs mesurables pour l\'année.';
        return false;
      }
      if (!this.formData.campus_value_add.trim()) {
        this.errorMessage = 'Veuillez préciser la valeur ajoutée pour la vie de campus.';
        return false;
      }
    } else if (this.currentStep === 4) {
      if (!this.formData.event1_title?.trim()) {
        this.errorMessage = 'Veuillez renseigner au moins l\'événement phare du Semestre 1.';
        return false;
      }
    }

    return true;
  }

  // Member management
  addAdditionalMember(): void {
    if (!this.formData.additional_members) {
      this.formData.additional_members = [];
    }
    this.formData.additional_members.push({
      name: '',
      filiere: '',
      role: '',
      contact: ''
    });
  }

  removeAdditionalMember(index: number): void {
    this.formData.additional_members?.splice(index, 1);
  }

  // Funding sources checkbox toggle
  toggleFundingSource(source: string): void {
    const idx = this.formData.funding_sources.indexOf(source);
    if (idx > -1) {
      this.formData.funding_sources.splice(idx, 1);
    } else {
      this.formData.funding_sources.push(source);
    }
  }

  isFundingSourceSelected(source: string): boolean {
    return this.formData.funding_sources?.includes(source) || false;
  }

  // Logo file upload handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadingLogo = true;
      this.clubService.uploadLogo(file).subscribe({
        next: (res) => {
          this.formData.logo_url = 'http://localhost:3000' + res.url;
          this.uploadingLogo = false;
        },
        error: (err) => {
          console.error('Logo upload error:', err);
          // Fallback to local data URL preview
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.formData.logo_url = e.target.result;
          };
          reader.readAsDataURL(file);
          this.uploadingLogo = false;
        }
      });
    }
  }

  // Pre-fill demo data
  fillDemoData(): void {
    this.isCustomTypology = false;
    this.customTypology = '';
    this.formData = {
      official_name: 'Club Santé, Prévention & Sciences Médicales UPSSA',
      acronym: 'CSPSM',
      slogan: 'L\'engagement médical et citoyen au cœur de l\'UPSSA.',
      typology: 'Académique / Scientifique & Médical',
      logo_url: '/upssa-logo.png',

      president_name: 'Yassine El Mansouri',
      president_filiere: 'Médecine Générale - 4ème année UPSSA',
      president_email: 'yassine.elmansouri@upssa.ac.ma',
      president_phone: '+212 6 61 72 83 94',

      vp_name: 'Hiba Zniber',
      vp_filiere: 'Pharmacie - 3ème année UPSSA',
      vp_contact: 'h.zniber@upssa.ac.ma',

      sg_name: 'Omar Bennani',
      sg_filiere: 'Sciences Infirmières & Santé - 3ème année',
      sg_contact: 'o.bennani@upssa.ac.ma',

      treasurer_name: 'Kenza Tazi',
      treasurer_filiere: 'Génie Biomédical - Master 1',
      treasurer_contact: 'k.tazi@upssa.ac.ma',

      comm_lead_name: 'Amine Cherkaoui',
      comm_lead_filiere: 'Communication Médicale & Santé Digitale',
      comm_lead_contact: 'a.cherkaoui@upssa.ac.ma',

      additional_members: [
        { name: 'Nour Idrissi', filiere: 'Médecine 2A', role: 'Responsable Ateliers Cliniques', contact: 'n.idrissi@upssa.ac.ma' },
        { name: 'Driss Lahlou', filiere: 'Kinésithérapie 3A', role: 'Logistique Caravanes Santé', contact: 'd.lahlou@upssa.ac.ma' }
      ],
      faculty_advisor_name: 'Dr. Loubna Agouzal',
      advisor_agreement: 'Oui',

      main_mission: 'Sensibiliser, former et accompagner les étudiants de l\'UPSSA aux pratiques médicales de terrain, au dépistage précoce et à la promotion de la santé publique.',
      measurable_objectives: '1. Organiser 4 ateliers cliniques spécialisés avec les enseignants de l\'UPSSA.\n2. Mener 2 caravanes médicales de dépistage dans la région Souss-Massa (300+ bénéficiaires).\n3. Publier 6 capsules de vulgarisation sur la prévention médicale.',
      campus_value_add: 'Renforce les compétences pratiques cliniques des étudiants en santé tout en créant un impact direct sur la santé des populations locales.',
      target_audience_type: 'Ouvert à toute l\'université',
      target_audience_details: '',

      event1_title: 'Journées UPSSA de Prévention & Dépistage Médical',
      event1_description: 'Ateliers pratiques de colposcopie, dépistage et gestes d urgence encadrés par Dr. Loubna Agouzal et les spécialistes de l UPSSA.',
      event1_date: '2026-11-28',
      event1_logistics: 'Amphithéâtre Principal UPSSA, mannequins de simulation médicale, projecteur 4K, sono.',

      event2_title: 'Caravane Médicale Rurale Souss-Massa',
      event2_description: 'Déplacement de 2 jours en zone rurale pour consultations et sensibilisation.',
      event2_date: '2027-04-15',

      meeting_frequency: 'Bimensuel',
      annual_budget_mad: 35000,
      funding_sources: [
        'Cotisations des membres',
        'Sponsoring / Partenariats externes',
        'Subvention demandée à l\'université'
      ],
      facility_needs: 'Accès régulier aux salles de simulation médicale et armoire sécurisée pour le matériel médical.',

      honor_declaration: true,
      charter_agreement: true,
      declarant_name: 'Yassine El Mansouri',
      submission_date: new Date().toISOString().slice(0, 10)
    };
    this.errorMessage = '';
  }

  submitApplication(): void {
    if (!this.formData.honor_declaration || !this.formData.charter_agreement) {
      this.errorMessage = 'Vous devez certifier sur l\'honneur et accepter le règlement intérieur avant de soumettre.';
      return;
    }

    if (!this.formData.declarant_name?.trim()) {
      this.formData.declarant_name = this.formData.president_name;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.clubService.submitClub(this.formData).subscribe({
      next: async (res) => {
        this.isSubmitting = false;
        this.submissionSuccess = true;
        this.trackingCode = res.tracking_code;
        this.createdClub = res.club;
        if (res.club && res.club.id) {
          this.joinUrl = this.qrService.getJoinUrl(res.club.id);
          this.joinQrDataUrl = await this.qrService.generateDataUrl(this.joinUrl, 220);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Submission error:', err);
        this.errorMessage = err.error?.error || 'Une erreur est survenue lors de la soumission du dossier. Veuillez réessayer.';
      }
    });
  }

  copyTrackingCode(): void {
    if (this.trackingCode) {
      navigator.clipboard.writeText(this.trackingCode);
      this.copiedCode = true;
      setTimeout(() => (this.copiedCode = false), 2500);
    }
  }

  printDossier(): void {
    window.print();
  }

  resetForm(): void {
    this.submissionSuccess = false;
    this.currentStep = 1;
    this.trackingCode = '';
    this.formData.official_name = '';
    this.formData.acronym = '';
    this.formData.slogan = '';
    this.formData.president_name = '';
    this.formData.president_filiere = '';
    this.formData.president_email = '';
    this.formData.president_phone = '';
  }
}

