/* ============================================================
   store.js — the data layer for NeighborLearn.

   How it works:
     - When a page loads, Store.init() downloads the whole database
       (data.json) from our Python server into the variable `db`.
     - Reading functions just look inside `db`.
     - Writing functions change `db` and then call Store.save(),
       which sends `db` back to the server so it is saved to disk.
     - The logged-in user's id is kept in a browser cookie.
   ============================================================ */

let db = null;   // holds the whole database after it is loaded


/* read the logged-in user's id from the cookie (or null if not logged in) */
function getSessionId() {
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith("nl_session=")) {
      return parseInt(part.split("=")[1], 10);
    }
  }
  return null;
}

/* give out the next unused id number for a new record */
function nextId(type) {
  db.counters[type] = (db.counters[type] || 0) + 1;
  return db.counters[type];
}


const Store = {

  /* ---------- load / save ---------- */
  async init() {
    if (db) return;                       // already loaded
    const response = await fetch("/api/db");
    db = await response.json();
  },

  save() {                                // send the whole database back to be saved
    return fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(db)
    });
  },

  /* ---------- login / session ---------- */
  login(email, password) {
    for (const user of db.users) {
      if (user.email.toLowerCase() === email.toLowerCase() && user.password === password) {
        document.cookie = "nl_session=" + user.id + ";path=/";
        return user;
      }
    }
    return null;
  },

  logout() {
    document.cookie = "nl_session=;path=/;max-age=0";
  },

  currentUser() {
    const id = getSessionId();
    if (!id) return null;
    return Store.getUser(id);
  },

  async register(data) {
    // stop if the email is already used
    for (const user of db.users) {
      if (user.email.toLowerCase() === data.email.toLowerCase()) return null;
    }
    const user = {
      id: nextId("user"),
      name: data.name,
      email: data.email,
      password: data.password,
      location: data.location || "Your neighbourhood",
      avatarColor: "#E07B39",
      bio: data.bio || "New NeighborLearn member.",
      rating: 0,
      balance: 3                          // welcome bonus of 3 credits
    };
    db.users.push(user);
    await Store.save();
    document.cookie = "nl_session=" + user.id + ";path=/";
    return user;
  },

  /* ---------- users ---------- */
  getUser(id) {
    for (const user of db.users) {
      if (user.id === id) return user;
    }
    return null;
  },

  async updateUser(id, changes) {
    const user = Store.getUser(id);
    if (user) {
      Object.assign(user, changes);
      await Store.save();
    }
    return user;
  },

  /* ---------- skills ---------- */
  getSkills(options) {
    options = options || {};
    let list = [];

    // start with all skills (skip hidden ones unless asked)
    for (const skill of db.skills) {
      if (skill.hidden && !options.includeHidden) continue;
      list.push(skill);
    }

    // apply the filters one by one
    if (options.category && options.category !== "All") {
      list = list.filter(s => s.category === options.category);
    }
    if (options.ownerId) {
      list = list.filter(s => s.ownerId === options.ownerId);
    }
    if (options.query) {
      const q = options.query.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q));
    }

    return list;
  },

  getSkill(id) {
    for (const skill of db.skills) {
      if (skill.id === id) return skill;
    }
    return null;
  },

  getCategories() {
    const list = [];
    for (const skill of db.skills) {
      if (!list.includes(skill.category)) list.push(skill.category);
    }
    list.sort();
    return list;
  },

  /* ---------- bookings ---------- */
  getBookings(userId) {
    return db.bookings.filter(b => b.learnerId === userId || b.teacherId === userId);
  },

  async addBooking(skillId, learnerId, date, time) {
    const skill = Store.getSkill(skillId);
    if (!skill) return null;
    const booking = {
      id: nextId("booking"),
      skillId: skillId,
      learnerId: learnerId,
      teacherId: skill.ownerId,
      date: date,
      time: time,
      status: "upcoming"
    };
    db.bookings.push(booking);
    await Store.save();
    return booking;
  },

  /* ---------- reviews ---------- */
  // all community reviews written about this user
  getReviews(userId) {
    if (!db.reviews) return [];
    return db.reviews.filter(r => r.targetUserId === userId);
  },

  /* ---------- messages ---------- */
  // all conversations that this user is part of
  getConversations(userId) {
    if (!db.conversations) return [];
    return db.conversations.filter(c => c.userA === userId || c.userB === userId);
  },

  getConversation(id) {
    if (!db.conversations) return null;
    for (const c of db.conversations) {
      if (c.id === id) return c;
    }
    return null;
  },

  // add a message from `senderId` to the conversation, then save
  async sendMessage(convId, senderId, text) {
    const conv = Store.getConversation(convId);
    if (!conv) return null;
    const message = { senderId: senderId, text: text, time: "now" };
    conv.messages.push(message);
    await Store.save();
    return message;
  },

  async updateBookingStatus(id, status) {
    // find the booking with this id
    let booking = null;
    for (const b of db.bookings) {
      if (b.id === id) booking = b;
    }
    if (!booking) return null;

    // when a session is completed, move the time-credits from learner to teacher
    if (status === "completed" && booking.status !== "completed") {
      const skill = Store.getSkill(booking.skillId);
      const credits = skill ? skill.credits : 1;
      const learner = Store.getUser(booking.learnerId);
      const teacher = Store.getUser(booking.teacherId);
      // don't let the learner's balance go negative — block the transfer
      if (learner && learner.balance < credits) {
        return { error: "insufficient", needed: credits, have: learner.balance };
      }
      if (learner) learner.balance = learner.balance - credits;
      if (teacher) teacher.balance = teacher.balance + credits;
    }

    booking.status = status;
    await Store.save();
    return booking;
  }

};
