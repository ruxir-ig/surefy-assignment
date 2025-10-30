import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/index';
import type { RegisterUserDTO, LoginDTO } from '../types';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password }: RegisterUserDTO = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];

    // Auto-login after registration
    req.session.userId = user.id;

    console.log(`User registered: ID=${user.id}, Email=${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session
    req.session.userId = user.id;

    console.log(`User logged in: ID=${user.id}, Email=${user.email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }

      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
