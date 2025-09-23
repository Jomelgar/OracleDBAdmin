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

    const sanitize = (name) => name.replace(/[^a-zA-Z0-9_]/g, "_");
    const sanitizeType = (type) => type.replace(/[^a-zA-Z0-9_]/g, "_");

    // 1️⃣ Tablas
    const tablesResult = await connection.execute(
      `SELECT table_name 
       FROM all_tables 
       WHERE owner = :owner 
         AND table_name NOT LIKE 'SYS_%' 
         AND table_name NOT LIKE 'WRR$%' 
         AND table_name NOT LIKE 'KU_%'
       ORDER BY table_name`,
      [owner.toUpperCase()]
    );
    const tables = tablesResult.rows.map((r) => r[0]);

    // 2️⃣ Columnas con PK/FK
    const tableColumns = {};
    for (let table of tables) {
      const cols = await connection.execute(
        `SELECT c.column_name,
                c.data_type,
                CASE WHEN cons_pk.constraint_type = 'P' THEN 'PK' END AS pk,
                CASE WHEN cons_fk.constraint_type = 'R' THEN 'FK' END AS fk
           FROM all_tab_columns c
           LEFT JOIN all_cons_columns col_pk 
             ON col_pk.table_name = c.table_name 
            AND col_pk.column_name = c.column_name
            AND col_pk.owner = c.owner
           LEFT JOIN all_constraints cons_pk 
             ON cons_pk.constraint_name = col_pk.constraint_name
            AND cons_pk.owner = col_pk.owner
            AND cons_pk.constraint_type = 'P'
           LEFT JOIN all_cons_columns col_fk 
             ON col_fk.table_name = c.table_name 
            AND col_fk.column_name = c.column_name
            AND col_fk.owner = c.owner
           LEFT JOIN all_constraints cons_fk 
             ON cons_fk.constraint_name = col_fk.constraint_name
            AND cons_fk.owner = col_fk.owner
            AND cons_fk.constraint_type = 'R'
          WHERE c.table_name = :t AND c.owner = :owner
          ORDER BY c.column_id`,
        [table, owner.toUpperCase()]
      );

      tableColumns[table] = cols.rows.map((r) => ({
        name: sanitize(r[0]),
        type: sanitizeType(r[1]),
        pk: r[2] === "PK",
        fk: r[3] === "FK",
      }));
    }

    // 3️⃣ Relaciones con columnas
    const relsResult = await connection.execute(
      `SELECT a.table_name AS child_table,
              a.column_name AS child_column,
              c_pk.table_name AS parent_table,
              b.column_name AS parent_column
       FROM all_cons_columns a
       JOIN all_constraints c 
         ON a.owner = c.owner AND a.constraint_name = c.constraint_name
       JOIN all_constraints c_pk 
         ON c.r_owner = c_pk.owner AND c.r_constraint_name = c_pk.constraint_name
       JOIN all_cons_columns b 
         ON b.owner = c_pk.owner AND b.constraint_name = c_pk.constraint_name AND b.position = a.position
       WHERE c.constraint_type = 'R'
         AND a.owner = :owner`,
      [owner.toUpperCase()]
    );

    const relations = relsResult.rows.map((r) => ({
      child: sanitize(r[0]),
      childColumn: sanitize(r[1]),
      parent: sanitize(r[2]),
      parentColumn: sanitize(r[3]),
    }));

    // 4️⃣ Nodos
    const nodes = tables.map((table, i) => ({
      id: sanitize(table),
      type: "tableNode", // para TableNode
      data: {
        table: sanitize(table),
        columns: tableColumns[table],
      },
      position: { x: (i % 5) * 280, y: Math.floor(i / 5) * 220 },
    }));

    // 5️⃣ Edges
    const edges = relations.map((rel, i) => ({
      id: `e${i}`,
      source: rel.parent,
      target: rel.child,
      label: `${rel.parentColumn} → ${rel.childColumn}`,
      type: "smoothstep",
    }));

    // 6️⃣ Respuesta JSON
    res.json({
      success: true,
      graph: { nodes, edges },
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
      return DATA_TYPE;
  }
}

exports.migrateSchema = async (req, res) => {
  const { owner } = req.params;
  const {
    user, password, host, service,
    pgUser, pgPassword, pgHost, pgPort, pgDatabase
  } = req.body;

  try {
    const oracleConn = await oracledb.getConnection({
      user,
      password,
      connectString: `${host}/${service}`,
    });

    const pgClient = new Client({
      user: pgUser,
      password: pgPassword,
      host: pgHost,
      port: pgPort || 5432,
      database: pgDatabase,
    });
    await pgClient.connect();

    const schemaName = owner.toLowerCase();
    await pgClient.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    const migrated = {};

    const tablesResult = await oracleConn.execute(
      `SELECT table_name FROM all_tables WHERE owner = :owner`,
      [owner],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const constraintsResult = await oracleConn.execute(
      `SELECT 
          cons.constraint_name, cons.constraint_type, cons.table_name, 
          col.column_name, cons.r_constraint_name, cons.r_owner
       FROM all_constraints cons
       JOIN all_cons_columns col
         ON cons.constraint_name = col.constraint_name AND cons.owner = col.owner
       WHERE cons.owner = :owner`,
      [owner],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    //Más que todo, es el intento de saber las restricciones de las tablas
    const constraintsByTable = {};
    for (let row of constraintsResult.rows) {
      const t = row.TABLE_NAME;
      if (!constraintsByTable[t]) constraintsByTable[t] = { PK: [], FK: [] };
      if (row.CONSTRAINT_TYPE === "P") constraintsByTable[t].PK.push(row.COLUMN_NAME);
      if (row.CONSTRAINT_TYPE === "R") constraintsByTable[t].FK.push({
        column: row.COLUMN_NAME,
        referencedTable: row.R_CONSTRAINT_NAME,
        referencedOwner: row.R_OWNER
      });
    }

    //Crear tablas
    for (let table of tablesResult.rows) {
      const name = table.TABLE_NAME;

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

      try { await pgClient.query(createTableSQL); } 
      catch (err) { console.warn(`No se pudo crear tabla ${name}: ${err.message}`); }
    }

    //Insertar datos
    for (let table of tablesResult.rows) {
      const name = table.TABLE_NAME;
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
      for (let ins of inserts) {
        try { await pgClient.query(ins); }
        catch (err) { console.warn(`No se pudo insertar en tabla ${name}: ${err.message}`); }
      }
    }

    //Crea las PK's
    for (let tableName in constraintsByTable) {
      const pkCols = constraintsByTable[tableName].PK;
      if (pkCols.length) {
        const sql = `ALTER TABLE "${schemaName}"."${tableName.toLowerCase()}" 
                     ADD PRIMARY KEY (${pkCols.map(c => `"${c.toLowerCase()}"`).join(", ")});`;
        try { await pgClient.query(sql); } 
        catch (err) { console.warn(`No se pudo crear PK en ${tableName}: ${err.message}`); }
      }
    }

    //Por último, mete las FK's
    for (let tableName in constraintsByTable) {
      for (let fk of constraintsByTable[tableName].FK) {
        const refConstraint = constraintsResult.rows.find(r => r.CONSTRAINT_NAME === fk.referencedTable);
        if (!refConstraint) continue;
        const refTable = refConstraint.TABLE_NAME;
        const sql = `ALTER TABLE "${schemaName}"."${tableName.toLowerCase()}"
                     ADD FOREIGN KEY ("${fk.column.toLowerCase()}") 
                     REFERENCES "${schemaName}"."${refTable.toLowerCase()}";`;
        try { await pgClient.query(sql); } 
        catch (err) { console.warn(`No se pudo crear FK en ${tableName}: ${err.message}`); }
      }
    }

    await oracleConn.close();
    await pgClient.end();
    res.status(200).json({ migrated, message: `Migración completada en esquema ${schemaName}` });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
