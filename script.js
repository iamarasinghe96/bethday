// Deployed Google Apps Script web-app endpoint.
const API_URL =
  "https://script.google.com/macros/s/AKfycbwzZyKmxPO6ZyYKp3l-2_S-b_VNWSM3ap5OMAvRCQzO1g9BD5a22gMpJL0_c2AFHIqeHQ/exec";

const card = document.querySelector("#giftCard");
const credentials = document.querySelector("#credentials");
const dialog = document.querySelector("#accountDialog");
const choiceActions = document.querySelector("#choiceActions");
const passwordPanel = document.querySelector("#passwordPanel");
const successPanel = document.querySelector("#successPanel");
const accessPassword = document.querySelector("#accessPassword");
const formMessage = document.querySelector("#formMessage");
const hint = document.querySelector("#hint");

card.addEventListener("click", () => {
  const isFlipped = card.classList.toggle("flipped");

  card.setAttribute(
    "aria-pressed",
    String(isFlipped)
  );

  hint.textContent = isFlipped
    ? "Tap the hidden details to open your gift"
    : "Tap the card to reveal your surprise";
});

card.addEventListener("keydown", (event) => {
  const isActivationKey =
    event.key === "Enter" ||
    event.key === " ";

  if (isActivationKey && event.target === card) {
    event.preventDefault();
    card.click();
  }
});

function openChoices(event) {
  event.stopPropagation();

  choiceActions.hidden = false;
  passwordPanel.hidden = true;
  successPanel.hidden = true;

  document.querySelector("#dialogCopy").hidden = false;

  dialog.showModal();
}

credentials.addEventListener(
  "click",
  openChoices
);

credentials.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openChoices(event);
    }
  }
);

document
  .querySelector("#revealButton")
  .addEventListener("click", () => {
    choiceActions.hidden = true;
    passwordPanel.hidden = false;
    formMessage.textContent = "";
    accessPassword.focus();
  });

document
  .querySelector("#backButton")
  .addEventListener("click", () => {
    passwordPanel.hidden = true;
    choiceActions.hidden = false;
    formMessage.textContent = "";
  });

async function apiRequest(payload) {
  if (!API_URL) {
    throw new Error(
      "This gift has not been connected yet. " +
      "Please ask the sender to finish setup."
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(
      "The gift service could not be reached. " +
      "Please try again shortly."
    );
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(
      data.message ||
      "Something went wrong. Please try again."
    );
  }

  return data;
}

async function unlock() {
  const button =
    document.querySelector("#submitPassword");

  const passphrase =
    accessPassword.value.trim();

  if (!passphrase) {
    formMessage.textContent =
      "Please enter the gift password.";
    return;
  }

  button.disabled = true;
  formMessage.textContent = "Checking…";

  try {
    const data = await apiRequest({
      action: "reveal",
      passphrase: passphrase
    });

    document.querySelector(
      "#username"
    ).textContent = data.username;

    document.querySelector(
      "#accountPassword"
    ).textContent = data.password;

    document.querySelector(
      "#profile"
    ).textContent = data.profile || "1";

    card.classList.add("unlocked");
    dialog.close();
    accessPassword.value = "";
    formMessage.textContent = "";
  } catch (error) {
    formMessage.textContent =
      error.message;
  } finally {
    button.disabled = false;
  }
}

document
  .querySelector("#submitPassword")
  .addEventListener("click", unlock);

accessPassword.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      unlock();
    }
  }
);

document
  .querySelector("#issueButton")
  .addEventListener("click", async () => {
    const button =
      document.querySelector("#issueButton");

    button.disabled = true;
    button.textContent = "Checking account…";

    try {
      const data = await apiRequest({
        action: "report"
      });

      choiceActions.hidden = true;

      document.querySelector(
        "#dialogCopy"
      ).hidden = true;

      successPanel.hidden = false;

      document.querySelector(
        "#successTitle"
      ).textContent =
        data.status === "solved"
          ? "New account details updated"
          : "Issue reported";

      document.querySelector(
        "#successMessage"
      ).textContent = data.message;
    } catch (error) {
      window.alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent =
        "Report an account issue";
    }
  });

document
  .querySelector("#primeLogin")
  .addEventListener("click", (event) => {
    event.stopPropagation();
  });
