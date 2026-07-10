const NOTION_TOKEN = import.meta.env.VITE_NOTION_TOKEN;
// Pasa por el proxy del dev server (vite.config.js) porque la API de Notion
// no acepta llamadas directas desde el navegador (CORS).
const NOTION_API_URL = '/notion-api/v1';

const headers = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

export async function fetchDatabase(databaseId) {
  try {
    const response = await fetch(`${NOTION_API_URL}/databases/${databaseId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        page_size: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
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
    const response = await fetch(`${NOTION_API_URL}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating page in Notion:', error);
    throw error;
  }
}

export async function updatePage(pageId, properties) {
  try {
    const response = await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
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

export const DATABASES = {
  FLORES: import.meta.env.VITE_NOTION_DB_FLORES,
  INGREDIENTES: import.meta.env.VITE_NOTION_DB_INGREDIENTES,
  TAMAÑOS: import.meta.env.VITE_NOTION_DB_TAMAÑOS,
  VARIANTES_FLORES: import.meta.env.VITE_NOTION_DB_VARIANTES_FLORES,
  SUBTIPOS_INGREDIENTES: import.meta.env.VITE_NOTION_DB_SUBTIPOS_INGREDIENTES,
  PRODUCTOS: import.meta.env.VITE_NOTION_DB_PRODUCTOS,
  RECETAS_FLORES: import.meta.env.VITE_NOTION_DB_RECETAS_FLORES,
  RECETAS_INGREDIENTES: import.meta.env.VITE_NOTION_DB_RECETAS_INGREDIENTES,
  COMPRAS: import.meta.env.VITE_NOTION_DB_COMPRAS,
  AJUSTES: import.meta.env.VITE_NOTION_DB_AJUSTES,
};
