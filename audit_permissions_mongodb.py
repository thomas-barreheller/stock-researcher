import os
import sys
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import OperationFailure, PyMongoError


ROOT = Path(__file__).resolve().parent
ENV_FILE = ROOT / ".env"

AUTHORIZED_DB = "stock_researcher"
FORBIDDEN_DB = "security_permission_forbidden"


def main():
    load_dotenv(ENV_FILE)

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise RuntimeError("MONGO_URI est absente du fichier .env.")

    test_id = f"permission-test-{uuid4().hex}"
    collection_name = f"_permission_test_{uuid4().hex}"

    client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
    )

    authorized_collection = client[AUTHORIZED_DB][collection_name]
    forbidden_collection = client[FORBIDDEN_DB][collection_name]

    authorized_created = False
    forbidden_created = False

    try:
        client.admin.command("ping")
        print("OK : connexion à MongoDB réussie.")

        # Vérifie les droits nécessaires à l'application.
        authorized_collection.insert_one(
            {
                "_id": test_id,
                "purpose": "temporary-permission-audit",
            }
        )
        authorized_created = True

        document = authorized_collection.find_one({"_id": test_id})
        if document is None:
            raise RuntimeError(
                "La lecture dans la base stock_researcher a échoué."
            )

        authorized_collection.delete_one({"_id": test_id})
        authorized_created = False

        print(
            "OK : lecture et écriture autorisées dans "
            f"la base {AUTHORIZED_DB}."
        )

        # Vérifie que le compte ne peut pas écrire dans une autre base.
        try:
            forbidden_collection.insert_one(
                {
                    "_id": test_id,
                    "purpose": "temporary-forbidden-permission-audit",
                }
            )
            forbidden_created = True

        except OperationFailure:
            print("OK : écriture refusée dans une autre base MongoDB.")

        else:
            raise RuntimeError(
                "DANGER : le compte MongoDB peut écrire dans une autre base. "
                "Ses permissions sont trop larges."
            )

        print()
        print("CONCLUSION : permissions MongoDB correctement limitées.")

    finally:
        # Nettoyage des données temporaires, même en cas d'erreur.
        if authorized_created:
            try:
                authorized_collection.delete_one({"_id": test_id})
            except PyMongoError:
                pass

        try:
            client[AUTHORIZED_DB].drop_collection(collection_name)
        except PyMongoError:
            pass

        if forbidden_created:
            try:
                forbidden_collection.delete_one({"_id": test_id})
                client[FORBIDDEN_DB].drop_collection(collection_name)
            except PyMongoError:
                pass

        client.close()


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, PyMongoError) as exc:
        print(f"ERREUR : {exc}", file=sys.stderr)
        sys.exit(1)