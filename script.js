// Deployed Google Apps Script web-app endpoint.
const API_URL =
  "https://script.google.com/macros/s/AKfycbwzZyKmxPO6ZyYKp3l-2_S-b_VNWSM3ap5OMAvRCQzO1g9BD5a22gMpJL0_c2AFHIqeHQ/exec";

const card = document.querySelector("#giftCard");
const credentials = document.querySelector("#credentials");
const unlockTrigger = document.querySelector("#unlockTrigger");
const reportTrigger = document.querySelector("#reportTrigger");
const bowLayer = document.querySelector("#bowLayer");
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

const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------------------------------------------------------- falling bows */

const BOW_GLYPHS = ["\u{1F380}", "\u{1F380}", "\u{1F380}", "\u{1F381}", "\u{1F49D}"];

function makeBow(index, options) {
  const bow = document.createElement("span");
  const random = (min, max) => min + Math.random() * (max - min);

  bow.className = options.burst ? "bow bow-burst" : "bow";
  bow.textContent = BOW_GLYPHS[index % BOW_GLYPHS.length];

  bow.style.setProperty("--x", random(-2, 100).toFixed(2) + "vw");
  bow.style.setProperty("--drift", random(-7, 7).toFixed(2) + "vw");
  bow.style.setProperty("--spin", random(-420, 420).toFixed(0) + "deg");
  bow.style.setProperty("--size", random(0.85, 2).toFixed(2) + "rem");
  bow.style.setProperty("--dur", random(options.slowest, options.quickest).toFixed(2) + "s");
  bow.style.setProperty("--peak", random(options.faintest, options.boldest).toFixed(2));

  // A negative delay starts the bow part-way down, so the sky is never empty.
  bow.style.setProperty("--delay", options.burst
    ? random(0, 0.5).toFixed(2) + "s"
    : (-random(0, options.slowest)).toFixed(2) + "s");

  return bow;
}

function snowBows(count) {
  if (calmMotion.matches) return;

  for (let i = 0; i < count; i += 1) {
    bowLayer.appendChild(makeBow(i, {
      slowest: 17,
      quickest: 9,
      faintest: 0.35,
      boldest: 0.75
    }));
  }
}

/** A thicker flurry for the moment the gift opens; each bow falls once. */
function burstBows(count) {
  if (calmMotion.matches) return;

  for (let i = 0; i < count; i += 1) {
    const bow = makeBow(i, {
      burst: true,
      slowest: 7,
      quickest: 4,
      faintest: 0.7,
      boldest: 1
    });

    bow.addEventListener("animationend", () => bow.remove());
    bowLayer.appendChild(bow);
  }
}

/* ------------------------------------------------------------ card flip */

function flipCard() {
  const isFlipped = card.classList.toggle("flipped");
  card.setAttribute("aria-pressed", String(isFlipped));

  // Retrigger the lift even when the card is flipped again mid-turn.
  card.classList.remove("flipping");
  void card.offsetWidth;
  card.classList.add("flipping");

  refreshHint();
}

card.addEventListener("animationend", (event) => {
  if (event.target === card && event.animationName === "card-lift") {
    card.classList.remove("flipping");
  }
});

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

/* ------------------------------------------------------------ copy buttons */

async function writeToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Older mobile browsers, and anything served over plain http.
  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.position = "fixed";
  scratch.style.opacity = "0";
  document.body.appendChild(scratch);
  scratch.select();

  try {
    if (!document.execCommand("copy")) throw new Error("Copy was refused.");
  } finally {
    scratch.remove();
  }
}

document.querySelectorAll(".cred-copy").forEach((button) => {
  let resetTimer;

  button.addEventListener("click", async () => {
    const value = document.querySelector("#" + button.dataset.copy).textContent.trim();

    try {
      await writeToClipboard(value);
    } catch (error) {
      window.prompt("Copy this by hand:", value);
      return;
    }

    button.classList.add("is-copied");
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => button.classList.remove("is-copied"), 1600);
  });
});

/* --------------------------------------------------------- the dialogue */

function showPanel(panel) {
  choiceActions.hidden = panel !== choiceActions;
  passwordPanel.hidden = panel !== passwordPanel;
  successPanel.hidden = panel !== successPanel;
  dialogCopy.hidden = panel === successPanel;
}

function openDialog() {
  formMessage.textContent = "";
  accessPassword.value = "";
  showPanel(choiceActions);
  dialog.showModal();
}

unlockTrigger.addEventListener("click", openDialog);
reportTrigger.addEventListener("click", openDialog);

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

    dialog.close();

    card.classList.add("unlocked");
    card.classList.add("revealing");
    reportTrigger.hidden = false;
    burstBows(18);
    window.setTimeout(() => card.classList.remove("revealing"), 1800);

    refreshHint();
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
snowBows(16);
