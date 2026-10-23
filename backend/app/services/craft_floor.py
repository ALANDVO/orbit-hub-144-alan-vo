"""Craft floor quality gate service."""

import re
from typing import List, Optional
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.design_system import CraftFloorRule


@dataclass
class Violation:
    rule_id: str
    category: str
    severity: str
    title: str
    description: str
    location: Optional[str] = None
    fix_guidance: Optional[str] = None


# Built-in absolute ban rules (always checked)
BUILTIN_BANS = [
    Violation(
        rule_id="BAN_LAYOUT_THRESH",
        category="layout",
        severity="ban",
        title="Layout Thrash Detection",
        description="Animating width/height/top/left causes layout thrash. Use transform: scaleX()/translateX() instead.",
        fix_guidance="Replace width/height/top/left animations with transform: scaleX() or translateX() for GPU acceleration.",
    ),
    Violation(
        rule_id="BAN_RAW_CSS_INJECTION",
        category="css",
        severity="ban",
        title="Raw CSS Injection",
        description="Injecting raw CSS without sanitization and scoping can leak styles site-wide.",
        fix_guidance="Use sanitizeAcceptedCss and appendSanitizedCssRule; ensure styles are scoped.",
    ),
    Violation(
        rule_id="BAN_PHYSICAL_PROPS_RTL",
        category="internationalization",
        severity="ban",
        title="Physical Properties on RTL",
        description="Physical directional properties (margin-left, padding-right, etc.) break RTL layouts.",
        fix_guidance="Use logical properties: margin-inline-start, padding-inline-end, etc.",
    ),
]

# Built-in warning rules
BUILTIN_WARNINGS = [
    Violation(
        rule_id="WARN_MAGIC_NUMBERS",
        category="layout",
        severity="warning",
        title="Magic Numbers in CSS",
        description="Hardcoded pixel values instead of design tokens.",
        fix_guidance="Replace with spacing/color/type tokens from design system.",
    ),
    Violation(
        rule_id="WARN_CONTRAST",
        category="accessibility",
        severity="warning",
        title="Potential Contrast Issue",
        description="Color combination may not meet WCAG AA contrast ratio.",
        fix_guidance="Verify contrast ratio >= 4.5:1 for text, 3:1 for large text/UI.",
    ),
]

# Built-in advisory rules
BUILTIN_ADVISORIES = [
    Violation(
        rule_id="ADV_CONSISTENT_TOKENS",
        category="maintainability",
        severity="advisory",
        title="Inconsistent Token Usage",
        description="Similar values used inconsistently; consider consolidating into tokens.",
        fix_guidance="Audit and unify similar values into design tokens.",
    ),
]


def detect_layout_thrash(content_before: str, content_after: str) -> List[Violation]:
    """Detect layout thrash patterns in CSS animations."""
    violations = []

    # Patterns that cause layout thrash
    thrash_props = ["width", "height", "top", "left", "right", "bottom", "margin", "padding"]
    transform_props = ["transform", "translate", "scale", "rotate"]

    # Check for animation of layout properties
    anim_pattern = re.compile(
        r'animation\s*:\s*[^;]*(' + '|'.join(thrash_props) + r')[^;]*;',
        re.IGNORECASE
    )
    transition_pattern = re.compile(
        r'transition\s*:\s*[^;]*(' + '|'.join(thrash_props) + r')[^;]*;',
        re.IGNORECASE
    )
    keyframes_pattern = re.compile(
        r'@keyframes\s+\w+\s*\{[^}]*(' + '|'.join(thrash_props) + r')\s*:',
        re.IGNORECASE | re.DOTALL
    )

    for pattern, prop_type in [(anim_pattern, "animation"), (transition_pattern, "transition"), (keyframes_pattern, "keyframes")]:
        matches = pattern.findall(content_after)
        if matches:
            violations.append(Violation(
                rule_id="BAN_LAYOUT_THRESH",
                category="layout",
                severity="ban",
                title="Layout Thrash Detection",
                description=f"Animating layout properties ({', '.join(set(matches))}) in {prop_type} causes layout thrash.",
                location=prop_type,
                fix_guidance="Use transform: scaleX()/translateX() instead for GPU-accelerated animations.",
            ))

    return violations


def detect_raw_css_injection(content_before: str, content_after: str) -> List[Violation]:
    """Detect raw CSS injection patterns."""
    violations = []

    # Patterns suggesting raw CSS injection
    injection_patterns = [
        (r'style\s*=\s*[\'"][^\'"]*\{[^\'"]*\}[\'"]', "inline style object with raw CSS"),
        (r'insertRule\s*\(\s*[\'"][^\'"]*\}[\'"]', "CSSStyleSheet.insertRule with raw CSS"),
        (r'innerHTML\s*=\s*[\'"][^\'"]*<style[^>]*>[^\'"]*[\'"]', "innerHTML with style tag"),
        (r'createContextualFragment\s*\(\s*[\'"][^\'"]*<style[^>]*>', "createContextualFragment with style"),
    ]

    for pattern, desc in injection_patterns:
        if re.search(pattern, content_after, re.IGNORECASE):
            violations.append(Violation(
                rule_id="BAN_RAW_CSS_INJECTION",
                category="css",
                severity="ban",
                title="Raw CSS Injection",
                description=f"Detected {desc} without sanitization.",
                fix_guidance="Use sanitizeAcceptedCss and appendSanitizedCssRule; ensure styles are scoped.",
            ))

    return violations


def detect_physical_props_rtl(content_before: str, content_after: str) -> List[Violation]:
    """Detect physical properties that would break RTL."""
    violations = []

    physical_props = [
        "margin-left", "margin-right",
        "padding-left", "padding-right",
        "border-left", "border-right",
        "float: left", "float: right",
        "text-align: left", "text-align: right",
        "left:", "right:",
    ]

    # Simple heuristic: if file mentions RTL or dir=rtl, check for physical props
    is_rtl_context = bool(re.search(r'dir\s*=\s*[\'"]rtl[\'"]', content_after, re.IGNORECASE))

    if is_rtl_context:
        for prop in physical_props:
            if re.search(rf'\b{re.escape(prop)}\b', content_after, re.IGNORECASE):
                logical = {
                    "margin-left": "margin-inline-start",
                    "margin-right": "margin-inline-end",
                    "padding-left": "padding-inline-start",
                    "padding-right": "padding-inline-end",
                    "border-left": "border-inline-start",
                    "border-right": "border-inline-end",
                    "float: left": "float: inline-start",
                    "float: right": "float: inline-end",
                    "text-align: left": "text-align: start",
                    "text-align: right": "text-align: end",
                    "left:": "inset-inline-start:",
                    "right:": "inset-inline-end:",
                }.get(prop, "logical equivalent")
                violations.append(Violation(
                    rule_id="BAN_PHYSICAL_PROPS_RTL",
                    category="internationalization",
                    severity="ban",
                    title="Physical Property on RTL Page",
                    description=f"Detected `{prop}` in RTL context; breaks layout.",
                    fix_guidance=f"Use `{logical}` instead.",
                ))

    return violations


def detect_magic_numbers(content_before: str, content_after: str) -> List[Violation]:
    """Detect hardcoded magic numbers in CSS."""
    violations = []

    # Find pixel values that aren't 0 or common base sizes
    px_pattern = re.compile(r'(?<![\w-])(\d{2,4})px(?![\w-])')
    matches = px_pattern.findall(content_after)

    magic_numbers = set()
    for m in matches:
        val = int(m)
        if val not in [0, 1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 128]:
            magic_numbers.add(val)

    if magic_numbers:
        violations.append(Violation(
            rule_id="WARN_MAGIC_NUMBERS",
            category="layout",
            severity="warning",
            title="Magic Numbers in CSS",
            description=f"Hardcoded pixel values detected: {', '.join(str(x) + 'px' for x in sorted(magic_numbers))}",
            fix_guidance="Replace with spacing tokens from design system.",
        ))

    return violations


async def check_craft_floor(
    file_path: str,
    content_before: str,
    content_after: str,
    design_system_id: Optional[int],
    db: AsyncSession,
) -> dict:
    """Run all craft floor checks and return structured result."""
    all_violations = []
    all_warnings = []
    all_advisories = []

    # Run built-in checks
    all_violations.extend(detect_layout_thrash(content_before, content_after))
    all_violations.extend(detect_raw_css_injection(content_before, content_after))
    all_violations.extend(detect_physical_props_rtl(content_before, content_after))
    all_warnings.extend(detect_magic_numbers(content_before, content_after))

    # Add built-in warnings/advisories
    all_warnings.extend(BUILTIN_WARNINGS)
    all_advisories.extend(BUILTIN_ADVISORIES)

    # Load custom rules from database if design_system_id provided
    if design_system_id:
        result = await db.execute(
            select(CraftFloorRule).where(CraftFloorRule.design_system_id == design_system_id)
        )
        custom_rules = result.scalars().all()
        # TODO: implement custom rule evaluation

    # Deduplicate by rule_id
    seen = set()
    deduped_violations = []
    for v in all_violations:
        if v.rule_id not in seen:
            seen.add(v.rule_id)
            deduped_violations.append(v)

    seen.clear()
    deduped_warnings = []
    for v in all_warnings:
        if v.rule_id not in seen:
            seen.add(v.rule_id)
            deduped_warnings.append(v)

    seen.clear()
    deduped_advisories = []
    for v in all_advisories:
        if v.rule_id not in seen:
            seen.add(v.rule_id)
            deduped_advisories.append(v)

    passed = len(deduped_violations) == 0

    return {
        "passed": passed,
        "violations": [
            {
                "rule_id": v.rule_id,
                "category": v.category,
                "severity": v.severity,
                "title": v.title,
                "description": v.description,
                "location": v.location,
                "fix_guidance": v.fix_guidance,
            }
            for v in deduped_violations
        ],
        "warnings": [
            {
                "rule_id": v.rule_id,
                "category": v.category,
                "severity": v.severity,
                "title": v.title,
                "description": v.description,
                "location": v.location,
                "fix_guidance": v.fix_guidance,
            }
            for v in deduped_warnings
        ],
        "advisories": [
            {
                "rule_id": v.rule_id,
                "category": v.category,
                "severity": v.severity,
                "title": v.title,
                "description": v.description,
                "location": v.location,
                "fix_guidance": v.fix_guidance,
            }
            for v in deduped_advisories
        ],
    }