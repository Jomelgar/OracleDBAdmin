const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

router.get('/tree',dbService.getTree);
router.post('/test',dbService.testConnection);
router.get('/table/:owner/:table',dbService.getTable);
router.get('/:table/columns',dbService.getColumns);
router.get('/tables/:owner',dbService.getTablesFromOwner);
router.get('/views/:owner',dbService.getViewsFromOwner);
router.get('/body/:owner/:name',dbService.getBody);
router.post('/query', dbService.runQuery);
router.get('/data-types',dbService.getDataTypes);
router.delete('/table/:owner/:name',dbService.dropTable);
router.delete('/view/:owner/:name',dbService.dropView);
router.post("/erd",dbService.getDiagram);
router.get("/ddl/:owner/:name/:type",dbService.getDDL);
router.post("/migration/:owner",dbService.migrateSchema);

module.exports = router;
