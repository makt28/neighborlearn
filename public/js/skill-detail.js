/* skill-detail.js — one skill: details, teacher, booking */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();
  const id = parseInt(nlQuery("id"), 10);
  const skill = Store.getSkill(id);
  const root = document.getElementById("detail-root");

  if (!skill) {
    root.innerHTML = `<div class="nl-card p-5 text-center">
      <h3>Skill not found</h3><a href="browse.html" class="btn btn-nl mt-3">Back to Browse</a></div>`;
    return;
  }

  const teacher = Store.getUser(skill.ownerId);
  const me = Store.currentUser();

  root.innerHTML = `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.html">Home</a></li>
        <li class="breadcrumb-item"><a href="browse.html">Browse</a></li>
        <li class="breadcrumb-item active">${nlEscape(skill.title)}</li>
      </ol>
    </nav>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="nl-card">
          <div class="nl-skill-thumb" style="height:200px; font-size:4rem;"><i class="bi ${nlCategoryIcon(skill.category)}"></i></div>
          <div class="p-4">
            <span class="nl-chip mb-2">${nlEscape(skill.category)}</span>
            <h1 class="mb-2">${nlEscape(skill.title)}</h1>
            <div class="mb-3 text-muted">
              <i class="bi bi-geo-alt"></i> ${nlEscape(skill.area)} &nbsp;·&nbsp;
              ${nlStars(skill.rating)} ${skill.rating.toFixed(1)}
            </div>
            <h5>About this session</h5>
            <p>${nlEscape(skill.description)}</p>
          </div>
        </div>
      </div>

      <!-- SIDEBAR: teacher + booking -->
      <div class="col-lg-4">
        <div class="nl-card p-4 text-center sticky-top" style="top:90px;">
          <div class="nl-credit-badge d-inline-block mb-3 fs-6">
            <i class="bi bi-clock-history"></i> ${skill.credits} time-credit${skill.credits > 1 ? "s" : ""} / hour
          </div>
          <hr>
          <div class="mb-2">${teacher ? nlAvatar(teacher, true) : ""}</div>
          <h5 class="mb-0">${teacher ? nlEscape(teacher.name) : "Unknown"}</h5>
          <div class="text-muted small mb-2"><i class="bi bi-geo-alt"></i> ${teacher ? nlEscape(teacher.location) : ""}</div>
          <div class="mb-3">${teacher ? nlStars(teacher.rating) + " " + teacher.rating.toFixed(1) : ""}</div>
          <p class="small text-muted">${teacher ? nlEscape(teacher.bio) : ""}</p>
          <button id="book-btn" class="btn btn-nl w-100"><i class="bi bi-calendar-check"></i> Book a session</button>
        </div>
      </div>
    </div>`;

  // --- booking flow ---
  const bookModal = new bootstrap.Modal(document.getElementById("bookModal"));
  const dateInput = document.getElementById("book-date");
  dateInput.min = new Date().toISOString().slice(0, 10);

  document.getElementById("book-btn").addEventListener("click", function () {
    if (!me) { location.href = "login.html"; return; }
    if (me.id === skill.ownerId) { alert("This is your own skill — you can't book yourself."); return; }
    document.getElementById("book-summary").textContent =
      `${skill.title} with ${teacher.name}. This will use ${skill.credits} of your ${me.balance} credits when completed.`;
    const warn = document.getElementById("book-warning");
    if (me.balance < skill.credits) {
      warn.textContent = "Heads up: you don't have enough credits yet. Teach a session to earn more!";
      warn.classList.remove("d-none");
    } else { warn.classList.add("d-none"); }
    bookModal.show();
  });

  document.getElementById("book-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
    const b = await Store.addBooking(skill.id, me.id, dateInput.value, document.getElementById("book-time").value);
    bookModal.hide();
    if (b) {
      root.insertAdjacentHTML("afterbegin",
        `<div class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="bi bi-check-circle-fill"></i> Session booked for ${b.date} at ${b.time}!
          See it in <a href="bookings.html" class="alert-link">My Bookings</a>.
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});
