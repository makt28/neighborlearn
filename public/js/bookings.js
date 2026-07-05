/* bookings.js — list of my sessions with actions (complete / cancel / review) */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();
  if (!requireAuth()) return;
  const root = document.getElementById("bookings-root");

  function statusBadge(status) {
    const map = { upcoming: "info text-dark", completed: "success", cancelled: "secondary" };
    return `<span class="badge bg-${map[status] || "secondary"}">${status}</span>`;
  }

  function render() {
    const me = Store.currentUser();
    const bookings = Store.getBookings(me.id).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

    if (!bookings.length) {
      root.innerHTML = `<div class="nl-card p-5 text-center text-muted">
        <i class="bi bi-calendar-x fs-1"></i>
        <p class="mt-2">You have no bookings yet.</p>
        <a href="browse.html" class="btn btn-nl">Browse skills</a></div>`;
      return;
    }

    root.innerHTML = `<div class="nl-card p-3"><div class="table-responsive"><table class="table align-middle mb-0">
      <thead><tr><th>Skill</th><th>Role</th><th>With</th><th>Date &amp; time</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
      <tbody>
      ${bookings.map(b => {
        const skill = Store.getSkill(b.skillId);
        const teaching = b.teacherId === me.id;
        const other = Store.getUser(teaching ? b.learnerId : b.teacherId);
        return `<tr>
          <td>${skill ? `<a href="skill-detail.html?id=${skill.id}" class="text-decoration-none fw-bold">${nlEscape(skill.title)}</a>` : "—"}</td>
          <td>${teaching ? '<span class="nl-chip">Teaching</span>' : '<span class="nl-chip">Learning</span>'}</td>
          <td>${other ? nlEscape(other.name) : "—"}</td>
          <td>${b.date}<br><span class="small text-muted">${b.time}</span></td>
          <td>${statusBadge(b.status)}</td>
          <td class="text-end">${actions(b)}</td>
        </tr>`;
      }).join("")}
      </tbody></table></div></div>`;

    wire();
  }

  function actions(b) {
    if (b.status === "upcoming") {
      return `<button class="btn btn-sm btn-nl mb-1" data-complete="${b.id}">Mark complete</button> ` +
             `<button class="btn btn-sm btn-outline-secondary mb-1" data-cancel="${b.id}">Cancel</button>`;
    }
    return '<span class="text-muted small">—</span>';
  }

  function wire() {
    root.querySelectorAll("[data-complete]").forEach(btn =>
      btn.addEventListener("click", async () => {
        const res = await Store.updateBookingStatus(parseInt(btn.dataset.complete, 10), "completed");
        if (res && res.error) {
          alert(`Not enough credits to complete this session. It costs ${res.needed} but you only have ${res.have}. Teach a session to earn more!`);
          return;
        }
        renderNav();  // balance changed
        render();
      }));
    root.querySelectorAll("[data-cancel]").forEach(btn =>
      btn.addEventListener("click", async () => {
        if (confirm("Cancel this session?")) { await Store.updateBookingStatus(parseInt(btn.dataset.cancel, 10), "cancelled"); render(); }
      }));
  }

  render();
});
