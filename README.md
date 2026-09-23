# EduGenie — Google Gemini Powered Learning Assistant

A complete college-project starter implementation based on the supplied EduGenie documentation.

## Features
- Home dashboard
- Subject-wise learning
- Gemini AI Tutor
- Notes Generator
- Quiz Generator
- Flashcards
- Study Planner
- PDF upload and text extraction
- Exam Mode
- Local browser history/progress

## Requirements
- Node.js 18+
- A Google Gemini API key

## Run
1. Copy `.env.example` to `.env`
2. Put your Gemini API key in `.env`
3. Run:
   npm install
   npm start
4. Open:
   http://localhost:3000

## Important
The API key stays on the server. Do not put the Gemini key inside `public/app.js`.

## Project structure
- `server.js` — Express backend and Gemini API routes
- `public/index.html` — application UI
- `public/style.css` — responsive styling
- `public/app.js` — frontend logic
- `uploads/` — temporary uploaded PDFs
- `data/` — reserved for future database integration

This implementation is intentionally modular so Firebase/MongoDB/MySQL can be added later.
