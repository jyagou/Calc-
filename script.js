// This is the JavaScript for the calculator. It handles all the logic and updates the display. It does not handle any styling, which is done in style.css.
// ---------- 1. Grab elements from the HTML ----------
// We store them in variables so we can update them later.
const expressionEl = document.getElementById("expression"); // small line
const resultEl = document.getElementById("result");         // big line
const buttonsEl = document.querySelector(".buttons");       // the button grid

// ---------- 2. State (what the calculator is remembering) ----------
let currentInput = "0";      // the number currently shown (kept as text)
let previousValue = null;    // the first number, saved when you press an operator
let operator = null;         // the chosen operator: + − × ÷
let expression = "";         // the text for the small line, e.g. "12 ×"
let shouldResetInput = false; // true = the next digit starts a NEW number

// ---------- 3. Show the state on screen ----------
function updateDisplay() {
  resultEl.textContent = currentInput;
  expressionEl.textContent = expression;
}

// ---------- 4. Typing numbers ----------
function inputNumber(num) {
  // If the last thing was "=", start a completely new calculation
  if (operator === null && shouldResetInput) {
    expression = "";
  }

  // Replace the number if: we just pressed an operator/equals, or it's only "0"
  if (shouldResetInput || currentInput === "0") {
    currentInput = num;
    shouldResetInput = false;
  } else {
    currentInput += num; // otherwise add the digit to the end
  }
  updateDisplay();
}

// ---------- 5. Decimal point ----------
function inputDecimal() {
  if (shouldResetInput) {
    currentInput = "0.";       // starting a new number with "."
    shouldResetInput = false;
  } else if (!currentInput.includes(".")) {
    currentInput += ".";       // only allow one "." per number
  }
  updateDisplay();
}

// ---------- 6. Choosing an operator ----------
function chooseOperator(op) {
  if (currentInput === "Error") return;

  // Chaining: if you type 5 + 3 and then press × we finish 5 + 3 first
  if (operator !== null && !shouldResetInput) {
    const result = calculate();
    if (result === "Error") return showError();
    currentInput = String(result);
  }

  previousValue = parseFloat(currentInput);
  operator = op;
  expression = `${currentInput} ${op}`;
  shouldResetInput = true; // next digit starts the second number
  updateDisplay();
}

// ---------- 7. The math ----------
function calculate() {
  const a = previousValue;
  const b = parseFloat(currentInput);
  let result;

  switch (operator) {
    case "+": result = a + b; break;
    case "−": result = a - b; break;
    case "×": result = a * b; break;
    case "÷":
      if (b === 0) return "Error"; // can't divide by zero
      result = a / b;
      break;
    default: return b;
  }

  // Fixes problems like 0.1 + 0.2 = 0.30000000000000004
  return parseFloat(result.toFixed(10));
}

// ---------- 8. Equals button ----------
function pressEquals() {
  // Do nothing if there's no operator, or no second number yet
  if (operator === null || shouldResetInput) return;

  const secondNumber = currentInput;
  const result = calculate();

  if (result === "Error") return showError();

  expression = `${previousValue} ${operator} ${secondNumber} =`;

  // NEW: save this calculation to the history panel
  addToHistory(`${previousValue} ${operator} ${secondNumber}`, String(result));

  currentInput = String(result);
  previousValue = null;
  operator = null;
  shouldResetInput = true; // next digit starts a fresh calculation
  updateDisplay();

  // NEW: read the answer out loud
  speak(`The result is ${toSpeakable(currentInput)}`);
}


// ---------- 9. Error handling ----------
function showError() {
  currentInput = "Error";
  expression = "";
  previousValue = null;
  operator = null;
  shouldResetInput = true;
  updateDisplay();

  speak("Error. Cannot divide by zero.");
}

// ---------- 10. Clear (C) ----------
function clearAll() {
  currentInput = "0";
  previousValue = null;
  operator = null;
  expression = "";
  shouldResetInput = false;
  updateDisplay();
}

// ---------- 11. Plus/minus (+/-) ----------
function toggleSign() {
  if (currentInput === "Error" || currentInput === "0") return;
  currentInput = String(parseFloat(currentInput) * -1);
  updateDisplay();
}

// ---------- 12. Percent (%) ----------
function percent() {
  if (currentInput === "Error") return;
  currentInput = String(parseFloat(currentInput) / 100);
  updateDisplay();
}

// ---------- Backspace: delete the last typed digit ----------
function deleteLast() {
  // Don't edit a finished answer or an error message
  if (shouldResetInput || currentInput === "Error") return;

  // Remove the last character: "123" -> "12"
  currentInput = currentInput.slice(0, -1);

  // If nothing is left (or only "-" is left), go back to "0"
  if (currentInput === "" || currentInput === "-") {
    currentInput = "0";
  }
  updateDisplay();
}

// ---------- 13. Listen for button clicks ----------
// One listener on the whole grid handles every button (this is called
// "event delegation"). e.target.closest("button") finds which one was clicked.
buttonsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return; // ignore clicks on empty space between buttons

  // Read the data-* attributes we added in the HTML
  if (btn.dataset.number !== undefined) {
    inputNumber(btn.dataset.number);
  } else if (btn.dataset.operator !== undefined) {
    chooseOperator(btn.dataset.operator);
  } else if (btn.dataset.action === "decimal") {
    inputDecimal();
  } else if (btn.dataset.action === "equals") {
    pressEquals();
  } else if (btn.dataset.action === "clear") {
    clearAll();
  } else if (btn.dataset.action === "sign") {
    toggleSign();
  } else if (btn.dataset.action === "percent") {
    percent();
  }
});

// ---------- Dark / Light mode ----------
const themeToggle = document.getElementById("theme-toggle");

// Applies a theme by setting data-theme on <html>.
// Our CSS reacts to this attribute and swaps the colors.
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Show the icon for the mode you'd switch TO
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

// Decide the starting theme:
// 1) use the saved choice if there is one, 2) otherwise follow the device setting.
// try/catch protects us if the browser blocks localStorage.
let savedTheme = null;
try {
  savedTheme = localStorage.getItem("theme");
} catch (err) {}

const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

// When the toggle is clicked: flip the theme and save the choice.
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("theme", next);  // remembered even after refresh
  } catch (err) {}
});

// ---------- History ----------
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
const MAX_HISTORY = 50;   // keep only the 50 newest calculations

// Each entry looks like: { expression: "12 × 8", result: "96", time: "2026-11-07T..." }
let history = [];

// Load saved history when the page opens.
// try/catch protects us if storage is blocked or the saved data is broken.
try {
  const saved = JSON.parse(localStorage.getItem("calcHistory"));
  if (Array.isArray(saved)) history = saved;
} catch (err) {}

// Save the history array to the browser (localStorage only stores text,
// so JSON.stringify turns the array into text first).
function saveHistory() {
  try {
    localStorage.setItem("calcHistory", JSON.stringify(history));
  } catch (err) {}
}

// Add a new calculation to the TOP of the list.
function addToHistory(expressionText, resultText) {
  history.unshift({
    expression: expressionText,
    result: resultText,
    time: new Date().toISOString(),
  });
  history = history.slice(0, MAX_HISTORY);  // drop the oldest if over the limit
  saveHistory();
  renderHistory();
}

// Redraw the whole list from the history array.
function renderHistory() {
  historyListEl.innerHTML = "";   // empty the list first

  // Nothing saved yet? Show a friendly message.
  if (history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No calculations yet.";
    historyListEl.appendChild(empty);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "history-item";

    // Three lines: expression, result, time.
    // textContent (not innerHTML) is the safe way to put text on the page.
    const exprSpan = document.createElement("span");
    exprSpan.className = "history-expression";
    exprSpan.textContent = `${item.expression} =`;

    const resultSpan = document.createElement("span");
    resultSpan.className = "history-result";
    resultSpan.textContent = item.result;

    const timeSpan = document.createElement("span");
    timeSpan.className = "history-time";
    timeSpan.textContent = new Date(item.time).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    btn.append(exprSpan, resultSpan, timeSpan);

    // Clicking an entry loads its result back into the calculator,
    // so you can keep calculating from it.
    btn.addEventListener("click", () => {
      currentInput = item.result;
      expression = "";
      previousValue = null;
      operator = null;
      shouldResetInput = true;   // next digit starts a new number
      updateDisplay();
    });

    li.appendChild(btn);
    historyListEl.appendChild(li);
  });
}

// "Clear All" button
clearHistoryBtn.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

// Draw the saved history when the page loads
renderHistory();
// ---------- Mode switching (sidebar) ----------
const navItems = document.querySelectorAll(".nav-item");
const modeSections = document.querySelectorAll(".mode");
let currentMode = "normal";   // which mode is showing right now
// The History panel (the <aside class="history"> in the HTML)
const historyPanel = document.querySelector(".history");

function switchMode(mode) {
  currentMode = mode;

  // Show only the section whose id matches, e.g. "mode-discount"
  modeSections.forEach((section) => {
    section.hidden = section.id !== `mode-${mode}`;
  });
  
  // NEW: show the History panel only in Normal mode
  historyPanel.classList.toggle("invisible", mode !== "normal");
  // historyPanel.hidden  = mode !== "normal" 


  // Highlight the matching sidebar button
  navItems.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

navItems.forEach((btn) => {
  btn.addEventListener("click", () => switchMode(btn.dataset.mode));
});

// ---------- Money formatting ----------
// Turns 1600 into "₱1,600.00"
function formatPeso(amount) {
  return amount.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

// ---------- Discount mode ----------
const priceInput = document.getElementById("discount-price");
const percentInput = document.getElementById("discount-percent");
const salePriceEl = document.getElementById("sale-price");
const discountNoteEl = document.getElementById("discount-note");

let discountSpeech = "";   // the sentence the Read button will say

function updateDiscount() {
  const price = parseFloat(priceInput.value);
  const percent = parseFloat(percentInput.value);

  // Invalid or empty input: show zero and a hint instead of weird numbers
  if (isNaN(price) || isNaN(percent) || price < 0 || percent < 0 || percent > 100) {
    salePriceEl.textContent = formatPeso(0);
    discountNoteEl.textContent = "Enter a price and a discount from 0 to 100.";
    discountSpeech = "";   // NEW: nothing valid to read
    return;
  }

  const saved = (price * percent) / 100;   // how much you save
  const sale = price - saved;              // what you pay

  salePriceEl.textContent = formatPeso(sale);
  discountNoteEl.textContent = `You save ${formatPeso(saved)} (${percent}%)`;

  // NEW: "pesos" is spoken more clearly than the ₱ symbol
  discountSpeech = `The sale price is ${sale.toFixed(2)} pesos. You save ${saved.toFixed(2)} pesos.`;
}

// "input" fires on every keystroke, so results update live
priceInput.addEventListener("input", updateDiscount);
percentInput.addEventListener("input", updateDiscount);

// ---------- Tip & Split mode ----------
const billInput = document.getElementById("tip-bill");
const tipButtons = document.querySelectorAll(".tip-btn");
const customTipInput = document.getElementById("tip-custom");
const peopleCountEl = document.getElementById("people-count");
const tipAmountEl = document.getElementById("tip-amount");
const tipTotalEl = document.getElementById("tip-total");
const perPersonEl = document.getElementById("tip-per-person");

let tipPercent = 15;   // matches the button marked "active" in the HTML
let people = 1;
let tipSpeech = "";

function updateTip() {
  const bill = parseFloat(billInput.value);

  // Invalid input: show zeros
  if (isNaN(bill) || bill < 0 || isNaN(tipPercent) || tipPercent < 0) {
    tipAmountEl.textContent = formatPeso(0);
    tipTotalEl.textContent = formatPeso(0);
    perPersonEl.textContent = formatPeso(0);
    tipSpeech = "";   // NEW: nothing valid to read
    return;
  }

  const tip = (bill * tipPercent) / 100;
  const total = bill + tip;
  const perPerson = total / people;   // NEW: store it, since we use it twice


  tipAmountEl.textContent = formatPeso(tip);
  tipTotalEl.textContent = formatPeso(total);
  perPersonEl.textContent = formatPeso(perPerson);

  // NEW
  tipSpeech = `The tip is ${tip.toFixed(2)} pesos. The total is ${total.toFixed(2)} pesos. Each person pays ${perPerson.toFixed(2)} pesos.`;
}

// Preset buttons (10%, 15%, 20%)
tipButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tipPercent = parseFloat(btn.dataset.tip);
    customTipInput.value = "";                       // clear the custom box
    tipButtons.forEach((b) => b.classList.toggle("active", b === btn));
    updateTip();
  });
});

// Custom tip box: deselect the presets and use the typed number
customTipInput.addEventListener("input", () => {
  tipPercent = parseFloat(customTipInput.value);
  tipButtons.forEach((b) => b.classList.remove("active"));
  updateTip();
});

// People stepper: keep it between 1 and 50
document.getElementById("people-minus").addEventListener("click", () => {
  if (people > 1) people--;
  peopleCountEl.textContent = people;
  updateTip();
});
document.getElementById("people-plus").addEventListener("click", () => {
  if (people < 50) people++;
  peopleCountEl.textContent = people;
  updateTip();
});

billInput.addEventListener("input", updateTip);

// Start both modes with their default display
updateDiscount();
updateTip();

// ---------- Voice readout ----------
const voiceToggle = document.getElementById("voice-toggle");

// Some browsers don't support speech. If so, hide the button.
const speechSupported = "speechSynthesis" in window;
if (!speechSupported) voiceToggle.hidden = true;

// Load the saved on/off choice (off by default)
let voiceOn = false;
try {
  voiceOn = localStorage.getItem("voiceOn") === "true";
} catch (err) {}

// Show 🔊 when on and 🔇 when off
function updateVoiceButton() {
  voiceToggle.textContent = voiceOn ? "🔊" : "🔇";
  voiceToggle.setAttribute("aria-pressed", voiceOn);
}

// Say something out loud (does nothing if the voice is off)
function speak(text, force = false) {
  if (!speechSupported || !voiceOn && !force) return;

  window.speechSynthesis.cancel();   // stop anything still being said
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

// Turns "-5" into "negative 5" so it's spoken clearly
function toSpeakable(value) {
  return String(value).replace(/^-/, "negative ");
}

voiceToggle.addEventListener("click", () => {
  voiceOn = !voiceOn;
  try {
    localStorage.setItem("voiceOn", voiceOn);
  } catch (err) {}
  updateVoiceButton();
  // speak("Voice on");   // a short test, so you hear that it works

  if (voiceOn) {
    speak("Voice on");   // a short test, so you hear that it works
  } else {
    window.speechSynthesis.cancel();   // voice turned off: stop speaking right away
  }

});

updateVoiceButton();

// ---------- Currency mode ----------
const rateInput = document.getElementById("rate-input");
const currencyAmountInput = document.getElementById("currency-amount");
const fromLabelEl = document.getElementById("from-label");
const toLabelEl = document.getElementById("to-label");
const convertedEl = document.getElementById("converted");
const rateNoteEl = document.getElementById("rate-note");

let fromCurrency = "PHP";
let toCurrency = "USD";
let currencySpeech = "";   // the sentence the Read button will say

// Each currency gets its own number format (₱1,000.00 vs $17.50)
const currencyLocales = { PHP: "en-PH", USD: "en-US" };

// Full names are spoken better than "PHP" or "USD"
const currencyNames = { PHP: "Philippine pesos", USD: "US dollars" };

function formatMoney(amount, code) {
  return amount.toLocaleString(currencyLocales[code], {
    style: "currency",
    currency: code,
  });
}

function updateCurrency() {
  const amount = parseFloat(currencyAmountInput.value);
  const rate = parseFloat(rateInput.value);   // now means: pesos per 1 dollar

  // Labels follow the current direction
  fromLabelEl.textContent = `Amount in ${fromCurrency}`;
  toLabelEl.textContent = `Converted to ${toCurrency}`;

  // Invalid input: show zero and a hint instead of NaN
  if (isNaN(amount) || isNaN(rate) || amount < 0 || rate <= 0) {
    convertedEl.textContent = formatMoney(0, toCurrency);
    rateNoteEl.textContent = "Enter an amount and a valid rate.";
    currencySpeech = "";
    return;
  }

  // The rate is "pesos per dollar", so:
  //   PHP → USD: divide  (pesos ÷ pesos-per-dollar = dollars)
  //   USD → PHP: multiply (dollars × pesos-per-dollar = pesos)
  const converted = fromCurrency === "PHP" ? amount / rate : amount * rate;

  convertedEl.textContent = formatMoney(converted, toCurrency);
  rateNoteEl.textContent = `1 USD = ${formatMoney(rate, "PHP")}`;

  currencySpeech = `${amount} ${currencyNames[fromCurrency]} is ${converted.toFixed(2)} ${currencyNames[toCurrency]}.`;
}

// Swap button: trade the two currencies, then recalculate
document.getElementById("swap-currency").addEventListener("click", () => {
  [fromCurrency, toCurrency] = [toCurrency, fromCurrency];
  updateCurrency();
});

// Read button
document.getElementById("read-currency").addEventListener("click", () => {
  speak(currencySpeech || "Please enter an amount and a rate first.", true);
});

// Update live on every keystroke
rateInput.addEventListener("input", updateCurrency);
currencyAmountInput.addEventListener("input", updateCurrency);

updateCurrency();

// ---------- Read buttons ----------
// If there's nothing valid to read, say a helpful hint instead.
document.getElementById("read-discount").addEventListener("click", () => {
  speak(discountSpeech || "Please enter a price and a discount first.", true);
});

document.getElementById("read-tip").addEventListener("click", () => {
  speak(tipSpeech || "Please enter the total amount first.", true);
});

// document.getElementById("read-currency").addEventListener("click", () => {
//   speak(currencySpeech || "Please enter an amount and a rate first.", true);
// });

// Hide the Read buttons in browsers that can't speak
if (!speechSupported) {
  document.querySelectorAll(".read-btn").forEach((btn) => (btn.hidden = true));
}

// Show the starting "0" when the page loads
updateDisplay();


// ---------- Keyboard support ----------
// "keydown" fires every time a key is pressed anywhere on the page.
document.addEventListener("keydown", (e) => {
  // NEW: only handle calculator keys while in Normal mode
  if (currentMode !== "normal") return;
  // Ignore shortcuts like Ctrl+C / Cmd+C so copy and paste still work
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key;
  // ... the rest stays the same

  if (/^[0-9]$/.test(key)) {
    inputNumber(key);                 // digits 0-9
  } else if (key === ".") {
    inputDecimal();
  } else if (key === "+") {
    chooseOperator("+");
  } else if (key === "-") {
    chooseOperator("−");              // our button uses the "−" symbol, not "-"
  } else if (key === "*") {
    chooseOperator("×");              // keyboard has *, our button uses ×
  } else if (key === "/") {
    e.preventDefault();               // stops "/" from opening browser quick-find
    chooseOperator("÷");
  } else if (key === "Enter" || key === "=") {
    e.preventDefault();               // stops Enter from "clicking" a focused button again
    pressEquals();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape" || key.toLowerCase() === "c") {
    clearAll();
  } else if (key === "%") {
    percent();
  }

  
});