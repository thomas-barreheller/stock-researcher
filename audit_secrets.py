from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent

# Dossiers inutiles ou sensibles à ne pas analyser.
IGNORED_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "venv",
    "backups",
}

# Le vrai fichier .env ne doit jamais être lu ni affiché par cet audit.
IGNORED_FILES = {
    ".env",
    "audit_secrets.py",
}

TEXT_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".html",
    ".css",
    ".md",
    ".txt",
    ".bat",
    ".ps1",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".cfg",
}

# Motifs correspondant à plusieurs formats connus de secrets.
SECRET_PATTERNS = [
    (
        "Clé API Groq potentielle",
        re.compile(r"\bgsk_[A-Za-z0-9_-]{20,}"),
    ),
    (
        "Clé API OpenAI potentielle",
        re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}"),
    ),
    (
        "Jeton GitHub potentiel",
        re.compile(
            r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}"
            r"|\bgithub_pat_[A-Za-z0-9_]{20,}"
        ),
    ),
    (
        "Clé AWS potentielle",
        re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    ),
    (
        "Adresse MongoDB contenant des identifiants",
        re.compile(
            r"mongodb(?:\+srv)?://[^:\s/'\"]+:[^@\s/'\"]+@",
            re.IGNORECASE,
        ),
    ),
            (
            "Secret potentiellement écrit directement dans le code",
            re.compile(
                r"""(?i)\b(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|password|passwd|mongo[_-]?uri)\b\s*[:=]\s*(?:"[^"]{8,}"|'[^']{8,}')"""
            ),
        ),
]


def should_scan(path: Path) -> bool:
    """Indique si le fichier peut être analysé sans risque."""
    if path.name in IGNORED_FILES:
        return False

    if any(part in IGNORED_DIRS for part in path.parts):
        return False

    # Ignore tous les vrais fichiers .env, mais autorise les modèles
    # comme .env.example.
    if path.name.startswith(".env") and not path.name.endswith(".example"):
        return False

    if path.suffix.lower() in TEXT_EXTENSIONS:
        return True

    return path.name.endswith(".env.example")


def scan_file(path: Path):
    """Cherche des secrets sans jamais afficher leur valeur."""
    try:
        content = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []

    findings = []

    for line_number, line in enumerate(content.splitlines(), start=1):
        for description, pattern in SECRET_PATTERNS:
            if pattern.search(line):
                findings.append(
                    {
                        "path": path.relative_to(ROOT),
                        "line": line_number,
                        "description": description,
                    }
                )

    return findings


def main():
    print("=== AUDIT DES SECRETS ÉCRITS DANS LE CODE ===")
    print("Le contenu du fichier .env ne sera ni lu ni affiché.\n")

    findings = []

    for path in ROOT.rglob("*"):
        if path.is_file() and should_scan(path):
            findings.extend(scan_file(path))

    if not findings:
        print("OK : aucun secret évident n'a été détecté dans les fichiers analysés.")
    else:
        print(f"ATTENTION : {len(findings)} élément(s) potentiel(s) détecté(s).\n")

        for finding in findings:
            print(
                f"- {finding['path']}:{finding['line']} "
                f"— {finding['description']}"
            )

        print(
            "\nAucune valeur sensible n'a été affichée. "
            "Il faudra examiner uniquement les fichiers et lignes indiqués."
        )

    print(
        "\nImportant : cet audit automatique est une vérification de sécurité "
        "supplémentaire, mais il ne peut pas garantir l'absence absolue de secret."
    )


if __name__ == "__main__":
    main()