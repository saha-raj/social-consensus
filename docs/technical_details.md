# Social Consensus, Polarization, and the Power of Zealots


We're all familiar with the term polarization in the context of social consensus and political beliefs. The basic premise is simple: repeated exposure to shared beliefs strengthens those beliefs, which in turn leads to even greater exposure to similar views. This runaway effect then inevitably produces clusters of opposing beliefs—echo chambers.

While the real world is vastly more complex, this basic mechanism remains a core driver of polarization. We can simulate and visualize these dynamics using simple rules and assumptions. We can also explore the role of zealots—individuals who are stubborn, never change their views, yet constantly proselytize—in shaping how consensus forms and evolves within a social network.

This simulation, inspired by Centola et al. (2018), models two groups of N agents, in proportions k and (1−k), holding opposing beliefs on a scale from −1 to +1. Positive and negative values represent the views of the two groups. Each agent is connected to others—both within their group and, in some cases, across group lines—simulating a social network.

Agents interact pairwise through these connections. Each interaction may shift an agent's belief closer to the other's, depending on various factors such as susceptibility and influence. However, zealots never change their views. Their presence can stabilize, polarize, or even shift consensus in unexpected ways. Through this simulation, we can explore how such simple interaction rules lead to complex collective behavior.


## Assumptions

This simulation, like all models, makes several simplifying assumptions to help us understand complex social dynamics:

- People's beliefs exist on a continuous spectrum, not just binary categories
- Social influence happens primarily through direct connections
- People are more susceptible to opposing views when surrounded by them
- Zealots never change their minds, regardless of social pressure
- Network connections form with a bias toward similar opinions (homophily)
- All non-zealot agents follow the same influence rules

These assumptions create an idealized model that captures key aspects of opinion dynamics while remaining tractable. Real-world social systems are vastly more complex, with individuals following different influence rules, having varying susceptibilities, and interacting through multiple channels beyond direct connections.

The model isn't meant to predict specific real-world outcomes, but rather to help us understand and visualize the mechanisms that might drive polarization and consensus formation in social networks.

## Flipping the Minority

One of the most interesting phenomena this model reveals is how a minority opinion can sometimes overtake the majority.

Two key factors determine whether this happens:

1. **Zealot proportions**: When one side has more zealots than the other, they exert disproportionate influence. Even a small group of unwavering believers can gradually pull the entire population toward their view if the opposing side has fewer zealots.

2. **Network homophily**: The degree to which people connect with like-minded others dramatically affects opinion spread. Higher homophily creates echo chambers that slow down opinion change, while lower homophily allows minority views to spread more easily through cross-group connections.

The interplay between these factors creates tipping points where small changes in initial conditions can lead to dramatically different outcomes. For example, a slight increase in red zealots might flip a predominantly blue population to red, even when starting with fewer red agents overall.

This helps explain why seemingly stable social consensus can sometimes rapidly shift, and why vocal minorities can sometimes have outsized influence on public opinion.

