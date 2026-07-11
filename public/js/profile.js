/* profile.js — user dashboard: banner, stats, tabs (teach / want / history),
   community reviews, and the edit-profile popup */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();
  if (!requireAuth()) return;
  const me = Store.currentUser();
  const root = document.getElementById("profile-root");

  function render() {
    const user = Store.currentUser();
    const teaches = Store.getSkills({ ownerId: user.id, includeHidden: true });
    const bookings = Store.getBookings(user.id);
    const wants = user.wants || [];
    const reviews = Store.getReviews(user.id);
    const taught = bookings.filter(b => b.teacherId === user.id && b.status === "completed").length;
    const learned = bookings.filter(b => b.learnerId === user.id && b.status === "completed").length;

    root.innerHTML = `
      <!-- BANNER -->
      <div class="nl-card p-4 mb-4">
        <div class="row align-items-center g-3">
          <div class="col-auto">${nlAvatar(user, true)}</div>
          <div class="col">
            <h1 class="mb-1">${nlEscape(user.name)}</h1>
            <div class="text-muted"><i class="bi bi-geo-alt"></i> ${nlEscape(user.location)} &nbsp;·&nbsp;
              ${nlStars(user.rating)} ${user.rating ? user.rating.toFixed(1) : "No rating yet"}</div>
            <p class="mb-0 mt-2">${nlEscape(user.bio)}</p>
          </div>
          <div class="col-auto">
            <button id="edit-btn" class="btn btn-nl-outline"><i class="bi bi-pencil"></i> Edit profile</button>
          </div>
        </div>
      </div>

      <!-- STATS -->
      <div class="row g-3 mb-4">
        <div class="col-4"><div class="nl-stat-card"><div class="num">${user.balance}</div><div class="small text-muted">Time-credit balance</div></div></div>
        <div class="col-4"><div class="nl-stat-card"><div class="num">${taught}</div><div class="small text-muted">Sessions taught</div></div></div>
        <div class="col-4"><div class="nl-stat-card"><div class="num">${learned}</div><div class="small text-muted">Sessions learned</div></div></div>
      </div>

      <!-- TABS -->
      <div class="nl-card p-4 mb-4">
        <ul class="nav nav-pills mb-3 gap-2" id="profile-tabs">
          <li class="nav-item"><button class="nav-link active" data-tab="teach">Skills I Teach</button></li>
          <li class="nav-item"><button class="nav-link" data-tab="want">Skills I Want</button></li>
          <li class="nav-item"><button class="nav-link" data-tab="history">Session History</button></li>
        </ul>

        <div class="tab-pane" data-pane="teach">
          <div class="row g-3">
            ${teaches.length ? teaches.map(s => `
              <div class="col-md-6"><div class="border rounded p-3 d-flex gap-3 align-items-center">
                <div class="nl-accent" style="font-size:1.6rem;"><i class="bi ${nlCategoryIcon(s.category)}"></i></div>
                <div><a href="skill-detail.html?id=${s.id}" class="fw-bold text-decoration-none">${nlEscape(s.title)}</a>
                  <div class="small text-muted">${nlEscape(s.category)} · ${s.credits} credit/hr</div></div>
              </div></div>`).join("") : '<p class="text-muted">You are not teaching any skills yet.</p>'}
          </div>
        </div>

        <div class="tab-pane d-none" data-pane="want">
          <div class="row g-3">
            ${wants.length ? wants.map(w => `
              <div class="col-md-6"><div class="border rounded p-3 d-flex gap-3 align-items-center">
                <div class="nl-accent" style="font-size:1.6rem;"><i class="bi bi-heart"></i></div>
                <div><div class="fw-bold">${nlEscape(w)}</div>
                  <div class="small text-muted">Wants to learn</div></div>
              </div></div>`).join("") : '<p class="text-muted">No wanted skills added yet.</p>'}
          </div>
        </div>

        <div class="tab-pane d-none" data-pane="history">
          ${bookings.length ? `<div class="table-responsive"><table class="table align-middle">
            <thead><tr><th>Skill</th><th>Role</th><th>Date</th><th>Status</th></tr></thead><tbody>
            ${bookings.map(b => {
              const skill = Store.getSkill(b.skillId);
              const role = b.teacherId === user.id ? "Teaching" : "Learning";
              return `<tr><td>${skill ? nlEscape(skill.title) : "—"}</td><td>${role}</td>
                <td>${b.date} ${b.time}</td><td>${statusBadge(b.status)}</td></tr>`;
            }).join("")}
          </tbody></table></div>` : '<p class="text-muted">No sessions yet. <a href="browse.html">Browse skills</a> to book one.</p>'}
        </div>
      </div>

      <!-- COMMUNITY REVIEWS -->
      <div class="nl-card p-4 mb-4">
        <h3 class="mb-3">Community Reviews</h3>
        ${reviews.length ? reviews.map(r => {
          const rev = Store.getUser(r.reviewerId);
          return `
          <div class="d-flex gap-3 py-3 border-bottom">
            ${rev ? nlAvatar(rev) : ""}
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between">
                <span class="fw-bold">${rev ? nlEscape(rev.name) : "Neighbour"}</span>
                <span class="small text-muted">${nlEscape(r.time)}</span>
              </div>
              <div class="small mb-1">${nlStars(r.rating)} ${r.rating.toFixed(1)}</div>
              <div>${nlEscape(r.text)}</div>
            </div>
          </div>`;
        }).join("") : '<p class="text-muted mb-0">No reviews yet.</p>'}
      </div>`;

    wireTabs();
    wireEdit(user);
  }

  function statusBadge(status) {
    const map = { upcoming: "info text-dark", completed: "success", cancelled: "secondary" };
    return `<span class="badge bg-${map[status] || "secondary"}">${status}</span>`;
  }

  function wireTabs() {
    document.querySelectorAll("#profile-tabs .nav-link").forEach(btn => {
      btn.addEventListener("click", function () {
        document.querySelectorAll("#profile-tabs .nav-link").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        const tab = this.dataset.tab;
        document.querySelectorAll("[data-pane]").forEach(p =>
          p.classList.toggle("d-none", p.dataset.pane !== tab));
      });
    });
  }

  function wireEdit(user) {
    const modal = new bootstrap.Modal(document.getElementById("editModal"));
    document.getElementById("edit-btn").addEventListener("click", function () {
      document.getElementById("edit-name").value = user.name;
      document.getElementById("edit-location").value = user.location;
      document.getElementById("edit-bio").value = user.bio;
      modal.show();
    });
    document.getElementById("edit-form").onsubmit = async function (e) {
      e.preventDefault();
      await Store.updateUser(user.id, {
        name: document.getElementById("edit-name").value.trim(),
        location: document.getElementById("edit-location").value.trim(),
        bio: document.getElementById("edit-bio").value.trim()
      });
      modal.hide();
      renderNav();  // name may show in navbar dropdown
      render();
    };
  }

  render();
});
