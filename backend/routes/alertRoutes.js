const express = require('express');
const { createAlert, getAlerts, updateAlertStatus } = require('../controllers/alertController');

const router = express.Router();

router.post('/alerts', createAlert);
router.get('/alerts', getAlerts);
router.put('/alerts/:id/status', updateAlertStatus);

module.exports = router;
