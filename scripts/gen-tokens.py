#!/usr/bin/env python3
"""Generate every token file from tokens/source/figma_vars.json (exported from the Figma `Colors` collection etc.).

    python3 scripts/gen-tokens.py

Outputs: tokens/tokens.css, tokens/tailwind.preset.cjs, tokens/tokens.json,
         tokens/native/ZehnTokens.swift, tokens/native/zehn_tokens.dart, tokens/native/ZehnTokens.kt
Never hand-edit the outputs; edit this script or the source JSON.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tokens/source/figma_vars.json")
OUT = os.path.join(ROOT, "tokens")
d = json.load(open(SRC))

FAMILY = {"Grayscale": "gray", "Alpha": "alpha", "Teal": "teal", "Cyan": "cyan", "Orange": "orange", "Lime": "lime",
          "Coral": "coral", "Pink": "pink", "Red": "red", "Green": "green", "Blue": "blue", "Yellow-Green": "yellow-green",
          "Violet": "violet", "Constant Colors": "const", "Action": "action", "Background": "bg"}

# Edu sub-brand: approved by the designer 2026-10-14, NOT yet variables in Figma (raw hex there).
d["colors"]["Edu Green/default"] = ["#21aa31", "#21aa31"]
d["colors"]["Edu Green/darker"] = ["#038c17", "#038c17"]
d["colors"]["Edu Green/deep"] = ["#005c3d", "#005c3d"]
d["colors"]["Edu Green/stroke"] = ["#21aa3133", "#21aa3133"]
d["colors"]["Edu Green/fill-2"] = ["#21aa311a", "#21aa311f"]
d["colors"]["Edu Green/fill-1"] = ["#21aa310d", "#21aa3114"]
FAMILY["Edu Green"] = "edu-green"


def var(name):
    fam, tok = name.split("/", 1)
    f = FAMILY[fam]
    t = tok.lower().replace(" - base", "").replace(" ", "-")
    t = {"default": "", "background": "bg-strong" if f in ("green", "yellow-green") else "background"}.get(t, t)
    if f == "action":
        t = {"text": "text", "icon": "icon", "background-counter": "counter-bg", "background": "bg",
             "background-hover": "bg-hover"}[t]
    return f"--zm-{f}" + (f"-{t}" if t else "")


mapping = {name: var(name) for name in d["colors"]}

# Semantic tokens: (name, light target, dark target or None = same as light)
SEM = [
    ("text-primary", "gray-900"), ("text-secondary", "gray-600"), ("text-tertiary", "gray-400"),
    ("text-disabled", "gray-300"), ("text-link", "cyan"), ("text-danger", "red"),
    ("border-default", "gray-100"), ("border-strong", "gray-200"),
    ("surface-canvas", "bg-b0"), ("surface-base", "bg-b1"), ("surface-raised", "bg-b2"),
    ("surface-overlay", "bg-b3"), ("surface-subtle", "gray-50"), ("surface-hover", "gray-50"),
    ("primary-bg", "action-bg"), ("primary-bg-hover", "action-bg-hover"), ("primary-fg", "action-text"),
    ("secondary-bg", "gray-50"), ("secondary-bg-hover", "gray-100"), ("secondary-fg", "gray-900"),
    ("disabled-bg", "gray-50"), ("disabled-fg", "gray-300"),
    ("focus-ring", "cyan-stroke"),
    ("status-success", "green"), ("status-success-bg", "green-fill-2"),
    ("status-warning", "orange"), ("status-warning-bg", "orange-fill-2"),
    ("status-info", "blue"), ("status-info-bg", "blue-fill-2"),
    ("status-danger", "red"), ("status-danger-bg", "red-fill-2"),
    ("status-neutral", "gray-600"), ("status-neutral-bg", "gray-50"),
    ("counter-bg", "red"), ("counter-fg", "const-white"),
    ("tooltip-bg", "action-bg"), ("tooltip-fg", "action-text"),
    ("progress-track", "gray-100"), ("progress-fill", "action-bg"),
    ("ai", "pink"), ("ai-bg", "pink-fill-2"),
    # Charts: the -darker shade in light mode keeps 3:1 against white (cyan default is only 2.9:1).
    ("chart-1", "cyan-darker", "cyan"), ("chart-2", "blue", "blue"), ("chart-3", "violet", "violet"),
    ("chart-4", "pink-darker", "pink"), ("chart-5", "coral-darker", "coral"),
    ("chart-6", "yellow-green-darker", "yellow-green"), ("chart-7", "teal-darker", "teal"),
    ("chart-8", "orange-darker", "orange"),
    ("chart-positive", "cyan-darker", "cyan"), ("chart-negative", "coral-darker", "coral"),
    ("chart-grid", "gray-100"), ("chart-axis", "gray-600"),
]
SEM = [(s[0], s[1], s[2] if len(s) > 2 else None) for s in SEM]
# Raw (non-Figma) semantic values. Scrim stays dark in both themes.
RAW_SEM = [("scrim", "rgb(0 0 0 / 0.4)", "rgb(0 0 0 / 0.6)")]

APPS = {"procurement": "cyan", "intelligence": "cyan", "desk": "cyan", "hr": "orange", "tasks": "orange",
        "analytics": "orange", "edge": "orange", "docs": "blue", "geo": "yellow-green", "edu": "edu-green"}

LAYOUT = {"topbar-height": 56, "gutter": 24, "column-narrow": 768, "column-detail": 896, "detail-main": 560,
          "side-panel": 320, "modal": 520, "modal-wide": 600, "modal-xl": 904, "drawer": 520, "drawer-wide": 640,
          "alert-dialog": 520, "header-icon": 32, "table-header": 36, "row": 48, "row-dense": 36, "subbar-height": 64,
          "chart-card": 334, "chart-plot": 208, "toast": 432}

# Tailwind spacing key for each zehn spacing value (Tailwind's standard 4px-based keys).
TW_SPACE = {0: "0", 1: "px", 2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5", 12: "3", 16: "4", 20: "5", 24: "6",
            32: "8", 40: "10", 48: "12", 64: "16", 72: "18", 96: "24", 128: "32", 256: "64", 320: "80", 512: "128"}
TW_RADIUS = {"0": "none", "2": "sm", "4": "DEFAULT", "8": "lg", "12": "xl", "16": "2xl", "24": "3xl", "32": "4xl",
             "full": "full"}


def res_hex(x):
    """Resolve an alias like '@Cyan/default' to a hex for one mode."""
    return x


def resolve(name, mode):
    v = d["colors"][name][mode]
    while v.startswith("@"):
        v = d["colors"][v[1:]][mode]
    return v


# ---------- tokens.css ----------
light, dark = [], []
for name, (l, dk) in d["colors"].items():
    v = mapping[name]
    r = lambda x: f"var({mapping[x[1:]]})" if x.startswith("@") else x
    light.append(f"  {v}: {r(l)};")
    dark.append(f"  {v}: {r(dk)};")
for s, lt, dt in SEM:
    light.append(f"  --zm-{s}: var(--zm-{lt});")
    if dt and dt != lt:
        dark.append(f"  --zm-{s}: var(--zm-{dt});")
for s, lv, dv in RAW_SEM:
    light.append(f"  --zm-{s}: {lv};")
    dark.append(f"  --zm-{s}: {dv};")

L = ["/* zehn design tokens. GENERATED by scripts/gen-tokens.py from Figma file ywFHunM35gYeHJozrBJpZO. Do not edit by hand. */",
     "/* Theme: light by default; dark via <html data-theme=\"dark\"> (or the OS setting when data-theme is absent).",
     "   App accent via <html data-app=\"hr\"> etc. */",
     ":root {"]
L += light
L.append("  --zm-app-accent: var(--zm-cyan);\n  --zm-app-accent-stroke: var(--zm-cyan-stroke);\n  --zm-app-accent-fill: var(--zm-cyan-fill-2);")
for i in d["spacing"]:
    L.append(f"  --zm-space-{i}: {i}px;")
for k, v in d["radius"].items():
    L.append(f"  --zm-radius-{k}: {v}px;")
for k, v in d["shadows"].items():
    L.append(f"  --zm-shadow-{k}: {v};")
L.append("  --zm-font-sans: 'Inter', system-ui, sans-serif;\n  --zm-tracking: -0.01em;")
for n, size, lh in d["text"]:
    L.append(f"  --zm-text-{n}: {size}px;\n  --zm-leading-{n}: {lh}px;")
for k, v in LAYOUT.items():
    L.append(f"  --zm-{k}: {v}px;")
L.append("}")
L.append("[data-theme=\"dark\"] {\n  color-scheme: dark;")
L += dark
L.append("}")
L.append("@media (prefers-color-scheme: dark) {\n  :root:not([data-theme=\"light\"]) {\n    color-scheme: dark;")
L += ["  " + x for x in dark]
L.append("  }\n}")
for app, fam in APPS.items():
    L.append(f"[data-app=\"{app}\"] {{ --zm-app-accent: var(--zm-{fam}); --zm-app-accent-stroke: var(--zm-{fam}-stroke); --zm-app-accent-fill: var(--zm-{fam}-fill-2); }}")
L.append("html { font-family: var(--zm-font-sans); letter-spacing: var(--zm-tracking); color: var(--zm-text-primary); background: var(--zm-surface-base); }")
open(f"{OUT}/tokens.css", "w").write("\n".join(L) + "\n")

# ---------- Tailwind preset (CommonJS: works from CJS and ESM configs, and from v4 @config) ----------
colors = {mapping[n][5:]: f"var({mapping[n]})" for n in d["colors"]}
colors.update({s: f"var(--zm-{s})" for s, _, _ in SEM})
colors.update({s: f"var(--zm-{s})" for s, _, _ in RAW_SEM})
colors.update({"app-accent": "var(--zm-app-accent)", "app-accent-stroke": "var(--zm-app-accent-stroke)",
               "app-accent-fill": "var(--zm-app-accent-fill)", "transparent": "transparent",
               "current": "currentColor", "inherit": "inherit", "black": "var(--zm-const-black)",
               "white": "var(--zm-const-white)"})
sizes = {k: f"{v}px" for k, v in LAYOUT.items()}
preset = {
    "theme": {
        # REPLACED: only zehn colors exist, so bg-blue-500 renders nothing and the style check flags it.
        "colors": colors,
        "borderRadius": {TW_RADIUS[k]: ("0px" if k == "0" else f"var(--zm-radius-{k})") for k in d["radius"]},
        "fontFamily": {"sans": ["Inter", "system-ui", "sans-serif"]},
        "fontWeight": {"normal": "400", "semibold": "600"},
        "fontSize": {n: [f"{s}px", {"lineHeight": f"{lh}px", "letterSpacing": "-0.01em"}] for n, s, lh in d["text"]}
                    | {"header-icon": ["32px", {"lineHeight": "32px"}]},  # 32px Remix glyph in page headers only
        "boxShadow": {k: f"var(--zm-shadow-{k})" for k in d["shadows"]} | {"none": "none"},
        # EXTENDED: Tailwind's standard spacing keys stay valid (p-4 = 16px), so existing code keeps working.
        "extend": {
            "spacing": {"18": "72px", "128": "512px"},
            "maxWidth": sizes, "width": sizes, "height": sizes, "minHeight": sizes, "minWidth": sizes,
        },
    }
}
js = ("/* zehn Tailwind preset. GENERATED by scripts/gen-tokens.py. Do not edit by hand.\n"
      "   colors, radius, font size/weight and shadows are REPLACED by zehn tokens.\n"
      "   spacing keeps Tailwind's standard keys (p-4 = 16px); only the zehn subset is allowed by the style check:\n"
      "   0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32 64 80 128.\n"
      "   Layout sizes: max-w-column-narrow (768), max-w-column-detail (896), w-modal (520), w-drawer (520), h-topbar-height (56)… */\n")
js += "module.exports = " + json.dumps(preset, indent=2) + ";\n"
open(f"{OUT}/tailwind.preset.cjs", "w").write(js)
if os.path.exists(f"{OUT}/tailwind.preset.js"):
    os.remove(f"{OUT}/tailwind.preset.js")

# ---------- tokens.json ----------
tok = {"color": {}, "semantic": {s: {"light": "{" + lt + "}", "dark": "{" + (dt or lt) + "}"} for s, lt, dt in SEM},
       "spacing": d["spacing"], "radius": d["radius"], "layout": LAYOUT,
       "typography": {n: {"fontFamily": "Inter", "fontSize": s, "lineHeight": lh, "letterSpacing": "-1%",
                          "weights": [400, 600]} for n, s, lh in d["text"]},
       "shadow": d["shadows"], "appAccent": APPS}
for s, lv, dv in RAW_SEM:
    tok["semantic"][s] = {"light": lv, "dark": dv}
for name, (l, dk) in d["colors"].items():
    tok["color"][mapping[name][5:]] = {"figma": name, "light": l, "dark": dk}
json.dump(tok, open(f"{OUT}/tokens.json", "w"), indent=2)

# ---------- native ----------
def hex8(h):
    h = h.lstrip("#")
    if len(h) == 6:
        h += "ff"
    return h[:6], int(h[6:8], 16) / 255


def camel(s):
    p = s.replace("-", " ").split()
    return p[0] + "".join(x.capitalize() for x in p[1:]) if p[0][0].isalpha() else "c" + "".join(x.capitalize() for x in p)


def color_pairs():
    out = []
    by_var = {mapping[n][5:]: n for n in d["colors"]}
    for n in d["colors"]:
        out.append((camel(mapping[n][5:]), resolve(n, 0), resolve(n, 1)))
    for s, lt, dt in SEM:
        out.append((camel(s), resolve(by_var[lt], 0), resolve(by_var[dt or lt], 1)))
    return out


pairs = color_pairs()
GEN = "GENERATED by zehn-design scripts/gen-tokens.py from Figma. Do not edit by hand."

sw = [f"// {GEN}", "// Fonts: bundle Inter (Regular 400, SemiBold 600). Icons: Remix Icon SVGs as template images; SF Symbols only as a stopgap (list as a design gap).",
      "import SwiftUI", "import UIKit", "",
      "private func zm(_ l: UInt32, _ la: Double, _ d: UInt32, _ da: Double) -> Color {",
      "    Color(UIColor { t in",
      "        let (v, a) = t.userInterfaceStyle == .dark ? (d, da) : (l, la)",
      "        return UIColor(red: CGFloat((v >> 16) & 0xff) / 255, green: CGFloat((v >> 8) & 0xff) / 255, blue: CGFloat(v & 0xff) / 255, alpha: a)",
      "    })", "}", "", "public enum ZehnColor {"]
for nm, l, dk in pairs:
    (lh, la), (dh, da) = hex8(l), hex8(dk)
    sw.append(f"    public static let {nm} = zm(0x{lh}, {la:.3f}, 0x{dh}, {da:.3f})")
sw.append("}\n\npublic enum ZehnSpace {")
for i in d["spacing"]:
    sw.append(f"    public static let s{i}: CGFloat = {i}")
sw.append("}\n\npublic enum ZehnRadius {")
for k, v in d["radius"].items():
    sw.append(f"    public static let {'full' if k == 'full' else 'r' + k}: CGFloat = {v}")
sw.append("}\n\npublic enum ZehnFont {")
for n, s, lh in d["text"]:
    sw.append(f"    public static func {camel('t-' + n)}(_ semibold: Bool = false) -> Font {{ .custom(semibold ? \"Inter-SemiBold\" : \"Inter-Regular\", size: {s}) }}  // line height {lh}")
sw.append("}")
open(f"{OUT}/native/ZehnTokens.swift", "w").write("\n".join(sw) + "\n")

da = [f"// {GEN}", "// Fonts: add Inter (400, 600) to pubspec. Icons: remixicon package.", "import 'package:flutter/widgets.dart';", "",
      "class ZehnColors {", "  const ZehnColors._(" + ", ".join(f"this.{nm}" for nm, _, _ in pairs) + ");"]
for nm, _, _ in pairs:
    da.append(f"  final Color {nm};")


def argb(h):
    hx, a = hex8(h)
    return f"0x{round(a * 255):02X}{hx.upper()}"


da.append("  static const light = ZehnColors._(" + ", ".join(f"Color({argb(l)})" for _, l, _ in pairs) + ");")
da.append("  static const dark = ZehnColors._(" + ", ".join(f"Color({argb(dk)})" for _, _, dk in pairs) + ");")
da.append("}\n\nclass ZehnSpace {")
for i in d["spacing"]:
    da.append(f"  static const double s{i} = {i};")
da.append("}\n\nclass ZehnRadius {")
for k, v in d["radius"].items():
    da.append(f"  static const double {'full' if k == 'full' else 'r' + k} = {v};")
da.append("}\n\nclass ZehnText {")
for n, s, lh in d["text"]:
    da.append(f"  static const {camel('t-' + n)} = TextStyle(fontFamily: 'Inter', fontSize: {s}, height: {lh}/{s}, letterSpacing: {s} * -0.01, fontWeight: FontWeight.w400);")
da.append("}")
open(f"{OUT}/native/zehn_tokens.dart", "w").write("\n".join(da) + "\n")

kt = [f"// {GEN}", "// Fonts: add Inter (400, 600) as a FontFamily. Icons: Remix Icon vector drawables.",
      "package zehn.design", "", "import androidx.compose.ui.graphics.Color", "import androidx.compose.ui.unit.dp", "",
      "data class ZehnColors(" + ", ".join(f"val {nm}: Color" for nm, _, _ in pairs) + ")", ""]
kt.append("val ZehnLight = ZehnColors(" + ", ".join(f"Color({argb(l)})" for _, l, _ in pairs) + ")")
kt.append("val ZehnDark = ZehnColors(" + ", ".join(f"Color({argb(dk)})" for _, _, dk in pairs) + ")")
kt.append("\nobject ZehnSpace {")
for i in d["spacing"]:
    kt.append(f"    val s{i} = {i}.dp")
kt.append("}\n\nobject ZehnRadius {")
for k, v in d["radius"].items():
    kt.append(f"    val {'full' if k == 'full' else 'r' + k} = {v}.dp")
kt.append("}")
open(f"{OUT}/native/ZehnTokens.kt", "w").write("\n".join(kt) + "\n")

print("colors:", len(mapping), "semantic:", len(SEM) + len(RAW_SEM), "native colors:", len(pairs))
