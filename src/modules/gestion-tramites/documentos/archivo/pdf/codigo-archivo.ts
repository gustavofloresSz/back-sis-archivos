import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function dibujarCodigoArchivo(documento: PDFDocument, codigo: string): Promise<void> {
  const fuente = await documento.embedFont(StandardFonts.Helvetica);
  const texto = `Código de archivo: ${codigo}`;
  const anchoTexto = fuente.widthOfTextAtSize(texto, 1);
  const tinta = rgb(0.13, 0.19, 0.28);

  for (const pagina of documento.getPages()) {
    const { x, y, width, height } = pagina.getCropBox();
    const angulo = ((pagina.getRotation().angle % 360) + 360) % 360;
    const vertical = angulo === 90 || angulo === 270;
    const ancho = vertical ? height : width;
    const alto = vertical ? width : height;
    const margen = Math.min(12, ancho * 0.04, alto * 0.04);
    const relleno = Math.min(4, margen / 2);
    const size = Math.min(9, (ancho - 2 * (margen + relleno)) / anchoTexto, (alto - 2 * (margen + relleno)) / 1.2);
    const anchoCaja = anchoTexto * size + relleno * 2;
    const altoCaja = size * 1.2 + relleno * 2;
    const izquierda = ancho - margen - anchoCaja;
    const abajo = alto - margen - altoCaja;
    const punto = (u: number, v: number) => {
      switch (angulo) {
        case 90: return { x: x + width - v, y: y + u };
        case 180: return { x: x + width - u, y: y + height - v };
        case 270: return { x: x + v, y: y + height - u };
        default: return { x: x + u, y: y + v };
      }
    };
    const rotate = degrees(angulo);
    pagina.drawRectangle({
      ...punto(izquierda, abajo),
      width: anchoCaja,
      height: altoCaja,
      color: rgb(1, 1, 1),
      rotate,
    });
    pagina.drawText(texto, {
      ...punto(izquierda + relleno, abajo + relleno + size * 0.22),
      size,
      font: fuente,
      color: tinta,
      rotate,
    });
  }
}
