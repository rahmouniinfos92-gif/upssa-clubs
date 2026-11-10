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
  async generateMembershipPdf(club: ClubApplication, member: ClubMember, autoDownload: boolean = true): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2); // 180mm

    // ----------------- COLOR PALETTE -----------------
    const primaryColor: [number, number, number] = [0, 154, 166];      // #009aa6 (UPSSA Teal)
    const primaryDark: [number, number, number] = [0, 56, 68];         // #003844 (Deep Navy)
    const primaryLight: [number, number, number] = [230, 246, 247];    // #e6f6f7 (Teal Soft)
    const accentColor: [number, number, number] = [2, 128, 144];       // #028090
    const textDark: [number, number, number] = [15, 23, 42];           // #0f172a
    const textMuted: [number, number, number] = [100, 116, 139];       // #64748b
    const borderColor: [number, number, number] = [220, 231, 233];     // #dce7e9
    const bgCard: [number, number, number] = [248, 250, 252];          // #f8fafc

    // 1. TOP COLOR ACCENT BAR
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 7, 'F');

    // 2. HEADER: UNIVERSITY BRANDING
    let y = 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryDark);
    doc.text('UNIVERSITÉ PRIVÉE DE LA SANTÉ ET DES SCIENCES D\'AGADIR', margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textMuted);
    doc.text('Pôle de la Vie Associative & Affaires Estudiantines - UPSSA Campus', margin, y);

    // Right-aligned header badge
    doc.setFillColor(...primaryLight);
    doc.roundedRect(pageWidth - margin - 52, 12, 52, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryColor);
    doc.text('ANNÉE UNIVERSITAIRE', pageWidth - margin - 50, 16.5);
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryDark);
    doc.text('2026 - 2027', pageWidth - margin - 50, 20.5);

    // Thin separator line
    y += 6;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    // 3. TITLE BLOCK: OFFICIAL CERTIFICATE
    y += 8;
    doc.setFillColor(...primaryDark);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('FICHE D\'INSCRIPTION & CARTE D\'ADHÉRENT DU CLUB', margin + 6, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(165, 243, 252); // soft cyan
    doc.text('DOCUMENT OFFICIEL ÉTUDIANT', pageWidth - margin - 50, y + 9);

    // 4. CLUB INFORMATIONS BOX
    y += 18;
    const clubBoxH = 26;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, clubBoxH, 2, 2, 'FD');

    // Club header line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryDark);
    const safeClubName = cleanPdfText(club.official_name);
    const safeAcronym = cleanPdfText(club.acronym);
    const clubTitle = `${safeClubName}${safeAcronym ? ' (' + safeAcronym + ')' : ''}`;
    doc.text(clubTitle, margin + 5, y + 6.5);

    // Club Typology Badge
    doc.setFillColor(...primaryColor);
    const badgeW = 44;
    doc.roundedRect(pageWidth - margin - badgeW - 5, y + 2.5, badgeW, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    const safeTypology = cleanPdfText(club.typology).substring(0, 26);
    doc.text(safeTypology, pageWidth - margin - badgeW - 3, y + 6.5);

    // Club details
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    const safeSlogan = cleanPdfText(club.slogan);
    const sloganText = safeSlogan ? `"${safeSlogan}"` : cleanPdfText(club.main_mission).substring(0, 85) + '...';
    doc.text(sloganText, margin + 5, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(`Président(e) : ${cleanPdfText(club.president_name)}`, margin + 5, y + 18);
    doc.text(`Tuteur Référent : ${cleanPdfText(club.faculty_advisor_name) || 'Dr. Loubna Agouzal'}`, margin + 5, y + 22.5);
    doc.text(`Statut : Club Agréé par l'Université`, margin + 95, y + 18);
    doc.text(`Événement Phare : ${cleanPdfText(club.event1_title) || 'Non communiqué'}`, margin + 95, y + 22.5);

    // 5. MEMBER IDENTITY & ACADEMIC DETAILS BOX
    y += clubBoxH + 4;
    const memberBoxY = y;
    const memberBoxH = 92;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, memberBoxY, contentWidth, memberBoxH, 2, 2, 'FD');

    // Section title bar
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, memberBoxY, contentWidth, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('DÉTAILS COMPLETS DE L\'ÉTUDIANT(E) INSCRIT(E)', margin + 5, memberBoxY + 5.5);

    // Left Column: Identity
    let my = memberBoxY + 14;
    const col1X = margin + 5;
    const col2X = margin + 95;

    // Nom et prénom
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('NOM & PRÉNOM DE L\'ÉTUDIANT(E) :', col1X, my);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryDark);
    doc.text(cleanPdfText(member.full_name) || '—', col1X, my + 4.5);

    // Faculté
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('FACULTÉ D\'ÉTUDES :', col1X, my + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...accentColor);
    doc.text(cleanPdfText(member.filiere) || '—', col1X, my + 16);

    // Année scolaire / Niveau
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('ANNÉE SCOLAIRE / NIVEAU :', col1X, my + 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...textDark);
    doc.text(cleanPdfText(member.academic_year) || '—', col1X, my + 27.5);

    // Right Column: Reference & Contact
    // Code Adhérent
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('IDENTIFIANT D\'ADHÉRENT OFFICIEL :', col2X, my);
    doc.setFillColor(...primaryLight);
    doc.roundedRect(col2X, my + 1, 75, 6, 1, 1, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    const memberCode = `UPSSA-MBR-${club.id || 1}-${member.id || 'NEW'}`;
    doc.text(memberCode, col2X + 2, my + 5.2);

    // Date d'adhésion
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('DATE OFFICIELLE D\'ADHÉSION :', col2X, my + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    const joinDateStr = member.joined_at 
      ? new Date(member.joined_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleDateString('fr-FR');
    doc.text(joinDateStr, col2X, my + 16);

    // Contact
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('COORDONNÉES DE CONTACT :', col2X, my + 23);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(`Email : ${cleanPdfText(member.email) || 'Non renseigné'}`, col2X, my + 27.5);
    doc.text(`Tél : ${cleanPdfText(member.phone) || 'Non renseigné'}`, col2X, my + 31.5);

    // Horizontal inner divider
    const divY = memberBoxY + 49;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(col1X, divY, pageWidth - margin - 5, divY);

    // Survey / Profile Section: Loisirs, Compétences, Idée de Projet
    let py = divY + 5;
    
    // 1. Loisirs (NO EMOJI IN LABEL)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text('Loisir(s) & Centres d\'intérêt :', col1X, py);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    const cleanLoisir = cleanPdfText(member.loisir) || 'Non renseigné';
    const loisirLines = doc.splitTextToSize(cleanLoisir, contentWidth - 10);
    doc.text(loisirLines, col1X, py + 4);

    py += 4 + (loisirLines.length * 3.8);

    // 2. Compétences (NO EMOJI IN LABEL)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text('Compétence(s) & Savoir-faire :', col1X, py);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    const cleanComp = cleanPdfText(member.competence) || 'Non renseigné';
    const compLines = doc.splitTextToSize(cleanComp, contentWidth - 10);
    doc.text(compLines, col1X, py + 4);

    py += 4 + (compLines.length * 3.8);

    // 3. Idée de projet (NO EMOJI IN LABEL)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text('Idée de projet proposée pour le club :', col1X, py);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const cleanProj = cleanPdfText(member.project_idea);
    const projText = cleanProj ? `"${cleanProj}"` : 'Aucune idée particulière formulée lors de l\'adhésion.';
    const projLines = doc.splitTextToSize(projText, contentWidth - 10);
    doc.text(projLines, col1X, py + 4);

    // 6. OFFICIAL VERIFICATION & QR CODE & SIGNATURES
    y = memberBoxY + memberBoxH + 4;
    const sealBoxH = 48;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, sealBoxH, 2, 2, 'FD');

    // Generate Verification QR Code
    const verifyUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/rejoindre/${club.id}`
      : `http://localhost:3000/rejoindre/${club.id}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#003844',
          light: '#ffffff'
        }
      });
      doc.addImage(qrDataUrl, 'PNG', margin + 4, y + 4, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...primaryColor);
      doc.text('SCANNER LE QR CODE', margin + 5, y + 37.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(...textMuted);
      doc.text('Vérification en ligne de l\'adhésion', margin + 3.5, y + 41);
    } catch (e) {
      console.warn('QR Code generation for PDF failed:', e);
    }

    // Signatures & Official Stamp
    const stampX = margin + 42;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryDark);
    doc.text('VALIDATION & ENGAGEMENT ÉTUDIANT', stampX, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    const engagementText = "Par la présente, l'étudiant(e) adhère officiellement aux statuts et à la charte de vie étudiante de l'UPSSA pour l'année 2026-2027. Ce document atteste de son appartenance au bureau et aux activités du club.";
    const engLines = doc.splitTextToSize(engagementText, 70);
    doc.text(engLines, stampX, y + 12);

    // President signature block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('Pour le Club :', stampX, y + 29);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryDark);
    doc.text(cleanPdfText(club.president_name), stampX, y + 34);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('Président(e) en exercice', stampX, y + 38);

    // Official Stamp mockup (Right)
    const sealX = pageWidth - margin - 60;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(sealX, y + 5, 55, 36, 3, 3, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text('UPSSA AGADIR - CAMPUS', sealX + 8, y + 11);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.3);
    doc.line(sealX + 4, y + 13, sealX + 51, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text('DIRECTION DE LA', sealX + 11, y + 18);
    doc.text('VIE ÉTUDIANTE', sealX + 14, y + 22.5);

    doc.setFillColor(...primaryLight);
    doc.roundedRect(sealX + 6, y + 25, 43, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...primaryColor);
    doc.text('ADHÉSION VALIDÉE', sealX + 11, y + 29.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...textMuted);
    doc.text('Réf : ' + memberCode, sealX + 11, y + 35);

    // 7. FOOTER
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(`Document délivré électroniquement par le Portail UPSSA le ${new Date().toLocaleDateString('fr-FR')} - Fait foi pour l'année universitaire en cours.`, margin, pageHeight - 7.5);
    doc.text('Page 1/1', pageWidth - margin - 12, pageHeight - 7.5);

    // Automatic download
    if (autoDownload && typeof window !== 'undefined') {
      const sanitizedName = cleanPdfText(member.full_name || 'Etudiant').replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedClub = cleanPdfText(club.acronym || club.official_name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Attestation_Adhesion_${sanitizedName}_${sanitizedClub}.pdf`;
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
