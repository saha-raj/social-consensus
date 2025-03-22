/**
 * agent.js
 * 
 * This module defines the Agent class for the Opinion Dynamics simulation.
 * Each agent represents an individual with a belief value ranging from -1 to +1,
 * where negative values represent "red" opinions and positive values represent "blue" opinions.
 */

// Constants for opinions
const RED = 'red';
const BLUE = 'blue';

/**
 * Agent class representing a participant in the Opinion Dynamics simulation
 */
class Agent {
    /**
     * Create a new agent
     * @param {number} beliefValue - The initial belief value (-1 to +1)
     * @param {boolean} isZealot - Whether this agent is a zealot (never changes belief)
     * @param {number} id - Unique identifier for this agent
     */
    constructor(beliefValue, isZealot, id) {
        this.beliefValue = beliefValue;
        this.isZealot = isZealot;
        this.id = id;
        
        // Track interactions for visualization and statistics
        this.interactionHistory = [];
        this.currentPairingId = null;
        this.isInPairing = false;
    }

    /**
     * Get the opinion color based on belief value
     * @returns {string} 'red' or 'blue'
     */
    get opinion() {
        return this.beliefValue < 0 ? RED : BLUE;
    }

    /**
     * Update the agent's belief based on interaction with another agent
     * Zealots never change their belief
     * 
     * @param {Agent} otherAgent - The agent this agent is interacting with
     * @returns {boolean} Whether the opinion (sign of belief) changed
     */
    updateBelief(otherAgent) {
        // Record the interaction
        this.interactionHistory.push({
            agentId: otherAgent.id,
            otherBelief: otherAgent.beliefValue,
            myBeliefBefore: this.beliefValue,
            time: Date.now()
        });

        // Zealots never change their belief
        if (this.isZealot) {
            return false;
        }

        // Store original opinion for change detection
        const originalOpinion = this.opinion;
        
        // Calculate belief update
        // Agents closer to 0 are more susceptible to change
        const mySusceptibility = 1 - Math.abs(this.beliefValue);
        
        // Influence is stronger when both agents are close to 0 but on opposite sides
        const influenceStrength = 0.1 * mySusceptibility * (1 - Math.abs(otherAgent.beliefValue));
        
        // Direction of influence
        const direction = Math.sign(otherAgent.beliefValue - this.beliefValue);
        
        // Update belief value
        this.beliefValue += direction * influenceStrength;
        
        // Ensure belief stays within [-1, 1]
        this.beliefValue = Math.max(-1, Math.min(1, this.beliefValue));
        
        // Check if opinion changed (sign flipped)
        return this.opinion !== originalOpinion;
    }

    /**
     * Reset the agent for a new simulation
     * @param {number} beliefValue - New initial belief value
     * @param {boolean} isZealot - New zealot status
     */
    reset(beliefValue, isZealot) {
        this.beliefValue = beliefValue;
        this.isZealot = isZealot;
        this.interactionHistory = [];
        this.currentPairingId = null;
        this.isInPairing = false;
    }
}

// Create a global agentModule object
window.agentModule = {
    Agent,
    RED,
    BLUE
}; 