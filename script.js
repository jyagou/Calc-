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

// Show the starting "0" when the page loads
updateDisplay();

// ---------- Keyboard support ----------
// "keydown" fires every time a key is pressed anywhere on the page.
document.addEventListener("keydown", (e) => {
  const key = e.key; // the key that was pressed, e.g. "7", "+", "Enter"

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