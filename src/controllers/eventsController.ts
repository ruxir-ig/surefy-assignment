import type { Request, Response } from "express";
import { pool } from "../db/index";
import { validateEventData, sanitizeString } from "../utils/validation";
import type {
  CreateEventDTO,
  RegisterDTO,
  CancelRegistrationDTO,
} from "../types";

// create event
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, datetime, location, capacity }: CreateEventDTO = req.body;

    if (!title || !datetime || !location || !capacity) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate input
    const validationErrors = validateEventData(
      title,
      datetime,
      location,
      capacity,
    );
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Sanitize strings
    const sanitizedTitle = sanitizeString(title);
    const sanitizedLocation = sanitizeString(location);

    const result = await pool.query(
      "INSERT INTO events (title, datetime, location, capacity) VALUES ($1, $2, $3, $4) RETURNING id",
      [sanitizedTitle, datetime, sanitizedLocation, capacity],
    );

    console.log(
      `Event created: ID=${result.rows[0].id}, Title="${sanitizedTitle}"`,
    );

    res.status(201).json({
      message: "Event is created successfully",
      eventId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//get event details
export const getEventDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [
      id,
    ]);

    if (eventResult.rows.length === 0) {
      console.log(`Event not found: ID=${id}`);
      return res.status(404).json({ error: "Event not found" });
    }

    const usersResult = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN registrations r ON u.id = r.user_id
       WHERE r.event_id = $1`,
      [id],
    );

    const event = eventResult.rows[0];
    res.json({
      ...event,
      registeredUsers: usersResult.rows,
    });
  } catch (error) {
    console.error(
      `Error fetching event details for ID=${req.params.id}:`,
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

//register for the event
export const registerForEvent = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // Use authenticated user ID from session
    const userId = req.session.userId;

    if (!userId) {
      client.release();
      return res
        .status(401)
        .json({ error: "You must be logged in to register for events" });
    }

    await client.query("BEGIN");

    const eventResult = await client.query(
      "SELECT * FROM events WHERE id = $1 FOR UPDATE",
      [id],
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];

    if (new Date(event.datetime) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot register for past events" });
    }

    const duplicateCheck = await client.query(
      "SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2",
      [id, userId],
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "User already registered for this event" });
    }

    const countResult = await client.query(
      "SELECT COUNT(*) FROM registrations WHERE event_id = $1",
      [id],
    );

    const currentRegistrations = parseInt(countResult.rows[0].count);

    if (currentRegistrations >= event.capacity) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Event is full" });
    }

    await client.query(
      "INSERT INTO registrations (event_id, user_id) VALUES ($1, $2)",
      [id, userId],
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Successfully registered for event" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

//cancel the registration
export const cancelRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Use authenticated user ID from session
    const userId = req.session.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "You must be logged in to cancel registration" });
    }

    const result = await pool.query(
      "DELETE FROM registrations WHERE event_id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registration not found" });
    }

    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

//get all events
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT e.*, COUNT(r.user_id) as registration_count
       FROM events e
       LEFT JOIN registrations r ON e.id = r.event_id
       GROUP BY e.id
       ORDER BY e.datetime ASC`,
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

//get upcoming events
export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT e.*, COUNT(r.user_id) as registration_count
       FROM events e
       LEFT JOIN registrations r ON e.id = r.event_id
       WHERE e.datetime > NOW()
       GROUP BY e.id
       ORDER BY e.datetime ASC, e.location ASC`,
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

//get event stats
export const getEventStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      "SELECT capacity FROM events WHERE id = $1",
      [id],
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const capacity = eventResult.rows[0].capacity;

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM registrations WHERE event_id = $1",
      [id],
    );

    const totalRegistrations = parseInt(countResult.rows[0].count);
    const remainingCapacity = capacity - totalRegistrations;
    const percentageUsed = ((totalRegistrations / capacity) * 100).toFixed(2);

    res.json({
      totalRegistrations,
      remainingCapacity,
      percentageUsed: parseFloat(percentageUsed),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
