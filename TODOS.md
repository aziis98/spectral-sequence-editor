# TODO

## Lazy/Dynamic Grid Data Structure

```js
function createGrid() {
    const grid = { }

    return {
        getCell(r, p, q) {
            const index = `${r} ${p} ${q}`
            return grid[index] ?? null
        },
        setCell(r, p, q, value) {
            const index = `${r} ${p} ${q}`
            
            if (!grid[index]) {
                grid[index] = createCell(value)
            } else {
                if (value.length === 0) {
                    delete grid[index]
                } 

                grid[index].setValue(value)
            }
        },
        getCellsPageViewport(r, pMin, pMax, qMin, qMax) {
            const cells = {}
            for (let p = pMin; p <= pMax; p++) {
                for (let q = qMin; q <= qMax; q++) {
                    const cell = this.getCell(r, p, q)
                    if (cell) {
                        cells[`${p} ${q}`] = cell
                    }
                }
            }

            return cells
        }
    }
}
```

To compute the viewport using `--pan-x` and `--pan-y`:

```js
function getViewport(r, panX, panY) {
    const pMin = Math.floor(panX / CELL_SIZE)
    const pMax = Math.ceil((panX + VIEWPORT_WIDTH) / CELL_SIZE)
    const qMin = Math.floor(panY / CELL_SIZE)
    const qMax = Math.ceil((panY + VIEWPORT_HEIGHT) / CELL_SIZE)

    return { pMin, pMax, qMin, qMax }
}
```

where `CELL_SIZE` for now is found in the css

```css
transform: translate(
    calc(-50% + 6rem * var(--x, 0)), 
    calc(-50% - 6rem * var(--y, 0)) /* HTML has element origins in the upper-left corner of the page */
);
```

so `CELL_SIZE = 6rem`.