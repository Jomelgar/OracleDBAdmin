const oracledb = require('oracledb');
const { Client } = require("pg");

async function connectToDB(config) {
  return await oracledb.getConnection(config);
}

async function tryExecute(connection, dbaQuery, fallbackQuery, binds = []) {
  try {
    return await connection.execute(dbaQuery, binds);
  } catch (err) {
    if (err.errorNum === 942) { // Error en autorizacion lit
      return await connection.execute(fallbackQuery, binds);
    }
    throw err;
  }
}

exports.getTree = async (req, res) => {
  const { user, password, host, service } = req.query;

  try {
    const connection = await connectToDB({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const ownersResult = await tryExecute(
      connection,
      `SELECT username as owner FROM dba_users ORDER BY username`,
      `SELECT username as owner FROM all_users ORDER BY username`
    );

    const owners = ownersResult.rows.map(row => row[0]);
    const result = [];

    for (const owner of owners) {
      const [
        tablesResult,
        viewsResult,
        indexesResult,
        triggersResult,
        packagesResult,
        proceduresResult,
        functionsResult,
        tablespaceResult,
      ] = await Promise.all([
        tryExecute(
          connection,
          `SELECT table_name FROM dba_tables WHERE owner = :owner`,
          `SELECT table_name FROM all_tables WHERE owner = :owner`,
          [owner]
        ),
        tryExecute(
          connection,
          `SELECT view_name FROM dba_views WHERE owner = :owner`,
          `SELECT view_name FROM all_views WHERE owner = :owner`,
          [owner]
        ),
        tryExecute(
          connection,
          `SELECT object_name FROM dba_objects WHERE object_type = 'INDEX' AND owner = :owner`,
          `SELECT object_name FROM all_objects WHERE object_type = 'INDEX' AND owner = :owner`,
          [owner]
        ),
        tryExecute(
          connection,
          `SELECT trigger_name FROM dba_triggers WHERE owner = :owner`,
          `SELECT trigger_name FROM all_triggers WHERE owner = :owner`,
          [owner]
        ),
        tryExecute(
          connection,
          `SELECT object_name FROM dba_objects WHERE object_type = 'PACKAGE' AND owner = :owner`,
          `SELECT object_name FROM all_objects WHERE object_type = 'PACKAGE' AND owner = :owner`,
          [owner]
        ),
        tryExecute(
          connection,
          `SELECT object_name FROM dba_objects WHERE object_type = 'PROCEDURE' AND owner = :owner`,
          `SELECT object_name FROM all_objects WHERE object_type = 'PROCEDURE' AND owner = :owner`,
          [owner]
        ),
        tryExecute(
          connection,
          `SELECT object_name FROM dba_objects WHERE object_type = 'FUNCTION' AND owner = :owner`,
          `SELECT object_name FROM all_objects WHERE object_type = 'FUNCTION' AND owner = :owner`,
          [owner]
        ),
        tryExecute(
          connection,
          `SELECT tablespace_name FROM dba_tablespaces`,
          `SELECT tablespace_name FROM user_tablespaces`,
          []
        )
      ]);

      result.push({
        owner,
        tables: tablesResult.rows.map(r => r[0]),
        views: viewsResult.rows.map(r => r[0]),
        indexes: indexesResult.rows.map(r => r[0]),
        triggers: triggersResult.rows.map(r => r[0]),
        packages: packagesResult.rows.map(r => r[0]),
        procedures: proceduresResult.rows.map(r => r[0]),
        functions: functionsResult.rows.map(r => r[0]),
        tablespaces: tablespaceResult.rows.map(r=> r[0]),
      });
    }

    await connection.close();
    res.json(result);
  } catch (err) {
    console.error("Error al obtener owners y objetos:", err);
    res.status(500).json({ error: "No se pudo obtener la información." });
  }
};

exports.runQuery = async (req, res) => {
  const { host, user, password, service, query } = req.body;

  try {
    const connection = await connectToDB({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await connection.execute(query, [], { autoCommit: true });
    await connection.close();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getColumns = async (req, res) => {
  const { host, user, password, service } = req.body;
  const { table } = req.params;

  try {
    const connection = await connectToDB({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await tryExecute(
      connection,
      `SELECT column_name, nullable, data_type, data_default 
       FROM dba_tab_columns WHERE table_name = :table`,
      `SELECT column_name, nullable, data_type, data_default 
       FROM all_tab_columns WHERE table_name = :table`,
      [table.toUpperCase()]
    );

    await connection.close();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.testConnection = async (req, res) => {
  const { user, password, host, service } = req.body;

  try {
    const connection = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    await connection.close();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al conectar a OracleDB:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTable = async (req, res) => {
  const { owner, table } = req.params;
  const { user, password, host, service } = req.query;

  try {
    const connection = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await connection.execute(
      `SELECT * FROM ${owner}.${table}`
    );

    await connection.close();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al conectar a OracleDB:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDataTypes = async (req, res) => {
  const { user, password, host, service } = req.query;

  try {
    const connection = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await tryExecute(
      connection,
      `SELECT DISTINCT data_type AS type_name
       FROM dba_tab_columns
       WHERE owner NOT IN ('SYS', 'SYSTEM')
       ORDER BY type_name`,
      `SELECT DISTINCT data_type AS type_name
       FROM all_tab_columns
       WHERE owner NOT IN ('SYS', 'SYSTEM')
       ORDER BY type_name`
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBody = async (req, res) => {
  const { owner, name } = req.params;
  const { user, password, host, service } = req.query;

  try {
    const connection = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await tryExecute(
      connection,
      `SELECT LISTAGG(text,'') WITHIN GROUP(ORDER BY line)
       FROM dba_source WHERE name = :name AND owner = :owner`,
      `SELECT LISTAGG(text,'') WITHIN GROUP(ORDER BY line)
       FROM all_source WHERE name = :name AND owner = :owner`,
      [name.toUpperCase(), owner.toUpperCase()]
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getViewsFromOwner = async(req,res)=>{
  const { owner } = req.params;
  const { user, password, host, service } = req.query;

  try {
    const connection = await oracledb.getConnection({user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await tryExecute(
      connection,
      `SELECT view_name FROM dba_views WHERE owner = :owner`,
      `SELECT view_name FROM all_views WHERE owner = :owner`,
      [owner]
    );

    const tables = result.rows.map(r => r[0]);
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getTablesFromOwner = async(req,res)=>{
  const { owner } = req.params;
  const { user, password, host, service } = req.query;

  try {
    const connection = await oracledb.getConnection({user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await tryExecute(
      connection,
      `SELECT table_name FROM dba_tables WHERE owner = :owner`,
      `SELECT table_name FROM all_tables WHERE owner = :owner`,
      [owner]
    );

    const tables = result.rows.map(r => r[0]);
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.dropTable = async(req,res)=>{
  const { owner, name } = req.params;
  const { user, password, host, service } = req.query;

  try{
    const connection = await oracledb.getConnection({user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = connection.execute(`DROP TABLE ${owner}.${name} CASCADE CONSTRAINTS`);
    await connection.close();
    res.status(200).json(result);
  }catch(e){
    res.status(500).json({ error: error.message });
  }
} 

exports.dropView = async(req,res)=>{
  const { owner, name } = req.params;
  const { user, password, host, service } = req.query;

  try{
    const connection = await oracledb.getConnection({user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = connection.execute(`DROP VIEW ${owner}.${name}`);
    await connection.close();
    res.status(200).json(result);
  }catch(e){
    res.status(500).json({ error: error.message });
  }
} 

exports.getDiagram = async (req, res) => {
  const { host, user, password, service, owner } = req.body;

  let connection;
  try {
    connection = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    // Función para sanitizar nombres de tablas/columnas
    const sanitize = (name) => name.replace(/[^a-zA-Z0-9_]/g, "_");
    const sanitizeType = (type) => type.replace(/[^a-zA-Z0-9_]/g, "_");

    // 1️⃣ Tablas filtradas por owner y excluyendo tablas de sistema
    const tablesResult = await connection.execute(
      `SELECT table_name FROM all_tables 
       WHERE owner = :owner 
         AND table_name NOT LIKE 'SYS_%' 
         AND table_name NOT LIKE 'WRR$%' 
         AND table_name NOT LIKE 'KU_%'
       ORDER BY table_name`,
      [owner.toUpperCase()]
    );
    const tables = tablesResult.rows.map((r) => r[0]);

    // 2️⃣ Columnas por tabla
    const tableColumns = {};
    for (let table of tables) {
      const cols = await connection.execute(
        `SELECT column_name, data_type 
         FROM all_tab_columns 
         WHERE table_name = :t AND owner = :owner`,
        [table, owner.toUpperCase()]
      );
      tableColumns[table] = cols.rows.map((r) => ({
        name: sanitize(r[0]),
        type: sanitizeType(r[1]),
      }));
    }

    // 3️⃣ Relaciones (FKs) filtradas por owner
    const relsResult = await connection.execute(
      `SELECT a.table_name child_table,
              c_pk.table_name parent_table
       FROM all_cons_columns a
       JOIN all_constraints c ON a.constraint_name = c.constraint_name AND a.owner = c.owner
       JOIN all_cons_columns b ON c.r_constraint_name = b.constraint_name AND c.owner = b.owner
       JOIN all_constraints c_pk ON b.constraint_name = c_pk.constraint_name AND b.owner = c_pk.owner
       WHERE c.constraint_type = 'R'
         AND a.owner = :owner`,
      [owner.toUpperCase()]
    );

    const relations = relsResult.rows.map((r) => ({
      child: sanitize(r[0]),
      parent: sanitize(r[1]),
    }));

    // 4️⃣ Construir Mermaid
    let mermaid = "erDiagram\n";
    tables.forEach((table) => {
      const safeTable = sanitize(table);
      mermaid += `  ${safeTable} {\n`;
      tableColumns[table].forEach((col) => {
        mermaid += `    ${col.type} ${col.name}\n`;
      });
      mermaid += "  }\n";
    });
    relations.forEach((rel) => {
      mermaid += `  ${rel.parent} ||--o{ ${rel.child} : "FK"\n`;
    });

    // 5️⃣ Enviar literal para frontend
    res.json({
      success: true,
      mermaid,
      tables: tables.map(sanitize),
      columns: tableColumns,
      relations,
    });

  } catch (err) {
    console.error("❌ ERD Error:", err);
    res.status(500).json({ success: false, error: err.message || err.toString() });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("❌ Error closing connection:", err);
      }
    }
  }
};

exports.getDDL = async (req, res) => {
  const { owner, name, type } = req.params;
  const { user, password, host, service } = req.query;

  const typeMap = {
    table: "TABLE",
    view: "VIEW",
    index: "INDEX",
    sequence: "SEQUENCE",
    trigger: "TRIGGER",
    procedure: "PROCEDURE",
    function: "FUNCTION",
    package: "PACKAGE",
    package_body: "PACKAGE_BODY"
  };

  const ddlType = typeMap[type];
  if (!ddlType) return res.status(400).json({ error: "Tipo no soportado" });

  try {
    const connection = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const result = await connection.execute(
      `SELECT DBMS_METADATA.GET_DDL(:ddlType, :name, :owner) AS DDL FROM dual`,
      { ddlType, name, owner },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let ddl = result.rows[0].DDL;

    if (ddl instanceof oracledb.Lob) {
      ddl = await new Promise((resolve, reject) => {
        let clobData = "";
        ddl.setEncoding("utf8");
        ddl.on("data", (chunk) => (clobData += chunk));
        ddl.on("end", () => resolve(clobData));
        ddl.on("error", reject);
      });
    }

    await connection.close();

    res.status(200).json({ ddl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

function mapOracleTypeToPostgres(column) {
  const { DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE } = column;
  switch (DATA_TYPE) {
    case "NUMBER":
      if (DATA_SCALE > 0) return `NUMERIC(${DATA_PRECISION},${DATA_SCALE})`;
      return "NUMERIC";
    case "VARCHAR2":
    case "NVARCHAR2":
      return `VARCHAR(${DATA_LENGTH})`;
    case "CHAR":
    case "NCHAR":
      return `CHAR(${DATA_LENGTH})`;
    case "DATE":
      return "TIMESTAMP";
    case "CLOB":
    case "NCLOB":
      return "TEXT";
    case "BLOB":
      return "BYTEA";
    default:
      return DATA_TYPE; // por si hay otros tipos
  }
}

exports.migrateSchema = async (req, res) => {
  const { owner } = req.params;
  const {
    user, password, host, service,  // Oracle
    pgUser, pgPassword, pgHost, pgPort, pgDatabase // PostgreSQL
  } = req.body;

  try {
    // 🔹 Conexión Oracle
    const oracleConn = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    // 🔹 Conexión PostgreSQL
    const pgClient = new Client({
      user: pgUser,
      password: pgPassword,
      host: pgHost,
      port: pgPort || 5432,
      database: pgDatabase,
    });
    await pgClient.connect();

    // 🔹 Crear esquema en PostgreSQL
    const schemaName = owner.toLowerCase();
    await pgClient.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    const migrated = {};

    // 🔹 Traer tablas
    const tablesResult = await oracleConn.execute(
      `SELECT table_name FROM all_tables WHERE owner = :owner`,
      [owner],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 🔹 Traer vistas
    const viewsResult = await oracleConn.execute(
      `SELECT view_name, text FROM all_views WHERE owner = :owner`,
      [owner],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 🔹 Procesar tablas
    for (let table of tablesResult.rows) {
      const name = table.TABLE_NAME;
      try {
        // Columnas
        const colsResult = await oracleConn.execute(
          `SELECT column_name, data_type, data_length, data_precision, data_scale, nullable
           FROM all_tab_columns
           WHERE owner = :owner AND table_name = :name
           ORDER BY column_id`,
          [owner, name],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const colDefs = colsResult.rows.map(col => {
          const type = mapOracleTypeToPostgres(col);
          const nullable = col.NULLABLE === "N" ? "NOT NULL" : "";
          return `"${col.COLUMN_NAME.toLowerCase()}" ${type} ${nullable}`;
        }).join(", ");

        const createTableSQL = `CREATE TABLE "${schemaName}"."${name.toLowerCase()}" (${colDefs});`;
        migrated[`TABLE_${name}`] = { ddl: createTableSQL, inserts: [] };

        // Ejecutar CREATE TABLE
        try { await pgClient.query(createTableSQL); } 
        catch (err) { console.warn(`No se pudo crear tabla ${name}: ${err.message}`); }

        // Traer datos y generar INSERTs
        const dataResult = await oracleConn.execute(
          `SELECT * FROM ${owner}.${name}`,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const inserts = dataResult.rows.map(row => {
          const cols = Object.keys(row).map(c => `"${c.toLowerCase()}"`).join(", ");
          const vals = Object.values(row).map(v => {
            if (v === null) return "NULL";
            if (typeof v === "number") return v;
            if (v instanceof Date) return `'${v.toISOString().replace("T", " ").replace("Z", "")}'`;
            return `'${String(v).replace(/'/g, "''")}'`;
          }).join(", ");
          return `INSERT INTO "${schemaName}"."${name.toLowerCase()}" (${cols}) VALUES (${vals});`;
        });

        migrated[`TABLE_${name}`].inserts = inserts;

        // Ejecutar INSERTs
        for (let ins of inserts) {
          try { await pgClient.query(ins); }
          catch (err) { console.warn(`No se pudo insertar en tabla ${name}: ${err.message}`); }
        }

      } catch (err) {
        console.warn(`Error procesando tabla ${name}: ${err.message}`);
      }
    }
    // 🔹 Procesar vistas
    for (let view of viewsResult.rows) {
      const name = view.VIEW_NAME;
      try {
        let sql = view.TEXT;
        if (!sql) continue; // vista vacía

        // 🔹 Limpiar keywords que Postgres no soporta
        sql = sql
          .replace(/\bFORCE\b/gi, "")
          .replace(/\bEDITIONABLE\b/gi, "")
          .replace(/\bWITH\b.*?CHECK\b/gi, "") // quitar restricciones Oracle
          .replace(/\bFROM\s+DUAL\b/gi, "");    // quitar FROM DUAL

        const isConstantView = /^SELECT\s+[\d'"].*$/i.test(sql.trim());

        if (isConstantView) {
          // 🔹 Si la vista es una constante, crear tabla temporal/persistente
          const createTableSQL = `CREATE TABLE "${schemaName}"."${name.toLowerCase()}" AS ${sql};`;
          migrated[`VIEW_${name}`] = { ddl: createTableSQL };
          try { 
            await pgClient.query(createTableSQL);
          } catch (err) {
            console.warn(`No se pudo crear tabla de constante para vista ${name}: ${err.message}`);
          }
        } else {
          // 🔹 Vista normal
          const createViewSQL = `CREATE OR REPLACE VIEW "${schemaName}"."${name.toLowerCase()}" AS ${sql};`;
          migrated[`VIEW_${name}`] = { ddl: createViewSQL };
          try { 
            await pgClient.query(createViewSQL); 
          } catch (err) { 
            console.warn(`No se pudo crear vista ${name}: ${err.message}`); 
          }
        }

      } catch (err) {
        console.warn(`Error procesando vista ${name}: ${err.message}`);
      }
    }
    await oracleConn.close();
    await pgClient.end();

    res.status(200).json({ migrated, message: `Migración completada en esquema ${schemaName}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
