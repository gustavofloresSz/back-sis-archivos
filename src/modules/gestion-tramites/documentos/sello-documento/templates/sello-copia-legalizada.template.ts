import { PDFFont, PDFPage, rgb } from 'pdf-lib';
import { DatosSelloDocumento } from '../interfaces/datos-sello-documento.interface';

const ANCHO_SELLO = 360;
const ALTO_SELLO = 220;
const MARGEN_PAGINA = 18;
const COLOR_SELLO = rgb(0.05, 0.12, 0.48);

interface FuentesSello {
  regular: PDFFont;
  negrita: PDFFont;
}

export function dibujarSelloCopiaLegalizada(
  page: PDFPage,
  fuentes: FuentesSello,
  datos: DatosSelloDocumento,
): void {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const escala = Math.min(
    1,
    (pageWidth - MARGEN_PAGINA * 2) / ANCHO_SELLO,
    (pageHeight - MARGEN_PAGINA * 2) / ALTO_SELLO,
  );
  const ancho = ANCHO_SELLO * escala;
  const alto = ALTO_SELLO * escala;
  const x = MARGEN_PAGINA;
  const y = pageHeight - alto - MARGEN_PAGINA;
  const sx = (valor: number) => x + valor * escala;
  const sy = (desdeArriba: number) => y + alto - desdeArriba * escala;
  const tamano = (valor: number) => valor * escala;

  dibujarMarco(page, x, y, ancho, alto, tamano(1.8));
  dibujarMarco(
    page,
    sx(109),
    sy(47),
    tamano(31),
    tamano(37),
    tamano(1.2),
  );
  dibujarTextoCentrado(page, 'GAMS', fuentes.negrita, tamano(8), sx(124.5), sy(31), COLOR_SELLO);

  page.drawText('GOBIERNO AUTÓNOMO', {
    x: sx(148),
    y: sy(19),
    size: tamano(11),
    font: fuentes.negrita,
    color: COLOR_SELLO,
  });
  page.drawText('MUNICIPAL DE SACABA', {
    x: sx(148),
    y: sy(32),
    size: tamano(11),
    font: fuentes.negrita,
    color: COLOR_SELLO,
  });
  page.drawLine({
    start: { x: sx(148), y: sy(37) },
    end: { x: sx(266), y: sy(37) },
    thickness: tamano(1),
    color: COLOR_SELLO,
  });
  page.drawText('Una Ciudad con Valor', {
    x: sx(148),
    y: sy(47),
    size: tamano(8),
    font: fuentes.regular,
    color: COLOR_SELLO,
  });

  page.drawLine({
    start: { x: sx(0), y: sy(55) },
    end: { x: sx(360), y: sy(55) },
    thickness: tamano(1.5),
    color: COLOR_SELLO,
  });
  dibujarTextoCentrado(
    page,
    'DIRECCIÓN DE GESTIÓN URBANA Y TERRITORIAL',
    fuentes.negrita,
    tamano(12),
    sx(180),
    sy(70),
    COLOR_SELLO,
  );
  page.drawLine({
    start: { x: sx(0), y: sy(75) },
    end: { x: sx(360), y: sy(75) },
    thickness: tamano(1),
    color: COLOR_SELLO,
  });
  dibujarTextoCentrado(
    page,
    'COPIA LEGALIZADA',
    fuentes.negrita,
    tamano(18),
    sx(180),
    sy(94),
    COLOR_SELLO,
  );

  page.drawText('COPIA FIEL DEL ORIGINAL QUE CURSA EN ARCHIVOS DE PLANOS DE', {
    x: sx(8),
    y: sy(109),
    size: tamano(8.2),
    font: fuentes.regular,
    color: COLOR_SELLO,
  });
  page.drawText('LA JEFATURA DE SERVICIOS DE URBANISMO.', {
    x: sx(8),
    y: sy(121),
    size: tamano(8.2),
    font: fuentes.regular,
    color: COLOR_SELLO,
  });

  dibujarCampo(page, fuentes, escala, sx, sy, 134, 'TIPO DE PLANO:', '', 8, 90, 350);
  dibujarCampo(page, fuentes, escala, sx, sy, 151, 'R.M./R.T.A. N°:', '', 8, 92, 224);
  dibujarCampo(page, fuentes, escala, sx, sy, 151, 'FECHA:', '', 226, 271, 350);
  dibujarCampo(page, fuentes, escala, sx, sy, 168, 'ZONA:', datos.zona, 8, 45, 350);
  dibujarCampo(page, fuentes, escala, sx, sy, 185, 'DISTRITO:', datos.distrito, 8, 62, 172);
  dibujarCampo(page, fuentes, escala, sx, sy, 185, 'MANZANO:', '', 177, 243, 350);
  dibujarCampo(page, fuentes, escala, sx, sy, 202, 'LOTE:', '', 8, 41, 166);
  dibujarCampo(page, fuentes, escala, sx, sy, 202, 'SUPERFICIE:', '', 172, 244, 330);
  page.drawText('m²', {
    x: sx(334),
    y: sy(202),
    size: tamano(8.5),
    font: fuentes.regular,
    color: COLOR_SELLO,
  });

  page.drawText(`Sacaba, ${datos.fechaEmision}`, {
    x: sx(8),
    y: sy(216),
    size: tamano(8.5),
    font: fuentes.regular,
    color: COLOR_SELLO,
  });
}

function dibujarCampo(
  page: PDFPage,
  fuentes: FuentesSello,
  escala: number,
  sx: (valor: number) => number,
  sy: (valor: number) => number,
  fila: number,
  etiqueta: string,
  valor: string,
  inicioEtiqueta: number,
  inicioValor: number,
  finValor: number,
): void {
  const size = 8.5 * escala;
  const y = sy(fila);

  page.drawText(etiqueta, {
    x: sx(inicioEtiqueta),
    y,
    size,
    font: fuentes.regular,
    color: COLOR_SELLO,
  });
  page.drawLine({
    start: { x: sx(inicioValor), y: y - 1.5 * escala },
    end: { x: sx(finValor), y: y - 1.5 * escala },
    thickness: 0.6 * escala,
    color: COLOR_SELLO,
    dashArray: [1.2 * escala, 1.8 * escala],
  });
  if (valor.trim()) {
    page.drawText(
      ajustarTexto(
        valor,
        fuentes.negrita,
        size,
        (finValor - inicioValor - 4) * escala,
      ),
      {
        x: sx(inicioValor + 2),
        y,
        size,
        font: fuentes.negrita,
        color: COLOR_SELLO,
      },
    );
  }
}

function dibujarMarco(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  thickness: number,
): void {
  const lineas = [
    { start: { x, y }, end: { x: x + width, y } },
    { start: { x: x + width, y }, end: { x: x + width, y: y + height } },
    { start: { x: x + width, y: y + height }, end: { x, y: y + height } },
    { start: { x, y: y + height }, end: { x, y } },
  ];

  lineas.forEach((linea) =>
    page.drawLine({
      ...linea,
      thickness,
      color: COLOR_SELLO,
    }),
  );
}

function dibujarTextoCentrado(
  page: PDFPage,
  texto: string,
  fuente: PDFFont,
  size: number,
  centroX: number,
  y: number,
  color: ReturnType<typeof rgb>,
): void {
  page.drawText(texto, {
    x: centroX - fuente.widthOfTextAtSize(texto, size) / 2,
    y,
    size,
    font: fuente,
    color,
  });
}

function ajustarTexto(
  texto: string,
  fuente: PDFFont,
  size: number,
  anchoMaximo: number,
): string {
  const limpio = texto.trim();
  if (fuente.widthOfTextAtSize(limpio, size) <= anchoMaximo) {
    return limpio;
  }

  let resultado = limpio;
  while (
    resultado.length > 3 &&
    fuente.widthOfTextAtSize(`${resultado}...`, size) > anchoMaximo
  ) {
    resultado = resultado.slice(0, -1);
  }

  return `${resultado.trimEnd()}...`;
}
