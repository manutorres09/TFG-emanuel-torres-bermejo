import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  Box, Typography, Card, CardContent, CardActionArea,
  Chip, CircularProgress
} from "@mui/material"
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball"

function Partidos({ onVerPartido }) {
  const [partidos, setPartidos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarPartidos() {
      const { data, error } = await supabase
        .from("partido")
        .select(`
          id, fecha,
          local:equipo_local_id(nombreC),
          visitante:equipo_visitante_id(nombreC),
          torneo:temporada_id(nombreTor)
        `)
        .order("fecha", { ascending: false })

      if (!error) setPartidos(data)
      setCargando(false)
    }
    cargarPartidos()
  }, [])

  if (cargando) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress sx={{ color: "#e65100" }} />
    </Box>
  )

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Historial de Partidos
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Seleccioná un partido para ver el análisis completo
      </Typography>

      {partidos.length === 0 ? (
        <Typography color="text.secondary">
          No hay partidos cargados todavía.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {partidos.map((p) => (
            <Card key={p.id} sx={{
              width: 280,
              borderRadius: 3,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }
            }}>
              <CardActionArea onClick={() => onVerPartido(p.id)} sx={{ p: 1 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <SportsBasketballIcon sx={{ color: "#e65100", fontSize: 18 }} />
                    <Chip
                      label={p.torneo?.nombreTor || "Sin torneo"}
                      size="small"
                      sx={{ backgroundColor: "#fff3e0", color: "#e65100", fontWeight: 600 }}
                    />
                  </Box>
                  <Typography fontWeight="bold" fontSize={15}>
                    {p.local?.nombreC}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    vs
                  </Typography>
                  <Typography fontWeight="bold" fontSize={15}>
                    {p.visitante?.nombreC}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    {p.fecha}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default Partidos