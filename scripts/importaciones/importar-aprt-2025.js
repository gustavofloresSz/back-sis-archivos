const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('exceljs');
const { Client } = require('pg');

const CONFIGURACION = Object.freeze({
  hoja: 'APRT. 2025',
  gestion: 2025,
  filasEsperadas: 138,
  institucionSigla: 'CTRL',
  usuarioLogin: 'Carlos',
  segmento: 'APRT',
  clasificacion: 'Lote',
  estadoArchivado: 'Archivado',
  estadoConcluido: 'Concluido',
});

function obtenerArgumentos(argumentos) {
  const opciones = {
    archivo: null,
    hoja: CONFIGURACION.hoja,
    ejecutar: false,
  };

  for (let indice = 0; indice < argumentos.length; indice += 1) {
    const argumento = argumentos[indice];

    if (argumento === '--archivo') {
      opciones.archivo = argumentos[indice + 1];
      indice += 1;
      continue;
    }

    if (argumento === '--hoja') {
      opciones.hoja = argumentos[indice + 1];
      indice += 1;
      continue;
    }

    if (argumento === '--ejecutar') {
      opciones.ejecutar = true;
      continue;
    }

    if (argumento === 'ejecutar') {
      opciones.ejecutar = true;
      continue;
    }

    if (argumento === '--validar') {
      opciones.ejecutar = false;
      continue;
    }

    if (argumento === 'validar') {
      opciones.ejecutar = false;
      continue;
    }

    if (!argumento.startsWith('-') && !opciones.archivo) {
      opciones.archivo = argumento;
      continue;
    }

    throw new Error(`Argumento no reconocido: ${argumento}`);
  }

  if (!opciones.archivo) {
    throw new Error(
      'Debe indicar la ruta del Excel como primer argumento o mediante --archivo.',
    );
  }

  opciones.archivo = path.resolve(opciones.archivo);

  if (!fs.existsSync(opciones.archivo)) {
    throw new Error(`No se encontró el archivo: ${opciones.archivo}`);
  }

  return opciones;
}

function cargarVariablesEntorno(rutaEnv) {
  if (!fs.existsSync(rutaEnv)) {
    throw new Error(`No se encontró el archivo de configuración: ${rutaEnv}`);
  }

  const contenido = fs.readFileSync(rutaEnv, 'utf8');

  for (const lineaOriginal of contenido.split(/\r?\n/u)) {
    const linea = lineaOriginal.trim();
    if (!linea || linea.startsWith('#')) continue;

    const separador = linea.indexOf('=');
    if (separador < 1) continue;

    const clave = linea.slice(0, separador).trim();
    let valor = linea.slice(separador + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    if (process.env[clave] === undefined) {
      process.env[clave] = valor;
    }
  }
}

function crearClienteBaseDatos() {
  const claves = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
  ];
  const faltantes = claves.filter((clave) => !process.env[clave]);

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de base de datos: ${faltantes.join(', ')}`,
    );
  }

  return new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

function obtenerValorCelda(celda) {
  const valor = celda.value;

  if (valor && typeof valor === 'object') {
    if (Array.isArray(valor.richText)) {
      return valor.richText.map((parte) => parte.text).join('');
    }
    if (Object.hasOwn(valor, 'result')) return valor.result;
    if (Object.hasOwn(valor, 'text')) return valor.text;
  }

  return valor;
}

function obtenerTexto(celda) {
  const textoMostrado = celda.text?.trim();
  if (textoMostrado) return textoMostrado;

  const valor = obtenerValorCelda(celda);
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function obtenerTextoOpcional(celda) {
  return obtenerTexto(celda) || null;
}

function obtenerNumero(
  celda,
  fila,
  campo,
  { requerido = false, defecto } = {},
) {
  const valor = obtenerValorCelda(celda);

  if (valor === null || valor === undefined || valor === '') {
    if (defecto !== undefined) return defecto;
    if (!requerido) return null;
    throw new Error(`Fila ${fila}: ${campo} es obligatorio.`);
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;

  let texto = String(valor).trim().replace(/\s/gu, '');
  if (texto.includes(',') && texto.includes('.')) {
    texto =
      texto.lastIndexOf(',') > texto.lastIndexOf('.')
        ? texto.replace(/\./gu, '').replace(',', '.')
        : texto.replace(/,/gu, '');
  } else {
    texto = texto.replace(',', '.');
  }

  const numero = Number(texto);
  if (!Number.isFinite(numero)) {
    throw new Error(`Fila ${fila}: ${campo} no es un número válido.`);
  }

  return numero;
}

function formatearFecha(anio, mes, dia) {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() + 1 !== mes ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function obtenerFecha(celda, fila, campo, requerido = false) {
  const valor = obtenerValorCelda(celda);

  if (valor === null || valor === undefined || valor === '') {
    if (!requerido) return null;
    throw new Error(`Fila ${fila}: ${campo} es obligatoria.`);
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return formatearFecha(
      valor.getUTCFullYear(),
      valor.getUTCMonth() + 1,
      valor.getUTCDate(),
    );
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const milisegundos = Math.round((valor - 25569) * 86400 * 1000);
    const fecha = new Date(milisegundos);
    return formatearFecha(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth() + 1,
      fecha.getUTCDate(),
    );
  }

  const texto = String(valor).trim();
  let coincidencia = texto.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/u);
  if (coincidencia) {
    return formatearFecha(
      Number(coincidencia[1]),
      Number(coincidencia[2]),
      Number(coincidencia[3]),
    );
  }

  coincidencia = texto.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/u);
  if (coincidencia) {
    return formatearFecha(
      Number(coincidencia[3]),
      Number(coincidencia[2]),
      Number(coincidencia[1]),
    );
  }

  throw new Error(`Fila ${fila}: ${campo} no contiene una fecha válida.`);
}

function validarLongitud(valor, limite, fila, campo) {
  if (valor !== null && valor.length > limite) {
    throw new Error(
      `Fila ${fila}: ${campo} excede el límite de ${limite} caracteres.`,
    );
  }
}

function obtenerNumeroTramite(valor, fila) {
  const coincidencia = valor.match(/^0*(\d+)(?:\s*\/\s*\d{2,4})?$/u);
  if (!coincidencia) {
    throw new Error(
      `Fila ${fila}: N° DE TRÁMITE debe contener un número entero positivo (${valor}).`,
    );
  }

  const numeroTramite = Number(coincidencia[1]);
  if (!Number.isInteger(numeroTramite) || numeroTramite < 1) {
    throw new Error(
      `Fila ${fila}: N° DE TRÁMITE debe ser un entero mayor a cero.`,
    );
  }

  return numeroTramite;
}

function construirRegistro(filaExcel, numeroFila) {
  const numTramiteTexto = obtenerTexto(filaExcel.getCell(2));
  const nombresApellidos = obtenerTexto(filaExcel.getCell(3));
  const descripcion = obtenerTextoOpcional(filaExcel.getCell(4));
  const clasificacionMarcada = obtenerTexto(filaExcel.getCell(5));
  const distrito = obtenerTextoOpcional(filaExcel.getCell(7));
  const zona = obtenerTextoOpcional(filaExcel.getCell(8));
  const supAprobada = obtenerNumero(
    filaExcel.getCell(9),
    numeroFila,
    'SUP. APROBADA',
    { requerido: true },
  );
  const supAfectada = obtenerNumero(
    filaExcel.getCell(10),
    numeroFila,
    'SUPERFICIE AFECTADA',
    { defecto: 0 },
  );
  const codigoCatastral = obtenerTextoOpcional(filaExcel.getCell(11));
  const resolucionMunicipal = obtenerTextoOpcional(filaExcel.getCell(12));
  const fechaResolucion = obtenerFecha(
    filaExcel.getCell(13),
    numeroFila,
    'FECHA R.T.A.',
    true,
  );
  const resolucionComplementaria = obtenerTextoOpcional(filaExcel.getCell(14));
  const fechaComplementaria = obtenerFecha(
    filaExcel.getCell(15),
    numeroFila,
    'FECHA COMPLEMENTARIA',
  );
  const observaciones = obtenerTextoOpcional(filaExcel.getCell(16));

  if (!numTramiteTexto) {
    throw new Error(`Fila ${numeroFila}: N° DE TRÁMITE es obligatorio.`);
  }
  if (!nombresApellidos) {
    throw new Error(`Fila ${numeroFila}: NOMBRES Y APELLIDOS es obligatorio.`);
  }
  if (!clasificacionMarcada) {
    throw new Error(
      `Fila ${numeroFila}: la clasificación LOTE no está marcada.`,
    );
  }
  if (supAprobada < 0 || supAfectada < 0) {
    throw new Error(
      `Fila ${numeroFila}: las superficies no pueden ser negativas.`,
    );
  }

  validarLongitud(nombresApellidos, 250, numeroFila, 'NOMBRES Y APELLIDOS');
  validarLongitud(zona, 150, numeroFila, 'ZONA');
  validarLongitud(distrito, 100, numeroFila, 'DISTRITO');
  validarLongitud(codigoCatastral, 100, numeroFila, 'CÓDIGO CATASTRAL');
  validarLongitud(resolucionMunicipal, 150, numeroFila, 'R.M. y/o R.T.A.');
  validarLongitud(
    resolucionComplementaria,
    255,
    numeroFila,
    'R.T.A. COMPLEMENTARIA',
  );

  const numTramite = obtenerNumeroTramite(numTramiteTexto, numeroFila);
  const codigoTramite = `${CONFIGURACION.segmento}-${CONFIGURACION.institucionSigla}-${CONFIGURACION.gestion}-${String(numTramite).padStart(6, '0')}`;

  return {
    numeroFila,
    numFolder: 0,
    numTramite,
    codigoTramite,
    nombresApellidos,
    descripcion,
    zona,
    distrito,
    supAprobada,
    supAfectada,
    codigoCatastral,
    resolucionMunicipal,
    fechaResolucion,
    resolucionComplementaria,
    fechaComplementaria,
    observaciones,
  };
}

async function leerRegistros(rutaArchivo, nombreHoja) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(rutaArchivo);

  const hoja = libro.getWorksheet(nombreHoja);
  if (!hoja) {
    throw new Error(
      `No existe la hoja "${nombreHoja}". Hojas disponibles: ${libro.worksheets
        .map((item) => item.name)
        .join(', ')}`,
    );
  }

  const registros = [];
  const errores = [];

  for (let numeroFila = 2; numeroFila <= hoja.actualRowCount; numeroFila += 1) {
    const fila = hoja.getRow(numeroFila);
    const tieneContenido = Array.from({ length: 16 }, (_, indice) =>
      obtenerTexto(fila.getCell(indice + 1)),
    ).some(Boolean);

    if (!tieneContenido) continue;

    try {
      registros.push(construirRegistro(fila, numeroFila));
    } catch (error) {
      errores.push(error.message);
    }
  }

  if (registros.length !== CONFIGURACION.filasEsperadas) {
    errores.push(
      `Se esperaban ${CONFIGURACION.filasEsperadas} registros y se obtuvieron ${registros.length}.`,
    );
  }

  const codigos = new Set();
  const registrosUnicos = [];
  const duplicadosOmitidos = [];

  for (const registro of registros) {
    if (codigos.has(registro.codigoTramite)) {
      duplicadosOmitidos.push({
        numeroFila: registro.numeroFila,
        codigoTramite: registro.codigoTramite,
        nombresApellidos: registro.nombresApellidos,
      });
      continue;
    }

    codigos.add(registro.codigoTramite);
    registrosUnicos.push(registro);
  }

  if (errores.length > 0) {
    throw new Error(
      `Errores encontrados en el Excel:\n- ${errores.join('\n- ')}`,
    );
  }

  return { registros: registrosUnicos, duplicadosOmitidos };
}

async function obtenerUnico(cliente, consulta, parametros, descripcion) {
  const resultado = await cliente.query(consulta, parametros);

  if (resultado.rowCount !== 1) {
    throw new Error(
      `Se esperaba exactamente un registro para ${descripcion} y se encontraron ${resultado.rowCount}.`,
    );
  }

  return resultado.rows[0];
}

async function obtenerCatalogos(cliente) {
  const institucion = await obtenerUnico(
    cliente,
    'SELECT id, nombre, sigla FROM institucion WHERE LOWER(TRIM(sigla)) = LOWER($1)',
    [CONFIGURACION.institucionSigla],
    `la institución ${CONFIGURACION.institucionSigla}`,
  );

  const usuario = await obtenerUnico(
    cliente,
    `SELECT id, nombre_completo, login, institucion_id
       FROM usuario
      WHERE LOWER(TRIM(login)) = LOWER($1)
        AND institucion_id = $2
        AND estado = TRUE`,
    [CONFIGURACION.usuarioLogin, institucion.id],
    `el usuario ${CONFIGURACION.usuarioLogin} de ${institucion.sigla}`,
  );

  const tipoTramite = await obtenerUnico(
    cliente,
    `SELECT id, nombre, segmento
       FROM tipo_tramite
      WHERE LOWER(TRIM(segmento)) = LOWER($1)
        AND estado = TRUE`,
    [CONFIGURACION.segmento],
    `el tipo de trámite activo del segmento ${CONFIGURACION.segmento}`,
  );

  const clasificacion = await obtenerUnico(
    cliente,
    `SELECT id, nombre
       FROM clasificacion_tramite
      WHERE LOWER(TRIM(nombre)) = LOWER($1)
        AND estado = TRUE`,
    [CONFIGURACION.clasificacion],
    `la clasificación ${CONFIGURACION.clasificacion}`,
  );

  const estadoArchivado = await obtenerUnico(
    cliente,
    `SELECT id, nombre
       FROM estado_tramite
      WHERE LOWER(TRIM(nombre)) = LOWER($1)
        AND activo = TRUE`,
    [CONFIGURACION.estadoArchivado],
    `el estado ${CONFIGURACION.estadoArchivado}`,
  );

  const estadoConcluido = await obtenerUnico(
    cliente,
    `SELECT id, nombre
       FROM estado_tramite
      WHERE LOWER(TRIM(nombre)) = LOWER($1)
        AND activo = TRUE`,
    [CONFIGURACION.estadoConcluido],
    `el estado ${CONFIGURACION.estadoConcluido}`,
  );

  return {
    institucion,
    usuario,
    tipoTramite,
    clasificacion,
    estadoArchivado,
    estadoConcluido,
  };
}

async function verificarCodigosDisponibles(cliente, registros) {
  const codigos = registros.map((registro) => registro.codigoTramite);
  const resultado = await cliente.query(
    'SELECT codigo_tramite FROM tramite WHERE codigo_tramite = ANY($1::varchar[]) ORDER BY codigo_tramite',
    [codigos],
  );

  if (resultado.rowCount > 0) {
    throw new Error(
      `La importación no puede continuar porque ya existen ${resultado.rowCount} códigos: ${resultado.rows
        .slice(0, 10)
        .map((fila) => fila.codigo_tramite)
        .join(', ')}${resultado.rowCount > 10 ? ', ...' : ''}`,
    );
  }
}

async function asignarNumerosFolder(cliente, registros, catalogos) {
  const resultado = await cliente.query(
    `SELECT COALESCE(MAX(t.num_folder), 0) AS ultimo_folder
       FROM tramite t
       INNER JOIN usuario u ON u.id = t.usuario_registro_id
      WHERE u.institucion_id = $1
        AND t.gestion = $2`,
    [catalogos.institucion.id, CONFIGURACION.gestion],
  );
  const ultimoFolder = Number(resultado.rows[0]?.ultimo_folder ?? 0);

  registros.forEach((registro, indice) => {
    registro.numFolder = ultimoFolder + indice + 1;
  });
}

async function insertarTramite(cliente, registro, catalogos) {
  const resultado = await cliente.query(
    `INSERT INTO tramite (
       num_folder,
       num_tramite,
       codigo_tramite,
       gestion,
       nombres_apellidos,
       descripcion,
       zona,
       distrito,
       sup_aprobada,
       sup_afectada,
       codigo_catastral,
       resolucion_municipal,
       fecha_resolucion,
       resolucion_complementaria_aclaratoria,
       fecha_resolucion_complementaria_aclaratoria,
       observaciones,
       tipo_tramite_id,
       clasificacion_tramite_id,
       usuario_registro_id,
       ubicacion_fisica_id,
       estado_actual_id
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15, $16, $17, $18, $19, NULL, $20
     )
     RETURNING id`,
    [
      registro.numFolder,
      registro.numTramite,
      registro.codigoTramite,
      CONFIGURACION.gestion,
      registro.nombresApellidos,
      registro.descripcion,
      registro.zona,
      registro.distrito,
      registro.supAprobada,
      registro.supAfectada,
      registro.codigoCatastral,
      registro.resolucionMunicipal,
      registro.fechaResolucion,
      registro.resolucionComplementaria,
      registro.fechaComplementaria,
      registro.observaciones,
      catalogos.tipoTramite.id,
      catalogos.clasificacion.id,
      catalogos.usuario.id,
      catalogos.estadoConcluido.id,
    ],
  );

  return resultado.rows[0].id;
}

async function insertarHistorial(cliente, tramiteId, registro, catalogos) {
  await cliente.query(
    `INSERT INTO historial_estado_tramite (
       tramite_id,
       usuario_id,
       estado_anterior_id,
       estado_nuevo_id,
       motivo
     ) VALUES ($1, $2, NULL, $3, $4)`,
    [
      tramiteId,
      catalogos.usuario.id,
      catalogos.estadoArchivado.id,
      'Registro inicial del trámite importado desde la hoja APRT. 2025.',
    ],
  );

  await cliente.query(
    `INSERT INTO historial_estado_tramite (
       tramite_id,
       usuario_id,
       estado_anterior_id,
       estado_nuevo_id,
       motivo
     ) VALUES ($1, $2, $3, $4, $5)`,
    [
      tramiteId,
      catalogos.usuario.id,
      catalogos.estadoArchivado.id,
      catalogos.estadoConcluido.id,
      'Trámite histórico importado como concluido según registro administrativo.',
    ],
  );
}

function mostrarResumen(
  registros,
  duplicadosOmitidos,
  catalogos,
  ejecutar,
) {
  console.log('\nValidación completada');
  console.log(`Modo: ${ejecutar ? 'EJECUCIÓN' : 'SOLO VALIDACIÓN'}`);
  console.log(`Registros preparados: ${registros.length}`);
  console.log(`Registros duplicados omitidos: ${duplicadosOmitidos.length}`);
  for (const duplicado of duplicadosOmitidos) {
    console.log(
      `  - Fila ${duplicado.numeroFila}: ${duplicado.codigoTramite} (${duplicado.nombresApellidos})`,
    );
  }
  console.log(
    `Institución: ${catalogos.institucion.nombre} (${catalogos.institucion.sigla})`,
  );
  console.log(
    `Responsable: ${catalogos.usuario.nombre_completo} (${catalogos.usuario.login})`,
  );
  console.log(
    `Tipo: ${catalogos.tipoTramite.nombre} [${catalogos.tipoTramite.segmento}]`,
  );
  console.log(`Clasificación: ${catalogos.clasificacion.nombre}`);
  console.log(
    `Estado final de importación: ${catalogos.estadoConcluido.nombre}`,
  );
  console.log(
    `Códigos: ${registros[0].codigoTramite} — ${registros.at(-1).codigoTramite}`,
  );
}

async function main() {
  const opciones = obtenerArgumentos(process.argv.slice(2));
  cargarVariablesEntorno(path.resolve(__dirname, '..', '..', '.env'));

  console.log(`Archivo: ${opciones.archivo}`);
  console.log(`Hoja: ${opciones.hoja}`);

  const { registros, duplicadosOmitidos } = await leerRegistros(
    opciones.archivo,
    opciones.hoja,
  );
  const cliente = crearClienteBaseDatos();
  let transaccionActiva = false;

  try {
    await cliente.connect();
    const catalogos = await obtenerCatalogos(cliente);
    await asignarNumerosFolder(cliente, registros, catalogos);
    await verificarCodigosDisponibles(cliente, registros);
    mostrarResumen(
      registros,
      duplicadosOmitidos,
      catalogos,
      opciones.ejecutar,
    );

    if (!opciones.ejecutar) {
      console.log('\nNo se modificó la base de datos.');
      console.log(
        'Use --ejecutar únicamente después de revisar este resultado.',
      );
      return;
    }

    await cliente.query('BEGIN');
    transaccionActiva = true;
    await cliente.query('LOCK TABLE tramite IN SHARE ROW EXCLUSIVE MODE');
    await asignarNumerosFolder(cliente, registros, catalogos);
    await verificarCodigosDisponibles(cliente, registros);

    for (const registro of registros) {
      const tramiteId = await insertarTramite(cliente, registro, catalogos);
      await insertarHistorial(cliente, tramiteId, registro, catalogos);
    }

    await cliente.query('COMMIT');
    transaccionActiva = false;
    console.log(
      `\nImportación completada: ${registros.length} trámites registrados.`,
    );
  } catch (error) {
    if (transaccionActiva) await cliente.query('ROLLBACK');
    throw error;
  } finally {
    await cliente.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exitCode = 1;
});
