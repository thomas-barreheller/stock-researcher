@echo off
REM Lance le backend et le frontend de Stock Researcher, puis ouvre le
REM navigateur automatiquement. A placer dans un dossier "start" a
REM l'interieur de C:\stock-app (a cote des dossiers backend/frontend).

echo Demarrage de Stock Researcher...
echo.

REM Lance le backend (FastAPI/uvicorn) dans sa propre fenetre de terminal.
REM Adapte le chemin ci-dessous si ton dossier n'est pas C:\stock-app.
start "Stock Researcher - Backend" cmd /k "cd /d C:\stock-app && python -m uvicorn main:app --reload --port 8001"

REM Petite pause pour laisser le backend demarrer avant le frontend.
timeout /t 3 /nobreak >nul

REM Lance le frontend (Vite/React) dans une deuxieme fenetre.
start "Stock Researcher - Frontend" cmd /k "cd /d C:\stock-app\frontend && npm run dev"

REM Pause pour laisser Vite demarrer, puis ouverture automatique du navigateur.
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Les deux serveurs tournent dans leurs fenetres respectives.
echo Ferme cette fenetre-ci si tu veux (les deux autres restent actives).
