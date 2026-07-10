import './Dialog.css';

export function Dialog({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog__header">
          <h3>{title}</h3>
          <button className="dialog__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="dialog__content">
          {children}
        </div>
      </div>
    </div>
  );
}
