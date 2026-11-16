# Ejecución local

Este backend se ejecuta junto con `front_corregido_tr`.

## Configuración

Crear `.env` en la raíz del backend (se puede usar la plantilla local
`.env.example` si está disponible) y completar `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`,
`DB_NAME` y `jwt_key`. `PORT` es opcional y utiliza 3000 por defecto.

`UPLOADS_DIR` es opcional. Sin configurarlo se usa `uploads` dentro del
directorio de trabajo del backend. Para usar otro disco o un servidor de
archivos institucional, monta el almacenamiento en el sistema operativo y
configura la ruta absoluta de esa carpeta, por ejemplo
`UPLOADS_DIR=/mnt/archivos-tramites`. La carpeta configurada debe existir,
estar accesible para lectura y escritura y estar montada antes de iniciar el
backend. Configura el servicio para depender del montaje si el destino es
remoto. La ruta configurada no se crea automáticamente.
Para esta institución, utilizar una base de datos propia o una copia de la
anterior: editar esta carpeta no separa automáticamente los datos de PostgreSQL.

## Inicio

Desde esta carpeta:

```powershell
npm run start:dev
```

Desde `front_corregido_tr`, en otra terminal:

```powershell
npm start
```

Abrir `http://localhost:4200/`. El frontend de desarrollo utiliza la API
`http://localhost:3000`.

Las dependencias se instalan con `npm ci` en cada carpeta. Para compilar el
backend, ejecutar `npm run build`; para sus pruebas, `npm test -- --runInBand`.
Para comprobar el frontend en desarrollo, ejecutar
`node node_modules/@angular/cli/bin/ng.js build --configuration=development`
desde su carpeta. Para compilar el frontend para producción, ejecutar
`npm run build` en el frontend.
La configuración actual del backend conserva `synchronize: true`; al iniciarlo,
TypeORM puede actualizar el esquema de la base configurada.

## Tabla retirada

`conocimiento_tramite` era exclusiva de la consulta asistida. La entidad
retirada no declaraba claves foráneas y las demás entidades del proyecto no
la referencian. También se comprobó, con una conexión de solo lectura a la
base configurada, que actualmente no hay claves foráneas entrantes ni salientes
para esta tabla. Retirar el módulo no borra esa tabla ni sus registros.

Antes de eliminarla de la base de esta institución, hacer un respaldo y
comprobar las dependencias reales de PostgreSQL. Por ejemplo, esta consulta
de solo lectura muestra claves foráneas entrantes y salientes:

```sql
SELECT conname, conrelid::regclass AS tabla_origen,
       confrelid::regclass AS tabla_referenciada
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid = to_regclass('public.conocimiento_tramite')
       OR confrelid = to_regclass('public.conocimiento_tramite'));
```

Si ya no se necesita su contenido, eliminar únicamente esa tabla, sin
`CASCADE`. PostgreSQL bloqueará la eliminación si existen objetos dependientes
que deban resolverse. Se perderán los registros de conocimiento de esa tabla;
los trámites y las demás tablas no se eliminan con ella.
