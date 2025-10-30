// Input validation utilities

export const validateEventData = (title: string, datetime: string, location: string, capacity: number) => {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!datetime) {
    errors.push('Date and time are required');
  } else {
    const eventDate = new Date(datetime);
    if (isNaN(eventDate.getTime())) {
      errors.push('Invalid date format');
    } else if (eventDate < new Date()) {
      errors.push('Event date must be in the future');
    }
  }

  if (!location || location.trim().length === 0) {
    errors.push('Location is required');
  } else if (location.length > 200) {
    errors.push('Location must be less than 200 characters');
  }

  if (!capacity || typeof capacity !== 'number') {
    errors.push('Capacity must be a number');
  } else if (capacity < 1 || capacity > 1000) {
    errors.push('Capacity must be between 1 and 1000');
  } else if (!Number.isInteger(capacity)) {
    errors.push('Capacity must be a whole number');
  }

  return errors;
};

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
