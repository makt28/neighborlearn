/* auth.js — handles the login form and the register form
   (whichever one is on the current page), with simple checks
   that show a clear error message. */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();

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

      const name = document.getElementById("name").value.trim();
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
      if (name.length < 2)            return fail("Please enter your name.");
      if (!email.includes("@"))       return fail("Please enter a valid email address.");
      if (location === "")            return fail("Please tell us your neighbourhood.");
      if (password.length < 6)        return fail("Password must be at least 6 characters.");
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
                                      return fail("Password needs at least one letter and one number.");
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
