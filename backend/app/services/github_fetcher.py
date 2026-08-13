import httpx
from typing import List, Dict


GITHUB_API = "https://api.github.com"


def _headers(token: str = "") -> Dict:
    h = {"Accept": "application/vnd.github.v3+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def parse_github_url(url: str):
    """Extract owner and repo from https://github.com/owner/repo"""
    parts = url.rstrip("/").replace("https://github.com/", "").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL")
    return parts[0], parts[1]


async def fetch_java_files(github_url: str, token: str = "") -> List[Dict]:
    """
    Recursively fetch all .java file contents from a GitHub repository.
    Returns list of {path, content} dicts.
    """
    owner, repo = parse_github_url(github_url)
    files = []

    async with httpx.AsyncClient(timeout=30) as client:
        await _collect_files(client, owner, repo, "", token, files)

    return files


async def _collect_files(client, owner, repo, path, token, results):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    resp = await client.get(url, headers=_headers(token))
    resp.raise_for_status()
    items = resp.json()

    for item in items:
        if item["type"] == "dir":
            await _collect_files(client, owner, repo, item["path"], token, results)
        elif item["type"] == "file" and item["name"].endswith(".java"):
            file_resp = await client.get(item["download_url"], headers=_headers(token))
            if file_resp.status_code == 200:
                results.append({"path": item["path"], "content": file_resp.text})
