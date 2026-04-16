const express = require('express');
const { createAlert, getAlerts } = require('../controllers/alertController');

const router = express.Router();

router.post('/alerts', createAlert);
router.get('/alerts', getAlerts);

module.exports = router;
