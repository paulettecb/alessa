import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { Flower, Package, Leaf, Flame, ShoppingCart, BarChart3, Settings, Menu, X, Trash2, Edit2, DollarSign, Printer, TrendingUp } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Dialog } from './components/Dialog';
import { FormField } from './components/FormField';
import { saludoDelDia } from './components/Greeting';
import { ToastProvider, useToast } from './components/Toast';
import { useFlores, useIngredientes, useProductos, useCompras, useAjustes, useRecetas } from './lib/useNotion';
import { createPage, updatePage, archivePage, notionFetch, fetchDatabase, DATABASES } from './lib/notionClient';
import { calcularReceta, calcularMargen, formatoMoneda, sincronizarCostos } from './lib/costos';
import './App.css';

const esMovil = () => window.innerWidth <= 768;

// Ajustes compartidos por toda la app (moneda, merma, alertas...): se cargan
// una sola vez en App y las pantallas los leen del contexto.
const AjustesContext = createContext({ ajustes: {}, loading: true, recargar: () => {} });

function useAjustesGlobal() {
  const { ajustes, loading, recargar } = useContext(AjustesContext);
  const num = (valor, porDefecto) => {
    const n = parseFloat(valor);
    return Number.isFinite(n) ? n : porDefecto;
  };
  return {
    ajustes,
    loading,
    recargar,
    moneda: ajustes['Moneda'] || '$',
    mermaDefault: num(ajustes['Merma %'], 30),
    alertaExistencias: num(ajustes['Alerta de existencias'], 5),
  };
}

function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(() => !esMovil());
  const ajustesGlobal = useAjustes();

  const handleNav = (id) => {
    setActiveTab(id);
    if (esMovil()) setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: BarChart3 },
    { id: 'flores', label: 'Flores', icon: Flower },
    { id: 'ingredientes', label: 'Ingredientes', icon: Leaf },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
    { id: 'recetas', label: 'Recetas', icon: Flame },
    { id: 'lista-precios', label: 'Lista de Precios', icon: DollarSign },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <ToastProvider>
    <AjustesContext.Provider value={ajustesGlobal}>
    <div className="app">
      {/* Barra superior (solo móvil) */}
      <header className="mobile-topbar">
        <button className="topbar-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <span className="topbar-title">ALESSA</span>
        <span className="topbar-flor">🌸</span>
      </header>

      {/* Fondo oscuro al abrir el menú en móvil */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar__header">
          <div className="sidebar__marca">
            <span className="sidebar__wordmark">ALESSA</span>
            <span className="sidebar__script">Velas que Florecen</span>
          </div>
          <button
            className="sidebar__toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar__estado">
          <span
            className={`estado-dot ${
              ajustesGlobal.error ? 'estado-dot--error' : ajustesGlobal.loading ? 'estado-dot--cargando' : 'estado-dot--ok'
            }`}
          />
          <span>
            {ajustesGlobal.error
              ? 'Sin conexión con Notion'
              : ajustesGlobal.loading
                ? 'Conectando…'
                : 'Sincronizado con Notion'}
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'inicio' && <PantallaInicio />}
        {activeTab === 'flores' && <PantallaFlores />}
        {activeTab === 'ingredientes' && <PantallaIngredientes />}
        {activeTab === 'productos' && <PantallaProductos />}
        {activeTab === 'compras' && <PantallaCompras />}
        {activeTab === 'recetas' && <PantallaRecetas />}
        {activeTab === 'lista-precios' && <PantallaListaPrecios />}
        {activeTab === 'ajustes' && <PantallaAjustes />}
      </main>
    </div>
    </AjustesContext.Provider>
    </ToastProvider>
  );
}

function PantallaInicio() {
  const { productos } = useProductos();
  const { flores } = useFlores();
  const { ingredientes } = useIngredientes();
  const { alertaExistencias } = useAjustesGlobal();

  const activos = productos.filter(p => p.Activo);
  const floresActivas = flores.filter(f => f.Activa).length;

  // Artículos con existencias registradas que ya están en el umbral de alerta
  const porAcabarse = [
    ...flores.filter(f => f.Activa !== false),
    ...ingredientes.filter(i => i.Activo !== false),
  ].filter(a => a.Existencias !== null && a.Existencias <= alertaExistencias);

  // Margen promedio de los productos que ya tienen costo y precio
  const conCosto = activos.filter(p => (p['Costo total'] || 0) > 0 && (p['Precio de venta'] || 0) > 0);
  const margenPromedio = conCosto.length
    ? conCosto.reduce((s, p) => s + calcularMargen(p['Precio de venta'], p['Costo total']), 0) / conCosto.length
    : null;

  const sinCosto = activos.length - conCosto.length;

  return (
    <div className="screen">
      <div className="screen__header">
        <div>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>{saludoDelDia()}, Ale</h2>
          <p className="subtitle">Aquí está el pulso de tus velas que florecen.</p>
        </div>
      </div>

      <div className="grid stats-grid gap-lg">
        <Card className="stat-card">
          <div className="stat-label"><span>Productos activos</span><Package size={15} /></div>
          <div className="stat-value">{activos.length}</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-label"><span>Flores en catálogo</span><Flower size={15} /></div>
          <div className="stat-value">{floresActivas}</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-label"><span>Ingredientes</span><Leaf size={15} /></div>
          <div className="stat-value">{ingredientes.length}</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-label"><span>Margen promedio</span><TrendingUp size={15} /></div>
          <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>
            {margenPromedio !== null ? `${margenPromedio.toFixed(0)}%` : '—'}
          </div>
        </Card>
      </div>

      <Card className="mt-xl">
        <h3>Próximas Acciones</h3>
        {porAcabarse.length > 0 && (
          <p className="text-secondary mt-md">
            🧺 Se está acabando: <strong>{porAcabarse.map(a => `${a.Nombre} (${a.Existencias})`).join(', ')}</strong>.
            Al registrar la compra de reposición, las existencias se suman solas.
          </p>
        )}
        {margenPromedio === null ? (
          <p className="text-secondary mt-md">
            🌸 Para ver tus márgenes: ponle <strong>costo unitario</strong> a tus flores e ingredientes,
            arma las <strong>recetas</strong> de cada producto, y el costo se calcula solo.
          </p>
        ) : sinCosto > 0 ? (
          <p className="text-secondary mt-md">
            📋 {sinCosto} {sinCosto === 1 ? 'producto activo aún no tiene' : 'productos activos aún no tienen'} receta con costo.
            Ármalas en la pantalla de Recetas para completar tus márgenes.
          </p>
        ) : (
          <p className="text-secondary mt-md">
            ✅ Todos tus productos tienen costo calculado. Los datos se sincronizan con Notion automáticamente.
          </p>
        )}
      </Card>
    </div>
  );
}

function PantallaFlores() {
  const { flores, loading, error, recargar } = useFlores();
  const { moneda } = useAjustesGlobal();
  const avisar = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlor, setEditingFlor] = useState(null);
  const [formData, setFormData] = useState({ Nombre: '', Descripción: '', 'Costo unitario': 0, Existencias: '', Activa: true });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({ Nombre: '', Descripción: '', 'Costo unitario': 0, Existencias: '', Activa: true });
    setEditingFlor(null);
  }, []);

  const handleOpenDialog = useCallback((flor = null) => {
    if (flor) {
      setEditingFlor(flor);
      setFormData({
        Nombre: flor.Nombre || '',
        Descripción: flor.Descripción || '',
        'Costo unitario': flor['Costo unitario'] || 0,
        Existencias: flor.Existencias ?? '',
        Activa: flor.Activa !== false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    if (!formData.Nombre.trim()) {
      avisar('El nombre es requerido', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const costoNuevo = parseFloat(formData['Costo unitario']) || 0;
      const props = {
        Nombre: { title: [{ text: { content: formData.Nombre } }] },
        Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
        'Costo unitario': { number: costoNuevo },
        Existencias: { number: formData.Existencias === '' ? null : parseFloat(formData.Existencias) || 0 },
        Activa: { checkbox: formData.Activa },
      };
      if (editingFlor) {
        await updatePage(editingFlor.id, props);
      } else {
        await createPage(DATABASES.FLORES, props);
      }
      // Si cambió el costo, los productos que usan esta flor quedan viejos
      if (editingFlor && (editingFlor['Costo unitario'] || 0) !== costoNuevo) {
        await sincronizarCostos();
      }
      await recargar();
      handleCloseDialog();
      avisar(editingFlor ? 'Flor actualizada' : 'Flor guardada');
    } catch (error) {
      console.error('Error guardando flor:', error);
      avisar('No se pudo guardar la flor', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingFlor, handleCloseDialog, recargar, avisar]);

  const handleDelete = useCallback(async (flor) => {
    setDeletingId(flor.id);
    try {
      // Avisar si la flor está en recetas: esos items quedarían sin costo
      const recetas = await fetchDatabase(DATABASES.RECETAS_FLORES);
      const usos = recetas.filter(r => r.Flor?.[0] === flor.id).length;
      const aviso = usos > 0
        ? `\n\nOjo: se usa en ${usos} ${usos === 1 ? 'receta' : 'recetas'}; esos items quedarán sin costo.`
        : '';
      if (!window.confirm(`¿Borrar "${flor.Nombre}"? Se puede recuperar desde la papelera de Notion.${aviso}`)) return;
      await archivePage(flor.id);
      if (usos > 0) await sincronizarCostos();
      await recargar();
      avisar('Flor borrada');
    } catch (error) {
      console.error('Error borrando flor:', error);
      avisar('No se pudo borrar la flor', 'error');
    } finally {
      setDeletingId(null);
    }
  }, [recargar, avisar]);

  if (loading) {
    return (
      <div className="screen">
        <div className="screen__header">
          <h2>Flores</h2>
          <Button>+ Agregar Flor</Button>
        </div>
        <Card>
          <p className="text-tertiary">Cargando flores...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Flores ({flores.length})</h2>
        <Button onClick={() => handleOpenDialog()}>+ Agregar Flor</Button>
      </div>

      {flores.length === 0 ? (
        <Card>
          <p className="text-tertiary">
            {error ? `⚠️ No se pudieron cargar los datos: ${error}` : 'No hay flores aún. Crea una nueva flor para comenzar.'}
          </p>
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Costo Unitario</th>
                <th>Existencias</th>
                <th>Estado</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {flores.map(flor => (
                <tr key={flor.id}>
                  <td>{flor.Nombre}</td>
                  <td>{flor.Descripción}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {flor['Costo unitario'] ? formatoMoneda(flor['Costo unitario'], moneda) : <span className="text-tertiary">sin costo</span>}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {flor.Existencias !== null ? flor.Existencias : <span className="text-tertiary">—</span>}
                  </td>
                  <td>{flor.Activa ? '✓ Activa' : '✗ Inactiva'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action-btn"
                        onClick={() => handleOpenDialog(flor)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="table-action-btn delete"
                        onClick={() => handleDelete(flor)}
                        disabled={deletingId !== null}
                        title="Borrar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog isOpen={isDialogOpen} onClose={handleCloseDialog} title={editingFlor ? 'Editar Flor' : 'Nueva Flor'}>
        <FormField
          label="Nombre"
          value={formData.Nombre}
          onChange={val => setFormData({ ...formData, Nombre: val })}
          placeholder="ej: Rosa, Lisianto, Peonía..."
          required
        />
        <FormField
          label="Descripción"
          type="textarea"
          value={formData.Descripción}
          onChange={val => setFormData({ ...formData, Descripción: val })}
          placeholder="Descripción de la flor..."
        />
        <FormField
          label={`Costo Unitario (${moneda} por unidad)`}
          type="number"
          value={formData['Costo unitario']}
          onChange={val => setFormData({ ...formData, 'Costo unitario': val })}
          placeholder="ej: 15.50"
        />
        <FormField
          label="Existencias (déjalo vacío si no las llevas)"
          type="number"
          value={formData.Existencias}
          onChange={val => setFormData({ ...formData, Existencias: val })}
          placeholder="ej: 50"
        />
        <FormField
          label="Activa"
          type="checkbox"
          value={formData.Activa}
          onChange={val => setFormData({ ...formData, Activa: val })}
        />

        <div className="dialog-actions">
          <Button variant="secondary" onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : editingFlor ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function PantallaIngredientes() {
  const { ingredientes, loading, error, recargar } = useIngredientes();
  const { moneda } = useAjustesGlobal();
  const avisar = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  const [formData, setFormData] = useState({ Nombre: '', Tipo: '', Descripción: '', 'Costo unitario': 0, Existencias: '', Activo: true });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const tiposIngredientes = ['Cera', 'Oasis', 'Molde', 'Maceta', 'Herramienta', 'Otro'];

  const resetForm = useCallback(() => {
    setFormData({ Nombre: '', Tipo: '', Descripción: '', 'Costo unitario': 0, Existencias: '', Activo: true });
    setEditingIng(null);
  }, []);

  const handleOpenDialog = useCallback((ing = null) => {
    if (ing) {
      setEditingIng(ing);
      setFormData({
        Nombre: ing.Nombre || '',
        Tipo: ing.Tipo || '',
        Descripción: ing.Descripción || '',
        'Costo unitario': ing['Costo unitario'] || 0,
        Existencias: ing.Existencias ?? '',
        Activo: ing.Activo !== false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    if (!formData.Nombre.trim()) {
      avisar('El nombre es requerido', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const costoNuevo = parseFloat(formData['Costo unitario']) || 0;
      const props = {
        Nombre: { title: [{ text: { content: formData.Nombre } }] },
        Tipo: { select: { name: formData.Tipo } },
        Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
        'Costo unitario': { number: costoNuevo },
        Existencias: { number: formData.Existencias === '' ? null : parseFloat(formData.Existencias) || 0 },
        Activo: { checkbox: formData.Activo },
      };
      if (editingIng) {
        await updatePage(editingIng.id, props);
      } else {
        await createPage(DATABASES.INGREDIENTES, props);
      }
      // Si cambió el costo, los productos que usan este ingrediente quedan viejos
      if (editingIng && (editingIng['Costo unitario'] || 0) !== costoNuevo) {
        await sincronizarCostos();
      }
      await recargar();
      handleCloseDialog();
      avisar(editingIng ? 'Ingrediente actualizado' : 'Ingrediente guardado');
    } catch (error) {
      console.error('Error guardando ingrediente:', error);
      avisar('No se pudo guardar el ingrediente', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingIng, handleCloseDialog, recargar, avisar]);

  const handleDelete = useCallback(async (ing) => {
    setDeletingId(ing.id);
    try {
      // Avisar si el ingrediente está en recetas: esos items quedarían sin costo
      const recetas = await fetchDatabase(DATABASES.RECETAS_INGREDIENTES);
      const usos = recetas.filter(r => r.Ingrediente?.[0] === ing.id).length;
      const aviso = usos > 0
        ? `\n\nOjo: se usa en ${usos} ${usos === 1 ? 'receta' : 'recetas'}; esos items quedarán sin costo.`
        : '';
      if (!window.confirm(`¿Borrar "${ing.Nombre}"? Se puede recuperar desde la papelera de Notion.${aviso}`)) return;
      await archivePage(ing.id);
      if (usos > 0) await sincronizarCostos();
      await recargar();
      avisar('Ingrediente borrado');
    } catch (error) {
      console.error('Error borrando ingrediente:', error);
      avisar('No se pudo borrar el ingrediente', 'error');
    } finally {
      setDeletingId(null);
    }
  }, [recargar, avisar]);

  if (loading) {
    return (
      <div className="screen">
        <div className="screen__header">
          <h2>Ingredientes</h2>
          <Button>+ Agregar Ingrediente</Button>
        </div>
        <Card>
          <p className="text-tertiary">Cargando ingredientes...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Ingredientes ({ingredientes.length})</h2>
        <Button onClick={() => handleOpenDialog()}>+ Agregar Ingrediente</Button>
      </div>
      {ingredientes.length === 0 ? (
        <Card>
          <p className="text-tertiary">
            {error ? `⚠️ No se pudieron cargar los datos: ${error}` : 'No hay ingredientes aún. Crea uno nuevo para comenzar.'}
          </p>
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Costo Unitario</th>
                <th>Existencias</th>
                <th>Estado</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map(ing => (
                <tr key={ing.id}>
                  <td>{ing.Nombre}</td>
                  <td>{ing.Tipo}</td>
                  <td>{ing.Descripción}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {ing['Costo unitario'] ? formatoMoneda(ing['Costo unitario'], moneda) : <span className="text-tertiary">sin costo</span>}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {ing.Existencias !== null ? ing.Existencias : <span className="text-tertiary">—</span>}
                  </td>
                  <td>{ing.Activo ? '✓ Activo' : '✗ Inactivo'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action-btn"
                        onClick={() => handleOpenDialog(ing)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="table-action-btn delete"
                        onClick={() => handleDelete(ing)}
                        disabled={deletingId !== null}
                        title="Borrar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog isOpen={isDialogOpen} onClose={handleCloseDialog} title={editingIng ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}>
        <FormField
          label="Nombre"
          value={formData.Nombre}
          onChange={val => setFormData({ ...formData, Nombre: val })}
          placeholder="ej: Cera blanca, Oasis, Molde pequeño..."
          required
        />
        <FormField
          label="Tipo"
          type="select"
          value={formData.Tipo}
          onChange={val => setFormData({ ...formData, Tipo: val })}
          options={tiposIngredientes}
          required
        />
        <FormField
          label="Descripción"
          type="textarea"
          value={formData.Descripción}
          onChange={val => setFormData({ ...formData, Descripción: val })}
          placeholder="Descripción del ingrediente..."
        />
        <FormField
          label={`Costo Unitario (${moneda} por unidad/gramo/ml)`}
          type="number"
          value={formData['Costo unitario']}
          onChange={val => setFormData({ ...formData, 'Costo unitario': val })}
          placeholder="ej: 8.00"
        />
        <FormField
          label="Existencias (déjalo vacío si no las llevas)"
          type="number"
          value={formData.Existencias}
          onChange={val => setFormData({ ...formData, Existencias: val })}
          placeholder="ej: 20"
        />
        <FormField
          label="Activo"
          type="checkbox"
          value={formData.Activo}
          onChange={val => setFormData({ ...formData, Activo: val })}
        />

        <div className="dialog-actions">
          <Button variant="secondary" onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : editingIng ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function PantallaProductos() {
  const { productos, loading, error, recargar } = useProductos();
  const { moneda } = useAjustesGlobal();
  const avisar = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [formData, setFormData] = useState({
    Nombre: '',
    SKU: '',
    Descripción: '',
    'Precio de venta': 0,
    'Descuento por volumen': 0,
    Activo: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      Nombre: '',
      SKU: '',
      Descripción: '',
      'Precio de venta': 0,
      'Descuento por volumen': 0,
      Activo: true,
    });
    setEditingProd(null);
  }, []);

  const handleOpenDialog = useCallback((prod = null) => {
    if (prod) {
      setEditingProd(prod);
      setFormData({
        Nombre: prod.Nombre || '',
        SKU: prod.SKU || '',
        Descripción: prod.Descripción || '',
        'Precio de venta': prod['Precio de venta'] || 0,
        'Descuento por volumen': prod['Descuento por volumen'] || 0,
        Activo: prod.Activo !== false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    const nombre = formData.Nombre.trim();
    if (!nombre) {
      avisar('El nombre es requerido', 'error');
      return;
    }
    // Las recetas se enlazan al producto por nombre: debe ser único
    if (productos.some(p => p.Nombre === nombre && p.id !== editingProd?.id)) {
      avisar(`Ya existe un producto llamado "${nombre}" — usa un nombre distinto`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProd) {
        const precio = parseFloat(formData['Precio de venta']) || 0;
        const props = {
          Nombre: { title: [{ text: { content: formData.Nombre } }] },
          SKU: { rich_text: [{ text: { content: formData.SKU } }] },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          'Precio de venta': { number: precio },
          'Descuento por volumen': { number: parseFloat(formData['Descuento por volumen']) || 0 },
          Activo: { checkbox: formData.Activo },
        };
        // El margen guardado depende del precio: recalcularlo si ya hay costo
        if ((editingProd['Costo total'] || 0) > 0) {
          const margen = calcularMargen(precio, editingProd['Costo total']);
          props['Margen real'] = { number: margen !== null ? Math.round(margen * 10) / 10 : 0 };
        }
        await updatePage(editingProd.id, props);
      } else {
        await createPage(DATABASES.PRODUCTOS, {
          Nombre: { title: [{ text: { content: formData.Nombre } }] },
          SKU: { rich_text: [{ text: { content: formData.SKU } }] },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          'Precio de venta': { number: parseFloat(formData['Precio de venta']) || 0 },
          'Descuento por volumen': { number: parseFloat(formData['Descuento por volumen']) || 0 },
          Activo: { checkbox: formData.Activo },
        });
      }
      await recargar();
      handleCloseDialog();
      avisar(editingProd ? 'Producto actualizado' : 'Producto guardado');
    } catch (error) {
      console.error('Error guardando producto:', error);
      avisar('No se pudo guardar el producto', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingProd, productos, handleCloseDialog, recargar, avisar]);

  const handleDelete = useCallback(async (prod) => {
    if (!window.confirm(`¿Borrar "${prod.Nombre}"? También se quita su receta. Todo se puede recuperar desde la papelera de Notion.`)) return;
    setDeletingId(prod.id);
    try {
      // Primero la receta y al final el producto: si algo falla a medias, el
      // producto sigue visible y se puede reintentar. La receta se enlaza por
      // nombre, así que solo se limpia si este es el único producto con ese
      // nombre (homónimos la comparten).
      const homonimos = productos.filter(p => p.Nombre === prod.Nombre).length;
      if (homonimos === 1) {
        const [rf, ri] = await Promise.all([
          fetchDatabase(DATABASES.RECETAS_FLORES),
          fetchDatabase(DATABASES.RECETAS_INGREDIENTES),
        ]);
        const itemsReceta = [...rf, ...ri].filter(r => r.Producto === prod.Nombre);
        await Promise.all(itemsReceta.map(r => archivePage(r.id)));
      }
      await archivePage(prod.id);
      await recargar();
      avisar('Producto borrado');
    } catch (error) {
      console.error('Error borrando producto:', error);
      avisar('No se pudo borrar el producto', 'error');
    } finally {
      setDeletingId(null);
    }
  }, [recargar, productos, avisar]);

  if (loading) {
    return (
      <div className="screen">
        <div className="screen__header">
          <h2>Productos</h2>
          <Button>+ Agregar Producto</Button>
        </div>
        <Card>
          <p className="text-tertiary">Cargando productos...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Productos ({productos.length})</h2>
        <Button onClick={() => handleOpenDialog()}>+ Agregar Producto</Button>
      </div>
      {productos.length === 0 ? (
        <Card>
          <p className="text-tertiary">
            {error ? `⚠️ No se pudieron cargar los datos: ${error}` : 'No hay productos aún. Crea uno nuevo para comenzar.'}
          </p>
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Precio de Venta</th>
                <th>Costo</th>
                <th>Margen</th>
                <th>Estado</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(prod => {
                const costo = prod['Costo total'] || 0;
                const margen = calcularMargen(prod['Precio de venta'], costo);
                return (
                <tr key={prod.id}>
                  <td>{prod.Nombre}</td>
                  <td>{prod.SKU}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{formatoMoneda(prod['Precio de venta'], moneda)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {costo > 0 ? formatoMoneda(costo, moneda) : <span className="text-tertiary">sin receta</span>}
                  </td>
                  <td>
                    {costo > 0 && margen !== null ? <MargenChip margen={margen} /> : '—'}
                  </td>
                  <td>{prod.Activo ? '✓ Activo' : '✗ Inactivo'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action-btn"
                        onClick={() => handleOpenDialog(prod)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="table-action-btn delete"
                        onClick={() => handleDelete(prod)}
                        disabled={deletingId !== null}
                        title="Borrar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog isOpen={isDialogOpen} onClose={handleCloseDialog} title={editingProd ? 'Editar Producto' : 'Nuevo Producto'}>
        <FormField
          label="Nombre (un producto por tamaño)"
          value={formData.Nombre}
          onChange={val => setFormData({ ...formData, Nombre: val })}
          placeholder="ej: Ramo Rosa Chico, Ramo Rosa Grande..."
          required
        />
        <FormField
          label="SKU"
          value={formData.SKU}
          onChange={val => setFormData({ ...formData, SKU: val })}
          placeholder="ej: RAMO_ROSA_MED_001"
        />
        <FormField
          label="Descripción"
          type="textarea"
          value={formData.Descripción}
          onChange={val => setFormData({ ...formData, Descripción: val })}
          placeholder="Descripción del producto..."
        />
        <FormField
          label="Precio de Venta"
          type="number"
          value={formData['Precio de venta']}
          onChange={val => setFormData({ ...formData, 'Precio de venta': val })}
          placeholder="0.00"
          required
        />
        <FormField
          label="Descuento por Volumen (%)"
          type="number"
          value={formData['Descuento por volumen']}
          onChange={val => setFormData({ ...formData, 'Descuento por volumen': val })}
          placeholder="ej: 10 (para -10%)"
        />
        <FormField
          label="Activo"
          type="checkbox"
          value={formData.Activo}
          onChange={val => setFormData({ ...formData, Activo: val })}
        />

        <div className="dialog-actions">
          <Button variant="secondary" onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : editingProd ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function PantallaCompras() {
  const { compras, loading, error, recargar } = useCompras();
  const { flores, recargar: recargarFlores } = useFlores();
  const { ingredientes, recargar: recargarIngredientes } = useIngredientes();
  const { moneda } = useAjustesGlobal();
  const avisar = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);
  const [formData, setFormData] = useState({
    Fecha: new Date().toISOString().split('T')[0],
    Proveedor: '',
    Tipo: '',
    Articulo: '',
    Descripción: '',
    Cantidad: 0,
    'Precio unitario': 0,
    Total: 0,
    Notas: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const tiposCompras = ['Flor', 'Ingrediente'];

  // Catálogo según el tipo elegido, para vincular la compra
  const catalogo = formData.Tipo === 'Flor' ? flores : formData.Tipo === 'Ingrediente' ? ingredientes : [];
  const articuloDe = useCallback((compra) => {
    const idFlor = compra.Flor?.[0];
    const idIng = compra.Ingrediente?.[0];
    if (idFlor) return flores.find(f => f.id === idFlor) || null;
    if (idIng) return ingredientes.find(i => i.id === idIng) || null;
    return null;
  }, [flores, ingredientes]);

  const resetForm = useCallback(() => {
    setFormData({
      Fecha: new Date().toISOString().split('T')[0],
      Proveedor: '',
      Tipo: '',
      Articulo: '',
      Descripción: '',
      Cantidad: 0,
      'Precio unitario': 0,
      Total: 0,
      Notas: '',
    });
    setEditingCompra(null);
  }, []);

  const handleOpenDialog = useCallback((compra = null) => {
    if (compra) {
      setEditingCompra(compra);
      setFormData({
        Fecha: compra.Fecha || new Date().toISOString().split('T')[0],
        Proveedor: compra.Proveedor || '',
        Tipo: compra.Tipo || '',
        Articulo: compra.Flor?.[0] || compra.Ingrediente?.[0] || '',
        Descripción: compra.Descripción || '',
        Cantidad: compra.Cantidad || 0,
        'Precio unitario': compra['Precio unitario'] || 0,
        Total: compra.Total || 0,
        Notas: compra.Notas || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const calcularTotal = () => {
    const cantidad = parseFloat(formData.Cantidad) || 0;
    const precio = parseFloat(formData['Precio unitario']) || 0;
    return (cantidad * precio).toFixed(2);
  };

  const handleSave = useCallback(async () => {
    if (!formData.Fecha || !formData.Proveedor.trim()) {
      avisar('Fecha y proveedor son requeridos', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const total = parseFloat(calcularTotal());
      const props = {
        Name: { title: [{ text: { content: formData.Fecha } }] },
        Fecha: { date: { start: formData.Fecha } },
        Proveedor: { rich_text: [{ text: { content: formData.Proveedor } }] },
        Tipo: { select: { name: formData.Tipo } },
        Flor: { relation: formData.Tipo === 'Flor' && formData.Articulo ? [{ id: formData.Articulo }] : [] },
        Ingrediente: { relation: formData.Tipo === 'Ingrediente' && formData.Articulo ? [{ id: formData.Articulo }] : [] },
        Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
        Cantidad: { number: parseFloat(formData.Cantidad) || 0 },
        'Precio unitario': { number: parseFloat(formData['Precio unitario']) || 0 },
        Total: { number: total },
        Notas: { rich_text: [{ text: { content: formData.Notas } }] },
      };
      if (editingCompra) {
        await updatePage(editingCompra.id, props);
      } else {
        await createPage(DATABASES.COMPRAS, props);
        // Compra nueva vinculada al catálogo: sumar existencias y, si el
        // costo subió, ofrecer actualizarlo (bajadas no se tocan)
        const articulo = catalogo.find(a => a.id === formData.Articulo);
        if (articulo) {
          const cantidad = parseFloat(formData.Cantidad) || 0;
          const precioUnitario = parseFloat(formData['Precio unitario']) || 0;
          const cambios = {};
          if (articulo.Existencias !== null && cantidad > 0) {
            cambios.Existencias = { number: articulo.Existencias + cantidad };
          }
          const costoActual = articulo['Costo unitario'] || 0;
          let costoSubio = false;
          if (precioUnitario > costoActual) {
            costoSubio = window.confirm(
              `El costo de "${articulo.Nombre}" subió: ${formatoMoneda(costoActual, moneda)} → ${formatoMoneda(precioUnitario, moneda)}.\n\n¿Actualizar su costo unitario y recalcular el costo de tus productos?`
            );
            if (costoSubio) cambios['Costo unitario'] = { number: precioUnitario };
          }
          if (Object.keys(cambios).length > 0) {
            await updatePage(articulo.id, cambios);
            if (costoSubio) await sincronizarCostos();
            await (formData.Tipo === 'Flor' ? recargarFlores() : recargarIngredientes());
            avisar(
              costoSubio
                ? `Costo de "${articulo.Nombre}" actualizado y productos recalculados`
                : `Existencias de "${articulo.Nombre}" actualizadas`
            );
          }
        }
      }
      await recargar();
      handleCloseDialog();
      avisar(editingCompra ? 'Compra actualizada' : 'Compra registrada');
    } catch (error) {
      console.error('Error guardando compra:', error);
      avisar('No se pudo guardar la compra', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingCompra, catalogo, moneda, handleCloseDialog, recargar, recargarFlores, recargarIngredientes, avisar]);

  const handleDelete = useCallback(async (compra) => {
    const etiqueta = compra.Descripción ? `${compra.Fecha} — ${compra.Descripción}` : compra.Fecha;
    if (!window.confirm(`¿Borrar la compra del ${etiqueta}? Se puede recuperar desde la papelera de Notion.`)) return;
    setDeletingId(compra.id);
    try {
      await archivePage(compra.id);
      await recargar();
      avisar('Compra borrada');
    } catch (error) {
      console.error('Error borrando compra:', error);
      avisar('No se pudo borrar la compra', 'error');
    } finally {
      setDeletingId(null);
    }
  }, [recargar, avisar]);

  if (loading) {
    return (
      <div className="screen">
        <div className="screen__header">
          <h2>Compras</h2>
          <Button>+ Registrar Compra</Button>
        </div>
        <Card>
          <p className="text-tertiary">Cargando compras...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Compras ({compras.length})</h2>
        <Button onClick={() => handleOpenDialog()}>+ Registrar Compra</Button>
      </div>
      {compras.length === 0 ? (
        <Card>
          <p className="text-tertiary">
            {error ? `⚠️ No se pudieron cargar los datos: ${error}` : 'No hay compras registradas aún.'}
          </p>
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Artículo</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(compra => (
                <tr key={compra.id}>
                  <td>{compra.Fecha}</td>
                  <td>{compra.Proveedor}</td>
                  <td>
                    {articuloDe(compra)?.Nombre || <span className="text-tertiary">{compra.Tipo || '—'}</span>}
                  </td>
                  <td>{compra.Descripción}</td>
                  <td>{compra.Cantidad}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{formatoMoneda(compra.Total, moneda)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action-btn"
                        onClick={() => handleOpenDialog(compra)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="table-action-btn delete"
                        onClick={() => handleDelete(compra)}
                        disabled={deletingId !== null}
                        title="Borrar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog isOpen={isDialogOpen} onClose={handleCloseDialog} title={editingCompra ? 'Editar Compra' : 'Nueva Compra'}>
        <FormField
          label="Fecha"
          type="date"
          value={formData.Fecha}
          onChange={val => setFormData({ ...formData, Fecha: val })}
          required
        />
        <FormField
          label="Proveedor"
          value={formData.Proveedor}
          onChange={val => setFormData({ ...formData, Proveedor: val })}
          placeholder="ej: Proveedor mayorista 1..."
          required
        />
        <FormField
          label="Tipo"
          type="select"
          value={formData.Tipo}
          onChange={val => setFormData({ ...formData, Tipo: val, Articulo: '' })}
          options={tiposCompras}
        />
        {formData.Tipo && (
          <FormField
            label={`¿Qué ${formData.Tipo === 'Flor' ? 'flor' : 'ingrediente'} compraste? (vincula para sumar existencias)`}
            type="select"
            value={formData.Articulo}
            onChange={val => setFormData({ ...formData, Articulo: val })}
            options={catalogo.map(a => ({ value: a.id, label: a.Nombre }))}
          />
        )}
        <FormField
          label="Descripción"
          type="textarea"
          value={formData.Descripción}
          onChange={val => setFormData({ ...formData, Descripción: val })}
          placeholder="ej: 100 rosas rojas preservadas..."
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
          <FormField
            label="Cantidad"
            type="number"
            value={formData.Cantidad}
            onChange={val => setFormData({ ...formData, Cantidad: val })}
            placeholder="0"
            required
          />
          <FormField
            label="Precio Unitario"
            type="number"
            value={formData['Precio unitario']}
            onChange={val => setFormData({ ...formData, 'Precio unitario': val })}
            placeholder="0.00"
            required
          />
        </div>
        <div style={{ padding: 'var(--spacing-lg)', backgroundColor: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Total: <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', color: 'var(--accent-primary)' }}>
              {moneda}{calcularTotal()}
            </strong>
          </p>
        </div>
        <FormField
          label="Notas"
          type="textarea"
          value={formData.Notas}
          onChange={val => setFormData({ ...formData, Notas: val })}
          placeholder="Notas adicionales (lote, descuento, etc.)..."
        />

        <div className="dialog-actions">
          <Button variant="secondary" onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : editingCompra ? 'Actualizar' : 'Registrar'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function MargenChip({ margen }) {
  const nivel = margen >= 50 ? 'bueno' : margen >= 25 ? 'regular' : 'bajo';
  return <span className={`chip chip--${nivel}`}>{margen.toFixed(0)}%</span>;
}

function PantallaRecetas() {
  const { productos, loading: prodLoading, recargar: recargarProductos } = useProductos();
  const { flores } = useFlores();
  const { ingredientes } = useIngredientes();
  const { recetasFlores, recetasIngredientes, loading: recLoading, recargar: recargarRecetas } = useRecetas();
  const { moneda } = useAjustesGlobal();
  const [selectedProd, setSelectedProd] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [refrescando, setRefrescando] = useState(false);
  // Ref y no estado: cualquier vía de cierre (botón, ✕, fondo) debe verlo
  const cambiosRef = useRef(false);
  const cierreTimeoutRef = useRef(null);

  const handleOpenReceta = useCallback((prod) => {
    if (refrescando) return; // no abrir con datos a medio refrescar
    clearTimeout(cierreTimeoutRef.current);
    setSelectedProd(prod);
    setIsDialogOpen(true);
  }, [refrescando]);

  const marcarCambio = useCallback(() => {
    cambiosRef.current = true;
  }, []);

  const handleCloseReceta = useCallback(async () => {
    setIsDialogOpen(false);
    cierreTimeoutRef.current = setTimeout(() => setSelectedProd(null), 300);
    if (cambiosRef.current) {
      cambiosRef.current = false;
      setRefrescando(true);
      await Promise.all([recargarProductos(), recargarRecetas()]);
      setRefrescando(false);
    }
  }, [recargarProductos, recargarRecetas]);

  if (prodLoading || recLoading) {
    return (
      <div className="screen">
        <div className="screen__header">
          <h2>Recetas</h2>
        </div>
        <Card>
          <p className="text-tertiary">Cargando recetas...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <div>
          <h2>Recetas de Productos</h2>
          <p className="subtitle">
            {refrescando ? 'Actualizando datos…' : 'Toca un producto para armar su receta. El costo se calcula con la merma incluida.'}
          </p>
        </div>
      </div>

      {productos.length === 0 ? (
        <Card>
          <p className="text-tertiary">No hay productos. Crea uno primero en la pantalla de Productos.</p>
        </Card>
      ) : (
        <div className="recetas-lista">
          {productos.map(prod => {
            const { items, costoTotal } = calcularReceta(prod, recetasFlores, recetasIngredientes, flores, ingredientes);
            const margen = calcularMargen(prod['Precio de venta'], costoTotal);

            return (
              <Card key={prod.id} className="receta-card" onClick={() => handleOpenReceta(prod)}>
                <div className="receta-card__fila">
                  <div className="receta-card__info">
                    <h3>{prod.Nombre}</h3>
                    <p>{prod.Descripción}</p>
                  </div>
                  <div className="receta-card__datos">
                    <div className="receta-dato">
                      <span className="receta-dato__valor">{items.length}</span>
                      <span className="receta-dato__label">{items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div className="receta-dato">
                      <span className="receta-dato__valor">{costoTotal > 0 ? formatoMoneda(costoTotal, moneda) : '—'}</span>
                      <span className="receta-dato__label">costo</span>
                    </div>
                    <div className="receta-dato">
                      <span className="receta-dato__valor">
                        {costoTotal > 0 && margen !== null ? <MargenChip margen={margen} /> : '—'}
                      </span>
                      <span className="receta-dato__label">margen</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        isOpen={isDialogOpen}
        onClose={handleCloseReceta}
        title={selectedProd ? `Receta: ${selectedProd.Nombre}` : 'Receta'}
      >
        {selectedProd && (
          <RecetaFormulario
            producto={selectedProd}
            flores={flores}
            ingredientes={ingredientes}
            recetasFlores={recetasFlores}
            recetasIngredientes={recetasIngredientes}
            onCambio={marcarCambio}
            onClose={handleCloseReceta}
          />
        )}
      </Dialog>
    </div>
  );
}

function RecetaFormulario({ producto, flores, ingredientes, recetasFlores, recetasIngredientes, onCambio, onClose }) {
  // Items ya guardados en Notion para este producto (edición en vivo)
  const [itemsFlores, setItemsFlores] = useState(() =>
    recetasFlores.filter(r => r.Producto === producto.Nombre)
  );
  const [itemsIngredientes, setItemsIngredientes] = useState(() =>
    recetasIngredientes.filter(r => r.Producto === producto.Nombre)
  );
  const [nuevaFlor, setNuevaFlor] = useState({ id: '', cantidad: 1 });
  const [nuevoIng, setNuevoIng] = useState({ id: '', cantidad: 1 });
  const [trabajando, setTrabajando] = useState(false);

  const { moneda, mermaDefault } = useAjustesGlobal();
  const avisar = useToast();

  const { items, costoTotal } = calcularReceta(producto, itemsFlores, itemsIngredientes, flores, ingredientes);
  const margen = calcularMargen(producto['Precio de venta'], costoTotal);

  // Guarda en el producto el costo y margen que resultan de estos items:
  // cada cambio de receta persiste solo, sin botón de "guardar costo"
  const persistirCosto = async (nuevosFlores, nuevosIngredientes) => {
    const { costoTotal: nuevoCosto } = calcularReceta(producto, nuevosFlores, nuevosIngredientes, flores, ingredientes);
    const nuevoMargen = calcularMargen(producto['Precio de venta'], nuevoCosto);
    await updatePage(producto.id, {
      'Costo total': { number: Math.round(nuevoCosto * 100) / 100 },
      'Margen real': { number: nuevoMargen !== null ? Math.round(nuevoMargen * 10) / 10 : 0 },
    });
  };

  const agregarFlor = async () => {
    if (!nuevaFlor.id || trabajando) return;
    setTrabajando(true);
    try {
      const page = await createPage(DATABASES.RECETAS_FLORES, {
        Producto: { title: [{ text: { content: producto.Nombre } }] },
        Flor: { relation: [{ id: nuevaFlor.id }] },
        Cantidad: { number: nuevaFlor.cantidad },
        Unidad: { select: { name: 'Unidades' } },
        'Merma %': { number: mermaDefault },
      });
      const nuevos = [...itemsFlores, {
        id: page.id,
        Producto: producto.Nombre,
        Flor: [nuevaFlor.id],
        Cantidad: nuevaFlor.cantidad,
        Unidad: 'Unidades',
        'Merma %': mermaDefault,
      }];
      setItemsFlores(nuevos);
      setNuevaFlor({ id: '', cantidad: 1 });
      await persistirCosto(nuevos, itemsIngredientes);
      onCambio();
    } catch (error) {
      console.error('Error agregando flor:', error);
      avisar('No se pudo agregar la flor', 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const agregarIngrediente = async () => {
    if (!nuevoIng.id || trabajando) return;
    setTrabajando(true);
    try {
      const page = await createPage(DATABASES.RECETAS_INGREDIENTES, {
        Producto: { title: [{ text: { content: producto.Nombre } }] },
        Ingrediente: { relation: [{ id: nuevoIng.id }] },
        Cantidad: { number: nuevoIng.cantidad },
        Unidad: { select: { name: 'Unidades' } },
        'Merma %': { number: mermaDefault },
      });
      const nuevos = [...itemsIngredientes, {
        id: page.id,
        Producto: producto.Nombre,
        Ingrediente: [nuevoIng.id],
        Cantidad: nuevoIng.cantidad,
        Unidad: 'Unidades',
        'Merma %': mermaDefault,
      }];
      setItemsIngredientes(nuevos);
      setNuevoIng({ id: '', cantidad: 1 });
      await persistirCosto(itemsFlores, nuevos);
      onCambio();
    } catch (error) {
      console.error('Error agregando ingrediente:', error);
      avisar('No se pudo agregar el ingrediente', 'error');
    } finally {
      setTrabajando(false);
    }
  };

  // Cambiar la cantidad de un item ya guardado, directo en la tabla
  const cambiarCantidad = async (item, cantidad) => {
    if (trabajando || cantidad === item.cantidad) return;
    setTrabajando(true);
    try {
      await updatePage(item.recetaId, { Cantidad: { number: cantidad } });
      const actualizar = rows => rows.map(r => (r.id === item.recetaId ? { ...r, Cantidad: cantidad } : r));
      const nuevosFlores = actualizar(itemsFlores);
      const nuevosIngredientes = actualizar(itemsIngredientes);
      setItemsFlores(nuevosFlores);
      setItemsIngredientes(nuevosIngredientes);
      await persistirCosto(nuevosFlores, nuevosIngredientes);
      onCambio();
    } catch (error) {
      console.error('Error cambiando cantidad:', error);
      avisar('No se pudo cambiar la cantidad', 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const eliminarItem = async (item) => {
    if (trabajando) return;
    setTrabajando(true);
    try {
      const nuevosFlores = itemsFlores.filter(r => r.id !== item.recetaId);
      const nuevosIngredientes = itemsIngredientes.filter(r => r.id !== item.recetaId);
      await archivePage(item.recetaId);
      setItemsFlores(nuevosFlores);
      setItemsIngredientes(nuevosIngredientes);
      await persistirCosto(nuevosFlores, nuevosIngredientes);
      onCambio();
    } catch (error) {
      console.error('Error eliminando item:', error);
      avisar('No se pudo eliminar el item', 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const sinCosto = items.some(it => it.sinCosto);

  return (
    <div>
      {/* Resumen de costo */}
      <div className="receta-resumen">
        <div className="receta-resumen__dato">
          <span className="receta-resumen__label">Costo (con merma)</span>
          <span className="receta-resumen__valor">{formatoMoneda(costoTotal, moneda)}</span>
        </div>
        <div className="receta-resumen__dato">
          <span className="receta-resumen__label">Precio de venta</span>
          <span className="receta-resumen__valor">{formatoMoneda(producto['Precio de venta'], moneda)}</span>
        </div>
        <div className="receta-resumen__dato">
          <span className="receta-resumen__label">Margen</span>
          <span className="receta-resumen__valor">
            {costoTotal > 0 && margen !== null ? <MargenChip margen={margen} /> : '—'}
          </span>
        </div>
      </div>
      {sinCosto && (
        <p className="receta-aviso">
          ⚠️ Hay items sin costo unitario — ponles costo en Flores/Ingredientes para que el cálculo sea real.
        </p>
      )}

      {/* Agregar flor */}
      <div className="receta-seccion">
        <h4>Flores</h4>
        <div className="receta-agregar">
          <select
            value={nuevaFlor.id}
            onChange={e => setNuevaFlor({ ...nuevaFlor, id: e.target.value })}
            className="form-field__select"
          >
            <option value="">— Selecciona flor —</option>
            {flores.filter(f => f.Activa !== false).map(f => (
              <option key={f.id} value={f.id}>
                {f.Nombre}{f['Costo unitario'] ? ` (${formatoMoneda(f['Costo unitario'], moneda)})` : ' (sin costo)'}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={nuevaFlor.cantidad}
            onChange={e => setNuevaFlor({ ...nuevaFlor, cantidad: parseInt(e.target.value) || 1 })}
            className="receta-cantidad"
            placeholder="Cant."
          />
          <button className="btn btn--primary btn--sm" onClick={agregarFlor} disabled={trabajando || !nuevaFlor.id}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Agregar ingrediente */}
      <div className="receta-seccion">
        <h4>Ingredientes</h4>
        <div className="receta-agregar">
          <select
            value={nuevoIng.id}
            onChange={e => setNuevoIng({ ...nuevoIng, id: e.target.value })}
            className="form-field__select"
          >
            <option value="">— Selecciona ingrediente —</option>
            {ingredientes.filter(i => i.Activo !== false).map(i => (
              <option key={i.id} value={i.id}>
                {i.Nombre}{i['Costo unitario'] ? ` (${formatoMoneda(i['Costo unitario'], moneda)})` : ' (sin costo)'}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={nuevoIng.cantidad}
            onChange={e => setNuevoIng({ ...nuevoIng, cantidad: parseInt(e.target.value) || 1 })}
            className="receta-cantidad"
            placeholder="Cant."
          />
          <button className="btn btn--primary btn--sm" onClick={agregarIngrediente} disabled={trabajando || !nuevoIng.id}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Items de la receta con costos */}
      {items.length > 0 && (
        <div className="table-container receta-tabla">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Cant.</th>
                <th>Costo u.</th>
                <th>Merma</th>
                <th>Costo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={`${it.recetaId}-${it.cantidad}`}>
                  <td>{it.tipo === 'flor' ? '🌸' : '🕯️'} {it.nombre}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="receta-cantidad receta-cantidad--tabla"
                      defaultValue={it.cantidad}
                      disabled={trabajando}
                      onBlur={e => cambiarCantidad(it, parseInt(e.target.value) || 1)}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                    />
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {it.costoUnitario ? formatoMoneda(it.costoUnitario, moneda) : <span className="text-tertiary">—</span>}
                  </td>
                  <td>{it.mermaPct}%</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatoMoneda(it.costo, moneda)}</td>
                  <td>
                    <button
                      className="table-action-btn delete"
                      onClick={() => eliminarItem(it)}
                      disabled={trabajando}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dialog-actions" style={{ alignItems: 'center' }}>
        <span className="text-tertiary" style={{ fontSize: 'var(--text-xs)', marginRight: 'auto' }}>
          {trabajando ? 'Guardando…' : 'Los cambios se guardan solos 🌸'}
        </span>
        <button className="btn btn--primary btn--md" onClick={() => onClose()} disabled={trabajando}>
          Listo
        </button>
      </div>
    </div>
  );
}

function PantallaListaPrecios() {
  const { productos, loading } = useProductos();
  const { ajustes, moneda } = useAjustesGlobal();
  const [vista, setVista] = useState('documento');
  const productosActivos = productos.filter(p => p.Activo);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="screen">
        <div className="screen__header">
          <h2>Lista de Precios</h2>
        </div>
        <Card>
          <p className="text-tertiary">Cargando precios...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Lista de Precios</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <div className="vista-toggle">
            <button className={vista === 'documento' ? 'activo' : ''} onClick={() => setVista('documento')}>
              Documento
            </button>
            <button className={vista === 'tarjetas' ? 'activo' : ''} onClick={() => setVista('tarjetas')}>
              Tarjetas
            </button>
          </div>
          {vista === 'documento' && (
            <Button onClick={handlePrint}>
              <Printer size={18} style={{ marginRight: 'var(--spacing-sm)' }} />
              Imprimir
            </Button>
          )}
        </div>
      </div>

      {productosActivos.length === 0 ? (
        <Card>
          <p className="text-tertiary">No hay productos activos. Crea productos en la pantalla de Productos.</p>
        </Card>
      ) : vista === 'tarjetas' ? (
        <div className="precios-tarjetas">
          {productosActivos.map(prod => (
            <Card key={prod.id} className="precio-tarjeta">
              <span className="precio-tarjeta__flor">🌸</span>
              <h3 className="precio-tarjeta__nombre">{prod.Nombre}</h3>
              {prod.Descripción && <p className="precio-tarjeta__desc">{prod.Descripción}</p>}
              <div className="precio-tarjeta__precio">{formatoMoneda(prod['Precio de venta'], moneda)}</div>
              {prod['Descuento por volumen'] > 0 && (
                <span className="chip chip--bueno">-{prod['Descuento por volumen']}% por volumen</span>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="lista-precios-container" style={{ backgroundColor: 'white', padding: 'var(--spacing-2xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--spacing-2xl)' }}>
            {/* Header de documento */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-xl)', borderBottom: '2px solid var(--accent-primary)' }}>
              <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
                {ajustes['Nombre del negocio'] || 'Alessa - Velas que Florecen'}
              </h1>
              <p style={{ margin: 'var(--spacing-sm) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Lista de Precios
              </p>
            </div>

            {/* Tabla de precios */}
            <div className="table-container" style={{ backgroundColor: 'transparent', border: 'none' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--accent-primary)' }}>
                    <th style={{ textAlign: 'left', paddingBottom: 'var(--spacing-lg)' }}>Producto</th>
                    <th style={{ textAlign: 'left', paddingBottom: 'var(--spacing-lg)' }}>Descripción</th>
                    <th style={{ textAlign: 'right', paddingBottom: 'var(--spacing-lg)' }}>Precio</th>
                    {productosActivos.some(p => p['Descuento por volumen'] > 0) && (
                      <th style={{ textAlign: 'center', paddingBottom: 'var(--spacing-lg)' }}>Desc. Vol.</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {productosActivos.map((prod, idx) => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-sunken)' }}>
                      <td style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-lg)', fontWeight: 500 }}>
                        {prod.Nombre}
                      </td>
                      <td style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        {prod.Descripción}
                      </td>
                      <td style={{ textAlign: 'right', paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-lg)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {moneda}{prod['Precio de venta']?.toFixed(2) || '0.00'}
                      </td>
                      {productosActivos.some(p => p['Descuento por volumen'] > 0) && (
                        <td style={{ textAlign: 'center', paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-lg)' }}>
                          {prod['Descuento por volumen'] > 0 ? `-${prod['Descuento por volumen']}%` : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'var(--spacing-2xl)', paddingTop: 'var(--spacing-xl)', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>
              <p style={{ margin: 0 }}>
                Generado {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })} • Sujeto a cambios
              </p>
            </div>
          </div>

          {/* Notas de impresión */}
          <Card>
            <h3>Notas para Imprimir</h3>
            <ul style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <li>Usa "Imprimir" para enviar a PDF o impresora</li>
              <li>La lista se formatea automáticamente para una página A4</li>
              <li>Los colores se ajustan para impresión en blanco y negro</li>
            </ul>
          </Card>
        </>
      )}

      <style>{`
        @media print {
          .sidebar,
          .screen__header,
          .dialog-actions,
          main > div:last-child,
          .btn,
          button {
            display: none !important;
          }
          .screen {
            padding: 0 !important;
          }
          .lista-precios-container {
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

function PantallaAjustes() {
  const { ajustes, loading, recargar } = useAjustesGlobal();
  const avisar = useToast();
  const [formData, setFormData] = useState({
    'Merma %': 30,
    'Moneda': '$',
    'Margen estándar %': 50,
    'Alerta de existencias': 5,
    'Nombre del negocio': 'Alessa - Velas que Florecen',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Cargar ajustes cuando cambien
  useEffect(() => {
    if (Object.keys(ajustes).length > 0) {
      setFormData({
        'Merma %': parseFloat(ajustes['Merma %']) || 30,
        'Moneda': ajustes['Moneda'] || '$',
        'Margen estándar %': parseFloat(ajustes['Margen estándar %']) || 50,
        'Alerta de existencias': parseFloat(ajustes['Alerta de existencias']) || 5,
        'Nombre del negocio': ajustes['Nombre del negocio'] || 'Alessa - Velas que Florecen',
      });
    }
  }, [ajustes]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Obtener los IDs existentes de Notion para actualizar
      const response = await notionFetch(`/databases/${DATABASES.AJUSTES}/query`, {
        method: 'POST',
        body: JSON.stringify({ page_size: 100 }),
      }).then(r => r.json());

      const existingAjustes = response.results || [];

      // Actualizar cada ajuste
      for (const [key, value] of Object.entries(formData)) {
        const existing = existingAjustes.find(a => a.properties?.['Parámetro']?.title?.[0]?.plain_text === key);

        if (existing) {
          // Actualizar
          await updatePage(existing.id, {
            Valor: { rich_text: [{ text: { content: String(value) } }] },
          });
        } else {
          // Crear nuevo
          await createPage(DATABASES.AJUSTES, {
            Parámetro: { title: [{ text: { content: key } }] },
            Valor: { rich_text: [{ text: { content: String(value) } }] },
          });
        }
      }

      await recargar();
      setIsEditing(false);
      avisar('Ajustes guardados');
    } catch (error) {
      console.error('Error guardando ajustes:', error);
      avisar('No se pudieron guardar los ajustes', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, recargar, avisar]);

  if (loading) {
    return (
      <div className="screen">
        <div className="screen__header">
          <h2>Ajustes</h2>
        </div>
        <Card>
          <p className="text-tertiary">Cargando ajustes...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Ajustes</h2>
        <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'secondary' : 'primary'}>
          {isEditing ? '✕ Cancelar' : 'Editar'}
        </Button>
      </div>

      {!isEditing ? (
        <div className="grid grid-cols-2 gap-lg">
          <Card>
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)', margin: 0 }}>Merma estándar</p>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--accent-primary)', marginTop: 'var(--spacing-md)' }}>
              {formData['Merma %']}%
            </div>
          </Card>

          <Card>
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)', margin: 0 }}>Moneda</p>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--accent-primary)', marginTop: 'var(--spacing-md)' }}>
              {formData['Moneda']}
            </div>
          </Card>

          <Card>
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)', margin: 0 }}>Margen estándar</p>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--accent-primary)', marginTop: 'var(--spacing-md)' }}>
              {formData['Margen estándar %']}%
            </div>
          </Card>

          <Card>
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)', margin: 0 }}>Alerta de existencias</p>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--accent-primary)', marginTop: 'var(--spacing-md)' }}>
              ≤ {formData['Alerta de existencias']}
            </div>
          </Card>

          <Card>
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)', margin: 0 }}>Nombre del negocio</p>
            <p style={{ margin: 'var(--spacing-md) 0 0 0', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>
              {formData['Nombre del negocio']}
            </p>
          </Card>
        </div>
      ) : (
        <Card>
          <h3>Configuración General</h3>
          <FormField
            label="Nombre del Negocio"
            value={formData['Nombre del negocio']}
            onChange={val => setFormData({ ...formData, 'Nombre del negocio': val })}
            placeholder="ej: Alessa - Velas que Florecen"
          />
          <FormField
            label="Merma Estándar (%)"
            type="number"
            value={formData['Merma %']}
            onChange={val => setFormData({ ...formData, 'Merma %': parseFloat(val) || 0 })}
            placeholder="ej: 30"
          />
          <FormField
            label="Moneda"
            value={formData['Moneda']}
            onChange={val => setFormData({ ...formData, 'Moneda': val })}
            placeholder="ej: $ ARS €"
          />
          <FormField
            label="Margen Estándar (%)"
            type="number"
            value={formData['Margen estándar %']}
            onChange={val => setFormData({ ...formData, 'Margen estándar %': parseFloat(val) || 0 })}
            placeholder="ej: 50"
          />
          <FormField
            label="Alerta de existencias (avisar cuando queden estas o menos)"
            type="number"
            value={formData['Alerta de existencias']}
            onChange={val => setFormData({ ...formData, 'Alerta de existencias': parseFloat(val) || 0 })}
            placeholder="ej: 5"
          />

          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </Card>
      )}

      <Card className="mt-xl">
        <h3>Información de Ayuda</h3>
        <div style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            <strong>Merma:</strong> Porcentaje de pérdida en la fabricación de velas. Se aplica automáticamente en las recetas.
          </p>
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            <strong>Margen estándar:</strong> Porcentaje de ganancia que aplica por defecto a los productos.
          </p>
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            <strong>Moneda:</strong> Símbolo usado para mostrar precios en la aplicación.
          </p>
          <p>
            <strong>Alerta de existencias:</strong> El Inicio avisa cuando a una flor o ingrediente le quedan estas unidades o menos.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default App;
