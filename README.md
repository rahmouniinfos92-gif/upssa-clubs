# Portail de Création & Validation des Clubs Étudiants

Application Full-Stack moderne (Angular 18 + Node.js / Express + Base de Données SQLite) conçue pour structurer l'enregistrement, l'évaluation et l'agrément officiel des clubs étudiants au sein de l'université.

---

## 🏛️ Structure des 6 Sections du Formulaire Intégré

L'application implémente fidèlement l'intégralité du modèle officiel en 6 étapes :

1. **Identité & Catégorisation du Club**
   - Nom officiel du club (court, impactant et clair)
   - Acronyme / Sigle
   - Slogan / Devise
   - Typologie (Académique/Scientifique & Médical, Culturel & Artistique, Sport & Bien-être, Citoyenneté/Humanitaire & RSE, Entrepreneuriat/Débat & Innovation)
   - Logo & Identité visuelle (Import direct HD ou URL)

2. **Bureau Exécutif & Membres Fondateurs**
   - Règle recommandée : Minimum 3 à 5 membres fondateurs inscrits pour l'année universitaire en cours
   - Président(e) : Nom & Prénom, Filière / Année, Email universitaire, Téléphone (WhatsApp)
   - Vice-Président(e), Secrétaire Général(e), Trésorier(ère), Responsable Communication
   - Liste dynamique de membres fondateurs additionnels (Ajout / Suppression)
   - Parrain / Tuteur pédagogique (*Faculty Advisor*) + Accord de principe [Oui / En attente]

3. **Vision, Objectifs & Valeurs**
   - Mission principale (2-3 phrases)
   - Objectifs mesurables pour l'année universitaire (KPIs chiffrés)
   - Valeur ajoutée pour la vie de campus & distinction des clubs existants
   - Public cible (Ouvert à toute l'université ou Spécifique à certains cycles/filières)

4. **Plan d'Action Annuel Prévisionnel**
   - Événement phare #1 (Semestre 1) : Titre, date estimée, besoins logistiques
   - Événement phare #2 (Semestre 2) : Titre, date estimée
   - Rythme des réunions internes : Hebdomadaire, Bimensuel ou Mensuel

5. **Estimation Budgétaire & Ressources**
   - Budget prévisionnel global annuel (en MAD)
   - Sources de financement envisagées (Cotisations, Sponsoring, Subvention, Ventes)
   - Besoins matériels ou d'espaces permanents (stockage, local régulier)

6. **Engagement, Signature & Récapitulatif**
   - Récapitulatif complet du dossier
   - Déclaration sur l'honneur certifiant l'exactitude
   - Engagement au respect du règlement intérieur et de la charte de vie étudiante
   - Nom du déclarant & date de soumission

---

## 🚀 Fonctionnalités Clés

- **Formulaire Multi-étapes (Stepper)** : Navigation fluide, validation interactive, sauvegarde locale et bouton "Pré-remplir un exemple complet" pour des tests rapides.
- **Génération Automatique de Code de Suivi** : Référence unique sécurisée (ex: `CLUB-2026-AZ6H`).
- **Espace de Suivi Étudiant (`/suivi`)** : Pipeline visuel de l'avancement (Soumis ➔ Commission ➔ Décision), consultation des remarques et de l'avis de la commission, impression du récépissé.
- **Espace Commission & Validation (`/admin`)** : Tableau de bord administratif pour la commission de la vie étudiante avec métriques clés (KPIs), filtres avancés (statut, typologie, recherche), modal d'instruction complète et mise à jour de statut (Approuvé, En cours, Retouche demandée, Refusé) avec avis motivé.
- **Annuaire des Clubs Agréés (`/clubs`)** : Vitrine publique des associations étudiantes reconnues par l'université.

---

## 🛠️ Stack Technique

- **Frontend** : Angular 18 (Standalone Components, Reactive Forms, Router, HTTP Client, CSS moderne avec design system universitaire réactif).
- **Backend** : Node.js + Express (REST API, upload de fichiers Multer).
- **Base de Données** : SQLite avec le module natif haute performance `node:sqlite` (`clubs.db`), indexation optimisée et mode WAL.

---

## 💻 Démarrage Rapide

### Mode Unifié (Recommandé)
Le backend sert à la fois les routes API `/api` et le frontend Angular compilé :

```bash
cd backend
npm start
```
Accédez ensuite à l'application dans votre navigateur :  
👉 **http://localhost:3000**

### Mode Développement Séparé
Si vous souhaitez modifier le code frontend en direct avec rechargement à chaud (*hot-reload*) :

1. **Lancer le Backend** (Port 3000) :
   ```bash
   cd backend
   npm start
   ```

2. **Lancer le Frontend Angular** (Port 4200) :
   ```bash
   cd frontend
   npm start
   ```
👉 Accédez à **http://localhost:4200**

---

## 📌 Codes de Suivi de Démonstration

Des dossiers sont déjà pré-enregistrés dans la base SQLite pour tester immédiatement le système :

- `CLUB-2026-SP01` : **Club Sport** (Statut : *Approuvé*)
- `CLUB-2026-AR02` : **Club Artistique** (Statut : *Approuvé*)
- `CLUB-2026-SC03` : **Club Scientifique** (Statut : *Approuvé*)
- `CLUB-2026-IN04` : **Club Science et Innovation** (Statut : *Approuvé*)
- `CLUB-2026-SY05` : **Club Synapse** (Statut : *Approuvé*)

