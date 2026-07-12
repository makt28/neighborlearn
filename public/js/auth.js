/* auth.js — handles the login form and the register form
   (whichever one is on the current page), with simple checks
   that show a clear error message. */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();
  wirePasswordToggles();   // the show/hide eye buttons on password fields

  // after a successful login/register, go to this page
  function goNext(page) {
    location.href = page;
  }

  /* ---------------- LOGIN ---------------- */
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const errBox = document.getElementById("login-error");
      errBox.classList.add("d-none");

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (email === "" || password === "") {
        errBox.textContent = "Please fill in both your email and password.";
        errBox.classList.remove("d-none");
        return;
      }

      const user = Store.login(email, password);
      if (user) {
        // "Remember me" keeps the session cookie for 30 days instead of the tab
        if (document.getElementById("remember") && document.getElementById("remember").checked) {
          document.cookie = "nl_session=" + user.id + ";path=/;max-age=" + (60 * 60 * 24 * 30);
        }
        goNext("profile.html");
      } else {
        errBox.textContent = "Wrong email or password. Please try again.";
        errBox.classList.remove("d-none");
      }
    });
  }

  /* ---------------- REGISTER ---------------- */
  const regForm = document.getElementById("register-form");
  if (regForm) {
    regForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const errBox = document.getElementById("register-error");
      errBox.classList.add("d-none");

      // first + last name are combined into one display name
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const name = (firstName + " " + lastName).trim();
      const email = document.getElementById("email").value.trim();
      const location = document.getElementById("location").value.trim();
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirm").value;
      const agreed = document.getElementById("terms").checked;

      // show an error message and stop
      function fail(message) {
        errBox.textContent = message;
        errBox.classList.remove("d-none");
      }

      // check the fields one by one
      if (firstName === "")           return fail("Please enter your first name.");
      if (lastName === "")            return fail("Please enter your last name.");
      if (!email.includes("@"))       return fail("Please enter a valid email address.");
      if (location === "")            return fail("Please choose your neighbourhood.");
      if (password.length < 8)        return fail("Password must be at least 8 characters.");
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))
                                      return fail("Password needs a letter, a number and a symbol.");
      if (password !== confirm)       return fail("The two passwords do not match.");
      if (!agreed)                    return fail("Please agree to the Terms of Service to continue.");

      const user = await Store.register({ name, email, location, password });
      if (user) {
        goNext("profile.html");
      } else {
        fail("That email is already registered. Try logging in instead.");
      }
    });
  }
});

/* show/hide password: each .nl-pw-toggle flips its target field between
   dots and plain text, and swaps the eye icon. */
function wirePasswordToggles() {
  document.querySelectorAll(".nl-pw-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const field = document.getElementById(btn.dataset.target);
      const icon = btn.querySelector("i");
      if (field.type === "password") {
        field.type = "text";
        icon.className = "bi bi-eye-slash";
      } else {
        field.type = "password";
        icon.className = "bi bi-eye";
      }
    });
  });
}
