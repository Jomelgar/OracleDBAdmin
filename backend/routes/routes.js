const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

router.get('/tree',dbService.getTree);
router.post('/test',dbService.testConnection);
router.get('/table/:owner/:table',dbService.getTable);
router.get('/:table/columns',dbService.getColumns);
router.post('/query', dbService.runQuery);
router.get('/data-types',dbService.getDataTypes);

module.exports = router;
