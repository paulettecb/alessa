export function saludoDelDia() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Greeting({ name = 'Ale' }) {
  return (
    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 0 }}>
      {saludoDelDia()}, <strong>{name}</strong>
    </p>
  );
}
