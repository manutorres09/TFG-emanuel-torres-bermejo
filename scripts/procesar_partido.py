import openpyxl
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from datetime import date
import uuid

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase = create_client(
    os.environ.get("VITE_SUPABASE_URL"),
    os.environ.get("VITE_SUPABASE_ANON_KEY")
)

# Estructura fija CABB
FILA_TITULO        = 6
FILA_EQUIPO_LOCAL  = 11
FILA_DATOS_LOCAL   = (14, 25)
FILA_TOTAL_LOCAL = 26
FILA_TOTAL_VISIT = 45
FILA_EQUIPO_VISIT  = 29
FILA_DATOS_VISIT   = (33, 44)

COL_NUM  = 1; COL_NOMBRE = 2; COL_MIN = 3; COL_PTS = 4
COL_T2   = 5; COL_T3 = 7;    COL_TL  = 9
COL_RDEF = 11; COL_ROF = 12; COL_AST = 14; COL_REC = 15
COL_PER  = 16; COL_TAPC = 17; COL_FC = 19; COL_FR  = 20
COL_VAL  = 21; COL_MAS_MENOS = 22


def v(ws, row, col):
    val = ws.cell(row=row, column=col).value
    return str(val).strip() if val is not None else ""

def tiros(s):
    try: c, i = s.split("/"); return int(c), int(i)
    except: return 0, 0

def minutos(s):
    try: return int(s.split(":")[0])
    except: return 0

def calcular_metricas(j):
    t2c = j["t2_convertidos"]; t2i = j["t2_intentados"]
    t3c = j["t3_convertidos"]; t3i = j["t3_intentados"]
    tli = j["tl_intentados"]
    pts = j["puntos"]; per = j["perdidas"]; min_ = j["minutos"]

    fga = t2i + t3i
    efg = round(min((t2c + 1.5 * t3c) / fga, 1.0), 4) if fga > 0 else None
    tsa = fga + 0.44 * tli
    ts  = round(min(pts / (2 * tsa), 1.0), 4) if tsa > 0 else None
    pos = fga + 0.44 * tli + per
    ppp = round(pts / pos, 4) if pos > 0 else None
    usg = round((pos / min_) * 8, 4) if min_ > 0 and pos > 0 else None
    return efg, ts, ppp, usg

def leer_jugadores(ws, fila_ini, fila_fin):
    jugadores = []
    for r in range(fila_ini, fila_fin + 1):
        num_str = v(ws, r, COL_NUM)
        nombre  = v(ws, r, COL_NOMBRE)
        if not num_str or not nombre or "TOTAL" in nombre.upper():
            continue
        try: num = int(num_str)
        except: continue
        t2c, t2i = tiros(v(ws, r, COL_T2))
        t3c, t3i = tiros(v(ws, r, COL_T3))
        tlc, tli = tiros(v(ws, r, COL_TL))
        jugadores.append({
            "numero": num, "nombre": nombre,
            "minutos": minutos(v(ws, r, COL_MIN)),
            "puntos": int(v(ws, r, COL_PTS) or 0),
            "t2_convertidos": t2c, "t2_intentados": t2i,
            "t3_convertidos": t3c, "t3_intentados": t3i,
            "tl_convertidos": tlc, "tl_intentados": tli,
            "reb_defensivos": int(v(ws, r, COL_RDEF) or 0),
            "reb_ofensivos":  int(v(ws, r, COL_ROF)  or 0),
            "asistencias":    int(v(ws, r, COL_AST)  or 0),
            "robos":          int(v(ws, r, COL_REC)  or 0),
            "perdidas":       int(v(ws, r, COL_PER)  or 0),
            "bloqueos":       int(v(ws, r, COL_TAPC) or 0),
            "faltas_cometidas": int(v(ws, r, COL_FC) or 0),
            "faltas_recibidas": int(v(ws, r, COL_FR) or 0),
            "valoracion": int(v(ws, r, COL_VAL) or 0) if v(ws, r, COL_VAL).lstrip('-').isdigit() else 0,
            "mas_menos": int(v(ws, r, COL_MAS_MENOS) or 0) if v(ws, r, COL_MAS_MENOS).lstrip('-').isdigit() else 0,
        })
    return jugadores


def obtener_o_crear_club(nombre):
    res = supabase.table("club").select("id").eq("nombreC", nombre).execute()
    if res.data:
        print(f"  ♻️  Club existente: {nombre}")
        return res.data[0]["id"]
    nuevo_id = str(uuid.uuid4())
    supabase.table("club").insert({"id": nuevo_id, "nombreC": nombre}).execute()
    print(f"  ✅ Club creado: {nombre}")
    return nuevo_id


def obtener_o_crear_torneo(nombre):
    res = supabase.table("torneo").select("id").eq("nombreTor", nombre).execute()
    if res.data:
        print(f"  ♻️  Torneo existente: {nombre}")
        return res.data[0]["id"]
    nuevo_id = str(uuid.uuid4())
    supabase.table("torneo").insert({"id": nuevo_id, "nombreTor": nombre, "anio": str(date.today().year)}).execute()
    print(f"  ✅ Torneo creado: {nombre}")
    return nuevo_id


def obtener_o_crear_jugador(nombre_completo, numero, club_id):
    partes = nombre_completo.split(",")
    apellido = partes[0].strip()
    nombre_j = partes[1].strip() if len(partes) > 1 else ""

    res = supabase.table("jugador").select("id")\
        .eq("apellidoJ", apellido)\
        .eq("nombreJ", nombre_j)\
        .eq("club_id", club_id)\
        .execute()
    if res.data:
        return res.data[0]["id"], apellido, nombre_j

    nuevo_id = str(uuid.uuid4())
    supabase.table("jugador").insert({
        "id": nuevo_id,
        "club_id": club_id,
        "nombreJ": nombre_j,
        "apellidoJ": apellido,
        "numCamisetaJ": numero,
    }).execute()
    return nuevo_id, apellido, nombre_j


def procesar_archivo(ruta_xlsx):
    print(f"\n📂 Procesando: {ruta_xlsx}")
    wb = openpyxl.load_workbook(ruta_xlsx, data_only=True)
    ws = wb.active

    titulo           = v(ws, FILA_TITULO, 1)
    equipo_local     = v(ws, FILA_EQUIPO_LOCAL, 1)
    equipo_visitante = v(ws, FILA_EQUIPO_VISIT, 1)
    partes           = titulo.split(" - ")
    torneo           = partes[2].strip() if len(partes) >= 3 else "Sin torneo"
    # Extraer fecha del título si está disponible, sino usar hoy
    fecha_partido    = str(date.today())

    print(f"🏀 {equipo_local} vs {equipo_visitante} | Torneo: {torneo}")

    # --- Resolver IDs de club y torneo (reutilizar si ya existen) ---
    club_local_id  = obtener_o_crear_club(equipo_local)
    club_visit_id  = obtener_o_crear_club(equipo_visitante)
    torneo_id      = obtener_o_crear_torneo(torneo)

    # --- Verificar si el partido ya existe ---
    partido_check = supabase.table("partido").select("id")\
        .eq("equipo_local_id", club_local_id)\
        .eq("equipo_visitante_id", club_visit_id)\
        .eq("temporada_id", torneo_id)\
        .eq("fecha", fecha_partido)\
        .execute()

    if partido_check.data:
        print(f"⚠️  Este partido ya fue cargado anteriormente. Abortando.")
        return

    # --- Leer jugadores del XLSX ---
    jugadores_local     = leer_jugadores(ws, *FILA_DATOS_LOCAL)
    jugadores_visitante = leer_jugadores(ws, *FILA_DATOS_VISIT)
    puntos_local     = int(v(ws, FILA_TOTAL_LOCAL, COL_PTS) or 0)
    puntos_visitante = int(v(ws, FILA_TOTAL_VISIT, COL_PTS) or 0)
    print(f"👥 Local: {len(jugadores_local)} | Visitante: {len(jugadores_visitante)}")

    # --- Crear partido ---
    partido_id = str(uuid.uuid4())
    supabase.table("partido").insert({
        "id": partido_id,
        "temporada_id": torneo_id,
        "equipo_local_id": club_local_id,
        "equipo_visitante_id": club_visit_id,
        "fecha": fecha_partido,
        "puntos_local": puntos_local,
        "puntos_visitante": puntos_visitante,
    }).execute()
    print(f"✅ Partido creado: {partido_id}")

    # --- Procesar jugadores, boxscores y métricas en memoria ---
    boxscores_db = []
    metricas_db  = []

    for jugadores, club_id in [(jugadores_local, club_local_id), (jugadores_visitante, club_visit_id)]:
        for j in jugadores:
            jugador_id, apellido, nombre_j = obtener_o_crear_jugador(j["nombre"], j["numero"], club_id)
            boxscore_id = str(uuid.uuid4())
            efg, ts, ppp, usg = calcular_metricas(j)

            boxscores_db.append({
                "id": boxscore_id, "partido_id": partido_id, "jugador_id": jugador_id,
                "minutos": j["minutos"], "puntos": j["puntos"],
                "t2_intentados": j["t2_intentados"], "t2_convertidos": j["t2_convertidos"],
                "t3_intentados": j["t3_intentados"], "t3_convertidos": j["t3_convertidos"],
                "tl_intentados": j["tl_intentados"], "tl_convertidos": j["tl_convertidos"],
                "reb_ofensivos": j["reb_ofensivos"],   "reb_defensivos": j["reb_defensivos"],
                "asistencias":   j["asistencias"],     "perdidas":       j["perdidas"],
                "robos":         j["robos"],            "bloqueos":       j["bloqueos"],
                "faltas_cometidas": j["faltas_cometidas"], "faltas_recibidas": j["faltas_recibidas"],
                "valoracion": j["valoracion"], "mas_menos": j["mas_menos"],
            })
            metricas_db.append({
                "boxscore_id": boxscore_id,
                "efg_percentage": efg, "ts_percentage": ts,
                "puntos_por_posesion": ppp, "usage_percentage": usg,
            })

    # --- Bulk insert de boxscores y métricas ---
    print("💾 Insertando boxscores y métricas...")
    supabase.table("boxscore").insert(boxscores_db).execute()
    supabase.table("metricas_avanzadas").insert(metricas_db).execute()

    print(f"🎉 Listo. {len(boxscores_db)} jugadores procesados.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python procesar_partido.py <ruta_al_xlsx>")
        sys.exit(1)
    procesar_archivo(sys.argv[1])