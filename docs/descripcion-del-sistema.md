# Descripción del sistema

## WebApp de Control de Gastos de Empleados

> Este documento es la fuente de verdad viva del sistema. Se actualiza automáticamente
> (por el agente `system-doc-sync`) cada vez que el código cambia de forma que afecta
> el comportamiento descrito aquí. Ver también `docs/` para documentación técnica
> por módulo.

---

## 1. Objetivo del sistema

Desarrollar una WebApp sencilla, moderna y responsive para registrar, administrar y
analizar los gastos de empleados.

El sistema tendrá dos módulos principales: **Empleados** y **Administración**. Los
empleados podrán reportar gastos desde su celular de forma rápida, mientras que
Administración podrá consolidar la información, revisar los registros, administrar
usuarios y analizar el comportamiento de los gastos mediante un Dashboard gerencial.

La prioridad del sistema es simplicidad, rapidez, facilidad de uso móvil, seguridad y
capacidad de crecimiento futuro.

## 2. Módulos principales

- Módulo de Empleados
- Módulo de Administración

## 3. Módulo de Empleados

Después de iniciar sesión, el empleado tendrá una interfaz extremadamente sencilla con
las opciones de reporte que le correspondan según su rol. Para el rol `EMPLOYEE` (y
`EMPLEADO_INDIRECTO`, que usa exactamente la misma interfaz):

- Desayuno
- Almuerzo
- Cena
- Kilometraje
- Reparación de llantas

Los roles `CAJA_CHICA` y `HOTEL` ven una interfaz con una sola categoría propia en vez
de estas cinco — ver sección 3.1.

El empleado únicamente podrá consultar y administrar sus propios registros. No tendrá
acceso a información de otros empleados ni al Dashboard administrativo.

### 3.1 Roles y categorías adicionales (adición posterior al documento base)

Además de `EMPLOYEE` y `ADMIN`, el sistema contempla tres roles más, todos con la
misma protección de acceso (cada quien solo ve lo suyo):

- **`EMPLEADO_INDIRECTO`** ("Empleado no directo"): interfaz idéntica a `EMPLOYEE`
  (mismas 5 categorías). Existe como rol separado únicamente para poder
  identificar y presupuestar aparte los gastos de personal no directo — ver
  presupuesto mensual por rol en la sección 11 y en Configuración.
- **`CAJA_CHICA`**: una sola categoría genérica ("Caja chica"), sin las categorías
  fijas de comida/kilometraje. El formulario pide monto, moneda, foto del
  comprobante y una **descripción obligatoria** ("¿En qué se gastó?") — a
  diferencia del resto de categorías, donde la descripción no existe.
- **`HOTEL`**: perfil especial — en vez de nombre/apellido tiene **nombre del
  hotel** y una **tarifa por noche** (`nightly_rate`) que configura el
  administrador. Reporta "Hospedajes" (fecha, noches, la tarifa que el hotel dice
  haber aplicado, foto de la factura y descripción opcional). El monto que
  realmente se paga se calcula con noches × tarifa configurada por el admin en
  el perfil del hotel, **no** con la tarifa que el hotel reporta; si ambas
  tarifas no coinciden, el administrador ve una alerta visible al revisar ese
  gasto. A diferencia de las demás categorías (una vez por día), un hotel puede
  reportar varias estadías el mismo día — la vista de detalle de día lista cada
  una por separado con la opción de "agregar otra".

Los códigos de empleado (sección 8) usan un prefijo distinto por rol: `A`
(admin), `E` (empleado), `N` (no directo), `C` (caja chica), `H` (hotel).

## 4. Registro de desayuno, almuerzo y cena

Cada registro de alimentación deberá permitir:

- Fecha (no se puede reportar más de 5 semanas atrás ni con fecha futura — ver
  sección 6)
- Hora
- Monto
- Moneda (USD o CRC)
- Fotografía del comprobante

> Estos tres formularios ya no incluyen un campo de descripción (se quitó por
> ser innecesario en la práctica). La única categoría con descripción — y
> obligatoria — es Caja chica (sección 3.1). Reparación de llantas usa el mismo
> formulario que estos tres, sin descripción.

La fotografía podrá tomarse directamente con la cámara del celular o seleccionarse
desde una fotografía previamente almacenada en el dispositivo.

Antes de enviar el gasto, el usuario deberá poder visualizar el comprobante.

Al enviar el registro, el sistema deberá asociarlo automáticamente con el empleado
autenticado, guardar la fecha y hora, almacenar el gasto y guardar la referencia de la
fotografía.

El estado inicial será: **Reportado**.

## 5. Registro de kilometraje

> Simplificado respecto al diseño original de este documento (adición
> posterior): el empleado ya no escribe lugares, horas ni números de odómetro —
> solo reporta la evidencia; el administrador es quien asigna los kilómetros y
> el sistema calcula el monto a pagar.

El formulario que llena el empleado solo pide:

- Fecha (mismo límite de 5 semanas atrás que el resto de categorías).
- **Fotografía de inicio**: evidencia del odómetro al comenzar el trayecto.
- **Fotografía final**: evidencia del odómetro al finalizar el trayecto.

Ambas fotografías podrán tomarse con la cámara del celular o seleccionarse desde la
galería. El gasto se crea con monto 0 y queda como "Sin km asignados" hasta que
Administración lo revisa.

Al revisar el gasto, el administrador escribe los kilómetros recorridos (a partir de
lo que ve en las fotos del odómetro) y el sistema calcula automáticamente:

```
Monto a pagar = Kilómetros asignados × Tarifa por km (configurada en Configuración)
```

La tarifa por km es un solo valor global que el administrador configura en
Configuración (sección 21, adición posterior) — no varía por empleado.

## 6. Historial del empleado

El empleado tendrá una sección denominada "Mis Gastos", donde podrá consultar
únicamente sus propios registros de la semana seleccionada, con **navegación
semanal** (← Anterior / Siguiente →, acotada a 5 semanas hacia atrás y 5 hacia
adelante — adición posterior a este documento). Por la misma razón, un
empleado no puede reportar un gasto con fecha de más de 5 semanas atrás (ver
secciones 4 y 5) — el límite se valida tanto en el campo de fecha del
formulario como en el servidor.

La información deberá mostrar como mínimo:

- Fecha
- Tipo de gasto
- Monto
- Estado
- Comprobante

Los estados contemplados serán:

- Reportado
- Aprobado
- Rechazado

En caso de rechazo, Administración podrá registrar un motivo.

La vista de detalle de un día (`/empleado/dia/[fecha]`) muestra, además del estado de
cada categoría, una tarjeta de **"Total del día"** con el monto total reportado ese
día (y el total de noches, cuando aplica a Hospedaje) — adición posterior a este
documento.

## 7. Módulo de Administración

El módulo administrativo deberá incluir:

- Dashboard
- Gastos
- Empleados
- Reportes

El administrador tendrá acceso completo a la información y podrá gestionar los
registros manualmente o utilizando los datos enviados por los empleados.

## 8. Administración de empleados

El administrador podrá crear tantos usuarios como necesite, sin que la aplicación
imponga un límite fijo.

Datos principales:

- Nombre (un hotel solo tiene "nombre del hotel", sin apellido)
- Apellido
- Email / usuario
- Teléfono (opcional)
- **Cédula** (opcional) — adición posterior a este documento
- **Número de cuenta bancaria** (opcional) — adición posterior a este documento
- Contraseña temporal (editable/generable, ver detalle de Fase 1)
- Rol: Empleado / Empleado no directo / Caja chica / Hotel / Administrador
  (ver sección 3.1 para el detalle de los tres roles añadidos)
- Estado: Activo / Inactivo
- Departamento (opcional)
- Puesto (opcional)
- Código de empleado (opcional; se autogenera si se deja en blanco)
- **Tarifa por noche** (solo rol Hotel) — usada para calcular el monto de sus
  hospedajes, ver sección 3.1

Acciones disponibles:

- Crear usuario
- Editar usuario
- Activar / desactivar usuario
- Restablecer contraseña
- Eliminar usuario

La sección se llama **"Usuarios"** (renombrada de "Empleados") y separa la lista en
cinco pestañas — Empleados, No directos, Caja chica, Hoteles, Admins — cada una con
su conteo en el título. El formulario de "Crear" ya no tiene un desplegable de Rol:
el rol lo determina la pestaña activa cuando se abre "+ Nuevo" o "Crear varios", así
no se puede dejar el rol en un valor equivocado por accidente.

## 9. Administración de gastos

Administración tendrá una tabla central con todos los gastos.

Información principal:

- Fecha
- Empleado
- Tipo
- Monto
- Moneda
- Kilometraje, cuando aplique
- Estado
- Comprobante
- Acciones

El administrador podrá:

- Ver
- Editar
- Eliminar
- Aprobar
- Rechazar
- Crear gastos manualmente

La creación manual es importante para permitir registrar gastos que no hayan sido
ingresados directamente por el empleado.

## 10. Filtros

La sección de gastos deberá permitir filtrar y combinar criterios:

**Por fecha:**
- Hoy
- Esta semana
- Este mes
- Mes anterior
- Rango personalizado

**Por empleado:**
- Uno o varios empleados

**Por categoría:**
- Desayuno
- Almuerzo
- Cena
- Kilometraje
- Reparación de llantas
- Caja chica
- Hospedaje

**Por estado:**
- Reportado
- Aprobado
- Rechazado

Ejemplo de filtro combinado: *Agosto 2026 + Juan Pérez + Almuerzo*.

## 11. Dashboard gerencial

El Dashboard deberá ser visual, moderno y fácil de entender para gerencia. Deberá
incluir tarjetas KPI, gráficos, líneas de tendencia, rankings y comparaciones.

Indicadores principales:

- Gasto total
- Total de desayunos
- Total de almuerzos
- Total de cenas
- Total de kilómetros
- Promedio de gasto por empleado

Adición posterior a este documento: si el administrador configuró un **presupuesto
mensual por rol** (Caja chica y/o Empleados no directos, en Configuración), el
Dashboard muestra una tarjeta comparando el gasto real del mes contra ese
presupuesto para cada uno de esos dos roles (0 = sin presupuesto configurado, la
tarjeta no aparece).

## 12. Gráficos y análisis

El Dashboard deberá incluir como mínimo:

1. Tendencia de gastos a través del tiempo.
2. Distribución de gastos por categoría.
3. Ranking de empleados por gasto, ordenado de mayor a menor.
4. Comparación del mes actual contra el mes anterior.

La comparación mensual deberá mostrar tanto el valor de cada período como la
variación porcentual.

Los gráficos deberán utilizar colores diferenciados por categoría y ser fáciles de
interpretar.

## 13. Alertas y anomalías

Como funcionalidad de mejora, el sistema podrá identificar situaciones como:

- Empleados con gastos significativamente superiores al promedio.
- Incrementos importantes del gasto mensual.
- Cantidad elevada de gastos pendientes de aprobación.

Ejemplo: *"El gasto de un empleado está 32% por encima del promedio."*

Estas alertas podrán implementarse inicialmente mediante reglas estadísticas
sencillas, sin necesidad de inteligencia artificial.

## 14. Reportes y exportación

Administración deberá poder generar reportes por:

- Mes
- Empleado
- Categoría
- Estado

Debe existir una opción para exportar los resultados a CSV o Excel.

El archivo CSV deberá incluir como mínimo:

- Fecha
- Empleado
- Categoría
- Monto
- Moneda
- Estado
- Kilometraje cuando aplique
- **Cédula y número de cuenta bancaria** del empleado — adición posterior a este
  documento

### Cierre de mes (adición posterior a este documento)

Además del CSV con los filtros activos, Reportes tiene un botón **"Generar cierre de
mes"** que descarga un `.xlsx` (generado en el servidor con el paquete `exceljs`)
respetando solo el período seleccionado (ignora los demás filtros) y **solo incluye
gastos en estado Aprobado** — un cierre de mes es lo que realmente se debe pagar. El
libro tiene una hoja "Resumen" (total y cantidad de personas por tipo de usuario) más
una hoja por tipo — Empleados, No directos, Caja chica, Hoteles — con ID, Nombre,
Cédula, Cuenta bancaria, subtotal por categoría y Total por persona (u hotel).

## 15. Stack tecnológico obligatorio

La aplicación utilizará obligatoriamente:

- Vercel para hosting y deployment.
- Supabase como backend principal.
- Supabase PostgreSQL como base de datos.
- Supabase Auth para autenticación.
- Supabase Storage para fotografías y comprobantes.
- Supabase Row Level Security (RLS) para seguridad y control de acceso.

Stack preferido:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

Arquitectura objetivo:

```
Usuario → Vercel → Aplicación Web → Supabase
```

Para archivos:

```
Usuario → Aplicación → Supabase Storage
```

## 16. Seguridad

La seguridad deberá implementarse tanto a nivel de aplicación como directamente en
Supabase.

Roles:

- **ADMIN**
- **EMPLOYEE**

> Adición posterior a este documento: los roles `EMPLEADO_INDIRECTO`, `CAJA_CHICA`
> y `HOTEL` (sección 3.1) siguen exactamente la misma regla de acceso que
> `EMPLOYEE` a nivel de RLS — cualquier rol distinto de `ADMIN` solo puede leer y
> crear sus propios registros.

Un `EMPLOYEE` solamente podrá leer y crear sus propios registros y acceder a sus
propias fotografías.

Un `ADMIN` podrá acceder a todos los empleados, gastos, fotografías, reportes y
Dashboard.

La seguridad no debe depender únicamente del frontend. Las políticas RLS deberán
implementarse correctamente en Supabase.

Las contraseñas deberán manejarse mediante Supabase Auth y nunca almacenarse
manualmente en texto plano.

## 17. Almacenamiento de imágenes

Las fotografías deberán almacenarse mediante Supabase Storage. No almacenar las
imágenes directamente dentro de PostgreSQL. La base de datos deberá guardar las
referencias necesarias a los archivos.

Deberán contemplarse:

- Comprobantes de alimentación
- Fotografía de odómetro inicial
- Fotografía de odómetro final

El acceso a las fotografías deberá estar protegido mediante autenticación y políticas
de acceso apropiadas.

## 18. Base de datos

La estructura mínima deberá contemplar (ver `docs/database-schema.md` para el
esquema real completo y actualizado, incluyendo RLS):

### USERS / PROFILES
- id
- first_name
- last_name
- email
- role (`ADMIN` / `EMPLOYEE` / `EMPLEADO_INDIRECTO` / `CAJA_CHICA` / `HOTEL` —
  los tres últimos son adición posterior, ver sección 3.1)
- status
- department
- position
- phone
- **cedula** — adición posterior
- **bank_account** — adición posterior
- **nightly_rate** — solo rol Hotel, adición posterior
- employee_code
- created_at

### EXPENSES
- id
- user_id
- type (incluye `REPARACION_LLANTAS`, `CAJA_CHICA`, `HOSPEDAJE` — adición
  posterior, ver sección 3.1)
- date
- time
- amount
- currency
- description
- **nights** — solo Hospedaje, adición posterior
- **reported_rate** — solo Hospedaje, tarifa que el hotel dice haber aplicado,
  adición posterior
- status
- rejection_reason
- created_at
- updated_at

### MILEAGE
- id
- expense_id
- start_location
- end_location
- start_time
- end_time
- initial_odometer
- final_odometer
- kilometers

### EXPENSE_PHOTOS
- id
- expense_id
- photo_type
- file_url
- created_at

### APP_SETTINGS (adición posterior a este documento)

Fila única de configuración global (ver sección 5, 11 y 21): presupuestos
semanales por categoría de comida, presupuestos mensuales por rol (Caja
chica / No directos), tarifa por km y día de pago semanal. Editable solo por
un admin desde Configuración.

> La estructura puede modificarse si existe una arquitectura técnicamente superior,
> siempre que se mantenga la funcionalidad requerida.

## 19. Experiencia móvil

La aplicación será utilizada principalmente desde teléfonos celulares. Por ello deberá
ser Mobile-First y responsive.

El módulo de empleados deberá priorizar:

- Botones grandes.
- Formularios cortos.
- Pocos pasos.
- Acceso sencillo a la cámara.
- Selección de fotografías desde la galería.
- Confirmación antes de enviar.
- Buena experiencia tanto en Android como en iPhone.

## 20. Arquitectura y deployment

El proyecto deberá estar preparado para trabajar con:

```
GitHub → Vercel → Supabase
```

Las variables de entorno deberán utilizarse para configurar las credenciales y URLs
necesarias. Nunca se deberán exponer claves privadas o secretos en el frontend.

Las modificaciones de estructura de base de datos deberán poder reproducirse mediante
migraciones SQL de Supabase.

El proyecto debe ser fácil de desarrollar localmente, mantener y desplegar.

## 21. Desarrollo por fases

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Autenticación y usuarios | ✅ Completada |
| 2 | Registro de desayuno, almuerzo y cena | ✅ Completada |
| 3 | Carga de fotografías | ✅ Completada |
| 4 | Registro de kilometraje con fotografías inicial/final | ✅ Completada |
| 5 | Historial del empleado | ✅ Completada |
| 6 | Panel administrativo de gastos | ✅ Completada |
| 7 | Dashboard gerencial | ✅ Completada |
| 8 | Reportes y exportación | ✅ Completada |
| 9 | Seguridad, validaciones y pruebas | ✅ Pasada de hardening aplicada |
| 10 | Roles adicionales (No directo/Caja chica/Hotel), presupuestos, kilometraje asignado por admin y cierre de mes | ✅ Completada (adición posterior a este documento) |

### Fase 1 — detalle de lo implementado

- Scaffold del proyecto: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4,
  desplegable en Vercel.
- Autenticación con Supabase Auth (email + contraseña). Sin auto-registro público:
  los usuarios los crea Administración (sección 8). El login acepta **ID de
  empleado (ej. `E001`) o correo** en el mismo campo — si lo que se escribe no
  tiene `@`, el servidor lo resuelve a su correo real antes de autenticar
  (`src/app/login/actions.ts`).
- `proxy.ts` (equivalente a middleware en Next 16) protege todas las rutas:
  redirige a `/login` si no hay sesión, y separa `/admin` vs `/empleado` según el
  rol del perfil.
- Módulo de Administración → Empleados: crear, editar, activar/desactivar,
  restablecer contraseña y eliminar usuarios, con contraseña temporal generada
  automáticamente y mostrada una sola vez al admin (sección 8 completa). La
  contraseña (al crear y al restablecer) es **editable**: el campo trae un PIN
  de 4 dígitos generado como sugerencia, con botón "Generar" para otro nuevo,
  pero el admin puede escribir la que quiera (mínimo 4 caracteres — requiere que en Supabase la longitud mínima de contraseña esté en 4, ver docs/supabase-setup.md).
- Creación masiva ("Crear varios"): el admin solo elige cuántas cuentas de
  empleado crear (sin nombres todavía) y el sistema las crea de una vez con
  nombre de marcador ("Empleado 1", "Empleado 2"...), un **ID único**
  autogenerado (letra de rol + 3 dígitos secuenciales — `A001`, `A002`...
  admin, `E001`... empleado, `N001`... no directo, `C001`... caja chica,
  `H001`... hotel — cada rol con su propio contador), correo autogenerado
  (`nombre.apellido@zerogap.app` o similar) y contraseña temporal — un PIN
  numérico de 4 dígitos en vez de una contraseña alfanumérica, para que sea
  fácil de leer y escribir por empleados con poca familiaridad con
  contraseñas. Muestra una tabla con ID+usuario+contraseña de cada una para
  repartirlas. Más adelante, cuando el admin sabe a qué persona le va a asignar
  cada cuenta, la identifica por su ID y le pone el nombre real desde "Editar"
  — no hay que volver a crearla. El ID también se puede escribir a mano al
  crear un empleado individual (columna "ID" en la tabla, campo `employee_code`
  en la base de datos).
- La lista de Usuarios (renombrada de "Empleados" — adición posterior a este
  documento) usa un diseño compacto de filas (no tabla ancha con scroll
  horizontal): "Editar" expande el formulario de edición directamente debajo
  de la fila en vez de abrir un popup — pensado para uso cómodo en celular.
  Cinco pestañas (Empleados / No directos / Caja chica / Hoteles / Admins,
  cada una con su contador) separan la lista por rol, y determinan el rol con
  el que se crea un usuario nuevo desde esa pestaña (ya no hay un desplegable
  de "Rol" en el formulario de creación).
- Esquema de base de datos y políticas RLS iniciales (`supabase/migrations/0001_init.sql`),
  cubriendo `profiles`, `expenses`, `mileage`, `expense_photos` y el bucket de
  Storage `receipts` — ver `docs/database-schema.md`.
- Shells de navegación para Empleados (4 accesos + Mis Gastos) y Administración
  (Dashboard / Gastos / Empleados / Reportes), con las pantallas de fases
  posteriores como placeholders "próximamente" para no bloquear la navegación.
- PWA instalable en Android/Chrome: manifest, service worker de app-shell y
  banner de instalación personalizado (ver sección 19 y `docs/pwa.md`).
- Campo **teléfono** agregado al perfil del empleado (`supabase/migrations/0002_add_employee_phone.sql`),
  editable desde crear/editar empleado.

### Fases 2-5 — detalle de lo implementado (módulo Empleado)

- `/empleado/desayuno`, `/almuerzo`, `/cena`, `/empleado/reparacion-llantas`:
  mismo formulario reutilizable (`MealExpenseForm`) parametrizado por tipo —
  fecha (mínimo 5 semanas atrás, máximo hoy — `minReportableDate()` en
  `src/lib/week.ts`, validado también en el servidor), hora, monto, moneda
  (USD/CRC) y foto de comprobante obligatoria, con vista previa antes de
  enviar. **El campo de descripción se quitó de estos formularios** (adición
  posterior a este documento) — solo Caja chica lo pide, y ahí es obligatorio
  (`requireDescription`).
- `/empleado/kilometraje`: **simplificado** (adición posterior a este
  documento) a solo fecha + dos fotos obligatorias (odómetro inicial y
  final) — ya no pide lugares, horas ni números de odómetro. El gasto se crea
  con monto 0; el administrador asigna los kilómetros al revisar las fotos y
  el sistema calcula el monto con la tarifa de Configuración (ver sección 5 y
  Fase 6 más abajo).
- Captura de foto (`PhotoCapture`): dos botones separados — "Tomar foto"
  (abre la cámara, `capture="environment"`) y "Elegir de galería" — en vez de
  un solo input, porque en varios navegadores móviles un input con `capture`
  abre la cámara directo y oculta la opción de galería.
- Las fotos se comprimen en el navegador antes de subirse (`compressImage`:
  redimensiona a máx. 1600px de lado mayor y reexporta como JPEG calidad
  ~0.82 vía Canvas) — una foto de cámara de celular puede pesar varios MB;
  comprimida ocupa una fracción del espacio en Storage y sube más rápido. Si
  la compresión falla, se sube el archivo original sin bloquear el envío.
- Las fotos se suben a Supabase Storage (bucket privado `receipts`, ruta
  `{user_id}/{expense_id}/{archivo}`) usando la sesión del propio empleado
  (RLS, no el cliente admin) — coherente con "cada quien sube lo suyo".
- `next.config.ts` sube el límite de tamaño de envío de Server Actions a
  25 MB (`experimental.serverActions.bodySizeLimit`) — el límite por defecto
  de Next (1 MB) es insuficiente para una foto de cámara sin comprimir, y
  kilometraje manda 2 fotos en el mismo envío.
- Inicio del empleado (`/empleado`): la tarjeta "Mi semana" (`WeekTracker`) se
  muestra primero en la página (se quitó el texto de leyenda que había debajo
  del encabezado — adición posterior a este documento), con los 7 días de la
  semana actual (lunes a domingo) y una bolita por día con el número de
  reportes diarios que ya envió — gris si 0, ámbar si incompleto, verde si
  llegó a la meta del día. La meta y qué cuenta como "un reporte" dependen del
  rol (`dailyTypesForRole`/`optionsForRole` en
  `src/lib/employee-categories.tsx`): 4 para Empleado/No directo
  (Desayuno/Almuerzo/Cena/Kilometraje — Llantas no cuenta, no es rutina
  diaria), 1 para Caja chica y 1 para Hotel. Debajo, los botones de categoría
  se muestran centrados y compactos en una grilla de 2 columnas.
- Cada día es un enlace a `/empleado/dia/[fecha]`, que muestra las categorías
  del día según el rol: si ya se reportó, su estado (Reportado/Aprobado/
  Rechazado con motivo); si falta, un botón "Reportar" que lleva al
  formulario de esa categoría con la fecha ya puesta (parámetro `?date=`). Al
  enviar un gasto, el sistema redirige de vuelta a esta vista del día (en vez
  de a "Mis Gastos") para poder seguir completando lo que falte de una vez.
  Arriba de la lista hay una tarjeta **"Total del día"** (monto total, y
  noches totales si aplica) — adición posterior a este documento. Las
  categorías marcadas `allowMultiple` (hoy solo Hospedaje) no se limitan a un
  slot por día: se listan todas las reportadas ese día con la opción
  "+ Reportar otra estadía".
- `/empleado/mis-gastos`: historial de gastos propios de la semana
  seleccionada, con **navegación semanal** (← Anterior / Siguiente →, acotada
  a ±5 semanas — adición posterior a este documento), un KPI de "Listo para
  pagar" con el total aprobado de la semana pasada y su desglose
  (`PaymentKpi`), estado (Reportado/Aprobado/Rechazado), motivo de rechazo
  cuando aplica, y enlace al comprobante (URL firmada de Storage, válida 1
  hora). El inicio del empleado también muestra un aviso con el **monto**
  (no solo la fecha) que se le pagará de la semana pasada y el día de pago
  configurado en Configuración.
- Todo el envío de gastos usa Server Actions (`src/app/empleado/actions.ts`)
  que insertan el `expense` primero y luego la foto — si la foto falla, se
  revierte el `expense` para no dejar registros huérfanos sin comprobante.

### Fase 6 — detalle de lo implementado (Admin → Gastos)

> Adición posterior a este documento: `/admin/gastos` se rediseñó como una
> lista de empleados (con el conteo de reportes y pendientes de la semana
> actual, `GastosEmployeeList`) que lleva al detalle de un empleado
> (`/admin/gastos/[userId]`) con navegación semanal (← Anterior / Siguiente →,
> sin límite en este caso porque es el admin quien navega) y el resumen de
> presupuesto de esa semana. `/admin/reportes` conserva la tabla con todos los
> gastos y los filtros descritos abajo.

- Tabla compacta de gastos (mismo patrón de filas que Usuarios, con "Editar"
  en línea en vez de popup) con: fecha, empleado, categoría, monto o km,
  estado, comprobante.
- Acciones: Aprobar / Rechazar (con motivo, solo cuando está "Reportado"),
  Editar (monto/moneda/fecha/hora — no aplica a Kilometraje), Eliminar, y
  **Crear gasto manual** (el admin lo registra a nombre de un empleado; útil
  para gastos que no pasaron por el flujo normal). Cuando el diálogo se abre
  desde la página de un solo empleado, la categoría disponible se limita a lo
  que ese rol puede reportar (`optionsForRole`) — adición posterior a este
  documento, evita crear p. ej. "Desayuno" para un Hotel.
- **Asignar kilometraje** (adición posterior a este documento): para un gasto
  de Kilometraje sin km asignados, "Editar" muestra un formulario para que el
  admin escriba los km recorridos; el sistema calcula el monto
  (km × tarifa de Configuración) y lo guarda junto con una fila en `mileage`
  (`assignMileageKm` en `src/app/admin/gastos/actions.ts`).
- **Alerta de tarifa de hotel** (adición posterior a este documento): si un
  gasto de Hospedaje tiene una tarifa reportada por el hotel distinta a la
  tarifa configurada en su perfil, la fila muestra una alerta visible con
  ambos valores.
- Filtros combinables (en `/admin/reportes`): fecha (hoy/semana/mes/mes
  anterior/rango personalizado), empleado (uno o varios), categoría, estado —
  vía querystring en un `<form method="get">`, sin JavaScript de por medio.

### Configuración (adición posterior a este documento)

`/admin/configuracion` — pantalla rediseñada con tres tarjetas:

- **Presupuesto semanal por empleado**: total y por categoría de comida
  (Desayuno/Almuerzo/Cena) — solo informativo, 0 = sin aviso.
- **Presupuesto mensual por rol**: Caja chica y Empleados no directos — solo
  informativo, comparado contra el gasto real del mes (ver sección 11).
- **Kilometraje**: tarifa por km (CRC) usada para calcular el monto cuando el
  admin asigna kilómetros (ver Fase 6 arriba).
- **Día de pago**: día de la semana en que se paga la semana anterior — el
  empleado lo ve en su inicio junto con el monto (sección "Fases 2-5").

### Fase 7 — detalle de lo implementado (Dashboard)

- KPIs: gasto total (con variación % vs. mes anterior), total por categoría de
  comida, total de kilómetros, promedio de gasto por empleado activo.
- Gráfico de tendencia (línea, gasto por día del mes) y de distribución por
  categoría (barras, solo las 3 categorías monetarias — kilometraje no se
  mezcla en la misma escala por tratarse de una unidad distinta, km vs.
  dinero).
- Ranking de empleados por gasto (barras horizontales, top 8).
- Colores por categoría fijos (no ciclan): Desayuno=azul, Almuerzo=naranja,
  Cena=aqua, Kilometraje=amarillo, Reparación de llantas=magenta, Caja
  chica=verde, Hospedaje=violeta — paleta validada para daltonismo (skill
  `dataviz`), tokens en `globals.css` (`--chart-series-1..7`).
- Tarjeta de **presupuesto mensual por rol** (adición posterior a este
  documento): ver sección 11.

### Fase 8 — detalle de lo implementado (Reportes)

- `/admin/reportes`: mismos filtros que Gastos, tabla de vista previa, botón
  "Descargar CSV".
- `/admin/reportes/export` (route handler): genera el CSV en el servidor con
  las columnas de la sección 14 (Fecha, Empleado, Categoría, Monto, Moneda,
  Estado, Kilometraje, Cédula, Cuenta bancaria), respetando los filtros
  activos.
- `/admin/reportes/cierre-mes` (route handler, adición posterior a este
  documento): genera el `.xlsx` de cierre de mes descrito en la sección 14
  usando `exceljs`.

### Fase 9 — detalle de lo implementado (seguridad/validación)

- **Corregido durante esta pasada**: `createExpenseManual` usaba el cliente
  admin (salta RLS) sin verificar primero que quien llama sea ADMIN — ya
  corregido, ahora todas las acciones admin llaman `assertIsAdmin()` primero.
- Validación de fotos en el servidor (tipo imagen, máx. 10 MB) además del
  `accept="image/*"` del cliente, que un usuario podría saltarse.
- Extensión de archivo saneada (`[a-z0-9]{1,5}`) antes de usarla para
  construir la ruta en Storage — el nombre del archivo lo controla el
  usuario.
- Montos deben ser mayores a cero (comida) o el km final mayor al inicial
  (kilometraje), tanto en el formulario del empleado como en la creación
  manual del admin.

## 22. Consideraciones futuras

El sistema debe mantenerse sencillo en su primera versión, pero la arquitectura debe
permitir incorporar posteriormente políticas de gastos. Por ejemplo:

- Límite máximo para desayuno.
- Límite máximo para almuerzo.
- Límite máximo para cena.
- Tarifa por kilómetro.
- Alertas de gastos fuera de política.

Estas funciones no son obligatorias para el MVP, pero la estructura debe permitir
agregarlas posteriormente sin tener que reconstruir el sistema.

## 23. Principio de diseño

**NO SOBREDISEÑAR.**

El objetivo es crear una aplicación simple de: *Employee Expense Reporting +
Management Dashboard*.

No se deben agregar módulos innecesarios como chat, nómina, vacaciones, CRM, recursos
humanos o contabilidad completa.

Si existe una elección entre una solución sencilla y una solución compleja que logre
el mismo objetivo, se debe elegir la sencilla.

## Resumen

El resultado esperado es una WebApp funcional, desplegable en Vercel y construida
alrededor de Supabase, que permita a los empleados reportar gastos desde el celular y
a Administración controlar, organizar y analizar los gastos mensuales de todos los
empleados.
