# Codex agent workflow for logto-x

Este archivo resume las pautas para futuras contribuciones automatizadas y el progreso actual de la refactorización del monorepo.

## Progreso

### Completado
- Mover los generadores de opciones de WebAuthn a un util compartido.
- Refactorizar las rutas de la aplicación y modularizar la aplicación SAML.
- Reemplazar cadenas en inglés por claves de localización en consola y core.
- Actualizar conectores para obtener precios de add‑ons desde la API.
- Introducir helper de cadena aleatoria y eliminar constantes de CAPTCHA.
- Unificar formularios i18n de conectores e implementar `MultiOptionInput`.
- Reintroducir la cabecera COEP y mejorar el registro de revocación de tokens.
- Añadir tipos de SSO al paquete `schemas` y el nuevo icono de aplicación SAML.

### Pendiente
- Revisar los TODO en el código fuente:
  - Mejorar la implementación del hook de omisión de MFA (`use-skip-mfa.ts`).
  - Añadir casos de prueba para el conector SMSAero.
  - Internacionalizar errores en `organization-invitation`.
  - Evaluar utilidades de payload de hooks en `libraries/hook`.
  - Actualizar lógica de usuario para arrays JSONB y correos no verificados.
  - Eliminar la lógica temporal de `verification-records` cuando exista configuración de Account Center.
  - Ajustar el umbral de validación de CAPTCHA.
  - Mover funciones de verificación Social/WebAuthn a una carpeta compartida.
  - Extender las pruebas de `jwt-customizer`.
  - Reducir LOC en `saml-application/anonymous.ts`.
  - Mejorar la validación de experiencia de inicio de sesión para identificadores sociales.
  - Aclarar el uso de `koaApiHooks` (LOG-10147).
  - Garantizar operaciones transaccionales en rutas de conectores (LOG-7260).
  - Refactorizar la función compleja en `oidc/resource.ts`.
  - Monitorizar Google One Tap para soporte CORP.
  - Añadir test de consola para limpiar configuración de `branding`.
  - Renombrar utilidades de pruebas de integración.
  - Completar pruebas de integración pendientes.

Consulta `grep -R "TODO" packages` para la lista completa.

## Cómo ejecutar verificaciones
1. Instalar dependencias con `pnpm i`.
2. Ejecutar `pnpm ci:lint` y `pnpm ci:stylelint` para validar código y estilos.
3. Ejecutar la suite de pruebas con `pnpm ci:test`.

## Guía de commits
- Seguir el formato de commits convencional validado por commitlint.
- Utilizar uno de los scopes soportados: connector, console, core, demo-app, test, phrases, schemas, shared, experience, experience-legacy, deps, deps-dev, cli, toolkit, cloud, app-insights, elements, translate, tunnel, account-elements.
- Mantener los mensajes de commit por debajo de 110 caracteres para CI.

## PDR: Migración a MongoDB, Redis y OpenSearch

Esta sección resume las tareas pendientes para completar la sustitución de PostgreSQL
por MongoDB y los nuevos microservicios. Es prioritario mantener la funcionalidad
original optimizando el rendimiento y la comunicación entre contenedores Docker.

1. **Eliminar dependencias de SQL/Postgres**
   - Reescribir los módulos que usan `@silverhand/slonik` (por ejemplo
     `packages/core/src/database/**`, `packages/cli/src/commands/database/seed/**`
     y `packages/core/src/sentinel/**`) empleando Mongoose o el `mongodb` driver.
   - Adaptar las migraciones (`packages/core/src/migrations`) y queries restantes
     para funcionar sobre un replicaset de MongoDB.

2. **Actualizar CLI y scripts de seed**
   - Modificar `packages/cli` para que las operaciones de instalación y `seed`
     utilicen MongoDB en lugar de PostgreSQL.
   - Eliminar la detección de `postgres --version` y añadir opciones de configuración
     para MongoDB replicaset.

3. **Integrar Redis y OpenSearch**
   - Emplear Redis para caché y almacenamiento de sesiones.
   - Usar OpenSearch para las funcionalidades de búsqueda, eliminando la lógica
     dependiente de SQL.

4. **Actualizar pruebas y pipelines**
   - Ajustar las suites de pruebas para que usen MongoDB, Redis y OpenSearch.
   - Actualizar los flujos de trabajo de GitHub Actions eliminando pasos
     relacionados con PostgreSQL.

5. **Verificación continua**
   - Ejecutar `pnpm i`, `pnpm ci:lint`, `pnpm ci:stylelint` y `pnpm ci:test`
     tras cada etapa para asegurar que la funcionalidad se mantiene.
   - Revisar `docker-compose.yml` para optimizar la comunicación entre contenedores
     y documentar los pasos de despliegue.
