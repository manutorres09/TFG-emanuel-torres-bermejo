import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  Box, Typography, CircularProgress, Accordion,
  AccordionSummary, AccordionDetails, Chip, Avatar
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import PersonIcon from "@mui/icons-material/Person"

function Jugadores() {
  const [clubes, setClubes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      // Traemos boxscores con jugador, club y torneo del partido
      const { data } = await supabase
        .from("boxscore")
        .select(`
          jugador:jugador_id(id, nombreJ, apellidoJ, numCamisetaJ, club:club_id(id, nombreC)),
          partido:partido_id(torneo:temporada_id(id, nombreTor))
        `)

      if (!data) { setCargando(false); return }

      // Estructura: { clubId: { nombre, torneos: { torneoNombre: { jugadores: Set } } } }
      const estructura = {}

      data.forEach(bs => {
        const jugador = bs.jugador
        const club = jugador?.club
        const torneo = bs.partido?.torneo

        if (!jugador || !club || !torneo) return

        if (!estructura[club.id]) {
          estructura[club.id] = { id: club.id, nombre: club.nombreC, torneos: {} }
        }

        const torneoNombre = torneo.nombreTor
        if (!estructura[club.id].torneos[torneoNombre]) {
          estructura[club.id].torneos[torneoNombre] = { nombre: torneoNombre, jugadores: new Map() }
        }

        // Usamos Map para deduplicar jugadores por ID
        estructura[club.id].torneos[torneoNombre].jugadores.set(jugador.id, jugador)
      })

      // Convertir a arrays ordenados
      const clubesArray = Object.values(estructura)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map(club => ({
          ...club,
          torneos: Object.values(club.torneos)
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map(t => ({
              ...t,
              jugadores: Array.from(t.jugadores.values())
                .sort((a, b) => a.apellidoJ.localeCompare(b.apellidoJ))
            }))
        }))

      setClubes(clubesArray)
      setCargando(false)
    }
    cargarDatos()
  }, [])

  if (cargando) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress sx={{ color: "#e65100" }} />
    </Box>
  )

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Plantel y Jugadores
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {clubes.length} clubes registrados
      </Typography>

      {clubes.length === 0 ? (
        <Typography color="text.secondary">No hay jugadores registrados todavía.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {clubes.map(club => (
            <Accordion
              key={club.id}
              sx={{ borderRadius: "12px !important", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", "&:before": { display: "none" } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#e65100" }} />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <SportsBasketballIcon sx={{ color: "#e65100", fontSize: 22 }} />
                  <Typography fontWeight="bold" fontSize={15}>{club.nombre}</Typography>
                  <Chip
                    label={`${club.torneos.length} ${club.torneos.length === 1 ? "categoría" : "categorías"}`}
                    size="small"
                    sx={{ backgroundColor: "#fff3e0", color: "#e65100", fontWeight: 600 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pl: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {club.torneos.map(torneo => (
                    <Accordion
                      key={torneo.nombre}
                      sx={{ borderRadius: "8px !important", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", "&:before": { display: "none" } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#1a1f2e" }} />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <EmojiEventsIcon sx={{ color: "#1a1f2e", fontSize: 18 }} />
                          <Typography fontWeight={600} fontSize={14}>{torneo.nombre}</Typography>
                          <Chip
                            label={`${torneo.jugadores.length} jugadores`}
                            size="small"
                            sx={{ backgroundColor: "#f0f0f0", color: "#555", fontWeight: 500 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {torneo.jugadores.map(j => (
                            <Box
                              key={j.id}
                              sx={{
                                display: "flex", alignItems: "center", gap: 1.5,
                                backgroundColor: "#f9f9f9", borderRadius: 2,
                                px: 1.5, py: 1, minWidth: 200
                              }}
                            >
                              <Avatar sx={{ backgroundColor: "#1a1f2e", width: 30, height: 30, fontSize: 12 }}>
                                {j.numCamisetaJ ?? <PersonIcon fontSize="small" />}
                              </Avatar>
                              <Box>
                                <Typography fontSize={13} fontWeight={600}>
                                  {j.apellidoJ}, {j.nombreJ}
                                </Typography> 
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default Jugadores