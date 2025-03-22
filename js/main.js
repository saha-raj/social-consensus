/**
 * main.js
 * 
 * This is the main entry point for the Opinion Dynamics simulation application.
 * It initializes the application, sets up event listeners, and coordinates
 * the interaction between different modules.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const proportionSlider = document.getElementById('proportion-slider');
    const proportionLabelLeft = document.getElementById('proportion-label-left');
    const proportionLabelRight = document.getElementById('proportion-label-right');
    const zealotFractionSlider = document.getElementById('zealot-fraction');
    const populationSizeSlider = document.getElementById('population-size');
    const simulationSpeedSlider = document.getElementById('simulation-speed');
    const startButton = document.getElementById('start-simulation');
    const stopButton = document.getElementById('stop-simulation');
    const resetButton = document.getElementById('reset-simulation');
    const runningIndicator = document.getElementById('running-indicator');
    const maxInteractionsSlider = document.getElementById('max-interactions');
    
    // Opinion colors
    const opinionColors = {
        'red': '#e63946',
        'blue': '#1d3557'
    };
    
    // Current proportion value (0.5 = 50% red, 50% blue)
    let currentProportion = 0.5;
    
    // Initialize proportion control
    updateProportionControl(currentProportion);
    
    // Add event listener for proportion slider
    proportionSlider.addEventListener('input', function() {
        // Calculate proportion directly from slider value
        currentProportion = this.value / 100;
        updateProportionControl(currentProportion);
        
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
    
    // Function to update the proportion control UI
    function updateProportionControl(proportion) {
        // Update labels - directly use slider value for labels
        const sliderValue = proportionSlider.value;
        proportionLabelLeft.textContent = `${sliderValue}%`;
        proportionLabelRight.textContent = `${100 - sliderValue}%`;
        
        // Update slider background to match button position
        proportionSlider.style.background = `linear-gradient(to right, 
            ${opinionColors.red} 0%, 
            ${opinionColors.red} ${sliderValue}%, 
            ${opinionColors.blue} ${sliderValue}%, 
            ${opinionColors.blue} 100%)`;
    }
    
    // Update slider values as they change
    zealotFractionSlider.addEventListener('input', function() {
        const zealotFractionValue = document.querySelector('.param-group:nth-child(2) .slider-max');
        zealotFractionValue.textContent = `${this.value}%`;
        
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
    
    populationSizeSlider.addEventListener('input', function() {
        const populationSizeValue = document.querySelector('.param-group:nth-child(3) .slider-max');
        populationSizeValue.textContent = this.value;
        
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
    
    simulationSpeedSlider.addEventListener('input', function() {
        const simulationSpeedValue = document.querySelector('.param-group:nth-child(4) .slider-max');
        simulationSpeedValue.textContent = this.value === '10' ? 'Fast' : 'Fast';
        
        // Update simulation speed if running
        if (simulation && isRunning) {
            updateSimulationSpeed();
        }
    });
    
    // Simulation and visualizer instances
    let simulation = null;
    let visualizer = null;
    let isRunning = false;
    let stopRequested = false;
    let nextInteractionTimeout = null;
    
    // Initialize the visualizer
    visualizer = new visualizationModule.OpinionVisualizer({
        agentPoolContainer: 'agent-pool-container',
        opinionPlotContainer: 'opinion-plot-container'
    });
    
    // Start simulation button click handler
    startButton.addEventListener('click', function() {
        if (isRunning) return;
        
        // Reset stop flag
        stopRequested = false;
        
        // Disable controls during simulation
        startButton.disabled = true;
        stopButton.disabled = false;
        proportionSlider.disabled = true;
        zealotFractionSlider.disabled = true;
        populationSizeSlider.disabled = true;
        
        // Show running indicator
        runningIndicator.classList.remove('hidden');
        
        // Get parameters
        const redProportion = currentProportion;
        const zealotFraction = parseInt(zealotFractionSlider.value) / 100;
        const populationSize = parseInt(populationSizeSlider.value);
        const simulationSpeed = parseInt(simulationSpeedSlider.value);
        
        // Create simulation configuration
        const config = {
            populationSize: populationSize,
            redProportion: redProportion,
            zealotFraction: zealotFraction,
            simulationSpeed: simulationSpeed,
            maxInteractions: parseInt(maxInteractionsSlider.value) * 1000 // Convert to thousands
        };
        
        // Initialize simulation
        simulation = new simulationModule.OpinionDynamicsSimulation(config);
        
        // Set up simulation callbacks
        simulation.onInteractionComplete = function(interactionResult) {
            // Update visualization
            visualizer.update(simulation.getStatistics());
            
            // If simulation is not complete and not stopped, run next interaction after a delay
            if (!simulation.isComplete && !stopRequested) {
                const delay = calculateInteractionDelay(config.simulationSpeed);
                nextInteractionTimeout = setTimeout(() => {
                    simulation.runInteraction();
                }, delay);
            } else {
                // Simulation is complete or stopped
                simulationComplete();
            }
        };
        
        simulation.onProgressUpdate = function(stats) {
            // Update visualization periodically
            visualizer.update(stats);
        };
        
        simulation.onSimulationComplete = function(results) {
            // Final update when simulation is complete
            visualizer.update(simulation.getStatistics());
            simulationComplete();
        };
        
        // Function to handle simulation completion
        function simulationComplete() {
            // Display final stats
            displayFinalStats(simulation);
            
            // Re-enable controls
            startButton.disabled = false;
            stopButton.disabled = true;
            proportionSlider.disabled = false;
            zealotFractionSlider.disabled = false;
            populationSizeSlider.disabled = false;
            
            // Hide running indicator
            runningIndicator.classList.add('hidden');
            
            isRunning = false;
        }
        
        // Initialize simulation and visualizer
        simulation.initialize();
        visualizer.initialize(simulation);
        
        // Display initial statistics
        const initialStats = simulation.getStatistics();
        visualizer.update(initialStats);
        
        // Start the simulation
        isRunning = true;
        setTimeout(() => {
            simulation.runInteraction();
        }, 100);
    });
    
    // Calculate delay between interactions based on simulation speed
    function calculateInteractionDelay(speed) {
        // Speed is 1-10, convert to delay (slower = longer delay)
        // Speed 1 = 500ms, Speed 10 = 10ms
        return Math.max(10, 550 - (speed * 50));
    }
    
    // Update simulation speed while running
    function updateSimulationSpeed() {
        if (nextInteractionTimeout) {
            clearTimeout(nextInteractionTimeout);
            
            // Start next interaction with new delay
            const delay = calculateInteractionDelay(parseInt(simulationSpeedSlider.value));
            nextInteractionTimeout = setTimeout(() => {
                simulation.runInteraction();
            }, delay);
        }
    }
    
    // Stop simulation button click handler
    stopButton.addEventListener('click', function() {
        if (!isRunning || !simulation) return;
        
        stopRequested = true;
        stopButton.disabled = true;
        
        // If there's a pending timeout, clear it
        if (nextInteractionTimeout) {
            clearTimeout(nextInteractionTimeout);
            nextInteractionTimeout = null;
        }
        
        // If simulation is running, mark it as complete
        if (isRunning) {
            // Display final stats
            displayFinalStats(simulation);
            
            // Re-enable controls
            startButton.disabled = false;
            stopButton.disabled = true;
            proportionSlider.disabled = false;
            zealotFractionSlider.disabled = false;
            populationSizeSlider.disabled = false;
            
            // Hide running indicator
            runningIndicator.classList.add('hidden');
            
            isRunning = false;
        }
    });
    
    // Reset visualization button click handler
    resetButton.addEventListener('click', function() {
        if (visualizer) {
            visualizer.reset();
        }
        
        if (simulation && isRunning) {
            // If simulation is running, stop it
            stopButton.click();
        }
        
        simulation = null;
    });
    
    // Function to display final statistics
    function displayFinalStats(simulation) {
        const stats = simulation.getStatistics();
        
        // Display final opinion distribution
        visualizer.displayFinalState(stats);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (visualizer) {
            visualizer.handleResize();
            
            // Update the visualization if simulation exists
            if (simulation) {
                const stats = simulation.getStatistics();
                visualizer.update(stats);
            }
        }
    });
    
    // Initialize slider values
    document.querySelector('.param-group:nth-child(2) .slider-max').textContent = `${zealotFractionSlider.value}%`;
    document.querySelector('.param-group:nth-child(3) .slider-max').textContent = populationSizeSlider.value;
    document.querySelector('.param-group:nth-child(4) .slider-max').textContent = 'Fast';
    document.querySelector('.param-group:nth-child(5) .slider-max').textContent = `${maxInteractionsSlider.value}K`;

    // Update the maxInteractionsSlider event listener
    maxInteractionsSlider.addEventListener('input', function() {
        const maxInteractionsValue = document.querySelector('.param-group:nth-child(5) .slider-max');
        maxInteractionsValue.textContent = `${this.value}K`;
        
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
});