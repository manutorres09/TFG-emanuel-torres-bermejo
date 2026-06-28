import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  Box, Typography, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Button, Tabs, Tab, TableSortLabel
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SmartToyIcon from "@mui/icons-material/SmartToy"
import GraficosPartido from "../components/GraficosPartido"

const columnas = [
  { id: "numCamisetaJ", label: "#", width: 45 },
  { id: "nombre", label: "Jugador", width: 220 },
  { id: "minutos", label: "MIN", width: 45 },
  { id: "puntos", label: "PTS", width: 45 },
  { id: "t2_convertidos", label: "T2C", width: 45 },
  { id: "t2_intentados", label: "T2I", width: 45 },
  { id: "pct_t2", label: "T2%", width: 65 },
  { id: "t3_convertidos", label: "T3C", width: 45 },
  { id: "t3_intentados", label: "T3I", width: 45 },
  { id: "pct_t3", label: "T3%", width: 65 },
  { id: "tl_convertidos", label: "TLC", width: 45 },
  { id: "tl_intentados", label: "TLI", width: 45 },
  { id: "pct_tl", label: "TL%", width: 65 },
  { id: "reb_defensivos", label: "RDEF", width: 50 },
  { id: "reb_ofensivos", label: "ROF", width: 45 },
  { id: "reb_total", label: "REB", width: 45 },
  { id: "asistencias", label: "AST", width: 45 },
  { id: "robos", label: "ROB", width: 45 },
  { id: "perdidas", label: "PER", width: 45 },
  { id: "bloqueos", label: "TAP", width: 45 },
  { id: "faltas_cometidas", label: "FC", width: 40 },
  { id: "faltas_recibidas", label: "FR", width: 45 },
  { id: "valoracion", label: "VAL", width: 55 },
  { id: "mas_menos", label: "+/-", width: 55 },
  { id: "efg", label: "eFG%", width: 65 },
  { id: "ts", label: "TS%", width: 65 },
  { id: "ppp", label: "PPP", width: 60 },
  { id: "usg", label: "USG%", width: 55 },
]
function aplanarJugador(b) {
  const m = b.metricas_avanzadas
  const pct = (c, i) => i > 0 ? Math.round((c / i) * 100) : null
  return {
    id: b.id,
    numCamisetaJ: b.jugador?.numCamisetaJ ?? 0,
    nombre: `${b.jugador?.apellidoJ}, ${b.jugador?.nombreJ}`,
    club_id: b.jugador?.club_id,
    minutos: b.minutos,
    puntos: b.puntos,
    t2_convertidos: b.t2_convertidos,
    t2_intentados: b.t2_intentados,
    pct_t2: pct(b.t2_convertidos, b.t2_intentados),
    t3_convertidos: b.t3_convertidos,
    t3_intentados: b.t3_intentados,
    pct_t3: pct(b.t3_convertidos, b.t3_intentados),
    tl_convertidos: b.tl_convertidos,
    tl_intentados: b.tl_intentados,
    pct_tl: pct(b.tl_convertidos, b.tl_intentados),
    reb_defensivos: b.reb_defensivos,
    reb_ofensivos: b.reb_ofensivos,
    reb_total: b.reb_defensivos + b.reb_ofensivos,
    asistencias: b.asistencias,
    robos: b.robos,
    perdidas: b.perdidas,
    bloqueos: b.bloqueos,
    faltas_cometidas: b.faltas_cometidas,
    faltas_recibidas: b.faltas_recibidas,
    valoracion: b.valoracion ?? 0,
    mas_menos: b.mas_menos ?? 0,
    efg: m?.efg_percentage != null ? Math.round(m.efg_percentage * 100) : null,
    ts: m?.ts_percentage != null ? Math.round(m.ts_percentage * 100) : null,
    ppp: m?.puntos_por_posesion ?? null,
    usg: m?.usage_percentage != null ? Math.round(m.usage_percentage) : null,
  }
}

function descendingComparator(a, b, orderBy) {
  const valA = a[orderBy] ?? -Infinity
  const valB = b[orderBy] ?? -Infinity
  if (valB < valA) return -1
  if (valB > valA) return 1
  return 0
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

const metricasAvanzadas = ["efg", "ts", "ppp", "usg"]

function DetallePartido({ partidoId, onVolver, onAbrirChat }) {
  const [partido, setPartido] = useState(null)
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tabActiva, setTabActiva] = useState(0)
  const [order, setOrder] = useState("asc")
  const [orderBy, setOrderBy] = useState("numCamisetaJ")

  useEffect(() => {
    async function cargarDatos() {
      const { data: p } = await supabase
        .from("partido")
        .select(`
          id, fecha, puntos_local, puntos_visitante,
          local:equipo_local_id(id, nombreC),
          visitante:equipo_visitante_id(id, nombreC),
          torneo:temporada_id(nombreTor)
        `)
        .eq("id", partidoId)
        .single()

      const { data: bs } = await supabase
        .from("boxscore")
        .select(`
          id, minutos, puntos, mas_menos,
          t2_convertidos, t2_intentados,
          t3_convertidos, t3_intentados,
          tl_convertidos, tl_intentados,
          reb_ofensivos, reb_defensivos,
          asistencias, perdidas, robos, bloqueos,
          faltas_cometidas, faltas_recibidas, valoracion,
          jugador:jugador_id(id, nombreJ, apellidoJ, numCamisetaJ, club_id),
          metricas_avanzadas(efg_percentage, ts_percentage, puntos_por_posesion, usage_percentage)
        `)
        .eq("partido_id", partidoId)

      setPartido(p)
      setFilas((bs || []).map(aplanarJugador))
      setCargando(false)
    }
    cargarDatos()
  }, [partidoId])

  const handleSort = (colId) => {
    const isAsc = orderBy === colId && order === "asc"
    setOrder(isAsc ? "desc" : "asc")
    setOrderBy(colId)
  }

  if (cargando) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress sx={{ color: "#e65100" }} />
    </Box>
  )

  const equipoLocalId = partido?.local?.id
  const equipoVisitanteId = partido?.visitante?.id

  const filasLocal = filas.filter(f => f.club_id === equipoLocalId)
  const filasVisitante = filas.filter(f => f.club_id === equipoVisitanteId)
  const filasActivas = [...(tabActiva === 0 ? filasLocal : filasVisitante)].sort(getComparator(order, orderBy))

  const renderCelda = (fila, col) => {
    const val = fila[col.id]
    if (val === null || val === undefined) return <span style={{ color: "#bbb" }}>-</span>
    if (col.id === "mas_menos") {
      const color = val > 0 ? "#2e7d32" : val < 0 ? "#c62828" : "#888"
      return <span style={{ color, fontWeight: 600 }}>{val > 0 ? `+${val}` : val}</span>
    }
    if (["pct_t2", "pct_t3", "pct_tl", "efg", "ts", "usg"].includes(col.id)) {
      return `${val}%`
    }
    return val
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ color: "#e65100", mb: 2, pl: 0 }}>
        Volver
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Chip label={partido?.torneo?.nombreTor} size="small" sx={{ backgroundColor: "#fff3e0", color: "#e65100", fontWeight: 600, mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            {partido?.local?.nombreC} ({partido?.puntos_local}) vs {partido?.visitante?.nombreC} ({partido?.puntos_visitante})
          </Typography>
          <Typography variant="body2" color="text.secondary">{partido?.fecha}</Typography>
        </Box>
      </Box>

      <Tabs value={tabActiva} onChange={(_, v) => setTabActiva(v)} sx={{ mb: 2, "& .MuiTabs-indicator": { backgroundColor: "#e65100" } }}>
        <Tab label={partido?.local?.nombreC} sx={{ "&.Mui-selected": { color: "#e65100" } }} />
        <Tab label={partido?.visitante?.nombreC} sx={{ "&.Mui-selected": { color: "#e65100" } }} />
      </Tabs>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflowX: "auto" }}>
        <Table size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead sx={{ backgroundColor: "#1a1f2e" }}>
            <TableRow>
              {columnas.map(col => (
                <TableCell
                  key={col.id}
                  sx={{ color: "white", fontWeight: "bold", fontSize: 11, width: col.width, minWidth: col.width, whiteSpace: "nowrap",
                    ...(metricasAvanzadas.includes(col.id) ? { backgroundColor: "#2a3550" } : {})
                  }}
                  sortDirection={orderBy === col.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : "asc"}
                    onClick={() => handleSort(col.id)}
                    sx={{ color: "white !important", "& .MuiTableSortLabel-icon": { color: "white !important" } }}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filasActivas.map((fila, i) => (
              <TableRow key={fila.id} sx={{ backgroundColor: i % 2 === 0 ? "white" : "#f9f9f9", "&:hover": { backgroundColor: "#fff3e0" } }}>
                {columnas.map(col => (
                  <TableCell
                    key={col.id}
                    sx={{
                      fontSize: 12,
                      fontWeight: col.id === "puntos" || col.id === "nombre" ? 600 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      ...(metricasAvanzadas.includes(col.id) ? { backgroundColor: i % 2 === 0 ? "#fffaf5" : "#fff5eb", color: "#e65100", fontWeight: 600 } : {})
                    }}
                  >
                    {renderCelda(fila, col)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <GraficosPartido
        filas={filas}
        equipoLocalNombre={partido?.local?.nombreC}
        equipoVisitanteNombre={partido?.visitante?.nombreC}
        equipoLocalId={equipoLocalId}
        equipoVisitanteId={equipoVisitanteId}
      />

      <Box sx={{ position: "fixed", bottom: 32, right: 32 }}>
        <Button
          variant="contained"
          onClick={() => onAbrirChat(partido)}
          sx={{ backgroundColor: "#e65100", "&:hover": { backgroundColor: "#bf360c" }, borderRadius: "50%", minWidth: 64, height: 64, boxShadow: "0 4px 16px rgba(230,81,0,0.4)" }}
        >
          <SmartToyIcon sx={{ fontSize: 28 }} />
        </Button>
      </Box>
    </Box>
  )
}

export default DetallePartido