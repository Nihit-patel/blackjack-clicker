/*
This javascript file is used to:
1) Validate the user inputs (username, email, password).
2) Control the visual aspects of the sign up page.
*/

// Functions to enable / disable the submit button
let emailAvailable = false;
let usernameAvailable = false;
let emailTimer; // to make form reload less frequently
let usernameTimer; // to make form reload less frequently

function enableSubmitBtn() {
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = false;
  submitBtn.style.opacity = 1;
}

function disableSubmitBtn() {
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.style.opacity = 0.4;
}

// Update submit button state based on all validations
function updateSubmitBtnState() {
  const emailValue = document.getElementById("email").value.trim();
  const usernameValue = document.getElementById("username").value.trim();
  const passwordValue = document.getElementById("password").value.trim();

  let isEmailValid = false,
    isUsernameValid = false;

  if (emailAvailable) {
    isEmailValid = validateEmail(emailValue);
  }

  if (usernameAvailable) {
    isUsernameValid = validateUsername(usernameValue);
  }

  const isPasswordValid = validatePassword(passwordValue);

  const basicValidation = isEmailValid && isUsernameValid && isPasswordValid;

  if (basicValidation && usernameAvailable && emailAvailable) {
    enableSubmitBtn();
  } else {
    disableSubmitBtn();
  }
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError = document.getElementById("email-error");
  if (email === "") {
    emailError.textContent = "";
    return false;
  }
  if (!pattern.test(email)) {
    emailError.textContent = "Please enter a valid email.";
    return false;
  }
  emailError.textContent = "";
  return true;
}

function validateUsername(username) {
  const pattern = /^[a-zA-Z0-9_]{3,16}$/;
  const usernameError = document.getElementById("username-error");
  if (username === "") {
    usernameError.textContent = "";
    return false;
  }
  if (!pattern.test(username)) {
    usernameError.textContent =
      "Username must be 3-16 characters and contain only letters, numbers, or underscores.";
    return false;
  }
  usernameError.textContent = "";
  return true;
}

function validatePassword(password) {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;
  const passwordError = document.getElementById("password-error");
  if (password === "") {
    passwordError.textContent = "";
    return false;
  }
  if (!pattern.test(password)) {
    passwordError.textContent =
      "Password must be at least 5 characters, include uppercase, lowercase, and a number.";
    return false;
  }
  passwordError.textContent = "";
  return true;
}

// Check live availability using AJAX:
async function checkAvailability(type, value) {
  if (value.trim() === "") return false;
  const typeOfError = document.getElementById(`${type}-error`);

  try {
    const res = await fetch(
      `/api/check-${type}?${type}=${encodeURIComponent(value)}`
    );
    const data = await res.json();

    if (!data.available) {
      typeOfError.textContent = `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } already in use.`;
      return false;
    } else {
      typeOfError.textContent = "";
      return true;
    }
  } catch (err) {
    console.log(`Error checking ${type} availability:`, err);
    return false;
  }
}

// Main form validation
function validateSignupForm() {
  const emailValue = document.getElementById("email").value.trim();
  const usernameValue = document.getElementById("username").value.trim();
  const passwordValue = document.getElementById("password").value.trim();

  return (
    validateEmail(emailValue) &&
    validateUsername(usernameValue) &&
    validatePassword(passwordValue) &&
    emailAvailable &&
    usernameAvailable
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form-signup");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  // Instant format/password validation
  [emailInput, usernameInput, passwordInput].forEach((input) => {
    input.addEventListener("input", updateSubmitBtnState);
  });

  // Debounced email availability check
  emailInput.addEventListener("input", () => {
    clearTimeout(emailTimer);
    if (validateEmail(emailInput.value.trim())) {
      emailTimer = setTimeout(async () => {
        emailAvailable = await checkAvailability(
          "email",
          emailInput.value.trim()
        );
        updateSubmitBtnState();
      }, 500); // wait 500ms after typing stops
    } else {
      emailAvailable = false;
      updateSubmitBtnState();
    }
  });

  // Debounced username availability check
  usernameInput.addEventListener("input", () => {
    clearTimeout(usernameTimer);
    if (validateUsername(usernameInput.value.trim())) {
      usernameTimer = setTimeout(async () => {
        usernameAvailable = await checkAvailability(
          "username",
          usernameInput.value.trim()
        );
        updateSubmitBtnState();
      }, 500);
    } else {
      usernameAvailable = false;
      updateSubmitBtnState();
    }
  });

  // Password validation only
  passwordInput.addEventListener("input", () => {
    validatePassword(passwordInput.value.trim());
    updateSubmitBtnState();
  });

  updateSubmitBtnState();

  form.addEventListener("submit", function (e) {
    if (!validateSignupForm()) {
      e.preventDefault(); // stop form from submitting
    }
  });
});

// need to handle incorrect login (such as non existing username)
