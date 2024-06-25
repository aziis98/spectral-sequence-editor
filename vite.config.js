import solid from 'vite-plugin-solid'

import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
    },
    plugins: [solid()],
})
