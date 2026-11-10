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
            <span>Année Universitaire 2026 - 2027</span>
            <span>•</span>
            <span>Campus Universitaire Agadir</span>
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
