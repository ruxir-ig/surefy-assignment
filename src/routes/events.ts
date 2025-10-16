import express from 'express';
import {
  createEvent,
  getEventDetails,
  registerForEvent,
  cancelRegistration,
  getUpcomingEvents,
  getEventStats
} from '../controllers/eventsController';

const router = express.Router();

// Order matters! Specific routes before parameterized ones
router.post('/', createEvent);                    // POST /events
router.get('/upcoming', getUpcomingEvents);       // GET /events/upcoming
router.get('/:id', getEventDetails);              // GET /events/:id
router.post('/:id/register', registerForEvent);   // POST /events/:id/register
router.post('/:id/cancel', cancelRegistration);   // POST /events/:id/cancel
router.get('/:id/stats', getEventStats);          // GET /events/:id/stats

export default router;