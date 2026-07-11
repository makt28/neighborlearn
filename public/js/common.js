/* ============================================================
   common.js — shared UI used on every page:
   the navbar (changes with login state), the footer,
   a page-guard for logged-in-only pages, and small helpers.
   Each page includes <div id="nl-nav"></div> and <div id="nl-footer"></div>.
   ============================================================ */

/* ---------- small helpers reused everywhere ---------- */
function nlStars(rating) {
  const full = Math.round(rating);
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<i class="bi ${i <= full ? "bi-star-fill" : "bi-star"} nl-star"></i>`;
  return out;
}
function nlAvatar(user, big) {
  const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return `<span class="nl-avatar ${big ? "nl-avatar-lg" : ""}" style="background:${user.avatarColor}">${initials}</span>`;
}
function nlQuery(name) { return new URLSearchParams(window.location.search).get(name); }

/* pick a simple line icon for a skill category */
function nlCategoryIcon(category) {
  const icons = {
    "Finance": "bi-cash-coin",
    "Cooking": "bi-egg-fried",
    "Technology": "bi-laptop",
    "Automotive": "bi-car-front",
    "Home Repair": "bi-tools",
    "Language": "bi-translate",
    "Music": "bi-music-note-beamed",
    "Fitness": "bi-heart-pulse",
    "Art": "bi-brush"
  };
  return icons[category] || "bi-mortarboard";
}

/* pick the photo for a skill: its own image, else a category photo */
function nlSkillImage(skill) {
  if (skill.image) return skill.image;
  const file = skill.category.toLowerCase().replace(/ /g, "-");
  return `img/${file}.jpg`;
}

/* a single skill card, reused on Home and Browse (photo + teacher + rating) */
function nlSkillCard(skill) {
  const owner = Store.getUser(skill.ownerId);
  return `
  <div class="col-sm-6 col-lg-4">
    <a href="skill-detail.html?id=${skill.id}" class="text-decoration-none">
      <div class="nl-card h-100">
        <div class="nl-skill-thumb">
          <img src="${nlSkillImage(skill)}" alt="${nlEscape(skill.title)}">
        </div>
        <div class="p-3">
          <span class="nl-chip mb-2">${nlEscape(skill.category)}</span>
          <h5 class="mb-2" style="min-height:2.6em">${nlEscape(skill.title)}</h5>
          <div class="d-flex justify-content-between align-items-center">
            <div class="nl-card-owner">
              ${owner ? nlAvatar(owner) : ""}
              <div>
                <div class="small fw-bold text-dark">${owner ? nlEscape(owner.name) : "?"}</div>
                <div class="small text-muted"><i class="bi bi-geo-alt"></i> ${nlEscape(skill.area)}</div>
              </div>
            </div>
            <span class="small">${nlStars(skill.rating)}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="nl-credit-badge"><i class="bi bi-clock-history"></i> ${skill.credits} credit${skill.credits > 1 ? "s" : ""}/hr</span>
            <span class="nl-view-profile">View Profile ›</span>
          </div>
        </div>
      </div>
    </a>
  </div>`;
}
/* make user text safe to show inside HTML (turn < > & " into codes) */
function nlEscape(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ---------- navbar ---------- */
function renderNav() {
  const el = document.getElementById("nl-nav");
  if (!el) return;
  const user = Store.currentUser();

  let right;
  if (user) {
    const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    // show a dot on the chat icon only if the user has any conversations
    const hasChats = Store.getConversations(user.id).length > 0;
    right = `
      <span class="nl-credit-badge me-3"><i class="bi bi-clock-history"></i> ${user.balance} credits</span>
      <a href="messages.html" class="nl-nav-icon me-3" title="Messages">
        <i class="bi bi-chat-dots"></i>${hasChats ? '<span class="nl-dot"></span>' : ""}
      </a>
      <div class="dropdown">
        <a href="#" class="nl-avatar dropdown-toggle text-decoration-none" data-bs-toggle="dropdown"
           style="background:${user.avatarColor}">${initials}</a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><span class="dropdown-item-text fw-bold">${nlEscape(user.name)}</span></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="profile.html">My Profile</a></li>
          <li><a class="dropdown-item" href="bookings.html">My Bookings</a></li>
          <li><a class="dropdown-item" href="messages.html">Messages</a></li>
          <li><a class="dropdown-item" href="#" onclick="Store.logout();location.href='index.html';return false;">Logout</a></li>
        </ul>
      </div>`;
  } else {
    right = `
      <a href="login.html" class="btn btn-nl-outline me-2">Login</a>
      <a href="register.html" class="btn btn-nl">Register</a>`;
  }

  el.innerHTML = `
  <nav class="navbar navbar-expand-lg nl-navbar sticky-top">
    <div class="container">
      <a class="navbar-brand" href="index.html">${nlLogo()}</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nlNavMenu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nlNavMenu">
        <ul class="navbar-nav me-auto ms-lg-4">
          <li class="nav-item"><a class="nav-link" href="browse.html">Browse Skills</a></li>
          ${user ? "" : '<li class="nav-item"><a class="nav-link" href="index.html#how">How It Works</a></li>'}
        </ul>
        <div class="d-flex align-items-center">${right}</div>
      </div>
    </div>
  </nav>`;
}

/* the NeighborLearn logo image.
   Pass true for the large version used on the login / register pages. */
function nlLogo(large) {
  return `<img src="img/logo.png" alt="NeighborLearn" class="nl-logo-img ${large ? "nl-logo-img-lg" : ""}">`;
}

/* ---------- footer ---------- */
function renderFooter() {
  const el = document.getElementById("nl-footer");
  if (!el) return;
  el.innerHTML = `
  <footer class="nl-footer mt-5 py-4">
    <div class="container">
      <div class="row gy-3">
        <div class="col-md-4">
          <img src="img/logo.png" alt="NeighborLearn" class="nl-logo-footer mb-2">
          <p class="small mb-0">Trade your time, learn from your neighbours. A no-money, time-banking skill exchange.</p>
        </div>
        <div class="col-md-4">
          <h6 class="text-white">Links</h6>
          <div><a href="browse.html">Browse Skills</a></div>
          <div><a href="index.html#how">How Time-Credit Works</a></div>
          <div><a href="register.html">Join the Community</a></div>
        </div>
        <div class="col-md-4">
          <h6 class="text-white">Designed in alignment with the UN SDGs</h6>
          <div class="nl-sdg nl-sdg-4"><span class="n">4</span><span class="small">Quality Education</span></div>
          <div class="nl-sdg nl-sdg-10"><span class="n">10</span><span class="small">Reduced Inequalities</span></div>
          <div class="nl-sdg nl-sdg-11"><span class="n">11</span><span class="small">Sustainable Cities &amp; Communities</span></div>
        </div>
      </div>
      <hr class="border-secondary">
      <p class="small text-center mb-0">© 2026 NeighborLearn · Privacy Policy · Contact</p>
    </div>
  </footer>`;
}

/* ---------- guard for logged-in-only pages ---------- */
function requireAuth() {
  if (!Store.currentUser()) {
    location.href = "login.html";
    return false;
  }
  return true;
}

/* run on every page: load the database first, then draw shared UI */
document.addEventListener("DOMContentLoaded", async function () {
  renderFooter();          // static, safe to draw immediately
  // the login / register pages show the big logo instead of the navbar
  const logoSlot = document.getElementById("nl-logo-slot");
  if (logoSlot) logoSlot.innerHTML = nlLogo(true);
  await Store.init();      // load data.json from the Python backend
  renderNav();             // navbar depends on the data (login state, balance)
});
