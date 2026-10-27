import {
  PDFDocument,
  PDFFont,
  PDFPage,
  rgb,
  StandardFonts,
} from 'pdf-lib';
import { DatosReporteTramite } from '../interfaces/datos-reporte-tramite.interface';

const ANCHO_PAGINA = 612;
const ALTO_PAGINA = 792;
const MARGEN = 42;
const PIE_LIMITE = 48;
const ANCHO_CONTENIDO = ANCHO_PAGINA - MARGEN * 2;

const AZUL_INSTITUCIONAL = rgb(0, 0.514, 0.69);
const AZUL_CLARO = rgb(0.941, 0.976, 1);
const GRIS_TEXTO = rgb(0.2, 0.255, 0.333);
const GRIS_SECUNDARIO = rgb(0.392, 0.455, 0.545);
const GRIS_BORDE = rgb(0.82, 0.855, 0.9);
const GRIS_FONDO = rgb(0.973, 0.98, 0.988);
const BLANCO = rgb(1, 1, 1);

interface CampoReporte {
  etiqueta: string;
  valor: string;
}

class ConstructorReporteTramite {
  private readonly documento = PDFDocument.create();
  private pdf!: PDFDocument;
  private regular!: PDFFont;
  private negrita!: PDFFont;
  private pagina!: PDFPage;
  private y = 0;

  async construir(datos: DatosReporteTramite): Promise<Uint8Array> {
    this.pdf = await this.documento;
    this.regular = await this.pdf.embedFont(StandardFonts.Helvetica);
    this.negrita = await this.pdf.embedFont(StandardFonts.HelveticaBold);
    this.pdf.setTitle(`Reporte del trámite ${datos.codigo}`);
    this.pdf.setAuthor('Gobierno Autónomo Municipal de Sacaba');
    this.pdf.setSubject('Reporte de trámite');
    this.pdf.setProducer('Sistema de Gestión de Trámites Urbanos');
    this.pdf.setCreationDate(new Date());

    this.nuevaPagina();
    this.dibujarResumen(datos);
    this.dibujarInformacionTerritorial(datos);
    this.dibujarObservaciones(datos.observaciones);
    this.dibujarHistorial(datos);
    this.dibujarFirma();
    this.dibujarPiesDePagina(datos.fechaGeneracion);

    return this.pdf.save();
  }

  private nuevaPagina(): void {
    this.pagina = this.pdf.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
    this.dibujarEncabezado();
    this.y = 683;
  }

  private dibujarEncabezado(): void {
    this.pagina.drawRectangle({
      x: 0,
      y: 730,
      width: ANCHO_PAGINA,
      height: 62,
      color: AZUL_INSTITUCIONAL,
    });

    this.dibujarTextoCentrado(
      'GOBIERNO AUTÓNOMO MUNICIPAL DE SACABA',
      765,
      14,
      this.negrita,
      BLANCO,
    );
    this.dibujarTextoCentrado(
      'DIRECCIÓN DE GESTIÓN URBANA Y TERRITORIAL',
      746,
      10,
      this.negrita,
      BLANCO,
    );
    this.dibujarTextoCentrado(
      'REPORTE DEL TRÁMITE',
      707,
      15,
      this.negrita,
      GRIS_TEXTO,
    );

    this.pagina.drawLine({
      start: { x: MARGEN, y: 698 },
      end: { x: ANCHO_PAGINA - MARGEN, y: 698 },
      thickness: 1.5,
      color: AZUL_INSTITUCIONAL,
    });
  }

  private dibujarResumen(datos: DatosReporteTramite): void {
    this.dibujarTituloSeccion('DATOS GENERALES');
    this.dibujarCampos([
      { etiqueta: 'Código del trámite', valor: datos.codigo },
      { etiqueta: 'Fecha de registro', valor: datos.fechaRegistro },
      { etiqueta: 'Solicitante', valor: datos.solicitante },
      { etiqueta: 'Matrícula', valor: datos.matricula },
      { etiqueta: 'Gestión', valor: datos.gestion },
      { etiqueta: 'Estado actual', valor: datos.estadoActual },
      { etiqueta: 'Segmento', valor: datos.segmento },
      { etiqueta: 'Tipo de trámite', valor: datos.tipoTramite },
      { etiqueta: 'Clasificación', valor: datos.clasificacion },
      { etiqueta: 'Número de trámite', valor: datos.numeroTramite },
      { etiqueta: 'Número de folder', valor: datos.numeroFolder },
    ]);
  }

  private dibujarInformacionTerritorial(datos: DatosReporteTramite): void {
    this.dibujarTituloSeccion('INFORMACIÓN TERRITORIAL Y FÍSICA');

    const campos: CampoReporte[] = [
      { etiqueta: 'Zona', valor: datos.zona },
      { etiqueta: 'Distrito', valor: datos.distrito },
      { etiqueta: 'Código catastral', valor: datos.codigoCatastral },
      { etiqueta: 'Ubicación física actual', valor: datos.ubicacionFisica },
      ...datos.superficies.map((superficie) => ({
        etiqueta: superficie.nombre,
        valor: superficie.valor,
      })),
    ];

    this.dibujarCampos(campos);
  }

  private dibujarObservaciones(observaciones: string): void {
    this.dibujarTituloSeccion('OBSERVACIONES VIGENTES');
    const lineas = this.ajustarTexto(
      observaciones,
      this.regular,
      9,
      ANCHO_CONTENIDO - 20,
    );
    const alto = Math.max(34, lineas.length * 12 + 18);
    this.asegurarEspacio(alto);

    this.pagina.drawRectangle({
      x: MARGEN,
      y: this.y - alto,
      width: ANCHO_CONTENIDO,
      height: alto,
      color: GRIS_FONDO,
      borderColor: GRIS_BORDE,
      borderWidth: 0.7,
    });
    this.dibujarLineas(
      lineas,
      MARGEN + 10,
      this.y - 15,
      9,
      this.regular,
      GRIS_TEXTO,
      12,
    );
    this.y -= alto + 8;
  }

  private dibujarHistorial(datos: DatosReporteTramite): void {
    this.asegurarEspacio(64);
    this.dibujarTituloSeccion('HISTORIAL DE ESTADOS');

    if (!datos.historial.length) {
      this.dibujarMensajeVacio('No existe historial de estados registrado.');
      return;
    }

    this.dibujarEncabezadoHistorial();

    for (const movimiento of datos.historial) {
      const estado = this.ajustarTexto(movimiento.estado, this.regular, 8, 78);
      const motivo = this.ajustarTexto(movimiento.motivo, this.regular, 8, 205);
      const responsable = this.ajustarTexto(
        movimiento.responsable,
        this.regular,
        8,
        112,
      );
      const cantidadLineas = Math.max(
        estado.length,
        motivo.length,
        responsable.length,
      );
      const alto = Math.max(28, cantidadLineas * 10 + 10);

      if (!this.hayEspacio(alto)) {
        this.nuevaPagina();
        this.dibujarTituloSeccion('HISTORIAL DE ESTADOS (CONTINUACIÓN)');
        this.dibujarEncabezadoHistorial();
      }

      this.pagina.drawRectangle({
        x: MARGEN,
        y: this.y - alto,
        width: ANCHO_CONTENIDO,
        height: alto,
        borderColor: GRIS_BORDE,
        borderWidth: 0.5,
      });
      this.dibujarTexto(movimiento.fecha, MARGEN + 5, this.y - 14, 7.8);
      this.dibujarLineas(
        estado,
        MARGEN + 91,
        this.y - 14,
        8,
        this.regular,
        GRIS_TEXTO,
        10,
      );
      this.dibujarLineas(
        motivo,
        MARGEN + 177,
        this.y - 14,
        8,
        this.regular,
        GRIS_TEXTO,
        10,
      );
      this.dibujarLineas(
        responsable,
        MARGEN + 390,
        this.y - 14,
        8,
        this.regular,
        GRIS_TEXTO,
        10,
      );
      this.y -= alto;
    }
  }

  private dibujarFirma(): void {
    const altoReservado = 96;
    const anchoFirma = 230;
    const centroPagina = ANCHO_PAGINA / 2;

    this.asegurarEspacio(altoReservado);

    const yLinea = this.y - 58;
    this.pagina.drawLine({
      start: { x: centroPagina - anchoFirma / 2, y: yLinea },
      end: { x: centroPagina + anchoFirma / 2, y: yLinea },
      thickness: 0.8,
      color: GRIS_TEXTO,
    });
    this.dibujarTextoCentrado(
      'FIRMA DE LA PERSONA ENCARGADA',
      yLinea - 15,
      8,
      this.negrita,
      GRIS_SECUNDARIO,
    );

    this.y -= altoReservado;
  }

  private dibujarEncabezadoHistorial(): void {
    this.asegurarEspacio(25);
    this.pagina.drawRectangle({
      x: MARGEN,
      y: this.y - 22,
      width: ANCHO_CONTENIDO,
      height: 22,
      color: GRIS_TEXTO,
    });
    this.dibujarTexto('Fecha', MARGEN + 5, this.y - 15, 8, this.negrita, BLANCO);
    this.dibujarTexto('Estado', MARGEN + 91, this.y - 15, 8, this.negrita, BLANCO);
    this.dibujarTexto('Motivo', MARGEN + 177, this.y - 15, 8, this.negrita, BLANCO);
    this.dibujarTexto('Responsable', MARGEN + 390, this.y - 15, 8, this.negrita, BLANCO);
    this.y -= 22;
  }

  private dibujarTituloSeccion(titulo: string): void {
    this.asegurarEspacio(31);
    this.pagina.drawRectangle({
      x: MARGEN,
      y: this.y - 21,
      width: ANCHO_CONTENIDO,
      height: 21,
      color: AZUL_CLARO,
    });
    this.pagina.drawRectangle({
      x: MARGEN,
      y: this.y - 21,
      width: 4,
      height: 21,
      color: AZUL_INSTITUCIONAL,
    });
    this.dibujarTexto(
      titulo,
      MARGEN + 11,
      this.y - 15,
      9,
      this.negrita,
      AZUL_INSTITUCIONAL,
    );
    this.y -= 29;
  }

  private dibujarCampos(campos: CampoReporte[]): void {
    const anchoColumna = (ANCHO_CONTENIDO - 8) / 2;

    for (let indice = 0; indice < campos.length; indice += 2) {
      const fila = campos.slice(indice, indice + 2);
      const valores = fila.map((campo) =>
        this.ajustarTexto(
          campo.valor,
          this.regular,
          9,
          anchoColumna - 16,
        ),
      );
      const alto =
        Math.max(1, ...valores.map((lineas) => lineas.length)) * 11 + 25;
      this.asegurarEspacio(alto + 6);

      fila.forEach((campo, columna) => {
        const x = MARGEN + columna * (anchoColumna + 8);
        this.pagina.drawRectangle({
          x,
          y: this.y - alto,
          width: anchoColumna,
          height: alto,
          color: GRIS_FONDO,
          borderColor: GRIS_BORDE,
          borderWidth: 0.5,
        });
        this.dibujarTexto(
          campo.etiqueta.toUpperCase(),
          x + 8,
          this.y - 12,
          7,
          this.negrita,
          GRIS_SECUNDARIO,
        );
        this.dibujarLineas(
          valores[columna],
          x + 8,
          this.y - 26,
          9,
          this.regular,
          GRIS_TEXTO,
          11,
        );
      });

      this.y -= alto + 6;
    }
  }

  private dibujarMensajeVacio(mensaje: string): void {
    this.asegurarEspacio(32);
    this.pagina.drawRectangle({
      x: MARGEN,
      y: this.y - 28,
      width: ANCHO_CONTENIDO,
      height: 28,
      color: GRIS_FONDO,
      borderColor: GRIS_BORDE,
      borderWidth: 0.5,
    });
    this.dibujarTexto(
      mensaje,
      MARGEN + 9,
      this.y - 18,
      8.5,
      this.regular,
      GRIS_SECUNDARIO,
    );
    this.y -= 36;
  }

  private dibujarPiesDePagina(fechaGeneracion: string): void {
    const paginas = this.pdf.getPages();

    paginas.forEach((pagina, indice) => {
      pagina.drawLine({
        start: { x: MARGEN, y: 34 },
        end: { x: ANCHO_PAGINA - MARGEN, y: 34 },
        thickness: 0.5,
        color: GRIS_BORDE,
      });
      pagina.drawText(`Generado el ${fechaGeneracion}`, {
        x: MARGEN,
        y: 20,
        size: 7.5,
        font: this.regular,
        color: GRIS_SECUNDARIO,
      });
      const paginaTexto = `Página ${indice + 1} de ${paginas.length}`;
      pagina.drawText(paginaTexto, {
        x:
          ANCHO_PAGINA -
          MARGEN -
          this.regular.widthOfTextAtSize(paginaTexto, 7.5),
        y: 20,
        size: 7.5,
        font: this.regular,
        color: GRIS_SECUNDARIO,
      });
    });
  }

  private asegurarEspacio(alto: number): void {
    if (!this.hayEspacio(alto)) {
      this.nuevaPagina();
    }
  }

  private hayEspacio(alto: number): boolean {
    return this.y - alto >= PIE_LIMITE;
  }

  private dibujarTexto(
    texto: string,
    x: number,
    y: number,
    tamano: number,
    fuente = this.regular,
    color = GRIS_TEXTO,
  ): void {
    this.pagina.drawText(this.limpiarTexto(texto), {
      x,
      y,
      size: tamano,
      font: fuente,
      color,
    });
  }

  private dibujarLineas(
    lineas: string[],
    x: number,
    y: number,
    tamano: number,
    fuente: PDFFont,
    color: ReturnType<typeof rgb>,
    interlineado: number,
  ): void {
    lineas.forEach((linea, indice) => {
      this.dibujarTexto(
        linea,
        x,
        y - indice * interlineado,
        tamano,
        fuente,
        color,
      );
    });
  }

  private dibujarTextoCentrado(
    texto: string,
    y: number,
    tamano: number,
    fuente: PDFFont,
    color: ReturnType<typeof rgb>,
  ): void {
    const textoLimpio = this.limpiarTexto(texto);
    const ancho = fuente.widthOfTextAtSize(textoLimpio, tamano);
    this.pagina.drawText(textoLimpio, {
      x: (ANCHO_PAGINA - ancho) / 2,
      y,
      size: tamano,
      font: fuente,
      color,
    });
  }

  private ajustarTexto(
    valor: string,
    fuente: PDFFont,
    tamano: number,
    anchoMaximo: number,
  ): string[] {
    const parrafos = this.limpiarTexto(valor).split(/\r?\n/);
    const lineas: string[] = [];

    for (const parrafo of parrafos) {
      const palabras = parrafo.split(/\s+/).filter(Boolean);

      if (!palabras.length) {
        lineas.push('');
        continue;
      }

      let linea = '';
      for (const palabra of palabras) {
        const fragmentos = this.dividirPalabra(
          palabra,
          fuente,
          tamano,
          anchoMaximo,
        );

        for (const fragmento of fragmentos) {
          const candidata = linea ? `${linea} ${fragmento}` : fragmento;

          if (fuente.widthOfTextAtSize(candidata, tamano) <= anchoMaximo) {
            linea = candidata;
            continue;
          }

          if (linea) {
            lineas.push(linea);
          }
          linea = fragmento;
        }
      }

      if (linea) {
        lineas.push(linea);
      }
    }

    return lineas.length ? lineas : ['Sin información'];
  }

  private dividirPalabra(
    palabra: string,
    fuente: PDFFont,
    tamano: number,
    anchoMaximo: number,
  ): string[] {
    if (fuente.widthOfTextAtSize(palabra, tamano) <= anchoMaximo) {
      return [palabra];
    }

    const fragmentos: string[] = [];
    let fragmento = '';

    for (const caracter of palabra) {
      const candidato = `${fragmento}${caracter}`;

      if (
        fragmento &&
        fuente.widthOfTextAtSize(candidato, tamano) > anchoMaximo
      ) {
        fragmentos.push(fragmento);
        fragmento = caracter;
      } else {
        fragmento = candidato;
      }
    }

    if (fragmento) {
      fragmentos.push(fragmento);
    }

    return fragmentos;
  }

  private limpiarTexto(valor: string): string {
    const textoLimpio = Array.from(String(valor ?? ''))
      .filter((caracter) => {
        const codigo = caracter.charCodeAt(0);
        return codigo >= 32 || codigo === 9 || codigo === 10 || codigo === 13;
      })
      .join('')
      .trim();

    return textoLimpio || 'Sin información';
  }
}

export function generarReporteTramitePdf(
  datos: DatosReporteTramite,
): Promise<Uint8Array> {
  return new ConstructorReporteTramite().construir(datos);
}
