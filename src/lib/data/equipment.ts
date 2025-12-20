// Equipment photo mappings
// Maps equipment names used in exercises to their photos

export interface EquipmentInfo {
  name: string;
  photo: string; // Path relative to /static/equipment/
  aliases?: string[]; // Other names that should match this equipment
}

export const EQUIPMENT: EquipmentInfo[] = [
  // Cardio
  {
    name: 'Treadmill',
    photo: 'treadmills.jpg',
    aliases: ['Precor Treadmill', 'treadmill']
  },
  {
    name: 'Peloton Bike',
    photo: 'peloton-bikes.jpg',
    aliases: ['Peloton', 'stationary bike']
  },
  {
    name: 'StairMaster',
    photo: 'stairmaster.jpg',
    aliases: ['stair climber', 'stepper']
  },
  {
    name: 'Elliptical',
    photo: 'ellipticals.jpg',
    aliases: ['Precor Elliptical', 'elliptical machine']
  },
  {
    name: 'Assault AirRunner',
    photo: 'assault-runner.jpg',
    aliases: ['AirRunner', 'curved treadmill', 'manual treadmill']
  },

  // Strength Machines - Lower Body
  {
    name: 'Precor Seated Leg Press',
    photo: 'leg-press-machine.jpg',
    aliases: ['Leg Press Machine', 'Leg Press', 'Precor Leg Press']
  },
  {
    name: 'Precor Leg Extension / Leg Curl',
    photo: 'leg-extension-curl-machine.jpg',
    aliases: [
      'Leg Extension Machine',
      'Leg Extension',
      'Precor Leg Extension',
      'Leg Curl Machine',
      'Seated Leg Curl',
      'Precor Leg Curl',
      'Precor Seated Leg Curl'
    ]
  },

  // Strength Machines - Upper Body
  {
    name: 'Precor Chest Press',
    photo: 'chest-press-machine.jpg',
    aliases: ['Chest Press Machine', 'Chest Press']
  },
  {
    name: 'Precor Lat Pulldown',
    photo: 'lat-pulldown-machine.jpg',
    aliases: ['Lat Pulldown Machine', 'Lat Pulldown']
  },
  {
    name: 'Functional Trainer (Cable Machine)',
    photo: 'cable-machine.jpg',
    aliases: ['Functional Trainer', 'Cable Machine', 'FTS', 'Precor FTS', 'cables']
  },
  {
    name: 'Assisted Pull-up/Dip Machine',
    photo: 'assisted-pullup-machine.jpg',
    aliases: ['Assisted Pull-up Machine', 'Assisted Dip Machine', 'Gravitron']
  },

  // Free Weights
  {
    name: 'Adjustable Bench',
    photo: 'adjustable-bench.jpg',
    aliases: ['Weight Bench', 'Incline Bench', 'Bench']
  },
  {
    name: 'Flat Bench',
    photo: 'flat-bench-plates.jpg',
    aliases: ['Flat Weight Bench']
  },
  {
    name: 'Power Rack',
    photo: 'power-rack-platform.jpg',
    aliases: ['Squat Rack', 'Power Cage', 'Lifting Platform']
  },
  {
    name: 'Half Rack',
    photo: 'half-rack.jpg',
    aliases: ['Half Cage']
  },
  {
    name: 'Fixed Barbells',
    photo: 'barbell-rack.jpg',
    aliases: ['Barbell Rack', 'Pre-weighted Barbells']
  },
  {
    name: 'Dumbbells',
    photo: 'dumbbell-racks.jpg',
    aliases: ['Dumbbell Rack', 'Hex Dumbbells', 'dumbbell']
  },

  // Bodyweight & Accessories
  {
    name: "Captain's Chair",
    photo: 'captain-chair.jpg',
    aliases: ['Vertical Knee Raise', 'VKR', 'Leg Raise Station']
  },
  {
    name: 'Kettlebells',
    photo: 'kettlebells-medballs.jpg',
    aliases: ['Kettlebell', 'Medicine Balls', 'Med Balls', 'Slam Balls']
  },

  // Generic/Fallback
  {
    name: 'Floor / Mat',
    photo: '', // No photo needed
    aliases: ['Floor', 'Mat', 'Exercise Mat', 'Yoga Mat']
  },
  {
    name: 'Doorway',
    photo: '', // No photo needed
    aliases: ['Door Frame']
  }
];

// Build a map for quick lookup
const equipmentMap = new Map<string, EquipmentInfo>();
EQUIPMENT.forEach(item => {
  equipmentMap.set(item.name.toLowerCase(), item);
  item.aliases?.forEach(alias => {
    equipmentMap.set(alias.toLowerCase(), item);
  });
});

export function getEquipmentInfo(name: string): EquipmentInfo | undefined {
  return equipmentMap.get(name.toLowerCase());
}

export function getEquipmentPhoto(name: string): string | undefined {
  const info = getEquipmentInfo(name);
  if (info?.photo) {
    return `/equipment/${info.photo}`;
  }
  return undefined;
}
