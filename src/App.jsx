import { useState } from 'react';
import { Flower, Package, Leaf, Flame, ShoppingCart, BarChart3, Settings, Menu, X } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
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
  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Bienvenida a Alessa</h2>
        <p className="subtitle">Velas que Florecen — Sistema de Gestión</p>
      </div>

      <div className="grid grid-cols-2 gap-lg">
        <Card className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Productos Activos</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Flores en Catálogo</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Ingredientes</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">$0.00</div>
          <div className="stat-label">Margen Promedio</div>
        </Card>
      </div>

      <Card className="mt-xl">
        <h3>Próximas Acciones</h3>
        <p className="text-secondary mt-md">
          Comienza agregando flores, ingredientes y productos. Los datos se sincronizan automáticamente con Notion.
        </p>
      </Card>
    </div>
  );
}

function PantallaFlores() {
  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Flores</h2>
        <Button>+ Agregar Flor</Button>
      </div>
      <Card>
        <p className="text-tertiary">No hay flores aún. Crea una nueva flor para comenzar.</p>
      </Card>
    </div>
  );
}

function PantallaIngredientes() {
  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Ingredientes</h2>
        <Button>+ Agregar Ingrediente</Button>
      </div>
      <Card>
        <p className="text-tertiary">No hay ingredientes aún. Crea uno nuevo para comenzar.</p>
      </Card>
    </div>
  );
}

function PantallaProductos() {
  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Productos</h2>
        <Button>+ Agregar Producto</Button>
      </div>
      <Card>
        <p className="text-tertiary">No hay productos aún. Crea uno nuevo para comenzar.</p>
      </Card>
    </div>
  );
}

function PantallaCompras() {
  return (
    <div className="screen">
      <div className="screen__header">
        <h2>Compras</h2>
        <Button>+ Registrar Compra</Button>
      </div>
      <Card>
        <p className="text-tertiary">No hay compras registradas aún.</p>
      </Card>
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
