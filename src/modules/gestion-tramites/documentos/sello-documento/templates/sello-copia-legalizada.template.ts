import { PDFFont, PDFPage, rgb } from 'pdf-lib';
import { DatosSelloDocumento } from '../interfaces/datos-sello-documento.interface';
import {
  ALTO_EMBLEMA,
  ANCHO_EMBLEMA,
  EMBLEMA_SACABA,
} from './escudo-sacaba.vector';

export const ANCHO_SELLO = 360;
export const ALTO_SELLO_PLANO = 220;
export const GROSOR_BORDE_EXTERIOR = 1.1;
export const COLOR_SELLO = rgb(0.05, 0.12, 0.48);

export interface FuentesSello {
  regular: PDFFont;
  negrita: PDFFont;
}

export interface PosicionSello {
  x: number;
  y: number;
  escala: number;
}

export function dibujarSelloCopiaLegalizada(
  page: PDFPage,
  fuentes: FuentesSello,
  datos: DatosSelloDocumento,
  { x, y, escala }: PosicionSello,
): void {
  const sx = (valor: number) => x + valor * escala;
  const sy = (desdeArriba: number) => y - desdeArriba * escala;
  const tamano = (valor: number) => valor * escala;

  // El contorno es doble y continuo; las guías de escritura siguen punteadas.
  dibujarMarcoRedondeado(page, sx(0), sy(0), ANCHO_SELLO, ALTO_SELLO_PLANO, 8, escala, GROSOR_BORDE_EXTERIOR);
  dibujarMarcoRedondeado(page, sx(3), sy(3), 354, 214, 6, escala, 0.8);

  const tituloSuperior = 'GOBIERNO AUTÓNOMO';
  const tituloInferior = 'MUNICIPAL DE SACABA';
  const anchoTitulo = Math.max(
    fuentes.negrita.widthOfTextAtSize(tituloSuperior, 11),
    fuentes.negrita.widthOfTextAtSize(tituloInferior, 11),
  );
  const inicioEscudo = (ANCHO_SELLO - (34 + 7 + anchoTitulo)) / 2;
  const inicioTitulo = inicioEscudo + 41;
  // El escudo conserva la curva inferior y el emblema institucional en vector.
  page.drawSvgPath(
    'M 0 0 H 34 V 28 C 34 37.4 26.4 45 17 45 C 7.6 45 0 37.4 0 28 Z',
    {
      x: sx(inicioEscudo),
      y: sy(6),
      scale: escala,
      borderColor: COLOR_SELLO,
      borderWidth: 0.8,
    },
  );
  const escalaEmblema = 27 / Math.max(ANCHO_EMBLEMA, ALTO_EMBLEMA);
  page.drawSvgPath(EMBLEMA_SACABA, {
    x: sx(inicioEscudo + (34 - ANCHO_EMBLEMA * escalaEmblema) / 2),
    y: sy(13),
    scale: escalaEmblema * escala,
    color: COLOR_SELLO,
  });
  page.drawText(tituloSuperior, {
    x: sx(inicioTitulo),
    y: sy(19),
    size: tamano(11),
    font: fuentes.negrita,
    color: COLOR_SELLO,
  });
  page.drawText(tituloInferior, {
    x: sx(inicioTitulo),
    y: sy(32),
    size: tamano(11),
    font: fuentes.negrita,
    color: COLOR_SELLO,
  });
  page.drawLine({
    start: { x: sx(inicioTitulo), y: sy(37) },
    end: {
      x: sx(
        inicioTitulo + fuentes.negrita.widthOfTextAtSize(tituloInferior, 11),
      ),
      y: sy(37),
    },
    thickness: tamano(0.8),
    color: COLOR_SELLO,
  });
  const lema = 'Una Ciudad con Valor';
  const inicioSegundaA = fuentes.negrita.widthOfTextAtSize('MUNICIPAL DE SAC', 11);
  const anchoHastaR = fuentes.regular.widthOfTextAtSize(lema.slice(0, -1), 8);
  const tamanoLema = (8 * inicioSegundaA) / anchoHastaR;
  page.drawText(lema, {
    x: sx(inicioTitulo), y: sy(47), size: tamano(tamanoLema),
    font: fuentes.regular, color: COLOR_SELLO,
  });
  for (const fila of [55, 75]) {
    page.drawLine({
      start: { x: sx(3), y: sy(fila) },
      end: { x: sx(357), y: sy(fila) },
      thickness: tamano(0.8),
      color: COLOR_SELLO,
    });
  }
  dibujarTextoCentrado(
    page,
    'DIRECCIÓN DE GESTIÓN URBANA Y TERRITORIAL',
    fuentes.negrita,
    tamano(12),
    sx(180),
    sy(70),
  );
  dibujarTextoCentrado(
    page,
    'COPIA LEGALIZADA',
    fuentes.negrita,
    tamano(18),
    sx(180),
    sy(94),
  );
  const primeraLinea = 'COPIA FIEL DEL ORIGINAL QUE CURSA EN ARCHIVOS DE PLANOS DE';
  const tamanoParrafo = tamano(8.2);
  const anchoParrafo = tamano(342);
  const medir = (texto: string) => fuentes.regular.widthOfTextAtSize(texto, tamanoParrafo);
  const palabras = primeraLinea.split(' ');
  const prefijoArchivos = palabras.slice(0, palabras.indexOf('ARCHIVOS'));
  const espacio = espacioJustificado(palabras, medir, anchoParrafo);
  const centroR = prefijoArchivos.reduce((ancho, palabra) => ancho + medir(palabra) + espacio, 0)
    + medir('A') + medir('R') / 2;
  dibujarTextoJustificado(
    page,
    primeraLinea,
    fuentes.regular,
    tamanoParrafo,
    sx(8),
    sy(109),
    anchoParrafo,
  );
  dibujarTextoJustificado(
    page, 'LA JEFATURA DE SERVICIOS DE URBANISMO.', fuentes.regular,
    tamanoParrafo, sx(8), sy(121), centroR + medir('O') / 2 + medir('.'),
  );

  dibujarCampo(
    page,
    fuentes,
    escala,
    sx,
    sy,
    134,
    'TIPO DE PLANO:',
    datos.tipoPlano,
    8,
    350,
  );
  dibujarCampo(
    page,
    fuentes,
    escala,
    sx,
    sy,
    151,
    'R.M./R.T.A. N°:',
    datos.resolucionMunicipal,
    8,
    224,
  );
  dibujarCampo(
    page,
    fuentes,
    escala,
    sx,
    sy,
    151,
    'FECHA:',
    datos.fechaResolucion,
    226,
    350,
  );
  dibujarCampo(page, fuentes, escala, sx, sy, 168, 'ZONA:', datos.zona, 8, 350);
  dibujarCampo(
    page,
    fuentes,
    escala,
    sx,
    sy,
    185,
    'DISTRITO:',
    datos.distrito,
    8,
    172,
  );
  const urbanizacion = datos.urbanizacion;
  dibujarCampo(page, fuentes, escala, sx, sy, 185, 'MANZANO:', urbanizacion?.manzano ?? '', 177, 350, !urbanizacion);
  dibujarCampo(page, fuentes, escala, sx, sy, 202, 'LOTE:', urbanizacion?.lote ?? '', 8, 166, !urbanizacion);
  dibujarCampo(page, fuentes, escala, sx, sy, 202, 'SUPERFICIE:', urbanizacion?.superficie ?? '', 172, 330, !urbanizacion);
  page.drawText('m²', {
    x: sx(334),
    y: sy(202),
    size: tamano(8.5),
    font: fuentes.regular,
    color: COLOR_SELLO,
  });
  dibujarCampo(
    page,
    fuentes,
    escala,
    sx,
    sy,
    214,
    'Sacaba,',
    datos.fechaEmision,
    8,
    350,
  );
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
  finValor: number,
  campoReservado = false,
): void {
  const size = 8.5 * escala;
  const y = sy(fila);
  // La guía empieza inmediatamente después de los dos puntos de la etiqueta.
  const inicioValor =
    inicioEtiqueta + fuentes.regular.widthOfTextAtSize(etiqueta, 8.5) + 0.8;
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
    dashArray: [0.6 * escala, 1.2 * escala],
  });
  const anchoValor = (finValor - inicioValor - 4) * escala;
  if (campoReservado) {
    // Doce guiones centrados ocupan el 70 % de la guía, sin rellenarla por completo.
    const anchoGuion = fuentes.negrita.widthOfTextAtSize('-', size);
    const anchoFranja = anchoValor * 0.7;
    const inicioFranja = sx(inicioValor + 2) + (anchoValor - anchoFranja) / 2;
    for (let i = 0; i < 12; i++) {
      page.drawText('-', {
        x: inicioFranja + i * (anchoFranja - anchoGuion) / 11,
        y, size, font: fuentes.negrita, color: COLOR_SELLO,
      });
    }
    return;
  }
  const contenido = valor.trim().replace(/\s+/g, ' ') || '---';
  // Mantiene el tamaño estándar si cabe; solo reduce los textos largos, sin recortarlos.
  const sizeValor = Math.min(
    size,
    (size * anchoValor) / fuentes.negrita.widthOfTextAtSize(contenido, size),
  );
  page.drawText(contenido, {
    x: sx(inicioValor + 2),
    y,
    size: sizeValor,
    font: fuentes.negrita,
    color: COLOR_SELLO,
  });
}

export function dibujarMarcoRedondeado(
  page: PDFPage,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
  escala: number,
  grosor: number,
): void {
  // Coordenadas SVG desde la esquina superior izquierda.
  const r = radio;
  const d = `M ${r} 0 H ${ancho - r} Q ${ancho} 0 ${ancho} ${r}
    V ${alto - r} Q ${ancho} ${alto} ${ancho - r} ${alto}
    H ${r} Q 0 ${alto} 0 ${alto - r} V ${r} Q 0 0 ${r} 0 Z`;
  page.drawSvgPath(d, {
    x,
    y,
    scale: escala,
    borderWidth: grosor,
    borderColor: COLOR_SELLO,
  });
}

export function dibujarTextoCentrado(
  page: PDFPage,
  texto: string,
  fuente: PDFFont,
  size: number,
  centroX: number,
  y: number,
): void {
  page.drawText(texto, {
    x: centroX - fuente.widthOfTextAtSize(texto, size) / 2,
    y,
    size,
    font: fuente,
    color: COLOR_SELLO,
  });
}

export function dibujarTextoJustificado(
  page: PDFPage,
  texto: string,
  fuente: PDFFont,
  size: number,
  x: number,
  y: number,
  ancho: number,
): void {
  const palabras = texto.split(' ');
  const medir = (palabra: string) => fuente.widthOfTextAtSize(palabra, size);
  const espacio = espacioJustificado(palabras, medir, ancho);
  let cursor = x;
  for (const palabra of palabras) {
    page.drawText(palabra, {
      x: cursor,
      y,
      size,
      font: fuente,
      color: COLOR_SELLO,
    });
    cursor += medir(palabra) + espacio;
  }
}

function espacioJustificado(palabras: string[], medir: (palabra: string) => number, ancho: number): number {
  const anchoPalabras = palabras.reduce((suma, palabra) => suma + medir(palabra), 0);
  return palabras.length > 1 ? (ancho - anchoPalabras) / (palabras.length - 1) : 0;
}
