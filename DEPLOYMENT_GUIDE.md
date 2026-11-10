# Guide de Déploiement : Portail des Clubs UPSSA

Ce guide vous explique pas-à-pas comment héberger la plateforme **Portail des Clubs UPSSA** soit sur un **VPS à 4$/mois (recommandé)** comme DigitalOcean / Hetzner, soit sur une **solution 100% gratuite**.

---

## 🎯 Comparatif rapide

| Critère | VPS DigitalOcean / Hetzner (4$/mois) ⭐ | Hébergement 100% Gratuit (Fly.io) | Plateformes Gratuites Classiques (Render, Railway...) |
| :--- | :--- | :--- | :--- |
| **Persistance SQLite (`clubs.db`)** | ✅ **100% Garanti** (disque SSD persistant) | ✅ **Oui** (avec volume Fly.io de 1 Go) | ❌ **Non** (disque éphémère réinitialisé au redémarrage) |
| **Persistance des logos / uploads** | ✅ **100% Garanti** | ✅ **Oui** (monté sur volume) | ❌ **Non** (images perdues) |
| **Mise en veille (Cold Start)** | ✅ **Aucune veille** (accessible instantanément 24/7) | ⚠️ Mise en veille possible après inactivité | ⚠️ Mise en veille (30 à 50s de délai de réveil) |
| **Performance & RAM** | 🚀 Dédié, très rapide (< 150 Mo RAM) | ⚡ 256 Mo partagé | ⚡ 512 Mo partagé |
| **Nom de domaine & SSL HTTPS** | ✅ Inclus gratuitement avec Certbot | ✅ Sous-domaine `.fly.dev` inclus | ✅ Sous-domaine inclus |

---

## Option 1 (Recommandée) : DigitalOcean Droplet (4$ à 6$/mois)

Le VPS est le choix idéal pour une application universitaire avec SQLite et des pièces jointes (logos, attestations PDF, inscriptions étudiants).

### Étape 1 : Créer votre serveur Droplet
1. Créez un compte sur [DigitalOcean](https://www.digitalocean.com/).
2. Cliquez sur **Create** > **Droplets**.
3. Choisissez :
   - **Distribution** : `Ubuntu 24.04 LTS` (ou `22.04 LTS`)
   - **Plan** : `Basic`
   - **CPU option** : `Regular with SSD` -> **4$/mois** (512 Mo RAM / 10 Go SSD) ou **6$/mois** (1 Go RAM / 25 Go SSD recommandé).
   - **Datacenter** : Francfort (Europe) ou Londres.
   - **Authentication** : Mot de passe root ou clé SSH.
4. Cliquez sur **Create Droplet**. Notez l'adresse IP publique fournie (ex: `159.65.120.45`).

### Étape 2 : Transférer les fichiers du projet
Depuis votre terminal local Mac :
```bash
# Se placer dans le dossier du projet
cd /Users/mac/.gemini/antigravity/scratch/club-creation-portal

# Envoyer le projet sur le serveur via rsync ou scp
rsync -avz --exclude 'node_modules' --exclude '.angular' ./ root@VOTRE_IP_DROPLET:/var/www/club-portal/
```

### Étape 3 : Lancer le déploiement en 1 seule commande
Connectez-vous à votre Droplet en SSH :
```bash
ssh root@VOTRE_IP_DROPLET
```

Puis exécutez le script automatique de déploiement préparé dans le projet :
```bash
cd /var/www/club-portal
chmod +x deploy-digitalocean.sh
./deploy-digitalocean.sh
```

**Ce script s'occupe de tout automatiquement :**
- Installation de Docker et Docker Compose
- Configuration du pare-feu (UFW autorisant les ports 22, 80, 443)
- Création du dossier persistant `data/` pour SQLite et les logos
- Compilation du conteneur optimisé et démarrage automatique en arrière-plan (`restart: always`)

Votre application sera immédiatement disponible sur :
👉 **`http://VOTRE_IP_DROPLET`**

---

### Étape 4 (Optionnel mais recommandé) : Ajouter un nom de domaine et HTTPS gratuit (SSL)
Si vous avez un nom de domaine (ex: `clubs.upssa.ac.ma` ou `upssa-clubs.com`) :
1. Faites pointer un enregistrement DNS `A` vers l'IP de votre Droplet.
2. Installez Nginx et Certbot :
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
3. Configurez le reverse-proxy Nginx pour renvoyer vers le port `3000` (ou laissez le conteneur sur le port 80 si vous n'avez pas d'autres sites).
4. Générez le certificat SSL gratuit :
   ```bash
   sudo certbot --nginx -d votre-domaine.com
   ```

---

## Option 2 : Hébergement 100% Gratuit sur Fly.io

Si vous souhaitez dépenser **0 dollar**, **Fly.io** est la meilleure solution car elle offre des disques persistants gratuits pour SQLite.

### Étape 1 : Installer le CLI Flyctl
Sur votre Mac :
```bash
brew install flyctl
fly auth signup
```

### Étape 2 : Créer l'application et le volume persistant
Dans le dossier du projet :
```bash
cd /Users/mac/.gemini/antigravity/scratch/club-creation-portal

# Initialiser l'application
fly launch --no-deploy

# Créer un volume persistant de 1 Go pour stocker clubs.db et les uploads
fly volumes create club_data --region cdg --size 1
```

### Étape 3 : Ajuster `fly.toml`
Vérifiez que votre fichier `fly.toml` contient le montage de volume :
```toml
[env]
  PORT = "3000"
  DB_PATH = "/app/data/clubs.db"
  UPLOADS_DIR = "/app/data/uploads"

[[mounts]]
  source = "club_data"
  destination = "/app/data"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
```

### Étape 4 : Déployer
```bash
fly deploy
```
Votre application sera en ligne gratuitement sur :
👉 **`https://votre-app.fly.dev`** avec SSL HTTPS inclus !

---

## Option 3 : Alternative VPS Pas Cher (Hetzner Cloud ~3,80€/mois)
Si vous préférez un fournisseur européen très performant :
- [Hetzner Cloud](https://www.hetzner.com/cloud) propose le serveur **CX22** (2 vCPU, 4 Go RAM, 40 Go SSD) pour environ **3,79 € / mois**.
- Le déploiement se fait exactement avec la même commande `./deploy-digitalocean.sh`.

---

## 🛠️ Commandes de Maintenance utiles sur le serveur

```bash
# Voir les logs en direct
docker compose logs -f

# Redémarrer l'application
docker compose restart

# Sauvegarder la base de données des clubs et inscriptions
cp data/clubs.db backup_clubs_$(date +%F).db

# Mettre à jour l'application après une modification de code
docker compose up -d --build
```

