"""
Optional GitHub Auto-Sync for Free Tier Persistent Storage (server_py/github_sync.py)
Allows persisting data/portfolio.json to a GitHub repository when running on ephemeral cloud instances (e.g. Render).
"""

import os
import base64
import requests

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
GITHUB_REPO = os.getenv("GITHUB_REPO", "").strip()  # e.g. "alam292/Protfolio"
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main").strip()


def sync_portfolio_to_github(portfolio_json_str: str, commit_message: str = "chore: sync portfolio data from live upload") -> bool:
    """
    Commit updated data/portfolio.json directly to GitHub repository via REST API.
    Returns True if successfully pushed or skipped if unconfigured.
    """
    if not GITHUB_TOKEN or not GITHUB_REPO:
        # Not configured, silently no-op
        return False

    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/data/portfolio.json"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    try:
        # 1. Fetch current file SHA if exists
        sha = None
        get_res = requests.get(url, headers=headers, params={"ref": GITHUB_BRANCH}, timeout=8)
        if get_res.status_code == 200:
            sha = get_res.json().get("sha")

        # 2. Base64 encode file content
        content_bytes = portfolio_json_str.encode("utf-8")
        encoded_content = base64.b64encode(content_bytes).decode("utf-8")

        payload = {
            "message": commit_message,
            "content": encoded_content,
            "branch": GITHUB_BRANCH
        }
        if sha:
            payload["sha"] = sha

        # 3. PUT commit to GitHub
        put_res = requests.put(url, headers=headers, json=payload, timeout=10)
        if put_res.status_code in (200, 201):
            print(f"[GitHub Sync] Successfully committed updated portfolio to GitHub ({GITHUB_REPO}@{GITHUB_BRANCH})")
            return True
        else:
            print(f"[GitHub Sync Warning] Commit returned {put_res.status_code}: {put_res.text}")
            return False

    except Exception as e:
        print(f"[GitHub Sync Error] Failed to sync to GitHub: {e}")
        return False
