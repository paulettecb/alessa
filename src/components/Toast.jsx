import { createContext, useCallback, useContext, useState } from 'react';
import './Toast.css';

// Avisos suaves en lugar de alert(): useToast() devuelve mostrar(mensaje, tipo)
// con tipo 'exito' (default) o 'error'. Desaparecen solos.
const ToastContext = createContext(() => {});

let secuencia = 0;

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const mostrar = useCallback((mensaje, tipo = 'exito') => {
    const id = ++secuencia;
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>
            <span className="toast__icono">{t.tipo === 'exito' ? '🌸' : '⚠️'}</span>
            <span>{t.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
