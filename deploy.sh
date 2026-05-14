#!/bin/bash
cd ~/Desktop/igoia/apps/admin
npm install
npx vite build
cd dist
npx vercel deploy . --prod
