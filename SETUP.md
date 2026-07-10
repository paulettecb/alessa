# Setup — Alessa Velas App

## Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/paulettecb/alessa.git
cd alessa
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
   - Copiar `.env.example` a `.env.local`
   - Agregar el **Notion API Token** (ver más abajo)
   - Agregar los **Database IDs** de Notion (ver más abajo)

## Configurar Notion API

### 1. Crear Integración en Notion

1. Ve a https://www.notion.so/profile/integrations
2. Haz clic en "Create new integration"
3. Nómbrala: `Alessa Velas App`
4. Copia el **Internal Integration Secret** (empieza con `ntn_`)
5. Pega en `.env.local` → `VITE_NOTION_TOKEN`

### 2. Conectar Integración a Bases de Datos

En Notion:
1. Abre la página **Velas & Ramos**
2. Menú `···` → **Conexiones**
3. Agrega la integración `Alessa Velas App` a cada tabla:
   - Flores
   - Ingredientes
   - Tamaños
   - Variantes de Flores
   - Subtipos de Ingredientes
   - Productos
   - Recetas - Flores
   - Recetas - Ingredientes
   - Compras
   - Ajustes

### 3. Obtener Database IDs

Los IDs están en las URLs de Notion. Por ejemplo:

```
https://www.notion.so/workspace/Flores-abc123def456?v=collection%2Fxyz789...
                                                      ↑ Este ID va en VITE_NOTION_DB_FLORES
```

O más fácil: ve a cada tabla en Notion → haz clic en el botón de compartir → copia el enlace → el ID es la cadena de 32 caracteres después de `/` y antes de `?`.

## Ejecutar

### Desarrollo
```bash
npm run dev
```

Abre http://localhost:4321 en tu navegador.

### Producción
```bash
npm run build
npm run preview
```

## Estructura de Archivos

```
alessa-velas-app/
├── src/
│   ├── components/        — Componentes del DS (Button, Card, Input, etc.)
│   ├── lib/
│   │   ├── notionClient.js  — Cliente de Notion API
│   │   └── useNotion.js     — Hooks de React para Notion
│   ├── styles/
│   │   ├── tokens.css       — Variables de diseño (colores, tipografía, etc.)
│   │   └── global.css       — Estilos globales
│   ├── App.jsx              — Componente principal
│   └── index.jsx            — Punto de entrada
├── .env.local               — Variables de entorno (NO versionar)
├── .env.example             — Plantilla .env
├── index.html               — HTML de entrada
├── package.json             — Dependencias
└── vite.config.js           — Configuración de Vite
```

## Troubleshooting

### Error: "Notion API error"
- Verifica que el token en `.env.local` sea correcto
- Verifica que la integración esté conectada a las bases de datos en Notion

### No aparecen datos
- Abre la consola (F12) y busca errores
- Verifica que los Database IDs sean correctos en `.env.local`
- Verifica que hayas agregado flores/ingredientes en Notion

### Error 403 (Forbidden)
- La integración no tiene acceso a esa base de datos
- Ve a Notion → base de datos → menú `···` → **Conexiones** → agrega la integración

---

¿Problemas? Revisa la consola del navegador (F12) para ver los mensajes de error exactos.
