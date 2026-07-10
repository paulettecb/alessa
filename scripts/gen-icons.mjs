// Genera los íconos PNG de la app a partir de la florecita SVG.
// Uso: node scripts/gen-icons.mjs  (requiere devDependency "sharp")
import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const flor = (escala = 1) => `
  <g transform="translate(256 256) scale(${escala})">
    <g fill="#c37f4f">
      <ellipse cx="0" cy="-118" rx="82" ry="122"/>
      <ellipse cx="0" cy="-118" rx="82" ry="122" transform="rotate(72)"/>
      <ellipse cx="0" cy="-118" rx="82" ry="122" transform="rotate(144)"/>
      <ellipse cx="0" cy="-118" rx="82" ry="122" transform="rotate(216)"/>
      <ellipse cx="0" cy="-118" rx="82" ry="122" transform="rotate(288)"/>
    </g>
    <g fill="#d6a578">
      <ellipse cx="0" cy="-112" rx="46" ry="80"/>
      <ellipse cx="0" cy="-112" rx="46" ry="80" transform="rotate(72)"/>
      <ellipse cx="0" cy="-112" rx="46" ry="80" transform="rotate(144)"/>
      <ellipse cx="0" cy="-112" rx="46" ry="80" transform="rotate(216)"/>
      <ellipse cx="0" cy="-112" rx="46" ry="80" transform="rotate(288)"/>
    </g>
    <circle r="70" fill="#cba85f"/>
    <circle r="70" fill="none" stroke="#a3823f" stroke-width="10"/>
    <circle r="26" fill="#a3823f"/>
  </g>`;

// Ícono normal: fondo crema redondeado + flor casi al borde
const iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="115" fill="#fbf2e9"/>
  ${flor(0.86)}
</svg>`;

// Maskable: fondo a sangre completa + flor más chica (zona segura del 80%)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#fbf2e9"/>
  ${flor(0.66)}
</svg>`;

await mkdir('public', { recursive: true });

const salidas = [
  { svg: iconoSvg, size: 512, file: 'public/icon-512.png' },
  { svg: iconoSvg, size: 192, file: 'public/icon-192.png' },
  { svg: iconoSvg, size: 180, file: 'public/apple-touch-icon.png' },
  { svg: maskableSvg, size: 512, file: 'public/icon-512-maskable.png' },
];

for (const { svg, size, file } of salidas) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(file);
  console.log('✓', file);
}
