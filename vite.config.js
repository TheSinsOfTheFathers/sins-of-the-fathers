import { defineConfig } from 'vite';
import { resolve, relative, extname, basename } from 'path';
import fs from 'fs';

// Helper to recursively find all HTML files
function getHtmlEntries(dir) {
    const entries = {};
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = resolve(dir, file.name);

        if (file.isDirectory() && file.name !== 'node_modules' && file.name !== 'dist' && file.name !== '.git') {
            Object.assign(entries, getHtmlEntries(fullPath));
        } else if (file.isFile() && extname(file.name) === '.html') {
            // Generate a unique key for the input
            const relPath = relative(process.cwd(), fullPath);
            const name = relPath === 'index.html' ? 'main' :
                relPath.startsWith('pages') ? basename(relPath, '.html') :
                    relPath.replace(/\\/g, '/').replace(/\.html$/, ''); // Fallback for other structures

            // Handle duplicates or specific naming conventions if needed
            entries[name] = fullPath;
        }
    }
    return entries;
}

export default defineConfig({
    root: process.cwd(),

    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },

    build: {
        rollupOptions: {
            input: getHtmlEntries(process.cwd()),

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