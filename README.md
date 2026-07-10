# Alessa Velas App

**Alessa** — Sistema de gestión para velas artesanales en forma de arreglos florales.

## ¿Qué es?

Una aplicación web para gestionar:
- **Flores** — Tipos y variantes de flores preservadas
- **Ingredientes** — Cera, oasis, moldes, macetas, herramientas
- **Tamaños** — Pequeño, Mediano, Grande (expandible)
- **Productos** — Ramos con recetas exactas
- **Recetas** — Qué flores e ingredientes lleva cada ramo
- **Compras** — Registro de compras mayoristas
- **Costos & Márgenes** — Cálculos automáticos con merma 30%

## Diseño

Usa el **Alessa Design System** completo:
- Paleta: Crema, salvia/oliva, terracota, dorado
- Tipografía: Ovo (títulos), Josefin Sans (UI), IBM Plex Mono (cifras)
- 14 componentes React + tokens de diseño
- Tono: lujo, delicadeza, elegancia

## Tecnología

- **React 18** + **Vite**
- **Notion API** para sincronización de datos
- **Lucide Icons** para iconografía
- **CSS custom properties** (tokens de diseño)

## Primeros pasos

```bash
npm install
npm run dev
```

Abre http://localhost:4321 en tu navegador.

## Estructura

```
src/
  ├── components/      — Componentes del Alessa Design System
  ├── screens/         — Pantallas principales
  ├── styles/          — Tokens y estilos globales
  ├── lib/             — Utilitarios (Notion, cálculos)
  ├── App.jsx          — Componente raíz
  └── index.jsx        — Punto de entrada
```

## Conexión a Notion

Los datos viven en Notion. Ver `NOTION_CONFIG.md` para configurar el token.

---

**Velas que Florecen** 🌹
