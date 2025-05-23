// Building class for structures that can produce units and resources
class Building extends Entity {
    constructor(config) {
        super({
            ...config,
            type: 'building',
            width: config.width || 64,
            height: config.height || 64,
            radius: config.radius || 32
        });

        // Building-specific properties
        this.buildingType = config.buildingType || 'generic';
        this.isBase = config.isBase || false;
        this.productionQueue = [];
        this.productionProgress = 0;
        this.productionRate = config.productionRate || 1; // Production points per second
        this.goldGeneration = config.goldGeneration || 0; // Gold per second
        this.lastGoldTime = 0;
        this.unitTypes = config.unitTypes || []; // Units this building can produce
        this.upgradeOptions = config.upgradeOptions || [];
        this.level = config.level || 1;
        this.maxLevel = config.maxLevel || 3;

        // Use attack range from constants if available and this is a tower
        if (this.buildingType === 'tower' && GAME_CONSTANTS.COMBAT.ATTACK_RANGES.tower) {
            this.attackRange = GAME_CONSTANTS.COMBAT.ATTACK_RANGES.tower;
        }

        // Add building-specific commands
        this.commands = [
            ...this.commands
        ];

        // Add upgrade command if building has upgrade options
        if (this.upgradeOptions.length > 0) {
            this.commands.push({
                name: 'Upgrade',
                type: 'button',
                action: 'upgrade'
            });
        }
    }

    update(deltaTime, gameState) {
        super.update(deltaTime, gameState);

        // Generate gold
        if (this.goldGeneration > 0) {
            const currentTime = gameState.currentTime;
            const timeSinceLastGold = (currentTime - this.lastGoldTime) / 1000; // Convert to seconds

            if (timeSinceLastGold >= 1) { // Generate gold every second
                const goldToAdd = this.goldGeneration * Math.floor(timeSinceLastGold);
                gameState.addGold(this.side, goldToAdd);
                this.lastGoldTime = currentTime;
            }
        }

        // Process production queue
        if (this.productionQueue.length > 0 && this.autopilot) {
            const currentProduction = this.productionQueue[0];
            this.productionProgress += this.productionRate * deltaTime;

            if (this.productionProgress >= currentProduction.cost) {
                this.completeProduction(currentProduction, gameState);
                this.productionQueue.shift();
                this.productionProgress = 0;
            }
        }

        // Building-specific autopilot behavior
        if (this.autopilot) {
            this.runBuildingAutopilot(gameState);
        }
    }

    runBuildingAutopilot(gameState) {
        // Base buildings should produce units when possible
        if (this.isBase && this.productionQueue.length < 2) {
            // Check if we have enough gold to produce a unit
            const sideGold = gameState.getGold(this.side);

            // Get available unit types sorted by cost
            const availableUnits = this.unitTypes
                .filter(unitType => unitType.cost <= sideGold);

            if (availableUnits.length > 0) {
                // Choose a unit based on side preference
                const preferredTypes = GAME_CONSTANTS.AI.UNIT_PREFERENCE[this.side] || ['warrior', 'archer', 'mage', 'healer'];

                // Find the highest priority unit we can afford
                let unitToQueue = null;
                for (const unitType of preferredTypes) {
                    const unit = availableUnits.find(u => u.unitType === unitType);
                    if (unit) {
                        unitToQueue = unit;
                        break;
                    }
                }

                // If no preferred unit found, pick a random one
                if (!unitToQueue && availableUnits.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableUnits.length);
                    unitToQueue = availableUnits[randomIndex];
                }

                if (unitToQueue) {
                    this.queueProduction(unitToQueue, gameState);
                }
            }
        }

        // Towers should attack nearby enemies
        if (this.buildingType === 'tower' && this.attackDamage > 0 && this.attackRange > 0) {
            if (!this.targetId || !gameState.getEntityById(this.targetId)?.alive) {
                const nearestEnemy = this.findNearestEnemy(gameState);
                if (nearestEnemy) {
                    this.setTarget(nearestEnemy.id);
                }
            }
        }
    }

    queueProduction(unitType, gameState) {
        // Check if we have enough gold
        const cost = unitType.cost;
        if (gameState.getGold(this.side) < cost) {
            return false;
        }

        // Deduct gold
        gameState.addGold(this.side, -cost);

        // Add to production queue
        this.productionQueue.push(unitType);

        return true;
    }

    completeProduction(unitType, gameState) {
        // Create spawn position near the building
        const spawnRadius = this.radius + 20;
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnX = this.x + Math.cos(spawnAngle) * spawnRadius;
        const spawnY = this.y + Math.sin(spawnAngle) * spawnRadius;

        // Create the unit
        const unitConfig = {
            ...unitType,
            x: spawnX,
            y: spawnY,
            side: this.side
        };

        const unit = new Unit(unitConfig);
        gameState.addEntity(unit);

        // Add spawn effect
        gameState.addEffect({
            type: 'spawn',
            x: spawnX,
            y: spawnY,
            duration: 0.5
        });

        return unit;
    }

    upgrade(gameState) {
        if (this.level >= this.maxLevel) {
            return false;
        }

        const upgradeOption = this.upgradeOptions[this.level - 1];
        if (!upgradeOption) {
            return false;
        }

        // Check if we have enough gold
        if (gameState.getGold(this.side) < upgradeOption.cost) {
            return false;
        }

        // Deduct gold
        gameState.addGold(this.side, -upgradeOption.cost);

        // Apply upgrade
        this.level++;

        // Apply stat improvements
        if (upgradeOption.healthBonus) {
            this.maxHealth += upgradeOption.healthBonus;
            this.health += upgradeOption.healthBonus;
        }

        if (upgradeOption.defenseBonus) {
            this.defense += upgradeOption.defenseBonus;
        }

        if (upgradeOption.productionRateBonus) {
            this.productionRate += upgradeOption.productionRateBonus;
        }

        if (upgradeOption.goldGenerationBonus) {
            this.goldGeneration += upgradeOption.goldGenerationBonus;
        }

        if (upgradeOption.attackDamageBonus) {
            this.attackDamage += upgradeOption.attackDamageBonus;
        }

        if (upgradeOption.attackRangeBonus) {
            this.attackRange += upgradeOption.attackRangeBonus;
        }

        if (upgradeOption.attackSpeedBonus) {
            this.attackSpeed += upgradeOption.attackSpeedBonus;
        }

        // Add new unit types if available
        if (upgradeOption.newUnitTypes) {
            this.unitTypes = [...this.unitTypes, ...upgradeOption.newUnitTypes];
        }

        // Add upgrade effect
        gameState.addEffect({
            type: 'upgrade',
            x: this.x,
            y: this.y,
            duration: 1.0
        });

        return true;
    }

    getProductionProgress() {
        if (this.productionQueue.length === 0) {
            return 0;
        }

        const currentProduction = this.productionQueue[0];
        return this.productionProgress / currentProduction.cost;
    }

    getStats() {
        const stats = super.getStats();

        // Add building-specific stats
        stats['Building Type'] = this.buildingType;
        stats['Level'] = `${this.level}/${this.maxLevel}`;

        if (this.goldGeneration > 0) {
            stats['Gold Generation'] = `${this.goldGeneration}/s`;
        }

        if (this.productionRate > 0) {
            stats['Production Rate'] = this.productionRate.toFixed(1);
        }

        if (this.productionQueue.length > 0) {
            stats['Queue'] = this.productionQueue.map(item => item.name).join(', ');
        }

        return stats;
    }

    draw(ctx) {
        // Draw building rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);

        // Draw outline
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);

        // Draw selection indicator if selected
        if (this.selected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                this.x - this.width/2 - 5,
                this.y - this.height/2 - 5,
                this.width + 10,
                this.height + 10
            );

            // Draw attack range for towers and other attacking buildings
            if (this.attackRange > 0) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Draw building type and level
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.buildingType} L${this.level}`, this.x, this.y);

        // Draw health bar
        const healthBarWidth = this.width;
        const healthBarHeight = 8;
        const healthBarX = this.x - this.width/2;
        const healthBarY = this.y + this.height/2 + 5;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Health fill
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : healthPercentage > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

        // Draw production progress if something is in the queue
        if (this.productionQueue.length > 0) {
            const progressBarWidth = this.width;
            const progressBarHeight = 5;
            const progressBarX = this.x - this.width/2;
            const progressBarY = this.y + this.height/2 + 15;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

            // Progress fill
            const progressPercentage = this.getProductionProgress();
            ctx.fillStyle = '#2196F3';
            ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progressPercentage, progressBarHeight);
        }
    }
}
