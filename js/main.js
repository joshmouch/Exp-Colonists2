// Main entry point for the game
document.addEventListener('DOMContentLoaded', () => {
    // Get the canvas element
    const canvas = document.getElementById('game-canvas');
    
    // Initialize the game
    const game = new Game(canvas);
    
    // Initialize the UI
    const ui = new UI(game);
    
    // Log that the game has started
    console.log('Auto-Battler Game initialized');
});
