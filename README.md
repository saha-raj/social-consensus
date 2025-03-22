# Prisoner's Dilemma Simulation

A web-based visualization of the Prisoner's Dilemma simulation that runs entirely in the browser. This application allows users to select competing strategies and visualize how they perform against each other in a population of agents.

## Features

- Select from seven different strategies: Cooperator, Defector, Tit for Tat, Random, Grudger, Detective, and Pavlov
- Configure population size, total games to play, and games per pairing using intuitive sliders
- Visualize agent interactions in real-time with a dynamic force-directed layout
- View score distributions in a dual-sided histogram
- Track statistics and results as the simulation progresses

## How It Works

1. **Agent Creation**: The application creates a population of agents distributed equally between two selected strategies.
2. **Game Rounds**: Agents are randomly paired to play a series of Prisoner's Dilemma games.
3. **Scoring**: Agents accumulate scores based on their interactions, with their size in the visualization reflecting their performance.
4. **Visualization**: The process is visualized using D3.js, showing agents, their interactions, and score distributions.
5. **Analysis**: When the simulation completes, statistics show which strategy performed better.

## Prisoner's Dilemma Payoffs

The classic Prisoner's Dilemma payoff matrix is used:

- Both cooperate: 3 points each (mutual cooperation)
- Both defect: 1 point each (mutual defection)
- One defects, one cooperates: Defector gets 5 points, cooperator gets 0 points

## Strategies

- **Cooperator**: Always cooperates regardless of what the opponent does.
- **Defector**: Always defects regardless of what the opponent does.
- **Tit for Tat**: Starts by cooperating, then copies the opponent's previous move.
- **Random**: Randomly chooses to cooperate or defect with equal probability.
- **Grudger**: Cooperates until the opponent defects, then always defects.
- **Detective**: Starts with a specific sequence, then switches to Tit for Tat if the opponent ever defects, otherwise defects.
- **Pavlov**: Starts by cooperating, then changes strategy only when receiving a low payoff.

## Technologies Used

- Vanilla JavaScript for simulation logic
- D3.js for visualizations
- HTML/CSS for the user interface

## How to Run

You can run the application in two ways:

1. **Simple Method**: Open the `index.html` file in a modern web browser.

2. **Using the Server**: Run `node server.js` in the project directory to start a local server. The server will automatically try different ports (3000-3005) if the default port is already in use.

## Project Structure

- `index.html`: Main HTML file
- `css/styles.css`: Styling for the application
- `js/strategies.js`: Defines different Prisoner's Dilemma strategies
- `js/game.js`: Implements the core game mechanics
- `js/tournament.js`: Handles the tournament logic
- `js/visualization.js`: Manages the D3.js visualization
- `js/main.js`: Main application logic and initialization
- `server.js`: Simple HTTP server for local development 