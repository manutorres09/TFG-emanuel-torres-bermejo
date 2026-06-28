import { Box, Typography, Paper } from "@mui/material"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts"

function GraficosPartido({ filas, equipoLocalNombre, equipoVisitanteNombre, equipoLocalId, equipoVisitanteId }) {

  // --- Top 3 jugadores por TS% con más de 10 minutos ---
  const top3 = [...filas]
    .filter(f => f.minutos > 10 && f.ts !== null)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 3)
    .map(f => ({
      nombre: f.nombre.split(",")[0],
      "eFG%": f.efg ?? 0,
      "TS%": f.ts ?? 0,
    }))

  // --- Métricas colectivas por equipo ---
  const calcularColectivo = (filasEquipo) => {
    const conMinutos = filasEquipo.filter(f => f.minutos > 0)
    const efg = conMinutos.filter(f => f.efg !== null)
    const ts = conMinutos.filter(f => f.ts !== null)
    const totalPer = conMinutos.reduce((acc, f) => acc + f.perdidas, 0)
    const totalMin = conMinutos.reduce((acc, f) => acc + f.minutos, 0)
    return {
      efg: efg.length ? Math.round(efg.reduce((a, f) => a + f.efg, 0) / efg.length) : 0,
      ts: ts.length ? Math.round(ts.reduce((a, f) => a + f.ts, 0) / ts.length) : 0,
      perdidas: totalMin > 0 ? Math.round((totalPer / totalMin) * 100) : 0,
    }
  }

  const filasLocal = filas.filter(f => f.club_id === equipoLocalId)
  const filasVisitante = filas.filter(f => f.club_id === equipoVisitanteId)
  const colectivoLocal = calcularColectivo(filasLocal)
  const colectivoVisitante = calcularColectivo(filasVisitante)

  const comparativaData = [
    { nombre: "eFG%", [equipoLocalNombre]: colectivoLocal.efg, [equipoVisitanteNombre]: colectivoVisitante.efg },
    { nombre: "TS%", [equipoLocalNombre]: colectivoLocal.ts, [equipoVisitanteNombre]: colectivoVisitante.ts },
    { nombre: "% Pérdidas", [equipoLocalNombre]: colectivoLocal.perdidas, [equipoVisitanteNombre]: colectivoVisitante.perdidas },
  ]

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight="bold" mb={1}>
        Analítica Visual
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Interpretación gráfica de los indicadores clave del partido
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>

        {/* Gráfico 1 — Top 3 jugadores eFG% vs TS% */}
        <Paper sx={{ flex: 1, minWidth: 300, p: 3, borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <Typography variant="body1" fontWeight="bold" mb={0.5}>
            Eficiencia de Tiro — Top 3 Jugadores
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Jugadores con más de 10 minutos, ordenados por TS%
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top3} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
              <YAxis type="category" dataKey="nombre" fontSize={11} width={90} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="eFG%" fill="#e65100" radius={[0, 4, 4, 0]} />
              <Bar dataKey="TS%" fill="#1a1f2e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Gráfico 2 — Comparativa colectiva */}
        <Paper sx={{ flex: 1, minWidth: 300, p: 3, borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <Typography variant="body1" fontWeight="bold" mb={0.5}>
            Comparativa Colectiva
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Promedios estructurales de ambos equipos
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparativaData} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" fontSize={11} />
              <YAxis tickFormatter={v => `${v}%`} fontSize={11} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey={equipoLocalNombre} fill="#e65100" radius={[4, 4, 0, 0]} />
              <Bar dataKey={equipoVisitanteNombre} fill="#1a1f2e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

      </Box>
    </Box>
  )
}

export default GraficosPartido