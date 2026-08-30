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
| 2 | Registro de desayuno, almuerzo y cena | ⬜ Pendiente |
| 3 | Carga de fotografías | ⬜ Pendiente |
| 4 | Registro de kilometraje con fotografías inicial/final | ⬜ Pendiente |
| 5 | Historial del empleado | ⬜ Pendiente |
| 6 | Panel administrativo de gastos | ⬜ Pendiente |
| 7 | Dashboard gerencial | ⬜ Pendiente |
| 8 | Reportes y exportación | ⬜ Pendiente |
| 9 | Seguridad, validaciones y pruebas | ⬜ Pendiente |

### Fase 1 — detalle de lo implementado

- Scaffold del proyecto: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4,
  desplegable en Vercel.
- Autenticación con Supabase Auth (email + contraseña). Sin auto-registro público:
  los usuarios los crea Administración (sección 8).
- `proxy.ts` (equivalente a middleware en Next 16) protege todas las rutas:
  redirige a `/login` si no hay sesión, y separa `/admin` vs `/empleado` según el
  rol del perfil.
- Módulo de Administración → Empleados: crear, editar, activar/desactivar,
  restablecer contraseña y eliminar usuarios, con contraseña temporal generada
  automáticamente y mostrada una sola vez al admin (sección 8 completa).
- Creación masiva ("Crear varios"): el admin solo elige cuántas cuentas de
  empleado crear (sin nombres todavía) y el sistema las crea de una vez con
  nombre de marcador ("Empleado 1", "Empleado 2"...), correo autogenerado
  (`empleado1@zerogap.app`) y contraseña temporal — un PIN numérico de 6
  dígitos en vez de una contraseña alfanumérica, para que sea fácil de leer y
  escribir por empleados con poca familiaridad con contraseñas. Muestra una
  tabla con usuario+contraseña de cada una para repartirlas. Más adelante,
  cuando el admin sabe a qué persona le va a asignar cada cuenta, le pone el
  nombre real desde "Editar" en la tabla — no hay que volver a crearla.
- Esquema de base de datos y políticas RLS iniciales (`supabase/migrations/0001_init.sql`),
  cubriendo `profiles`, `expenses`, `mileage`, `expense_photos` y el bucket de
  Storage `receipts` — ver `docs/database-schema.md`.
- Shells de navegación para Empleados (4 accesos + Mis Gastos) y Administración
  (Dashboard / Gastos / Empleados / Reportes), con las pantallas de fases
  posteriores como placeholders "próximamente" para no bloquear la navegación.
- PWA instalable en Android/Chrome: manifest, service worker de app-shell y
  banner de instalación personalizado (ver sección 19 y `docs/pwa.md`).

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
