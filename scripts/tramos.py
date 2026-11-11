"""Convierte cortes escritos como "Calle X entre A y B" en tramos dibujables (coordenadas OSM).

Entrada (JSON por stdin o archivo):
  {"lat": -34.60, "lon": -58.38,          # punto aproximado de la zona
   "radio": 1500,                          # metros a buscar alrededor (opcional, 1500 por defecto)
   "cortes": [
     {"calle": "Av. de Mayo", "desde": "Bolívar", "hasta": "Av. 9 de Julio", "tipo": "total"},
     {"calle": "Lima", "desde": "Av. de Mayo", "hasta": "Cerrito", "tipo": "parcial", "tramo": "un carril"}
   ]}

Salida (stdout): lista JSON de {"calle", "tramo", "tipo", "coords": [[lat, lon], ...]}
lista para pegar en "cortes" de un evento en www/data/eventos.json.
Los tramos que no se puedan resolver se informan por stderr y no se incluyen.

Uso:  python scripts/tramos.py entrada.json > salida.json
"""
import heapq, json, math, subprocess, sys, time, unicodedata

OVERPASS = "https://overpass-api.de/api/interpreter"


def normalizar(nombre):
    n = unicodedata.normalize("NFD", nombre.lower())
    n = "".join(c for c in n if unicodedata.category(c) != "Mn")
    for prefijo in ("avenida ", "av. ", "av ", "autopista ", "au. ", "calle ", "pasaje ", "boulevard ", "bv. "):
        if n.startswith(prefijo):
            n = n[len(prefijo):]
    n = n.replace(".", "").strip()
    # "128 - mariano antonio fragueiro" -> "mariano antonio fragueiro"
    if " - " in n and n.split(" - ")[0].strip().isdigit():
        n = n.split(" - ", 1)[1]
    return n


def coincide(buscado, nombre_osm):
    b, o = normalizar(buscado), normalizar(nombre_osm)
    if b == o:
        return True
    pb, po = b.split(), o.split()
    # "jbjusto" / "juan b justo" / "juan bautista justo": se compara el apellido y la inicial
    return pb and po and pb[-1] == po[-1] and (len(pb) == 1 or pb[0][0] == po[0][0])


def overpass(q):
    # curl usa los certificados del sistema. El servidor público permite pocas consultas a la vez:
    # si responde 429/504 se espera y se reintenta.
    for intento in range(6):
        r = subprocess.run(["curl", "-s", "-w", "\n%{http_code}", "-A", "eventos-caba-app (github.com/Cygosc/eventos-velez)",
                            "--max-time", "200", "--data-urlencode", "data=" + q, OVERPASS], capture_output=True)
        cuerpo, _, codigo = r.stdout.decode("utf-8", "replace").rpartition("\n")
        if r.returncode == 0 and codigo == "200":
            try:
                return json.loads(cuerpo)
            except ValueError:
                pass
        print(f"  overpass respondió {codigo or 'sin conexión'}, reintento en {20 * (intento + 1)} s", file=sys.stderr)
        time.sleep(20 * (intento + 1))
    raise RuntimeError("Overpass no respondió")


def metros(a, b):
    return math.hypot((a[0] - b[0]) * 111000, (a[1] - b[1]) * 92000)


def main():
    entrada = json.load(open(sys.argv[1], encoding="utf-8") if len(sys.argv) > 1 else sys.stdin)
    lat, lon, radio = entrada["lat"], entrada["lon"], entrada.get("radio", 1500)
    d = overpass(f'[out:json][timeout:90];(way(around:{radio},{lat},{lon})["highway"]["name"];'
                 f'way(around:{radio},{lat},{lon})["railway"="rail"];);out body geom;')
    ways = [w for w in d["elements"] if w["type"] == "way"]
    coords = {}
    for w in ways:
        for nid, g in zip(w["nodes"], w["geometry"]):
            coords[nid] = (g["lat"], g["lon"])

    def nodos_de(nombre):
        if normalizar(nombre) in ("vias", "vias del ffcc", "ffcc", "vias del tren"):
            sel = [w for w in ways if w["tags"].get("railway") == "rail"]
        else:
            sel = [w for w in ways if "name" in w["tags"] and coincide(nombre, w["tags"]["name"])]
        return sel

    def camino(calle_ways, desde_ways, hasta_ways):
        adj = {}
        nodos = set()
        for w in calle_ways:
            ids = w["nodes"]
            nodos.update(ids)
            for i in range(1, len(ids)):
                adj.setdefault(ids[i - 1], set()).add(ids[i])
                adj.setdefault(ids[i], set()).add(ids[i - 1])

        def cruce(otras):
            otros = {n for w in otras for n in w["nodes"]}
            comunes = nodos & otros
            if comunes:
                return list(comunes)
            if not otros:
                return []
            mejor = min(((metros(coords[a], coords[b]), a) for a in nodos for b in otros))
            return [mejor[1]] if mejor[0] < 120 else []

        A, B = cruce(desde_ways), cruce(hasta_ways)
        mejor = None
        for a in A:
            D, P, q = {a: 0}, {}, [(0, a)]
            while q:
                du, u = heapq.heappop(q)
                if du > D[u]:
                    continue
                for v in adj.get(u, ()):
                    nd = du + metros(coords[u], coords[v])
                    if nd < D.get(v, 1e18):
                        D[v], P[v] = nd, u
                        heapq.heappush(q, (nd, v))
            for b in B:
                if b in D and b != a and (mejor is None or D[b] < mejor[0]):
                    p = [b]
                    while p[-1] != a:
                        p.append(P[p[-1]])
                    mejor = (D[b], p[::-1])
        return mejor

    salida = []
    for c in entrada["cortes"]:
        cw, dw, hw = nodos_de(c["calle"]), nodos_de(c["desde"]), nodos_de(c["hasta"])
        faltan = [n for n, w in ((c["calle"], cw), (c["desde"], dw), (c["hasta"], hw)) if not w]
        if faltan:
            print(f"NO RESUELTO {c['calle']} entre {c['desde']} y {c['hasta']}: no encuentro {faltan}", file=sys.stderr)
            continue
        r = camino(cw, dw, hw)
        if not r:
            print(f"NO RESUELTO {c['calle']} entre {c['desde']} y {c['hasta']}: las calles no se cruzan", file=sys.stderr)
            continue
        largo, p = r
        print(f"ok {c['calle']} entre {c['desde']} y {c['hasta']}: {largo:.0f} m", file=sys.stderr)
        salida.append({"calle": c["calle"], "tramo": c.get("tramo") or f"entre {c['desde']} y {c['hasta']}",
                       "tipo": c.get("tipo", "total"),
                       "coords": [[round(coords[n][0], 6), round(coords[n][1], 6)] for n in p]})
    json.dump(salida, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
