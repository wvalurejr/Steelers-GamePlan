// Default Football Lineups Configuration
// Positions face UP (towards top of screen), backfield is below offensive line

const DEFAULT_LINEUPS = {
    'linemen-only': {
        name: 'Linemen Only',
        description: 'Core offensive line with wingback and tight end',
        positions: [
            { name: 'LT', x: 0.35, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'LG', x: 0.425, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'C', x: 0.5, y: 0.5, shape: 'square', color: '#007BFF' },
            { name: 'RG', x: 0.575, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'RT', x: 0.65, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'TE', x: 0.75, y: 0.5, shape: 'square', color: '#28A745' },
            { name: 'WB', x: 0.25, y: 0.5, shape: 'square', color: '#28A745' }
        ]
    },
    'i-formation': {
        name: 'I-Formation',
        description: 'Traditional formation with fullback',
        positions: [
            // Backfield (below offensive line)
            { name: 'QB', x: 0.5, y: 0.55, shape: 'circle', color: '#FF6B35' },
            { name: 'RB', x: 0.5, y: 0.65, shape: 'circle', color: '#000000' },
            { name: 'FB', x: 0.5, y: 0.75, shape: 'square', color: '#000000' },
            // Offensive line
            { name: 'LT', x: 0.35, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'LG', x: 0.425, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'C', x: 0.5, y: 0.5, shape: 'square', color: '#007BFF' },
            { name: 'RG', x: 0.575, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'RT', x: 0.65, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'TE', x: 0.75, y: 0.5, shape: 'square', color: '#28A745' },
            // Receivers
            { name: 'WR1', x: 0.15, y: 0.5, shape: 'triangle', color: '#DC3545' },
            { name: 'WR2', x: 0.85, y: 0.52, shape: 'triangle', color: '#DC3545' }
        ]
    },
    'shotgun': {
        name: 'Shotgun',
        description: 'Spread formation with multiple receivers',
        positions: [
            // Backfield (below offensive line)
            { name: 'QB', x: 0.5, y: 0.6, shape: 'circle', color: '#FF6B35' },
            { name: 'RB', x: 0.35, y: 0.55, shape: 'circle', color: '#000000' },
            // Offensive line
            { name: 'LT', x: 0.35, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'LG', x: 0.425, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'C', x: 0.5, y: 0.5, shape: 'square', color: '#007BFF' },
            { name: 'RG', x: 0.575, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'RT', x: 0.65, y: 0.5, shape: 'circle', color: '#007BFF' },
            // Receivers
            { name: 'WR1', x: 0.1, y: 0.4, shape: 'triangle', color: '#DC3545' },
            { name: 'WR2', x: 0.9, y: 0.4, shape: 'triangle', color: '#DC3545' },
            { name: 'WR3', x: 0.25, y: 0.45, shape: 'triangle', color: '#DC3545' },
            { name: 'WR4', x: 0.75, y: 0.45, shape: 'triangle', color: '#DC3545' }
        ]
    },
    'pistol': {
        name: 'Pistol',
        description: 'Hybrid formation',
        positions: [
            // Backfield (below offensive line)
            { name: 'QB', x: 0.5, y: 0.55, shape: 'circle', color: '#FF6B35' },
            { name: 'RB', x: 0.5, y: 0.65, shape: 'circle', color: '#000000' },
            // Offensive line
            { name: 'LT', x: 0.35, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'LG', x: 0.425, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'C', x: 0.5, y: 0.5, shape: 'square', color: '#007BFF' },
            { name: 'RG', x: 0.575, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'RT', x: 0.65, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'TE', x: 0.75, y: 0.5, shape: 'square', color: '#28A745' },
            // Receivers
            { name: 'WR1', x: 0.15, y: 0.45, shape: 'triangle', color: '#DC3545' },
            { name: 'WR2', x: 0.85, y: 0.45, shape: 'triangle', color: '#DC3545' },
            { name: 'WR3', x: 0.25, y: 0.45, shape: 'triangle', color: '#DC3545' }
        ]
    },
    'wildcat': {
        name: 'Wildcat',
        description: 'Direct snap to running back',
        positions: [
            // Backfield (below offensive line)
            { name: 'RB/QB', x: 0.5, y: 0.55, shape: 'circle', color: '#000000' },
            { name: 'RB2', x: 0.35, y: 0.55, shape: 'circle', color: '#000000' },
            // Offensive line
            { name: 'LT', x: 0.35, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'LG', x: 0.425, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'C', x: 0.5, y: 0.5, shape: 'square', color: '#007BFF' },
            { name: 'RG', x: 0.575, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'RT', x: 0.65, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'TE1', x: 0.75, y: 0.5, shape: 'square', color: '#28A745' },
            { name: 'TE2', x: 0.25, y: 0.5, shape: 'square', color: '#28A745' },
            // Receivers
            { name: 'WR1', x: 0.15, y: 0.45, shape: 'triangle', color: '#DC3545' },
            { name: 'WR2', x: 0.85, y: 0.45, shape: 'triangle', color: '#DC3545' }
        ]
    },
    'goal-line': {
        name: 'Goal Line',
        description: 'Heavy formation for short yardage',
        positions: [
            // Backfield (below offensive line)
            { name: 'QB', x: 0.5, y: 0.55, shape: 'circle', color: '#FF6B35' },
            { name: 'RB', x: 0.5, y: 0.65, shape: 'circle', color: '#000000' },
            { name: 'FB', x: 0.5, y: 0.75, shape: 'square', color: '#000000' },
            // Offensive line (tighter formation)
            { name: 'LT', x: 0.3, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'LG', x: 0.4, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'C', x: 0.5, y: 0.5, shape: 'square', color: '#007BFF' },
            { name: 'RG', x: 0.6, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'RT', x: 0.7, y: 0.5, shape: 'circle', color: '#007BFF' },
            { name: 'TE1', x: 0.2, y: 0.5, shape: 'square', color: '#28A745' },
            { name: 'TE2', x: 0.8, y: 0.5, shape: 'square', color: '#28A745' },
            { name: 'TE3', x: 0.1, y: 0.5, shape: 'square', color: '#28A745' }
        ]
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_LINEUPS };
}
