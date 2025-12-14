import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: process.cwd(),

    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },

    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                characterDetail: resolve(__dirname, 'pages/character-detail.html'),
                characters: resolve(__dirname, 'pages/characters.html'),
                factionDetail: resolve(__dirname, 'pages/faction-detail.html'),
                factions: resolve(__dirname, 'pages/factions.html'),
                locationDetail: resolve(__dirname, 'pages/location-detail.html'),
                locations: resolve(__dirname, 'pages/locations.html'),
                login: resolve(__dirname, 'pages/login.html'),
                loreDetail: resolve(__dirname, 'pages/lore-detail.html'),
                lore: resolve(__dirname, 'pages/lore.html'),
                privacy: resolve(__dirname, 'pages/privacy.html'),
                profile: resolve(__dirname, 'pages/profile.html'),
                terms: resolve(__dirname, 'pages/terms.html'),
                timeline: resolve(__dirname, 'pages/timeline.html'),
            },
            
            output: {
                 assetFileNames: 'assets/[name]-[hash].[ext]',
                 chunkFileNames: 'assets/[name]-[hash].js',
                 entryFileNames: 'assets/[name]-[hash].js',
            }
        },
        
        outDir: './dist',
        emptyOutDir: true,
        minify: 'esbuild', 
        sourcemap: false,   
    },

    server: {
        open: true,
    }
});