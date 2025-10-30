// Type definitions for the event management system

export interface Event {
  id: number;
  title: string;
  datetime: Date;
  location: string;
  capacity: number;
  created_at?: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  registered_at: Date;
}

export interface EventWithRegistrations extends Event {
  registeredUsers: User[];
  registration_count?: number;
}

export interface EventStats {
  totalRegistrations: number;
  remainingCapacity: number;
  percentageUsed: number;
}

export interface CreateEventDTO {
  title: string;
  datetime: string;
  location: string;
  capacity: number;
}

export interface RegisterDTO {
  userId: number;
}

export interface CancelRegistrationDTO {
  userId: number;
}

// Authentication types
export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

// Extend Express Session
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}
