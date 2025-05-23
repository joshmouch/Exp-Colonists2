// Unit class for characters that can move and fight
class Unit extends Entity {
    constructor(config) {
        super({
            ...config,
            type: 'unit'
        });

        // Unit-specific properties
        this.unitType = config.unitType || 'generic';
        this.role = config.role || 'offensive'; // offensive, support, utility
        this.attackType = config.attackType || 'melee'; // melee, ranged, magic
        this.abilities = config.abilities || [];
        this.cooldowns = {};
        this.cost = config.cost || 100;

        // Dodge properties
        this.isDodging = false;
        this.dodgeTime = 0;
        this.originalTargetId = null;

        // Use attack range from constants if available
        if (GAME_CONSTANTS.COMBAT.ATTACK_RANGES[this.unitType]) {
            this.attackRange = GAME_CONSTANTS.COMBAT.ATTACK_RANGES[this.unitType];
        }

        // Initialize cooldowns for abilities
        this.abilities.forEach(ability => {
            this.cooldowns[ability.id] = 0;
        });

        // Add unit-specific commands
        this.commands = [
            ...this.commands,
            {
                name: 'Move',
                type: 'position',
                action: 'move'
            },
            {
                name: 'Attack',
                type: 'target',
                action: 'attack'
            },
            {
                name: 'Stop',
                type: 'button',
                action: 'stop'
            }
        ];

        // Add ability commands
        this.abilities.forEach(ability => {
            this.commands.push({
                name: ability.name,
                type: ability.targetType,
                action: 'useAbility',
                abilityId: ability.id,
                cooldown: ability.cooldown
            });
        });
    }

    update(deltaTime, gameState) {
        super.update(deltaTime, gameState);

        // Update ability cooldowns
        for (const abilityId in this.cooldowns) {
            if (this.cooldowns[abilityId] > 0) {
                this.cooldowns[abilityId] = Math.max(0, this.cooldowns[abilityId] - deltaTime);
            }
        }

        // Check for incoming projectiles and try to dodge if not already dodging
        if (!this.isDodging && this.speed > 0) {
            this.checkForIncomingProjectiles(gameState);
        }

        // Update dodge state
        if (this.isDodging) {
            this.dodgeTime -= deltaTime;
            if (this.dodgeTime <= 0) {
                this.isDodging = false;
                this.dodgeTime = 0;
                // Return to original target if we were attacking
                if (this.originalTargetId) {
                    this.targetId = this.originalTargetId;
                    this.originalTargetId = null;
                }
            }
        }

        // Role-specific behaviors in autopilot mode
        if (this.autopilot) {
            if (this.role === 'support') {
                this.runSupportBehavior(gameState);
            } else if (this.role === 'utility') {
                this.runUtilityBehavior(gameState);
            }
            // Offensive behavior is handled in the base Entity class
        }
    }

    checkForIncomingProjectiles(gameState) {
        // Only try to dodge if we have enough intelligence and speed
        const dodgeIntelligence = this.autopilot ? GAME_CONSTANTS.AI.DODGE_INTELLIGENCE : 1.0;

        // Random chance based on intelligence - smarter units dodge more often
        if (Math.random() > dodgeIntelligence) return;

        // Check all projectiles
        for (const projectile of gameState.projectiles) {
            // Skip if projectile is from our side or is a healing projectile
            if (projectile.side === this.side || projectile.healing > 0) continue;

            // Skip if projectile is not targeting us
            if (projectile.targetId && projectile.targetId !== this.id) continue;

            // Calculate if projectile will hit us
            const dist = distance(projectile.currentX, projectile.currentY, this.x, this.y);
            const projectileSpeed = projectile.speed;
            const timeToImpact = dist / projectileSpeed;

            // Only dodge if projectile is close enough but not too close
            if (timeToImpact < GAME_CONSTANTS.MOVEMENT.REACTION_TIME * 3 &&
                timeToImpact > GAME_CONSTANTS.MOVEMENT.REACTION_TIME) {

                // Calculate dodge direction (perpendicular to projectile path)
                const angleToProjectile = getAngle(projectile.currentX, projectile.currentY, this.x, this.y);
                const dodgeAngle = angleToProjectile + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);

                // Calculate dodge position
                const dodgeDistance = this.radius * 3;
                const dodgeX = this.x + Math.cos(dodgeAngle) * dodgeDistance;
                const dodgeY = this.y + Math.sin(dodgeAngle) * dodgeDistance;

                // Start dodging
                this.startDodge(dodgeX, dodgeY);

                // Add dodge effect
                gameState.addEffect({
                    type: 'dodge',
                    x: this.x,
                    y: this.y,
                    duration: GAME_CONSTANTS.COMBAT.EFFECT_DURATION.DODGE
                });

                // Only dodge one projectile at a time
                break;
            }
        }
    }

    startDodge(x, y) {
        // Save current target if attacking
        if (this.targetId) {
            this.originalTargetId = this.targetId;
            this.targetId = null;
        }

        // Set dodge parameters
        this.isDodging = true;
        this.dodgeTime = GAME_CONSTANTS.COMBAT.EFFECT_DURATION.DODGE;
        this.setTargetPosition(x, y);
    }

    runSupportBehavior(gameState) {
        // Support units prioritize healing/buffing allies
        // Find nearby injured ally
        if (!this.targetId) {
            const nearestAlly = this.findNearestInjuredAlly(gameState);
            if (nearestAlly) {
                this.setTarget(nearestAlly.id);
            }
        }
    }

    runUtilityBehavior(gameState) {
        // Utility units might gather resources, scout, etc.
        // For now, just move around randomly if no target
        if (!this.targetId && !this.targetPosition && Math.random() < 0.01) {
            const randomPos = randomPosition(gameState.bounds);
            this.setTargetPosition(randomPos.x, randomPos.y);
        }
    }

    findNearestInjuredAlly(gameState) {
        let nearest = null;
        let minDist = Infinity;

        for (const entity of gameState.entities) {
            if (entity.side === this.side && entity.alive && entity.health < entity.maxHealth * 0.8) {
                const dist = distance(this.x, this.y, entity.x, entity.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = entity;
                }
            }
        }

        return nearest;
    }

    useAbility(abilityId, target, position, gameState) {
        const ability = this.abilities.find(a => a.id === abilityId);
        if (!ability) return false;

        // Check cooldown
        if (this.cooldowns[abilityId] > 0) return false;

        // Check mana cost
        if (ability.manaCost && this.mana < ability.manaCost) return false;

        // Execute ability based on type
        let success = false;

        switch (ability.type) {
            case 'heal':
                if (target && target.alive && target.side === this.side) {
                    const healAmount = ability.value;
                    target.health = Math.min(target.maxHealth, target.health + healAmount);
                    success = true;

                    // Add heal effect
                    gameState.addEffect({
                        type: 'heal',
                        x: target.x,
                        y: target.y,
                        amount: healAmount,
                        duration: 0.5
                    });
                }
                break;

            case 'damage':
                if (target && target.alive && target.side !== this.side) {
                    const damageAmount = ability.value;
                    target.takeDamage(damageAmount, this, gameState);
                    success = true;
                }
                break;

            case 'buff':
                if (target && target.alive && target.side === this.side) {
                    // Apply buff effect
                    target.stats[ability.stat] = (target.stats[ability.stat] || 0) + ability.value;

                    // Set duration if temporary
                    if (ability.duration) {
                        setTimeout(() => {
                            target.stats[ability.stat] -= ability.value;
                        }, ability.duration * 1000);
                    }

                    success = true;

                    // Add buff effect
                    gameState.addEffect({
                        type: 'buff',
                        x: target.x,
                        y: target.y,
                        duration: 0.5
                    });
                }
                break;

            case 'aoe':
                // Area of effect ability
                const entities = gameState.getEntitiesInRadius(
                    position.x, position.y, ability.radius
                );

                entities.forEach(entity => {
                    if (ability.affectsEnemies && entity.side !== this.side) {
                        if (ability.damage) {
                            entity.takeDamage(ability.damage, this, gameState);
                        }
                    }

                    if (ability.affectsAllies && entity.side === this.side) {
                        if (ability.heal) {
                            entity.health = Math.min(entity.maxHealth, entity.health + ability.heal);
                        }
                    }
                });

                success = true;

                // Add AOE effect
                gameState.addEffect({
                    type: 'aoe',
                    x: position.x,
                    y: position.y,
                    radius: ability.radius,
                    duration: 0.8
                });
                break;
        }

        if (success) {
            // Consume mana
            if (ability.manaCost) {
                this.mana -= ability.manaCost;
            }

            // Set cooldown
            this.cooldowns[abilityId] = ability.cooldown;
        }

        return success;
    }

    move(x, y) {
        this.setTargetPosition(x, y);
    }

    stop() {
        this.targetId = null;
        this.targetPosition = null;
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw unit type indicator (could be replaced with sprites later)
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let symbol = '';
        switch (this.unitType) {
            case 'archer':
                symbol = 'A';
                break;
            case 'warrior':
                symbol = 'W';
                break;
            case 'mage':
                symbol = 'M';
                break;
            case 'healer':
                symbol = 'H';
                break;
            default:
                symbol = 'U';
        }

        ctx.fillText(symbol, this.x, this.y);

        // Draw attack range indicator when selected
        if (this.selected && this.attackRange > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw mana bar if unit has mana
        if (this.maxMana > 0) {
            const manaBarWidth = this.radius * 2;
            const manaBarHeight = 3;
            const manaBarX = this.x - this.radius;
            const manaBarY = this.y + this.radius + 12;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(manaBarX, manaBarY, manaBarWidth, manaBarHeight);

            // Mana fill
            const manaPercentage = this.mana / this.maxMana;
            ctx.fillStyle = '#2196F3';
            ctx.fillRect(manaBarX, manaBarY, manaBarWidth * manaPercentage, manaBarHeight);
        }
    }
}
