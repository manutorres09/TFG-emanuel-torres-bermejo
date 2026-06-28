# SmartScout IA

Plataforma web de scouting y analítica avanzada para básquetbol federado argentino, desarrollada para la Confederación Argentina de Básquetbol (CABB).

**Trabajo Final de Grado — Prototipado Tecnológico**  
Autor: Torres Bermejo, Emanuel  
Carrera: Licenciatura en Informática — Universidad Siglo 21

---

## Demo en línea

La aplicación está deployada y disponible públicamente. No requiere instalación ni registro.

**https://tfg-emanuel-torres-bermejo-7eax.vercel.app/**

---

## ¿Qué hace el sistema?

SmartScout IA permite a los cuerpos técnicos de clubes de básquetbol procesar las planillas estadísticas oficiales de la CABB en formato `.xlsx` y obtener:

- Boxscore completo con todas las estadísticas del partido
- Métricas avanzadas de eficiencia: eFG%, TS%, PPP y USG%
- Gráficos comparativos de rendimiento individual y colectivo
- Chat de análisis táctico con inteligencia artificial (Google Gemini)
- Historial de partidos procesados
- Plantel de jugadores agrupado por club y categoría

---

## Tecnologías

- **Frontend:** React + Vite + Material UI
- **Base de datos:** Supabase (PostgreSQL)
- **Ingesta de datos:** Python (openpyxl, supabase-py)
- **Inteligencia artificial:** Google Gemini API
- **Gráficos:** Recharts
- **Deploy:** Vercel

---

## Correr el proyecto localmente

Si querés correr el proyecto en tu propia computadora en lugar de usar la demo en línea, seguí estos pasos.

### Requisitos previos

- [Node.js](https://nodejs.org) v18 o superior
- [Python](https://python.org) v3.10 o superior
- Una cuenta en [Supabase](https://supabase.com) (gratuita)
- Una API Key de [Google AI Studio](https://aistudio.google.com) (gratuita)

### 1. Clonar el repositorio

```bash
git clone https://github.com/manutorres09/TFG-emanuel-torres-bermejo.git
cd TFG-emanuel-torres-bermejo
```

### 2. Instalar dependencias del frontend

```bash
npm install
```

### 3. Instalar dependencias de Python

```bash
pip install supabase openpyxl python-dotenv
```

### 4. Configurar variables de entorno

Creá un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
VITE_SUPABASE_URL=tu_project_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
VITE_GEMINI_API_KEY=tu_api_key_de_google_ai_studio
```

### 5. Crear las tablas en Supabase

En el SQL Editor de tu proyecto de Supabase, ejecutá este script:

```sql
create extension if not exists "uuid-ossp";

create table club (
  id uuid primary key default uuid_generate_v4(),
  "nombreC" varchar(100) not null,
  "ciudadC" varchar(100),
  "divisionC" varchar(50)
);

create table torneo (
  id uuid primary key default uuid_generate_v4(),
  "anio" varchar(10),
  "nombreTor" varchar(100) not null
);

create table jugador (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references club(id),
  "nombreJ" varchar(100) not null,
  "apellidoJ" varchar(100) not null,
  "numCamisetaJ" int
);

create table partido (
  id uuid primary key default uuid_generate_v4(),
  temporada_id uuid references torneo(id),
  equipo_local_id uuid references club(id),
  equipo_visitante_id uuid references club(id),
  fecha date,
  puntos_local int,
  puntos_visitante int
);

create table boxscore (
  id uuid primary key default uuid_generate_v4(),
  partido_id uuid references partido(id),
  jugador_id uuid references jugador(id),
  minutos int,
  puntos int,
  t2_intentados int,
  t2_convertidos int,
  t3_intentados int,
  t3_convertidos int,
  tl_intentados int,
  tl_convertidos int,
  reb_ofensivos int,
  reb_defensivos int,
  asistencias int,
  perdidas int,
  robos int,
  bloqueos int,
  faltas_cometidas int,
  faltas_recibidas int,
  valoracion int,
  mas_menos int
);

create table metricas_avanzadas (
  id uuid primary key default uuid_generate_v4(),
  boxscore_id uuid references boxscore(id) unique,
  efg_percentage decimal(5,2),
  ts_percentage decimal(5,2),
  puntos_por_posesion decimal(5,2),
  usage_percentage decimal(5,2)
);
```

### 6. Iniciar la aplicación

```bash
npm run dev
```

Abrí el navegador en `http://localhost:5173`

---

## Cargar un partido

El repositorio incluye un archivo de ejemplo en `scripts/estadisticaPartido_20264191.xlsx` para probar el procesamiento sin necesidad de contar con una planilla propia.

Para procesarlo ejecutá:

```bash
python scripts/procesar_partido.py "scripts/estadisticaPartido_20264191.xlsx"
```

El script lee la planilla, calcula las métricas avanzadas y carga todos los datos en Supabase automáticamente. Una vez completado, el partido aparece en la sección **Historial de Partidos** de la aplicación.

Para cargar tus propios archivos XLSX de la CABB, copiálos dentro de la carpeta `scripts/` y ejecutá el mismo comando con el nombre correspondiente.

> El script está diseñado exclusivamente para el formato oficial de planillas estadísticas de la CABB. No es compatible con otros formatos.

---

## Estructura del proyecto

```
TFG-emanuel-torres-bermejo/
├── src/
│   ├── components/
│   │   ├── GraficosPartido.jsx
│   │   └── Sidebar.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── ChatIA.jsx
│   │   ├── DetallePartido.jsx
│   │   ├── Inicio.jsx
│   │   ├── Jugadores.jsx
│   │   └── Partidos.jsx
│   └── App.jsx
├── scripts/
│   ├── procesar_partido.py
│   └── estadisticaPartido_20264191.xlsx
├── .gitignore
└── README.md
```

---

## Notas

- El archivo `.env` no está incluido en el repositorio por seguridad. Debés crearlo manualmente con tus propias credenciales siguiendo el paso 4.
- Los datos de la demo en línea ya están cargados en Supabase y son visibles sin ninguna configuración adicional.