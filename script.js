// This is the JavaScript for the calculator. It handles all the logic and updates the display. It does not handle any styling, which is done in style.css.
// ---------- 1. Grab elements from the HTML ----------
// We store them in variables so we can update them later.
const expressionEl = document.getElementById("expression"); // small line
const resultEl = document.getElementById("result");         // big line
const buttonsEl = document.querySelector(".buttons");       // the button grid

// ---------- 2. State (what the calculator is remembering) ----------
let currentInput = "0";      // the number currently shown (kept as text)
let tokens = [];   // the finished parts of the expression, e.g. [7, "+", 3, "×"]
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
  if (tokens.length === 0 && shouldResetInput) {
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
  if (tokens.length === 0 && shouldResetInput) {
    expression = "";
  }

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

  if (shouldResetInput && tokens.length > 0) {
    // An operator was just pressed, so the person changed their mind: swap it
    tokens[tokens.length - 1] = op;
  } else {
    // Save the number being typed, then the operator
    tokens.push(parseFloat(currentInput), op);
    shouldResetInput = true;   // the next digit starts a new number
  }

  expression = tokens.join(" ");   // e.g. "7 + 3 ×"
  updateDisplay();
}

// ---------- 7. The math ----------
// ---------- The math, with order of operations ----------
// Takes a list like [7, "+", 3, "×", 4] and returns the answer (19).
function evaluate(list) {
  // Pass 1: do × and ÷ first. "stack" holds numbers and the + − still waiting.
  const stack = [list[0]];

  for (let i = 1; i < list.length; i += 2) {   // each step: one operator + the number after it
    const op = list[i];
    const next = list[i + 1];

    if (op === "×" || op === "÷") {
      const left = stack.pop();                // take the number just before it
      if (op === "÷" && next === 0) return "Error";   // can't divide by zero
      stack.push(op === "×" ? left * next : left / next);
    } else {
      stack.push(op, next);                    // + and − wait for pass 2
    }
  }

  // Pass 2: only + and − are left, so go left to right
  let result = stack[0];
  for (let i = 1; i < stack.length; i += 2) {
    result = stack[i] === "+" ? result + stack[i + 1] : result - stack[i + 1];
  }

  // Fixes problems like 0.1 + 0.2 = 0.30000000000000004
  return parseFloat(result.toFixed(10));
}

// ---------- 8. Equals button ----------
function pressEquals() {
  // Nothing to do if there's no operator yet, or the last key pressed was an operator
  if (tokens.length === 0 || shouldResetInput) return;

  // The saved parts plus the number being typed, e.g. [7, "+", 3, "×", 4]
  const fullExpression = [...tokens, parseFloat(currentInput)];
  const result = evaluate(fullExpression);

  if (result === "Error") return showError();

  const expressionText = fullExpression.join(" ");
  expression = `${expressionText} =`;

  addToHistory(expressionText, String(result));

  currentInput = String(result);
  tokens = [];               // start fresh, but keep the result on screen
  shouldResetInput = true;   // next digit starts a new calculation
  updateDisplay();

  speak(`The result is ${numberToWords(currentInput)}`);
}

// ---------- 9. Error handling ----------
function showError() {
  currentInput = "Error";
  expression = "";
  tokens = [];
  shouldResetInput = true;
  updateDisplay();

  speak("Error. Cannot divide by zero.");
}

function clearAll() {
  currentInput = "0";
  tokens = [];
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

      // ---------- Appearance: Dark / Auto / Light ----------
      const themeToggle = document.getElementById("theme-toggle");          // round button at the top
      const appearanceBtns = document.querySelectorAll(".appearance-btn");  // the 3-way switch
      const appearanceNote = document.getElementById("appearance-note");

      // Asks the browser: "does the device want dark mode right now?"
      const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // themeMode is what the PERSON chose: "dark", "light", or "auto".
      // This is the one value everything else is based on.
      let themeMode = "auto";

      // Turns the choice into an actual theme. In auto mode, the device decides.
      function getEffectiveTheme() {
        if (themeMode === "auto") return systemDarkQuery.matches ? "dark" : "light";
        return themeMode;
      }

      // Updates the page and everything that shows the current mode
      function applyThemeMode() {
        const theme = getEffectiveTheme();

        // Our CSS reacts to this attribute and swaps the colors
        document.documentElement.setAttribute("data-theme", theme);

        // The round button shows the mode you'd switch TO
        themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";

        // Highlight the chosen button in the 3-way switch
        appearanceBtns.forEach((btn) => {
          const isActive = btn.dataset.themeMode === themeMode;
          btn.classList.toggle("active", isActive);
          btn.setAttribute("aria-pressed", isActive);
        });

        // Explain what Auto is doing right now
        appearanceNote.textContent =
          themeMode === "auto" ? `Following your device (${theme})` : "";
      }

      // Saves a new choice and applies it
      function setThemeMode(mode) {
        themeMode = mode;
        try {
          localStorage.setItem("themeMode", mode);
        } catch (err) {}
        applyThemeMode();
      }

      // Load the saved choice. We also read the old "theme" value saved by the
      // earlier version, so nobody loses their setting.
      try {
        const saved = localStorage.getItem("themeMode") || localStorage.getItem("theme");
        if (["dark", "light", "auto"].includes(saved)) themeMode = saved;
      } catch (err) {}

      // The 3-way switch
      appearanceBtns.forEach((btn) => {
        btn.addEventListener("click", () => setThemeMode(btn.dataset.themeMode));
      });

      // The round button at the top still flips between dark and light
      themeToggle.addEventListener("click", () => {
        setThemeMode(getEffectiveTheme() === "dark" ? "light" : "dark");
      });

      // If the device switches (for example, at sunset), follow it, but only in Auto mode
      systemDarkQuery.addEventListener("change", () => {
        if (themeMode === "auto") applyThemeMode();
      });

      applyThemeMode();

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

// Turns a saved date into "Today, 10:24 AM", "Yesterday, 9:58 PM", or "Nov 6, 2:50 PM"
function formatHistoryTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Compare calendar days (midnight to midnight), not hours
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);   // 86,400,000 ms = 1 day

  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
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
    timeSpan.textContent = formatHistoryTime(item.time);

    // The ↻ icon on the right shows that clicking reuses the result
    const reuseIcon = document.createElement("span");
    reuseIcon.className = "history-reuse";
    reuseIcon.textContent = "↻";
    reuseIcon.setAttribute("aria-hidden", "true");   // decoration only, screen readers skip it

    btn.title = "Use this result";
    btn.append(exprSpan, resultSpan, timeSpan, reuseIcon);
    // btn.append(exprSpan, resultSpan, timeSpan);

    // Clicking an entry loads its result back into the calculator,
    // so you can keep calculating from it.
    btn.addEventListener("click", () => {
      currentInput = item.result;
      expression = "";
      tokens = [];
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

const includeTipEl = document.getElementById("include-tip");
const tipFieldEl = document.getElementById("tip-field");
const tipRowEl = document.getElementById("tip-row");
const totalLabelEl = document.getElementById("total-label");
let tipMode = "tip";   // which tab is open: "tip" or "split"

function updateTip() {
  const bill = parseFloat(billInput.value);

  // Is the tip part of the math right now?
  // Yes on the Tip tab, and on the Split tab only if "Include tip" is ticked.
  const useTip = tipMode === "tip" || includeTipEl.checked;

  // Show or hide the tip buttons and the Tip Amount row to match
  tipFieldEl.hidden = !useTip;
  tipRowEl.hidden = !useTip;
  totalLabelEl.textContent = useTip ? "Total (with tip)" : "Bill Total";

  const badTip = useTip && (isNaN(tipPercent) || tipPercent < 0);

  // Invalid input: show zeros
  if (isNaN(bill) || bill < 0 || badTip) {
    tipAmountEl.textContent = formatPeso(0);
    tipTotalEl.textContent = formatPeso(0);
    perPersonEl.textContent = formatPeso(0);
    tipSpeech = "";
    return;
  }

  const tip = useTip ? (bill * tipPercent) / 100 : 0;   // no tip = 0
  const total = bill + tip;

  tipAmountEl.textContent = formatPeso(tip);
  tipTotalEl.textContent = formatPeso(total);

  if (tipMode === "tip") {
    tipSpeech = `The tip is ${tip.toFixed(2)} pesos. The total is ${total.toFixed(2)} pesos.`;
  } else {
    const perPerson = total / people;   // the tip is added BEFORE dividing
    perPersonEl.textContent = formatPeso(perPerson);

    const group = `${people} ${people === 1 ? "person" : "people"}`;
    tipSpeech = useTip
      ? `The total with tip is ${total.toFixed(2)} pesos. Split between ${group}, each pays ${perPerson.toFixed(2)} pesos.`
      : `The bill is ${total.toFixed(2)} pesos. Split between ${group}, each pays ${perPerson.toFixed(2)} pesos.`;
  }
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
// Ticking or unticking "Include tip" recalculates
includeTipEl.addEventListener("change", updateTip);

// Start both modes with their default display
updateDiscount();
updateTip();

// ---------- Tip & Split tabs ----------
const tipTabs = document.querySelectorAll(".tab");

function setTipMode(mode) {
  tipMode = mode;

  // Highlight the chosen tab
  tipTabs.forEach((tab) => {
    const isActive = tab.dataset.tab === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });

  // Show only the fields and rows that belong to this tab
  document.querySelectorAll("#mode-tip [data-show]").forEach((el) => {
    el.hidden = el.dataset.show !== mode;
  });

  updateTip();   // recalculate, so results and the Read sentence match this tab
}

tipTabs.forEach((tab) => {
  tab.addEventListener("click", () => setTipMode(tab.dataset.tab));
});

setTipMode("tip");   // start on the Tip Calculator tab

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

// ---------- Number to words ("101" -> "one hundred and one") ----------
const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const scales = ["", "thousand", "million", "billion", "trillion"];

// Converts 1-999 to words, e.g. 101 -> "one hundred and one"
function chunkToWords(n) {
  let words = "";
  if (n >= 100) {
    words = ones[Math.floor(n / 100)] + " hundred";
    n %= 100;
    if (n > 0) words += " and ";
  }
  if (n >= 20) {
    words += tens[Math.floor(n / 10)];
    if (n % 10) words += "-" + ones[n % 10];
  } else if (n > 0) {
    words += ones[n];
  }
  return words;
}

// Converts a whole number by working through it 3 digits at a time
function integerToWords(n) {
  if (n === 0) return "zero";
  const parts = [];
  let scaleIndex = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      const words = chunkToWords(chunk);
      parts.unshift(scales[scaleIndex] ? `${words} ${scales[scaleIndex]}` : words);
    }
    n = Math.floor(n / 1000);
    scaleIndex++;
  }
  return parts.join(" ");
}

// Handles negatives and decimals: "-12.5" -> "negative twelve point five"
function numberToWords(value) {
  const text = String(value);
  // Not a plain number (like "Error" or "1e+21")? Say it as it is.
  if (!/^-?\d+(\.\d+)?$/.test(text)) return text;

  const negative = text.startsWith("-");
  const [intPart, decPart] = text.replace("-", "").split(".");
  if (intPart.length > 15) return text;   // too big to say safely

  let words = integerToWords(parseInt(intPart, 10));
  if (decPart) {
    // Decimals are read one digit at a time: .25 -> "two five"
    words += " point " + decPart.split("").map((d) => ones[Number(d)]).join(" ");
  }
  return (negative ? "negative " : "") + words;
}

// Say something out loud (does nothing if the voice is off)
const voiceCardEl = document.getElementById("voice-card");
const voiceTextEl = document.getElementById("voice-text");

function speak(text, force = false) {
  if (!speechSupported || (!voiceOn && !force)) return;

  window.speechSynthesis.cancel();   // stop anything still being said
  voiceTextEl.textContent = text;    // show the sentence on the card

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  // Animate the wave only while the voice is actually talking
  utterance.onstart = () => voiceCardEl.classList.add("speaking");
  utterance.onend = () => voiceCardEl.classList.remove("speaking");
  utterance.onerror = () => voiceCardEl.classList.remove("speaking");
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


  if (voiceOn) {
    speak("Voice on");   // a short test, so you hear that it works
  } else {
    window.speechSynthesis.cancel();   // voice turned off: stop speaking right away
    voiceCardEl.classList.remove("speaking");   // NEW
  }

});

updateVoiceButton();

// ---------- Currency mode ----------
const fromSelect = document.getElementById("from-select");
const toSelect = document.getElementById("to-select");
const currencyAmountInput = document.getElementById("currency-amount");
const rateInput = document.getElementById("rate-input");
const rateLabelEl = document.getElementById("rate-label");
const convertedEl = document.getElementById("converted");
const currencyHintEl = document.getElementById("currency-hint");
const rateStatusEl = document.getElementById("rate-status");

let currencySpeech = "";   // the sentence the Read button will say

// The currencies we offer. To add one, add a line here and one in ratesPerUSD.
// "spoken" is what the voice says (full names sound better than codes).
const currencies = {
  PHP: { name: "Peso",      spoken: "Philippine pesos" },
  USD: { name: "US Dollar", spoken: "US dollars" },
  EUR: { name: "Euro",      spoken: "euros" },
  GBP: { name: "Pound",     spoken: "British pounds" },
  JPY: { name: "Yen",       spoken: "Japanese yen" },
  KRW: { name: "Won",       spoken: "South Korean won" },
  SGD: { name: "SG Dollar", spoken: "Singapore dollars" },
  AUD: { name: "AU Dollar", spoken: "Australian dollars" },
  CAD: { name: "CA Dollar", spoken: "Canadian dollars" },
  CNY: { name: "Yuan",      spoken: "Chinese yuan" },
};

// How many of each currency equal 1 US dollar.
// These are only rough SAMPLE values for when you're offline.
// Live rates replace them as soon as they load.
let ratesPerUSD = {
  USD: 1, PHP: 62, EUR: 0.92, GBP: 0.79, JPY: 150,
  KRW: 1400, SGD: 1.34, AUD: 1.52, CAD: 1.38, CNY: 7.2,
};

// ----- Fill both dropdowns from the list above -----
Object.entries(currencies).forEach(([code, info]) => {
  const label = `${code} – ${info.name}`;
  fromSelect.add(new Option(label, code));   // new Option(text, value)
  toSelect.add(new Option(label, code));
});
fromSelect.value = "PHP";
toSelect.value = "USD";

// Turns 1234.5 and "USD" into "$1,234.50" (JPY and KRW get no decimals automatically)
function formatMoney(amount, code) {
  return amount.toLocaleString("en-US", { style: "currency", currency: code });
}

// ----- The rate between the two chosen currencies -----
// Both rates are "per 1 USD", so dividing one by the other gives 1 FROM = ? TO.
function fillRate() {
  const from = fromSelect.value;
  const to = toSelect.value;
  const rate = ratesPerUSD[to] / ratesPerUSD[from];

  rateInput.value = Number(rate.toPrecision(6));   // tidy: 6 significant digits
  rateLabelEl.textContent = `Exchange Rate (1 ${from} = ? ${to})`;
}

// ----- Result handling -----
// Called whenever an input changes, so an old answer never sits next to new inputs.
function resetResult() {
  convertedEl.textContent = "—";
  currencyHintEl.textContent = "Enter an amount, then press Convert.";
  currencySpeech = "";
}

function convert() {
  const amount = parseFloat(currencyAmountInput.value);
  const rate = parseFloat(rateInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  // Invalid input: no answer, just a hint (never NaN)
  if (isNaN(amount) || isNaN(rate) || amount < 0 || rate <= 0) {
    convertedEl.textContent = "—";
    currencyHintEl.textContent = "Enter an amount and a valid rate.";
    currencySpeech = "";
    return;
  }

  // The rate means "1 FROM = rate TO", so one multiplication works for every pair
  const converted = amount * rate;

  convertedEl.textContent = formatMoney(converted, to);
  currencyHintEl.textContent = `1 ${from} = ${Number(rate.toPrecision(6))} ${to}`;
  currencySpeech = `${amount} ${currencies[from].spoken} is ${converted.toFixed(2)} ${currencies[to].spoken}.`;
}

// ----- Live rates from a free API (with a safe fallback) -----
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const RATES_CACHE_KEY = "ratesCache";
const RATES_MAX_AGE_MS = 12 * 60 * 60 * 1000;   // reuse saved rates for 12 hours

// Copy the rates for OUR currencies into ratesPerUSD, then refresh the rate box
function useRates(apiRates, updatedText) {
  Object.keys(currencies).forEach((code) => {
    if (typeof apiRates[code] === "number") ratesPerUSD[code] = apiRates[code];
  });
  rateStatusEl.textContent = `Rates updated ${updatedText}`;
  fillRate();
}

// "async" lets us wait for the internet with "await" without freezing the page
async function loadRates() {
  // 1) Recent saved rates? Use them, so we don't ask the API on every page load.
  try {
    const cached = JSON.parse(localStorage.getItem(RATES_CACHE_KEY));
    if (cached && Date.now() - cached.savedAt < RATES_MAX_AGE_MS) {
      useRates(cached.rates, cached.updated);
      return;
    }
  } catch (err) {}

  // 2) Otherwise ask the API
  try {
    const response = await fetch(RATES_URL);
    const data = await response.json();
    if (data.result !== "success") throw new Error("Bad response");

    const updated = data.time_last_update_unix
      ? new Date(data.time_last_update_unix * 1000).toLocaleDateString()
      : new Date().toLocaleDateString();

    useRates(data.rates, updated);

    try {
      localStorage.setItem(
        RATES_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), updated, rates: data.rates })
      );
    } catch (err) {}
  } catch (err) {
    // 3) No internet or the API is down: keep the sample rates and say so
    rateStatusEl.textContent = "Offline: showing sample rates. Type the real rate in the box above.";
  }
}

// ----- Events -----
// Changing a dropdown: load that pair's rate and clear the old answer
[fromSelect, toSelect].forEach((select) => {
  select.addEventListener("change", () => {
    fillRate();
    resetResult();
  });
});

// Typing in the amount or rate box clears the old answer
[currencyAmountInput, rateInput].forEach((input) => {
  input.addEventListener("input", resetResult);
  // Pressing Enter in either box is the same as clicking Convert
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") convert();
  });
});

// Swap: trade the two dropdown choices
document.getElementById("swap-currency").addEventListener("click", () => {
  [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
  fillRate();
  resetResult();
});

document.getElementById("convert-btn").addEventListener("click", convert);

document.getElementById("read-currency").addEventListener("click", () => {
  speak(currencySpeech || "Please enter an amount and press Convert first.", true);
});

// ----- Start up -----
fillRate();     // show the sample rate right away
resetResult();
loadRates();    // then try to replace it with live rates

// ---------- Read buttons ----------
// If there's nothing valid to read, say a helpful hint instead.
document.getElementById("read-discount").addEventListener("click", () => {
  speak(discountSpeech || "Please enter a price and a discount first.", true);
});

document.getElementById("read-tip").addEventListener("click", () => {
  speak(tipSpeech || "Please enter the total amount first.", true);
});

// Hide the Read buttons in browsers that can't speak
if (!speechSupported) {
  document.querySelectorAll(".read-btn").forEach((btn) => (btn.hidden = true));
}

// ---------- Color palettes (theme picker) ----------
const swatches = document.querySelectorAll(".swatch");

// The palette names come straight from the HTML buttons
const validPalettes = [...swatches].map((s) => s.dataset.palette);

// Sets data-palette on <html>. Our CSS reacts to it and swaps the colors.
function applyPalette(name) {
  if (name === "default") {
    document.documentElement.removeAttribute("data-palette");   // back to the original colors
  } else {
    document.documentElement.setAttribute("data-palette", name);
  }

  // Put the ring on the chosen swatch only
  swatches.forEach((s) => s.classList.toggle("active", s.dataset.palette === name));
}

// Load the saved choice. If it's missing or not recognized, use "default".
let savedPalette = "default";
try {
  const stored = localStorage.getItem("palette");
  if (validPalettes.includes(stored)) savedPalette = stored;
} catch (err) {}
applyPalette(savedPalette);

// Clicking a swatch applies and saves it
swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    applyPalette(swatch.dataset.palette);
    try {
      localStorage.setItem("palette", swatch.dataset.palette);
    } catch (err) {}
  });
});

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