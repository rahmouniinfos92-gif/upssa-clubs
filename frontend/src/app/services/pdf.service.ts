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
}
