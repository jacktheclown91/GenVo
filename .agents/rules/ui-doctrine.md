# Rule: GenVo UI & Interaction Doctrine

1. **World-Native First**:
   - The game world is the primary interface. Prefer direct pointing, spatial manipulation, and contextual prompts over static screen-space panels.
   - Limit visible HUD buttons. Avoid cluttered icon trays and generic AI-styled dashboard tropes.

2. **Player Character Visibility**:
   - The player's creature must never be obscured by menus, notifications, or context panels.
   - Menus and radial rings must intelligently reposition away from the character's bounding area.

3. **Progressive Disclosure**:
   - Surface vital survival information (energy, hydration, threat, immediate affordances) immediately.
   - Defer complex lineage statistics, phylogenetics, and internal diagnostics to explicitly summoned modal views.
   - Never display a wall of empty "NONE YET" / "UNESTABLISHED" entries in early gameplay.

4. **Context Hierarchy**:
   - **World Selection / Radial Surface**: Answers "What can I do to or with this specific target in the world?"
   - **Bottom Dock**: Answers "Who am I, what is my physical condition, and what personal capabilities do I possess?"
   - Do not duplicate targeted contextual actions between the radial and the bottom dock.

5. **Responsiveness & Viewports**:
   - Support keyboard, mouse, and touch.
   - Maintain readability and proper bounds across standard test resolutions (1920×1080, 1366×768, 1280×720, 1024×768, 800×600) and mobile viewports (390×844).
