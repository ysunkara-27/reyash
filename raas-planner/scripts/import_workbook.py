"""Read OOXML with stdlib only; never modify the source workbook."""
import datetime as dt
import json
import pathlib
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
def read_workbook(path):
    with zipfile.ZipFile(path) as z:
        strings = ["".join(x.itertext()) for x in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
        rel = {e.attrib["Id"]: e.attrib["Target"] for e in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
        result = {}
        for sheet in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
            target = rel[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
            cells = {}
            for c in ET.fromstring(z.read(posixpath.normpath("xl/" + target))).findall("m:sheetData/m:row/m:c", NS):
                v = c.find("m:v", NS)
                value = v.text if v is not None else ""
                if c.attrib.get("t") == "s" and value: value = strings[int(value)]
                if c.attrib.get("t") == "inlineStr": value = "".join(c.find("m:is", NS).itertext())
                if value: cells[c.attrib["r"]] = value.strip()
            result[sheet.attrib["name"]] = cells
        return result

def team(value):
    value = value.strip()
    return {"Uconn": "UConn", "UT (Austin)": "Texas", "UT (Dallas)": "UTD", "Pitt": "Steel City"}.get(value, value)

def comp(value):
    value = value.strip().upper()
    return {"614.0": "614", "305.0": "305", "SRC": "SCR", "AKD X DRD": "DRD"}.get(value, value)

def date(value):
    try: return (dt.date(1899, 12, 30) + dt.timedelta(days=float(value))).isoformat()
    except (ValueError, TypeError): return None

def extract(path):
    sheets = read_workbook(path)
    history, events, current_teams, issues, performance = [], [], [], [], []
    for season, cells in sheets.items():
        if not re.fullmatch(r"20\d\d-20\d\d", season): continue
        columns = [(k[:-1], comp(v)) for k, v in cells.items() if re.fullmatch(r"[A-Z]+2", k) and k not in ("A2", "B2") and not v.lower().startswith("raas all stars")]
        # The attendance matrix starts immediately after the Theme/Total Comps header.
        header = next(int(k[1:]) for k,v in cells.items() if re.fullmatch(r"B\d+", k) and v == "Theme")
        roster = []
        for row in range(header + 1, max(int(re.sub(r"\D", "", k)) for k in cells) + 1):
            raw = cells.get(f"A{row}", "")
            if raw.startswith("Total") or raw.startswith("Estimated Travel"): break
            if not raw or raw.startswith("Column") or raw.isnumeric() or raw == "Team": continue
            roster.append((row, team(raw)))
        if season == "2026-2027": current_teams = sorted(set(t for _,t in roster))
        if "2021-2022" <= season <= "2025-2026":
            points_col = next(k[:-len(str(header))] for k,v in cells.items() if v == "Total Points" and k.endswith(str(header)))
            for row,t in roster:
                appearances = sum(cells.get(f"{col}{row}") in ("1.0", "1") for col,_ in columns)
                raw_points = cells.get(f"{points_col}{row}")
                if appearances and raw_points is not None:
                    performance.append({"season":season,"team":t,"points":float(raw_points),"appearances":appearances,"source":f"{season}!{points_col}{row}"})
        for col, name in columns:
            attendees = []
            for row,t in roster:
                if cells.get(f"{col}{row}") in ("1.0", "1"):
                    attendees.append(t)
                    history.append({"season":season,"team":t,"competition":name,"cell":f"{col}{row}"})
            events.append({"season":season,"id":name,"date":date(cells.get(f"{col}1")),"city":cells.get(f"{col}3", ""),"teams":sorted(set(attendees)),"source":f"{season}!{col}1:{col}3"})
    mapping = {}
    ids = {2:"ECS",3:"BKB",4:"ATS",5:"CHAOS",6:"RCR",7:"MASTI",8:"ROYALTY",9:"RAMPAGE",10:"DRD",11:"NASHA",12:"DTX",13:"RDS",14:"RANGEELO",15:"SANEDO",16:"NAACH",17:"RODEO",18:"GGG",19:"GTR",20:"614",21:"TAAZA",22:"SCR"}
    c = sheets["Competitions"]
    for row,cid in ids.items(): mapping[cid] = {"name":c[f"A{row}"],"hosts":[team(c[f"B{row}"])],"hostSource":f"Competitions!B{row}"}
    # User-confirmed corrections supplement, rather than rewrite, workbook evidence.
    for cid, name, hosts in [("BND", "Bucky Noh Dhol", ["Wisconsin"]), ("MANIA", "Raas Mania", ["Illini"]), ("BNB", "Boston Ni Baaje", ["Northeastern", "BU"])]:
        mapping[cid] = {"name": name, "hosts": hosts, "hostSource": "User-confirmed", "hostRevision": 1}
    current_teams = sorted(set(current_teams + ["Wisconsin"]))
    comps = []
    for event in events:
        if event["season"] != "2026-2027": continue
        meta = mapping.get(event["id"], {"name":event["id"],"hosts":[],"hostSource":"Missing from workbook"})
        comps.append({k:v for k,v in event.items() if k != "teams"} | meta)
        if not meta["hosts"]: issues.append(f"{event['id']}: host team missing from workbook")
    return {"source":"Raas All time.xlsx","season":"2026-2027","teams":current_teams,"competitions":comps,"events":[e for e in events if e['season'] != '2026-2027'],"attendance":history,"performance":performance,"issues":issues}

if __name__ == "__main__":
    output = pathlib.Path(__file__).resolve().parents[1] / "data.json"
    data = extract(sys.argv[1])
    output.write_text(json.dumps(data, separators=(",", ":")))
    print(json.dumps({"teams":len(data["teams"]),"competitions":len(data["competitions"]),"attendance":len(data["attendance"]),"issues":data["issues"]}, indent=2))
