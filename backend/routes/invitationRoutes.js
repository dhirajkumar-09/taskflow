const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { sendInvite, getMyInvitations, respondInvitation } = require('../controllers/invitationController');

router.post('/', protect, sendInvite);              // board owner sends an invite
router.get('/', protect, getMyInvitations);          // logged-in user's pending invites
router.post('/:id/respond', protect, respondInvitation); // accept / decline

module.exports = router;