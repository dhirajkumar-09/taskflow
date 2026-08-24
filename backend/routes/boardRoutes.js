const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createBoard, getBoards, updateBoard, deleteBoard } = require('../controllers/boardController');

router.post('/', protect, createBoard);
router.get('/', protect, getBoards);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);

module.exports = router;