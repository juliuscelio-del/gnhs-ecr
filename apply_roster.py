#!/usr/bin/env python3
"""
apply_roster.py  -  GNHS ECR roster loader

Reads roster.csv and writes the grade/section names and the Boys/Girls
class lists into ElectronicClassRecordFINAL.html.

Usage (run in the folder that has both files):
    python apply_roster.py
    python apply_roster.py roster.csv ElectronicClassRecordFINAL.html

roster.csv columns:  Grade, Section, Sex, Name
    Grade   7, 8, 9 or 10
    Section section name, e.g. Rizal
    Sex     Boy or Girl   (M / F / Male / Female also work)
    Name    one learner per row, in the order you want them listed

The ECR has 9 section slots: Grade 7 x2, Grade 8 x3, Grade 9 x2, Grade 10 x2.
Sections are assigned to the slots of their grade in the order they first
appear in the CSV. Max 30 boys and 30 girls per section.
"""
import csv, hashlib, json, re, sys

CSV_PATH = sys.argv[1] if len(sys.argv) > 1 else "roster.csv"
HTML_PATH = sys.argv[2] if len(sys.argv) > 2 else "ElectronicClassRecordFINAL.html"

# internal slot key -> (grade, default section name)
DEFAULT_SLOTS = {
    "rizal": (7, "Rizal"), "bonifacio": (7, "Bonifacio"),
    "mabini": (8, "Mabini"), "aquino": (8, "Aquino"), "jacinto": (8, "Jacinto"),
    "juan-luna": (9, "Juan Luna"), "del-pilar": (9, "Del Pilar"),
    "silang": (10, "Silang"), "dagohoy": (10, "Dagohoy"),
}
MAX_NAMES = 30
MARK = "<!--ECR_ROSTER_STATE:"


def die(msg):
    print("ERROR: " + msg)
    sys.exit(1)


def title(name):
    return " ".join(w[:1].upper() + w[1:].lower() if w.islower() or w.isupper() else w
                    for w in name.strip().split())


def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    if not rows:
        die("roster.csv is empty")
    hdr = [h.strip().lower() for h in rows[0]]
    try:
        ig, isec, isex, inm = (hdr.index(x) for x in ("grade", "section", "sex", "name"))
    except ValueError:
        die("First row must be: Grade,Section,Sex,Name")
    out = []
    for n, r in enumerate(rows[1:], start=2):
        if not any(c.strip() for c in r):
            continue
        r += [""] * (4 - len(r))
        g, sec, sex, nm = r[ig].strip(), r[isec].strip(), r[isex].strip().lower(), r[inm].strip()
        if not (g and sec and nm):
            die(f"Row {n}: Grade, Section and Name are all required")
        g = re.sub(r"(?i)^grade\s*", "", g)
        if g not in ("7", "8", "9", "10"):
            die(f"Row {n}: Grade must be 7, 8, 9 or 10 (got '{g}')")
        if sex in ("boy", "boys", "m", "male"):
            sex = "male"
        elif sex in ("girl", "girls", "f", "female"):
            sex = "female"
        else:
            die(f"Row {n}: Sex must be Boy or Girl (got '{sex}')")
        nm = re.sub(r"[0-9]", "", nm).strip()
        out.append((int(g), sec, sex, nm))
    return out


def build_assignment(rows):
    by_grade = {}
    for key, (g, _) in DEFAULT_SLOTS.items():
        by_grade.setdefault(g, []).append(key)
    used = {g: 0 for g in by_grade}
    seen = {}
    slots = {}
    for g, sec, sex, nm in rows:
        k = (g, sec.lower())
        if k not in seen:
            if used[g] >= len(by_grade[g]):
                die(f"Grade {g} has too many sections. The ECR only has "
                    f"{len(by_grade[g])} slot(s) for Grade {g}.")
            key = by_grade[g][used[g]]
            used[g] += 1
            seen[k] = key
            slots[key] = {"grade": g, "name": title(sec), "male": [], "female": []}
        slots[seen[k]][sex].append(nm.upper())
    for key, s in slots.items():
        for sex in ("male", "female"):
            if len(s[sex]) > MAX_NAMES:
                die(f"{s['name']} (Grade {s['grade']}) has {len(s[sex])} "
                    f"{'boys' if sex == 'male' else 'girls'}; the maximum is {MAX_NAMES}.")
    # slots not mentioned keep their current names/lists
    return slots


def main():
    html = open(HTML_PATH, encoding="utf-8").read()

    # current label state (what the HTML says right now)
    m = re.search(re.escape(MARK) + r"(\{.*?\})-->", html)
    cur = json.loads(m.group(1)) if m else {
        k: {"grade": g, "name": n} for k, (g, n) in DEFAULT_SLOTS.items()}

    slots = build_assignment(read_csv(CSV_PATH))

    # ---- 1) section / grade labels ----
    # do all replacements via placeholders so swapping names can't collide
    ph = {}
    def put(old, new):
        t = f"\u0001{len(ph)}\u0001"
        ph[t] = new
        return t

    for key, s in slots.items():
        og, on = cur[key]["grade"], cur[key]["name"]
        ng, nn = s["grade"], s["name"]
        pats = [
            (f"G{og} \u2013 {on}", f"G{ng} \u2013 {nn}"),
            (f"G{og} {on}", f"G{ng} {nn}"),
            (f"{og} \u2013 {on.upper()}", f"{ng} \u2013 {nn.upper()}"),
            (f">{on} - ", f">{nn} - "),
            (f"'{key}':'{on}'", f"'{key}':'{nn}'"),
        ]
        for old, new in pats:
            html = html.replace(old, put(old, new))
        html = re.sub(rf"(?<![G\d]){og} \u2013 {re.escape(on)}", put("", f"{ng} \u2013 {nn}"), html)
        cur[key] = {"grade": ng, "name": nn}
    for t, new in ph.items():
        html = html.replace(t, new)

    # ---- 2) class lists (embedded roster) ----
    mm = re.search(r"window\.ECR_EMBEDDED_CLASSLIST=(\{.*?\});</script>", html, re.S)
    if not mm:
        die("Could not find the embedded class list in the HTML.")
    classlist = json.loads(mm.group(1))
    for key, s in slots.items():
        classlist[key] = {"male": s["male"], "female": s["female"]}
    version = hashlib.sha1(json.dumps(classlist, sort_keys=True, ensure_ascii=False)
                           .encode("utf-8")).hexdigest()[:10]
    payload = json.dumps(classlist, ensure_ascii=False, separators=(",", ":"))
    html = (html[:mm.start()]
            + f"window.ECR_ROSTER_VERSION='{version}';window.ECR_EMBEDDED_CLASSLIST={payload};</script>"
            + html[mm.end():])

    # ---- 3) make the app re-load the roster whenever roster.csv changed ----
    old_fn = "window.ecrGet('ecr_classlist',function(err,data){var hasAny=false;"
    new_fn = ("window.ecrGet('ecr_roster_version',function(vErr,vStored){"
              "if(window.ECR_ROSTER_VERSION&&vStored!==window.ECR_ROSTER_VERSION){"
              "window.ecrSet('ecr_classlist',window.ECR_EMBEDDED_CLASSLIST,function(){"
              "window.ecrSet('ecr_roster_version',window.ECR_ROSTER_VERSION,function(){cb();});});return;}"
              "window.ecrGet('ecr_classlist',function(err,data){var hasAny=false;")
    if "ecr_roster_version" not in html:
        if old_fn not in html:
            die("Could not patch the class list loader (HTML changed?).")
        html = html.replace(old_fn, new_fn, 1)
        # close the extra callback we opened: end of seedEmbeddedClassListIfEmpty
        tail_old = "console.log('[ECR] Seeded embedded class list (214 students) \u2014 no saved roster found.');cb();});});}"
        tail_new = "console.log('[ECR] Seeded embedded class list.');cb();});});});}"
        if tail_old not in html:
            die("Could not patch the end of the class list loader (HTML changed?).")
        html = html.replace(tail_old, tail_new, 1)

    # ---- 4) remember current labels for the next run ----
    html = re.sub(re.escape(MARK) + r"\{.*?\}-->\n?", "", html)
    html = html.replace("</body>", MARK + json.dumps(cur, ensure_ascii=False) + "-->\n</body>", 1) \
        if "</body>" in html else html + "\n" + MARK + json.dumps(cur) + "-->\n"

    open(HTML_PATH, "w", encoding="utf-8").write(html)

    print("Roster applied:")
    for key, s in slots.items():
        print(f"  Grade {s['grade']} - {s['name']}: {len(s['male'])} boys, {len(s['female'])} girls")
    skipped = [f"G{cur[k]['grade']} {cur[k]['name']}" for k in DEFAULT_SLOTS if k not in slots]
    if skipped:
        print("  (not in roster.csv, left unchanged: " + ", ".join(skipped) + ")")


main()
