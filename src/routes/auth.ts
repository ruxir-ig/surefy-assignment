import express from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);       // POST /auth/register
router.post('/login', login);             // POST /auth/login
router.post('/logout', logout);           // POST /auth/logout
router.get('/me', getCurrentUser);        // GET /auth/me

export default router;
