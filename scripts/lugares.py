"""Genera www/data/lugares.json: estadios, arenas, predios y plazas de CABA que generan cortes.

Para cada lugar busca su contorno en OpenStreetMap y calcula el "perímetro estimado":
las calles que lo rodean (tramos a menos de ~70 m del contorno). Si el lugar ya tiene
cortes oficiales en www/data/cortes.json (por ejemplo Vélez), se usan esos.

Uso:  python scripts/lugares.py            (todos)
      python scripts/lugares.py river boca  (solo esos ids)
"""
import json, math, os, subprocess, sys, time

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OVERPASS = "https://overpass-api.de/api/interpreter"

# id, nombre, tipo, barrio, lat, lon aproximados, palabras para encontrarlo en OSM, ids ESPN de equipos locales
LUGARES = [
    ("velez", "Estadio José Amalfitani (Vélez)", "estadio", "Liniers", -34.6354, -58.5207, ["amalfitani"], ["21"]),
    ("river", "Estadio Más Monumental (River)", "estadio", "Núñez", -34.5453, -58.4498, ["monumental", "river"], ["16"]),
    ("boca", "Estadio Alberto J. Armando (La Bombonera)", "estadio", "La Boca", -34.6356, -58.3647, ["armando", "bombonera"], ["5"]),
    ("sanlorenzo", "Estadio Pedro Bidegain (San Lorenzo)", "estadio", "Bajo Flores", -34.6522, -58.4402, ["bidegain", "gasómetro", "gasometro"], ["18"]),
    ("huracan", "Estadio Tomás A. Ducó (Huracán)", "estadio", "Parque Patricios", -34.6437, -58.3967, ["ducó", "duco"], ["10"]),
    ("argentinos", "Estadio Diego A. Maradona (Argentinos)", "estadio", "La Paternal", -34.6061, -58.4726, ["maradona"], ["3"]),
    ("barracas", "Estadio Claudio Chiqui Tapia (Barracas Central)", "estadio", "Barracas", -34.6476, -58.3968, ["tapia", "barracas"], ["10060"]),
    ("riestra", "Estadio Guillermo Laza (Riestra)", "estadio", "Nueva Pompeya", -34.6533, -58.4435, ["guillermo laza"], ["17702"]),
    ("ferro", "Estadio Arquitecto Ricardo Etcheverri (Ferro)", "estadio", "Caballito", -34.6199, -58.4486, ["etcheverri", "ferro"], ["9743"]),
    ("atlanta", "Estadio Don León Kolbowski (Atlanta)", "estadio", "Villa Crespo", -34.595, -58.4491, ["kolbowski"], ["10146"]),
    ("allboys", "Estadio Islas Malvinas (All Boys)", "estadio", "Floresta", -34.6165, -58.4977, ["malvinas", "all boys"], ["9786"]),
    ("chicago", "Estadio República de Mataderos (Nueva Chicago)", "estadio", "Mataderos", -34.668, -58.4995, ["nueva chicago", "república de mataderos", "republica de mataderos"], ["236"]),
    ("defensores", "Estadio Juan Pasquale (Defensores de Belgrano)", "estadio", "Núñez", -34.5412, -58.4619, ["pasquale", "defensores"], ["10151"]),
    ("movistar", "Movistar Arena", "arena", "Villa Crespo", -34.5943, -58.4481, ["movistar"], []),
    ("obras", "Estadio Obras Sanitarias", "arena", "Núñez", -34.5455, -58.458, ["obras sanitarias"], []),
    ("lunapark", "Luna Park", "arena", "San Nicolás", -34.6020, -58.3685, ["luna park"], []),
    ("hipodromo", "Hipódromo de Palermo", "predio", "Palermo", -34.5645, -58.4280, ["hipódromo", "hipodromo"], []),
    ("polo", "Campo Argentino de Polo", "predio", "Palermo", -34.5715, -58.427, ["polo"], []),
    ("rural", "La Rural", "predio", "Palermo", -34.5795, -58.4185, ["la rural", "predio ferial"], []),
    ("parqueciudad", "Parque de la Ciudad", "predio", "Villa Soldati", -34.6720, -58.4480, ["parque de la ciudad"], []),
    ("autodromo", "Autódromo Oscar y Juan Gálvez", "predio", "Villa Riachuelo", -34.6940, -58.4590, ["autódromo", "autodromo", "gálvez"], []),
    ("colon", "Teatro Colón", "teatro", "San Nicolás", -34.6011, -58.3833, ["colón", "colon"], []),
    ("congreso", "Plaza del Congreso", "plaza", "Balvanera", -34.6097, -58.3926, ["congreso"], []),
    ("plazamayo", "Plaza de Mayo", "plaza", "Monserrat", -34.6083, -58.3712, ["plaza de mayo"], []),
    ("obelisco", "Obelisco / Av. 9 de Julio", "plaza", "San Nicolás", -34.6037, -58.3816, ["república", "republica", "obelisco"], []),
]

CALLES_OK = {"primary", "secondary", "tertiary", "residential", "unclassified", "living_street",
             "primary_link", "secondary_link", "trunk", "pedestrian"}


from tramos import overpass  # misma consulta con reintentos y servidores alternativos


def xy(lat, lon):
    return (lon * 92000.0, lat * 111000.0)


def dist_seg(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def dist_contorno(p, contorno):
    if len(contorno) == 1:
        return math.hypot(p[0] - contorno[0][0], p[1] - contorno[0][1])
    return min(dist_seg(p, contorno[i - 1], contorno[i]) for i in range(1, len(contorno)))


def buscar_lugar(lat, lon, claves):
    q = f"""[out:json][timeout:180];
    (way(around:450,{lat},{lon})["name"]["leisure"~"stadium|sports_centre|park|track"];
     way(around:450,{lat},{lon})["name"]["amenity"~"theatre|events_venue|arts_centre|exhibition_centre"];
     way(around:450,{lat},{lon})["name"]["place"="square"];
     relation(around:450,{lat},{lon})["name"]["leisure"~"stadium|park|track"];);
    out geom;"""
    d = overpass(q)
    candidatos = []
    for e in d["elements"]:
        nombre = e["tags"].get("name", "").lower()
        if not any(c in nombre for c in claves):
            continue
        if e["type"] == "way":
            pts = [(g["lat"], g["lon"]) for g in e["geometry"]]
        else:
            pts = [(g["lat"], g["lon"]) for m in e.get("members", []) if m.get("role") == "outer"
                   for g in m.get("geometry", [])]
        if not pts:
            continue
        clat = sum(p[0] for p in pts) / len(pts)
        clon = sum(p[1] for p in pts) / len(pts)
        prioridad = 0 if e["tags"].get("leisure") == "stadium" or e["tags"].get("amenity") else 1
        candidatos.append((prioridad, math.hypot((clat - lat) * 111000, (clon - lon) * 92000), e["tags"]["name"], pts, clat, clon))
    if not candidatos:
        return None
    candidatos.sort(key=lambda c: (c[0], c[1]))
    return candidatos[0]


def perimetro(lat, lon, contorno_ll, radio_extra):
    contorno = [xy(*p) for p in contorno_ll]
    q = f"""[out:json][timeout:60];
    way(around:{400 + radio_extra},{lat},{lon})["highway"]["name"];
    out geom;"""
    d = overpass(q)
    umbral = 70 if len(contorno) > 1 else 160
    tramos = {}
    for e in d["elements"]:
        t = e["tags"]
        if t.get("highway") not in CALLES_OK:
            continue
        nombre = t["name"]
        actual = []
        for g in e["geometry"]:
            p = (g["lat"], g["lon"])
            if dist_contorno(xy(*p), contorno) <= umbral:
                actual.append([round(p[0], 6), round(p[1], 6)])
            else:
                if len(actual) >= 2:
                    tramos.setdefault(nombre, []).append(actual)
                actual = []
        if len(actual) >= 2:
            tramos.setdefault(nombre, []).append(actual)
    salida = []
    for nombre, partes in sorted(tramos.items()):
        largo = sum(math.hypot(*(a - b for a, b in zip(xy(*p[i - 1]), xy(*p[i])))) for p in partes for i in range(1, len(p)))
        if largo < 40:
            continue
        for p in partes:
            salida.append({"calle": nombre, "tramo": "perímetro del lugar", "tipo": "estimado", "coords": p})
    return salida


def main():
    oficiales = json.load(open(os.path.join(RAIZ, "www/data/cortes.json"), encoding="utf-8"))
    solo = set(sys.argv[1:])
    previos = {}
    ruta = os.path.join(RAIZ, "www/data/lugares.json")
    if solo and os.path.exists(ruta):
        previos = {l["id"]: l for l in json.load(open(ruta, encoding="utf-8"))["lugares"]}
    resultado = []
    for (lid, nombre, tipo, barrio, lat, lon, claves, espn) in LUGARES:
        if solo and lid not in solo and lid in previos:
            resultado.append(previos[lid])
            continue
        print("•", nombre, file=sys.stderr)
        hallado = buscar_lugar(lat, lon, claves)
        if hallado:
            _, d, nombre_osm, pts, clat, clon = hallado
            print(f"  OSM: {nombre_osm} ({d:.0f} m del punto aproximado)", file=sys.stderr)
            contorno = pts
        else:
            print("  OSM: no encontrado, uso el punto aproximado", file=sys.stderr)
            clat, clon, contorno = lat, lon, [(lat, lon)]
        lugar = {"id": lid, "nombre": nombre, "tipo": tipo, "barrio": barrio,
                 "lat": round(clat, 6), "lon": round(clon, 6), "equiposEspn": espn}
        if lid == "velez":
            lugar["cortes"] = oficiales["cortes"]
            lugar["cortesFuente"] = oficiales["fuente"]
        else:
            lugar["cortes"] = perimetro(clat, clon, contorno, 0)
            lugar["cortesFuente"] = "Estimado: calles que rodean el lugar (OpenStreetMap)"
        print(f"  {len(lugar['cortes'])} tramos", file=sys.stderr)
        resultado.append(lugar)
        time.sleep(2)
    salida = {"actualizado": time.strftime("%Y-%m-%d"), "lugares": resultado}
    with open(os.path.join(RAIZ, "www/data/lugares.json"), "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=1)
    print("OK www/data/lugares.json", file=sys.stderr)


if __name__ == "__main__":
    main()
