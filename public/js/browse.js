/* browse.js — search and filter the skill list by category */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();

  const $cat     = document.getElementById("f-category");
  const $search  = document.getElementById("search-input");
  const $results = document.getElementById("results");
  const $count   = document.getElementById("result-count");

  // fill the category dropdown from the data
  $cat.innerHTML = ['<option value="All">All categories</option>']
    .concat(Store.getCategories().map(c => `<option>${c}</option>`)).join("");

  // pre-fill the search box from the homepage hero search (?q=)
  const initialQuery = nlQuery("q");
  if (initialQuery) $search.value = initialQuery;

  function render() {
    const list = Store.getSkills({
      category: $cat.value,
      query: $search.value.trim()
    });
    $results.innerHTML = list.length
      ? list.map(nlSkillCard).join("")
      : `<div class="col-12"><div class="nl-card p-5 text-center text-muted">
           <i class="bi bi-search fs-1"></i><p class="mt-2 mb-0">No skills match your search. Try another word.</p></div></div>`;
    $count.textContent = `Showing ${list.length} skill${list.length !== 1 ? "s" : ""}`;
  }

  // events
  $cat.addEventListener("change", render);
  $search.addEventListener("input", render);
  document.getElementById("search-form").addEventListener("submit", e => { e.preventDefault(); render(); });

  render();
});
