import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import {
  Box, Typography, TextField, Button, Paper,
  CircularProgress, Avatar, Chip
} from "@mui/material"
import SmartToyIcon from "@mui/icons-material/SmartToy"
import SendIcon from "@mui/icons-material/Send"
import PersonIcon from "@mui/icons-material/Person"
import ReactMarkdown from "react-markdown"
import IconButton from "@mui/material/IconButton"
import RemoveIcon from "@mui/icons-material/Remove"
import CloseIcon from "@mui/icons-material/Close"

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

function ChatIA({ contexto, onCerrar }) {
  const [mensajes, setMensajes] = useState([])
  const [input, setInput] = useState("")
  const [cargando, setCargando] = useState(false)
  const [boxscores, setBoxscores] = useState([])
  const bottomRef = useRef(null)
  const [minimizado, setMinimizado] = useState(false)

  useEffect(() => {
    if (contexto?.id) {
      cargarBoxscores(contexto.id)
    }
  }, [contexto])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  async function cargarBoxscores(partidoId) {
    const { data } = await supabase
      .from("boxscore")
      .select(`
        puntos, minutos, asistencias, robos, perdidas, bloqueos,
        reb_ofensivos, reb_defensivos,
        t2_convertidos, t2_intentados,
        t3_convertidos, t3_intentados,
        tl_convertidos, tl_intentados,
        jugador:jugador_id(nombreJ, apellidoJ, club_id),
        metricas_avanzadas(efg_percentage, ts_percentage, puntos_por_posesion)
      `)
      .eq("partido_id", partidoId)
    setBoxscores(data || [])

    // Mensaje inicial automático
    setMensajes([{
      rol: "ia",
      texto: `Hola, soy SmartScout IA 🏀. Tengo cargado el partido **${contexto.local?.nombreC} vs ${contexto.visitante?.nombreC}** (${contexto.torneo?.nombreTor}). Podés preguntarme sobre el rendimiento de jugadores, métricas avanzadas, tendencias del equipo o cualquier análisis táctico.`
    }])
  }

function construirContexto() {
  if (!boxscores.length) return ""

  const equipoLocalId = contexto?.local?.id
  const equipoVisitanteId = contexto?.visitante?.id

  const formatearJugadores = (lista) =>
    lista.map(b => {
      const j = b.jugador
      const m = b.metricas_avanzadas
      return `  - ${j?.apellidoJ}, ${j?.nombreJ}: ${b.puntos}pts, ${b.minutos}min, ${b.asistencias}ast, ${b.robos}rob, ${b.perdidas}per, ${b.reb_defensivos + b.reb_ofensivos}reb, T2: ${b.t2_convertidos}/${b.t2_intentados}, T3: ${b.t3_convertidos}/${b.t3_intentados}, TL: ${b.tl_convertidos}/${b.tl_intentados}, eFG%: ${m?.efg_percentage}, TS%: ${m?.ts_percentage}, PPP: ${m?.puntos_por_posesion}`
    }).join("\n")

  const jugadoresLocal = boxscores.filter(b => b.jugador?.club_id === equipoLocalId)
  const jugadoresVisitante = boxscores.filter(b => b.jugador?.club_id === equipoVisitanteId)
  const equipoGanador = contexto?.puntos_local > contexto?.puntos_visitante
    ? contexto?.local?.nombreC
    : contexto?.puntos_local < contexto?.puntos_visitante
    ? contexto?.visitante?.nombreC
    : null

return `Sos un asistente de análisis táctico de básquetbol federado argentino. Tu único rol es analizar los datos estadísticos del partido que se te proveen a continuación. 

REGLAS ESTRICTAS:
- Respondé ÚNICAMENTE con información derivada de los datos del partido provistos. No uses conocimientos externos, no menciones otros partidos, ligas, jugadores o equipos que no estén en estos datos.
- No hagas recomendaciones médicas ni psicológicas.
- No compares con jugadores de otras ligas (NBA, Liga Nacional, etc).
- Si no podés responder algo con los datos disponibles, decilo claramente.
- Cuando menciones una métrica avanzada (eFG%, TS%, PPP, USG%) por primera vez en la conversación, explicá brevemente qué mide y por qué es relevante. En menciones posteriores no la expliques de nuevo.
- Cuando te pregunten por el "mejor" o "más eficiente" en algo, considerá siempre el volumen: priorizá jugadores con más de 10 minutos jugados. Si corresponde, mencioná el top 3 con una línea de contexto cada uno.
- Tené en cuenta el resultado final del partido para contextualizar el análisis cuando sea relevante.
- Las respuestas deben ser concisas y apropiadas para un chat. Sin listas de datos crudos, sin tablas, sin reproducir las estadísticas completas de todos los jugadores.
- El destinatario es un entrenador o asistente técnico con conocimiento básico de estadísticas. Usá lenguaje claro y accesible.

RESULTADO DEL PARTIDO:
${contexto?.local?.nombreC} ${contexto?.puntos_local} - ${contexto?.puntos_visitante} ${contexto?.visitante?.nombreC}
Torneo: ${contexto?.torneo?.nombreTor} | Fecha: ${contexto?.fecha}
${equipoGanador ? `Ganador: ${equipoGanador}` : "Partido empatado"}

EQUIPO LOCAL — ${contexto?.local?.nombreC}:
${formatearJugadores(jugadoresLocal)}

EQUIPO VISITANTE — ${contexto?.visitante?.nombreC}:
${formatearJugadores(jugadoresVisitante)}

Cada jugador pertenece únicamente al equipo bajo el cual está listado.`
 }

  async function enviarMensaje() {
    if (!input.trim() || cargando) return

    const pregunta = input.trim()
    setInput("")
    setMensajes(prev => [...prev, { rol: "usuario", texto: pregunta }])
    setCargando(true)

    try {
      const contextoPartido = construirContexto()
      const historial = mensajes
        .filter(m => m.rol !== "ia" || mensajes.indexOf(m) > 0)
        .map(m => ({
          role: m.rol === "usuario" ? "user" : "model",
          parts: [{ text: m.texto }]
        }))

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: contextoPartido }] },
            contents: [
              ...historial,
              { role: "user", parts: [{ text: pregunta }] }
            ]
          })
        }
      )

      const data = await response.json()
      const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta."
      setMensajes(prev => [...prev, { rol: "ia", texto: respuesta }])
    } catch (err) {
      setMensajes(prev => [...prev, { rol: "ia", texto: "Error al conectar con Gemini. Verificá tu API key." }])
    } finally {
      setCargando(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  if (!contexto) return (
    <Box sx={{ textAlign: "center", mt: 8 }}>
      <SmartToyIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Seleccioná un partido desde el Historial para analizarlo con IA
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        Hacé clic en una card de partido y luego en "Analizar con IA"
      </Typography>
    </Box>
  )

 return (
  <Box sx={{
    position: "fixed", bottom: 24, right: 24, zIndex: 1000,
    width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    borderRadius: 3, overflow: "hidden"
  }}>
    {/* Header */}
    <Box sx={{
      backgroundColor: "#1a1f2e", px: 2, py: 1.5,
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <SmartToyIcon sx={{ color: "#e65100", fontSize: 20 }} />
        <Typography variant="body2" fontWeight="bold" color="white">SmartScout IA</Typography>
        <Chip
          label={`${contexto.local?.nombreC} vs ${contexto.visitante?.nombreC}`}
          size="small"
          sx={{ backgroundColor: "#2a2f3e", color: "#aaa", fontSize: 10, maxWidth: 160 }}
        />
      </Box>
      <Box>
        <IconButton size="small" onClick={() => setMinimizado(!minimizado)} sx={{ color: "white" }}>
          <RemoveIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onCerrar} sx={{ color: "white" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>

    {/* Cuerpo */}
    {!minimizado && (
      <>
        <Paper sx={{ height: 380, overflowY: "auto", p: 2, borderRadius: 0, backgroundColor: "#f9f9f9" }}>
          {mensajes.map((m, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 2, flexDirection: m.rol === "usuario" ? "row-reverse" : "row" }}>
              <Avatar sx={{ backgroundColor: m.rol === "ia" ? "#e65100" : "#1a1f2e", width: 32, height: 32, flexShrink: 0 }}>
                {m.rol === "ia" ? <SmartToyIcon sx={{ fontSize: 18 }} /> : <PersonIcon sx={{ fontSize: 18 }} />}
              </Avatar>
              <Box sx={{
                maxWidth: "75%",
                backgroundColor: m.rol === "usuario" ? "#1a1f2e" : "white",
                color: m.rol === "usuario" ? "white" : "inherit",
                borderRadius: m.rol === "usuario" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                px: 2, py: 1.5,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                fontSize: 13, lineHeight: 1.6,
                "& p": { margin: 0 },
              }}>
                <ReactMarkdown>{m.texto}</ReactMarkdown>
              </Box>
            </Box>
          ))}
          {cargando && (
            <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
              <Avatar sx={{ backgroundColor: "#e65100", width: 32, height: 32 }}>
                <SmartToyIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ backgroundColor: "white", borderRadius: "16px 16px 16px 4px", px: 2, py: 1.5 }}>
                <CircularProgress size={16} sx={{ color: "#e65100" }} />
              </Box>
            </Box>
          )}
          <div ref={bottomRef} />
        </Paper>

        <Box sx={{ display: "flex", gap: 1, p: 1.5, backgroundColor: "white", borderTop: "1px solid #eee" }}>
          <TextField
            fullWidth multiline maxRows={3} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntá sobre el partido..."
            size="small"
            sx={{ backgroundColor: "white", borderRadius: 2 }}
          />
          <Button
            variant="contained" onClick={enviarMensaje}
            disabled={cargando || !input.trim()}
            sx={{ backgroundColor: "#e65100", "&:hover": { backgroundColor: "#bf360c" }, borderRadius: 2, minWidth: 48 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </>
    )}
  </Box>
)
}

export default ChatIA