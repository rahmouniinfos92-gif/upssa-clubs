import { Routes } from '@angular/router';
import { ClubFormComponent } from './components/club-form/club-form.component';
import { ClubTrackingComponent } from './components/club-tracking/club-tracking.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ClubDirectoryComponent } from './components/club-directory/club-directory.component';
import { JoinClubComponent } from './components/join-club/join-club.component';

export const routes: Routes = [
  { path: '', redirectTo: 'nouveau-club', pathMatch: 'full' },
  { path: 'nouveau-club', component: ClubFormComponent, title: 'Déposer une Demande de Club | Université' },
  { path: 'suivi', component: ClubTrackingComponent, title: 'Suivi de Demande | Commission Vie Étudiante' },
  { path: 'admin', component: AdminDashboardComponent, title: 'Commission & Validation | Espace Administratif' },
  { path: 'clubs', component: ClubDirectoryComponent, title: 'Annuaire des Clubs Agréés' },
  { path: 'rejoindre/:id', component: JoinClubComponent, title: 'Rejoindre le Club en tant que Membre | UPSSA' },
  { path: 'rejoindre', component: JoinClubComponent, title: 'Rejoindre le Club en tant que Membre | UPSSA' },
  { path: '**', redirectTo: 'nouveau-club' }
];
