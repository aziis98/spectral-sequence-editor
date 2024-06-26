<p align="center">
<img width="75%" src="https://github.com/aziis98/spectral-sequence-editor/assets/5204494/b5cd0d4f-3515-4bf8-9482-9b7fb3b40f8b" alt="screenshot" />
</p>

# Spectral Sequence Editor

I don't knot much about [spectral sequences](https://en.wikipedia.org/wiki/Spectral_sequence), but maybe this tool will help someone who does.

## Features

- [x] Pannable grid of cells
- [x] Edit cells by double-clicking on it
- [x] Arrows
- [x] Highlight current hovered diagonal
- [ ] Lazy/Dynamic grid to improve performance and have a costant number of nodes on screen
- [ ] Export to TikZ
- [ ] Save grid to local storage
- [ ] More settings for arrows and templating
- [ ] [Onion skin](https://en.wikipedia.org/wiki/Onion_skinning) to view more pages at once (?)

For more features open an issue and let's talk about it

## Usage

```bash
# With NPM
npm install    # install deps
npm run dev    # for development
npm run build  # build for production

# With Bun
bun install    # install deps
bun dev        # for development
bun run build  # build for production
```
