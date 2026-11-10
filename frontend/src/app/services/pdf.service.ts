import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import { ClubApplication, ClubMember } from '../models/club.model';

/**
 * Sanitizes strings for jsPDF WinAnsi / Latin-1 encoding.
 * Strips out emojis and unprintable unicode symbols that cause corrupted text like Ø<ß¨ or &¡.
 */
function cleanPdfText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // Emojis
    .replace(/[\u{2600}-\u{27BF}]/gu, '')   // Misc symbols (⚡, ☕) and dingbats (✓, ✈)
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
    .replace(/[\u{200D}]/gu, '')           // Zero width joiner
    .replace(/[«»“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/[•·]/g, '-')
    .replace(/[✓✔]/g, '')
    .trim();
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() {}

  /**
   * Generates a high-quality, official UPSSA PDF Membership Certificate and Registration Form.
   * If autoDownload is true, triggers browser download directly.
   */
  /**
   * Generates a high-quality, comprehensive official UPSSA Club Registration Form & Membership Sheet.
   * Contains EVERY rubric of the student registration (Identity, Faculty, Level, Contacts, Hobbies, Skills, Proposed Project, Club Info, Engagement, Signatures, QR Code).
   */
  async generateMembershipPdf(club: ClubApplication, member: ClubMember, autoDownload: boolean = true): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182mm

    // Color palette
    const primaryColor: [number, number, number] = [0, 154, 166];      // #009aa6 (UPSSA Teal)
    const primaryDark: [number, number, number] = [0, 56, 68];         // #003844 (Deep Navy)
    const primaryLight: [number, number, number] = [230, 246, 247];    // #e6f6f7 (Teal Soft)
    const accentColor: [number, number, number] = [2, 128, 144];       // #028090
    const textDark: [number, number, number] = [15, 23, 42];           // #0f172a
    const textMuted: [number, number, number] = [100, 116, 139];       // #64748b
    const borderColor: [number, number, number] = [203, 213, 225];     // #cbd5e1
    const bgCard: [number, number, number] = [248, 250, 252];          // #f8fafc

    // 1. TOP COLOR BAR
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // 2. HEADER: UNIVERSITY BRANDING
    let y = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryDark);
    doc.text('UNIVERSITÉ PRIVÉE DE LA SANTÉ ET DES SCIENCES D\'AGADIR', margin, y);

    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('Pôle de la Vie Associative & Affaires Estudiantines • Campus UPSSA Agadir', margin, y);

    // Right-aligned academic year badge
    doc.setFillColor(...primaryLight);
    doc.roundedRect(pageWidth - margin - 52, 10, 52, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text('ANNÉE UNIVERSITAIRE', pageWidth - margin - 50, 14.5);
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryDark);
    doc.text('2026 - 2027', pageWidth - margin - 50, 18.5);

    // Thin separator
    y += 5.5;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);

    // 3. TITLE BLOCK: FICHE OFFICIELLE D'INSCRIPTION & D'ADHÉSION
    y += 6;
    doc.setFillColor(...primaryDark);
    doc.roundedRect(margin, y, contentWidth, 13, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('FICHE OFFICIELLE D\'INSCRIPTION & D\'ADHÉSION AU CLUB', margin + 6, y + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(165, 243, 252);
    doc.text('REGISTRE OFFICIEL ÉTUDIANT', pageWidth - margin - 48, y + 8.5);

    // Helper to render section title bar
    const renderSectionHeader = (title: string, topY: number, height: number = 6.5) => {
      doc.setFillColor(...primaryLight);
      doc.roundedRect(margin, topY, contentWidth, height, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...primaryDark);
      doc.text(title, margin + 4, topY + 4.5);
    };

    // 4. RUBRIQUE 1 : IDENTITÉ & SITUATION ACADÉMIQUE DE L'ÉTUDIANT(E)
    y += 16;
    const sec1Y = y;
    const sec1H = 26;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, sec1Y, contentWidth, sec1H, 2, 2, 'FD');
    renderSectionHeader('RUBRIQUE 1 & 2 : IDENTITÉ ACADÉMIQUE & COORDONNÉES DE L\'ÉTUDIANT(E)', sec1Y);

    const c1X = margin + 5;
    const c2X = margin + 68;
    const c3X = margin + 128;
    const row1Y = sec1Y + 11.5;
    const row2Y = sec1Y + 19.5;

    // Nom & Prénom
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('NOM & PRÉNOM :', c1X, row1Y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...primaryDark);
    doc.text(cleanPdfText(member.full_name) || '—', c1X, row1Y + 4.5);

    // Faculté
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('FACULTÉ :', c2X, row1Y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...accentColor);
    doc.text(cleanPdfText(member.filiere) || 'UPSSA', c2X, row1Y + 4.5);

    // Niveau
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('ANNÉE / NIVEAU :', c3X, row1Y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(cleanPdfText(member.academic_year) || '—', c3X, row1Y + 4.5);

    // Identifiant unique
    const memberCode = `UPSSA-MBR-${club.id || 1}-${member.id || 'NEW'}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('IDENTIFIANT D\'ADHÉRENT :', c1X, row2Y);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text(memberCode, c1X, row2Y + 4);

    // Email
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('EMAIL UNIVERSITAIRE :', c2X, row2Y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(cleanPdfText(member.email) || 'Non renseigné', c2X, row2Y + 4);

    // Téléphone
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('TÉLÉPHONE / WHATSAPP :', c3X, row2Y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(cleanPdfText(member.phone) || 'Non renseigné', c3X, row2Y + 4);

    // 5. RUBRIQUE 3 : CLUB D'ACCUEIL & ENCADREMENT
    y += sec1H + 3.5;
    const sec2Y = y;
    const sec2H = 22;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, sec2Y, contentWidth, sec2H, 2, 2, 'FD');
    renderSectionHeader('RUBRIQUE 3 : CLUB ÉTUDIANT D\'ACCUEIL & ENCADREMENT', sec2Y);

    const safeClubName = cleanPdfText(club.official_name);
    const safeAcronym = cleanPdfText(club.acronym);
    const clubTitle = `${safeClubName}${safeAcronym ? ' (' + safeAcronym + ')' : ''}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryDark);
    doc.text(clubTitle, c1X, sec2Y + 11.5);

    // Typology Tag
    doc.setFillColor(...primaryColor);
    doc.roundedRect(pageWidth - margin - 46, sec2Y + 8, 42, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(cleanPdfText(club.typology).substring(0, 26), pageWidth - margin - 44, sec2Y + 11.5);

    // Details line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(`Président(e) : ${cleanPdfText(club.president_name)}`, c1X, sec2Y + 16.5);
    doc.text(`Tuteur Référent : ${cleanPdfText(club.faculty_advisor_name) || 'Dr. Loubna Agouzal'}`, c2X, sec2Y + 16.5);
    doc.text(`Statut : Agrément Universitaire Validé`, c3X, sec2Y + 16.5);

    // Slogan or mission excerpt
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    const safeSlogan = cleanPdfText(club.slogan);
    const subText = safeSlogan ? `« ${safeSlogan} »` : `Mission : ${cleanPdfText(club.main_mission).substring(0, 95)}...`;
    doc.text(subText, c1X, sec2Y + 20);

    // 6. RUBRIQUE 4 : CENTRES D'INTÉRÊT & LOISIRS
    y += sec2H + 3.5;
    const sec3Y = y;
    const sec3H = 17.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, sec3Y, contentWidth, sec3H, 2, 2, 'FD');
    renderSectionHeader('RUBRIQUE 4 : CENTRES D\'INTÉRÊT, LOISIRS & PASSIONS PERSONNELLES', sec3Y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    const cleanLoisir = cleanPdfText(member.loisir) || 'Aucun loisir particulier mentionné.';
    const loisirLines = doc.splitTextToSize(cleanLoisir, contentWidth - 10);
    doc.text(loisirLines.slice(0, 2), c1X, sec3Y + 11);

    // 7. RUBRIQUE 5 : COMPÉTENCES & SAVOIR-FAIRE
    y += sec3H + 3.5;
    const sec4Y = y;
    const sec4H = 17.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, sec4Y, contentWidth, sec4H, 2, 2, 'FD');
    renderSectionHeader('RUBRIQUE 5 : COMPÉTENCES, ATOUTS & SAVOIR-FAIRE APPORTÉS AU CLUB', sec4Y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    const cleanComp = cleanPdfText(member.competence) || 'Aucune compétence technique spécifique renseignée.';
    const compLines = doc.splitTextToSize(cleanComp, contentWidth - 10);
    doc.text(compLines.slice(0, 2), c1X, sec4Y + 11);

    // 8. RUBRIQUE 6 : IDÉE DE PROJET PROPOSÉE POUR LE CLUB
    y += sec4H + 3.5;
    const sec5Y = y;
    const sec5H = 19;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, sec5Y, contentWidth, sec5H, 2, 2, 'FD');
    renderSectionHeader('RUBRIQUE 6 : INITIATIVE & IDÉE DE PROJET PROPOSÉE POUR LE CLUB', sec5Y);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const cleanProj = cleanPdfText(member.project_idea);
    const projText = cleanProj ? `« ${cleanProj} »` : 'Aucune idée d\'événement formulée lors de l\'enregistrement.';
    const projLines = doc.splitTextToSize(projText, contentWidth - 10);
    doc.text(projLines.slice(0, 2), c1X, sec5Y + 11.5);

    // 9. RUBRIQUE 7 : ENGAGEMENT DE L'ADHÉRENT & CHARTE ÉTUDIANTE
    y += sec5H + 3.5;
    const sec6Y = y;
    const sec6H = 14;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, sec6Y, contentWidth, sec6H, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text('RUBRIQUE 7 : ENGAGEMENT ASSOCIATIF & CHARTE DE LA VIE ÉTUDIANTE', c1X, sec6Y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textDark);
    const engagementText = "Je soussigné(e), déclare sur l'honneur l'exactitude des renseignements ci-dessus et sollicite mon adhésion officielle au club. Je m'engage à respecter les statuts de l'association, le règlement intérieur et la Charte de la Vie Étudiante de l'UPSSA pour l'année 2026-2027.";
    const engLines = doc.splitTextToSize(engagementText, contentWidth - 10);
    doc.text(engLines, c1X, sec6Y + 8.5);

    // 10. RUBRIQUE 8 : VALIDATION, CACHET UPSSA & AUTHENTIFICATION QR CODE
    y += sec6H + 3.5;
    const sec7Y = y;
    const sec7H = 42;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, sec7Y, contentWidth, sec7H, 2, 2, 'FD');

    // QR Code
    const verifyUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/rejoindre/${club.id || ''}`
      : `https://upssa-clubs.fly.dev/rejoindre/${club.id || ''}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 130,
        margin: 1,
        color: { dark: '#003844', light: '#ffffff' }
      });
      doc.addImage(qrDataUrl, 'PNG', margin + 4, sec7Y + 3.5, 26, 26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...primaryColor);
      doc.text('AUTHENTIFICATION QR', margin + 5, sec7Y + 33);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(...textMuted);
      doc.text('Vérification adhésion UPSSA', margin + 4, sec7Y + 36.5);
    } catch (e) {
      console.warn('QR Code generation for registration PDF failed:', e);
    }

    // Student Signature Block
    const signStudX = margin + 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('SIGNATURE DE L\'ÉTUDIANT(E) :', signStudX, sec7Y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryDark);
    doc.text(cleanPdfText(member.full_name), signStudX, sec7Y + 11.5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text('Mention : « Lu et approuvé »', signStudX, sec7Y + 16);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Signé électroniquement', signStudX, sec7Y + 28);

    // President Signature Block
    const signPresX = margin + 85;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('POUR LE BUREAU DU CLUB :', signPresX, sec7Y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryDark);
    doc.text(cleanPdfText(club.president_name), signPresX, sec7Y + 11.5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text('Président(e) en exercice', signPresX, sec7Y + 16);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Avis favorable accordé', signPresX, sec7Y + 28);

    // Official Stamp UPSSA (Right)
    const sealX = pageWidth - margin - 52;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.7);
    doc.roundedRect(sealX, sec7Y + 4, 48, 34, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...primaryColor);
    doc.text('UPSSA AGADIR • CAMPUS', sealX + 7, sec7Y + 9.5);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.3);
    doc.line(sealX + 4, sec7Y + 11.5, sealX + 44, sec7Y + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryDark);
    doc.text('DIRECTION DE LA', sealX + 11, sec7Y + 16.5);
    doc.text('VIE ÉTUDIANTE', sealX + 13, sec7Y + 20.5);

    doc.setFillColor(...primaryLight);
    doc.roundedRect(sealX + 5, sec7Y + 23, 38, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...primaryColor);
    doc.text('INSCRIPTION VALIDÉE', sealX + 8, sec7Y + 27);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...textMuted);
    const dateJoined = member.joined_at 
      ? new Date(member.joined_at).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR');
    doc.text('Date : ' + dateJoined, sealX + 13, sec7Y + 33);

    // 11. FOOTER
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`Document officiel d'inscription délivré par le Portail Associatif UPSSA le ${new Date().toLocaleDateString('fr-FR')} - Valable pour l'année 2026-2027.`, margin, pageHeight - 7);
    doc.text('Page 1/1', pageWidth - margin - 12, pageHeight - 7);

    // Auto Download
    if (autoDownload && typeof window !== 'undefined') {
      const sanitizedName = cleanPdfText(member.full_name || 'Etudiant').replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedClub = cleanPdfText(club.acronym || club.official_name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Fiche_Inscription_${sanitizedName}_${sanitizedClub}.pdf`;
      doc.save(filename);
    }

    return doc;
  }

  /**
   * Generates a complete official PDF Register of all registrations for a club.
   * Includes statistics by faculty/level and full detailed table of all registered students with all their rubrics.
   */
  async generateClubMembersListPdf(club: ClubApplication, members: ClubMember[], autoDownload: boolean = true): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 269mm

    const primaryColor: [number, number, number] = [0, 154, 166];
    const primaryDark: [number, number, number] = [0, 56, 68];
    const primaryLight: [number, number, number] = [230, 246, 247];
    const textDark: [number, number, number] = [15, 23, 42];
    const textMuted: [number, number, number] = [100, 116, 139];
    const borderColor: [number, number, number] = [203, 213, 225];

    // Top Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Header
    let y = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryDark);
    doc.text('UNIVERSITÉ PRIVÉE DE LA SANTÉ ET DES SCIENCES D\'AGADIR', margin, y);

    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textMuted);
    doc.text('Direction de la Vie Étudiante • Registre Général des Inscriptions Associatives 2026-2027', margin, y);

    // Title Box
    y += 6;
    doc.setFillColor(...primaryDark);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    const safeClubName = cleanPdfText(club.official_name);
    const safeAcronym = cleanPdfText(club.acronym);
    doc.text(`REGISTRE OFFICIEL DES INSCRIPTIONS • ${safeClubName.toUpperCase()}${safeAcronym ? ' (' + safeAcronym + ')' : ''}`, margin + 6, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(165, 243, 252);
    doc.text(`TOTAL : ${members.length} ÉTUDIANT(S) INSCRIT(S)`, pageWidth - margin - 60, y + 9);

    // Club meta summary strip
    y += 18;
    doc.setFillColor(...primaryLight);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...primaryDark);
    doc.text(`Typologie : ${cleanPdfText(club.typology)}`, margin + 4, y + 6.5);
    doc.text(`Président(e) : ${cleanPdfText(club.president_name)}`, margin + 80, y + 6.5);
    doc.text(`Tuteur Référent : ${cleanPdfText(club.faculty_advisor_name) || 'Dr. Loubna Agouzal'}`, margin + 155, y + 6.5);
    doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, margin + 225, y + 6.5);

    // Table Header
    y += 14;
    const thY = y;
    const thH = 8;
    doc.setFillColor(...primaryDark);
    doc.rect(margin, thY, contentWidth, thH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    const cols = [
      { name: 'N°', x: margin + 3, w: 10 },
      { name: 'Nom & Prénom', x: margin + 14, w: 42 },
      { name: 'Faculté & Niveau', x: margin + 58, w: 42 },
      { name: 'Loisirs & Passions', x: margin + 102, w: 45 },
      { name: 'Compétences Apportées', x: margin + 149, w: 45 },
      { name: 'Idée de Projet Proposée', x: margin + 196, w: 45 },
      { name: 'Contact', x: margin + 243, w: 25 }
    ];

    cols.forEach(c => doc.text(c.name, c.x, thY + 5.5));

    // Rows
    y = thY + thH;
    let rowIdx = 0;
    const maxRowsPerPage = 12;

    for (const m of members) {
      if (rowIdx > 0 && rowIdx % maxRowsPerPage === 0) {
        doc.addPage('a4', 'landscape');
        // Redraw top bar & header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 5, 'F');
        y = 15;
        doc.setFillColor(...primaryDark);
        doc.rect(margin, y, contentWidth, thH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        cols.forEach(c => doc.text(c.name, c.x, y + 5.5));
        y += thH;
      }

      const rowH = 10;
      if (rowIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowH, 'F');
      }
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowH, margin + contentWidth, y + rowH);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...textDark);

      // N°
      doc.text(String(rowIdx + 1), cols[0].x, y + 6);

      // Nom
      doc.setFont('helvetica', 'bold');
      doc.text(cleanPdfText(m.full_name).substring(0, 24), cols[1].x, y + 6);

      // Faculté & Niveau
      doc.setFont('helvetica', 'normal');
      const facText = `${cleanPdfText(m.filiere)} • ${cleanPdfText(m.academic_year)}`;
      doc.text(facText.substring(0, 26), cols[2].x, y + 6);

      // Loisir
      doc.text(cleanPdfText(m.loisir).substring(0, 28), cols[3].x, y + 6);

      // Compétence
      doc.text(cleanPdfText(m.competence).substring(0, 28), cols[4].x, y + 6);

      // Idée de projet
      doc.text(cleanPdfText(m.project_idea || '—').substring(0, 28), cols[5].x, y + 6);

      // Contact
      doc.text(cleanPdfText(m.phone || m.email || '—').substring(0, 16), cols[6].x, y + 6);

      y += rowH;
      rowIdx++;
    }

    // Bottom verification footer
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`Registre certifié conforme par la Direction de la Vie Étudiante UPSSA • Total : ${members.length} inscription(s) validée(s).`, margin, pageHeight - 6);
    doc.text('Document officiel UPSSA Campus', pageWidth - margin - 45, pageHeight - 6);

    if (autoDownload && typeof window !== 'undefined') {
      const sanitizedClub = cleanPdfText(club.acronym || club.official_name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Registre_Inscriptions_${sanitizedClub}_2026.pdf`;
      doc.save(filename);
    }

    return doc;
  }

  /**
   * Generates a high-quality, official UPSSA PDF Receipt for Club Creation Application.
   * Includes tracking code, executive board, mission, annual plan, QR code, and official stamp.
   */
  async generateClubApplicationReceiptPdf(
    club: ClubApplication,
    trackingCode?: string,
    autoDownload: boolean = true
  ): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182mm

    // Color Palette
    const primaryColor: [number, number, number] = [0, 154, 166];      // #009aa6 (UPSSA Teal)
    const primaryDark: [number, number, number] = [0, 56, 68];         // #003844 (Deep Navy)
    const primaryLight: [number, number, number] = [230, 246, 247];    // #e6f6f7 (Teal Soft)
    const textDark: [number, number, number] = [15, 23, 42];           // #0f172a
    const textMuted: [number, number, number] = [100, 116, 139];       // #64748b
    const borderColor: [number, number, number] = [220, 231, 233];     // #dce7e9
    const bgCard: [number, number, number] = [248, 250, 252];          // #f8fafc

    // 1. TOP COLOR ACCENT BAR
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // 2. UNIVERSITY HEADER
    let y = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryDark);
    doc.text("UNIVERSITE PRIVEE DE LA SANTE ET DES SCIENCES D'AGADIR", margin, y);

    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text("Direction de la Vie Etudiante & des Relations Associatives - UPSSA Campus", margin, y);

    // Right-aligned header badge
    doc.setFillColor(...primaryLight);
    doc.roundedRect(pageWidth - margin - 50, 10.5, 50, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text("ANNEE UNIVERSITAIRE", pageWidth - margin - 48, 14.5);
    doc.setFontSize(8);
    doc.setTextColor(...primaryDark);
    doc.text("2026 - 2027", pageWidth - margin - 48, 18.5);

    // Header divider line
    y += 5;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);

    // 3. MAIN TITLE BANNER
    y += 5;
    doc.setFillColor(...primaryDark);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("RECEPISSE OFFICIEL DE DEPOT DE CREATION DE CLUB", margin + 5, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(165, 243, 252);
    doc.text("DOSSIER D'AGREMENT ASSOCIATIF", pageWidth - margin - 48, y + 7.5);

    // 4. TRACKING & STATUS BAR
    y += 15;
    const trackH = 15;
    doc.setFillColor(...primaryLight);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, trackH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("CODE DE SUIVI OFFICIEL :", margin + 5, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...primaryColor);
    const code = cleanPdfText(trackingCode || club.tracking_code || 'CLUB-2026-ENCOURS');
    doc.text(code, margin + 5, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    const dateFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.text(`Depose le : ${dateFormatted}`, margin + 70, y + 6.5);
    doc.text(`Declarant : ${cleanPdfText(club.declarant_name || club.president_name)}`, margin + 70, y + 11.5);

    // Status badge on the right
    doc.setFillColor(254, 243, 199); // Amber soft
    doc.setDrawColor(245, 158, 11); // Amber border
    doc.roundedRect(pageWidth - margin - 52, y + 2.5, 48, 10, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9);
    doc.text("STATUT : EN COURS", pageWidth - margin - 47, y + 6.8);
    doc.setFontSize(6);
    doc.text("Commission Vie Etudiante", pageWidth - margin - 47, y + 10.5);

    // 5. SECTION 1: IDENTITE DU CLUB
    y += trackH + 4;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text("1. IDENTITE DU CLUB", margin + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryDark);
    const safeClubName = cleanPdfText(club.official_name);
    const safeAcronym = cleanPdfText(club.acronym);
    doc.text(`${safeClubName}${safeAcronym ? ' (' + safeAcronym + ')' : ''}`, margin + 4, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(`Typologie : ${cleanPdfText(club.typology)}`, margin + 4, y + 16.5);
    if (club.slogan) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...textMuted);
      doc.text(`Slogan : "${cleanPdfText(club.slogan)}"`, margin + 4, y + 20.5);
    }

    // 6. SECTION 2: BUREAU EXECUTIF
    y += 26;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text("2. BUREAU EXECUTIF & ENCADREMENT", margin + 4, y + 5);

    // President
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("President(e) :", margin + 4, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text(`${cleanPdfText(club.president_name)} | Filiere: ${cleanPdfText(club.president_filiere) || 'Non renseigne'}`, margin + 30, y + 11);
    doc.text(`Contact: ${cleanPdfText(club.president_email)} - Tel: ${cleanPdfText(club.president_phone)}`, margin + 30, y + 15);

    // Vice-President & SG
    doc.setFont('helvetica', 'bold');
    doc.text("Vice-President(e) :", margin + 4, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanPdfText(club.vp_name) || 'Non renseigne'} (${cleanPdfText(club.vp_filiere) || '-'})`, margin + 30, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.text("Secretaire General :", margin + 4, y + 24.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanPdfText(club.sg_name) || 'Non renseigne'} (${cleanPdfText(club.sg_filiere) || '-'})`, margin + 30, y + 24.5);

    doc.setFont('helvetica', 'bold');
    doc.text("Tresorier(e) :", margin + 4, y + 29);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanPdfText(club.treasurer_name) || 'Non renseigne'} (${cleanPdfText(club.treasurer_filiere) || '-'})`, margin + 30, y + 29);

    doc.setFont('helvetica', 'bold');
    doc.text("Tuteur Pedagogique :", margin + 4, y + 33.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(`${cleanPdfText(club.faculty_advisor_name) || 'Dr. Loubna Agouzal (Responsable UPSSA)'}`, margin + 34, y + 33.5);

    // 7. SECTION 3: VISION, ACTIVITES & BUDGET
    y += 39;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text("3. PROJET, OBJECTIFS & PLAN D'ACTION", margin + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("Mission principale :", margin + 4, y + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    const missionLines = doc.splitTextToSize(cleanPdfText(club.main_mission) || 'Non renseigne', contentWidth - 40);
    doc.text(missionLines.slice(0, 2), margin + 32, y + 10.5);

    const afterMissionY = y + 10.5 + (Math.min(missionLines.length, 2) * 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryDark);
    doc.text("Evenement Phare 1 :", margin + 4, afterMissionY + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text(`${cleanPdfText(club.event1_title) || 'En cours de programmation'} ${club.event1_date ? '(' + cleanPdfText(club.event1_date) + ')' : ''}`, margin + 32, afterMissionY + 1);

    if (club.event2_title) {
      doc.setFont('helvetica', 'bold');
      doc.text("Evenement Phare 2 :", margin + 4, afterMissionY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cleanPdfText(club.event2_title)} ${club.event2_date ? '(' + cleanPdfText(club.event2_date) + ')' : ''}`, margin + 32, afterMissionY + 5.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.text("Budget Annuel :", margin + 4, afterMissionY + 10);
    doc.setFont('helvetica', 'normal');
    const budgetVal = club.annual_budget_mad ? `${Number(club.annual_budget_mad).toLocaleString('fr-FR')} MAD` : 'A definir';
    doc.text(`${budgetVal} | Frequence reunions: ${cleanPdfText(club.meeting_frequency) || 'Bimensuel'}`, margin + 32, afterMissionY + 10);

    // 8. SECTION 4: QR CODE DE SUIVI & VALIDATION OFFICIELLE
    y += 41;
    doc.setFillColor(...primaryLight);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');

    // Generate Tracking / Join QR code
    const origin = (typeof window !== 'undefined') ? window.location.origin : 'https://upssa-clubs.fly.dev';
    const verifyUrl = `${origin}/suivi?code=${code}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#003844',
          light: '#ffffff'
        }
      });
      doc.addImage(qrDataUrl, 'PNG', margin + 4, y + 4, 34, 34);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...primaryColor);
      doc.text("SCANNER POUR SUIVRE", margin + 4.5, y + 40);
    } catch (e) {
      console.warn('QR Code creation failed:', e);
    }

    // Engagement text
    const textStartX = margin + 44;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("ENGAGEMENT & CERTIFICATION SUR L'HONNEUR", textStartX, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textDark);
    const certText = "Le declarant soussigne atteste sur l'honneur l'exactitude des informations fournies et certifie avoir pris connaissance du reglement interieur et de la charte de la vie associative de l'UPSSA. Ce recepisse tient lieu de preuve de depot officiel.";
    const certLines = doc.splitTextToSize(certText, 70);
    doc.text(certLines, textStartX, y + 10.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("Signature du Declarant :", textStartX, y + 27);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text(cleanPdfText(club.declarant_name || club.president_name), textStartX, y + 32);

    // Official Stamp mockup (Right)
    const sealX = pageWidth - margin - 58;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.7);
    doc.roundedRect(sealX, y + 3, 54, 36, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text("UPSSA AGADIR - RECTORAT", sealX + 6, y + 8);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.3);
    doc.line(sealX + 3, y + 10, sealX + 51, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("COMMISSION DE LA", sealX + 11, y + 15);
    doc.text("VIE ETUDIANTE", sealX + 13.5, y + 19.5);

    doc.setFillColor(...primaryColor);
    doc.roundedRect(sealX + 5, y + 22, 44, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text("DOSSIER ENREGISTRE", sealX + 8, y + 26.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...textMuted);
    doc.text(`Ref : ${code}`, sealX + 9, y + 32);
    doc.text(`Date : ${dateFormatted}`, sealX + 9, y + 36);

    // 9. FOOTER
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`Document officiel genere par le Portail UPSSA Clubs le ${dateFormatted} - Conservez ce recepisse pour le suivi de votre agrement.`, margin, pageHeight - 6);
    doc.text("Page 1/1", pageWidth - margin - 12, pageHeight - 6);

    // Automatic download
    if (autoDownload && typeof window !== 'undefined') {
      const sanitizedClub = cleanPdfText(club.acronym || club.official_name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Recepisse_Creation_${sanitizedClub}_${code}.pdf`;
      doc.save(filename);
    }

    return doc;
  }

  /**
   * Generates a high-quality, official UPSSA Approved Club Sheet PDF (Fiche Officielle du Club).
   * Perfect for administrative records, student recruitment, campus showcases, and formal approvals.
   */
  async generateClubSheetPdf(
    club: ClubApplication,
    autoDownload: boolean = true
  ): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182mm

    // Color Palette UPSSA
    const primaryColor: [number, number, number] = [0, 154, 166];      // #009aa6 (UPSSA Teal)
    const primaryDark: [number, number, number] = [0, 56, 68];         // #003844 (Deep Navy)
    const primaryLight: [number, number, number] = [230, 246, 247];    // #e6f6f7 (Teal Soft)
    const successColor: [number, number, number] = [5, 150, 105];      // #059669 (Green)
    const successBg: [number, number, number] = [236, 253, 245];       // #ecfdf5
    const textDark: [number, number, number] = [15, 23, 42];           // #0f172a
    const textMuted: [number, number, number] = [100, 116, 139];       // #64748b
    const borderColor: [number, number, number] = [220, 231, 233];     // #dce7e9
    const bgCard: [number, number, number] = [248, 250, 252];          // #f8fafc

    // 1. TOP COLOR BAR
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // 2. HEADER
    let y = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryDark);
    doc.text("UNIVERSITE PRIVEE DE LA SANTE ET DES SCIENCES D'AGADIR", margin, y);

    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text("Direction de la Vie Etudiante & Pole Associatif - UPSSA Campus Agadir", margin, y);

    // Right-aligned header badge
    doc.setFillColor(...primaryLight);
    doc.roundedRect(pageWidth - margin - 50, 10.5, 50, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text("ANNEE UNIVERSITAIRE", pageWidth - margin - 48, 14.5);
    doc.setFontSize(8);
    doc.setTextColor(...primaryDark);
    doc.text("2026 - 2027", pageWidth - margin - 48, 18.5);

    // Header divider line
    y += 5;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);

    // 3. TITLE BANNER: FICHE OFFICIELLE D'AGREMENT DU CLUB
    y += 5;
    doc.setFillColor(...primaryDark);
    doc.roundedRect(margin, y, contentWidth, 13, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(255, 255, 255);
    doc.text("FICHE OFFICIELLE D'AGREMENT & DE PRESENTATION DU CLUB", margin + 5, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(165, 243, 252);
    doc.text("ANNUAIRE DES CLUBS AGREES", pageWidth - margin - 46, y + 8);

    // 4. CLUB IDENTITY HERO CARD
    y += 16;
    const heroH = 30;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, heroH, 2, 2, 'FD');

    // Official Name & Acronym
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...primaryDark);
    const safeClubName = cleanPdfText(club.official_name);
    const safeAcronym = cleanPdfText(club.acronym);
    doc.text(`${safeClubName}${safeAcronym ? ' (' + safeAcronym + ')' : ''}`, margin + 5, y + 8);

    // Approval Badge (Top Right)
    doc.setFillColor(...successBg);
    doc.setDrawColor(...successColor);
    doc.roundedRect(pageWidth - margin - 52, y + 3, 48, 8, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...successColor);
    doc.text("CLUB AGREE UPSSA", pageWidth - margin - 48, y + 8);

    // Slogan
    if (club.slogan) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryColor);
      doc.text(`"${cleanPdfText(club.slogan)}"`, margin + 5, y + 14);
    }

    // Typology, Ref & Member count
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(`Typologie : `, margin + 5, y + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanPdfText(club.typology)}`, margin + 22, y + 21);

    const code = cleanPdfText(club.tracking_code || `CLUB-2026-00${club.id || 1}`);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ref. Agrement : `, margin + 5, y + 26);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(code, margin + 28, y + 26);

    // Active members pill
    const membersCount = club.members_count || 0;
    doc.setFillColor(...primaryLight);
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(margin + 95, y + 17, 78, 10, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text(`Effectif Actif : ${membersCount} membre(s) inscrit(s)`, margin + 100, y + 23.5);

    // 5. SECTION 1: BUREAU EXECUTIF & ENCADREMENT
    y += heroH + 4;
    const boardH = 38;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, boardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text("1. BUREAU EXECUTIF & TUTEUR REFERENT", margin + 4, y + 5);

    // President
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("President(e) :", margin + 4, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text(`${cleanPdfText(club.president_name)} | Filiere: ${cleanPdfText(club.president_filiere) || 'Non renseigne'}`, margin + 30, y + 11);
    doc.text(`Email: ${cleanPdfText(club.president_email)} - Tel: ${cleanPdfText(club.president_phone)}`, margin + 30, y + 15);

    // Vice-President & SG
    doc.setFont('helvetica', 'bold');
    doc.text("Vice-President(e) :", margin + 4, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanPdfText(club.vp_name) || 'Non renseigne'} (${cleanPdfText(club.vp_filiere) || '-'})`, margin + 30, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.text("Secretaire General :", margin + 4, y + 24.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanPdfText(club.sg_name) || 'Non renseigne'} (${cleanPdfText(club.sg_filiere) || '-'})`, margin + 30, y + 24.5);

    doc.setFont('helvetica', 'bold');
    doc.text("Tresorier(e) :", margin + 4, y + 29);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanPdfText(club.treasurer_name) || 'Non renseigne'} (${cleanPdfText(club.treasurer_filiere) || '-'})`, margin + 30, y + 29);

    doc.setFont('helvetica', 'bold');
    doc.text("Tuteur Pedagogique :", margin + 4, y + 34);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(`${cleanPdfText(club.faculty_advisor_name) || 'Dr. Loubna Agouzal (Responsable Formation Continue - UPSSA)'}`, margin + 34, y + 34);

    // 6. SECTION 2: VOCATION, MISSION & ACTIVITES
    y += boardH + 4;
    const actH = 46;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, actH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text("2. VOCATION, MISSION & PROGRAMME ANNUEL", margin + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("Mission principale :", margin + 4, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    const missionLines = doc.splitTextToSize(cleanPdfText(club.main_mission) || 'Non renseigne', contentWidth - 40);
    doc.text(missionLines.slice(0, 3), margin + 32, y + 11);

    const afterMissY = y + 11 + (Math.min(missionLines.length, 3) * 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryDark);
    doc.text("Evenement Phare 1 :", margin + 4, afterMissY + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text(`${cleanPdfText(club.event1_title) || 'En cours de programmation'} ${club.event1_date ? '(' + cleanPdfText(club.event1_date) + ')' : ''}`, margin + 32, afterMissY + 1);

    if (club.event2_title) {
      doc.setFont('helvetica', 'bold');
      doc.text("Evenement Phare 2 :", margin + 4, afterMissY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cleanPdfText(club.event2_title)} ${club.event2_date ? '(' + cleanPdfText(club.event2_date) + ')' : ''}`, margin + 32, afterMissY + 5.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.text("Cadence / Budget :", margin + 4, afterMissY + 10);
    doc.setFont('helvetica', 'normal');
    const budgetVal = club.annual_budget_mad ? `${Number(club.annual_budget_mad).toLocaleString('fr-FR')} MAD` : 'Non specifie';
    doc.text(`Reunions ${cleanPdfText(club.meeting_frequency) || 'Bimensuelles'} | Budget: ${budgetVal}`, margin + 32, afterMissY + 10);

    // 7. SECTION 3: QR CODE D'ADHESION & CACHET OFFICIEL
    y += actH + 4;
    const footerH = 46;
    doc.setFillColor(...primaryLight);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, footerH, 2, 2, 'FD');

    // QR Code to join club
    const origin = (typeof window !== 'undefined') ? window.location.origin : 'https://upssa-clubs.fly.dev';
    const joinUrl = `${origin}/rejoindre/${club.id || 1}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(joinUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#003844',
          light: '#ffffff'
        }
      });
      doc.addImage(qrDataUrl, 'PNG', margin + 4, y + 4, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...primaryColor);
      doc.text("SCANNER POUR ADHERER", margin + 5, y + 43);
    } catch (e) {
      console.warn('QR Code creation failed:', e);
    }

    // Accreditation text & terms
    const textStartX = margin + 48;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryDark);
    doc.text("VALIDATION INSTITUTIONNELLE & ACCORD D'AGREMENT", textStartX, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    const agremText = "La Commission Paritaire de la Vie Etudiante de l'UPSSA certifie que ce club etudiant remplit l'ensemble des conditions statutaires, d'ethique et d'encadrement conformement a la charte universitaire. Le club beneficie du soutien institutionnel et logistique de l'universite pour mener ses activites.";
    const agremLines = doc.splitTextToSize(agremText, 68);
    doc.text(agremLines, textStartX, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("Signature du President :", textStartX, y + 33);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text(cleanPdfText(club.president_name), textStartX, y + 38);

    // Official Stamp mockup (Right)
    const sealX = pageWidth - margin - 58;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(sealX, y + 4, 54, 37, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text("UPSSA AGADIR - RECTORAT", sealX + 6, y + 9);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.3);
    doc.line(sealX + 3, y + 11, sealX + 51, y + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text("COMMISSION DE LA", sealX + 11, y + 16);
    doc.text("VIE ETUDIANTE", sealX + 13.5, y + 20.5);

    doc.setFillColor(...successColor);
    doc.roundedRect(sealX + 5, y + 23, 44, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text("AGREMENT VALIDE", sealX + 10, y + 27.2);

    const dateStr = new Date().toLocaleDateString('fr-FR');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...textMuted);
    doc.text(`Ref : ${code}`, sealX + 9, y + 33);
    doc.text(`Delivre le : ${dateStr}`, sealX + 9, y + 37);

    // 8. FOOTER
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`Fiche officielle editee le ${dateStr} par le Portail de Gestion des Clubs UPSSA. Fait foi aupres de l'administration et des partenaires.`, margin, pageHeight - 6);
    doc.text("Page 1/1", pageWidth - margin - 12, pageHeight - 6);

    // Automatic download
    if (autoDownload && typeof window !== 'undefined') {
      const sanitizedClub = cleanPdfText(club.acronym || club.official_name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Fiche_Officielle_Club_${sanitizedClub}.pdf`;
      doc.save(filename);
    }

    return doc;
  }
}
