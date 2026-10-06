# Plan de sauvegarde et de restauration

## Nature des données

La base MongoDB `stock_researcher` contient uniquement des caches temporaires :

- `stock_cache`
- `research_cache`
- `regime_cache`
- `returns_cache`
- `radar_cache`

L’application ne stocke actuellement aucun compte utilisateur, mot de passe, portefeuille ou paiement.

Les caches peuvent être recréés à partir de Yahoo Finance et de Groq.

## Situation actuelle

Le cluster MongoDB Atlas gratuit ne fournit pas de sauvegarde automatique complète.

Cette situation est acceptable uniquement tant que la base contient exclusivement des caches régénérables.

## Procédure de restauration

En cas de perte de la base :

1. Recréer un cluster MongoDB Atlas.
2. Créer la base `stock_researcher`.
3. Créer un utilisateur applicatif limité au rôle `readWrite` sur cette base uniquement.
4. Configurer les règles réseau pour autoriser uniquement le serveur du backend.
5. Mettre la nouvelle adresse `MONGO_URI` dans les variables d’environnement du backend.
6. Redémarrer le backend.
7. Vérifier `GET /api/health`.
8. Effectuer quelques recherches dans l’application afin de régénérer les caches.

## Avant de stocker des données utilisateur

Avant d’ajouter des comptes, portefeuilles ou autres données importantes, il faudra obligatoirement :

- activer des sauvegardes automatiques ;
- définir une durée de conservation ;
- chiffrer les sauvegardes ;
- tester régulièrement une restauration ;
- documenter qui peut accéder aux sauvegardes ;
- mettre en place une surveillance des échecs de sauvegarde.

## Sécurité

Les exports de base de données, mots de passe et fichiers `.env` ne doivent jamais être ajoutés au dépôt Git.