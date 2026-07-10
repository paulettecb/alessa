import { useState, useCallback } from 'react';
import { Flower, Package, Leaf, Flame, ShoppingCart, BarChart3, Settings, Menu, X, Trash2, Edit2 } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Dialog } from './components/Dialog';
import { FormField } from './components/FormField';
import { Greeting } from './components/Greeting';
import { useFlores, useIngredientes, useTamaños, useProductos, useCompras } from './lib/useNotion';
import { createPage, updatePage, DATABASES } from './lib/notionClient';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: BarChart3 },
    { id: 'flores', label: 'Flores', icon: Flower },
    { id: 'ingredientes', label: 'Ingredientes', icon: Leaf },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
    { id: 'recetas', label: 'Recetas', icon: Flame },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="app">
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
                onClick={() => setActiveTab(item.id)}
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
        {activeTab === 'ajustes' && <PantallaAjustes />}
      </main>
    </div>
  );
}

function PantallaInicio() {
  const { productos } = useProductos();
  const { flores } = useFlores();
  const { ingredientes } = useIngredientes();

  const productosActivos = productos.filter(p => p.Activo).length;
  const floresActivas = flores.filter(f => f.Activa).length;

  return (
    <div className="screen">
      <div className="screen__header">
        <div>
          <Greeting name="Ale" />
          <h2 style={{ marginTop: 'var(--spacing-lg)' }}>Bienvenida a Alessa</h2>
          <p className="subtitle">Velas que Florecen — Sistema de Gestión</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-lg">
        <Card className="stat-card">
          <div className="stat-value">{productosActivos}</div>
          <div className="stat-label">Productos Activos</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">{floresActivas}</div>
          <div className="stat-label">Flores en Catálogo</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">{ingredientes.length}</div>
          <div className="stat-label">Ingredientes</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">-</div>
          <div className="stat-label">Margen Promedio</div>
        </Card>
      </div>

      <Card className="mt-xl">
        <h3>Próximas Acciones</h3>
        <p className="text-secondary mt-md">
          ✅ Conexión con Notion activa. Los datos se sincronizan automáticamente.
        </p>
      </Card>
    </div>
  );
}

function PantallaFlores() {
  const { flores, loading } = useFlores();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlor, setEditingFlor] = useState(null);
  const [formData, setFormData] = useState({ Nombre: '', Descripción: '', Activa: true });
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({ Nombre: '', Descripción: '', Activa: true });
    setEditingFlor(null);
  }, []);

  const handleOpenDialog = useCallback((flor = null) => {
    if (flor) {
      setEditingFlor(flor);
      setFormData({
        Nombre: flor.Nombre || '',
        Descripción: flor.Descripción || '',
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
      if (editingFlor) {
        // Editar
        await updatePage(editingFlor.id, {
          Nombre: { title: [{ text: { content: formData.Nombre } }] },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          Activa: { checkbox: formData.Activa },
        });
      } else {
        // Crear
        await createPage(DATABASES.FLORES, {
          Nombre: { title: [{ text: { content: formData.Nombre } }] },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          Activa: { checkbox: formData.Activa },
        });
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
                <th>Estado</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {flores.map(flor => (
                <tr key={flor.id}>
                  <td>{flor.Nombre}</td>
                  <td>{flor.Descripción}</td>
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
  const [formData, setFormData] = useState({ Nombre: '', Tipo: '', Descripción: '', Activo: true });
  const [isSaving, setIsSaving] = useState(false);

  const tiposIngredientes = ['Cera', 'Oasis', 'Molde', 'Maceta', 'Herramienta', 'Otro'];

  const resetForm = useCallback(() => {
    setFormData({ Nombre: '', Tipo: '', Descripción: '', Activo: true });
    setEditingIng(null);
  }, []);

  const handleOpenDialog = useCallback((ing = null) => {
    if (ing) {
      setEditingIng(ing);
      setFormData({
        Nombre: ing.Nombre || '',
        Tipo: ing.Tipo || '',
        Descripción: ing.Descripción || '',
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
      if (editingIng) {
        await updatePage(editingIng.id, {
          Nombre: { title: [{ text: { content: formData.Nombre } }] },
          Tipo: { select: { name: formData.Tipo } },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          Activo: { checkbox: formData.Activo },
        });
      } else {
        await createPage(DATABASES.INGREDIENTES, {
          Nombre: { title: [{ text: { content: formData.Nombre } }] },
          Tipo: { select: { name: formData.Tipo } },
          Descripción: { rich_text: [{ text: { content: formData.Descripción } }] },
          Activo: { checkbox: formData.Activo },
        });
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
                <th>Descuento Vol.</th>
                <th>Estado</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(prod => (
                <tr key={prod.id}>
                  <td>{prod.Nombre}</td>
                  <td>{prod.SKU}</td>
                  <td>${prod['Precio de venta']?.toFixed(2) || '0.00'}</td>
                  <td>{prod['Descuento por volumen']?.toFixed(0) || '0'}%</td>
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
              ))}
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

function PantallaRecetas() {
  const { productos, loading: prodLoading } = useProductos();
  const { flores } = useFlores();
  const { ingredientes } = useIngredientes();
  const [recetasFlores, setRecetasFlores] = useState([]);
  const [recetasIngredientes, setRecetasIngredientes] = useState([]);
  const [selectedProd, setSelectedProd] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Simular carga de recetas desde Notion
  useEffect(() => {
    // Fetch recetas desde Notion
    (async () => {
      try {
        const flores = await fetch(`https://api.notion.com/v1/databases/${DATABASES.RECETAS_FLORES}/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ page_size: 100 }),
        }).then(r => r.json());
        setRecetasFlores(flores.results || []);

        const ingredientes = await fetch(`https://api.notion.com/v1/databases/${DATABASES.RECETAS_INGREDIENTES}/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ page_size: 100 }),
        }).then(r => r.json());
        setRecetasIngredientes(ingredientes.results || []);
      } catch (error) {
        console.error('Error cargando recetas:', error);
      }
    })();
  }, []);

  const handleOpenReceta = useCallback((prod) => {
    setSelectedProd(prod);
    setIsDialogOpen(true);
  }, []);

  const handleCloseReceta = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedProd(null), 300);
  }, []);

  if (prodLoading) {
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
        <h2>Recetas de Productos</h2>
      </div>

      {productos.length === 0 ? (
        <Card>
          <p className="text-tertiary">No hay productos. Crea uno primero en la pantalla de Productos.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-lg">
          {productos.map(prod => {
            const floresReceta = recetasFlores.filter(r => r.properties?.['Producto']?.title?.[0]?.plain_text === prod.Nombre);
            const ingReceta = recetasIngredientes.filter(r => r.properties?.['Producto']?.title?.[0]?.plain_text === prod.Nombre);
            const totalItems = floresReceta.length + ingReceta.length;

            return (
              <Card key={prod.id} className="receta-card" onClick={() => handleOpenReceta(prod)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: 'var(--spacing-sm)', cursor: 'pointer' }}>
                      {prod.Nombre}
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                      {prod.Descripción}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {totalItems}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {totalItems === 1 ? 'item' : 'items'}
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
            onClose={handleCloseReceta}
          />
        )}
      </Dialog>
    </div>
  );
}

function RecetaFormulario({ producto, flores, ingredientes, onClose }) {
  const [floresAgregadas, setFloresAgregadas] = useState([]);
  const [ingredientesAgregados, setIngredientesAgregados] = useState([]);
  const [floresReceta, setFloresReceta] = useState({ flor: '', cantidad: 1 });
  const [ingredientesReceta, setIngredientesReceta] = useState({ ingrediente: '', cantidad: 1 });
  const [isSaving, setIsSaving] = useState(false);

  const MERMA = 0.30; // 30%

  const handleAgregarFlor = useCallback(() => {
    if (!floresReceta.flor) return;
    const flor = flores.find(f => f.id === floresReceta.flor);
    if (flor) {
      setFloresAgregadas([...floresAgregadas, { ...flor, cantidadReceta: floresReceta.cantidad }]);
      setFloresReceta({ flor: '', cantidad: 1 });
    }
  }, [floresReceta, flores, floresAgregadas]);

  const handleAgregarIngrediente = useCallback(() => {
    if (!ingredientesReceta.ingrediente) return;
    const ing = ingredientes.find(i => i.id === ingredientesReceta.ingrediente);
    if (ing) {
      setIngredientesAgregados([...ingredientesAgregados, { ...ing, cantidadReceta: ingredientesReceta.cantidad }]);
      setIngredientesReceta({ ingrediente: '', cantidad: 1 });
    }
  }, [ingredientesReceta, ingredientes, ingredientesAgregados]);

  const handleEliminarFlor = useCallback((id) => {
    setFloresAgregadas(floresAgregadas.filter(f => f.id !== id));
  }, [floresAgregadas]);

  const handleEliminarIngrediente = useCallback((id) => {
    setIngredientesAgregados(ingredientesAgregados.filter(i => i.id !== id));
  }, [ingredientesAgregados]);

  const handleGuardar = useCallback(async () => {
    if (floresAgregadas.length === 0 && ingredientesAgregados.length === 0) {
      alert('Agrega al menos un item a la receta');
      return;
    }

    setIsSaving(true);
    try {
      // Guardar flores de la receta
      for (const flor of floresAgregadas) {
        await createPage(DATABASES.RECETAS_FLORES, {
          Producto: { title: [{ text: { content: producto.Nombre } }] },
          Variante: { relation: [{ id: flor.id }] },
          Cantidad: { number: flor.cantidadReceta },
          Unidad: { select: { name: 'Unidades' } },
          'Merma %': { number: MERMA * 100 },
        });
      }

      // Guardar ingredientes de la receta
      for (const ing of ingredientesAgregados) {
        await createPage(DATABASES.RECETAS_INGREDIENTES, {
          Producto: { title: [{ text: { content: producto.Nombre } }] },
          Subtipo: { relation: [{ id: ing.id }] },
          Cantidad: { number: ing.cantidadReceta },
          Unidad: { select: { name: 'Unidades' } },
          'Merma %': { number: MERMA * 100 },
        });
      }

      alert('Receta guardada exitosamente!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error guardando receta:', error);
      alert('Error al guardar. Ver consola para detalles.');
    } finally {
      setIsSaving(false);
    }
  }, [floresAgregadas, ingredientesAgregados, producto.Nombre, onClose]);

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h4 style={{ margin: '0 0 var(--spacing-md) 0' }}>Flores</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <select
            value={floresReceta.flor}
            onChange={e => setFloresReceta({ ...floresReceta, flor: e.target.value })}
            className="form-field__select"
            style={{ width: '100%' }}
          >
            <option value="">— Selecciona flor —</option>
            {flores.map(f => (
              <option key={f.id} value={f.id}>
                {f.Nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={floresReceta.cantidad}
            onChange={e => setFloresReceta({ ...floresReceta, cantidad: parseInt(e.target.value) || 1 })}
            className="input"
            style={{ width: '80px' }}
            placeholder="Cant."
          />
          <button className="btn btn--primary btn--sm" onClick={handleAgregarFlor}>
            + Agregar
          </button>
        </div>

        {floresAgregadas.length > 0 && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Flor</th>
                  <th>Cantidad</th>
                  <th>Merma</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {floresAgregadas.map(f => (
                  <tr key={f.id}>
                    <td>{f.Nombre}</td>
                    <td>{f.cantidadReceta}</td>
                    <td>30%</td>
                    <td>
                      <button
                        className="table-action-btn delete"
                        onClick={() => handleEliminarFlor(f.id)}
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
      </div>

      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h4 style={{ margin: '0 0 var(--spacing-md) 0' }}>Ingredientes</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <select
            value={ingredientesReceta.ingrediente}
            onChange={e => setIngredientesReceta({ ...ingredientesReceta, ingrediente: e.target.value })}
            className="form-field__select"
            style={{ width: '100%' }}
          >
            <option value="">— Selecciona ingrediente —</option>
            {ingredientes.map(i => (
              <option key={i.id} value={i.id}>
                {i.Nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={ingredientesReceta.cantidad}
            onChange={e => setIngredientesReceta({ ...ingredientesReceta, cantidad: parseInt(e.target.value) || 1 })}
            className="input"
            style={{ width: '80px' }}
            placeholder="Cant."
          />
          <button className="btn btn--primary btn--sm" onClick={handleAgregarIngrediente}>
            + Agregar
          </button>
        </div>

        {ingredientesAgregados.length > 0 && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Cantidad</th>
                  <th>Merma</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ingredientesAgregados.map(i => (
                  <tr key={i.id}>
                    <td>{i.Nombre}</td>
                    <td>{i.cantidadReceta}</td>
                    <td>30%</td>
                    <td>
                      <button
                        className="table-action-btn delete"
                        onClick={() => handleEliminarIngrediente(i.id)}
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
      </div>

      <div className="dialog-actions">
        <button className="btn btn--secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn--primary" onClick={handleGuardar} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Receta'}
        </button>
      </div>
    </div>
  );
}

function PantallaAjustes() {
  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Ajustes</h2>
      </div>
      <Card>
        <h3>Configuración General</h3>
        <p className="text-secondary mt-md">Aquí irá la configuración de merma, márgenes, y más.</p>
      </Card>
    </div>
  );
}

export default App;
