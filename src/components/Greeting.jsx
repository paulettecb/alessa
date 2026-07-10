export function Greeting({ name = 'Ale' }) {
  const hour = new Date().getHours();

  let greeting;
  if (hour < 12) {
    greeting = 'Buenos días';
  } else if (hour < 18) {
    greeting = 'Buenas tardes';
  } else {
    greeting = 'Buenas noches';
  }

  return (
    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 0 }}>
      {greeting}, <strong>{name}</strong>
    </p>
  );
}
