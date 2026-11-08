"""
diff_engine.py - Staged Portfolio Diff & Comparison Engine
Compares current live portfolio against candidate parsed resume data.
Provides structured diff summary for the review & confirmation modal.
"""

from typing import Dict, Any, List


def compute_portfolio_diff(old_data: Dict[str, Any] = None, new_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Computes an intelligent side-by-side diff between baseline portfolio and newly parsed candidate portfolio.
    
    Returns a dictionary formatted for the frontend Review Modal (js/resume-uploader.js).
    """
    old_data = old_data or {}
    new_data = new_data or {}

    diff: Dict[str, Any] = {
        "hasChanges": False,
        "profile": {},
        "about": {"highlightsChanged": False, "highlightsCount": 0, "items": []},
        "skills": {"added": [], "removed": [], "totalOld": 0, "totalNew": 0, "categoriesCount": 0},
        "experience": {"oldCount": 0, "newCount": 0, "roles": []},
        "projects": {"oldCount": 0, "newCount": 0, "titles": []},
        "education": {"oldCount": 0, "newCount": 0, "degrees": []},
        "certifications": {"oldCount": 0, "newCount": 0}
    }

    # 1. Profile Comparison
    old_prof = old_data.get("profile", {}) or {}
    new_prof = new_data.get("profile", {}) or {}

    for field in ["name", "title", "email"]:
        old_val = old_prof.get(field)
        new_val = new_prof.get(field)
        if new_val and old_val != new_val:
            diff["profile"][field] = {"old": old_val or "", "new": new_val}
            diff["hasChanges"] = True

    old_summary = old_prof.get("summary") or old_prof.get("heroTagline") or ""
    new_summary = new_prof.get("summary") or new_prof.get("heroTagline") or ""
    if new_summary and old_summary != new_summary:
        diff["profile"]["summary"] = {
            "old": (old_summary[:100] + ("..." if len(old_summary) > 100 else "")) if old_summary else "",
            "new": (new_summary[:100] + ("..." if len(new_summary) > 100 else "")) if new_summary else ""
        }
        diff["hasChanges"] = True

    # 2. Technical Skills Comparison
    def extract_skills(data: Dict[str, Any]) -> List[str]:
        if not data or not isinstance(data, dict):
            return []
        categories = data.get("skills", {}).get("categories", [])
        skills = []
        for cat in categories:
            items = cat.get("skills") or cat.get("items") or []
            for item in items:
                if isinstance(item, str):
                    skills.append(item)
                elif isinstance(item, dict) and item.get("name"):
                    skills.append(item["name"])
        return skills

    old_skills = extract_skills(old_data)
    new_skills = extract_skills(new_data)

    added_skills = [s for s in new_skills if s and s not in old_skills]
    removed_skills = [s for s in old_skills if s and s not in new_skills]

    new_cat_count = len(new_data.get("skills", {}).get("categories", []))
    diff["skills"] = {
        "added": added_skills,
        "removed": removed_skills,
        "totalOld": len(old_skills),
        "totalNew": len(new_skills),
        "categoriesCount": new_cat_count
    }
    if added_skills or removed_skills or len(old_skills) != len(new_skills):
        diff["hasChanges"] = True

    # 3. Who Am I (About) Highlights
    old_hl = old_data.get("about", {}).get("highlights", []) or []
    new_hl = new_data.get("about", {}).get("highlights", []) or []
    
    # Check if highlights changed
    hl_changed = (len(old_hl) != len(new_hl)) or any(
        old_hl[i].get("title") != new_hl[i].get("title")
        for i in range(min(len(old_hl), len(new_hl)))
    )
    diff["about"] = {
        "highlightsChanged": hl_changed,
        "highlightsCount": len(new_hl),
        "items": [{"title": h.get("title", ""), "stat": h.get("detail", "") or h.get("stat", "")} for h in new_hl]
    }
    if hl_changed:
        diff["hasChanges"] = True

    # 4. Experience Roles
    old_roles = old_data.get("experience", {}).get("roles", []) or []
    new_roles = new_data.get("experience", {}).get("roles", []) or []
    diff["experience"] = {
        "oldCount": len(old_roles),
        "newCount": len(new_roles),
        "roles": [f"{r.get('title') or r.get('role') or 'Role'} @ {r.get('company') or 'Company'}" for r in new_roles]
    }
    if len(old_roles) != len(new_roles):
        diff["hasChanges"] = True

    # 5. Projects
    old_proj = old_data.get("projects", {}).get("items", []) or []
    new_proj = new_data.get("projects", {}).get("items", []) or []
    diff["projects"] = {
        "oldCount": len(old_proj),
        "newCount": len(new_proj),
        "titles": [p.get("title") or p.get("name") or "Project" for p in new_proj]
    }
    if len(old_proj) != len(new_proj):
        diff["hasChanges"] = True

    # 6. Education
    old_edu = old_data.get("education", {}).get("degrees", []) or []
    new_edu = new_data.get("education", {}).get("degrees", []) or []
    diff["education"] = {
        "oldCount": len(old_edu),
        "newCount": len(new_edu),
        "degrees": [f"{d.get('degree', '')} - {d.get('institution', '')}" for d in new_edu]
    }
    if len(old_edu) != len(new_edu):
        diff["hasChanges"] = True

    # 7. Certifications
    old_cert = old_data.get("certifications", {}).get("items", []) or []
    new_cert = new_data.get("certifications", {}).get("items", []) or []
    diff["certifications"] = {
        "oldCount": len(old_cert),
        "newCount": len(new_cert)
    }
    if len(old_cert) != len(new_cert):
        diff["hasChanges"] = True

    return diff

