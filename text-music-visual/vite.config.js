import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react({
            // Enable JSX in .js files
            include: '**/*.{jsx,js}'
        }),
        glsl({
            include: [
                '**/*.glsl',
                '**/*.wgsl',
                '**/*.vert',
                '**/*.frag',
                '**/*.vs',
                '**/*.fs'
            ],
            exclude: undefined,
            warnDuplicatedImports: true,
            defaultExtension: 'glsl',
            compress: false,
            watch: true,
            root: '/'
        })
    ],

    // Development server
    server: {
        port: 3000,
        open: true,
        cors: true
    },

    // Build options
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-three': ['three'],
                    'vendor-strudel': ['@strudel/core', '@strudel/mini', '@strudel/webaudio']
                }
            }
        },
        // Optimize chunks
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false, // Keep console for debugging
                drop_debugger: true
            }
        }
    },

    // Resolve aliases
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@core': resolve(__dirname, './src/core'),
            '@audio': resolve(__dirname, './src/audio'),
            '@visual': resolve(__dirname, './src/visual'),
            '@mapping': resolve(__dirname, './src/mapping'),
            '@ai': resolve(__dirname, './src/ai'),
            '@ui': resolve(__dirname, './src/ui'),
            '@demos': resolve(__dirname, './src/demos')
        },
        // Force all @strudel packages to resolve from main node_modules
        dedupe: ['@strudel/core', '@strudel/mini', '@strudel/webaudio']
    },

    // Optimize dependencies
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'three',
            '@strudel/core',
            '@strudel/mini',
            '@strudel/webaudio'
        ],
        esbuildOptions: {
            target: 'es2020'
        }
    },

    // Handle GLSL shader imports
    assetsInclude: ['**/*.glsl'],

    // Define global constants
    define: {
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
    },

    // CSS handling
    css: {
        modules: {
            localsConvention: 'camelCase'
        }
    },

    // Preview server (for testing production build)
    preview: {
        port: 4173,
        open: true
    }
});
