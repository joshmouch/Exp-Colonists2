// Game constants and configuration

const GAME_CONSTANTS = {
    // Game speed settings
    GAME_SPEED: {
        DEFAULT: 1.0,
        MIN: 1.0,
        MAX: 20.0,
        STEP: 1.0
    },

    // Entity movement
    MOVEMENT: {
        MIN_DISTANCE: 5,
        COLLISION_RADIUS: 30, // Units will try to maintain this distance from each other
        ATTACK_STOP_DISTANCE: 0.9, // Stop at 90% of attack range
        DODGE_FACTOR: 0.3, // How much speed affects dodge chance (0-1)
        REACTION_TIME: 0.2, // Seconds it takes for a unit to react to an incoming projectile
        EVASION_SPEED_MULTIPLIER: 1.5 // Speed multiplier when evading
    },

    // Physics settings
    PHYSICS: {
        GRAVITY: 0.0, // No gravity by default (flat projectiles)
        FRICTION: 0.0, // No friction by default
        COLLISION_DETECTION_INTERVAL: 0.05, // Seconds between collision checks
        PROJECTILE_LIFETIME: 3.0, // Maximum seconds a projectile can exist
        PROJECTILE_COLLISION_RADIUS: 5 // Radius for projectile collision detection
    },

    // Combat settings
    COMBAT: {
        PROJECTILE_TYPES: {
            // Warrior projectiles (short range, fast, high damage)
            warrior: {
                speed: 400,
                size: 6,
                damage_multiplier: 1.0,
                gravity_affected: false,
                penetration: 0, // Can't hit multiple targets
                accuracy: 0.9, // Base accuracy (90%)
                lifetime: 0.5, // Short lifetime
                color: '#FFFFFF',
                trail: false,
                trail_length: 2
            },
            // Archer projectiles (long range, medium speed, medium damage)
            archer: {
                speed: 500,
                size: 4,
                damage_multiplier: 0.9,
                gravity_affected: true,
                gravity_factor: 0.1, // Slight arc
                penetration: 0,
                accuracy: 0.85,
                lifetime: 1.5,
                color: '#FFD700',
                trail: true,
                trail_length: 5
            },
            // Mage projectiles (medium range, slow, high damage)
            mage: {
                speed: 300,
                size: 8,
                damage_multiplier: 1.2,
                gravity_affected: false,
                penetration: 0,
                accuracy: 0.8,
                lifetime: 2.0,
                color: '#00BFFF',
                trail: true,
                trail_length: 8
            },
            // Healer projectiles (medium range, medium speed, healing)
            healer: {
                speed: 350,
                size: 7,
                healing_multiplier: 1.0,
                gravity_affected: false,
                penetration: 0,
                accuracy: 0.9,
                lifetime: 1.0,
                color: '#7CFC00', // Bright green
                trail: true,
                trail_length: 6
            },
            // Tower projectiles (long range, fast, medium damage)
            tower: {
                speed: 450,
                size: 5,
                damage_multiplier: 1.0,
                gravity_affected: false,
                penetration: 0,
                accuracy: 0.95,
                lifetime: 2.0,
                color: '#FF4500', // Orange-red
                trail: true,
                trail_length: 4
            }
        },

        MELEE_RANGE: 50,
        RANGED_MIN_RANGE: 80,

        // Unit type specific ranges
        ATTACK_RANGES: {
            warrior: 60,
            archer: 250,
            mage: 200,
            healer: 180,
            tower: 300
        },

        // Effect durations
        EFFECT_DURATION: {
            PROJECTILE: 0.5,
            DAMAGE: 0.8,
            ATTACK: 0.3,
            DEATH: 1.0,
            SPAWN: 0.8,
            UPGRADE: 1.2,
            AOE: 1.0,
            DODGE: 0.5
        }
    },

    // Production settings
    PRODUCTION: {
        BASE_PRODUCTION_RATE: 1000, // Base units per second
        GOLD_MINE_RATE: 10, // Gold per second
        BUILD_TIME: {
            warrior: 5,
            archer: 7,
            mage: 10,
            healer: 8
        }
    },

    // Resource generation
    RESOURCES: {
        GOLD_TICK_RATE: 1.0, // Seconds between gold generation
        STARTING_GOLD: 500
    },

    // AI settings
    AI: {
        UNIT_PREFERENCE: {
            0: ['archer', 'warrior', 'mage', 'healer'], // Green side unit preference
            1: ['archer', 'warrior', 'mage', 'healer']  // Red side unit preference
        },
        RETARGET_TIME: 2.0, // Seconds between AI target reconsideration
        BUILDING_SPACING: 100, // Minimum distance between buildings
        DODGE_INTELLIGENCE: 0.7, // How smart units are at dodging (0-1)
        FORMATION_SPACING: 40 // Space between units in formation
    }
};
