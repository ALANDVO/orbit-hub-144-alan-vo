"""Design system extraction service - deterministic offline core."""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set
from collections import Counter

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.design_system import DesignSystem


# Type scale patterns (Tailwind, CSS custom properties, styled-components, etc.)
TYPE_SCALE_PATTERNS = [
    (r'font-size\s*:\s*([\d.]+(?:rem|em|px))', "css"),
    (r'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)', "tailwind"),
    (r'fontSize\s*[:\=]\s*[\'"]([\d.]+(?:rem|em|px))[\'"]', "js"),
    (r'--font-size-\w+\s*:\s*([\d.]+(?:rem|em|px))', "css-var"),
]

# Color patterns
COLOR_PATTERNS = [
    (r'(?:color|background|border|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))', "css"),
    (r'(?:text|bg|border|fill|stroke)-(?:[a-z]+-)?(?:50|100|200|300|400|500|600|700|800|900|950)', "tailwind"),
    (r'--color-\w+\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))', "css-var"),
    (r'(?:color|background)\s*[:\=]\s*[\'"](#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))[\'"]', "js"),
]

# Spacing patterns
SPACING_PATTERNS = [
    (r'(?:margin|padding|gap|space)\s*:\s*([\d.]+(?:rem|em|px))', "css"),
    (r'(?:m|p|gap|space)-[trblxy]?-(?:\d+(?:\.\d+)?)', "tailwind"),
    (r'--spacing-\w+\s*:\s*([\d.]+(?:rem|em|px))', "css-var"),
    (r'(?:margin|padding|gap)\s*[:\=]\s*[\'"]([\d.]+(?:rem|em|px))[\'"]', "js"),
]

# Component pattern detection
COMPONENT_PATTERNS = [
    (r'export\s+(?:default\s+)?(?:function|const)\s+(\w+)\s*[=:]\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\))', "component-def"),
    (r'class\s+(\w+)\s+extends\s+(?:React\.)?(?:Component|PureComponent)', "class-component"),
    (r'@Component\s*\(\s*\{\s*selector\s*:\s*[\'"]([^\'"]+)[\'"]', "angular-component"),
    (r'Vue\.component\s*\(\s*[\'"](\w+)[\'"]', "vue-component"),
]


def find_files(root: Path, include: List[str], exclude: List[str]) -> List[Path]:
    """Find files matching include/exclude patterns."""
    files = []
    for pattern in include:
        files.extend(root.rglob(pattern))

    # Filter excluded
    filtered = []
    for f in files:
        if f.is_file():
            rel = f.relative_to(root)
            if not any(rel.match(ex) for ex in exclude):
                filtered.append(f)
    return filtered


def extract_type_scale(content: str, file_path: Path) -> Dict[str, int]:
    """Extract type scale values from content."""
    scales = Counter()
    for pattern, source in TYPE_SCALE_PATTERNS:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for m in matches:
            scales[f"{source}:{m}"] += 1
    return dict(scales)


def extract_colors(content: str, file_path: Path) -> Dict[str, int]:
    """Extract color values from content."""
    colors = Counter()
    for pattern, source in COLOR_PATTERNS:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for m in matches:
            colors[f"{source}:{m}"] += 1
    return dict(colors)


def extract_spacing(content: str, file_path: Path) -> Dict[str, int]:
    """Extract spacing values from content."""
    spacing = Counter()
    for pattern, source in SPACING_PATTERNS:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for m in matches:
            spacing[f"{source}:{m}"] += 1
    return dict(spacing)


def extract_components(content: str, file_path: Path) -> Dict[str, int]:
    """Extract component definitions from content."""
    components = Counter()
    for pattern, source in COMPONENT_PATTERNS:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for m in matches:
            components[f"{source}:{m}"] += 1
    return dict(components)


def consolidate_tokens(raw: Dict[str, int], top_n: int = 20) -> Dict[str, any]:
    """Consolidate raw token counts into structured format."""
    # Sort by count descending
    sorted_items = sorted(raw.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return {
        "tokens": [{"value": k, "count": v} for k, v in sorted_items],
        "total_occurrences": sum(raw.values()),
        "unique_values": len(raw),
    }


def generate_design_md(
    name: str,
    type_scale: Dict,
    color_palette: Dict,
    spacing: Dict,
    component_patterns: Dict,
) -> str:
    """Generate DESIGN.md content in the 8-section format."""
    sections = []

    # Section 1: Overview
    sections.append("# Design System: " + name)
    sections.append("")
    sections.append("> Auto-generated from codebase analysis. Review and refine as needed.")
    sections.append("")

    # Section 2: Type Scale
    sections.append("## 2. Type Scale")
    sections.append("")
    if type_scale.get("tokens"):
        sections.append("| Token | Count |")
        sections.append("|-------|-------|")
        for t in type_scale["tokens"][:15]:
            sections.append(f"| `{t['value']}` | {t['count']} |")
    else:
        sections.append("*No type scale tokens detected.*")
    sections.append("")

    # Section 3: Color Palette
    sections.append("## 3. Color Palette")
    sections.append("")
    if color_palette.get("tokens"):
        sections.append("| Token | Count |")
        sections.append("|-------|-------|")
        for t in color_palette["tokens"][:20]:
            sections.append(f"| `{t['value']}` | {t['count']} |")
    else:
        sections.append("*No color tokens detected.*")
    sections.append("")

    # Section 4: Spacing
    sections.append("## 4. Spacing")
    sections.append("")
    if spacing.get("tokens"):
        sections.append("| Token | Count |")
        sections.append("|-------|-------|")
        for t in spacing["tokens"][:15]:
            sections.append(f"| `{t['value']}` | {t['count']} |")
    else:
        sections.append("*No spacing tokens detected.*")
    sections.append("")

    # Section 5: Component Patterns
    sections.append("## 5. Component Patterns")
    sections.append("")
    if component_patterns.get("tokens"):
        sections.append("| Pattern | Count |")
        sections.append("|---------|-------|")
        for t in component_patterns["tokens"][:20]:
            sections.append(f"| `{t['value']}` | {t['count']} |")
    else:
        sections.append("*No component patterns detected.*")
    sections.append("")

    # Section 6: Usage Guidelines
    sections.append("## 6. Usage Guidelines")
    sections.append("")
    sections.append("- Use the documented tokens consistently across the codebase.")
    sections.append("- Prefer design tokens over hardcoded values.")
    sections.append("- Run design audit before merging UI changes.")
    sections.append("")

    # Section 7: RTL Considerations
    sections.append("## 7. RTL Considerations")
    sections.append("")
    sections.append("- Use logical properties (`margin-inline-start` vs `margin-left`).")
    sections.append("- Test layouts in both LTR and RTL modes.")
    sections.append("- Audit flagged physical properties on RTL pages.")
    sections.append("")

    # Section 8: Craft Floor Rules
    sections.append("## 8. Craft Floor Rules")
    sections.append("")
    sections.append("### Absolute Bans")
    sections.append("- No layout thrash: avoid animating `width`/`height`/`top`/`left`; use `transform`.")
    sections.append("- No raw CSS injection without sanitization and scoping.")
    sections.append("- No physical directional properties on RTL pages without logical equivalents.")
    sections.append("")
    sections.append("### Warnings")
    sections.append("- Avoid magic numbers; use spacing tokens.")
    sections.append("- Ensure color contrast meets WCAG AA.")
    sections.append("")

    return "\n".join(sections)


async def extract_design_system(
    root_path: str,
    name: Optional[str],
    include_patterns: List[str],
    exclude_patterns: List[str],
    db: AsyncSession,
) -> dict:
    """Extract design system from codebase at root_path."""
    root = Path(root_path).resolve()
    if not root.exists():
        raise ValueError(f"Root path does not exist: {root_path}")

    if not name:
        name = root.name or "Unnamed Design System"

    files = find_files(root, include_patterns, exclude_patterns)

    all_type_scale = Counter()
    all_colors = Counter()
    all_spacing = Counter()
    all_components = Counter()

    for file_path in files:
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        all_type_scale.update(extract_type_scale(content, file_path))
        all_colors.update(extract_colors(content, file_path))
        all_spacing.update(extract_spacing(content, file_path))
        all_components.update(extract_components(content, file_path))

    type_scale = consolidate_tokens(dict(all_type_scale))
    color_palette = consolidate_tokens(dict(all_colors))
    spacing = consolidate_tokens(dict(all_spacing))
    component_patterns = consolidate_tokens(dict(all_components))

    design_md = generate_design_md(name, type_scale, color_palette, spacing, component_patterns)

    ds = DesignSystem(
        name=name,
        root_path=str(root),
        type_scale=type_scale,
        color_palette=color_palette,
        spacing=spacing,
        component_patterns=component_patterns,
        design_md=design_md,
    )
    db.add(ds)
    await db.commit()
    await db.refresh(ds)

    return {
        "design_system_id": ds.id,
        "name": ds.name,
        "type_scale": ds.type_scale,
        "color_palette": ds.color_palette,
        "spacing": ds.spacing,
        "component_patterns": ds.component_patterns,
        "design_md": ds.design_md or "",
    }