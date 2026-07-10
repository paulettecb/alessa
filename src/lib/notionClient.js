// En local, el proxy de Vite (vite.config.js) reenvía /notion-api a
// api.notion.com; en Netlify lo hace la función netlify/functions/notion.mjs,
// que agrega el token guardado en el servidor. La API de Notion no acepta
// llamadas directas desde el navegador (CORS), por eso el puente.
const NOTION_TOKEN = import.meta.env.VITE_NOTION_TOKEN;
const NOTION_API_URL = '/notion-api/v1';

const PIN_KEY = 'alessa-pin';

function buildHeaders() {
  const headers = {
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
  // En local el token viaja desde .env.local; en Netlify no existe
  // (lo pone la función del servidor) y este header simplemente se omite.
  if (NOTION_TOKEN) {
    headers['Authorization'] = `Bearer ${NOTION_TOKEN}`;
  }
  const pin = localStorage.getItem(PIN_KEY);
  if (pin) {
    headers['x-alessa-pin'] = pin;
  }
  return headers;
}

// fetch con headers de Notion + manejo del PIN del sitio (si el puente de
// Netlify tiene ALESSA_PIN configurado, lo pide una vez y lo recuerda).
export async function notionFetch(path, options = {}) {
  const response = await fetch(`${NOTION_API_URL}${path}`, {
    ...options,
    headers: { ...buildHeaders(), ...(options.headers || {}) },
  });

  if (response.status === 401) {
    const data = await response.clone().json().catch(() => ({}));
    if (data.code === 'need_pin') {
      const pin = window.prompt('Escribe el PIN de Alessa:');
      if (pin && pin.trim()) {
        localStorage.setItem(PIN_KEY, pin.trim());
        return notionFetch(path, options);
      }
      localStorage.removeItem(PIN_KEY);
      throw new Error('PIN requerido');
    }
  }

  return response;
}

// Extrae el mensaje real de un error de la API (el statusText de las
// respuestas de Netlify llega vacío, así que hay que leer el cuerpo).
export async function notionErrorMessage(response) {
  const data = await response.clone().json().catch(() => ({}));
  return data.message || data.code || response.statusText || `HTTP ${response.status}`;
}

export async function fetchDatabase(databaseId) {
  try {
    const response = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        page_size: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${await notionErrorMessage(response)}`);
    }

    const data = await response.json();
    return data.results.map(page => parsePageProperties(page));
  } catch (error) {
    console.error('Error fetching from Notion:', error);
    return [];
  }
}

export async function createPage(databaseId, properties) {
  try {
    const response = await notionFetch('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${await notionErrorMessage(response)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating page in Notion:', error);
    throw error;
  }
}

export async function updatePage(pageId, properties) {
  try {
    const response = await notionFetch(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${await notionErrorMessage(response)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating page in Notion:', error);
    throw error;
  }
}

function parsePageProperties(page) {
  const properties = {};

  for (const [key, prop] of Object.entries(page.properties)) {
    properties[key] = extractPropertyValue(prop);
  }

  return {
    id: page.id,
    ...properties,
  };
}

function extractPropertyValue(prop) {
  const type = prop.type;

  switch (type) {
    case 'title':
      return prop.title?.[0]?.plain_text || '';
    case 'rich_text':
      return prop.rich_text?.[0]?.plain_text || '';
    case 'text':
      return prop.rich_text?.[0]?.plain_text || '';
    case 'checkbox':
      return prop.checkbox || false;
    case 'select':
      return prop.select?.name || '';
    case 'multi_select':
      return prop.multi_select?.map(s => s.name) || [];
    case 'number':
      return prop.number || 0;
    case 'date':
      return prop.date?.start || '';
    case 'relation':
      return prop.relation?.map(r => r.id) || [];
    case 'formula':
      return prop.formula?.string || '';
    default:
      return null;
  }
}

// IDs de las bases en la página "Velas & Ramos" de Notion. No son secretos
// (sin el token no sirven), así que van como valores por defecto y .env.local
// solo puede sobreescribirlos si algún día cambian.
export const DATABASES = {
  FLORES: import.meta.env.VITE_NOTION_DB_FLORES || '36e4bb06-2d1b-4b94-891a-ae79ad802828',
  INGREDIENTES: import.meta.env.VITE_NOTION_DB_INGREDIENTES || 'b5ff8b54-cf24-4f0a-af22-528b0a06845f',
  TAMAÑOS: import.meta.env.VITE_NOTION_DB_TAMAÑOS || 'c6559f63-6d89-4597-8662-801f0d50af1c',
  VARIANTES_FLORES: import.meta.env.VITE_NOTION_DB_VARIANTES_FLORES || '95eeaf05-caef-489b-b6e9-ea77d5256966',
  SUBTIPOS_INGREDIENTES: import.meta.env.VITE_NOTION_DB_SUBTIPOS_INGREDIENTES || 'c5c2b64f-368e-4974-8ab3-b835cc8b0619',
  PRODUCTOS: import.meta.env.VITE_NOTION_DB_PRODUCTOS || 'b238adfa-a5cf-4591-a9e8-d9383f3df54b',
  RECETAS_FLORES: import.meta.env.VITE_NOTION_DB_RECETAS_FLORES || 'f12ad21c-efb3-4abc-8b6b-e4acdd7d8688',
  RECETAS_INGREDIENTES: import.meta.env.VITE_NOTION_DB_RECETAS_INGREDIENTES || 'f7035dee-4fdc-4b38-9386-999e6a093bee',
  COMPRAS: import.meta.env.VITE_NOTION_DB_COMPRAS || '6e432355-8582-4bff-9f87-4e495d2dcff6',
  AJUSTES: import.meta.env.VITE_NOTION_DB_AJUSTES || '96eaffeb-8d2d-46dc-9bfb-e8d9ccd27464',
};
