# Calc+

More than just numbers. A multi-mode calculator built with plain HTML, CSS, and JavaScript, with no frameworks or libraries.

**[Live demo](https://jyagou.github.io/Calc-/)**

![Calc+ in dark mode](screenshots/dark.png)
![Calc+ in light mode](screenshots/light.png)

## Features

- **Calculator** with correct order of operations (`7 + 3 × 4 = 19`), keyboard support, and a saved history you can click to reuse
- **Discount calculator** that shows the sale price and how much you save
- **Tip and Split Bill** modes, with an optional tip when splitting
- **Currency converter** with 10 currencies, live rates, and an offline fallback
- **Voice readout** that says your answer in words ("one hundred and one"), with an animated sound wave
- **6 color palettes** and **Dark / Auto / Light** appearance that remembers your choice
- Settings to turn voice on and off, clear history, or reset everything

## Built with

HTML, CSS (custom properties, grid, flexbox), and vanilla JavaScript (DOM events, `localStorage`, `fetch`, Web Speech API).

## Known limitations

- Exchange rates update about once a day. If you're offline, Calc+ uses rough sample rates, and you can type your own rate in the box.
- Splitting a bill that doesn't divide evenly rounds each share to the nearest centavo.
- There are no parentheses buttons yet.

## Credits

- Exchange rates by [Exchange Rate API](https://www.exchangerate-api.com)
- Icons based on [Feather Icons](https://feathericons.com) (MIT license)

## Run it yourself

Download or clone the repository and open `index.html` in your browser. No installation is needed.
