import { Box, Typography, Button, Card, CardContent, Chip } from "@mui/material"
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import GroupIcon from "@mui/icons-material/Group"

function Inicio({ onCambiarSeccion }) {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={0.5}>
        ¡Bienvenido, Entrenador!
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Cargá planillas oficiales y analizá el rendimiento táctico de tu plantel.
      </Typography>

      {/* Zona de carga */}
      <Card sx={{
        border: "2px dashed #ccc",
        borderRadius: 3,
        backgroundColor: "#fafafa",
        mb: 4,
        boxShadow: "none"
      }}>
        <CardContent sx={{ textAlign: "center", py: 5 }}>
          <UploadFileIcon sx={{ fontSize: 48, color: "#bbb", mb: 1 }} />
          <Typography fontWeight="bold" fontSize={16} mb={0.5}>
            Arrastrá el archivo de boxscore oficial de la CABB
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Soportado únicamente formatos oficiales de planilla digital (.xlsx)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{
            backgroundColor: "#f0f0f0",
            px: 2, py: 1, borderRadius: 2, display: "inline-block"
          }}>
            Procesá el archivo con el script Python y luego verás el partido en Historial
          </Typography>
        </CardContent>
      </Card>

      {/* Accesos rápidos */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Accesos rápidos
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card
          onClick={() => onCambiarSeccion("Historial de Partidos")}
          sx={{ borderRadius: 3, cursor: "pointer", flex: 1, minWidth: 200,
            "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }
          }}
        >
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SportsBasketballIcon sx={{ color: "#e65100", fontSize: 32 }} />
            <Box>
              <Typography fontWeight="bold">Historial de Partidos</Typography>
              <Typography variant="caption" color="text.secondary">
                Ver todos los partidos procesados
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card
          onClick={() => onCambiarSeccion("Plantel y Jugadores")}
          sx={{ borderRadius: 3, cursor: "pointer", flex: 1, minWidth: 200,
            "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }
          }}
        >
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <GroupIcon sx={{ color: "#e65100", fontSize: 32 }} />
            <Box>
              <Typography fontWeight="bold">Plantel y Jugadores</Typography>
              <Typography variant="caption" color="text.secondary">
                Estadísticas individuales del plantel
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default Inicio