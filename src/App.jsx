import { useState } from "react"
import { Box } from "@mui/material"
import Sidebar from "./components/Sidebar"
import Inicio from "./pages/Inicio"
import Partidos from "./pages/Partidos"
import DetallePartido from "./pages/DetallePartido"
import Jugadores from "./pages/Jugadores"
import ChatIA from "./pages/ChatIA"

function App() {
  const [seccionActiva, setSeccionActiva] = useState("Inicio")
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null)
  const [contextoChat, setContextoChat] = useState(null)

  const handleVerPartido = (id) => {
    setPartidoSeleccionado(id)
    setSeccionActiva("DetallePartido")
  }

  const handleAbrirChat = (partido) => {
    setContextoChat(partido)
  }

  const renderSeccion = () => {
    switch (seccionActiva) {
      case "Inicio":
        return <Inicio onCambiarSeccion={setSeccionActiva} />
      case "Historial de Partidos":
        return <Partidos onVerPartido={handleVerPartido} />
      case "DetallePartido":
        return (
          <DetallePartido
            partidoId={partidoSeleccionado}
            onVolver={() => setSeccionActiva("Historial de Partidos")}
            onAbrirChat={handleAbrirChat}
          />
        )
      case "Plantel y Jugadores":
        return <Jugadores />
      default:
        return <Inicio onCambiarSeccion={setSeccionActiva} />
    }
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar seccionActiva={seccionActiva} onCambiarSeccion={setSeccionActiva} />
      <Box sx={{ flexGrow: 1, p: 4 }}>
        {renderSeccion()}
      </Box>
      {contextoChat && (
      <ChatIA
        contexto={contextoChat}
        onCerrar={() => setContextoChat(null)}
      />
    )}
    </Box>
  )
}

export default App