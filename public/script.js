// API Base URLs
const API_BASE = "/events";
const AUTH_BASE = "/auth";

// DOM Elements
const authSection = document.getElementById("authSection");
const mainContent = document.getElementById("mainContent");
const authStatus = document.getElementById("authStatus");
const loginForm = document.getElementById("loginForm");
const registerUserForm = document.getElementById("registerUserForm");
const createEventForm = document.getElementById("createEventForm");
const eventsList = document.getElementById("eventsList");
const notification = document.getElementById("notification");

// Auth State
let currentUser = null;

// Show notification
function showNotification(message, type = "success") {
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Auth Tab Switching
document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetTab = tab.dataset.tab;

    // Update active tab
    document
      .querySelectorAll(".auth-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // Update active content
    document.querySelectorAll(".auth-tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${targetTab}Tab`).classList.add("active");
  });
});

// Check if user is logged in
async function checkAuth() {
  try {
    const response = await fetch(`${AUTH_BASE}/me`);

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showMainContent();
    } else {
      showAuthSection();
    }
  } catch (error) {
    console.error("Error checking auth:", error);
    showAuthSection();
  }
}

// Show main content (authenticated)
function showMainContent() {
  authSection.style.display = "none";
  mainContent.style.display = "block";

  // Update auth status
  authStatus.innerHTML = `
    <div class="user-info">
      <span class="user-name">${escapeHtml(currentUser.name)}</span>
      <span class="user-email">(${escapeHtml(currentUser.email)})</span>
    </div>
    <button class="btn btn-secondary logout-btn" onclick="handleLogout()">Logout</button>
  `;

  fetchEvents();
}

// Show auth section (not authenticated)
function showAuthSection() {
  authSection.style.display = "block";
  mainContent.style.display = "none";
  authStatus.innerHTML = "";
}

// Handle Register
registerUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(registerUserForm);
  const userData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const submitButton = registerUserForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Registering...";

  try {
    const response = await fetch(`${AUTH_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to register");
    }

    showNotification("Registration successful! Welcome!", "success");
    currentUser = result.user;
    registerUserForm.reset();
    showMainContent();
  } catch (error) {
    console.error("Error registering:", error);
    showNotification(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Register";
  }
});

// Handle Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const credentials = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {
    const response = await fetch(`${AUTH_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to login");
    }

    showNotification("Login successful!", "success");
    currentUser = result.user;
    loginForm.reset();
    showMainContent();
  } catch (error) {
    console.error("Error logging in:", error);
    showNotification(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Login";
  }
});

// Handle Logout
async function handleLogout() {
  try {
    const response = await fetch(`${AUTH_BASE}/logout`, {
      method: "POST",
    });

    if (response.ok) {
      showNotification("Logged out successfully", "success");
      currentUser = null;
      showAuthSection();
    }
  } catch (error) {
    console.error("Error logging out:", error);
    showNotification("Failed to logout", "error");
  }
}

// Fetch all events
async function fetchEvents() {
  try {
    eventsList.innerHTML = '<p class="loading">Loading events...</p>';
    const response = await fetch(API_BASE);

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    const events = await response.json();
    displayEvents(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    eventsList.innerHTML =
      '<p class="empty">Failed to load events. Please try again.</p>';
  }
}

// Display events
function displayEvents(events) {
  if (!events || events.length === 0) {
    eventsList.innerHTML =
      '<p class="empty">No events available. Create one to get started!</p>';
    return;
  }

  eventsList.innerHTML = events
    .map((event) => {
      const registrationCount = parseInt(event.registration_count) || 0;
      const remainingCapacity = event.capacity - registrationCount;
      const isFull = remainingCapacity <= 0;
      const isLimited = remainingCapacity <= 5 && remainingCapacity > 0;

      let badge = "";
      if (isFull) {
        badge = '<span class="event-badge badge-full">Full</span>';
      } else if (isLimited) {
        badge = `<span class="event-badge badge-limited">${remainingCapacity} spots left</span>`;
      } else {
        badge = '<span class="event-badge badge-available">Available</span>';
      }

      return `
        <div class="event-item ${isFull ? "event-full" : ""}" data-event-id="${event.id}">
            <div class="event-header">
                <h3 class="event-title">${escapeHtml(event.title)}</h3>
                ${badge}
            </div>
            <div class="event-details">
                <div class="event-detail">
                    <label>Date & Time</label>
                    <span>${formatDate(event.datetime)}</span>
                </div>
                <div class="event-detail">
                    <label>Location</label>
                    <span>${escapeHtml(event.location)}</span>
                </div>
                <div class="event-detail">
                    <label>Capacity</label>
                    <span>${registrationCount} / ${event.capacity}</span>
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-secondary" onclick="registerForEvent(${event.id})" ${isFull ? "disabled" : ""}>
                    ${isFull ? "Full" : "Register"}
                </button>
                <button class="btn btn-primary" onclick="viewEventDetails(${event.id})">View Details</button>
            </div>
            <div id="details-${event.id}" class="registered-users" style="display: none;"></div>
        </div>
        `;
    })
    .join("");
}

// Create event
createEventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(createEventForm);
  const eventData = {
    title: formData.get("title"),
    datetime: formData.get("datetime"),
    location: formData.get("location"),
    capacity: parseInt(formData.get("capacity")),
  };

  // Client-side validation
  const eventDate = new Date(eventData.datetime);
  if (eventDate < new Date()) {
    showNotification("Event date must be in the future", "error");
    return;
  }

  if (eventData.capacity < 1 || eventData.capacity > 1000) {
    showNotification("Capacity must be between 1 and 1000", "error");
    return;
  }

  const submitButton = createEventForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Creating...";

  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create event");
    }

    showNotification("Event created successfully!", "success");
    createEventForm.reset();
    fetchEvents();
  } catch (error) {
    console.error("Error creating event:", error);
    showNotification(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create Event";
  }
});

// Register for event (authenticated user automatically used)
async function registerForEvent(eventId) {
  try {
    const response = await fetch(`${API_BASE}/${eventId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // No userId needed - backend uses session
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to register for event");
    }

    showNotification("Successfully registered for the event!", "success");
    fetchEvents(); // Refresh to update capacity

    // Refresh details if visible
    const detailsDiv = document.getElementById(`details-${eventId}`);
    if (detailsDiv && detailsDiv.style.display === "block") {
      viewEventDetails(eventId);
    }
  } catch (error) {
    console.error("Error registering for event:", error);
    showNotification(error.message, "error");
  }
}

// View event details
async function viewEventDetails(eventId) {
  const detailsDiv = document.getElementById(`details-${eventId}`);

  // Toggle visibility
  if (detailsDiv.style.display === "block") {
    detailsDiv.style.display = "none";
    return;
  }

  try {
    detailsDiv.innerHTML = '<p class="loading">Loading details...</p>';
    detailsDiv.style.display = "block";

    const response = await fetch(`${API_BASE}/${eventId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch event details");
    }

    const event = await response.json();

    if (!event.registeredUsers || event.registeredUsers.length === 0) {
      detailsDiv.innerHTML =
        '<h4>Registered Users</h4><p class="empty">No registrations yet.</p>';
    } else {
      detailsDiv.innerHTML = `
                <h4>Registered Users (${event.registeredUsers.length})</h4>
                <div class="user-list">
                    ${event.registeredUsers
                      .map(
                        (user) => `
                        <div class="user-item">
                            ${escapeHtml(user.name)} - ${escapeHtml(user.email)}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
    }
  } catch (error) {
    console.error("Error fetching event details:", error);
    detailsDiv.innerHTML = '<p class="empty">Failed to load details.</p>';
  }
}

// Set minimum datetime to now (prevent past dates)
function setMinDateTime() {
  const datetimeInput = document.getElementById("datetime");
  if (datetimeInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    datetimeInput.min = now.toISOString().slice(0, 16);
  }
}

// Initial load
checkAuth();
setMinDateTime();
