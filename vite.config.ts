import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          about: path.resolve(__dirname, 'about.html'),
          projects: path.resolve(__dirname, 'projects.html'),
          contact: path.resolve(__dirname, 'contact.html'),
        },
      },
    },
    plugins: [
      // Copies standalone app.js into dist/ so both raw GitHub Pages
      // hosting and Vite production builds resolve ./app.js cleanly.
      {
        name: 'copy-static-portfolio-files',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const appJsSrc = path.resolve(__dirname, 'app.js');
          const appJsDist = path.resolve(distDir, 'app.js');
          if (fs.existsSync(distDir) && fs.existsSync(appJsSrc)) {
            fs.copyFileSync(appJsSrc, appJsDist);
          }
        },
      },
    ],
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
