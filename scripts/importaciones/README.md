# Importación histórica APRT 2025

Este script importa los registros de la hoja `APRT. 2025` del formato histórico
al sistema de trámites. El archivo Excel no se guarda en el repositorio: su ruta
se proporciona al ejecutar el comando.

## Configuración aplicada

- Institución: `Distrito 1 - Sacaba`, sigla `CTRL`.
- Usuario responsable: login `Carlos`, activo y perteneciente a `CTRL`.
- Gestión y segmento: `2025` y `APRT`.
- Clasificación: `Lote`.
- Estado inicial registrado en el historial: `Archivado`.
- Estado actual después de la importación: `Concluido`.
- Las superficies afectadas vacías se registran con valor `0`.
- La columna `PLANIMETRIA VALIDADA` se ignora.
- Los códigos repetidos dentro del Excel se omiten conservando su primera fila.
- No se crean archivos ni ubicaciones físicas.
- Las fechas R.T.A. y complementarias se conservan como fechas de resolución.
- La fecha de registro corresponde al momento real de la importación.
- Los trámites existentes no se eliminan ni se modifican.
- El número de folder continúa desde el mayor valor de la institución `CTRL`
  para la gestión `2025`.

La contraseña del usuario no se utiliza ni se almacena en el script. El usuario
se identifica mediante su login en la base de datos configurada en `.env`.

## Validar sin registrar

Desde la raíz del backend:

```powershell
npm run importar:aprt-2025 -- "D:\Downloads\DATOS_REALES_tramites\FORMATO-REGISTRO.xlsx" validar
```

Este modo comprueba el Excel, los catálogos, el usuario, la institución, los
duplicados y los códigos que se generarán. No realiza inserciones.

## Ejecutar la importación

Después de revisar la validación:

```powershell
npm run importar:aprt-2025 -- "D:\Downloads\DATOS_REALES_tramites\FORMATO-REGISTRO.xlsx" ejecutar
```

La inserción se realiza dentro de una transacción. Si cualquier registro falla,
se revierte la importación completa y no queda una carga parcial.
