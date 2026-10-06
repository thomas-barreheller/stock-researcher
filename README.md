# Stock Researcher

Application web bilingue permettant d’explorer les principales données financières d’une action, sa tendance récente et un brief généré par intelligence artificielle.

> Ce projet est un outil éducatif d’analyse financière. Il ne constitue pas un conseil en investissement.

## Fonctionnalités

- Recherche d’entreprises et autocomplétion des tickers
- Données financières provenant de Yahoo Finance
- Historique du cours sur un an
- Indicateurs : P/E, EPS, PEG, marge nette, bêta, dette et dividende
- Avis et objectifs de cours des analystes
- Analyse statistique de la tendance récente avec un modèle HMM
- Calcul du rendement théorique selon le modèle CAPM
- Radar d’activité inhabituelle sur un univers défini d’actions
- Brief financier généré par IA avec Groq
- Comparaison avec des concurrents
- Interface en français et en anglais
- Mode simple avec explications détaillées
- Interface responsive et accessible

## Technologies utilisées

### Frontend

- React
- Vite
- Tailwind CSS
- Recharts
- Framer Motion
- Lucide React

### Backend

- Python
- FastAPI
- yfinance
- NumPy
- hmmlearn
- MongoDB Atlas
- Groq API
- SlowAPI

## Installation locale

### Prérequis

- Python 3.11 ou supérieur
- Node.js et npm
- Un compte MongoDB Atlas
- Une clé API Groq

### 1. Installer le backend

Depuis la racine du projet :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Crée un fichier `.env` à la racine :

```env
GROQ_API_KEY=ta_cle_groq
MONGO_URI=ton_uri_mongodb
ALLOWED_ORIGINS=http://localhost:5173
ENABLE_API_DOCS=false
ENABLE_HSTS=false
RATE_LIMIT_DEFAULT=120/minute
RATE_LIMIT_RESEARCH=5/minute
```

Ne publie jamais le fichier `.env`.

Démarre ensuite le backend :

```powershell
python -m uvicorn main:app --reload --port 8001
```

Le backend sera disponible sur :

```text
http://localhost:8001
```

### 2. Installer le frontend

Dans un deuxième terminal :

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Le frontend sera disponible sur :

```text
http://localhost:5173
```

## Build de production

```powershell
cd frontend
npm.cmd run build
```

Les fichiers générés se trouvent dans `frontend/dist`.

## Variables d’environnement

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Clé privée utilisée pour générer les briefs IA |
| `MONGO_URI` | Connexion sécurisée à MongoDB Atlas |
| `ALLOWED_ORIGINS` | Origines autorisées par la politique CORS |
| `ENABLE_API_DOCS` | Active ou désactive la documentation FastAPI |
| `ENABLE_HSTS` | Active HSTS lorsque le site utilise HTTPS |
| `RATE_LIMIT_DEFAULT` | Limite générale des requêtes API |
| `RATE_LIMIT_RESEARCH` | Limite appliquée à la génération des briefs IA |
| `VITE_BACKEND_URL` | Adresse du backend utilisée par le frontend |

## Sécurité

Le projet comprend notamment :

- secrets exclus de Git grâce au `.gitignore`
- documentation FastAPI désactivée par défaut
- origines CORS configurables
- limitation du nombre de requêtes
- validation des entrées utilisateur
- messages d’erreur publics simplifiés
- en-têtes de sécurité HTTP
- compte MongoDB limité à la base nécessaire
- protection du prompt IA contre les instructions injectées
- absence de source maps dans le build de production
- audits des dépendances Python et npm

Avant une publication sur Internet :

1. remplacer `ALLOWED_ORIGINS` par l’adresse exacte du frontend ;
2. conserver les clés uniquement dans les variables secrètes de l’hébergeur ;
3. limiter l’accès réseau MongoDB Atlas au backend de production ;
4. activer `ENABLE_HSTS=true` uniquement lorsque HTTPS fonctionne ;
5. utiliser un stockage partagé pour le rate limiting si plusieurs instances du backend sont déployées.

## Vérification des dépendances

Backend :

```powershell
python -m pip_audit -r requirements.txt
```

Frontend :

```powershell
cd frontend
npm.cmd audit --omit=dev
```

## Limites importantes

- Les données Yahoo Finance peuvent être différées ou indisponibles.
- Le modèle HMM décrit des profils observés dans les cours passés : il ne prédit pas la prochaine variation.
- Le CAPM fournit un rendement théorique lié au risque, pas une prévision de gain.
- Les objectifs des analystes ne sont pas des rendements garantis.
- Le radar analyse un univers limité d’actions.
- Le brief IA peut contenir des erreurs et doit être vérifié.
- L’application ne remplace pas l’avis d’un professionnel qualifié.

## Structure du projet

```text
stock-app/
├── frontend/                  # Application React
├── main.py                    # API FastAPI
├── requirements.txt           # Dépendances Python
├── deployment.env.example     # Exemple de configuration
├── BACKUP_RESTORE.md          # Procédure de sauvegarde
├── start.bat                  # Démarrage local
└── README.md
```

## Avertissement

Les informations présentées sont fournies uniquement à titre éducatif et informatif. Elles ne constituent ni une recommandation d’achat ou de vente, ni un conseil financier personnalisé.