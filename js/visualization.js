/**
 * visualization.js
 * 
 * This module handles the visualization of the Opinion Dynamics simulation
 * using D3.js. It creates visual representations of agents, their opinions,
 * and the evolution of opinions over time.
 */

/**
 * OpinionVisualizer class to handle all visualization aspects
 */
class OpinionVisualizer {
    /**
     * Create a new opinion visualizer
     * @param {Object} options - Visualization options
     * @param {string} options.agentPoolContainer - ID of the container element for agent pool visualization
     * @param {string} options.opinionPlotContainer - ID of the container element for opinion evolution plot
     */
    constructor(options = {}) {
        this.agentPoolContainerId = options.agentPoolContainer || 'agent-pool-container';
        this.opinionPlotContainerId = options.opinionPlotContainer || 'opinion-plot-container';
        
        // Get containers
        this.agentPoolContainer = d3.select(`#${this.agentPoolContainerId}`);
        this.opinionPlotContainer = d3.select(`#${this.opinionPlotContainerId}`);
        
        // Check if agent-pool-visualization exists, if not create it
        if (this.agentPoolContainer.select('.agent-pool-visualization').empty()) {
            this.agentPoolContainer.append('div')
                .attr('class', 'agent-pool-visualization');
        }
        
        // Get the agent pool visualization container
        this.agentPoolVisualization = this.agentPoolContainer.select('.agent-pool-visualization');
        
        // Get dimensions
        this.agentPoolWidth = this.agentPoolContainer.node().clientWidth;
        this.agentPoolHeight = this.agentPoolVisualization.node().clientHeight || 440;
        
        this.opinionPlotWidth = this.opinionPlotContainer.node().clientWidth;
        this.opinionPlotHeight = this.opinionPlotContainer.node().clientHeight || 500;
        
        this.margin = { top: 40, right: 40, bottom: 60, left: 60 };
        
        // Set up color scales for opinions
        this.redColorScale = d3.scaleLinear()
            .domain([-1, 0])
            .range(['#e63946', '#f4a582']);
            
        this.blueColorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['#92c5de', '#1d3557']);
        
        // Initialize the SVGs
        this.agentPoolSvg = this.agentPoolVisualization.append('svg')
            .attr('width', this.agentPoolWidth)
            .attr('height', this.agentPoolHeight)
            .style('background-color', '#fff');
            
        this.opinionPlotSvg = this.opinionPlotContainer.append('svg')
            .attr('width', this.opinionPlotWidth)
            .attr('height', this.opinionPlotHeight)
            .style('background-color', '#fff');
            
        // Create a group for the agent pool visualization - ADJUSTED POSITIONING WITH OFFSET
        this.agentPoolGroup = this.agentPoolSvg.append('g')
            .attr('class', 'agent-pool')
            .attr('transform', `translate(${this.agentPoolWidth / 2}, ${this.agentPoolHeight * 0.45})`);
            
        // Define the radius of the circular area - make it slightly smaller to ensure it fits
        this.areaRadius = Math.min(this.agentPoolWidth * 0.4, this.agentPoolHeight / 2) * 0.9;
            
        // Create a boundary circle
        this.agentPoolGroup.append('circle')
            .attr('class', 'boundary-circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', this.areaRadius)
            .attr('fill', 'none')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
            
        // Create a group for pairing lines (below agents)
        this.pairingLinesGroup = this.agentPoolGroup.append('g')
            .attr('class', 'pairing-lines');
            
        // Create a group for the opinion plot
        this.opinionPlotGroup = this.opinionPlotSvg.append('g')
            .attr('class', 'opinion-plot')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        
        // Set up the force simulation for agent movement
        this.setupForceSimulation();
        
        // Initialize the opinion plot
        this.setupOpinionPlot();
        
        // Store agent data
        this.agentData = [];
        this.simulation = null;
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Get color for an agent based on opinion
     * @param {number} beliefValue - The agent's belief value (-1 to 1)
     * @returns {string} Color in hex format
     */
    getAgentColor(beliefValue) {
        // Use fixed colors based on opinion (sign of belief value)
        return beliefValue < 0 ? '#ef476f' : '#00a6fb';
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update dimensions
        this.agentPoolWidth = this.agentPoolContainer.node().clientWidth;
        this.agentPoolHeight = this.agentPoolVisualization.node().clientHeight || 440;
        
        this.opinionPlotWidth = this.opinionPlotContainer.node().clientWidth;
        this.opinionPlotHeight = this.opinionPlotContainer.node().clientHeight || 500;
        
        // Update SVG dimensions
        this.agentPoolSvg
            .attr('width', this.agentPoolWidth)
            .attr('height', this.agentPoolHeight);
            
        this.opinionPlotSvg
            .attr('width', this.opinionPlotWidth)
            .attr('height', this.opinionPlotHeight);
            
        // Update group positions
        this.agentPoolGroup
            .attr('transform', `translate(${this.agentPoolWidth / 2}, ${this.agentPoolHeight * 0.45})`);
            
        // Update the area radius and boundary circle
        this.areaRadius = Math.min(this.agentPoolWidth * 0.4, this.agentPoolHeight / 2) * 0.9;
        this.agentPoolGroup.select('.boundary-circle')
            .attr('r', this.areaRadius);
            
        // Update the opinion plot
        this.updateOpinionPlot();
        
        // Update the visualization
        if (this.simulation) {
            const stats = this.simulation.getStatistics();
            this.update(stats);
        }
    }
    
    /**
     * Set up the force simulation for agent movement
     */
    setupForceSimulation() {
        // Create a force simulation
        this.forceSimulation = d3.forceSimulation()
            // Light repulsion to prevent perfect overlap
            .force('charge', d3.forceManyBody().strength(-5).distanceMax(50))
            // Collision detection to prevent overlap
            .force('collision', d3.forceCollide().radius(d => d.radius * 1.1).strength(0.3))
            // Add a gentle center-directed force
            .force('center', d3.forceCenter(0, 0).strength(0.01))
            // Custom force for pairing
            .force('pairing', alpha => {
                if (!this.agentData) return;
                
                // Apply attraction force between paired agents
                for (let i = 0; i < this.agentData.length; i++) {
                    const agent = this.agentData[i];
                    if (!agent || !agent.isInPairing || agent.currentPairingId === null) continue;
                    
                    // Find the paired agent
                    const pairedAgent = this.agentData.find(a => a && a.id === agent.currentPairingId);
                    if (!pairedAgent) continue;
                    
                    // Calculate vector between agents
                    const dx = pairedAgent.x - agent.x;
                    const dy = pairedAgent.y - agent.y;
                    
                    // Skip if any values are NaN
                    if (isNaN(dx) || isNaN(dy)) continue;
                    
                    // Apply attraction force
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const targetDistance = 20; // Target distance between paired agents
                    
                    if (distance > targetDistance) {
                        const strength = 0.1 * alpha; // Adjust strength as needed
                        agent.x += dx * strength;
                        agent.y += dy * strength;
                    }
                }
            })
            // Boundary force to keep agents within the circle
            .force('boundary', alpha => {
                if (!this.agentData) return;
                
                const radius = this.areaRadius;
                const center = { x: 0, y: 0 };
                const strength = 0.1 * alpha;
                
                for (let i = 0; i < this.agentData.length; i++) {
                    const agent = this.agentData[i];
                    if (!agent) continue;
                    
                    // Calculate distance from center
                    const dx = agent.x - center.x;
                    const dy = agent.y - center.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // If agent is outside the boundary, push it back
                    if (distance > radius - agent.radius) {
                        const angle = Math.atan2(dy, dx);
                        const targetX = center.x + (radius - agent.radius) * Math.cos(angle);
                        const targetY = center.y + (radius - agent.radius) * Math.sin(angle);
                        
                        agent.x = agent.x + (targetX - agent.x) * strength * 2;
                        agent.y = agent.y + (targetY - agent.y) * strength * 2;
                    }
                }
            })
            .on('tick', () => this.tickFunction());
    }
    
    /**
     * Force simulation tick function
     */
    tickFunction() {
        if (!this.agentData) return;
        
        // Update agent positions
        this.agentPoolGroup.selectAll('.agent')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
            
        // Update pairing lines
        this.updatePairingLines();
    }
    
    /**
     * Update the pairing lines between agents
     */
    updatePairingLines() {
        if (!this.agentData) return;
        
        // Create data for pairing lines
        const pairingData = [];
        
        for (let i = 0; i < this.agentData.length; i++) {
            const agent = this.agentData[i];
            if (!agent || !agent.isInPairing || agent.currentPairingId === null) continue;
            
            // Find the paired agent
            const pairedAgent = this.agentData.find(a => a && a.id === agent.currentPairingId);
            if (!pairedAgent) continue;
            
            // Only add each pairing once (when agent.id < pairedAgent.id)
            if (agent.id < pairedAgent.id) {
                pairingData.push({
                    id: `${agent.id}-${pairedAgent.id}`,
                    source: agent,
                    target: pairedAgent
                });
            }
        }
        
        // Update pairing lines
        const pairingLines = this.pairingLinesGroup.selectAll('.pairing-line')
            .data(pairingData, d => d.id);
            
        // Remove old lines
        pairingLines.exit().remove();
        
        // Add new lines
        pairingLines.enter()
            .append('line')
            .attr('class', 'pairing-line')
            .attr('stroke', '#999')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .merge(pairingLines)
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
    }
    
    /**
     * Set up the opinion plot
     */
    setupOpinionPlot() {
        // Calculate plot dimensions
        const plotWidth = this.opinionPlotWidth - this.margin.left - this.margin.right;
        const plotHeight = this.opinionPlotHeight - this.margin.top - this.margin.bottom;
        
        // Create scales
        this.xScale = d3.scaleLinear()
            .domain([0, 100]) // Initial domain, will be updated
            .range([0, plotWidth]);
            
        this.yScale = d3.scaleLinear()
            .domain([0, 1]) // Proportion from 0 to 1
            .range([plotHeight, 0]);
            
        // Create axes
        this.xAxis = this.opinionPlotGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${plotHeight})`)
            .call(d3.axisBottom(this.xScale));
            
        this.yAxis = this.opinionPlotGroup.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(this.yScale).ticks(5).tickFormat(d3.format('.0%')));
            
        // Add axis labels
        this.opinionPlotGroup.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', plotWidth / 2)
            .attr('y', plotHeight + 40)
            .attr('text-anchor', 'middle')
            .text('Interactions');
            
        this.opinionPlotGroup.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -plotHeight / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .text('Opinion Proportion');
            
        // Create line generators
        this.redLine = d3.line()
            .x(d => this.xScale(d.interactionCount))
            .y(d => this.yScale(d.redProportion))
            .curve(d3.curveMonotoneX);
            
        this.blueLine = d3.line()
            .x(d => this.xScale(d.interactionCount))
            .y(d => this.yScale(d.blueProportion))
            .curve(d3.curveMonotoneX);
            
        // Add lines to the plot
        this.opinionPlotGroup.append('path')
            .attr('class', 'red-line')
            .attr('fill', 'none')
            .attr('stroke', '#e63946')
            .attr('stroke-width', 2);
            
        this.opinionPlotGroup.append('path')
            .attr('class', 'blue-line')
                .attr('fill', 'none')
            .attr('stroke', '#1d3557')
            .attr('stroke-width', 2);
            
        // Add legend
        const legend = this.opinionPlotGroup.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${plotWidth - 100}, 20)`);
            
        // Red opinion legend
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#e63946');
            
        legend.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .text('Red Opinion');
            
        // Blue opinion legend
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 25)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#1d3557');
            
        legend.append('text')
            .attr('x', 20)
            .attr('y', 37)
            .text('Blue Opinion');
    }
    
    /**
     * Update the opinion plot with current data
     */
    updateOpinionPlot() {
        if (!this.simulation) return;
        
        const history = this.simulation.opinionHistory;
        if (history.length === 0) return;
        
        // Calculate plot dimensions
        const plotWidth = this.opinionPlotWidth - this.margin.left - this.margin.right;
        
        // Update x-axis domain dynamically based on current interaction count
        const currentInteractions = this.simulation.interactionCount;
        const maxInteractions = this.simulation.config.maxInteractions || 5000;
        
        // Set x-axis to show either the current progress or the full range
        // Always show at least up to 100 interactions
        const xMax = Math.max(currentInteractions * 1.2, 100);
        
        // Update the domain - ensure we don't exceed maxInteractions
        const newDomain = [0, Math.min(xMax, maxInteractions)];
        console.log("Updating x-axis domain:", newDomain);
        this.xScale.domain(newDomain);
        
        // Update the x-axis with the new domain
        this.xAxis.call(d3.axisBottom(this.xScale));
        
        // Update lines
        this.opinionPlotGroup.select('.red-line')
            .attr('d', this.redLine(history));
            
        this.opinionPlotGroup.select('.blue-line')
            .attr('d', this.blueLine(history));
    }
    
    /**
     * Initialize the visualization with simulation data
     * @param {OpinionDynamicsSimulation} simulation - The simulation to visualize
     */
    initialize(simulation) {
        this.simulation = simulation;
        
        // Create agent data from simulation
        this.agentData = simulation.agents.map(agent => {
            // Random position within the boundary circle
            const angle = Math.random() * 2 * Math.PI;
            // Use square root for uniform distribution
            const radius = Math.sqrt(Math.random()) * this.areaRadius * 0.9;
            
            return {
                id: agent.id,
                beliefValue: agent.beliefValue,
                opinion: agent.opinion,
                isZealot: agent.isZealot,
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                radius: 5, // Base radius
                currentPairingId: agent.currentPairingId,
                isInPairing: agent.isInPairing
            };
        });
        
        // Update the force simulation with new data
        this.forceSimulation
            .nodes(this.agentData)
            .alpha(1)
            .restart();
            
        // Create agent circles
        this.agentPoolGroup.selectAll('.agent')
            .data(this.agentData, d => d.id)
            .enter()
            .append('circle')
            .attr('class', 'agent')
            .attr('r', d => d.radius)
            .attr('fill', d => this.getAgentColor(d.beliefValue))
            .attr('stroke', d => d.isZealot ? '#000' : 'none')
            .attr('stroke-width', d => d.isZealot ? 2 : 0)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
            
        // Initialize the opinion plot
        this.updateOpinionPlot();
    }
    
    /**
     * Update the visualization with new simulation data
     * @param {Object} stats - Current simulation statistics
     */
    update(stats) {
        if (!this.simulation) return;
        
        // Update agent data
        this.simulation.agents.forEach(agent => {
            const agentData = this.agentData.find(d => d.id === agent.id);
            if (agentData) {
                agentData.beliefValue = agent.beliefValue;
                agentData.opinion = agent.opinion;
                agentData.isZealot = agent.isZealot;
                agentData.currentPairingId = agent.currentPairingId;
                agentData.isInPairing = agent.isInPairing;
            }
        });
        
        // Update agent circles
        this.agentPoolGroup.selectAll('.agent')
            .data(this.agentData, d => d.id)
            .attr('fill', d => this.getAgentColor(d.beliefValue))
            .attr('stroke', d => d.isZealot ? '#000' : 'none')
            .attr('stroke-width', d => d.isZealot ? 2 : 0);
            
        // Update pairing lines
        this.updatePairingLines();
            
        // Update the opinion plot
        this.updateOpinionPlot();
        
        // Update the force simulation
        this.forceSimulation.alpha(0.3).restart();
    }
    
    /**
     * Display the final state of the simulation
     * @param {Object} stats - Final simulation statistics
     */
    displayFinalState(stats) {
        // Update the visualization
        this.update(stats);
        
        // Add final state annotation to the opinion plot
        const history = stats.opinionHistory;
        if (history.length === 0) return;
        
        const lastState = history[history.length - 1];
        const plotWidth = this.opinionPlotWidth - this.margin.left - this.margin.right;
        
        // Add final state text
        this.opinionPlotGroup.append('text')
            .attr('class', 'final-state')
            .attr('x', plotWidth / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('font-weight', 'bold')
            .text(`Final State: Red ${Math.round(lastState.redProportion * 100)}%, Blue ${Math.round(lastState.blueProportion * 100)}%`);
    }
    
    /**
     * Reset the visualization
     */
    reset() {
        // Clear agent circles
        this.agentPoolGroup.selectAll('.agent').remove();
        
        // Clear pairing lines
        this.pairingLinesGroup.selectAll('.pairing-line').remove();
        
        // Clear opinion plot lines
        this.opinionPlotGroup.select('.red-line').attr('d', null);
        this.opinionPlotGroup.select('.blue-line').attr('d', null);
        
        // Remove final state annotation
        this.opinionPlotGroup.selectAll('.final-state').remove();
        
        // Reset simulation reference
        this.simulation = null;
        this.agentData = [];
    }
}

// Create a global visualizationModule object
window.visualizationModule = {
    OpinionVisualizer
}; 