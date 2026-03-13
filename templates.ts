import { Layout, RoomShape } from './types';

interface Template {
    name: string;
    description: string;
    layout: Layout;
}

// ===================================================================================
// ALLIANCE TEMPLATES
// ===================================================================================

const humanCottage: Layout = {
  floors: {
    1: {
      rooms: [
        { id: 'hc-1', shape: RoomShape.RECTANGLE, x: 100, y: 150, rotation: 0, sectorId: 'living' },
        { id: 'hc-2', shape: RoomShape.SQUARE_SMALL, x: 250, y: 175, rotation: 0, sectorId: 'kitchen' },
        { id: 'hc-3', shape: RoomShape.SQUARE_SMALL, x: 100, y: 100, rotation: 0, sectorId: 'bedroom' },
        { id: 'hc-4', shape: RoomShape.STAIRS_UP, x: 250, y: 100, rotation: 0 },
      ],
    },
    2: {
        rooms: [
            { id: 'hc-5', shape: RoomShape.SQUARE, x: 125, y: 100, rotation: 0, sectorId: 'attic' },
            { id: 'hc-6', shape: RoomShape.STAIRS_DOWN, x: 250, y: 100, rotation: 0 },
        ]
    }
  },
  sectors: {
    'living': { id: 'living', name: 'Living Area', color: '#8b4513', description: 'Main living space.' },
    'kitchen': { id: 'kitchen', name: 'Kitchen', color: '#555555', description: 'Cooking and dining.' },
    'bedroom': { id: 'bedroom', name: 'Bedroom', color: '#1a3c8c', description: 'Resting area.' },
    'attic': { id: 'attic', name: 'Attic', color: '#b08b00', description: 'Storage or extra room.' },
  },
};

const humanBlacksmith: Layout = {
    floors: {
        1: {
            rooms: [
                { id: 'hb-1', shape: RoomShape.LARGE_SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'forge' },
                { id: 'hb-2', shape: RoomShape.RECTANGLE, x: -50, y: 137.5, rotation: 0, sectorId: 'storefront' },
                { id: 'hb-3', shape: RoomShape.SQUARE, x: 150, y: 300, rotation: 0, sectorId: 'living' },
                { id: 'hb-4', shape: RoomShape.SQUARE_SMALL, x: 100, y: 325, rotation: 0, sectorId: 'storage' },
            ]
        }
    },
    sectors: {
        'forge': { id: 'forge', name: 'Forge & Anvil', color: '#8c1a1a', description: 'The main work area.'},
        'storefront': { id: 'storefront', name: 'Storefront', color: '#b08b00', description: 'Where customers browse wares.'},
        'living': { id: 'living', name: 'Living Quarters', color: '#1a3c8c', description: 'A small room for the smith.'},
        'storage': { id: 'storage', name: 'Material Storage', color: '#555555', description: 'Ingots, flux, and tools.'},
    }
};

const humanArcanum: Layout = {
    floors: {
        1: { rooms: [{ id: 'ha-1', shape: RoomShape.OCTAGONAL, x: 100, y: 100, rotation: 0, sectorId: 'entry' }, { id: 'ha-2', shape: RoomShape.STAIRS_UP, x: 125, y: 100, rotation: 0 }] },
        2: { rooms: [{ id: 'ha-3', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'library' }, { id: 'ha-4', shape: RoomShape.STAIRS_DOWN, x: 125, y: 150, rotation: 0 }, { id: 'ha-5', shape: RoomShape.STAIRS_UP, x: 125, y: 50, rotation: 0 }] },
        3: { rooms: [{ id: 'ha-6', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'study' }, { id: 'ha-7', shape: RoomShape.STAIRS_DOWN, x: 125, y: 50, rotation: 0 }, { id: 'ha-8', shape: RoomShape.STAIRS_UP, x: 75, y: 125, rotation: 90 }] },
        4: { rooms: [{ id: 'ha-9', shape: RoomShape.OCTAGONAL, x: 100, y: 100, rotation: 0, sectorId: 'observatory' }, { id: 'ha-10', shape: RoomShape.STAIRS_DOWN, x: 75, y: 125, rotation: 90 }] },
    },
    sectors: {
        'entry': { id: 'entry', name: 'Entrance Hall', color: '#1a3c8c', description: 'Ground floor reception.'},
        'library': { id: 'library', name: 'Library', color: '#8b4513', description: 'Shelves of ancient tomes.'},
        'study': { id: 'study', name: 'Enchanter\'s Study', color: '#5a2d91', description: 'A place for magical work.'},
        'observatory': { id: 'observatory', name: 'Observatory', color: '#1e828c', description: 'The highest point of the tower, for stargazing.'},
    }
};

const humanCastle: Layout = {
    floors: {
        1: { rooms: [
            { id: 'hcas-1', shape: RoomShape.LARGE_SQUARE, x: 100, y: 150, rotation: 0, sectorId: 'hall' },
            { id: 'hcas-2', shape: RoomShape.RECTANGLE_WIDE, x: 300, y: 187.5, rotation: 0, sectorId: 'throne' },
            { id: 'hcas-3', shape: RoomShape.SQUARE, x: -25, y: 200, rotation: 0, sectorId: 'kitchen' },
            { id: 'hcas-4', shape: RoomShape.RECTANGLE, x: 125, y: 350, rotation: 0, sectorId: 'storage' },
            { id: 'hcas-5', shape: RoomShape.STAIRS_UP, x: 100, y: 150, rotation: 0 },
        ]},
        2: { rooms: [
            { id: 'hcas-6', shape: RoomShape.LARGE_SQUARE, x: 100, y: 150, rotation: 0, sectorId: 'quarters' },
            { id: 'hcas-7', shape: RoomShape.RECTANGLE_WIDE, x: 300, y: 187.5, rotation: 0, sectorId: 'council' },
            { id: 'hcas-8', shape: RoomShape.STAIRS_DOWN, x: 100, y: 150, rotation: 0 },
            { id: 'hcas-9', shape: RoomShape.HALLWAY, x: 0, y: 125, rotation: 90, sectorId: 'rampart' },
            { id: 'hcas-10', shape: RoomShape.HALLWAY, x: 300, y: 125, rotation: 90, sectorId: 'rampart' },
        ]},
        3: { rooms: [
            { id: 'hcas-11', shape: RoomShape.SQUARE, x: -50, y: 50, rotation: 0, sectorId: 'tower' },
            { id: 'hcas-12', shape: RoomShape.SQUARE, x: 300, y: 50, rotation: 0, sectorId: 'tower' },
            { id: 'hcas-13', shape: RoomShape.SQUARE, x: -50, y: 300, rotation: 0, sectorId: 'tower' },
            { id: 'hcas-14', shape: RoomShape.SQUARE, x: 300, y: 300, rotation: 0, sectorId: 'tower' },
            { id: 'hcas-15', shape: RoomShape.HALLWAY, x: 50, y: 50, rotation: 0, sectorId: 'rampart' },
            { id: 'hcas-16', shape: RoomShape.HALLWAY, x: 50, y: 350, rotation: 0, sectorId: 'rampart' },
            { id: 'hcas-17', shape: RoomShape.HALLWAY, x: -50, y: 150, rotation: 90, sectorId: 'rampart' },
            { id: 'hcas-18', shape: RoomShape.HALLWAY, x: 350, y: 150, rotation: 90, sectorId: 'rampart' },
        ]}
    },
    sectors: {
        'hall': { id: 'hall', name: 'Great Hall', color: '#b08b00', description: 'Main feasting and meeting area.'},
        'throne': { id: 'throne', name: 'Throne Room', color: '#1a3c8c', description: 'The seat of power.'},
        'kitchen': { id: 'kitchen', name: 'Kitchen', color: '#8b4513', description: 'Prepares food for the castle.'},
        'storage': { id: 'storage', name: 'Storage', color: '#555555', description: 'Supplies and armory.'},
        'quarters': { id: 'quarters', name: 'Lord\'s Quarters', color: '#4b0082', description: 'Private chambers for the castle\'s lord.'},
        'council': { id: 'council', name: 'Council Room', color: '#8c1a1a', description: 'Where important decisions are made.'},
        'rampart': { id: 'rampart', name: 'Ramparts', color: '#555555', description: 'Defensive walkways.'},
        'tower': { id: 'tower', name: 'Guard Tower', color: '#555555', description: 'Watchtowers at the corners of the castle.'},
    }
}

const dwarvenForge: Layout = {
    floors: {
        1: { rooms: [
            { id: 'df-1', shape: RoomShape.LARGE_SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'forge' },
            { id: 'df-2', shape: RoomShape.RECTANGLE, x: 300, y: 137.5, rotation: 0, sectorId: 'storage' },
            { id: 'df-3', shape: RoomShape.SQUARE, x: 150, y: 300, rotation: 0, sectorId: 'workshop' },
            { id: 'df-4', shape: RoomShape.STAIRS_UP, x: 100, y: 100, rotation: 0 },
        ]},
        2: { rooms: [
            { id: 'df-5', shape: RoomShape.STAIRS_DOWN, x: 100, y: 100, rotation: 0 },
            { id: 'df-6', shape: RoomShape.RECTANGLE, x: 150, y: 100, rotation: 0, sectorId: 'living' },
            { id: 'df-7', shape: RoomShape.SQUARE, x: 150, y: 175, rotation: 0, sectorId: 'living' },
        ]}
    },
    sectors: {
        'forge': { id: 'forge', name: 'Great Forge', color: '#8c1a1a', description: 'Main forging area.'},
        'storage': { id: 'storage', name: 'Ore & Supplies', color: '#8b4513', description: 'Storage for materials.'},
        'workshop': { id: 'workshop', name: 'Workshop', color: '#555555', description: 'Fine metalworking.'},
        'living': { id: 'living', name: 'Living Quarters', color: '#1a3c8c', description: 'Above the forge heat.'},
    }
};

const dwarvenBunker: Layout = {
    floors: {
        1: { rooms: [{ id: 'db-1', shape: RoomShape.SQUARE_SMALL, x: 100, y: 100, rotation: 0, sectorId: 'entrance' }, { id: 'db-2', shape: RoomShape.STAIRS_DOWN, x: 100, y: 150, rotation: 0 }] },
        2: { rooms: [
            { id: 'db-3', shape: RoomShape.LARGE_SQUARE, x: 25, y: 50, rotation: 0, sectorId: 'hall' },
            { id: 'db-4', shape: RoomShape.RECTANGLE_LONG, x: 225, y: 87.5, rotation: 0, sectorId: 'barracks' },
            { id: 'db-5', shape: RoomShape.RECTANGLE_LONG, x: 225, y: 162.5, rotation: 0, sectorId: 'barracks' },
            { id: 'db-6', shape: RoomShape.STAIRS_UP, x: 75, y: 50, rotation: 0 },
            { id: 'db-7', shape: RoomShape.STAIRS_DOWN, x: 175, y: 50, rotation: 0 },
        ]},
        3: { rooms: [
            { id: 'db-8', shape: RoomShape.OCTAGONAL, x: 113, y: 150, rotation: 0, sectorId: 'command' },
            { id: 'db-9', shape: RoomShape.SQUARE, x: 25, y: 150, rotation: 0, sectorId: 'forge' },
            { id: 'db-10', shape: RoomShape.U_SHAPED, x: 213, y: 150, rotation: 0, sectorId: 'storage' },
            { id: 'db-11', shape: RoomShape.STAIRS_UP, x: 138, y: 50, rotation: 0 },
        ]}
    },
    sectors: {
        'entrance': { id: 'entrance', name: 'Surface Entrance', color: '#555555', description: 'The heavily fortified entrance to the bunker.'},
        'hall': { id: 'hall', name: 'Mess Hall', color: '#8b4513', description: 'Communal dining and meeting area.'},
        'barracks': { id: 'barracks', name: 'Barracks', color: '#1a3c8c', description: 'Sleeping quarters for the garrison.'},
        'command': { id: 'command', name: 'Command Center', color: '#b08b00', description: 'Strategic planning and communications.'},
        'forge': { id: 'forge', name: 'Emergency Forge', color: '#8c1a1a', description: 'For repairs and munitions.'},
        'storage': { id: 'storage', name: 'Deep Storage', color: '#555555', description: 'Long-term supplies and vault.'},
    }
};

const gnomishWorkshop: Layout = {
    floors: {
        1: { rooms: [
            { id: 'gw-1', shape: RoomShape.SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'main' },
            { id: 'gw-2', shape: RoomShape.SQUARE_SMALL, x: 200, y: 125, rotation: 0, sectorId: 'chem' },
            { id: 'gw-3', shape: RoomShape.SQUARE_SMALL, x: 50, y: 125, rotation: 0, sectorId: 'tinker' },
            { id: 'gw-4', shape: RoomShape.STAIRS_UP, x: 125, y: 200, rotation: 0 },
            { id: 'gw-5', shape: RoomShape.HALLWAY, x: 0, y: 200, rotation: 90, sectorId: 'storage' },
        ]},
        2: { rooms: [
            { id: 'gw-6', shape: RoomShape.STAIRS_DOWN, x: 125, y: 200, rotation: 0 },
            { id: 'gw-7', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'living' },
        ]}
    },
    sectors: {
        'main': { id: 'main', name: 'Main Workshop', color: '#b08b00', description: 'Primary work area.'},
        'chem': { id: 'chem', name: 'Alchemy Lab', color: '#266d3a', description: 'For... science!'},
        'tinker': { id: 'tinker', name: 'Tinkering Bench', color: '#de55a4', description: 'Small contraptions.'},
        'storage': { id: 'storage', name: 'Parts Storage', color: '#555555', description: 'Gears, sprockets, etc.'},
        'living': { id: 'living', name: 'Living Quarters', color: '#1e828c', description: 'Circular for efficiency!'},
    }
};

const gnomishHouse: Layout = {
    floors: {
        1: { rooms: [
            { id: 'gh-1', shape: RoomShape.SQUARE_SMALL, x: 125, y: 150, rotation: 0, sectorId: 'entry' },
            { id: 'gh-2', shape: RoomShape.L_SHAPED, x: 175, y: 100, rotation: 0, sectorId: 'workshop' },
            { id: 'gh-3', shape: RoomShape.STAIRS_UP, x: 75, y: 125, rotation: 0 },
        ]},
        2: { rooms: [
            { id: 'gh-4', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'living' },
            { id: 'gh-5', shape: RoomShape.SQUARE_SMALL, x: 200, y: 125, rotation: 0, sectorId: 'kitchen' },
            { id: 'gh-6', shape: RoomShape.STAIRS_DOWN, x: 50, y: 125, rotation: 0 },
            { id: 'gh-7', shape: RoomShape.STAIRS_UP, x: 125, y: 50, rotation: 0 },
        ]},
        3: { rooms: [
            { id: 'gh-8', shape: RoomShape.OCTAGONAL, x: 100, y: 100, rotation: 0, sectorId: 'bedroom' },
            { id: 'gh-9', shape: RoomShape.SQUARE_SMALL, x: 200, y: 125, rotation: 0, sectorId: 'balcony' },
            { id: 'gh-10', shape: RoomShape.STAIRS_DOWN, x: 125, y: 200, rotation: 0 },
        ]}
    },
    sectors: {
        'entry': { id: 'entry', name: 'Entrance', color: '#555555', description: 'The way in.'},
        'workshop': { id: 'workshop', name: 'Personal Workshop', color: '#b08b00', description: 'For personal projects.'},
        'living': { id: 'living', name: 'Living Area', color: '#1e828c', description: 'A cozy, round room.'},
        'kitchen': { id: 'kitchen', name: 'Kitchenette', color: '#8b4513', description: 'For cog-shaped cookies.'},
        'bedroom': { id: 'bedroom', name: 'Bedroom', color: '#de55a4', description: 'Sleeping chamber.'},
        'balcony': { id: 'balcony', name: 'Balcony', color: '#266d3a', description: 'For observing things.'},
    }
};

const elvenTower: Layout = {
    floors: {
        1: { rooms: [{ id: 'et-1', shape: RoomShape.OCTAGONAL, x: 100, y: 100, rotation: 0, sectorId: 'entry' }, { id: 'et-2', shape: RoomShape.STAIRS_UP, x: 125, y: 100, rotation: 0 }] },
        2: { rooms: [{ id: 'et-3', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'study' }, { id: 'et-4', shape: RoomShape.STAIRS_DOWN, x: 125, y: 150, rotation: 0 }, { id: 'et-5', shape: RoomShape.STAIRS_UP, x: 125, y: 50, rotation: 0 }] },
        3: { rooms: [{ id: 'et-6', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'study' }, { id: 'et-7', shape: RoomShape.STAIRS_DOWN, x: 125, y: 50, rotation: 0 }, { id: 'et-8', shape: RoomShape.STAIRS_UP, x: 75, y: 125, rotation: 90 }] },
        4: { rooms: [{ id: 'et-9', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'study' }, { id: 'et-10', shape: RoomShape.STAIRS_DOWN, x: 75, y: 125, rotation: 90 }, { id: 'et-11', shape: RoomShape.STAIRS_UP, x: 125, y: 150, rotation: 0 }] },
        5: { rooms: [{ id: 'et-12', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'study' }, { id: 'et-13', shape: RoomShape.STAIRS_DOWN, x: 125, y: 150, rotation: 0 }, { id: 'et-14', shape: RoomShape.STAIRS_UP, x: 75, y: 75, rotation: 0 }] },
        6: { rooms: [{ id: 'et-15', shape: RoomShape.OCTAGONAL, x: 100, y: 100, rotation: 0, sectorId: 'peak' }, { id: 'et-16', shape: RoomShape.STAIRS_DOWN, x: 75, y: 75, rotation: 0 }] },
    },
    sectors: {
        'entry': { id: 'entry', name: 'Tower Entrance', color: '#1a3c8c', description: 'The base of the spire.'},
        'study': { id: 'study', name: 'Meditation Chamber', color: '#4b0082', description: 'A quiet floor for contemplation.'},
        'peak': { id: 'peak', name: 'Spire Peak', color: '#b08b00', description: 'The highest point of the tower, open to the sky.'},
    }
};

const elvenLodge: Layout = {
    floors: {
        1: { rooms: [
            { id: 'el-1', shape: RoomShape.LARGE_SQUARE, x: 100, y: 100, rotation: 45, sectorId: 'hall' },
            { id: 'el-2', shape: RoomShape.STAIRS_UP, x: 280, y: 120, rotation: 45 },
        ]},
        2: { rooms: [
            { id: 'el-3', shape: RoomShape.SQUARE, x: 100, y: 100, rotation: 45, sectorId: 'quarters' },
            { id: 'el-4', shape: RoomShape.SQUARE, x: 241, y: 100, rotation: 45, sectorId: 'quarters' },
            { id: 'el-5', shape: RoomShape.HALLWAY, x: 171, y: 125, rotation: 45, sectorId: 'bridge' },
            { id: 'el-6', shape: RoomShape.STAIRS_DOWN, x: 282, y: 121, rotation: 45 },
            { id: 'el-7', shape: RoomShape.STAIRS_UP, x: 100, y: 121, rotation: 45 },
        ]},
        3: { rooms: [
            { id: 'el-8', shape: RoomShape.ROUND_ROOM, x: 50, y: 50, rotation: 0, sectorId: 'moonwell' },
            { id: 'el-9', shape: RoomShape.L_SHAPED, x: 150, y: 50, rotation: 0, sectorId: 'garden' },
            { id: 'el-10', shape: RoomShape.STAIRS_DOWN, x: 99, y: 121, rotation: 45 },
        ]}
    },
    sectors: {
        'hall': { id: 'hall', name: 'Grand Hall', color: '#266d3a', description: 'The main platform of the lodge.'},
        'quarters': { id: 'quarters', name: 'Living Quarters', color: '#1a3c8c', description: 'Private sleeping areas.'},
        'bridge': { id: 'bridge', name: 'Rope Bridge', color: '#8b4513', description: 'Connects the platforms.'},
        'moonwell': { id: 'moonwell', name: 'Moonwell Platform', color: '#1e828c', description: 'A serene, high platform.'},
        'garden': { id: 'garden', name: 'Hanging Garden', color: '#de55a4', description: 'A garden among the branches.'},
    }
};


// ===================================================================================
// HORDE TEMPLATES
// ===================================================================================

const orcBarracks: Layout = {
    floors: {
        1: { rooms: [
            { id: 'ob-1', shape: RoomShape.RECTANGLE_LONG, x: 100, y: 150, rotation: 0, sectorId: 'hall' },
            { id: 'ob-2', shape: RoomShape.SQUARE, x: 350, y: 137.5, rotation: 0, sectorId: 'armory' },
            { id: 'ob-3', shape: RoomShape.LARGE_SQUARE, x: -100, y: 87.5, rotation: 0, sectorId: 'bunks' },
            { id: 'ob-4', shape: RoomShape.SQUARE, x: 175, y: 225, rotation: 0, sectorId: 'kitchen' },
        ]}
    },
    sectors: {
        'hall': { id: 'hall', name: 'Mess Hall', color: '#8b4513', description: 'Eating and strategy.'},
        'armory': { id: 'armory', name: 'Armory', color: '#555555', description: 'Weapons and armor.'},
        'bunks': { id: 'bunks', name: 'Sleeping Bunks', color: '#8c1a1a', description: 'Warrior resting area.'},
        'kitchen': { id: 'kitchen', name: 'Kitchen', color: '#b08b00', description: 'Meat is on the menu.'},
    }
};

const trollVillageCenter: Layout = {
    floors: {
        1: { rooms: [
            { id: 'tvc-1', shape: RoomShape.OCTAGONAL, x: 150, y: 100, rotation: 0, sectorId: 'hall' },
            { id: 'tvc-2', shape: RoomShape.ROUND_ROOM, x: 250, y: 100, rotation: 0, sectorId: 'spirit' },
            { id: 'tvc-3', shape: RoomShape.SQUARE, x: 50, y: 100, rotation: 0, sectorId: 'alchemy' },
            { id: 'tvc-4', shape: RoomShape.RECTANGLE, x: 125, y: 200, rotation: 0, sectorId: 'storage' },
        ]}
    },
    sectors: {
        'hall': { id: 'hall', name: 'Central Hall', color: '#1e828c', description: 'The main gathering place.'},
        'spirit': { id: 'spirit', name: 'Spirit Hut', color: '#5a2d91', description: 'For communing with the Loa.'},
        'alchemy': { id: 'alchemy', name: 'Alchemy Hut', color: '#266d3a', description: 'Brewing powerful mojo.'},
        'storage': { id: 'storage', name: 'Supply Hut', color: '#8b4513', description: 'Storing juju and supplies.'},
    }
}

const taurenTent: Layout = {
    floors: {
        1: { rooms: [
            { id: 'tt-1', shape: RoomShape.OCTAGONAL, x: 100, y: 100, rotation: 0, sectorId: 'main' },
            { id: 'tt-2', shape: RoomShape.L_SHAPED, x: 200, y: 100, rotation: 0, sectorId: 'storage' },
        ]}
    },
    sectors: {
        'main': { id: 'main', name: 'Great Tent', color: '#8b4513', description: 'Communal living space.'},
        'storage': { id: 'storage', name: 'Storage', color: '#b08b00', description: 'Hides and supplies.'},
    }
};

const undeadCrypt: Layout = {
    floors: {
        1: { rooms: [
            { id: 'uc-1', shape: RoomShape.CROSS_SHAPED, x: 200, y: 200, rotation: 0, sectorId: 'main' },
            { id: 'uc-2', shape: RoomShape.HALLWAY, x: 225, y: 150, rotation: 0, sectorId: 'hall' },
            { id: 'uc-3', shape: RoomShape.SQUARE, x: 250, y: 50, rotation: 0, sectorId: 'tomb' },
            { id: 'uc-4', shape: RoomShape.HALLWAY, x: 350, y: 225, rotation: 90, sectorId: 'hall' },
            { id: 'uc-5', shape: RoomShape.SQUARE, x: 400, y: 250, rotation: 0, sectorId: 'tomb' },
            { id: 'uc-6', shape: RoomShape.HALLWAY, x: 50, y: 225, rotation: 90, sectorId: 'hall' },
            { id: 'uc-7', shape: RoomShape.SQUARE, x: 0, y: 250, rotation: 0, sectorId: 'tomb' },
        ]}
    },
    sectors: {
        'main': { id: 'main', name: 'Central Chamber', color: '#4b0082', description: 'Main crypt area.'},
        'hall': { id: 'hall', name: 'Corridor', color: '#555555', description: 'Connecting hallways.'},
        'tomb': { id: 'tomb', name: 'Burial Niche', color: '#266d3a', description: 'Final resting places.'},
    }
};

const undeadLaboratory: Layout = {
    floors: {
        1: { rooms: [{ id: 'ul-1', shape: RoomShape.SQUARE_SMALL, x: 100, y: 100, rotation: 0, sectorId: 'entrance' }, { id: 'ul-2', shape: RoomShape.STAIRS_DOWN, x: 100, y: 150, rotation: 0 }] },
        2: { rooms: [
            { id: 'ul-3', shape: RoomShape.CROSS_SHAPED, x: 150, y: 150, rotation: 0, sectorId: 'lab' },
            { id: 'ul-4', shape: RoomShape.RECTANGLE, x: 300, y: 187.5, rotation: 0, sectorId: 'storage' },
            { id: 'ul-5', shape: RoomShape.STAIRS_UP, x: 200, y: 100, rotation: 0 },
            { id: 'ul-6', shape: RoomShape.STAIRS_DOWN, x: 100, y: 200, rotation: 0 },
        ]},
        3: { rooms: [
            { id: 'ul-7', shape: RoomShape.U_SHAPED, x: 50, y: 150, rotation: 0, sectorId: 'holding' },
            { id: 'ul-8', shape: RoomShape.OCTAGONAL, x: 200, y: 150, rotation: 0, sectorId: 'chamber' },
            { id: 'ul-9', shape: RoomShape.SQUARE, x: 300, y: 150, rotation: 0, sectorId: 'quarters' },
            { id: 'ul-10', shape: RoomShape.STAIRS_UP, x: 150, y: 100, rotation: 0 },
        ]}
    },
    sectors: {
        'entrance': { id: 'entrance', name: 'Hidden Entrance', color: '#555555', description: 'A discreet entrance, likely in a mausoleum or abandoned cellar.'},
        'lab': { id: 'lab', name: 'Main Laboratory', color: '#266d3a', description: 'Alchemy tables, distillation apparatus, and bubbling concoctions.'},
        'storage': { id: 'storage', name: 'Reagent Storage', color: '#8b4513', description: 'Shelves of rare and volatile ingredients.'},
        'holding': { id: 'holding', name: 'Specimen Holding', color: '#8c1a1a', description: 'Cages and cells for experimental subjects.'},
        'chamber': { id: 'chamber', name: 'Necromancy Chamber', color: '#4b0082', description: 'A dark room with a summoning circle.'},
        'quarters': { id: 'quarters', name: 'Master\'s Quarters', color: '#1a3c8c', description: 'The personal chambers of the lab\'s master.'},
    }
};


// ===================================================================================
// NEUTRAL / GENERIC TEMPLATES
// ===================================================================================

const neutralInn: Layout = {
    floors: {
        1: { rooms: [
            { id: 'ni-1', shape: RoomShape.LARGE_SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'common' },
            { id: 'ni-2', shape: RoomShape.SQUARE, x: 300, y: 100, rotation: 0, sectorId: 'kitchen' },
            { id: 'ni-3', shape: RoomShape.STAIRS_UP, x: 100, y: 250, rotation: 0 },
        ]},
        2: { rooms: [
            { id: 'ni-4', shape: RoomShape.STAIRS_DOWN, x: 100, y: 250, rotation: 0 },
            { id: 'ni-5', shape: RoomShape.HALLWAY, x: 150, y: 262.5, rotation: 0, sectorId: 'hallway' },
            { id: 'ni-6', shape: RoomShape.SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'room' },
            { id: 'ni-7', shape: RoomShape.SQUARE, x: 200, y: 100, rotation: 0, sectorId: 'room' },
            { id: 'ni-8', shape: RoomShape.SQUARE, x: 100, y: 175, rotation: 0, sectorId: 'room' },
            { id: 'ni-9', shape: RoomShape.SQUARE, x: 200, y: 175, rotation: 0, sectorId: 'room' },
        ]}
    },
    sectors: {
        'common': { id: 'common', name: 'Common Room', color: '#8b4513', description: 'Main tavern area.'},
        'kitchen': { id: 'kitchen', name: 'Kitchen', color: '#555555', description: 'Food preparation.'},
        'room': { id: 'room', name: 'Guest Room', color: '#1a3c8c', description: 'Rooms for rent.'},
        'hallway': { id: 'hallway', name: 'Upstairs Hallway', color: '#555555', description: 'Connects the guest rooms.'},
    }
};

const sprawlingTavern: Layout = {
    floors: {
        1: { rooms: [
            { id: 'st-1', shape: RoomShape.LARGE_SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'cellar' },
            { id: 'st-2', shape: RoomShape.RECTANGLE, x: 300, y: 137.5, rotation: 0, sectorId: 'secret' },
            { id: 'st-3', shape: RoomShape.STAIRS_UP, x: 100, y: 100, rotation: 0 },
        ]},
        2: { rooms: [
            { id: 'st-4', shape: RoomShape.T_SHAPED, x: 125, y: 125, rotation: 0, sectorId: 'taproom' },
            { id: 'st-5', shape: RoomShape.LARGE_SQUARE, x: 275, y: 100, rotation: 0, sectorId: 'taproom' },
            { id: 'st-6', shape: RoomShape.SQUARE, x: 25, y: 150, rotation: 0, sectorId: 'kitchen' },
            { id: 'st-7', shape: RoomShape.STAIRS_DOWN, x: 175, y: 75, rotation: 0 },
            { id: 'st-8', shape: RoomShape.STAIRS_UP, x: 75, y: 250, rotation: 0 },
        ]},
        3: { rooms: [
            { id: 'st-9', shape: RoomShape.RECTANGLE_WIDE, x: 50, y: 100, rotation: 0, sectorId: 'owner' },
            { id: 'st-10', shape: RoomShape.SQUARE, x: 200, y: 112.5, rotation: 0, sectorId: 'room' },
            { id: 'st-11', shape: RoomShape.SQUARE, x: 200, y: 212.5, rotation: 0, sectorId: 'room' },
            { id: 'st-12', shape: RoomShape.STAIRS_DOWN, x: 25, y: 200, rotation: 0 },
        ]}
    },
    sectors: {
        'cellar': { id: 'cellar', name: 'Wine Cellar', color: '#4b0082', description: 'Storage for ale and wine barrels.'},
        'secret': { id: 'secret', name: 'Secret Cache', color: '#555555', description: 'A hidden room for valuable or illicit goods.'},
        'taproom': { id: 'taproom', name: 'Main Taproom', color: '#8b4513', description: 'The bustling heart of the tavern.'},
        'kitchen': { id: 'kitchen', name: 'Kitchen', color: '#8c1a1a', description: 'Where the meals are prepared.'},
        'owner': { id: 'owner', name: 'Owner\'s Quarters', color: '#1a3c8c', description: 'The private room for the tavern owner.'},
        'room': { id: 'room', name: 'Guest Room', color: '#1a3c8c', description: 'A simple room for travelers.'},
    }
}

const townHall: Layout = {
    floors: {
        1: { rooms: [
            { id: 'thall-1', shape: RoomShape.RECTANGLE_WIDE, x: 100, y: 100, rotation: 0, sectorId: 'main' },
            { id: 'thall-2', shape: RoomShape.SQUARE_SMALL, x: 250, y: 137.5, rotation: 0, sectorId: 'office' },
            { id: 'thall-3', shape: RoomShape.SQUARE_SMALL, x: 250, y: 187.5, rotation: 0, sectorId: 'office' },
            { id: 'thall-4', shape: RoomShape.STAIRS_UP, x: 100, y: 100, rotation: 0 },
        ]},
        2: { rooms: [
            { id: 'thall-5', shape: RoomShape.STAIRS_DOWN, x: 100, y: 100, rotation: 0 },
            { id: 'thall-6', shape: RoomShape.RECTANGLE_WIDE, x: 150, y: 100, rotation: 0, sectorId: 'council' },
            { id: 'thall-7', shape: RoomShape.SQUARE, x: 100, y: 225, rotation: 0, sectorId: 'records' },
        ]}
    },
    sectors: {
        'main': { id: 'main', name: 'Main Hall', color: '#b08b00', description: 'Public area.'},
        'office': { id: 'office', name: 'Clerk\'s Office', color: '#555555', description: 'Administrative work.'},
        'council': { id: 'council', name: 'Council Chamber', color: '#8c1a1a', description: 'Meeting room.'},
        'records': { id: 'records', name: 'Records Room', color: '#8b4513', description: 'Archives.'},
    }
};

const library: Layout = {
    floors: {
        1: { rooms: [
            { id: 'lib-1', shape: RoomShape.LARGE_SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'main' },
            { id: 'lib-2', shape: RoomShape.RECTANGLE, x: 300, y: 100, rotation: 0, sectorId: 'study' },
            { id: 'lib-3', shape: RoomShape.RECTANGLE, x: 300, y: 175, rotation: 0, sectorId: 'study' },
            { id: 'lib-4', shape: RoomShape.STAIRS_UP, x: 100, y: 100, rotation: 0 },
        ]},
        2: { rooms: [
            { id: 'lib-5', shape: RoomShape.STAIRS_DOWN, x: 100, y: 100, rotation: 0 },
            { id: 'lib-6', shape: RoomShape.U_SHAPED, x: 125, y: 150, rotation: 0, sectorId: 'stacks' },
            { id: 'lib-7', shape: RoomShape.SQUARE, x: 300, y: 150, rotation: 0, sectorId: 'rare' },
        ]}
    },
    sectors: {
        'main': { id: 'main', name: 'Grand Reading Room', color: '#1a3c8c', description: 'Main library floor.'},
        'study': { id: 'study', name: 'Study Carrel', color: '#8b4513', description: 'Quiet study rooms.'},
        'stacks': { id: 'stacks', name: 'Upper Stacks', color: '#555555', description: 'Book shelves.'},
        'rare': { id: 'rare', name: 'Rare Books', color: '#5a2d91', description: 'Special collections.'},
    }
};

const druidGrove: Layout = {
    floors: {
        1: { rooms: [
            { id: 'dg-1', shape: RoomShape.T_SHAPED, x: 125, y: 125, rotation: 180, sectorId: 'hub' },
            { id: 'dg-2', shape: RoomShape.ROUND_ROOM, x: 150, y: 25, rotation: 0, sectorId: 'moonwell' },
            { id: 'dg-3', shape: RoomShape.RECTANGLE, x: -25, y: 137.5, rotation: 0, sectorId: 'greenhouse' },
            { id: 'dg-4', shape: RoomShape.RECTANGLE, x: 275, y: 137.5, rotation: 0, sectorId: 'greenhouse' },
            { id: 'dg-5', shape: RoomShape.SQUARE, x: 150, y: 225, rotation: 0, sectorId: 'hut' },
        ]}
    },
    sectors: {
        'hub': { id: 'hub', name: 'Central Hub', color: '#8b4513', description: 'A central area connecting the different parts of the grove.'},
        'moonwell': { id: 'moonwell', name: 'Moonwell', color: '#1e828c', description: 'The serene, magical center of the grove.'},
        'greenhouse': { id: 'greenhouse', name: 'Greenhouse', color: '#266d3a', description: 'For growing rare and magical herbs.'},
        'hut': { id: 'hut', name: 'Healer\'s Hut', color: '#de55a4', description: 'A quiet place for rest and recovery.'},
    }
};

const druidTreeHouse: Layout = {
    floors: {
        1: { rooms: [{ id: 'dth-1', shape: RoomShape.ROUND_ROOM, x: 100, y: 100, rotation: 0, sectorId: 'trunk' }, { id: 'dth-2', shape: RoomShape.STAIRS_UP, x: 125, y: 100, rotation: 0 }] },
        2: { rooms: [
            { id: 'dth-3', shape: RoomShape.LARGE_SQUARE, x: 100, y: 100, rotation: 0, sectorId: 'bough' },
            { id: 'dth-4', shape: RoomShape.OCTAGONAL, x: 300, y: 150, rotation: 0, sectorId: 'platform' },
            { id: 'dth-5', shape: RoomShape.STAIRS_DOWN, x: 100, y: 150, rotation: 0 },
            { id: 'dth-6', shape: RoomShape.STAIRS_UP, x: 250, y: 100, rotation: 0 },
        ]},
        3: { rooms: [{ id: 'dth-7', shape: RoomShape.L_SHAPED, x: 150, y: 150, rotation: 0, sectorId: 'canopy' }, { id: 'dth-8', shape: RoomShape.STAIRS_DOWN, x: 200, y: 100, rotation: 0 }] },
    },
    sectors: {
        'trunk': { id: 'trunk', name: 'Lower Trunk', color: '#8b4513', description: 'The base of the great tree.'},
        'bough': { id: 'bough', name: 'Main Bough', color: '#266d3a', description: 'The primary living area, built on a sturdy bough.'},
        'platform': { id: 'platform', name: 'Side Platform', color: '#b08b00', description: 'A smaller platform for a specific purpose.'},
        'canopy': { id: 'canopy', name: 'Upper Canopy', color: '#1e828c', description: 'A high-up retreat among the leaves.'},
    }
};


export const TEMPLATES: Template[] = [
    // --- Alliance ---
    { name: 'Human: Cottage', description: 'A small, two-story home perfect for a quiet life in Elwynn Forest.', layout: humanCottage },
    { name: 'Human: Blacksmith', description: 'A functional layout featuring a forge, a storefront, and modest living quarters.', layout: humanBlacksmith },
    { name: 'Human: Arcanum Spire', description: 'A tall, slender tower for a mage, complete with a library, study, and rooftop observatory.', layout: humanArcanum },
    { name: 'Human: Small Castle', description: 'A formidable keep with a great hall, throne room, and defensive ramparts.', layout: humanCastle },
    { name: 'Dwarf: Mountain Forge', description: 'A sturdy, two-level structure with a grand forge below and living quarters above.', layout: dwarvenForge },
    { name: 'Dwarf: Underground Bunker', description: 'A secure, multi-level subterranean bunker with a mess hall, barracks, and command center.', layout: dwarvenBunker },
    { name: 'Gnome: Topsy-Turvy House', description: 'A quirky, multi-level house with oddly shaped rooms and a personal workshop.', layout: gnomishHouse },
    { name: 'Gnome: Grand Workshop', description: 'A chaotic workshop with multiple labs and a cozy, circular living space.', layout: gnomishWorkshop },
    { name: 'Night Elf: Elven Lodge', description: 'An elegant, multi-platform lodge built into the trees, connected by bridges.', layout: elvenLodge },
    { name: 'Night Elf: Mage Tower', description: 'A very tall and slender tower for meditation and study, reaching for the stars.', layout: elvenTower },
    
    // --- Horde ---
    { name: 'Orc: Grunt Barracks', description: 'A practical, single-floor barracks built for strength and efficiency, with a large mess hall.', layout: orcBarracks },
    { name: 'Troll: Village Center', description: 'A collection of connected huts for rituals, alchemy, and supplies, centered around a main hall.', layout: trollVillageCenter },
    { name: 'Tauren: Great Tent', description: 'A large, open-plan great tent for communal living, crafted from sturdy kodo hides.', layout: taurenTent },
    { name: 'Undead: Sprawling Crypt', description: 'A dark, single-level crypt with a central chamber and several burial niches.', layout: undeadCrypt },
    { name: 'Undead: Apothecary Lab', description: 'A multi-level underground laboratory for nefarious experiments, complete with holding cells.', layout: undeadLaboratory },
    
    // --- Neutral / Other ---
    { name: 'Druid: Healing Grove', description: 'An open, serene grove with a central moonwell, greenhouses, and a healer\'s hut.', layout: druidGrove },
    { name: 'Druid: Great Tree House', description: 'A massive home built into a great tree, featuring multiple levels from the trunk to the canopy.', layout: druidTreeHouse },
    { name: 'Generic: Crossroads Inn', description: 'A classic two-story inn with a common room, kitchen, and several guest rooms upstairs.', layout: neutralInn },
    { name: 'Generic: Sprawling Tavern', description: 'A large tavern with a huge taproom, a deep cellar for storing ale, and rooms for the owner and guests.', layout: sprawlingTavern },
    { name: 'Generic: Town Hall', description: 'A two-story municipal building with offices, a public hall, and a council chamber.', layout: townHall },
    { name: 'Generic: Grand Library', description: 'A large library with a grand reading room, study carrels, and an upper level for rare books.', layout: library },
];