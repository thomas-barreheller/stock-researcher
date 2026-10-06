from pathlib import Path
import sys

from dotenv import dotenv_values


ROOT = Path(__file__).resolve().parent
ENV_FILE = ROOT / ".env"

# Dossiers à ne jamais analyser.
IGNORED_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "backups",
    ".pytest_cache",
    ".mypy_cache",
}

# Fichiers texte dans lesquels une clé pourrait avoir été copiée.
TEXT_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".html",
    ".css",
    ".map",
    ".md",
    ".txt",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".cfg",
}

# Ces mots permettent de repérer les variables probablement sensibles.
SENSITIVE_NAME_PARTS = {
    "KEY",
    "SECRET",
    "TOKEN",
    "PASSWORD",
    "PASSWD",
    "DATABASE",
    "MONGO",
    "URI",
    "DSN",
    "PRIVATE",
    "CREDENTIAL",
}


def is_ignored(path: Path) -> bool:
    """Indique si le fichier appartient à un dossier ignoré."""
    try:
        relative = path.relative_to(ROOT)
    except ValueError:
        return True

    return any(part.lower() in {name.lower() for name in IGNORED_DIRS} for part in relative.parts)


def is_env_file(path: Path) -> bool:
    """Exclut les vrais fichiers .env qui contiennent normalement les secrets."""
    name = path.name.lower()

    # Les fichiers d'exemple restent analysables, car ils ne doivent contenir
    # que des valeurs factices.
    if name.endswith(".example") or name.endswith(".sample"):
        return False

    return name == ".env" or name.startswith(".env.")


def looks_sensitive(variable_name: str, value: str) -> bool:
    """Évite de rechercher des valeurs ordinaires comme true, false ou 8001."""
    upper_name = variable_name.upper()

    sensitive_name = any(part in upper_name for part in SENSITIVE_NAME_PARTS)

    # Une valeur très courte provoquerait beaucoup de faux positifs.
    long_enough = len(value.strip()) >= 8

    return sensitive_name and long_enough


def load_secrets() -> dict[str, str]:
    """Charge les secrets sans jamais les afficher dans le terminal."""
    if not ENV_FILE.exists():
        raise FileNotFoundError(f"Fichier introuvable : {ENV_FILE}")

    env_values = dotenv_values(ENV_FILE)
    secrets = {}

    for variable_name, raw_value in env_values.items():
        if raw_value is None:
            continue

        value = str(raw_value).strip()

        if not value:
            continue

        if looks_sensitive(variable_name, value):
            secrets[variable_name] = value

    return secrets


def files_to_scan():
    """Renvoie les fichiers texte du projet, y compris le build frontend."""
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue

        if is_ignored(path) or is_env_file(path):
            continue

        if path.name == Path(__file__).name:
            continue

        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue

        yield path


def main():
    try:
        secrets = load_secrets()
    except (OSError, UnicodeError) as exc:
        print(f"ERREUR : {exc}", file=sys.stderr)
        sys.exit(1)

    if not secrets:
        print("Aucune variable sensible exploitable n'a été trouvée dans .env.")
        print("Vérifie que les clés ont bien un nom comme API_KEY, TOKEN, MONGO_URI ou PASSWORD.")
        return

    print(f"Variables sensibles contrôlées : {len(secrets)}")
    print("Les valeurs secrètes ne seront jamais affichées.")
    print()

    findings = []

    for path in files_to_scan():
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        for variable_name, secret_value in secrets.items():
            if secret_value not in content:
                continue

            for line_number, line in enumerate(content.splitlines(), start=1):
                if secret_value in line:
                    findings.append(
                        {
                            "variable": variable_name,
                            "path": path.relative_to(ROOT),
                            "line": line_number,
                        }
                    )

    print("=== RECHERCHE DES VALEURS SECRÈTES DANS LE PROJET ===")

    if not findings:
        print("OK : aucune valeur sensible de .env n'a été retrouvée ailleurs.")
        print("Cela inclut les sources et le build frontend présent sur le disque.")
    else:
        print("ATTENTION : des valeurs sensibles ont été retrouvées :")
        print()

        for finding in findings:
            print(
                f"- Variable : {finding['variable']} | "
                f"Fichier : {finding['path']} | "
                f"Ligne : {finding['line']}"
            )

        print()
        print("Les valeurs elles-mêmes n'ont pas été affichées.")
        print("Ne publie pas le projet avant d'avoir supprimé ces occurrences.")

    vite_secrets = [
        name
        for name in secrets
        if name.upper().startswith("VITE_")
    ]

    print()
    print("=== VARIABLES FRONTEND VITE ===")

    if vite_secrets:
        print("ATTENTION : variable(s) sensible(s) commençant par VITE_ :")
        for name in vite_secrets:
            print(f"- {name}")
        print(
            "Une variable VITE_ peut être intégrée au JavaScript envoyé au navigateur. "
            "Elle ne doit jamais contenir un secret."
        )
    else:
        print("OK : aucune variable sensible détectée avec le préfixe VITE_.")

    if findings or vite_secrets:
        sys.exit(1)


if __name__ == "__main__":
    main()