#!/usr/bin/env python3
"""Leidt de donkere variant af uit de bestaande lichte stylesheets.

De kleuren in dit prototype staan hardgecodeerd verspreid over ruim dertig
importlagen. Handmatig een donkere versie onderhouden zou onvermijdelijk
toestanden missen die je zelden ziet: hover, focus, lege resultaten, de
railstanden, de instellingenlade. Daarom leidt dit script elke kleur af uit
het licht.

De rol van een kleur volgt uit de CSS-eigenschap waarin ze staat:

  background* -> vlak      achtergronden worden donker, tinten houden hun kleur
  color/fill  -> tekst     tekst wordt licht, accenten blijven herkenbaar
  border/outline -> lijn   lijnen worden zichtbaar op donker in plaats van eronder
  box-shadow  -> schaduw   schaduwen worden dieper, lichte overlays doorschijnend

Gebruik:  python3 tools/genereer-dark-mode.py
Schrijft: feedback-demo/profiles-dark-mode.css en de kopie in de hoofdmap.
"""

from __future__ import annotations

import colorsys
import os
import re
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
WORTEL = os.path.dirname(HIER)
BRON_MAP = os.path.join(WORTEL, "feedback-demo")
TOP_LAAG = "profiles-detail-expandable-menu.css"
UITVOER = "profiles-dark-mode.css"

KLEUR_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)")
IMPORT_RE = re.compile(r'@import\s+url\(["\']([^"\']+)["\']\)')


# --- kleurgereedschap -------------------------------------------------------

def hex_naar_rgb(waarde: str) -> tuple[int, int, int, float]:
    h = waarde.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) == 4:
        h = "".join(c * 2 for c in h)
    alpha = 1.0
    if len(h) == 8:
        alpha = int(h[6:8], 16) / 255
        h = h[:6]
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha


def rgb_functie_naar_rgb(waarde: str) -> tuple[int, int, int, float]:
    binnen = waarde[waarde.index("(") + 1 : waarde.rindex(")")]
    delen = [d.strip() for d in binnen.replace("/", ",").split(",") if d.strip()]
    r, g, b = (int(float(d)) for d in delen[:3])
    alpha = float(delen[3]) if len(delen) > 3 else 1.0
    return r, g, b, alpha


def ontleed(waarde: str):
    if waarde.startswith("#"):
        return hex_naar_rgb(waarde)
    return rgb_functie_naar_rgb(waarde)


def naar_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s * 100, l * 100


def naar_css(h: float, s: float, l: float, alpha: float) -> str:
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, max(0, min(100, l)) / 100, max(0, min(100, s)) / 100)
    r, g, b = round(r * 255), round(g * 255), round(b * 255)
    if alpha >= 0.999:
        return f"#{r:02x}{g:02x}{b:02x}"
    return f"rgba({r}, {g}, {b}, {alpha:.3f}".rstrip("0").rstrip(".") + ")"


# --- rolgebonden afbeeldingen ----------------------------------------------

NEUTRAAL = 15  # onder deze verzadiging noemen we een kleur grijs


def vlak(h, s, l, a):
    """Achtergronden. Grijzen worden donker met behoud van hun onderlinge
    volgorde; getinte vlakken houden hun kleur maar worden diepe tinten."""
    if s < NEUTRAAL:
        if l >= 97:
            nl, ns = 16, min(s, 6)      # #fff en bijna-wit: het paneelvlak
        elif l >= 90:
            nl, ns = 13, min(s, 6)      # canvas en lichte grijzen: liggen dieper
        elif l >= 70:
            nl, ns = 22, min(s, 8)
        elif l >= 45:
            nl, ns = 28, min(s, 10)
        else:
            nl, ns = max(l, 30), min(s, 10)
    elif l >= 85:
        nl, ns = 19, min(s, 42)         # zachte accenttinten
    elif l >= 65:
        nl, ns = 24, min(s, 42)
    elif l >= 45:
        nl, ns = 30, min(s, 48)
    else:
        nl, ns = max(l, 42), s          # verzadigde vullingen blijven vol
    return naar_css(h, ns, nl, a)


def tekst(h, s, l, a):
    """Tekst en iconen. Alles moet licht worden, accenten blijven leesbaar."""
    if s < NEUTRAAL:
        if l <= 35:
            nl, ns = 91, min(s, 6)      # hoofdtekst
        elif l <= 55:
            nl, ns = 73, min(s, 8)      # secundair
        else:
            nl, ns = 59, min(s, 10)     # gedempt
    else:
        nl = 74 if l < 62 else max(l, 74)
        ns = min(s, 58)
    return naar_css(h, ns, nl, a)


def lijn(h, s, l, a):
    """Lijnen liggen op donker juist lichter dan hun vlak."""
    if s < NEUTRAAL:
        if l >= 90:
            nl, ns = 25, min(s, 8)
        elif l >= 70:
            nl, ns = 31, min(s, 10)
        else:
            nl, ns = 38, min(s, 12)
    else:
        nl, ns = 44, min(s, 40)
    return naar_css(h, ns, nl, a)


def schaduw(h, s, l, a):
    """Donkere schaduwen worden dieper; lichte overlays worden doorschijnend."""
    if l >= 80:
        return naar_css(h, min(s, 20), 96, min(a, 1.0) * 0.09)
    return naar_css(h, min(s, 30), 6, min(0.62, a * 1.7))


ROLLEN = (
    ("shadow", schaduw, ("box-shadow", "text-shadow", "filter")),
    ("line", lijn, ("border", "outline", "column-rule", "text-decoration-color")),
    ("text", tekst, ("color", "fill", "stroke", "accent-color", "caret-color")),
    ("bg", vlak, ("background",)),
)


def rol_voor(eigenschap: str):
    e = eigenschap.strip().lower()
    for _naam, functie, voorvoegsels in ROLLEN:
        if any(e == v or e.startswith(v) for v in voorvoegsels):
            return functie
    return None


def map_waarde(waarde: str, functie) -> str:
    def vervang(m):
        try:
            r, g, b, a = ontleed(m.group(0))
        except Exception:
            return m.group(0)
        h, s, l = naar_hsl(r, g, b)
        return functie(h, s, l, a)

    return KLEUR_RE.sub(vervang, waarde)


# --- css lezen --------------------------------------------------------------

def strip_commentaar(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    # At-regels zonder blok (@import, @charset) horen niet in de selector van de
    # eerstvolgende regel te belanden; zonder dit verdwijnt de eerste regel van
    # elk bestand uit de uitvoer.
    return re.sub(r"@(?:import|charset|namespace)[^;]*;", "", css)


def importketen(bestand: str, gezien=None) -> list[str]:
    """Levert de bestanden in cascadevolgorde: geimporteerd komt eerst."""
    gezien = gezien if gezien is not None else set()
    if bestand in gezien:
        return []
    gezien.add(bestand)
    pad = os.path.join(BRON_MAP, bestand)
    if not os.path.exists(pad):
        return []
    css = open(pad, encoding="utf-8").read()
    volgorde: list[str] = []
    for doel in IMPORT_RE.findall(css):
        volgorde.extend(importketen(doel, gezien))
    volgorde.append(bestand)
    return volgorde


def blokken(css: str):
    """Splitst een stylesheet in (selector, body) en (@media, inhoud)."""
    resultaat = []
    i = 0
    n = len(css)
    while i < n:
        haak = css.find("{", i)
        if haak == -1:
            break
        kop = css[i:haak].strip()
        diepte = 1
        j = haak + 1
        while j < n and diepte:
            if css[j] == "{":
                diepte += 1
            elif css[j] == "}":
                diepte -= 1
            j += 1
        body = css[haak + 1 : j - 1]
        if kop.startswith("@media") or kop.startswith("@supports"):
            resultaat.append(("at", kop, body))
        elif kop.startswith("@"):
            pass  # keyframes en consorten dragen geen thematische kleur
        elif kop:
            resultaat.append(("regel", kop, body))
        i = j
    return resultaat


def declaraties(body: str):
    for stuk in body.split(";"):
        if ":" not in stuk:
            continue
        eigenschap, waarde = stuk.split(":", 1)
        eigenschap = eigenschap.strip()
        waarde = waarde.strip()
        if not eigenschap or eigenschap.startswith("--"):
            continue  # variabelen zetten we met de hand in de tokenlaag
        if not KLEUR_RE.search(waarde):
            continue
        yield eigenschap, waarde


def scope(selector: str) -> str:
    delen = [d.strip() for d in selector.split(",") if d.strip()]
    uit = []
    for d in delen:
        if d.startswith(":root"):
            uit.append(d.replace(":root", ':root[data-theme="dark"]', 1))
        elif d.startswith("html"):
            uit.append(d.replace("html", 'html[data-theme="dark"]', 1))
        else:
            uit.append(f'[data-theme="dark"] {d}')
    return ",\n".join(uit)


def verwerk_regel(selector: str, body: str, inspring: str = "") -> list[str]:
    regels = []
    for eigenschap, waarde in declaraties(body):
        functie = rol_voor(eigenschap)
        if functie is None:
            continue
        belangrijk = ""
        kern = waarde
        if "!important" in waarde:
            belangrijk = " !important"
            kern = waarde.replace("!important", "").strip()
        nieuw = map_waarde(kern, functie)
        if nieuw != kern:
            regels.append(f"{inspring}  {eigenschap}: {nieuw}{belangrijk};")
    if not regels:
        return []
    kop = scope(selector).replace("\n", "\n" + inspring)
    return [f"{inspring}{kop} {{", *regels, f"{inspring}}}", ""]


KOP = '''@import url("profiles-detail-expandable-menu.css");

/*
 * Donkere variant — GEGENEREERD BESTAND, niet met de hand bijwerken.
 *
 * Afgeleid uit de lichte stylesheets door tools/genereer-dark-mode.py.
 * Wijzig je een kleur in het licht, draai dan opnieuw:
 *
 *     python3 tools/genereer-dark-mode.py
 *
 * De tokenlaag hieronder is wel met de hand gezet: die bepaalt de basis
 * waar de afgeleide regels bovenop komen.
 */

:root[data-theme="dark"] {
  color-scheme: dark;

  --ink: #e7e9ec;
  --muted: #9aa3ae;
  --muted-2: #79828d;
  --line: #333a43;
  --line-soft: #272d35;
  --canvas: #14171b;
  --panel: #1b1f25;
  --surface: #1f242b;
  --blue: #5c9dff;
  --blue-dark: #8bbaff;
  --blue-soft: #16233a;
  --green: #4fbb85;
  --amber: #d59a4a;

  --utility-bg: #14231b;
  --utility-header: #17291f;
  --utility-line: #2c4636;
  --utility-ink: #9fd3b4;
  --filter-green: #5fb98a;
  --filter-green-dark: #8ed4ae;
  --filter-green-soft: #16261d;

  --edit-blue-soft: #16202e;
  --edit-blue-header: #1a2637;
  --edit-blue-line: #33455c;
  --edit-utility-bg: #16202e;
  --edit-utility-header: #1a2637;
  --edit-utility-line: #33455c;
  --edit-utility-ink: #9bc0e8;

  --nav-utility-bg: #1d1830;
  --nav-utility-header: #241d3a;
  --nav-utility-line: #3d3357;
  --nav-utility-ink: #c0b0e0;
}

/* Vanaf hier: afgeleid uit het licht. */
'''


def main() -> int:
    keten = importketen(TOP_LAAG)
    if not keten:
        print("Geen importketen gevonden", file=sys.stderr)
        return 1

    uit: list[str] = [KOP]
    aantal = 0
    for bestand in keten:
        css = strip_commentaar(open(os.path.join(BRON_MAP, bestand), encoding="utf-8").read())
        stukken: list[str] = []
        for soort, kop, body in blokken(css):
            if soort == "regel":
                regels = verwerk_regel(kop, body)
                if regels:
                    stukken.extend(regels)
                    aantal += 1
            else:
                binnen: list[str] = []
                for soort2, kop2, body2 in blokken(body):
                    if soort2 == "regel":
                        r = verwerk_regel(kop2, body2, "  ")
                        if r:
                            binnen.extend(r)
                            aantal += 1
                if binnen:
                    stukken.extend([f"{kop} {{", *binnen, "}", ""])
        if stukken:
            uit.append(f"/* --- {bestand} --- */\n")
            uit.extend(stukken)

    inhoud = "\n".join(uit).replace("\n\n\n", "\n\n") + "\n"
    for map_ in (BRON_MAP, WORTEL):
        with open(os.path.join(map_, UITVOER), "w", encoding="utf-8") as f:
            f.write(inhoud)

    print(f"{len(keten)} bestanden gelezen, {aantal} regels afgeleid")
    print(f"geschreven: feedback-demo/{UITVOER} en {UITVOER}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
