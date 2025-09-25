# OracleDBAdmin

Administrador web de bases de datos **Oracle Express**, desarrollado con **Node.js (Express)** para el backend y **React + Ant Design** para el frontend.

Este proyecto busca replicar la experiencia de herramientas como **DBeaver** o **BeeKeeper**, pero construido de forma didáctica con un stack moderno y portable usando **Docker**.

Se **realizo** todo lo que pidio, diagrama, sincronización, y todo lo del parcial anterior como avance.
---

## 📚 Índice

* [Introducción](#introducción)
* [Objetivo](#objetivo)
* [Arquitectura](#arquitectura)
* [Instalación](#instalación)
* [Backend](#backend)
* [Frontend](#frontend)
* [Rutas principales del backend](#rutas-principales-del-backend)
* [Por qué usar oracledb](#por-qué-usar-oracledb)
* [Visualización con React Flow](#visualización-con-react-flow)
* [Clonación de esquemas Oracle](#clonación-de-esquemas-oracle)
* [Créditos](#créditos)

---

## Introducción

El proyecto consiste en una **aplicación web de administración de Oracle DB**, que permite:

* Conectarse a múltiples instancias Oracle (usuarios distintos en la misma base o bases diferentes).
* Explorar objetos de la base de datos (tablas, vistas, procedimientos, triggers, índices, etc.).
* Ejecutar consultas SQL con soporte para DDL y DML.
* Crear y eliminar objetos desde la interfaz gráfica.
* **Visualizar relaciones entre tablas (ERD)** mediante **React Flow**.
* **Clonar esquemas Oracle** de una base de datos a otra.

---

## Objetivo

Aprender cómo las herramientas de administración de bases de datos utilizan los mismos drivers y estructuras para crear gestores gráficos.

Este proyecto replica algunas funcionalidades básicas de DBeaver, pero implementadas desde cero con **Node.js, Express, oracledb y React**.

---

## Arquitectura

* **Docker**: Contenedor con Oracle XE (imagen de [gvenzl/oracle-xe](https://hub.docker.com/r/gvenzl/oracle-xe)).
* **Backend**: Node.js con Express + oracledb.
* **Frontend**: React con Ant Design, Axios, React Flow.
* **Comunicación**: HTTP REST API.

---

## Instalación

### 1. Levantar Oracle XE con Docker

```yaml
# docker-compose.yml
version: "3"
services:
  oracle:
    image: gvenzl/oracle-xe
    environment:
      ORACLE_PASSWORD: MiPasswordSegura123
      APP_USER: myuser
      APP_USER_PASSWORD: MiPasswordUsuario123
    ports:
      - "1521:1521"
```

```bash
docker-compose up -d
```

Usuarios disponibles:

* `system / MiPasswordSegura123`
* `myuser / MiPasswordUsuario123`

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Backend

El backend se encarga de:

* Validar conexiones.
* Ejecutar queries en Oracle.
* Exponer rutas REST para tablas, vistas, procedimientos, triggers, etc.
* Servir metadata (nombres de columnas, tipos de datos, etc.).

Dependencias principales:

* `express`
* `oracledb`
* `cors`
* `pg`

---

## Frontend

El frontend está hecho en **React** con **Ant Design** y **React Flow**.

### Dependencias principales

* `react`
* `antd`
* `axios`
* `js-cookie`
* `reactflow`

### Componentes destacados

* **Sidebar.jsx** → manejo de conexiones y explorador jerárquico.
* **OutputTable.jsx** → muestra resultados de queries en tablas dinámicas.
* **EditorView.jsx** → editor SQL con import/export y ejecución.
* **getTree.jsx** → construcción del árbol de objetos por conexión.

---

## Rutas principales del backend

* **GET /tree** → obtener árbol de objetos (tablas, vistas, etc.).
* **POST /test** → probar conexión.
* **GET /table/\:owner/\:table** → consultar tabla específica.
* **GET /tables/\:owner** → listar tablas de un esquema.
* **GET /views/\:owner** → listar vistas.
* **GET /body/\:owner/\:name** → cuerpo de un procedimiento/función.
* **POST /query** → ejecutar SQL libre.
* **GET /data-types** → tipos de datos soportados.
* **DELETE /table/\:owner/\:name** → eliminar tabla.
* **DELETE /view/\:owner/\:name** → eliminar vista.
* **POST /erd** → generar el diagrama ERD (estructura y relaciones del esquema).
* **GET /ddl/:owner/:name/:type** → obtener el DDL de un objeto (tabla, vista, procedimiento, etc.).
* **POST /migration/:owner** → clonar o migrar un esquema Oracle hacia otra conexión.

---

## ¿Por qué usar oracledb?

* Permite acceder a **metadata avanzada** (solo se uso para nombres de columnas).
* Es el driver oficial y único disponible para conectar (o solo ese encontre) **Node.js con Oracle**.
* Soporta `autoCommit` y manejo eficiente de resultados en streaming (autocommit para mandar sql con ';').

---

## Visualización con React Flow

Se agregó soporte para **ERD (Entity Relationship Diagram)** usando **React Flow**.

* Cada tabla se renderiza como un nodo.
* Las columnas se listan dentro de cada nodo.
* Las claves foráneas generan **edges** entre nodos.
* Se puede navegar, hacer zoom y mover tablas en el lienzo.

Esto facilita ver la estructura de un esquema completo de forma gráfica.

---

## Clonación de esquemas Oracle

El sistema incluye la opción de **clonar objetos de un esquema origen a otro destino**.

Flujo:

1. Seleccionar conexión **origen** y **destino**.
2. Extraer metadata de todas las tablas, vistas y relaciones.
3. Generar automáticamente los scripts **DDL** para recrear las estructuras.
4. Copiar datos con `INSERT INTO dest_table SELECT * FROM source_table`.

Esto permite **migrar esquemas entre distintas bases Oracle** sin necesidad de exportar/importar manualmente con `expdp/impdp`.

---

## Créditos

* **Autor:** Johnny Josue Melgar Machorro
* **Clase:** Teoría de Base de Datos 2
* **Docente:** Ing. Elvin Joel Deras Tábora
* **Universidad:** UNITEC, San Pedro Sula
* **Fecha:** 24 de septiembre de 2025
