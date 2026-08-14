import re
from pathlib import Path
from typing import List, Dict, Any

METHOD_ANNOTATIONS = {
    "GetMapping": "GET",
    "PostMapping": "POST",
    "PutMapping": "PUT",
    "DeleteMapping": "DELETE",
    "PatchMapping": "PATCH",
}

PARAM_ANNOTATIONS = {
    "@RequestBody": "body",
    "@PathVariable": "path",
    "@RequestParam": "query",
    "@RequestHeader": "header",
}


def _extract_path(snippet: str) -> str:
    match = re.search(r'["\']([^"\']+)["\']', snippet)
    return match.group(1) if match else "/"


def _extract_base_path(content: str) -> str:
    match = re.search(r'@RequestMapping\s*\(\s*["\']([^"\']+)["\']', content)
    return match.group(1).rstrip("/") if match else ""


def _extract_parameters(sig: str) -> List[Dict]:
    params = []
    pattern = re.compile(
        r'(@(?:RequestBody|PathVariable|RequestParam|RequestHeader))'
        r'(?:\([^)]*\))?\s+'
        r'(\w[\w<>, ]*?)\s+'
        r'(\w+)'
    )
    for m in pattern.finditer(sig):
        annotation, data_type, name = m.group(1), m.group(2).strip(), m.group(3)
        param_type = PARAM_ANNOTATIONS.get(annotation, "query")
        params.append({
            "name": name,
            "param_type": param_type,
            "data_type": data_type,
            "required": param_type in ("body", "path"),
        })
    return params


def _extract_dto_fields(content: str) -> List[Dict]:
    fields = []
    for m in re.finditer(r'private\s+([\w<>\[\]]+)\s+(\w+)\s*;', content):
        fields.append({"name": m.group(2), "type": m.group(1), "required": False})
    return fields


def collect_java_files(project_path: Path) -> List[Dict[str, str]]:
    """Recursively collect all .java files under project_path."""
    files = []
    for java_file in project_path.rglob("*.java"):
        try:
            files.append({"path": str(java_file.relative_to(project_path)), "content": java_file.read_text(encoding="utf-8", errors="ignore")})
        except Exception:
            continue
    return files


def parse(project_path: Path) -> Dict[str, Any]:
    files = collect_java_files(project_path)
    endpoints: List[Dict] = []
    dtos: List[Dict] = []

    for file in files:
        content = file["content"]
        filename = Path(file["path"]).stem

        if "@RestController" in content or "@Controller" in content:
            base_path = _extract_base_path(content)
            for annotation, method in METHOD_ANNOTATIONS.items():
                pattern = re.compile(
                    rf'@{annotation}\s*(?:\([^)]*\))?\s*'
                    rf'(?:[\w\s@<>,\[\]]*?)\s+'
                    rf'(\w+)\s*\(([^)]*)\)',
                    re.DOTALL,
                )
                for match in pattern.finditer(content):
                    start = match.start()
                    snippet = content[max(0, start - 5):start + 80]
                    ep_path = base_path + _extract_path(snippet)
                    params_str = match.group(2)
                    auth = (
                        ("@RequestHeader" in params_str and "Authorization" in params_str)
                        or "@PreAuthorize" in content
                        or "SecurityContext" in content
                    )
                    endpoints.append({
                        "http_method": method,
                        "path": ep_path if ep_path.startswith("/") else "/" + ep_path,
                        "controller_name": filename,
                        "method_name": match.group(1),
                        "auth_required": auth,
                        "source_file": file["path"],
                        "parameters": _extract_parameters(params_str),
                    })

        class_match = re.search(r'public\s+class\s+(\w+)', content)
        if class_match:
            has_fields = bool(re.search(r'private\s+\w+\s+\w+\s*;', content))
            not_controller = "@RestController" not in content and "@Controller" not in content
            if has_fields and not_controller:
                fields = _extract_dto_fields(content)
                if fields:
                    name = class_match.group(1)
                    dto_type = "request" if "Request" in name else "response" if "Response" in name else "model"
                    dtos.append({"name": name, "dto_type": dto_type, "source_file": file["path"], "fields": fields})

    return {"endpoints": endpoints, "dtos": dtos, "file_count": len(files)}
