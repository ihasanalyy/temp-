import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { pointsUser, getUserSearchHistory, getQueries } from '../controllers/usersControllers.js';

const router = express.Router();

// user routes
router.get('/points', authMiddleware, pointsUser);
router.get('/history', authMiddleware, getUserSearchHistory);
router.get('/userQueries', authMiddleware, getQueries);

export default router;