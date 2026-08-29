const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
} = require('../controllers/boardController');

router.post('/', protect, createBoard);
router.get('/', protect, getBoards);
router.get('/:id', protect, getBoardById);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
