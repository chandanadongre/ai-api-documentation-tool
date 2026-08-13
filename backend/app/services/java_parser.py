import re
from typing import List, Dict, Any


# Mapping annotation → HTTP method
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


def _extract_path(annotation_line: str) -> str:
    """Extract path string from @GetMapping('/path') or @GetMapping(value='/path')"""
    match = re.search(r'["\']([^"\']+)["\']', annotation_line)
    return match.group(1) if match else "/"


def _extract_base_path(content: str) -> str:
    """Extract @RequestMapping path from controller class level"""
    match = re.search(r'@RequestMapping\s*\(\s*["\']([^"\']+)["\']', content)
    return match.group(1).rstrip("/") if match else ""


def _extract_parameters(method_signature: str) -> List[Dict]:
    """Parse method parameters for Spring annotations"""
    params = []
    # Match: @Annotation Type name  (simplified, handles common cases)
    param_pattern = re.compile(
        r'(@(?:RequestBody|PathVariable|RequestParam|RequestHeader))'
        r'(?:\([^)]*\))?\s+'
        r'(\w[\w<>, ]*?)\s+'
        r'(\w+)'
    )
    for match in param_pattern.finditer(method_signature):
        annotation, data_type, name = match.group(1), match.group(2).strip(), match.group(3)
        param_type = PARAM_ANNOTATIONS.get(annotation, "query")
        params.append({
            "name": name,
            "param_type": param_type,
            "data_type": data_type,
            "required": param_type in ("body", "path"),
        })
    return params


def _is_dto_class(content: str, class_name: str) -> bool:
    """Heuristic: class has fields + getters/setters or Lombok, no @RestController"""
    has_fields = bool(re.search(r'private\s+\w+\s+\w+\s*;', content))
    not_controller = "@RestController" not in content and "@Controller" not in content
    return has_fields and not_controller


def _extract_dto_fields(content: str) -> List[Dict]:
    """Extract private field declarations from a class"""
    fields = []
    field_pattern = re.compile(r'private\s+([\w<>\[\]]+)\s+(\w+)\s*;')
    for match in field_pattern.finditer(content):
        fields.append({"name": match.group(2), "type": match.group(1), "required": False})
    return fields


def parse_java_files(files: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Main parser entry point.
    Input:  list of {path, content}
    Output: {endpoints: [...], dtos: [...]}
    """
    endpoints = []
    dtos = []

    for file in files:
        path = file["path"]
        content = file["content"]
        filename = path.split("/")[-1].replace(".java", "")

        # --- Controller parsing ---
        if "@RestController" in content or "@Controller" in content:
            base_path = _extract_base_path(content)

            for annotation, method in METHOD_ANNOTATIONS.items():
                pattern = re.compile(
                    rf'@{annotation}\s*(?:\([^)]*\))?\s*'   # annotation line
                    rf'(?:[\w\s@<>,\[\]]*?)\s+'              # return type + modifiers
                    rf'(\w+)\s*\(([^)]*)\)',                  # methodName(params)
                    re.DOTALL
                )
                for match in pattern.finditer(content):
                    # Get the annotation line to extract path
                    start = match.start()
                    annotation_snippet = content[max(0, start - 5):start + 80]
                    endpoint_path = base_path + _extract_path(annotation_snippet)

                    method_name = match.group(1)
                    params_str = match.group(2)
                    parameters = _extract_parameters(params_str)

                    # Detect auth — look for @RequestHeader with Authorization or security annotations
                    auth_required = (
                        "@RequestHeader" in params_str and "Authorization" in params_str
                        or "@PreAuthorize" in content
                        or "SecurityContext" in content
                    )

                    endpoints.append({
                        "http_method": method,
                        "path": endpoint_path if endpoint_path.startswith("/") else "/" + endpoint_path,
                        "controller_name": filename,
                        "method_name": method_name,
                        "auth_required": auth_required,
                        "source_file": path,
                        "parameters": parameters,
                    })

        # --- DTO parsing ---
        class_match = re.search(r'public\s+class\s+(\w+)', content)
        if class_match and _is_dto_class(content, class_match.group(1)):
            class_name = class_match.group(1)
            fields = _extract_dto_fields(content)
            if fields:
                dto_type = (
                    "request" if "Request" in class_name
                    else "response" if "Response" in class_name
                    else "model"
                )
                dtos.append({
                    "name": class_name,
                    "dto_type": dto_type,
                    "source_file": path,
                    "fields": fields,
                })

    return {"endpoints": endpoints, "dtos": dtos}
