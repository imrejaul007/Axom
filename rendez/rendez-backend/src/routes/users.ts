/**
 * Rendez Backend - User Routes
 * @module routes/users
 */

import { Router } from 'express';
import { UserService } from '../services/userService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get all users
router.get('/', asyncHandler(async (_req, res) => {
  const users = UserService.getAll();
  res.json({ success: true, data: users });
}));

// Get user by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const user = UserService.getById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
}));

// Create user
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, interests } = req.body;

  if (!name || !email) {
    res.status(400).json({ success: false, error: 'name and email required' });
    return;
  }

  const user = UserService.create(name, email, interests || []);
  res.status(201).json({ success: true, data: user });
}));

// Update user
router.put('/:id', asyncHandler(async (req, res) => {
  const user = UserService.update(req.params.id, req.body);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
}));

// Search by interest
router.get('/interests/:interest', asyncHandler(async (req, res) => {
  const users = UserService.searchByInterest(req.params.interest);
  res.json({ success: true, data: users });
}));

export { router as userRouter };