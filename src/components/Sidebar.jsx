import { Box, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Divider } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import HistoryIcon from "@mui/icons-material/History"
import PeopleIcon from "@mui/icons-material/People"
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball"

const secciones = [
  { nombre: "Inicio", icono: <HomeIcon /> },
  { nombre: "Historial de Partidos", icono: <HistoryIcon /> },
  { nombre: "Plantel y Jugadores", icono: <PeopleIcon /> },
]

function Sidebar({ seccionActiva, onCambiarSeccion }) {
  return (
    <Box sx={{
      width: 220,
      minHeight: "100vh",
      backgroundColor: "#1a1f2e",
      color: "white",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <SportsBasketballIcon sx={{ color: "#e65100" }} />
          <Typography variant="h6" fontWeight="bold" color="white">
            SmartScout IA
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "#e65100", letterSpacing: 1 }}>
          PLATAFORMA TÁCTICA
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "#2a2f3e" }} />

      <List sx={{ mt: 1 }}>
        {secciones.map((s) => (
          <ListItem key={s.nombre} disablePadding>
            <ListItemButton
              onClick={() => onCambiarSeccion(s.nombre)}
              sx={{
                px: 3,
                py: 1.5,
                backgroundColor: seccionActiva === s.nombre ? "#2a2f3e" : "transparent",
                borderLeft: seccionActiva === s.nombre ? "3px solid #e65100" : "3px solid transparent",
                "&:hover": { backgroundColor: "#2a2f3e" },
              }}
            >
              <ListItemIcon sx={{ color: seccionActiva === s.nombre ? "#e65100" : "#8a8f9e", minWidth: 36 }}>
                {s.icono}
              </ListItemIcon>
              <ListItemText
                primary={s.nombre}
                slotProps={{
                  primary: {
                    fontSize: 14,
                    color: seccionActiva === s.nombre ? "white" : "#8a8f9e",
                    fontWeight: seccionActiva === s.nombre ? 600 : 400,
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default Sidebar