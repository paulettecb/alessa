import { useState, useEffect } from 'react';
import { fetchDatabase, DATABASES } from './notionClient';

export function useFlores() {
  const [flores, setFlores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDatabase(DATABASES.FLORES);
        setFlores(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { flores, loading, error };
}

export function useIngredientes() {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDatabase(DATABASES.INGREDIENTES);
        setIngredientes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { ingredientes, loading, error };
}

export function useTamaños() {
  const [tamaños, setTamaños] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDatabase(DATABASES.TAMAÑOS);
        setTamaños(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { tamaños, loading, error };
}

export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDatabase(DATABASES.PRODUCTOS);
        setProductos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { productos, loading, error };
}

export function useCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDatabase(DATABASES.COMPRAS);
        setCompras(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { compras, loading, error };
}

export function useRecetas() {
  const [recetasFlores, setRecetasFlores] = useState([]);
  const [recetasIngredientes, setRecetasIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [rf, ri] = await Promise.all([
          fetchDatabase(DATABASES.RECETAS_FLORES),
          fetchDatabase(DATABASES.RECETAS_INGREDIENTES),
        ]);
        setRecetasFlores(rf);
        setRecetasIngredientes(ri);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { recetasFlores, recetasIngredientes, loading, error };
}

export function useAjustes() {
  const [ajustes, setAjustes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDatabase(DATABASES.AJUSTES);
        const ajustesObj = {};
        data.forEach(item => {
          ajustesObj[item.Parámetro] = item.Valor;
        });
        setAjustes(ajustesObj);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { ajustes, loading, error };
}
