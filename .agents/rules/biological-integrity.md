# Rule: Biological Integrity

1. **Single Source of Truth**:
   - `Simulation` (`src/sim/simulation.js`) and `World` (`src/world/world.js`) are the sole owners of physical and biological facts.
   - Rendering (`src/render/`), UI (`src/ui/`), and audio (`src/audio/`) may only read state. They must never make biological decisions or invent duplicate state.

2. **Neutral Undirected Variation**:
   - Mutations occur without regard to utility or environmental pressure.
   - Natural selection operates strictly through differential survival, resource acquisition, and mating success.
   - Both simplification and specialization are valid outcomes. Simpler organisms must not be penalized artificially.

3. **Mass & Physics Scaling**:
   - Adult size ($s \in [0.5, 3.0]$) governs physical properties:
     - Mass: $M \propto s^3$
     - Resting metabolic cost: Kleiber's Law ($M^{0.75}$), water ($M^{2/3}$)
     - Tissue stress: $\sigma \propto s$
     - Bite area: $A \propto s^2$
   - Never scale sprites without matching physical authority.

4. **Resource Conservation**:
   - Food, water, minerals, and tissue are strictly conserved across intake and transfer.
   - No spawning resources or imposing invisible population floors to prevent extinction.

5. **Deterministic Replay & Save Continuity**:
   - Any historical or versioned rule must restore and continue deterministically.
   - No silent reinterpretation of legacy anatomy, genes, or policies.
