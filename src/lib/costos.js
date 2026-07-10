// Motor de costos de Alessa: costo real de cada producto según su receta,
// aplicando la merma de cada item, y el margen contra el precio de venta.

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
