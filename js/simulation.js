/**
 * simulation.js
 * 
 * This module implements the Opinion Dynamics simulation logic.
 * It handles creating agents, pairing them for interactions, and tracking
 * the evolution of opinions over time.
 */

/**
 * OpinionDynamicsSimulation class to manage the entire simulation process
 */
class OpinionDynamicsSimulation {
    /**
     * Create a new opinion dynamics simulation
     * @param {Object} config - Simulation configuration
     * @param {number} config.populationSize - Total number of agents in the simulation
     * @param {number} config.redProportion - Initial proportion of agents with red opinion (0-1)
     * @param {number} config.zealotFraction - Fraction of red agents that are zealots (0-1)
     * @param {number} config.simulationSpeed - Speed of the simulation (1-10)
     */
    constructor(config) {
        this.config = config;
        this.agents = [];
        this.isRunning = false;
        this.isComplete = false;
        this.interactionCount = 0;
        this.opinionCounts = { red: 0, blue: 0 };
        this.opinionHistory = []; // Track opinion counts over time
        this.currentPairing = null;
        
        // Event callbacks
        this.onInteractionComplete = null;
        this.onSimulationComplete = null;
        this.onProgressUpdate = null;
    }
    
    /**
     * Initialize the simulation by creating agents based on parameters
     */
    initialize() {
        this.agents = [];
        this.isRunning = false;
        this.isComplete = false;
        this.interactionCount = 0;
        this.opinionCounts = { red: 0, blue: 0 };
        this.opinionHistory = [];
        this.currentPairing = null;
        
        // Calculate agent counts
        const totalAgents = this.config.populationSize;
        const redAgents = Math.round(totalAgents * this.config.redProportion);
        const blueAgents = totalAgents - redAgents;
        
        // Calculate zealot count (only red agents can be zealots)
        const zealotCount = Math.round(redAgents * this.config.zealotFraction);
        
        // Create red agents (some zealots, some regular)
        for (let i = 0; i < redAgents; i++) {
            const isZealot = i < zealotCount;
            // Random belief value between -1 and 0 for red agents
            // Zealots are always at -1 (extreme belief)
            const beliefValue = isZealot ? -1 : -Math.random();
            this.agents.push(new agentModule.Agent(beliefValue, isZealot, i));
        }
        
        // Create blue agents (all regular, no zealots)
        for (let i = 0; i < blueAgents; i++) {
            // Random belief value between 0 and 1 for blue agents
            const beliefValue = Math.random();
            this.agents.push(new agentModule.Agent(beliefValue, false, redAgents + i));
        }
        
        // Update initial opinion counts
        this.updateOpinionCounts();
        
        // Record initial state
        this.recordOpinionState();
    }
    
    /**
     * Update counts of agents with each opinion
     */
    updateOpinionCounts() {
        this.opinionCounts = {
            red: this.agents.filter(agent => agent.opinion === agentModule.RED).length,
            blue: this.agents.filter(agent => agent.opinion === agentModule.BLUE).length
        };
    }
    
    /**
     * Record the current state of opinions in the simulation
     */
    recordOpinionState() {
        const totalAgents = this.agents.length;
        const redCount = this.opinionCounts.red;
        const blueCount = this.opinionCounts.blue;
        
        // Calculate proportions
        const redProportion = redCount / totalAgents;
        const blueProportion = blueCount / totalAgents;
        
        // Add to history
        this.opinionHistory.push({
            interactionCount: this.interactionCount,
            redCount,
            blueCount,
            redProportion,
            blueProportion
        });
        
        // Keep history from growing too large by removing oldest entries
        if (this.opinionHistory.length > 1000) {
            this.opinionHistory = this.opinionHistory.slice(-1000);
        }
    }
    
    /**
     * Run a single interaction between two randomly selected agents
     * @returns {Object} Interaction results
     */
    runInteraction() {
        if (this.isComplete) {
            return null;
        }
        
        this.isRunning = true;
        
        // Clear previous pairing
        if (this.currentPairing) {
            const agent1 = this.agents[this.currentPairing.agent1Index];
            const agent2 = this.agents[this.currentPairing.agent2Index];
            
            if (agent1) {
                agent1.isInPairing = false;
                agent1.currentPairingId = null;
            }
            
            if (agent2) {
                agent2.isInPairing = false;
                agent2.currentPairingId = null;
            }
        }
        
        // Select two different random agents
        const agent1Index = Math.floor(Math.random() * this.agents.length);
        let agent2Index;
        do {
            agent2Index = Math.floor(Math.random() * this.agents.length);
        } while (agent2Index === agent1Index);
        
        const agent1 = this.agents[agent1Index];
        const agent2 = this.agents[agent2Index];
        
        // Set up pairing for visualization
        agent1.isInPairing = true;
        agent1.currentPairingId = agent2.id;
        agent2.isInPairing = true;
        agent2.currentPairingId = agent1.id;
        
        this.currentPairing = {
            agent1Index,
            agent2Index
        };
        
        // Record opinions before interaction
        const agent1OpinionBefore = agent1.opinion;
        const agent2OpinionBefore = agent2.opinion;
        const agent1BeliefBefore = agent1.beliefValue;
        const agent2BeliefBefore = agent2.beliefValue;
        
        // Agents interact and potentially update beliefs
        const agent1Changed = agent1.updateBelief(agent2);
        const agent2Changed = agent2.updateBelief(agent1);
        
        // Increment interaction count
        this.interactionCount++;
        
        // Update opinion counts if any agent changed opinion
        if (agent1Changed || agent2Changed) {
            this.updateOpinionCounts();
        }
        
        // Record state periodically (every 10 interactions)
        if (this.interactionCount % 10 === 0) {
            this.recordOpinionState();
        }
        
        // Check for equilibrium or dominance
        this.checkCompletionConditions();
        
        // Create interaction result object
        const interactionResult = {
            interactionCount: this.interactionCount,
            agents: {
                agent1: {
                    id: agent1.id,
                    opinionBefore: agent1OpinionBefore,
                    opinionAfter: agent1.opinion,
                    beliefBefore: agent1BeliefBefore,
                    beliefAfter: agent1.beliefValue,
                    changed: agent1Changed,
                    isZealot: agent1.isZealot
                },
                agent2: {
                    id: agent2.id,
                    opinionBefore: agent2OpinionBefore,
                    opinionAfter: agent2.opinion,
                    beliefBefore: agent2BeliefBefore,
                    beliefAfter: agent2.beliefValue,
                    changed: agent2Changed,
                    isZealot: agent2.isZealot
                }
            },
            opinionCounts: this.opinionCounts,
            currentPairing: this.currentPairing,
            isComplete: this.isComplete
        };
        
        // Trigger interaction complete callback
        if (this.onInteractionComplete) {
            this.onInteractionComplete(interactionResult);
        }
        
        // Trigger progress update callback periodically
        if (this.onProgressUpdate && this.interactionCount % 50 === 0) {
            this.onProgressUpdate({
                interactionCount: this.interactionCount,
                opinionCounts: this.opinionCounts,
                opinionHistory: this.opinionHistory,
                currentPairing: this.currentPairing,
                isComplete: this.isComplete
            });
        }
        
        // If simulation is complete, trigger completion callback
        if (this.isComplete && this.onSimulationComplete) {
            this.onSimulationComplete({
                interactionCount: this.interactionCount,
                opinionCounts: this.opinionCounts,
                opinionHistory: this.opinionHistory
            });
        }
        
        this.isRunning = false;
        
        return interactionResult;
    }
    
    /**
     * Check if the simulation has reached completion conditions
     */
    checkCompletionConditions() {
        // Check for opinion dominance (all agents have the same opinion)
        if (this.opinionCounts.red === 0 || this.opinionCounts.blue === 0) {
            console.log("Simulation complete: One opinion dominates");
            this.isComplete = true;
            return;
        }
        
        // Stop after the maximum number of interactions
        const maxInteractions = this.config.maxInteractions || 5000;
        if (this.interactionCount >= maxInteractions) {
            console.log(`Reached max interactions: ${maxInteractions}`);
            this.isComplete = true;
        }
    }
    
    /**
     * Get current simulation statistics
     * @returns {Object} Current statistics
     */
    getStatistics() {
        return {
            interactionCount: this.interactionCount,
            opinionCounts: this.opinionCounts,
            opinionHistory: this.opinionHistory,
            currentPairing: this.currentPairing,
            isComplete: this.isComplete,
            zealotCount: this.agents.filter(agent => agent.isZealot).length,
            redZealotCount: this.agents.filter(agent => agent.isZealot && agent.opinion === agentModule.RED).length,
            blueZealotCount: this.agents.filter(agent => agent.isZealot && agent.opinion === agentModule.BLUE).length
        };
    }
}

// Create a global simulationModule object
window.simulationModule = {
    OpinionDynamicsSimulation
}; 