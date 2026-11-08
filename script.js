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
}

// ---------- 9. Error handling ----------
function showError() {
  currentInput = "Error";
  expression = "";
  previousValue = null;
  operator = null;
  shouldResetInput = true;
  updateDisplay();
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

function updateDiscount() {
  const price = parseFloat(priceInput.value);
  const percent = parseFloat(percentInput.value);

  // Invalid or empty input: show zero and a hint instead of weird numbers
  if (isNaN(price) || isNaN(percent) || price < 0 || percent < 0 || percent > 100) {
    salePriceEl.textContent = formatPeso(0);
    discountNoteEl.textContent = "Enter a price and a discount from 0 to 100.";
    return;
  }

  const saved = (price * percent) / 100;   // how much you save
  const sale = price - saved;              // what you pay

  salePriceEl.textContent = formatPeso(sale);
  discountNoteEl.textContent = `You save ${formatPeso(saved)} (${percent}%)`;
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

function updateTip() {
  const bill = parseFloat(billInput.value);

  // Invalid input: show zeros
  if (isNaN(bill) || bill < 0 || isNaN(tipPercent) || tipPercent < 0) {
    tipAmountEl.textContent = formatPeso(0);
    tipTotalEl.textContent = formatPeso(0);
    perPersonEl.textContent = formatPeso(0);
    return;
  }

  const tip = (bill * tipPercent) / 100;
  const total = bill + tip;

  tipAmountEl.textContent = formatPeso(tip);
  tipTotalEl.textContent = formatPeso(total);
  perPersonEl.textContent = formatPeso(total / people);
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

// Show the starting "0" when the page loads
updateDisplay();

// ---------- Keyboard support ----------
// "keydown" fires every time a key is pressed anywhere on the page.
document.addEventListener("keydown", (e) => {
  // NEW: only handle calculator keys while in Normal mode
  if (currentMode !== "normal") return;

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