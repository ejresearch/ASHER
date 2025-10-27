"""
Document Storage System for ASHER
Provides persistent storage for uploaded reference documents
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime


class DocumentStorage:
    """Manages persistent storage of reference documents"""

    def __init__(self, storage_path: str = "data/documents.json"):
        """
        Initialize document storage

        Args:
            storage_path: Path to JSON file for storing documents
        """
        self.storage_path = Path(storage_path)
        self.documents: Dict[str, dict] = {}

        # Create data directory if it doesn't exist
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

        # Load existing documents
        self.load()

    def load(self) -> None:
        """Load documents from storage file"""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    self.documents = json.load(f)
                print(f"📚 Loaded {len(self.documents)} documents from storage")
            except Exception as e:
                print(f"⚠️  Error loading documents: {e}")
                self.documents = {}
        else:
            print("📝 No existing documents found, starting fresh")
            self.documents = {}

    def save(self) -> None:
        """Save documents to storage file"""
        try:
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(self.documents, f, indent=2, ensure_ascii=False)
            print(f"💾 Saved {len(self.documents)} documents to storage")
        except Exception as e:
            print(f"❌ Error saving documents: {e}")
            raise

    def add(self, doc_id: str, document: dict) -> dict:
        """
        Add a document to storage

        Args:
            doc_id: Unique document identifier
            document: Document data dictionary

        Returns:
            The stored document
        """
        # Add timestamp if not present
        if 'uploaded_at' not in document:
            document['uploaded_at'] = datetime.now().isoformat()

        self.documents[doc_id] = document
        self.save()
        return document

    def get(self, doc_id: str) -> Optional[dict]:
        """
        Get a document by ID

        Args:
            doc_id: Document identifier

        Returns:
            Document data or None if not found
        """
        return self.documents.get(doc_id)

    def get_all(self) -> List[dict]:
        """
        Get all documents

        Returns:
            List of all documents
        """
        return list(self.documents.values())

    def delete(self, doc_id: str) -> Optional[dict]:
        """
        Delete a document

        Args:
            doc_id: Document identifier

        Returns:
            The deleted document or None if not found
        """
        if doc_id in self.documents:
            deleted = self.documents.pop(doc_id)
            self.save()
            return deleted
        return None

    def clear(self) -> int:
        """
        Clear all documents

        Returns:
            Number of documents cleared
        """
        count = len(self.documents)
        self.documents = {}
        self.save()
        return count

    def count(self) -> int:
        """Get total number of documents"""
        return len(self.documents)

    def get_stats(self) -> dict:
        """Get storage statistics"""
        total_size = sum(doc.get('size', 0) for doc in self.documents.values())
        file_types = {}

        for doc in self.documents.values():
            file_type = doc.get('file_type', 'unknown')
            file_types[file_type] = file_types.get(file_type, 0) + 1

        return {
            'total_documents': len(self.documents),
            'total_size_bytes': total_size,
            'file_types': file_types,
            'storage_path': str(self.storage_path)
        }
