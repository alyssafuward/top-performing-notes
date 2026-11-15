# Top Performing Notes: Celebrations and Pangram

A smooth curve of likes for my 60 top performing Substack Notes, earliest to latest. Dots are color-coded by type (Celebration, Pangram, everything else). Click a dot or a quote to read the whole Note, then jump to it on Substack.

Plain HTML, CSS and JavaScript with [d3](https://d3js.org). No build step.

## Run it

```
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Files

- `index.html`, `style.css`, `app.js`: the page, its styles and the chart.
- `data.js`: the 60 Notes (rank, hand-labeled type, likes, date, full text, link, and the short quote shown in a bubble).

## Updating the data

Edit `data.js`. A Note gets a quote bubble when its `callout` is not empty. Bubbles are placed automatically so no line crosses another box, so not every callout fits at every width. Ranks 18 and 21 are pinned and always get one (`PINNED` in `app.js`).
