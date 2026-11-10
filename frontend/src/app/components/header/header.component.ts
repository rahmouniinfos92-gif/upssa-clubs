import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <div class="container header-container">
        <a routerLink="/" class="logo-area">
          <img 
            src="/upssa-logo.png" 
            alt="Logo UPSSA - Université Privée de la Santé et des Sciences d'Agadir" 
            class="header-upssa-logo"
          >
          <div class="logo-divider"></div>
          <div class="logo-text">
            <span class="portal-badge">Vie Étudiante & Campus</span>
            <span class="main-title">Portail des Clubs</span>
          </div>
        </a>

        <nav class="nav-links">
          <a routerLink="/nouveau-club" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📝</span>
            <span>Déposer un Dossier</span>
          </a>
          <a routerLink="/suivi" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔍</span>
            <span>Suivi de Demande</span>
          </a>
          <a routerLink="/clubs" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🎓</span>
            <span>Clubs Agréés</span>
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-item admin-badge-btn">
            <span class="nav-icon">🏛️</span>
            <span>Commission & Validation</span>
          </a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: var(--shadow-sm);
    }
    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 78px;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
    }
    .header-upssa-logo {
      height: 52px;
      width: auto;
      object-fit: contain;
      transition: transform 0.2s ease;
    }
    .header-upssa-logo:hover {
      transform: scale(1.02);
    }
    .logo-divider {
      width: 1px;
      height: 38px;
      background-color: var(--border-color);
    }
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    .portal-badge {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary);
      font-weight: 800;
    }
    .main-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: -0.01em;
      line-height: 1.2;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.95rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #475569;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
    }
    .nav-item:hover {
      background: #f1f5f9;
      color: var(--primary);
    }
    .nav-item.active {
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
    }
    .admin-badge-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #1e293b;
    }
    .admin-badge-btn:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    .admin-badge-btn.active {
      background: var(--secondary);
      color: #ffffff;
      border-color: var(--secondary);
    }
    @media (max-width: 960px) {
      .header-container {
        flex-direction: column;
        height: auto;
        padding: 0.85rem 1rem;
        gap: 0.75rem;
      }
      .logo-area {
        justify-content: center;
      }
      .header-upssa-logo {
        height: 44px;
      }
      .nav-links {
        flex-wrap: wrap;
        justify-content: center;
        width: 100%;
      }
    }
  `]
})
export class HeaderComponent {}
