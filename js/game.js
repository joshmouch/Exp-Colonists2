// Game class to manage game state
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = [];
        this.effects = [];
        this.projectiles = [];
        this.selectedEntity = null;
        this.resources = [
            { side: 0, gold: GAME_CONSTANTS.RESOURCES.STARTING_GOLD },
            { side: 1, gold: GAME_CONSTANTS.RESOURCES.STARTING_GOLD }
        ];
        this.bounds = {
            width: canvas.width,
            height: canvas.height
        };
        this.currentTime = Date.now();
        this.lastUpdateTime = this.currentTime;
        this.gameSpeed = GAME_CONSTANTS.GAME_SPEED.DEFAULT;
        this.paused = false;
        this.gameOver = false;
        this.winner = null;
        this.lastCollisionCheck = 0;

        // Unit type definitions
        this.unitTypes = {
            warrior: {
                name: 'Warrior',
                unitType: 'warrior',
                role: 'offensive',
                attackType: 'melee',
                maxHealth: 150,
                attackDamage: 15,
                attackRange: 20,
                attackSpeed: 1.0,
                defense: 5,
                speed: 60,
                radius: 15,
                cost: 100
            },
            archer: {
                name: 'Archer',
                unitType: 'archer',
                role: 'offensive',
                attackType: 'ranged',
                maxHealth: 80,
                attackDamage: 20,
                attackRange: 150,
                attackSpeed: 0.8,
                defense: 2,
                speed: 70,
                radius: 14,
                cost: 120
            },
            mage: {
                name: 'Mage',
                unitType: 'mage',
                role: 'offensive',
                attackType: 'magic',
                maxHealth: 70,
                maxMana: 100,
                attackDamage: 25,
                attackRange: 120,
                attackSpeed: 0.7,
                defense: 1,
                speed: 60,
                radius: 14,
                cost: 150,
                abilities: [
                    {
                        id: 'fireball',
                        name: 'Fireball',
                        type: 'damage',
                        targetType: 'target',
                        value: 40,
                        manaCost: 30,
                        cooldown: 5
                    }
                ]
            },
            healer: {
                name: 'Healer',
                unitType: 'healer',
                role: 'support',
                attackType: 'magic',
                maxHealth: 60,
                maxMana: 120,
                attackDamage: 5,
                attackRange: 80,
                attackSpeed: 0.5,
                defense: 1,
                speed: 55,
                radius: 14,
                cost: 130,
                abilities: [
                    {
                        id: 'heal',
                        name: 'Heal',
                        type: 'heal',
                        targetType: 'target',
                        value: 30,
                        manaCost: 25,
                        cooldown: 3
                    }
                ]
            }
        };

        // Building type definitions
        this.buildingTypes = {
            base: {
                name: 'Base',
                buildingType: 'base',
                isBase: true,
                maxHealth: 500,
                defense: 10,
                goldGeneration: 5,
                productionRate: 1.0,
                width: 80,
                height: 80,
                radius: 40,
                unitTypes: [
                    this.unitTypes.warrior,
                    this.unitTypes.archer
                ],
                upgradeOptions: [
                    {
                        level: 2,
                        cost: 300,
                        healthBonus: 200,
                        defenseBonus: 5,
                        goldGenerationBonus: 3,
                        productionRateBonus: 0.5,
                        newUnitTypes: [
                            this.unitTypes.mage
                        ]
                    },
                    {
                        level: 3,
                        cost: 500,
                        healthBonus: 300,
                        defenseBonus: 10,
                        goldGenerationBonus: 5,
                        productionRateBonus: 0.5,
                        newUnitTypes: [
                            this.unitTypes.healer
                        ]
                    }
                ]
            },
            goldMine: {
                name: 'Gold Mine',
                buildingType: 'goldMine',
                maxHealth: 200,
                defense: 5,
                goldGeneration: 10,
                width: 60,
                height: 60,
                radius: 30,
                cost: 200,
                upgradeOptions: [
                    {
                        level: 2,
                        cost: 150,
                        healthBonus: 50,
                        goldGenerationBonus: 5
                    },
                    {
                        level: 3,
                        cost: 300,
                        healthBonus: 100,
                        goldGenerationBonus: 10
                    }
                ]
            },
            tower: {
                name: 'Tower',
                buildingType: 'tower',
                maxHealth: 250,
                defense: 8,
                attackDamage: 20,
                attackRange: 180,
                attackSpeed: 1.0,
                width: 50,
                height: 50,
                radius: 25,
                cost: 150,
                upgradeOptions: [
                    {
                        level: 2,
                        cost: 200,
                        healthBonus: 100,
                        defenseBonus: 4,
                        attackDamageBonus: 10,
                        attackRangeBonus: 20
                    },
                    {
                        level: 3,
                        cost: 350,
                        healthBonus: 150,
                        defenseBonus: 6,
                        attackDamageBonus: 15,
                        attackRangeBonus: 30,
                        attackSpeedBonus: 0.2
                    }
                ]
            }
        };

        // Initialize the game
        this.init();
    }

    init() {
        // Set up canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Create initial buildings for both sides
        this.createInitialBuildings();

        // Start game loop
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.bounds.width = this.canvas.width;
        this.bounds.height = this.canvas.height;
    }

    createInitialBuildings() {
        // Create bases for both sides
        const greenBase = new Building({
            ...this.buildingTypes.base,
            x: 150,
            y: this.bounds.height / 2,
            side: 0
        });

        const redBase = new Building({
            ...this.buildingTypes.base,
            x: this.bounds.width - 150,
            y: this.bounds.height / 2,
            side: 1
        });

        this.addEntity(greenBase);
        this.addEntity(redBase);

        // Create gold mines for both sides
        const greenMine = new Building({
            ...this.buildingTypes.goldMine,
            x: 300,
            y: this.bounds.height / 2 - 150,
            side: 0
        });

        const redMine = new Building({
            ...this.buildingTypes.goldMine,
            x: this.bounds.width - 300,
            y: this.bounds.height / 2 - 150,
            side: 1
        });

        this.addEntity(greenMine);
        this.addEntity(redMine);

        // Create towers for both sides
        const greenTower = new Building({
            ...this.buildingTypes.tower,
            x: 300,
            y: this.bounds.height / 2 + 150,
            side: 0
        });

        const redTower = new Building({
            ...this.buildingTypes.tower,
            x: this.bounds.width - 300,
            y: this.bounds.height / 2 + 150,
            side: 1
        });

        this.addEntity(greenTower);
        this.addEntity(redTower);
    }

    gameLoop() {
        // Calculate delta time
        this.currentTime = Date.now();
        let deltaTime = (this.currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = this.currentTime;

        // Apply game speed
        deltaTime *= this.gameSpeed;

        // Cap delta time to prevent large jumps
        deltaTime = Math.min(deltaTime, 0.1);

        if (!this.paused) {
            this.update(deltaTime);
        }

        this.render();

        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update all entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.alive) {
                entity.update(deltaTime, this);
            }
        }

        // Update projectiles with physics
        this.updateProjectiles(deltaTime);

        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.duration -= deltaTime;

            if (effect.duration <= 0) {
                this.effects.splice(i, 1);
            }
        }

        // Check for game over condition
        this.checkGameOver();
    }

    updateProjectiles(deltaTime) {
        // Check for collisions periodically to save performance
        const shouldCheckCollisions =
            this.currentTime - this.lastCollisionCheck >=
            GAME_CONSTANTS.PHYSICS.COLLISION_DETECTION_INTERVAL * 1000;

        if (shouldCheckCollisions) {
            this.lastCollisionCheck = this.currentTime;
        }

        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            // Calculate how long the projectile has existed
            const age = (this.currentTime - projectile.creationTime) / 1000;

            // Remove if it's too old
            if (age > projectile.lifetime) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Get target's current position if it exists
            let targetX = projectile.targetX;
            let targetY = projectile.targetY;
            let targetEntity = null;

            if (projectile.targetId) {
                targetEntity = this.getEntityById(projectile.targetId);
                if (targetEntity && targetEntity.alive) {
                    targetX = targetEntity.x;
                    targetY = targetEntity.y;
                }
            }

            // Calculate movement vector
            const angle = getAngle(projectile.sourceX, projectile.sourceY, targetX, targetY);
            const speed = projectile.speed;
            let moveX = Math.cos(angle) * speed * deltaTime;
            let moveY = Math.sin(angle) * speed * deltaTime;

            // Apply gravity if affected
            if (projectile.gravityAffected) {
                const gravity = GAME_CONSTANTS.PHYSICS.GRAVITY * projectile.gravityFactor;
                // Simple parabolic trajectory
                const flightProgress = age / projectile.lifetime;
                const heightFactor = Math.sin(flightProgress * Math.PI);
                moveY += gravity * heightFactor * deltaTime;
            }

            // Update position
            if (!projectile.currentX) {
                projectile.currentX = projectile.sourceX;
                projectile.currentY = projectile.sourceY;
            }

            projectile.currentX += moveX;
            projectile.currentY += moveY;

            // Check for collisions with entities
            if (shouldCheckCollisions) {
                this.checkProjectileCollisions(projectile, i);
            }

            // Check if out of bounds
            if (this.isOutOfBounds(projectile.currentX, projectile.currentY)) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkProjectileCollisions(projectile, projectileIndex) {
        const collisionRadius = GAME_CONSTANTS.PHYSICS.PROJECTILE_COLLISION_RADIUS + projectile.size;

        // Check collision with each entity
        for (const entity of this.entities) {
            // Skip if entity is not alive or is the source of the projectile
            if (!entity.alive || entity.id === projectile.sourceId) continue;

            // Skip friendly entities for damage projectiles and enemy entities for healing projectiles
            const isHealingProjectile = projectile.healing > 0;
            if ((isHealingProjectile && entity.side !== projectile.side) ||
                (!isHealingProjectile && entity.side === projectile.side)) {
                continue;
            }

            // Check distance
            const dist = distance(projectile.currentX, projectile.currentY, entity.x, entity.y);
            if (dist <= collisionRadius + entity.radius) {
                // Collision detected!

                // Apply damage or healing
                if (projectile.damage > 0) {
                    const source = this.getEntityById(projectile.sourceId);
                    entity.takeDamage(projectile.damage, source, this);

                    // Add hit effect
                    this.addEffect({
                        type: 'damage',
                        x: entity.x,
                        y: entity.y,
                        amount: projectile.damage,
                        duration: GAME_CONSTANTS.COMBAT.EFFECT_DURATION.DAMAGE
                    });
                } else if (projectile.healing > 0) {
                    // Apply healing
                    entity.health = Math.min(entity.maxHealth, entity.health + projectile.healing);

                    // Add heal effect
                    this.addEffect({
                        type: 'heal',
                        x: entity.x,
                        y: entity.y,
                        amount: projectile.healing,
                        duration: GAME_CONSTANTS.COMBAT.EFFECT_DURATION.DAMAGE
                    });
                }

                // Remove projectile unless it has penetration
                if (projectile.penetration <= 0) {
                    this.projectiles.splice(projectileIndex, 1);
                    return;
                } else {
                    projectile.penetration--;
                }
            }
        }
    }

    isOutOfBounds(x, y) {
        return x < 0 || x > this.bounds.width || y < 0 || y > this.bounds.height;
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid
        this.drawGrid();

        // Draw all entities
        for (const entity of this.entities) {
            if (entity.alive) {
                entity.draw(this.ctx);
            }
        }

        // Draw projectiles
        this.drawProjectiles();

        // Draw effects
        this.drawEffects();

        // Draw game over message if applicable
        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    drawProjectiles() {
        for (const projectile of this.projectiles) {
            if (!projectile.currentX || !projectile.currentY) continue;

            // Get projectile configuration
            const size = projectile.size || 5;
            const color = projectile.color || '#FFFFFF';

            // Draw projectile
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.currentX, projectile.currentY, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw trail if enabled
            if (projectile.trail) {
                const angle = getAngle(projectile.sourceX, projectile.sourceY,
                                      projectile.targetX, projectile.targetY);
                const trailLength = (projectile.trailLength || 3) * size;

                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = size / 2;
                this.ctx.globalAlpha = 0.7;
                this.ctx.beginPath();
                this.ctx.moveTo(projectile.currentX, projectile.currentY);
                this.ctx.lineTo(
                    projectile.currentX - Math.cos(angle) * trailLength,
                    projectile.currentY - Math.sin(angle) * trailLength
                );
                this.ctx.stroke();
                this.ctx.globalAlpha = 1.0;
            }
        }
    }

    addProjectile(projectileConfig) {
        this.projectiles.push(projectileConfig);
    }

    drawGrid() {
        const gridSize = 50;
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    drawEffects() {
        for (const effect of this.effects) {
            switch (effect.type) {
                case 'damage':
                    // Draw damage number
                    this.ctx.fillStyle = 'rgba(255, 0, 0, ' + (effect.duration * 2) + ')';
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('-' + Math.floor(effect.amount), effect.x, effect.y - 20 * (1 - effect.duration));
                    break;

                case 'heal':
                    // Draw heal number
                    this.ctx.fillStyle = 'rgba(0, 255, 0, ' + (effect.duration * 2) + ')';
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('+' + Math.floor(effect.amount), effect.x, effect.y - 20 * (1 - effect.duration));
                    break;

                case 'attack':
                    // Draw attack line
                    this.ctx.strokeStyle = 'rgba(255, 255, 0, ' + (effect.duration * 5) + ')';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(effect.sourceX, effect.sourceY);
                    this.ctx.lineTo(effect.targetX, effect.targetY);
                    this.ctx.stroke();
                    break;

                case 'projectile':
                    // Draw projectile
                    if (!effect.currentX || !effect.currentY) continue;

                    const projectileType = effect.attackType || 'melee';
                    const projectileConfig = GAME_CONSTANTS.VISUALS.PROJECTILE_TYPES[projectileType];
                    const size = projectileConfig.size || 5;

                    // Draw projectile
                    this.ctx.fillStyle = projectileConfig.color || '#FFFFFF';
                    this.ctx.beginPath();
                    this.ctx.arc(effect.currentX, effect.currentY, size, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Draw trail if enabled
                    if (projectileConfig.trail) {
                        const angle = getAngle(effect.sourceX, effect.sourceY, effect.targetX, effect.targetY);
                        const trailLength = size * 3;

                        this.ctx.strokeStyle = projectileConfig.color || '#FFFFFF';
                        this.ctx.lineWidth = size / 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(effect.currentX, effect.currentY);
                        this.ctx.lineTo(
                            effect.currentX - Math.cos(angle) * trailLength,
                            effect.currentY - Math.sin(angle) * trailLength
                        );
                        this.ctx.stroke();
                    }
                    break;

                case 'death':
                    // Draw death explosion
                    const radius = 30 * (1 - effect.duration);
                    this.ctx.fillStyle = 'rgba(255, 0, 0, ' + (effect.duration) + ')';
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 'spawn':
                    // Draw spawn effect
                    const spawnRadius = 20 * effect.duration;
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, ' + (effect.duration) + ')';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, spawnRadius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;

                case 'upgrade':
                    // Draw upgrade effect
                    const upgradeSize = 40 * (1 - effect.duration);
                    this.ctx.fillStyle = 'rgba(255, 215, 0, ' + (effect.duration) + ')';
                    this.ctx.beginPath();
                    this.ctx.moveTo(effect.x, effect.y - upgradeSize);
                    this.ctx.lineTo(effect.x + upgradeSize, effect.y);
                    this.ctx.lineTo(effect.x, effect.y + upgradeSize);
                    this.ctx.lineTo(effect.x - upgradeSize, effect.y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;

                case 'aoe':
                    // Draw AOE effect
                    this.ctx.strokeStyle = 'rgba(255, 100, 100, ' + (effect.duration) + ')';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    this.ctx.stroke();

                    this.ctx.fillStyle = 'rgba(255, 100, 100, ' + (effect.duration * 0.3) + ')';
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 'dodge':
                    // Draw dodge effect (quick movement blur)
                    this.ctx.fillStyle = 'rgba(255, 255, 255, ' + (effect.duration * 0.7) + ')';
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, 15, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Draw speed lines
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + (effect.duration * 0.5) + ')';
                    this.ctx.lineWidth = 2;
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const length = 10 + Math.random() * 15;
                        this.ctx.beginPath();
                        this.ctx.moveTo(effect.x, effect.y);
                        this.ctx.lineTo(
                            effect.x + Math.cos(angle) * length,
                            effect.y + Math.sin(angle) * length
                        );
                        this.ctx.stroke();
                    }
                    break;
            }
        }
    }

    drawGameOver() {
        const text = this.winner !== null ?
            `Game Over - ${this.winner === 0 ? 'Green' : 'Red'} Side Wins!` :
            'Game Over - Draw!';

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '24px Arial';
        this.ctx.fillText('Click anywhere to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    checkGameOver() {
        // Count bases for each side
        let greenBases = 0;
        let redBases = 0;

        for (const entity of this.entities) {
            if (entity.type === 'building' && entity.isBase && entity.alive) {
                if (entity.side === 0) {
                    greenBases++;
                } else {
                    redBases++;
                }
            }
        }

        // Game is over if either side has no bases
        if (greenBases === 0 || redBases === 0) {
            this.gameOver = true;
            if (greenBases === 0 && redBases === 0) {
                this.winner = null; // Draw
            } else if (greenBases === 0) {
                this.winner = 1; // Red wins
            } else {
                this.winner = 0; // Green wins
            }
        }
    }

    resetGame() {
        this.entities = [];
        this.effects = [];
        this.selectedEntity = null;
        this.resources = [
            { side: 0, gold: 500 },
            { side: 1, gold: 500 }
        ];
        this.gameOver = false;
        this.winner = null;

        this.createInitialBuildings();
    }

    addEntity(entity) {
        this.entities.push(entity);
        return entity;
    }

    removeEntity(id) {
        const index = this.entities.findIndex(e => e.id === id);
        if (index !== -1) {
            // If this was the selected entity, deselect it
            if (this.selectedEntity && this.selectedEntity.id === id) {
                this.selectedEntity = null;
            }

            this.entities.splice(index, 1);
            return true;
        }
        return false;
    }

    getEntityById(id) {
        return this.entities.find(e => e.id === id);
    }

    getEntitiesInRadius(x, y, radius) {
        return this.entities.filter(entity =>
            entity.alive && distance(x, y, entity.x, entity.y) <= radius
        );
    }

    getEntitiesAtPoint(x, y) {
        return this.entities.filter(entity =>
            entity.alive && distance(x, y, entity.x, entity.y) <= entity.radius
        );
    }

    selectEntity(entity) {
        // Deselect previous entity
        if (this.selectedEntity) {
            this.selectedEntity.selected = false;
        }

        // Select new entity
        if (entity) {
            entity.selected = true;
            this.selectedEntity = entity;
        } else {
            this.selectedEntity = null;
        }

        return this.selectedEntity;
    }

    addGold(side, amount) {
        const resource = this.resources.find(r => r.side === side);
        if (resource) {
            resource.gold += amount;
            return true;
        }
        return false;
    }

    getGold(side) {
        const resource = this.resources.find(r => r.side === side);
        return resource ? resource.gold : 0;
    }

    addEffect(effect) {
        this.effects.push(effect);
    }

    setGameSpeed(speed) {
        this.gameSpeed = clamp(speed, GAME_CONSTANTS.GAME_SPEED.MIN, GAME_CONSTANTS.GAME_SPEED.MAX);
    }

    togglePause() {
        this.paused = !this.paused;
    }
}
