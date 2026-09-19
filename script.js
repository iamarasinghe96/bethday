// Deployed Google Apps Script web-app endpoint.
const API_URL =
  "https://script.google.com/macros/s/AKfycbwzZyKmxPO6ZyYKp3l-2_S-b_VNWSM3ap5OMAvRCQzO1g9BD5a22gMpJL0_c2AFHIqeHQ/exec";

const card = document.querySelector("#giftCard");
const credentials = document.querySelector("#credentials");
const dialog = document.querySelector("#accountDialog");
const dialogCopy = document.querySelector("#dialogCopy");
const choiceActions = document.querySelector("#choiceActions");
const passwordPanel = document.querySelector("#passwordPanel");
const successPanel = document.querySelector("#successPanel");
const accessPassword = document.querySelector("#accessPassword");
const submitPassword = document.querySelector("#submitPassword");
const issueButton = document.querySelector("#issueButton");
const formMessage = document.querySelector("#formMessage");
const hint = document.querySelector("#hint");

const HINTS = {
  front: "Tap the card to reveal your surprise",
  back: "Tap the hidden details to open your gift",
  unlocked: "Enjoy — and happy birthday!"
};

function refreshHint() {
  if (!card.classList.contains("flipped")) {
    hint.textContent = HINTS.front;
  } else if (card.classList.contains("unlocked")) {
    hint.textContent = HINTS.unlocked;
  } else {
    hint.textContent = HINTS.back;
  }
}

/* ------------------------------------------------------------ card flip */

function flipCard() {
  const isFlipped = card.classList.toggle("flipped");
  card.setAttribute("aria-pressed", String(isFlipped));
  refreshHint();
}

card.addEventListener("click", flipCard);

card.addEventListener("keydown", (event) => {
  if (event.target !== card) return;
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  flipCard();
});

// Controls on the back of the card act on their own; they must not also flip it.
[credentials, document.querySelector("#primeLogin")].forEach((element) => {
  element.addEventListener("click", (event) => event.stopPropagation());
});

/* --------------------------------------------------------- the dialogue */

function showPanel(panel) {
  choiceActions.hidden = panel !== choiceActions;
  passwordPanel.hidden = panel !== passwordPanel;
  successPanel.hidden = panel !== successPanel;
  dialogCopy.hidden = panel === successPanel;
}

credentials.addEventListener("click", () => {
  formMessage.textContent = "";
  accessPassword.value = "";
  showPanel(choiceActions);
  dialog.showModal();
});

document.querySelector("#revealButton").addEventListener("click", () => {
  showPanel(passwordPanel);
  accessPassword.focus();
});

document.querySelector("#backButton").addEventListener("click", () => {
  formMessage.textContent = "";
  showPanel(choiceActions);
});

// Always reopen on the first panel, however the dialogue was dismissed.
dialog.addEventListener("close", () => {
  showPanel(choiceActions);
  accessPassword.value = "";
  formMessage.textContent = "";
});

/* ---------------------------------------------------------- the backend */

async function apiRequest(payload) {
  if (!API_URL) {
    throw new Error(
      "This gift has not been connected yet. " +
      "Please ask the sender to finish setup."
    );
  }

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  } catch (networkError) {
    throw new Error(
      "No connection to the gift service. " +
      "Please check your internet and try again."
    );
  }

  if (!response.ok) {
    throw new Error(
      "The gift service could not be reached. " +
      "Please try again shortly."
    );
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(
      data.message || "Something went wrong. Please try again."
    );
  }

  return data;
}

async function unlock() {
  const passphrase = accessPassword.value.trim();

  if (!passphrase) {
    formMessage.textContent = "Please enter the gift password.";
    accessPassword.focus();
    return;
  }

  submitPassword.disabled = true;
  submitPassword.textContent = "Checking…";
  formMessage.textContent = "";

  try {
    const data = await apiRequest({
      action: "reveal",
      passphrase: passphrase
    });

    document.querySelector("#username").textContent = data.username;
    document.querySelector("#accountPassword").textContent = data.password;
    document.querySelector("#profile").textContent = data.profile || "1";

    card.classList.add("unlocked");
    refreshHint();
    dialog.close();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    submitPassword.disabled = false;
    submitPassword.textContent = "Unlock";
  }
}

submitPassword.addEventListener("click", unlock);

accessPassword.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  event.preventDefault();
  unlock();
});

issueButton.addEventListener("click", async () => {
  issueButton.disabled = true;
  issueButton.textContent = "Checking account…";

  try {
    const data = await apiRequest({ action: "report" });

    document.querySelector("#successTitle").textContent =
      data.status === "solved"
        ? "New account details are ready"
        : "Issue reported";

    document.querySelector("#successMessage").textContent = data.message;
    showPanel(successPanel);
  } catch (error) {
    formMessage.textContent = "";
    window.alert(error.message);
  } finally {
    issueButton.disabled = false;
    issueButton.textContent = "Report an account issue";
  }
});

refreshHint();
