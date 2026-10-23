"""Design audit service - RTL physical property detection and scoring."""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from bs4 import BeautifulSoup

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.design_system import DesignSystem, DesignAudit


# Physical CSS properties that have logical equivalents
PHYSICAL_PROPERTIES = {
    "margin-left": "margin-inline-start",
    "margin-right": "margin-inline-end",
    "margin-top": "margin-block-start",
    "margin-bottom": "margin-block-end",
    "padding-left": "padding-inline-start",
    "padding-right": "padding-inline-end",
    "padding-top": "padding-block-start",
    "padding-bottom": "padding-block-end",
    "border-left": "border-inline-start",
    "border-right": "border-inline-end",
    "border-top": "border-block-start",
    "border-bottom": "border-block-end",
    "left": "inset-inline-start",
    "right": "inset-inline-end",
    "top": "inset-block-start",
    "bottom": "inset-block-end",
    "float: left": "float: inline-start",
    "float: right": "float: inline-end",
    "text-align: left": "text-align: start",
    "text-align: right": "text-align: end",
}

# Properties to check in style attributes and CSS
PHYSICAL_PROP_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(k.split(":")[0]) for k in PHYSICAL_PROPERTIES.keys()) + r')\b\s*:\s*([^;}]+)',
    re.IGNORECASE
)

RTL_SELECTORS = [
    '[dir="rtl"]',
    '[dir=rtl]',
    ':root:has([dir="rtl"])',
    'html[dir="rtl"]',
    'body[dir="rtl"]',
]


@dataclass
class Finding:
    rule_id: str
    category: str
    severity: str
    title: str
    description: str
    selector: str
    property: str
    value: str
    logical_equivalent: str
    line: Optional[int] = None
    column: Optional[int] = None


@dataclass
class AuditScores:
    a11y: int = 0
    performance: int = 0
    theming: int = 0
    responsive: int = 0
    integrity: int = 0
    i18n: int = 0

    def total(self) -> int:
        return self.a11y + self.performance + self.theming + self.responsive + self.integrity + self.i18n

    def to_dict(self) -> Dict[str, int]:
        return {
            "a11y": self.a11y,
            "performance": self.performance,
            "theming": self.theming,
            "responsive": self.responsive,
            "integrity": self.integrity,
            "i18n": self.i18n,
        }


def detect_rtl(html: str) -> bool:
    """Detect if page declares RTL direction."""
    soup = BeautifulSoup(html, "html.parser")
    html_tag = soup.find("html")
    body_tag = soup.find("body")

    for tag in [html_tag, body_tag]:
        if tag and tag.get("dir", "").lower() == "rtl":
            return True

    # Check for RTL script lang without dir
    if html_tag and html_tag.get("lang"):
        lang = html_tag.get("lang", "").lower()
        rtl_scripts = ["ar", "he", "fa", "ur", "ps", "sd", "ug", "yi"]
        if any(lang.startswith(s) for s in rtl_scripts):
            return True

    return False


def extract_css_from_html(html: str) -> List[Tuple[str, str, int]]:
    """Extract CSS from style tags and style attributes. Returns (selector, css_text, line)."""
    soup = BeautifulSoup(html, "html.parser")
    results = []

    # Inline styles
    for tag in soup.find_all(style=True):
        selector = get_selector(tag)
        style_text = tag.get("style", "")
        line = tag.sourceline if hasattr(tag, "sourceline") else None
        results.append((selector, style_text, line))

    # Style tags
    for style_tag in soup.find_all("style"):
        css_text = style_tag.string or ""
        # Simple heuristic: assume global scope
        line = style_tag.sourceline if hasattr(style_tag, "sourceline") else None
        results.append(("global", css_text, line))

    return results


def get_selector(tag) -> str:
    """Generate a CSS selector for a tag."""
    parts = [tag.name]
    if tag.get("id"):
        parts.append(f"#{tag['id']}")
    if tag.get("class"):
        parts.append("." + ".".join(tag.get("class", [])))
    return "".join(parts)


def parse_style_declarations(css_text: str) -> List[Tuple[str, str]]:
    """Parse CSS declarations into (property, value) pairs."""
    declarations = []
    # Handle both inline styles (prop: val; prop: val) and CSS rules
    for match in re.finditer(r'([\w-]+)\s*:\s*([^;}]+)', css_text):
        prop = match.group(1).strip().lower()
        val = match.group(2).strip()
        declarations.append((prop, val))
    return declarations


def check_physical_properties(html: str, is_rtl: bool) -> List[Finding]:
    """Check for physical CSS properties that should be logical on RTL pages."""
    findings = []
    css_sources = extract_css_from_html(html)

    for selector, css_text, line in css_sources:
        declarations = parse_style_declarations(css_text)
        for prop, val in declarations:
            prop_lower = prop.lower()

            # Check for physical properties with directional values
            if prop_lower in ["float", "text-align"]:
                key = f"{prop_lower}: {val.strip().lower()}"
                if key in PHYSICAL_PROPERTIES:
                    findings.append(Finding(
                        rule_id="I18N_PHYSICAL_PROP",
                        category="Internationalization",
                        severity="violation" if is_rtl else "advisory",
                        title=f"Physical {prop_lower} on RTL page",
                        description=f"Property `{prop_lower}: {val}` should use logical equivalent `{PHYSICAL_PROPERTIES[key]}` on RTL pages",
                        selector=selector,
                        property=prop,
                        value=val,
                        logical_equivalent=PHYSICAL_PROPERTIES[key],
                        line=line,
                    ))
            elif prop_lower in PHYSICAL_PROPERTIES:
                # For margin/padding/border/position properties, flag on RTL
                if is_rtl:
                    findings.append(Finding(
                        rule_id="I18N_PHYSICAL_PROP",
                        category="Internationalization",
                        severity="violation",
                        title=f"Physical property on RTL page",
                        description=f"Property `{prop_lower}` should use logical equivalent `{PHYSICAL_PROPERTIES[prop_lower]}` on RTL pages",
                        selector=selector,
                        property=prop,
                        value=val,
                        logical_equivalent=PHYSICAL_PROPERTIES[prop_lower],
                        line=line,
                    ))
                else:
                    findings.append(Finding(
                        rule_id="I18N_PHYSICAL_PROP_LTR",
                        category="Internationalization",
                        severity="advisory",
                        title=f"Physical property (consider logical for future RTL)",
                        description=f"Property `{prop_lower}` has logical equivalent `{PHYSICAL_PROPERTIES[prop_lower]}`; consider using it for RTL readiness",
                        selector=selector,
                        property=prop,
                        value=val,
                        logical_equivalent=PHYSICAL_PROPERTIES[prop_lower],
                        line=line,
                    ))

    return findings


def calculate_scores(findings: List[Finding], is_rtl: bool) -> AuditScores:
    """Calculate audit scores from findings."""
    scores = AuditScores()

    # Count violations by category
    violations_by_cat = {}
    for f in findings:
        violations_by_cat.setdefault(f.category, []).append(f)

    # A11y (simplified - would check contrast, ARIA, etc.)
    scores.a11y = 4  # Default pass if no a11y findings

    # Performance (simplified)
    scores.performance = 4

    # Theming
    scores.theming = 4

    # Responsive
    scores.responsive = 4

    # Integrity
    scores.integrity = 4

    # Internationalization (new dimension)
    i18n_violations = [f for f in findings if f.category == "Internationalization" and f.severity == "violation"]
    i18n_advisories = [f for f in findings if f.category == "Internationalization" and f.severity == "advisory"]

    if is_rtl:
        if len(i18n_violations) == 0:
            scores.i18n = 4
        elif len(i18n_violations) <= 2:
            scores.i18n = 3
        elif len(i18n_violations) <= 5:
            scores.i18n = 2
        elif len(i18n_violations) <= 10:
            scores.i18n = 1
        else:
            scores.i18n = 0
    else:
        # LTR pages: advisories only
        if len(i18n_advisories) == 0:
            scores.i18n = 4
        elif len(i18n_advisories) <= 3:
            scores.i18n = 3
        elif len(i18n_advisories) <= 7:
            scores.i18n = 2
        elif len(i18n_advisories) <= 15:
            scores.i18n = 1
        else:
            scores.i18n = 0

    return scores


async def audit_design(
    design_system: DesignSystem,
    target_path: str,
    target_url: Optional[str],
    is_rtl: bool,
    html_content: Optional[str],
    db: AsyncSession,
) -> dict:
    """Audit a page/component against design system."""
    # If HTML not provided, try to read from target_path
    if not html_content and target_path:
        try:
            path = Path(target_path)
            if path.exists() and path.suffix in [".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte"]:
                html_content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            pass

    if not html_content:
        html_content = f"<html><body><!-- No HTML content for {target_path} --></body></html>"

    # Detect RTL if not explicitly set
    if not is_rtl:
        is_rtl = detect_rtl(html_content)

    # Run checks
    findings = check_physical_properties(html_content, is_rtl)

    # Calculate scores
    scores = calculate_scores(findings, is_rtl)

    # Prepare findings for storage
    findings_dict = {
        "total": len(findings),
        "by_category": {},
        "items": [
            {
                "rule_id": f.rule_id,
                "category": f.category,
                "severity": f.severity,
                "title": f.title,
                "description": f.description,
                "selector": f.selector,
                "property": f.property,
                "value": f.value,
                "logical_equivalent": f.logical_equivalent,
                "line": f.line,
            }
            for f in findings
        ],
    }

    for f in findings:
        findings_dict["by_category"].setdefault(f.category, []).append(f.rule_id)

    # Create audit record
    audit = DesignAudit(
        design_system_id=design_system.id,
        target_path=target_path,
        target_url=target_url,
        is_rtl=is_rtl,
        a11y_score=scores.a11y,
        performance_score=scores.performance,
        theming_score=scores.theming,
        responsive_score=scores.responsive,
        integrity_score=scores.integrity,
        i18n_score=scores.i18n,
        findings=findings_dict,
    )
    db.add(audit)
    await db.flush()
    audit_id = audit.id
    await db.commit()

    return {
        "audit_id": audit_id,
        "scores": scores.to_dict(),
        "findings": findings_dict,
        "total_score": scores.total(),
        "max_score": 24,
    }