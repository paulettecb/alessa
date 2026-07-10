import { useState } from 'react';
import { Flower, Package, Leaf, Flame, ShoppingCart, BarChart3, Settings, Menu, X } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { useFlores, useIngredientes, useTamaños, useProductos, useCompras } from './lib/useNotion';
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
        <h2>Bienvenida a Alessa</h2>
        <p className="subtitle">Velas que Florecen — Sistema de Gestión</p>
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
        <Button>+ Agregar Flor</Button>
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
              </tr>
            </thead>
            <tbody>
              {flores.map(flor => (
                <tr key={flor.id}>
                  <td>{flor.Nombre}</td>
                  <td>{flor.Descripción}</td>
                  <td>{flor.Activa ? '✓ Activa' : '✗ Inactiva'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PantallaIngredientes() {
  const { ingredientes, loading } = useIngredientes();

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
        <Button>+ Agregar Ingrediente</Button>
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
              </tr>
            </thead>
            <tbody>
              {ingredientes.map(ing => (
                <tr key={ing.id}>
                  <td>{ing.Nombre}</td>
                  <td>{ing.Tipo}</td>
                  <td>{ing.Descripción}</td>
                  <td>{ing.Activo ? '✓ Activo' : '✗ Inactivo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PantallaProductos() {
  const { productos, loading } = useProductos();

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
        <Button>+ Agregar Producto</Button>
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
                <th>Costo Total</th>
                <th>Margen</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(prod => (
                <tr key={prod.id}>
                  <td>{prod.Nombre}</td>
                  <td>{prod.SKU}</td>
                  <td>${prod['Precio de venta']?.toFixed(2) || '0.00'}</td>
                  <td>${prod['Costo total']?.toFixed(2) || '0.00'}</td>
                  <td>{prod['Margen real']?.toFixed(1) || '0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PantallaCompras() {
  const { compras, loading } = useCompras();

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
        <Button>+ Registrar Compra</Button>
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
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(compra => (
                <tr key={compra.id}>
                  <td>{compra.Fecha}</td>
                  <td>{compra.Proveedor}</td>
                  <td>{compra.Descripción}</td>
                  <td>{compra.Cantidad}</td>
                  <td>${compra.Total?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PantallaRecetas() {
  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Recetas</h2>
      </div>
      <Card>
        <p className="text-tertiary">Aquí verás las recetas de tus productos. Agrégalas desde la pantalla de Productos.</p>
      </Card>
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
