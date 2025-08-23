const oracledb = require('oracledb');

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
          `SELECT table_name|| '.'|| index_name FROM dba_indexes WHERE owner = :owner`,
          `SELECT table_name|| '.'|| index_name FROM all_indexes WHERE owner = :owner`,
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
      [name, owner]
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