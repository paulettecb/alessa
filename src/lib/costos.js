// Motor de costos de Alessa: costo real de cada producto según su receta,
// aplicando la merma de cada item, y el margen contra el precio de venta.

import { fetchDatabase, updatePage, DATABASES } from './notionClient';

// Devuelve los items de la receta de un producto con su costo calculado.
// Cada item: cantidad × costo unitario × (1 + merma%).
export function calcularReceta(producto, recetasFlores, recetasIngredientes, flores, ingredientes) {
  const items = [];

  for (const r of recetasFlores) {
    if (r.Producto !== producto.Nombre) continue;
    const flor = flores.find(f => f.id === r.Flor?.[0]);
    items.push(itemReceta(r, flor, 'flor'));
  }

  for (const r of recetasIngredientes) {
    if (r.Producto !== producto.Nombre) continue;
    const ing = ingredientes.find(i => i.id === r.Ingrediente?.[0]);
    items.push(itemReceta(r, ing, 'ingrediente'));
  }

  const costoTotal = items.reduce((sum, it) => sum + it.costo, 0);
  return { items, costoTotal };
}

function itemReceta(receta, articulo, tipo) {
  const cantidad = receta.Cantidad || 0;
  const costoUnitario = articulo?.['Costo unitario'] || 0;
  const mermaPct = receta['Merma %'] || 0;
  return {
    recetaId: receta.id,
    tipo,
    nombre: articulo?.Nombre || '(eliminado)',
    cantidad,
    unidad: receta.Unidad || 'Unidades',
    costoUnitario,
    mermaPct,
    sinCosto: !articulo || !articulo['Costo unitario'],
    costo: cantidad * costoUnitario * (1 + mermaPct / 100),
  };
}

// Margen % sobre el precio de venta. null si no se puede calcular.
export function calcularMargen(precioVenta, costo) {
  if (!precioVenta || precioVenta <= 0) return null;
  return ((precioVenta - costo) / precioVenta) * 100;
}

export function formatoMoneda(valor, simbolo = '$') {
  return `${simbolo}${(valor || 0).toFixed(2)}`;
}

// Recalcula "Costo total" y "Margen real" de todos los productos con receta y
// guarda en Notion los que quedaron viejos (p.ej. porque cambió el costo de
// una flor). Devuelve los nombres de los productos actualizados.
export async function sincronizarCostos() {
  const [productos, recetasFlores, recetasIngredientes, flores, ingredientes] = await Promise.all([
    fetchDatabase(DATABASES.PRODUCTOS),
    fetchDatabase(DATABASES.RECETAS_FLORES),
    fetchDatabase(DATABASES.RECETAS_INGREDIENTES),
    fetchDatabase(DATABASES.FLORES),
    fetchDatabase(DATABASES.INGREDIENTES),
  ]);

  const actualizados = [];
  for (const producto of productos) {
    const { items, costoTotal } = calcularReceta(producto, recetasFlores, recetasIngredientes, flores, ingredientes);
    if (items.length === 0) continue; // sin receta no hay nada que sincronizar
    const costo = Math.round(costoTotal * 100) / 100;
    const margen = calcularMargen(producto['Precio de venta'], costo);
    const margenGuardado = margen !== null ? Math.round(margen * 10) / 10 : 0;
    if (producto['Costo total'] === costo && producto['Margen real'] === margenGuardado) continue;
    await updatePage(producto.id, {
      'Costo total': { number: costo },
      'Margen real': { number: margenGuardado },
    });
    actualizados.push(producto.Nombre);
  }
  return actualizados;
}
