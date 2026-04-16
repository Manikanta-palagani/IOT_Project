const express = require('express');
const { addUser, deleteUser, disableUser, getUsers, toggleBroadcast } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/', getUsers);
router.post('/add', addUser);
router.patch('/:userId/disable', disableUser);
router.patch('/:userId/broadcast', toggleBroadcast);
router.delete('/:userId', deleteUser);

module.exports = router;