import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="app-layout">
      <app-header></app-header>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <div class="container footer-container">
          <div class="footer-left">
            <div class="footer-logo-wrap">
              <img src="/upssa-logo.png" alt="Logo UPSSA" class="footer-logo">
            </div>
            <div class="footer-text-block">
              <strong>UPSSA — Université Privée de la Santé et des Sciences d'Agadir</strong>
              <p>Direction de la Vie Étudiante, des Affaires Culturelles & du Sport — Service des Clubs & Activités Para-universitaires</p>
            </div>
          </div>
          <div class="footer-right">
            <span>Année 2026 - 2027</span>
            <span>•</span>
            <span>Campus Agadir</span>
            <span>•</span>
            <a href="https://www.instagram.com/upssa.connect/" target="_blank" rel="noopener noreferrer" class="instagram-footer-link" title="Suivez UPSSA Connect sur Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>&#64;upssa.connect</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
    }
    .app-footer {
      background: #02232b;
      color: #94a3b8;
      border-top: 1px solid #043845;
      padding: 2rem 0;
      font-size: 0.84rem;
    }
    .footer-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .footer-logo-wrap {
      background: #ffffff;
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
    }
    .footer-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
    }
    .footer-text-block strong {
      color: #ffffff;
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.92rem;
    }
    .footer-text-block p {
      color: #94a3b8;
      font-size: 0.8rem;
    }
    .footer-right {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      white-space: nowrap;
      color: #64748b;
      font-size: 0.8rem;
    }
    .instagram-footer-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(0, 154, 166, 0.15);
      color: #00bcd4;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid rgba(0, 154, 166, 0.3);
    }
    .instagram-footer-link:hover {
      background: rgba(0, 154, 166, 0.3);
      color: #ffffff;
      border-color: #00bcd4;
    }
    @media (max-width: 860px) {
      .footer-container {
        flex-direction: column;
        text-align: center;
      }
      .footer-left {
        flex-direction: column;
      }
      .footer-right {
        flex-direction: column;
        gap: 0.35rem;
      }
    }
  `]
})
export class AppComponent {
  title = 'UPSSA - Portail de Création des Clubs Étudiants';
}
