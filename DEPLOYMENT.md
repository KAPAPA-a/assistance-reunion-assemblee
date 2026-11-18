# 🚀 Guide de Déploiement en Production — Gestion Accueil

Cette application Next.js 15 avec Prisma et PostgreSQL peut être déployée facilement selon 3 méthodes au choix.

---

## Méthode 1 : Déploiement Clé en Main avec Docker (Recommandé)

Une configuration complète multi-conteneurs (`Next.js` + `PostgreSQL` avec persistance des volumes) est fournie.

### Prérequis :
- [Docker](https://www.docker.com/) & Docker Compose installés sur le serveur.

### Étapes de déploiement :
1. Modifiez le mot de passe de la base dans le fichier [docker-compose.yml](file:///c:/Users/Utilisateur/Desktop/ASSISTANCE%20REUNION/docker-compose.yml) (`POSTGRES_PASSWORD` et dans l'URL `DATABASE_URL`).
2. Lancez l'application en arrière-plan :
   ```bash
   docker compose up -d --build
   ```
3. Exécutez la migration initiale de la base de données :
   ```bash
   docker compose exec app npx prisma db push
   ```
4. Votre application est disponible sur `http://localhost:3000` (ou sur l'IP/domaine de votre serveur).
5. Pour vérifier l'état de santé du service :
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## Méthode 2 : Déploiement Cloud (Vercel + Base Serverless)

Idéal pour un hébergement gratuit ou sans maintenance de serveur.

1. **Base de données :**
   - Créez un projet PostgreSQL gratuit sur [Supabase](https://supabase.com) ou [Neon](https://neon.tech).
   - Récupérez l'URL de connexion (Connection String).
2. **Hébergement Web (Vercel) :**
   - Connectez votre dépôt Git à [Vercel](https://vercel.com).
   - Ajoutez la variable d'environnement :
     - `DATABASE_URL` = `postgresql://...`
   - Déployez. Prisma exécutera automatiquement `prisma generate` lors du build.
3. **Synchronisation du schéma :**
   - Depuis votre machine locale :
     ```bash
     DATABASE_URL="votre_url_supabase" npx prisma db push
     ```

---

## Méthode 3 : Serveur Dédié / VPS Linux (Ubuntu / Debian)

### 1. Prérequis sur le serveur
```bash
sudo apt update && sudo apt install -y nodejs npm postgresql postgresql-contrib nginx
sudo npm install -g pnpm pm2
```

### 2. Configuration PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE gestion_accueil;
CREATE USER gestionnaire WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_secret';
GRANT ALL PRIVILEGES ON DATABASE gestion_accueil TO gestionnaire;
\q
```

### 3. Installation et Build du projet
```bash
cd /var/www/gestion-accueil
pnpm install
# Créez le fichier .env
nano .env
# Contenu : DATABASE_URL="postgresql://gestionnaire:votre_mot_de_passe_secret@localhost:5432/gestion_accueil?schema=public"

npx prisma db push
pnpm run build
```

### 4. Démarrage avec PM2
```bash
pm2 start pnpm --name "gestion-accueil" -- start
pm2 save
pm2 startup
```

### 5. Configuration Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Activez le SSL avec Certbot :
```bash
sudo certbot --nginx -d votre-domaine.com
```

---

## 🔒 Sauvegarde et Maintenance

- **Sauvegardes automatiques :** Vous pouvez exporter la base à tout moment au format JSON depuis le module [Paramètres](file:///c:/Users/Utilisateur/Desktop/ASSISTANCE%20REUNION/src/app/parametres/page.tsx).
- **Sauvegarde SQL native :**
  ```bash
  pg_dump -U postgres gestion_accueil > backup_$(date +%Y%m%d).sql
  ```
