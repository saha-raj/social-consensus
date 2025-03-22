## Technical Details

### Network Structure
- Agents are connected in a social network with 1-3 neighbors each
- Connections are influenced by homophily (tendency to connect with similar opinions)
- Network visualization shows agents (circles) and their connections (gray lines)

For each agent, the probability of connecting to an agent with the same opinion is determined by the homophily parameter $h$:
$P(\text{same opinion connection}) = h$

### Belief System
- Each agent has a belief value between -1 and 1
- Negative values (-1 to 0) represent "red" opinion
- Positive values (0 to 1) represent "blue" opinion
- Zealots have extreme beliefs (-1 or 1) that never change

The opinion of an agent is determined by the sign of their belief value:
$$
\text{opinion} = \begin{cases} 
\text{red} & \text{if } b < 0 \\
\text{blue} & \text{if } b \geq 0
\end{cases}​
$$


### Interaction Rules
- Agents interact with their network neighbors
- Susceptibility to change depends on proportion of opposing neighbors
- Zealots influence others but never change themselves
- Non-zealots update beliefs based on their susceptibility and the strength of the other agent's belief

Susceptibility is calculated as:
$$
S_i = \frac{\text{number of neighbors with opposing opinion}}{\text{total number of neighbors}}
$$


For non-zealot interactions, belief updates follow:
$$
b_i^{new} = b_i + \text{sign}(b_j - b_i) \cdot 0.1 \cdot S_i \cdot (1 - |b_j|)
$$


Where:
- $b_i$ is the belief value of agent $i$
- $b_j$ is the belief value of the interacting agent $j$
- $S_i$ is the susceptibility of agent $i$

### Visualization
- Agent pool: Network visualization with agents colored by belief
- Opinion plot: Tracks proportion of red/blue opinions over time
- Histogram: Shows distribution of belief values

The color intensity of each agent is proportional to their belief strength:
$\text{opacity} = \max(0.1, |b_i|)$

### Simulation Parameters
- Population size: Total number of agents
- Red/Blue proportion: Initial opinion distribution
- Zealot fraction: Percentage of agents with unchangeable beliefs
- Network homophily: Tendency to connect with similar opinions

