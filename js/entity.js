// Base Entity class for all game objects
class Entity {
    constructor(config) {
        this.id = generateId();
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 32;
        this.height = config.height || 32;
        this.radius = config.radius || 16;
        this.side = config.side || 0; // 0 = player, 1 = enemy
        this.name = config.name || 'Entity';
        this.type = config.type || 'entity';
        this.selected = false;
        this.autopilot = config.autopilot !== undefined ? config.autopilot : true;
        this.targetId = null;
        this.targetPosition = null;
        this.color = config.color || getSideColor(this.side);
        this.outlineColor = config.outlineColor || '#ffffff';
        this.speed = config.speed || 0;
        this.maxHealth = config.maxHealth || 100;
        this.health = config.health !== undefined ? config.health : this.maxHealth;
        this.maxMana = config.maxMana || 0;
        this.mana = config.mana !== undefined ? config.mana : this.maxMana;
        this.attackDamage = config.attackDamage || 0;
        this.attackRange = config.attackRange || 0;
        this.attackSpeed = config.attackSpeed || 1; // Attacks per second
        this.lastAttackTime = 0;
        this.defense = config.defense || 0;
        this.alive = true;
        this.commands = config.commands || [];
        this.stats = config.stats || {};
    }

    update(deltaTime, gameState) {
        // Regenerate mana over time if applicable
        if (this.maxMana > 0) {
            this.mana = Math.min(this.maxMana, this.mana + (this.maxMana * 0.05 * deltaTime));
        }

        // Handle movement if we have a target position
        if (this.targetPosition && this.speed > 0) {
            const dx = this.targetPosition.x - this.x;
            const dy = this.targetPosition.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) { // Only move if we're not already close enough
                const moveX = (dx / dist) * this.speed * deltaTime;
                const moveY = (dy / dist) * this.speed * deltaTime;
                this.x += moveX;
                this.y += moveY;
            } else {
                this.targetPosition = null; // We've reached the target
            }
        }

        // Handle attacking if we have a target
        if (this.targetId && this.attackDamage > 0 && this.attackRange > 0) {
            const target = gameState.getEntityById(this.targetId);
            if (target && target.alive && target.side !== this.side) {
                const dist = distance(this.x, this.y, target.x, target.y);
                
                // If target is in range and attack cooldown is over
                if (dist <= this.attackRange && 
                    gameState.currentTime - this.lastAttackTime >= 1000 / this.attackSpeed) {
                    this.attack(target, gameState);
                    this.lastAttackTime = gameState.currentTime;
                } else if (dist > this.attackRange && this.speed > 0) {
                    // Move towards target if out of range
                    this.targetPosition = { x: target.x, y: target.y };
                }
            } else {
                // Target is dead or invalid
                this.targetId = null;
            }
        }

        // Run autopilot behavior if enabled
        if (this.autopilot) {
            this.runAutopilot(gameState);
        }
    }

    attack(target, gameState) {
        if (!target || !target.alive) return;
        
        // Calculate damage with defense reduction
        const damage = Math.max(1, this.attackDamage - target.defense);
        target.takeDamage(damage, this, gameState);
        
        // Trigger attack effects or animations here
        gameState.addEffect({
            type: 'attack',
            sourceX: this.x,
            sourceY: this.y,
            targetX: target.x,
            targetY: target.y,
            duration: 0.2
        });
    }

    takeDamage(amount, attacker, gameState) {
        this.health -= amount;
        
        // Trigger damage effects or animations here
        gameState.addEffect({
            type: 'damage',
            x: this.x,
            y: this.y,
            amount: amount,
            duration: 0.5
        });
        
        if (this.health <= 0) {
            this.health = 0;
            this.die(gameState);
        }
        
        // If not on autopilot and we're attacked, target the attacker
        if (!this.autopilot && !this.targetId && attacker) {
            this.setTarget(attacker.id);
        }
    }

    die(gameState) {
        this.alive = false;
        this.targetId = null;
        this.targetPosition = null;
        
        // Trigger death effects or animations here
        gameState.addEffect({
            type: 'death',
            x: this.x,
            y: this.y,
            duration: 1.0
        });
        
        // Schedule removal from game state
        setTimeout(() => {
            gameState.removeEntity(this.id);
        }, 1000);
    }

    runAutopilot(gameState) {
        // Base autopilot behavior - find nearest enemy and attack
        if (this.attackDamage > 0 && !this.targetId) {
            const nearestEnemy = this.findNearestEnemy(gameState);
            if (nearestEnemy) {
                this.setTarget(nearestEnemy.id);
            }
        }
    }

    findNearestEnemy(gameState) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const entity of gameState.entities) {
            if (entity.side !== this.side && entity.alive) {
                const dist = distance(this.x, this.y, entity.x, entity.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = entity;
                }
            }
        }
        
        return nearest;
    }

    setTarget(targetId) {
        this.targetId = targetId;
        this.targetPosition = null; // Clear any movement target
    }

    setTargetPosition(x, y) {
        this.targetPosition = { x, y };
        this.targetId = null; // Clear any attack target
    }

    toggleAutopilot() {
        this.autopilot = !this.autopilot;
        if (this.autopilot) {
            // Clear any manual targets when enabling autopilot
            this.targetId = null;
            this.targetPosition = null;
        }
    }

    getStats() {
        const baseStats = {
            'Health': `${Math.floor(this.health)}/${this.maxHealth}`,
            'Side': this.side === 0 ? 'Green' : 'Red'
        };
        
        if (this.maxMana > 0) {
            baseStats['Mana'] = `${Math.floor(this.mana)}/${this.maxMana}`;
        }
        
        if (this.attackDamage > 0) {
            baseStats['Attack'] = this.attackDamage;
            baseStats['Range'] = this.attackRange;
            baseStats['Attack Speed'] = this.attackSpeed.toFixed(1);
        }
        
        if (this.defense > 0) {
            baseStats['Defense'] = this.defense;
        }
        
        if (this.speed > 0) {
            baseStats['Speed'] = this.speed;
        }
        
        return { ...baseStats, ...this.stats };
    }

    getCommands() {
        // Base commands available to all entities
        const baseCommands = [
            {
                name: 'Autopilot',
                type: 'toggle',
                action: 'toggleAutopilot',
                state: this.autopilot
            }
        ];
        
        return [...baseCommands, ...this.commands];
    }

    draw(ctx) {
        // Draw entity circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw selection indicator if selected
        if (this.selected) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw health bar
        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 5;
        const healthBarX = this.x - this.radius;
        const healthBarY = this.y + this.radius + 5;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health fill
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : healthPercentage > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
    }
}
