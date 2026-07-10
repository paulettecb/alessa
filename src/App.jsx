import { useState, useCallback, useEffect } from 'react';
import { Flower, Package, Leaf, Flame, ShoppingCart, BarChart3, Settings, Menu, X, Trash2, Edit2, DollarSign, Printer, TrendingUp } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Dialog } from './components/Dialog';
import { FormField } from './components/FormField';
import { Greeting } from './components/Greeting';
import { useFlores, useIngredientes, useTamaños, useProductos, useCompras, useAjustes, useRecetas } from './lib/useNotion';
import { createPage, updatePage, archivePage, notionFetch, DATABASES } from './lib/notionClient';
import { calcularReceta, calcularMargen, formatoMoneda } from './lib/costos';
import './App.css';

const esMovil = () => window.innerWidth <= 768;

function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(() => !esMovil());

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
    <div className="app">
      {/* Barra superior (solo móvil) */}
      <header className="mobile-topbar">
        <button className="topbar-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <span className="topbar-title">Alessa</span>
        <span className="topbar-flor">🌸</span>
      </header>

      {/* Fondo oscuro al abrir el menú en móvil */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar__header">
          <h1 className="sidebar__title">Alessa</h1>
          <button
            className="sidebar__toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <p className="tagline">Velas que Florecen</p>
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
  );
}

function PantallaInicio() {
  const { productos } = useProductos();
  const { flores } = useFlores();
  const { ingredientes } = useIngredientes();

  const activos = productos.filter(p => p.Activo);
  const floresActivas = flores.filter(f => f.Activa).length;

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
          <Greeting name="Ale" />
          <h2 style={{ marginTop: 'var(--spacing-lg)' }}>Bienvenida a Alessa</h2>
          <p className="subtitle">Velas que Florecen — Sistema de Gestión</p>
        </div>
      </div>

      <div className="grid stats-grid gap-lg">
        <Card className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--terracotta-100)', color: 'var(--terracotta-600)' }}>
            <Package size={22} />
          </div>
          <div className="stat-value">{activos.length}</div>
          <div className="stat-label">Productos Activos</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--sage-100)', color: 'var(--sage-600)' }}>
            <Flower size={22} />
          </div>
          <div className="stat-value">{floresActivas}</div>
          <div className="stat-label">Flores en Catálogo</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-100)', color: 'var(--success-600)' }}>
            <Leaf size={22} />
          </div>
          <div className="stat-value">{ingredientes.length}</div>
          <div className="stat-label">Ingredientes</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--gold-200)', color: 'var(--gold-600)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value">{margenPromedio !== null ? `${margenPromedio.toFixed(0)}%` : '—'}</div>
          <div className="stat-label">Margen Promedio</div>
        </Card>
      </div>

      <Card className="mt-xl">
        <h3>Próximas Acciones</h3>
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
  const { flores, loading } = useFlores();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlor, setEditingFlor] = useState(null);
  const [formData, setFormData] = useState({ Nombre: '', Descripción: '', 'Costo unitario': 0, Activa: true });
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({ Nombre: '', Descripción: '', 'Costo unitario': 0, Activa: true });
    setEditingFlor(null);
  }, []);

  const handleOpenDialog = useCallback((flor = null) => {
    if (flor) {
      setEditingFlor(flor);
      setFormData({
        Nombre: flor.Nombre || '',
        Descripción: flor.Descripción || '',
        'Costo unitario': flor['Costo unitario'] || 0,
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
      alert('El nombre es requerido');
      return;
    }

    setIsSaving(true);
    try {
      const props = {
        Nombre: { title: [{ text: { content: formData.Nombre } }] },
        Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
        'Costo unitario': { number: parseFloat(formData['Costo unitario']) || 0 },
        Activa: { checkbox: formData.Activa },
      };
      if (editingFlor) {
        await updatePage(editingFlor.id, props);
      } else {
        await createPage(DATABASES.FLORES, props);
      }
      handleCloseDialog();
      // Forzar recarga (idealmente usaríamos SWR o similar)
      window.location.reload();
    } catch (error) {
      console.error('Error guardando flor:', error);
      alert('Error al guardar. Ver consola para detalles.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingFlor, handleCloseDialog]);

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
          <p className="text-tertiary">No hay flores aún. Crea una nueva flor para comenzar.</p>
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Costo Unitario</th>
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
                    {flor['Costo unitario'] ? formatoMoneda(flor['Costo unitario']) : <span className="text-tertiary">sin costo</span>}
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
          label="Costo Unitario ($ por unidad)"
          type="number"
          value={formData['Costo unitario']}
          onChange={val => setFormData({ ...formData, 'Costo unitario': val })}
          placeholder="ej: 15.50"
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
  const { ingredientes, loading } = useIngredientes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  const [formData, setFormData] = useState({ Nombre: '', Tipo: '', Descripción: '', 'Costo unitario': 0, Activo: true });
  const [isSaving, setIsSaving] = useState(false);

  const tiposIngredientes = ['Cera', 'Oasis', 'Molde', 'Maceta', 'Herramienta', 'Otro'];

  const resetForm = useCallback(() => {
    setFormData({ Nombre: '', Tipo: '', Descripción: '', 'Costo unitario': 0, Activo: true });
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
      alert('El nombre es requerido');
      return;
    }

    setIsSaving(true);
    try {
      const props = {
        Nombre: { title: [{ text: { content: formData.Nombre } }] },
        Tipo: { select: { name: formData.Tipo } },
        Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
        'Costo unitario': { number: parseFloat(formData['Costo unitario']) || 0 },
        Activo: { checkbox: formData.Activo },
      };
      if (editingIng) {
        await updatePage(editingIng.id, props);
      } else {
        await createPage(DATABASES.INGREDIENTES, props);
      }
      handleCloseDialog();
      window.location.reload();
    } catch (error) {
      console.error('Error guardando ingrediente:', error);
      alert('Error al guardar. Ver consola para detalles.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingIng, handleCloseDialog]);

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
          <p className="text-tertiary">No hay ingredientes aún. Crea uno nuevo para comenzar.</p>
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
                    {ing['Costo unitario'] ? formatoMoneda(ing['Costo unitario']) : <span className="text-tertiary">sin costo</span>}
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
          label="Costo Unitario ($ por unidad/gramo/ml)"
          type="number"
          value={formData['Costo unitario']}
          onChange={val => setFormData({ ...formData, 'Costo unitario': val })}
          placeholder="ej: 8.00"
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
  const { productos, loading } = useProductos();
  const { tamaños } = useTamaños();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [formData, setFormData] = useState({
    Nombre: '',
    SKU: '',
    Descripción: '',
    Tamaño: '',
    'Precio de venta': 0,
    'Descuento por volumen': 0,
    Activo: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({
      Nombre: '',
      SKU: '',
      Descripción: '',
      Tamaño: '',
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
        Tamaño: prod.Tamaño || '',
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
    if (!formData.Nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProd) {
        await updatePage(editingProd.id, {
          Nombre: { title: [{ text: { content: formData.Nombre } }] },
          SKU: { rich_text: [{ text: { content: formData.SKU } }] },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          'Precio de venta': { number: parseFloat(formData['Precio de venta']) || 0 },
          'Descuento por volumen': { number: parseFloat(formData['Descuento por volumen']) || 0 },
          Activo: { checkbox: formData.Activo },
        });
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
      handleCloseDialog();
      window.location.reload();
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar. Ver consola para detalles.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingProd, handleCloseDialog]);

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
          <p className="text-tertiary">No hay productos aún. Crea uno nuevo para comenzar.</p>
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
                  <td style={{ fontFamily: 'var(--font-mono)' }}>${prod['Precio de venta']?.toFixed(2) || '0.00'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {costo > 0 ? formatoMoneda(costo) : <span className="text-tertiary">sin receta</span>}
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
          label="Nombre"
          value={formData.Nombre}
          onChange={val => setFormData({ ...formData, Nombre: val })}
          placeholder="ej: Ramo Rosa Mediano..."
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
  const { compras, loading } = useCompras();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);
  const [formData, setFormData] = useState({
    Fecha: new Date().toISOString().split('T')[0],
    Proveedor: '',
    Tipo: '',
    Descripción: '',
    Cantidad: 0,
    'Precio unitario': 0,
    Total: 0,
    Notas: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const tiposCompras = ['Flor', 'Ingrediente'];

  const resetForm = useCallback(() => {
    setFormData({
      Fecha: new Date().toISOString().split('T')[0],
      Proveedor: '',
      Tipo: '',
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
      alert('Fecha y proveedor son requeridos');
      return;
    }

    setIsSaving(true);
    try {
      const total = parseFloat(calcularTotal());
      if (editingCompra) {
        await updatePage(editingCompra.id, {
          Name: { title: [{ text: { content: formData.Fecha } }] },
          Fecha: { date: { start: formData.Fecha } },
          Proveedor: { rich_text: [{ text: { content: formData.Proveedor } }] },
          Tipo: { select: { name: formData.Tipo } },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          Cantidad: { number: parseFloat(formData.Cantidad) || 0 },
          'Precio unitario': { number: parseFloat(formData['Precio unitario']) || 0 },
          Total: { number: total },
          Notas: { rich_text: [{ text: { content: formData.Notas } }] },
        });
      } else {
        await createPage(DATABASES.COMPRAS, {
          Name: { title: [{ text: { content: formData.Fecha } }] },
          Fecha: { date: { start: formData.Fecha } },
          Proveedor: { rich_text: [{ text: { content: formData.Proveedor } }] },
          Tipo: { select: { name: formData.Tipo } },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          Cantidad: { number: parseFloat(formData.Cantidad) || 0 },
          'Precio unitario': { number: parseFloat(formData['Precio unitario']) || 0 },
          Total: { number: total },
          Notas: { rich_text: [{ text: { content: formData.Notas } }] },
        });
      }
      handleCloseDialog();
      window.location.reload();
    } catch (error) {
      console.error('Error guardando compra:', error);
      alert('Error al guardar. Ver consola para detalles.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingCompra, handleCloseDialog]);

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
          <p className="text-tertiary">No hay compras registradas aún.</p>
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Tipo</th>
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
                  <td>{compra.Tipo}</td>
                  <td>{compra.Descripción}</td>
                  <td>{compra.Cantidad}</td>
                  <td>${compra.Total?.toFixed(2) || '0.00'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action-btn"
                        onClick={() => handleOpenDialog(compra)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
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
          onChange={val => setFormData({ ...formData, Tipo: val })}
          options={tiposCompras}
        />
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
              ${calcularTotal()}
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
  const { productos, loading: prodLoading } = useProductos();
  const { flores } = useFlores();
  const { ingredientes } = useIngredientes();
  const { recetasFlores, recetasIngredientes, loading: recLoading } = useRecetas();
  const [selectedProd, setSelectedProd] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenReceta = useCallback((prod) => {
    setSelectedProd(prod);
    setIsDialogOpen(true);
  }, []);

  const handleCloseReceta = useCallback((huboCambios) => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedProd(null), 300);
    if (huboCambios) window.location.reload();
  }, []);

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
          <p className="subtitle">Toca un producto para armar su receta. El costo se calcula con la merma incluida.</p>
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
                      <span className="receta-dato__valor">{costoTotal > 0 ? formatoMoneda(costoTotal) : '—'}</span>
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
        onClose={() => handleCloseReceta(false)}
        title={selectedProd ? `Receta: ${selectedProd.Nombre}` : 'Receta'}
      >
        {selectedProd && (
          <RecetaFormulario
            producto={selectedProd}
            flores={flores}
            ingredientes={ingredientes}
            recetasFlores={recetasFlores}
            recetasIngredientes={recetasIngredientes}
            onClose={handleCloseReceta}
          />
        )}
      </Dialog>
    </div>
  );
}

function RecetaFormulario({ producto, flores, ingredientes, recetasFlores, recetasIngredientes, onClose }) {
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
  const [huboCambios, setHuboCambios] = useState(false);

  const MERMA_DEFAULT = 30; // % de merma estándar

  const { items, costoTotal } = calcularReceta(producto, itemsFlores, itemsIngredientes, flores, ingredientes);
  const margen = calcularMargen(producto['Precio de venta'], costoTotal);

  const agregarFlor = async () => {
    if (!nuevaFlor.id || trabajando) return;
    setTrabajando(true);
    try {
      const page = await createPage(DATABASES.RECETAS_FLORES, {
        Producto: { title: [{ text: { content: producto.Nombre } }] },
        Flor: { relation: [{ id: nuevaFlor.id }] },
        Cantidad: { number: nuevaFlor.cantidad },
        Unidad: { select: { name: 'Unidades' } },
        'Merma %': { number: MERMA_DEFAULT },
      });
      setItemsFlores([...itemsFlores, {
        id: page.id,
        Producto: producto.Nombre,
        Flor: [nuevaFlor.id],
        Cantidad: nuevaFlor.cantidad,
        Unidad: 'Unidades',
        'Merma %': MERMA_DEFAULT,
      }]);
      setNuevaFlor({ id: '', cantidad: 1 });
      setHuboCambios(true);
    } catch (error) {
      console.error('Error agregando flor:', error);
      alert('Error al agregar: ' + error.message);
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
        'Merma %': { number: MERMA_DEFAULT },
      });
      setItemsIngredientes([...itemsIngredientes, {
        id: page.id,
        Producto: producto.Nombre,
        Ingrediente: [nuevoIng.id],
        Cantidad: nuevoIng.cantidad,
        Unidad: 'Unidades',
        'Merma %': MERMA_DEFAULT,
      }]);
      setNuevoIng({ id: '', cantidad: 1 });
      setHuboCambios(true);
    } catch (error) {
      console.error('Error agregando ingrediente:', error);
      alert('Error al agregar: ' + error.message);
    } finally {
      setTrabajando(false);
    }
  };

  const eliminarItem = async (item) => {
    if (trabajando) return;
    setTrabajando(true);
    try {
      await archivePage(item.recetaId);
      setItemsFlores(prev => prev.filter(r => r.id !== item.recetaId));
      setItemsIngredientes(prev => prev.filter(r => r.id !== item.recetaId));
      setHuboCambios(true);
    } catch (error) {
      console.error('Error eliminando item:', error);
      alert('Error al eliminar: ' + error.message);
    } finally {
      setTrabajando(false);
    }
  };

  const guardarYCerrar = async () => {
    setTrabajando(true);
    try {
      // Persistir el costo calculado (y margen) en el producto
      await updatePage(producto.id, {
        'Costo total': { number: Math.round(costoTotal * 100) / 100 },
        'Margen real': { number: margen !== null ? Math.round(margen * 10) / 10 : 0 },
      });
      onClose(true);
    } catch (error) {
      console.error('Error guardando costo:', error);
      alert('Error al guardar el costo: ' + error.message);
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
          <span className="receta-resumen__valor">{formatoMoneda(costoTotal)}</span>
        </div>
        <div className="receta-resumen__dato">
          <span className="receta-resumen__label">Precio de venta</span>
          <span className="receta-resumen__valor">{formatoMoneda(producto['Precio de venta'])}</span>
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
                {f.Nombre}{f['Costo unitario'] ? ` (${formatoMoneda(f['Costo unitario'])})` : ' (sin costo)'}
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
                {i.Nombre}{i['Costo unitario'] ? ` (${formatoMoneda(i['Costo unitario'])})` : ' (sin costo)'}
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
                <tr key={it.recetaId}>
                  <td>{it.tipo === 'flor' ? '🌸' : '🕯️'} {it.nombre}</td>
                  <td>{it.cantidad}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {it.costoUnitario ? formatoMoneda(it.costoUnitario) : <span className="text-tertiary">—</span>}
                  </td>
                  <td>{it.mermaPct}%</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatoMoneda(it.costo)}</td>
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

      <div className="dialog-actions">
        <button className="btn btn--secondary btn--md" onClick={() => onClose(huboCambios)} disabled={trabajando}>
          Cerrar
        </button>
        <button className="btn btn--primary btn--md" onClick={guardarYCerrar} disabled={trabajando}>
          {trabajando ? 'Guardando...' : 'Guardar costo en el producto'}
        </button>
      </div>
    </div>
  );
}

function PantallaListaPrecios() {
  const { productos, loading } = useProductos();
  const { ajustes } = useAjustes();
  const moneda = ajustes['Moneda'] || '$';
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
        <Button onClick={handlePrint}>
          <Printer size={18} style={{ marginRight: 'var(--spacing-sm)' }} />
          Imprimir
        </Button>
      </div>

      {productosActivos.length === 0 ? (
        <Card>
          <p className="text-tertiary">No hay productos activos. Crea productos en la pantalla de Productos.</p>
        </Card>
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
  const { ajustes, loading } = useAjustes();
  const [formData, setFormData] = useState({
    'Merma %': 30,
    'Moneda': '$',
    'Margen estándar %': 50,
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

      alert('Ajustes guardados exitosamente!');
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error guardando ajustes:', error);
      alert('Error al guardar. Ver consola para detalles.');
    } finally {
      setIsSaving(false);
    }
  }, [formData]);

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
          <p>
            <strong>Moneda:</strong> Símbolo usado para mostrar precios en la aplicación.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default App;
