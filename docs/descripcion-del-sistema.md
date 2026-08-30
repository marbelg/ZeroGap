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
cuatro opciones principales:

- Desayuno
- Almuerzo
- Cena
- Kilometraje

El empleado únicamente podrá consultar y administrar sus propios registros. No tendrá
acceso a información de otros empleados ni al Dashboard administrativo.

## 4. Registro de desayuno, almuerzo y cena

Cada registro de alimentación deberá permitir:

- Fecha
- Hora
- Monto
- Moneda (USD o CRC)
- Descripción opcional
- Fotografía del comprobante

La fotografía podrá tomarse directamente con la cámara del celular o seleccionarse
desde una fotografía previamente almacenada en el dispositivo.

Antes de enviar el gasto, el usuario deberá poder visualizar el comprobante.

Al enviar el registro, el sistema deberá asociarlo automáticamente con el empleado
autenticado, guardar la fecha y hora, almacenar el gasto y guardar la referencia de la
fotografía.

El estado inicial será: **Reportado**.

## 5. Registro de kilometraje

El registro de kilometraje deberá permitir documentar un trayecto.

Campos principales:

- Fecha
- Hora de inicio
- Hora de finalización
- Lugar de inicio
- Lugar de destino
- Kilometraje inicial
- Kilometraje final
- Kilómetros recorridos
- Descripción opcional

El sistema calculará automáticamente:

```
Kilómetros recorridos = Kilometraje final - Kilometraje inicial
```

También deberá permitir dos fotografías:

- **Fotografía de inicio**: evidencia del odómetro al comenzar el trayecto.
- **Fotografía final**: evidencia del odómetro al finalizar el trayecto.

Ambas fotografías podrán tomarse con la cámara del celular o seleccionarse desde la
galería.

## 6. Historial del empleado

El empleado tendrá una sección denominada "Mis Gastos", donde podrá consultar
únicamente sus propios registros.

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

- Nombre
- Apellido
- Email / usuario
- Contraseña temporal
- Estado: Activo / Inactivo
- Departamento (opcional)
- Puesto (opcional)
- Código de empleado (opcional)

Acciones disponibles:

- Crear usuario
- Editar usuario
- Activar / desactivar usuario
- Restablecer contraseña
- Eliminar usuario

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

El archivo deberá incluir como mínimo:

- Fecha
- Empleado
- Categoría
- Monto
- Moneda
- Estado
- Kilometraje cuando aplique

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

La estructura mínima deberá contemplar:

### USERS / PROFILES
- id
- first_name
- last_name
- email
- role
- status
- department
- position
- created_at

### EXPENSES
- id
- user_id
- type
- date
- time
- amount
- currency
- description
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
  de 6 dígitos generado como sugerencia, con botón "Generar" para otro nuevo,
  pero el admin puede escribir la que quiera (mínimo 6 caracteres).
- Creación masiva ("Crear varios"): el admin solo elige cuántas cuentas de
  empleado crear (sin nombres todavía) y el sistema las crea de una vez con
  nombre de marcador ("Empleado 1", "Empleado 2"...), un **ID único**
  autogenerado (letra de rol + 3 dígitos secuenciales — `A001`, `A002`... para
  administradores, `E001`, `E002`... para empleados, cada rol con su propio
  contador), correo autogenerado
  (`nombre.apellido@zerogap.app` o similar) y contraseña temporal — un PIN
  numérico de 6 dígitos en vez de una contraseña alfanumérica, para que sea
  fácil de leer y escribir por empleados con poca familiaridad con
  contraseñas. Muestra una tabla con ID+usuario+contraseña de cada una para
  repartirlas. Más adelante, cuando el admin sabe a qué persona le va a asignar
  cada cuenta, la identifica por su ID y le pone el nombre real desde "Editar"
  — no hay que volver a crearla. El ID también se puede escribir a mano al
  crear un empleado individual (columna "ID" en la tabla, campo `employee_code`
  en la base de datos).
- La lista de Empleados usa un diseño compacto de filas (no tabla ancha con
  scroll horizontal): "Editar" expande el formulario de edición directamente
  debajo de la fila en vez de abrir un popup — pensado para uso cómodo en
  celular.
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

- `/empleado/desayuno`, `/almuerzo`, `/cena`: mismo formulario reutilizable
  (`MealExpenseForm`) parametrizado por tipo — fecha, hora, monto, moneda
  (USD/CRC), descripción opcional y foto de comprobante obligatoria, con
  vista previa antes de enviar.
- `/empleado/kilometraje`: fecha, hora inicio/fin, lugar inicio/destino,
  kilometraje inicial/final (calcula los km recorridos en vivo mientras se
  escribe), descripción opcional, y dos fotos obligatorias (odómetro inicial
  y final).
- Captura de foto (`PhotoCapture`): dos botones separados — "Tomar foto"
  (abre la cámara, `capture="environment"`) y "Elegir de galería" — en vez de
  un solo input, porque en varios navegadores móviles un input con `capture`
  abre la cámara directo y oculta la opción de galería.
- Las fotos se suben a Supabase Storage (bucket privado `receipts`, ruta
  `{user_id}/{expense_id}/{archivo}`) usando la sesión del propio empleado
  (RLS, no el cliente admin) — coherente con "cada quien sube lo suyo".
- `/empleado/mis-gastos`: historial de gastos propios con estado
  (Reportado/Aprobado/Rechazado), motivo de rechazo cuando aplica, y enlace
  al comprobante (URL firmada de Storage, válida 1 hora).
- Todo el envío de gastos usa Server Actions (`src/app/empleado/actions.ts`)
  que insertan el `expense` primero y luego la foto — si la foto falla, se
  revierte el `expense` para no dejar registros huérfanos sin comprobante.

### Fase 6 — detalle de lo implementado (Admin → Gastos)

- Tabla compacta de todos los gastos (mismo patrón de filas que Empleados,
  con "Editar" en línea en vez de popup) con: fecha, empleado, categoría,
  monto o km, estado, comprobante.
- Acciones: Aprobar / Rechazar (con motivo, solo cuando está "Reportado"),
  Editar (monto/moneda/fecha/hora/descripción — no aplica a Kilometraje),
  Eliminar, y **Crear gasto manual** (el admin lo registra a nombre de un
  empleado; útil para gastos que no pasaron por el flujo normal).
- Filtros combinables: fecha (hoy/semana/mes/mes anterior/rango
  personalizado), empleado (uno o varios), categoría, estado — vía querystring
  en un `<form method="get">`, sin JavaScript de por medio.

### Fase 7 — detalle de lo implementado (Dashboard)

- KPIs: gasto total (con variación % vs. mes anterior), total por categoría de
  comida, total de kilómetros, promedio de gasto por empleado activo.
- Gráfico de tendencia (línea, gasto por día del mes) y de distribución por
  categoría (barras, solo las 3 categorías monetarias — kilometraje no se
  mezcla en la misma escala por tratarse de una unidad distinta, km vs.
  dinero).
- Ranking de empleados por gasto (barras horizontales, top 8).
- Colores por categoría fijos (no ciclan): Desayuno=azul, Almuerzo=naranja,
  Cena=aqua, Kilometraje=amarillo — paleta validada para daltonismo (skill
  `dataviz`), tokens en `globals.css` (`--chart-series-1..4`).

### Fase 8 — detalle de lo implementado (Reportes)

- `/admin/reportes`: mismos filtros que Gastos, tabla de vista previa, botón
  "Descargar CSV".
- `/admin/reportes/export` (route handler): genera el CSV en el servidor con
  las columnas de la sección 14 (Fecha, Empleado, Categoría, Monto, Moneda,
  Estado, Kilometraje), respetando los filtros activos.

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
