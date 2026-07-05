/* home.js — homepage: featured skills, hero search */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();

  // featured skills (first 4)
  const featured = Store.getSkills().slice(0, 4);
  document.getElementById("featured-skills").innerHTML = featured.map(nlSkillCard).join("");

  // hero search -> browse page
  document.getElementById("hero-search").addEventListener("submit", function (e) {
    e.preventDefault();
    const q = document.getElementById("hero-search-input").value.trim();
    location.href = "browse.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  });
});
