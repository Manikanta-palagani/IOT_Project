const express = require('express');
const { createAlert, deleteAllEvents, deleteEvent, getEvents } = require('../controllers/securityController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/alert', createAlert);
router.get('/events', authenticateToken, getEvents);
router.delete('/events', authenticateToken, requireRole('admin'), deleteAllEvents);
router.delete('/events/:eventId', authenticateToken, requireRole('admin'), deleteEvent);

module.exports = router;