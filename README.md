# Speed, Distance, & Time Interactive Tutor

An interactive web application designed to teach kids speed, time, and distance algebra word problems through real-time animations, dynamic tables, and step-by-step algebraic solutions.

Based on the rate word problems curriculum from the [Intermediate Algebra Textbook Chapter](https://opentextbc.ca/intermediatealgebraberg/chapter/rate-word-problems-speed-distance-and-time/).

## Features

- **26 Problems in Total**: Features all 4 Textbook Examples and all 22 Practice Questions.
- **Physics Canvas Animations**: Illustrates movement equations in real-time with custom animated characters, cars, canoes, scooters, and trains.
- **Interactive Sandbox Playground**: Sliders allow kids to modify rates, delays, and distances. The entire algebraic solution recalculates and updates instantly!
- **Dynamic Algebra Solver**: Generates the standard $d = r \times t$ rate table and clean, step-by-step algebraic steps for every problem dynamically based on input variables.
- **Self-Testing Interactive Quizzes**: Provides immediate checking of answers with float tolerance.
- **Responsive Premium Interface**: Sleek dark mode (with glassmorphism/acrylic effects) and a light theme toggle, optimized for desktop and mobile devices.

## File Structure

- `index.html`: The structural layout of the single-page application.
- `style.css`: Premium CSS styling tokens, themes, layout grids, and card effects.
- `app.js`: Core database of 26 problems, physics/animation render loop, and algebra solver engine.
- `launch.py`: Local Python web server launcher.

## Getting Started

To run the application locally:
1. Ensure you have Python installed.
2. Run the launcher script:
   ```bash
   python launch.py
   ```
3. The app will start a local HTTP server and automatically open in your default browser at `http://localhost:8080`.
