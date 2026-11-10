#!/bin/bash
# =============================================================================
# Script de déploiement automatique - Portail UPSSA Club sur DigitalOcean / VPS
# OS supporté : Ubuntu 22.04 / 24.04 LTS
# =============================================================================

set -e

echo "🚀 Début du déploiement du Portail des Clubs UPSSA..."

# 1. Mise à jour système
echo "📦 Mise à jour des paquets système..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw

# 2. Installation de Docker et Docker Compose (si non installés)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm -f get-docker.sh
fi

if ! docker compose version &> /dev/null; then
    echo "🐳 Installation du plugin Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
fi

# 3. Configuration du Pare-feu UFW
echo "🛡️ Configuration du pare-feu (UFW)..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Préparation des répertoires de données persistantes
echo "💾 Préparation du stockage persistant (Base SQLite & Logos)..."
mkdir -p data/uploads

# Copie de la base de données initiale si le dossier data est vierge
if [ ! -f "data/clubs.db" ] && [ -f "backend/clubs.db" ]; then
    echo "📋 Copie de la base initiale existante vers data/clubs.db..."
    cp backend/clubs.db data/clubs.db
    # Si le dossier uploads contient des logos
    if [ -d "backend/uploads" ]; then
        cp -r backend/uploads/* data/uploads/ 2>/dev/null || true
    fi
fi

# 5. Build et lancement du conteneur Docker
echo "🏗️ Construction et lancement du conteneur Docker..."
docker compose down || true
docker compose up -d --build

# 6. Vérification du statut
echo "⏳ Attente du démarrage de l'application..."
sleep 3
docker compose ps

SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo "============================================================================="
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "🌐 Votre plateforme UPSSA est accessible en direct sur : http://${SERVER_IP}"
echo "📊 Pour consulter les logs : docker compose logs -f"
echo "🔄 Pour redémarrer : docker compose restart"
echo "============================================================================="

