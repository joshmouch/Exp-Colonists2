// UI class to handle user interface and interactions
class UI {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.selectionPanel = document.getElementById('selection-panel');
        this.selectionName = document.getElementById('selection-name');
        this.selectionStats = document.getElementById('selection-stats');
        this.selectionCommands = document.getElementById('selection-commands');
        this.productionOptions = document.getElementById('production-options');
        this.menuButton = document.getElementById('menu-button');
        this.menuPanel = document.getElementById('menu-panel');
        this.closeSelectionButton = document.getElementById('close-selection');
        this.closeMenuButton = document.getElementById('close-menu');
        this.resetGameButton = document.getElementById('reset-game');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedValue = document.getElementById('speed-value');
        
        // Add resources display
        this.createResourcesDisplay();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    createResourcesDisplay() {
        const resourcesDiv = document.createElement('div');
        resourcesDiv.className = 'resources';
        resourcesDiv.innerHTML = `
            <div class="resource side-0">
                <span class="resource-icon">⚜</span>
                <span id="green-gold">500</span>
            </div>
            <div class="resource side-1">
                <span class="resource-icon">⚜</span>
                <span id="red-gold">500</span>
            </div>
        `;
        document.getElementById('game-container').appendChild(resourcesDiv);
        
        this.greenGoldDisplay = document.getElementById('green-gold');
        this.redGoldDisplay = document.getElementById('red-gold');
    }
    
    setupEventListeners() {
        // Canvas click event
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Close selection panel
        this.closeSelectionButton.addEventListener('click', () => {
            this.hideSelectionPanel();
            this.game.selectEntity(null);
        });
        
        // Menu button
        this.menuButton.addEventListener('click', () => {
            this.toggleMenuPanel();
        });
        
        // Close menu panel
        this.closeMenuButton.addEventListener('click', () => {
            this.hideMenuPanel();
        });
        
        // Reset game button
        this.resetGameButton.addEventListener('click', () => {
            this.game.resetGame();
            this.hideMenuPanel();
        });
        
        // Game speed slider
        this.speedSlider.addEventListener('input', () => {
            const speed = parseFloat(this.speedSlider.value);
            this.game.setGameSpeed(speed);
            this.speedValue.textContent = speed.toFixed(1) + 'x';
        });
        
        // Handle game over click to restart
        this.canvas.addEventListener('click', () => {
            if (this.game.gameOver) {
                this.game.resetGame();
            }
        });
        
        // Update UI every 100ms
        setInterval(() => this.updateUI(), 100);
    }
    
    handleCanvasClick(e) {
        if (this.game.gameOver) return;
        
        // Get click position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if we clicked on an entity
        const entitiesAtPoint = this.game.getEntitiesAtPoint(x, y);
        
        if (entitiesAtPoint.length > 0) {
            // Select the first entity at this point
            const entity = entitiesAtPoint[0];
            this.game.selectEntity(entity);
            this.showSelectionPanel(entity);
        } else if (this.game.selectedEntity) {
            // If we have a selected entity, check if this is a command
            const entity = this.game.selectedEntity;
            
            // Check if entity has attack command
            const attackCommand = entity.commands.find(cmd => cmd.name === 'Attack');
            if (attackCommand) {
                // Find if there's an enemy at the target location
                const entitiesNearPoint = this.game.getEntitiesInRadius(x, y, 20);
                const enemyEntity = entitiesNearPoint.find(e => e.side !== entity.side);
                
                if (enemyEntity) {
                    entity.setTarget(enemyEntity.id);
                    return;
                }
            }
            
            // Check if entity has move command
            const moveCommand = entity.commands.find(cmd => cmd.name === 'Move');
            if (moveCommand) {
                entity.setTargetPosition(x, y);
            }
        }
    }
    
    showSelectionPanel(entity) {
        // Set entity name
        this.selectionName.textContent = `${entity.name} (${entity.side === 0 ? 'Green' : 'Red'})`;
        this.selectionName.className = `side-${entity.side}`;
        
        // Show entity stats
        this.updateEntityStats(entity);
        
        // Show entity commands
        this.updateEntityCommands(entity);
        
        // Show production options if this is a base building
        if (entity.type === 'building' && entity.isBase) {
            this.updateProductionOptions(entity);
            this.productionOptions.classList.remove('hidden');
        } else {
            this.productionOptions.classList.add('hidden');
        }
        
        // Show the panel
        this.selectionPanel.classList.remove('hidden');
    }
    
    hideSelectionPanel() {
        this.selectionPanel.classList.add('hidden');
    }
    
    toggleMenuPanel() {
        if (this.menuPanel.classList.contains('hidden')) {
            this.menuPanel.classList.remove('hidden');
        } else {
            this.menuPanel.classList.add('hidden');
        }
    }
    
    hideMenuPanel() {
        this.menuPanel.classList.add('hidden');
    }
    
    updateEntityStats(entity) {
        const stats = entity.getStats();
        let statsHtml = '';
        
        // Add health bar
        statsHtml += `
            <div>
                <label>Health:</label>
                <div class="stat-bar">
                    <div class="stat-bar-fill health-bar-fill" style="width: ${(entity.health / entity.maxHealth) * 100}%"></div>
                    <div class="stat-bar-text">${Math.floor(entity.health)}/${entity.maxHealth}</div>
                </div>
            </div>
        `;
        
        // Add mana bar if entity has mana
        if (entity.maxMana > 0) {
            statsHtml += `
                <div>
                    <label>Mana:</label>
                    <div class="stat-bar">
                        <div class="stat-bar-fill mana-bar-fill" style="width: ${(entity.mana / entity.maxMana) * 100}%"></div>
                        <div class="stat-bar-text">${Math.floor(entity.mana)}/${entity.maxMana}</div>
                    </div>
                </div>
            `;
        }
        
        // Add other stats
        for (const [key, value] of Object.entries(stats)) {
            if (key !== 'Health' && key !== 'Mana') {
                statsHtml += `
                    <div>
                        <label>${key}:</label>
                        <span>${value}</span>
                    </div>
                `;
            }
        }
        
        this.selectionStats.innerHTML = statsHtml;
    }
    
    updateEntityCommands(entity) {
        const commands = entity.getCommands();
        let commandsHtml = '';
        
        for (const command of commands) {
            switch (command.type) {
                case 'button':
                    commandsHtml += `
                        <button class="command-button" data-action="${command.action}">
                            ${command.name}
                        </button>
                    `;
                    break;
                    
                case 'toggle':
                    commandsHtml += `
                        <label class="autopilot-toggle">
                            <input type="checkbox" data-action="${command.action}" ${command.state ? 'checked' : ''}>
                            ${command.name}
                        </label>
                    `;
                    break;
            }
        }
        
        this.selectionCommands.innerHTML = commandsHtml;
        
        // Add event listeners to command buttons
        const commandButtons = this.selectionCommands.querySelectorAll('button');
        commandButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.executeCommand(action);
            });
        });
        
        // Add event listeners to toggle inputs
        const toggleInputs = this.selectionCommands.querySelectorAll('input[type="checkbox"]');
        toggleInputs.forEach(input => {
            input.addEventListener('change', () => {
                const action = input.getAttribute('data-action');
                this.executeCommand(action);
            });
        });
    }
    
    updateProductionOptions(entity) {
        const unitTypes = entity.unitTypes;
        const sideGold = this.game.getGold(entity.side);
        let productionHtml = '<h4>Production</h4>';
        
        // Show current production queue
        if (entity.productionQueue.length > 0) {
            const currentProduction = entity.productionQueue[0];
            const progress = Math.floor(entity.getProductionProgress() * 100);
            
            productionHtml += `
                <div>
                    <label>Building: ${currentProduction.name}</label>
                    <div class="stat-bar">
                        <div class="stat-bar-fill" style="width: ${progress}%; background-color: #2196F3;"></div>
                        <div class="stat-bar-text">${progress}%</div>
                    </div>
                </div>
            `;
            
            if (entity.productionQueue.length > 1) {
                productionHtml += `<div>Queue: ${entity.productionQueue.slice(1).map(item => item.name).join(', ')}</div>`;
            }
        }
        
        // Show available units to produce
        productionHtml += '<h4>Available Units</h4>';
        
        for (const unitType of unitTypes) {
            const canAfford = sideGold >= unitType.cost;
            
            productionHtml += `
                <button class="unit-button" data-unit-type="${unitType.unitType}" ${!canAfford ? 'disabled' : ''}>
                    <span>${unitType.name}</span>
                    <span class="unit-cost">${unitType.cost} ⚜</span>
                </button>
            `;
        }
        
        // Show building options if this is a base
        if (entity.isBase) {
            productionHtml += '<h4>Available Buildings</h4>';
            
            for (const [key, buildingType] of Object.entries(this.game.buildingTypes)) {
                if (key !== 'base') { // Can't build another base
                    const canAfford = sideGold >= buildingType.cost;
                    
                    productionHtml += `
                        <button class="unit-button" data-building-type="${key}" ${!canAfford ? 'disabled' : ''}>
                            <span>${buildingType.name}</span>
                            <span class="unit-cost">${buildingType.cost} ⚜</span>
                        </button>
                    `;
                }
            }
        }
        
        // Show upgrade option if available
        if (entity.level < entity.maxLevel) {
            const upgradeOption = entity.upgradeOptions[entity.level - 1];
            if (upgradeOption) {
                const canAfford = sideGold >= upgradeOption.cost;
                
                productionHtml += `
                    <h4>Upgrade</h4>
                    <button class="unit-button" data-action="upgrade" ${!canAfford ? 'disabled' : ''}>
                        <span>Upgrade to Level ${entity.level + 1}</span>
                        <span class="unit-cost">${upgradeOption.cost} ⚜</span>
                    </button>
                `;
            }
        }
        
        this.productionOptions.innerHTML = productionHtml;
        
        // Add event listeners to unit buttons
        const unitButtons = this.productionOptions.querySelectorAll('button[data-unit-type]');
        unitButtons.forEach(button => {
            button.addEventListener('click', () => {
                const unitType = button.getAttribute('data-unit-type');
                this.queueUnitProduction(entity, unitType);
            });
        });
        
        // Add event listeners to building buttons
        const buildingButtons = this.productionOptions.querySelectorAll('button[data-building-type]');
        buildingButtons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.getAttribute('data-building-type');
                this.createBuilding(entity, buildingType);
            });
        });
        
        // Add event listener to upgrade button
        const upgradeButton = this.productionOptions.querySelector('button[data-action="upgrade"]');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => {
                this.executeCommand('upgrade');
            });
        }
    }
    
    queueUnitProduction(entity, unitType) {
        const unitConfig = this.game.unitTypes[unitType];
        if (unitConfig) {
            const success = entity.queueProduction(unitConfig, this.game);
            if (success) {
                this.updateProductionOptions(entity);
            }
        }
    }
    
    createBuilding(baseEntity, buildingType) {
        const buildingConfig = this.game.buildingTypes[buildingType];
        if (!buildingConfig) return;
        
        // Check if we have enough gold
        const sideGold = this.game.getGold(baseEntity.side);
        if (sideGold < buildingConfig.cost) return;
        
        // Find a suitable position near the base
        const baseX = baseEntity.x;
        const baseY = baseEntity.y;
        const side = baseEntity.side;
        
        // Try to find a position that doesn't overlap with other entities
        let validPosition = false;
        let newX, newY;
        let attempts = 0;
        
        while (!validPosition && attempts < 10) {
            // Generate position in a radius around the base
            const angle = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 100;
            newX = baseX + Math.cos(angle) * distance;
            newY = baseY + Math.sin(angle) * distance;
            
            // Make sure it's within bounds
            newX = clamp(newX, 100, this.game.bounds.width - 100);
            newY = clamp(newY, 100, this.game.bounds.height - 100);
            
            // Check if position is valid (not overlapping with other entities)
            validPosition = true;
            for (const entity of this.game.entities) {
                if (distance(newX, newY, entity.x, entity.y) < 100) {
                    validPosition = false;
                    break;
                }
            }
            
            attempts++;
        }
        
        if (!validPosition) {
            console.log('Could not find valid position for new building');
            return;
        }
        
        // Deduct gold
        this.game.addGold(side, -buildingConfig.cost);
        
        // Create the building
        const building = new Building({
            ...buildingConfig,
            x: newX,
            y: newY,
            side: side
        });
        
        this.game.addEntity(building);
        
        // Add spawn effect
        this.game.addEffect({
            type: 'spawn',
            x: newX,
            y: newY,
            duration: 1.0
        });
        
        // Update UI
        this.updateProductionOptions(baseEntity);
    }
    
    executeCommand(action) {
        const entity = this.game.selectedEntity;
        if (!entity) return;
        
        switch (action) {
            case 'toggleAutopilot':
                entity.toggleAutopilot();
                this.updateEntityCommands(entity);
                break;
                
            case 'stop':
                entity.stop();
                break;
                
            case 'upgrade':
                if (entity.upgrade) {
                    const success = entity.upgrade(this.game);
                    if (success) {
                        this.updateEntityStats(entity);
                        this.updateProductionOptions(entity);
                    }
                }
                break;
        }
    }
    
    updateUI() {
        // Update resource displays
        this.greenGoldDisplay.textContent = formatNumber(this.game.getGold(0));
        this.redGoldDisplay.textContent = formatNumber(this.game.getGold(1));
        
        // Update selection panel if an entity is selected
        if (this.game.selectedEntity && !this.selectionPanel.classList.contains('hidden')) {
            const entity = this.game.selectedEntity;
            this.updateEntityStats(entity);
            
            // Update production options if this is a base building
            if (entity.type === 'building' && entity.isBase) {
                this.updateProductionOptions(entity);
            }
        }
    }
}
