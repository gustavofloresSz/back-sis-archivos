import { PDFPage } from 'pdf-lib';
import {
  ANCHO_SELLO,
  COLOR_SELLO,
  FuentesSello,
  GROSOR_BORDE_EXTERIOR,
  PosicionSello,
  dibujarMarcoRedondeado,
  dibujarTextoCentrado,
  dibujarTextoJustificado,
} from './sello-copia-legalizada.template';
import { ALTO_EMBLEMA, ANCHO_EMBLEMA, EMBLEMA_SACABA } from './escudo-sacaba.vector';

export const ALTO_SELLO_RESOLUCION = 184;

export function dibujarSelloResolucion(
  pagina: PDFPage,
  fuentes: FuentesSello,
  emision: { fecha: string; hora: string },
  { x, y, escala }: PosicionSello,
): void {
  const sx = (valor: number) => x + valor * escala;
  const sy = (valor: number) => y - valor * escala;
  const texto = (valor: string, izquierda: number, fila: number, size: number, negrita = false) =>
    pagina.drawText(valor, {
      x: sx(izquierda), y: sy(fila), size: size * escala,
      font: negrita ? fuentes.negrita : fuentes.regular, color: COLOR_SELLO,
    });
  const linea = (x1: number, y1: number, x2: number, y2: number, punteada = false) =>
    pagina.drawLine({
      start: { x: sx(x1), y: sy(y1) },
      end: { x: sx(x2), y: sy(y2) },
      thickness: 0.8 * escala,
      color: COLOR_SELLO,
      dashArray: punteada ? [0.6 * escala, 1.2 * escala] : undefined,
    });
  const justificar = (valor: string, izquierda: number, fila: number) =>
    dibujarTextoJustificado(
      pagina, valor, fuentes.regular, 11 * escala,
      sx(izquierda), sy(fila), (350 - izquierda) * escala,
    );

  dibujarMarcoRedondeado(pagina, x, y, ANCHO_SELLO, ALTO_SELLO_RESOLUCION, 7, escala, GROSOR_BORDE_EXTERIOR);
  dibujarMarcoRedondeado(pagina, sx(3), sy(3), ANCHO_SELLO - 6, ALTO_SELLO_RESOLUCION - 6, 5, escala, 0.8);
  linea(3, 45, 357, 45);
  linea(3, 66, 357, 66);
  linea(140, 3, 140, 45);

  pagina.drawSvgPath('M 0 0 H 27 V 21 Q 27 35 13.5 35 Q 0 35 0 21 Z', {
    x: sx(10), y: sy(7), scale: escala, borderColor: COLOR_SELLO, borderWidth: 0.8,
  });
  const escalaEmblema = 23 / Math.max(ANCHO_EMBLEMA, ALTO_EMBLEMA);
  pagina.drawSvgPath(EMBLEMA_SACABA, {
    x: sx(10 + (27 - ANCHO_EMBLEMA * escalaEmblema) / 2),
    y: sy(12), scale: escala * escalaEmblema, color: COLOR_SELLO,
  });
  const inicioTitulo = 43;
  const tituloInferior = 'MUNICIPAL DE SACABA';
  const tamanoTitulo = 7.8;
  const anchoTitulo = fuentes.negrita.widthOfTextAtSize(tituloInferior, tamanoTitulo);
  const lema = 'Una Ciudad con Valor';
  const tamanoLema = anchoTitulo / fuentes.regular.widthOfTextAtSize(lema, 1);
  texto('GOBIERNO AUTÓNOMO', inicioTitulo, 16, tamanoTitulo, true);
  texto(tituloInferior, inicioTitulo, 26, tamanoTitulo, true);
  linea(inicioTitulo, 29, inicioTitulo + anchoTitulo, 29);
  texto(lema, inicioTitulo, 39, tamanoLema);
  dibujarTextoCentrado(pagina, 'LEGALIZACIÓN', fuentes.negrita, 24 * escala, sx(248), sy(34));
  dibujarTextoCentrado(
    pagina, 'DIRECCIÓN DE GESTIÓN URBANA Y TERRITORIAL',
    fuentes.negrita, 11.5 * escala, sx(180), sy(60),
  );

  justificar('La (s) presente (s) copia (s) fotostática (s) cursante (s) a', 10, 84);
  texto('Fs.:', 10, 101, 11);
  const inicioGuiaFolios = 10 + fuentes.regular.widthOfTextAtSize('Fs.:', 11);
  linea(inicioGuiaFolios, 104, 130, 104, true);
  justificar('concuerda (n) fielmente con el (los)', 133, 101);
  justificar('original (les) de su referencia, a la (s) que en caso', 10, 118);
  justificar('necesario me remito para fines consiguientes de ley.', 10, 135);
  texto('Fecha:', 10, 170, 12);
  texto(emision.fecha, 50, 170, 12, true);
  linea(49, 173, 211, 173, true);
  texto('Hora:', 219, 170, 12);
  texto(emision.hora, 252, 170, 12, true);
  linea(251, 173, 350, 173, true);
}
