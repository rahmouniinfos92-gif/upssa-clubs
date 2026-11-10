import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  async generateDataUrl(text: string, width = 300): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width,
        margin: 2,
        color: {
          dark: '#003844',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      return '';
    }
  }

  getJoinUrl(clubId: number | string): string {
    const origin = (typeof window !== 'undefined') ? window.location.origin : 'http://localhost:3000';
    return `${origin}/rejoindre/${clubId}`;
  }
}

