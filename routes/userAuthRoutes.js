import express from 'express';
import { userLogin, userSignUp } from '../controllers/usersControllers.js';

const router = express.Router();

// singup route
router.post('/signup', userSignUp);

// login route
router.post('/login', userLogin);

export default router;