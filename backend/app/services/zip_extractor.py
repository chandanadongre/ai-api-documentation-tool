import zipfile
import io
from typing import List, Dict


def extract_java_files(zip_bytes: bytes) -> List[Dict[str, str]]:
    """Extract all .java files from a ZIP archive. Returns list of {path, content}."""
    files = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            if name.endswith(".java") and not name.startswith("__MACOSX"):
                with zf.open(name) as f:
                    try:
                        content = f.read().decode("utf-8", errors="ignore")
                        files.append({"path": name, "content": content})
                    except Exception:
                        continue
    return files
