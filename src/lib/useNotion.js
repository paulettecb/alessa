import { useState, useEffect, useCallback } from 'react';
import { fetchDatabase, DATABASES } from './notionClient';

// Hook base: carga una base de Notion y expone recargar() para refrescar
// los datos sin recargar toda la página.
function useDatabase(databaseId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const res = await fetchDatabase(databaseId);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [databaseId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { data, loading, error, recargar };
}

export function useFlores() {
  const { data: flores, loading, error, recargar } = useDatabase(DATABASES.FLORES);
  return { flores, loading, error, recargar };
}

export function useIngredientes() {
  const { data: ingredientes, loading, error, recargar } = useDatabase(DATABASES.INGREDIENTES);
  return { ingredientes, loading, error, recargar };
}

export function useProductos() {
  const { data: productos, loading, error, recargar } = useDatabase(DATABASES.PRODUCTOS);
  return { productos, loading, error, recargar };
}

export function useCompras() {
  const { data: compras, loading, error, recargar } = useDatabase(DATABASES.COMPRAS);
  return { compras, loading, error, recargar };
}

export function useRecetas() {
  const [recetasFlores, setRecetasFlores] = useState([]);
  const [recetasIngredientes, setRecetasIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const [rf, ri] = await Promise.all([
        fetchDatabase(DATABASES.RECETAS_FLORES),
        fetchDatabase(DATABASES.RECETAS_INGREDIENTES),
      ]);
      setRecetasFlores(rf);
      setRecetasIngredientes(ri);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { recetasFlores, recetasIngredientes, loading, error, recargar };
}

export function useAjustes() {
  const [ajustes, setAjustes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const data = await fetchDatabase(DATABASES.AJUSTES);
      const ajustesObj = {};
      data.forEach(item => {
        ajustesObj[item.Parámetro] = item.Valor;
      });
      setAjustes(ajustesObj);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { ajustes, loading, error, recargar };
}
