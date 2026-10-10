from pathlib import Path
from fastapi import HTTPException, UploadFile
from app.config import get_settings
from app.database.repository import save_document, retrieve

async def ingest_pdf(file: UploadFile) -> dict:
    if not file.filename:
        raise HTTPException(400, "Filename is required.")
        
    filename = file.filename
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(415, "Only PDF notes are accepted. Please upload a .pdf document.")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "PDF exceeds the 20 MB file size limit.")
    if len(content) == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    target_dir = Path(get_settings().upload_directory)
    target_dir.mkdir(parents=True, exist_ok=True)
    file_path = target_dir / Path(filename).name
    file_path.write_bytes(content)

    pages: list[str] = []
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        for page_idx in range(len(doc)):
            page_text = doc[page_idx].get_text() or ""
            pages.append(page_text.strip())
        doc.close()
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(422, f"This PDF could not be read or is corrupted: {str(exc)}") from exc

    if not pages or all(len(p) == 0 for p in pages):
        pages = ["(Scanned or empty PDF document - text could not be extracted directly)"]

    doc_id = save_document(
        name=filename,
        path=str(file_path),
        pages=pages,
        file_size=len(content)
    )

    return {
        "id": doc_id,
        "name": filename,
        "pages": len(pages),
        "file_size": len(content),
        "status": "ready"
    }

def citations(query: str) -> list[dict]:
    hits = [h for h in retrieve(query, limit=4) if h.get("content", "").strip()]
    return [
        {
            "document_name": h["name"],
            "page": h["page"],
            "excerpt": h["content"][:280].strip()
        }
        for h in hits
    ]
