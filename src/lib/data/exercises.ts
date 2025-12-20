import type { WorkoutType } from '$lib/db/schema';

// ============================================
// Workout Rotation
// ============================================

export const WORKOUT_ROTATION: Record<number, { type: WorkoutType; label: string; focus: string }> = {
  1: { type: 'upper_push', label: 'Upper Push', focus: 'Chest, Shoulders, Triceps' },
  2: { type: 'lower', label: 'Lower', focus: 'Quads, Hamstrings, Glutes, Calves' },
  3: { type: 'upper_pull', label: 'Upper Pull', focus: 'Back, Biceps, Rear Delts' },
  4: { type: 'recovery', label: 'Active Recovery', focus: 'Mobility & Extended Cardio' },
  5: { type: 'upper_push', label: 'Upper Push', focus: 'Chest, Shoulders, Triceps' },
  6: { type: 'lower', label: 'Lower', focus: 'Quads, Hamstrings, Glutes, Calves' },
  0: { type: 'upper_pull', label: 'Upper Pull', focus: 'Back, Biceps, Rear Delts' }, // Sunday = 0
};

export function getWorkoutForDay(dayOfWeek: number): { type: WorkoutType; label: string; focus: string } {
  return WORKOUT_ROTATION[dayOfWeek];
}

// ============================================
// Exercise Definitions
// ============================================

export interface ExerciseInstructions {
  setup: string;
  execution: string[];
  formCues: string[];
  commonMistakes: string[];
  tips: string[];
}

export interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'isolation' | 'core' | 'mobility' | 'cardio';
  equipment: string[];
  defaultSets: number;
  defaultReps: string;
  starterWeight?: string; // Recommended starting weight for beginners
  musclesWorked: string[];
  instructions: ExerciseInstructions;
}

export const EXERCISES: Record<string, Exercise> = {
  // ============================================
  // UPPER PUSH EXERCISES
  // ============================================

  chest_press: {
    id: 'chest_press',
    name: 'Chest Press Machine',
    category: 'compound',
    equipment: ['Precor Chest Press'],
    defaultSets: 3,
    defaultReps: '10-12',
    starterWeight: '50-70 lbs',
    musclesWorked: ['Chest', 'Front Delts', 'Triceps'],
    instructions: {
      setup: 'Adjust the seat so the handles are at mid-chest height. Sit with your back flat against the pad, feet flat on the floor. Grip the handles with palms facing down.',
      execution: [
        'Take a breath and brace your core',
        'Push the handles forward until your arms are almost fully extended (don\'t lock elbows)',
        'Pause briefly at the top',
        'Slowly lower the weight back to the starting position',
        'Feel a stretch in your chest at the bottom before the next rep'
      ],
      formCues: [
        'Keep your shoulder blades squeezed together and pressed into the pad',
        'Don\'t let your shoulders roll forward at the top',
        'Maintain a slight arch in your lower back',
        'Control the weight - don\'t let it slam back'
      ],
      commonMistakes: [
        'Letting the shoulders come off the pad',
        'Flaring elbows out to 90 degrees (keep them at ~45 degrees)',
        'Using momentum instead of controlled movement',
        'Locking out elbows completely at the top'
      ],
      tips: [
        'START HERE: Try 50-70 lbs for your first session',
        'Exhale as you push, inhale as you lower',
        'The machine guides the path, so focus on the squeeze',
        'Add 10 lbs when you can do 3x12 with good form'
      ]
    }
  },

  pec_fly: {
    id: 'pec_fly',
    name: 'Pec Fly Machine',
    category: 'isolation',
    equipment: ['Precor Pec Fly'],
    defaultSets: 3,
    defaultReps: '12-15',
    starterWeight: '30-50 lbs',
    musclesWorked: ['Chest'],
    instructions: {
      setup: 'Adjust the seat height so the handles are at chest level. Sit with your back against the pad. Grip the handles with your elbows slightly bent.',
      execution: [
        'Start with arms wide, feeling a stretch across your chest',
        'Bring the handles together in front of your chest in a hugging motion',
        'Squeeze your chest hard at the center for a 1-second pause',
        'Slowly return to the starting position with control',
        'Don\'t let the weight stack touch between reps'
      ],
      formCues: [
        'Keep a slight bend in your elbows throughout',
        'Think about bringing your elbows together, not your hands',
        'Keep your back pressed into the pad',
        'Move through the full range of motion'
      ],
      commonMistakes: [
        'Using too much weight and shortening the range of motion',
        'Letting the weight pull your arms back too far (overstretching)',
        'Straightening the arms completely (turns it into a press)',
        'Rushing through the movement'
      ],
      tips: [
        'START HERE: Try 30-50 lbs - this is an isolation move, go light!',
        'Great as a finisher after pressing movements',
        'Imagine you\'re hugging a big tree',
        'Add 10 lbs when you can do 3x15 with a good squeeze'
      ]
    }
  },

  shoulder_press_cable: {
    id: 'shoulder_press_cable',
    name: 'Cable Shoulder Press',
    category: 'compound',
    equipment: ['Functional Trainer'],
    defaultSets: 3,
    defaultReps: '10-12',
    starterWeight: '15-25 lbs per side',
    musclesWorked: ['Shoulders', 'Triceps'],
    instructions: {
      setup: 'Set the cables to the lowest position. Grab a handle in each hand and bring them to shoulder height, palms facing forward. Stand with feet shoulder-width apart, core braced.',
      execution: [
        'Press both handles straight up overhead',
        'Extend your arms fully but don\'t lock out aggressively',
        'Pause briefly at the top',
        'Lower the handles back to shoulder height with control',
        'Keep constant tension - don\'t rest at the bottom'
      ],
      formCues: [
        'Keep your core tight to protect your lower back',
        'Don\'t arch your back excessively',
        'Press straight up, not forward',
        'Keep your head neutral (don\'t jut chin forward)'
      ],
      commonMistakes: [
        'Arching the lower back too much',
        'Pressing forward instead of straight up',
        'Using momentum by dipping the knees',
        'Not controlling the descent'
      ],
      tips: [
        'START HERE: Try 15-25 lbs per side',
        'Cables provide constant tension throughout the movement',
        'You can also do this seated on a bench for more stability',
        'Add 5 lbs per side when you can do 3x12 with good form'
      ]
    }
  },

  lateral_raise_cable: {
    id: 'lateral_raise_cable',
    name: 'Cable Lateral Raise',
    category: 'isolation',
    equipment: ['Functional Trainer'],
    defaultSets: 3,
    defaultReps: '12-15',
    starterWeight: '5-10 lbs',
    musclesWorked: ['Side Delts'],
    instructions: {
      setup: 'Set the cable to the lowest position. Stand sideways to the machine, grab the handle with your far hand (cable crosses in front of your body). Stand tall with a slight lean away from the machine.',
      execution: [
        'With a slight bend in your elbow, raise your arm out to the side',
        'Lift until your arm is parallel to the floor (or slightly above)',
        'Pause at the top and squeeze your shoulder',
        'Lower slowly back to the starting position',
        'Complete all reps on one side, then switch'
      ],
      formCues: [
        'Lead with your elbow, not your hand',
        'Keep the movement in the shoulder - don\'t swing your body',
        'Maintain a slight bend in the elbow throughout',
        'Think about pouring water out of a pitcher at the top'
      ],
      commonMistakes: [
        'Using too much weight and swinging the body',
        'Raising the arm too far forward (works front delt instead)',
        'Shrugging the shoulder up toward the ear',
        'Going too fast and using momentum'
      ],
      tips: [
        'START HERE: Try just 5-10 lbs - seriously, go light!',
        'Cables keep tension at the bottom where dumbbells don\'t',
        'Side delts are tiny muscles - ego check your weight',
        'Add 2.5 lbs when you can do 3x15 with perfect form'
      ]
    }
  },

  tricep_pushdown: {
    id: 'tricep_pushdown',
    name: 'Tricep Pushdown',
    category: 'isolation',
    equipment: ['Functional Trainer', 'Rope attachment'],
    defaultSets: 3,
    defaultReps: '12-15',
    starterWeight: '20-30 lbs',
    musclesWorked: ['Triceps'],
    instructions: {
      setup: 'Attach the rope to the high pulley. Stand facing the machine, grab the rope with both hands, palms facing each other. Pin your elbows to your sides.',
      execution: [
        'Push the rope down by extending your elbows',
        'At the bottom, spread the rope ends apart slightly',
        'Squeeze your triceps hard for a 1-second pause',
        'Slowly let the rope come back up to the starting position',
        'Keep your elbows pinned to your sides throughout'
      ],
      formCues: [
        'Only your forearms should move - elbows stay stationary',
        'Keep your chest up and shoulders back',
        'Don\'t lean forward excessively',
        'Control the weight on the way up (don\'t let it pull you)'
      ],
      commonMistakes: [
        'Letting the elbows drift forward',
        'Using body momentum by leaning into it',
        'Not fully extending at the bottom',
        'Rushing through reps'
      ],
      tips: [
        'START HERE: Try 20-30 lbs',
        'The rope allows for a natural wrist rotation at the bottom',
        'You can also use a straight bar for variety',
        'Add 5-10 lbs when you can do 3x15 with good form'
      ]
    }
  },

  // ============================================
  // LOWER BODY EXERCISES
  // ============================================

  leg_press: {
    id: 'leg_press',
    name: 'Leg Press Machine',
    category: 'compound',
    equipment: ['Precor Leg Press'],
    defaultSets: 3,
    defaultReps: '10-12',
    starterWeight: '90-140 lbs',
    musclesWorked: ['Quads', 'Glutes', 'Hamstrings'],
    instructions: {
      setup: 'Sit in the machine with your back flat against the pad. Place your feet shoulder-width apart on the platform, toes slightly pointed out. Release the safety handles.',
      execution: [
        'Slowly lower the platform by bending your knees',
        'Go down until your knees are at about 90 degrees',
        'Don\'t let your lower back round off the pad',
        'Push through your whole foot to press the weight back up',
        'Stop just short of locking out your knees at the top'
      ],
      formCues: [
        'Keep your lower back pressed into the pad',
        'Push through your heels, not just your toes',
        'Don\'t let your knees cave inward',
        'Control the descent - don\'t let gravity do the work'
      ],
      commonMistakes: [
        'Going too deep and letting the lower back round',
        'Locking out knees aggressively at the top',
        'Placing feet too high or too low on the platform',
        'Letting knees cave inward'
      ],
      tips: [
        'Foot placement matters: higher = more glutes/hamstrings, lower = more quads',
        'Start with a moderate weight to learn the movement',
        'This is one of the safest ways to train legs heavy'
      ]
    }
  },

  leg_extension: {
    id: 'leg_extension',
    name: 'Leg Extension Machine',
    category: 'isolation',
    equipment: ['Precor Leg Extension'],
    defaultSets: 3,
    defaultReps: '12-15',
    starterWeight: '30-50 lbs',
    musclesWorked: ['Quads'],
    instructions: {
      setup: 'Adjust the back pad so your knees align with the machine\'s pivot point. Adjust the ankle pad so it sits on your lower shins. Grip the handles.',
      execution: [
        'Extend your legs by straightening your knees',
        'Squeeze your quads hard at the top',
        'Hold the contraction for 1 second',
        'Lower the weight slowly and with control',
        'Stop just before the weight stack touches'
      ],
      formCues: [
        'Keep your back pressed into the pad',
        'Point your toes slightly up for more quad activation',
        'Focus on squeezing, not just moving weight',
        'Don\'t swing or use momentum'
      ],
      commonMistakes: [
        'Using too much weight and swinging',
        'Not fully extending at the top',
        'Letting the weight drop quickly',
        'Lifting your hips off the seat'
      ],
      tips: [
        'START HERE: Try 30-50 lbs - isolation moves need less weight',
        'Great isolation exercise for quad definition',
        'Can be done one leg at a time to address imbalances',
        'Add 10 lbs when you can do 3x15 with good form'
      ]
    }
  },

  leg_curl: {
    id: 'leg_curl',
    name: 'Leg Curl Machine',
    category: 'isolation',
    equipment: ['Precor Leg Curl'],
    defaultSets: 3,
    defaultReps: '12-15',
    starterWeight: '30-50 lbs',
    musclesWorked: ['Hamstrings'],
    instructions: {
      setup: 'Lie face down on the machine. Adjust so your knees are just off the edge of the pad. The ankle roller should sit just above your heels. Grip the handles.',
      execution: [
        'Curl your heels toward your glutes by bending your knees',
        'Squeeze your hamstrings hard at the top',
        'Hold for 1 second',
        'Slowly lower the weight back to the starting position',
        'Don\'t let the weight stack touch between reps'
      ],
      formCues: [
        'Keep your hips pressed into the pad',
        'Don\'t lift your hips as you curl',
        'Point your toes (plantar flex) for more hamstring activation',
        'Control the negative - this is where the muscle grows'
      ],
      commonMistakes: [
        'Lifting the hips to help curl the weight',
        'Using momentum instead of controlled movement',
        'Not going through full range of motion',
        'Letting the weight slam down'
      ],
      tips: [
        'START HERE: Try 30-50 lbs',
        'Hamstrings respond well to slow negatives',
        'Can also be done seated if your gym has that machine',
        'Add 10 lbs when you can do 3x15 with good form'
      ]
    }
  },

  calf_raise_leg_press: {
    id: 'calf_raise_leg_press',
    name: 'Calf Raises (on Leg Press)',
    category: 'isolation',
    equipment: ['Precor Leg Press'],
    defaultSets: 3,
    defaultReps: '15-20',
    starterWeight: '50-90 lbs',
    musclesWorked: ['Calves'],
    instructions: {
      setup: 'Sit in the leg press machine. Place just the balls of your feet on the lower edge of the platform, heels hanging off. Start with a lighter weight than you\'d use for leg press.',
      execution: [
        'Push through the balls of your feet to extend your ankles',
        'Rise up as high as you can onto your toes',
        'Squeeze your calves hard at the top',
        'Slowly lower your heels below the platform for a full stretch',
        'Pause at the bottom stretch before the next rep'
      ],
      formCues: [
        'Keep your legs nearly straight (slight bend is ok)',
        'Move only at the ankle - no knee bending',
        'Get a full stretch at the bottom, full squeeze at the top',
        'Control the movement in both directions'
      ],
      commonMistakes: [
        'Using too much weight and bouncing',
        'Not going through full range of motion',
        'Bending the knees to help lift the weight',
        'Going too fast'
      ],
      tips: [
        'START HERE: Try 50-90 lbs - calves can handle more weight',
        'Calves need high reps and full range of motion',
        'Pause at both the stretch and the squeeze',
        'Add 20 lbs when you can do 3x20 with good form'
      ]
    }
  },

  // ============================================
  // UPPER PULL EXERCISES
  // ============================================

  lat_pulldown: {
    id: 'lat_pulldown',
    name: 'Lat Pulldown Machine',
    category: 'compound',
    equipment: ['Precor Lat Pulldown'],
    defaultSets: 3,
    defaultReps: '10-12',
    starterWeight: '60-90 lbs',
    musclesWorked: ['Lats', 'Biceps', 'Rear Delts'],
    instructions: {
      setup: 'Adjust the thigh pad so you\'re locked in snugly. Grab the bar with a grip slightly wider than shoulder width, palms facing away from you.',
      execution: [
        'Lean back slightly (about 15-20 degrees)',
        'Pull the bar down to your upper chest, leading with your elbows',
        'Squeeze your shoulder blades together at the bottom',
        'Hold for 1 second',
        'Slowly let the bar return to the starting position with arms extended'
      ],
      formCues: [
        'Drive your elbows down and back, not just your hands',
        'Keep your chest up and proud',
        'Don\'t lean back excessively or swing',
        'Feel the stretch at the top of each rep'
      ],
      commonMistakes: [
        'Pulling the bar behind the head (shoulder injury risk)',
        'Leaning way back and using momentum',
        'Not going through full range of motion',
        'Gripping too wide or too narrow'
      ],
      tips: [
        'START HERE: Try 60-90 lbs',
        'Imagine pulling your elbows into your back pockets',
        'A closer grip works the lats differently and adds bicep work',
        'Add 10 lbs when you can do 3x12 with good form'
      ]
    }
  },

  seated_row: {
    id: 'seated_row',
    name: 'Seated Row Machine',
    category: 'compound',
    equipment: ['Precor Seated Row'],
    defaultSets: 3,
    defaultReps: '10-12',
    starterWeight: '50-80 lbs',
    musclesWorked: ['Lats', 'Rhomboids', 'Rear Delts', 'Biceps'],
    instructions: {
      setup: 'Sit with your chest against the pad (if applicable). Grab the handles. Start with arms extended and a slight stretch in your back.',
      execution: [
        'Pull the handles toward your torso by driving your elbows back',
        'Squeeze your shoulder blades together as you pull',
        'Pull until your elbows are behind your body',
        'Hold the contraction for 1 second',
        'Slowly extend your arms back to the starting position'
      ],
      formCues: [
        'Keep your chest up and against the pad',
        'Don\'t round your lower back',
        'Pull with your back, not just your arms',
        'Control the weight on the return'
      ],
      commonMistakes: [
        'Using momentum by swinging the torso',
        'Shrugging the shoulders up toward the ears',
        'Not fully extending the arms between reps',
        'Pulling too high (toward chest instead of stomach)'
      ],
      tips: [
        'START HERE: Try 50-80 lbs',
        'This works the "thickness" of your back',
        'Different grip attachments change the muscle emphasis',
        'Add 10 lbs when you can do 3x12 with good form'
      ]
    }
  },

  rear_delt_fly: {
    id: 'rear_delt_fly',
    name: 'Rear Delt Fly Machine',
    category: 'isolation',
    equipment: ['Precor Pec Fly (reversed)'],
    defaultSets: 3,
    defaultReps: '12-15',
    starterWeight: '20-40 lbs',
    musclesWorked: ['Rear Delts', 'Rhomboids'],
    instructions: {
      setup: 'Face the machine (opposite of pec fly). Adjust the handles so they\'re at shoulder height. Grip the handles with arms extended in front of you.',
      execution: [
        'Pull the handles outward and back in an arc',
        'Lead with your elbows, keeping a slight bend',
        'Squeeze your rear delts and upper back at the end',
        'Hold for 1 second',
        'Slowly return to the starting position'
      ],
      formCues: [
        'Keep your chest pressed against the pad',
        'Don\'t shrug your shoulders - keep them down',
        'Think about moving your elbows, not your hands',
        'Control the weight in both directions'
      ],
      commonMistakes: [
        'Using too much weight and shortening range of motion',
        'Pulling with the arms instead of the rear delts',
        'Letting the shoulders shrug up',
        'Swinging or using momentum'
      ],
      tips: [
        'START HERE: Try 20-40 lbs - rear delts are small muscles',
        'This is the same machine as pec fly, just facing the other way',
        'Great for posture and shoulder health',
        'Add 5-10 lbs when you can do 3x15 with good form'
      ]
    }
  },

  cable_bicep_curl: {
    id: 'cable_bicep_curl',
    name: 'Cable Bicep Curl',
    category: 'isolation',
    equipment: ['Functional Trainer', 'Straight bar or EZ bar attachment'],
    defaultSets: 3,
    defaultReps: '10-12',
    starterWeight: '20-35 lbs',
    musclesWorked: ['Biceps'],
    instructions: {
      setup: 'Attach a straight bar or EZ bar to the low pulley. Stand facing the machine, grab the bar with an underhand grip, arms extended down.',
      execution: [
        'Keeping your elbows pinned to your sides, curl the bar up',
        'Squeeze your biceps hard at the top',
        'Hold for 1 second',
        'Lower the bar back down with control',
        'Extend fully at the bottom before the next rep'
      ],
      formCues: [
        'Keep your elbows stationary - only your forearms move',
        'Don\'t swing your body or use momentum',
        'Stand tall with your chest up',
        'Control the negative (lowering) phase'
      ],
      commonMistakes: [
        'Swinging the body to lift the weight',
        'Letting the elbows drift forward',
        'Not fully extending at the bottom',
        'Going too heavy and cheating'
      ],
      tips: [
        'START HERE: Try 20-35 lbs',
        'Cable provides constant tension unlike dumbbells',
        'EZ bar is easier on the wrists',
        'Add 5 lbs when you can do 3x12 with good form'
      ]
    }
  },

  face_pull: {
    id: 'face_pull',
    name: 'Face Pull',
    category: 'isolation',
    equipment: ['Functional Trainer', 'Rope attachment'],
    defaultSets: 3,
    defaultReps: '15-20',
    starterWeight: '15-25 lbs',
    musclesWorked: ['Rear Delts', 'Rotator Cuff', 'Upper Back'],
    instructions: {
      setup: 'Set the cable to face height or slightly above. Attach the rope. Grab the rope with both hands, thumbs pointing back toward you.',
      execution: [
        'Step back to create tension in the cable',
        'Pull the rope toward your face, separating the ends as you pull',
        'Pull until your hands are beside your ears',
        'Squeeze your rear delts and upper back',
        'Slowly return to the starting position'
      ],
      formCues: [
        'Keep your elbows high throughout the movement',
        'Pull apart, not just back',
        'Imagine you\'re doing a double bicep pose at the end',
        'Don\'t let your body lean forward or back'
      ],
      commonMistakes: [
        'Setting the cable too low',
        'Not pulling the rope apart at the end',
        'Using too much weight and losing form',
        'Letting elbows drop below shoulder height'
      ],
      tips: [
        'START HERE: Try 15-25 lbs - go light!',
        'This is one of the best exercises for shoulder health',
        'High reps work well - this is about posture and balance',
        'Add 5 lbs when you can do 3x20 with good form'
      ]
    }
  },

  // ============================================
  // CORE EXERCISES
  // ============================================

  plank: {
    id: 'plank',
    name: 'Plank',
    category: 'core',
    equipment: ['Floor / Mat'],
    defaultSets: 2,
    defaultReps: '30-60 sec',
    musclesWorked: ['Core', 'Shoulders', 'Glutes'],
    instructions: {
      setup: 'Get on the floor on your forearms and toes. Elbows should be directly under your shoulders. Clasp your hands together or keep them flat.',
      execution: [
        'Lift your body off the ground, forming a straight line from head to heels',
        'Engage your core by pulling your belly button toward your spine',
        'Squeeze your glutes',
        'Hold this position for the target time',
        'Breathe steadily throughout'
      ],
      formCues: [
        'Keep your body in a straight line - no sagging or piking',
        'Look at the floor to keep your neck neutral',
        'Don\'t hold your breath',
        'Squeeze everything - core, glutes, quads'
      ],
      commonMistakes: [
        'Letting the hips sag toward the floor',
        'Piking the hips up too high',
        'Holding breath',
        'Looking up (strains the neck)'
      ],
      tips: [
        'Start with what you can hold with good form',
        'Build up time gradually - no shame in starting at 20 seconds',
        'If too hard, drop to knees but keep everything else the same'
      ]
    }
  },

  leg_raises: {
    id: 'leg_raises',
    name: 'Hanging Leg Raises',
    category: 'core',
    equipment: ['Captain\'s Chair'],
    defaultSets: 2,
    defaultReps: '10-15',
    musclesWorked: ['Lower Abs', 'Hip Flexors'],
    instructions: {
      setup: 'Position yourself in the Captain\'s Chair with your forearms on the pads. Let your legs hang straight down. Press your back against the back pad.',
      execution: [
        'Keeping your legs straight (or with a slight bend), raise them in front of you',
        'Lift until your thighs are parallel to the floor or higher',
        'Pause and squeeze your abs at the top',
        'Lower your legs slowly with control',
        'Don\'t swing into the next rep'
      ],
      formCues: [
        'Don\'t swing - use controlled movements',
        'Press your back into the pad',
        'Think about curling your pelvis up, not just lifting legs',
        'Keep your shoulders down, not shrugged up'
      ],
      commonMistakes: [
        'Using momentum and swinging',
        'Only lifting the legs without engaging the abs',
        'Dropping the legs too fast',
        'Shrugging shoulders up toward ears'
      ],
      tips: [
        'Bent knees makes this easier if straight legs are too hard',
        'Focus on the "crunch" at the top - posterior pelvic tilt',
        'Quality over quantity'
      ]
    }
  },

  bicycle_crunches: {
    id: 'bicycle_crunches',
    name: 'Bicycle Crunches',
    category: 'core',
    equipment: ['Floor / Mat'],
    defaultSets: 2,
    defaultReps: '15-20 each side',
    musclesWorked: ['Abs', 'Obliques'],
    instructions: {
      setup: 'Lie on your back with hands behind your head (don\'t clasp). Lift your shoulders off the ground. Bring your knees up to 90 degrees.',
      execution: [
        'Extend your right leg out straight while bringing your left knee toward your chest',
        'Rotate your torso to bring your right elbow toward your left knee',
        'Switch sides - extend left leg, bring right knee in, left elbow toward right knee',
        'Continue alternating in a pedaling motion',
        'Keep your shoulders off the ground throughout'
      ],
      formCues: [
        'Rotate through your torso, not just your elbows',
        'Keep your lower back pressed into the floor',
        'Don\'t pull on your neck with your hands',
        'Move slowly and deliberately'
      ],
      commonMistakes: [
        'Pulling on the neck',
        'Moving too fast without control',
        'Not fully extending the straight leg',
        'Dropping shoulders to the ground between reps'
      ],
      tips: [
        'Slow is better than fast for this exercise',
        'Really try to touch elbow to opposite knee',
        'Great for hitting the obliques'
      ]
    }
  },

  // ============================================
  // MOBILITY EXERCISES
  // ============================================

  hip_flexor_stretch: {
    id: 'hip_flexor_stretch',
    name: 'Hip Flexor Stretch',
    category: 'mobility',
    equipment: ['Floor / Mat'],
    defaultSets: 1,
    defaultReps: '30 sec each side',
    musclesWorked: ['Hip Flexors', 'Quads'],
    instructions: {
      setup: 'Kneel on one knee with the other foot flat on the floor in front of you (like a lunge position). Keep your torso upright.',
      execution: [
        'Tuck your tailbone under slightly (posterior pelvic tilt)',
        'Shift your weight forward slightly while keeping your torso upright',
        'You should feel a stretch in the front of your back hip',
        'Hold for 30 seconds, breathing deeply',
        'Switch sides and repeat'
      ],
      formCues: [
        'Keep your torso upright - don\'t lean forward',
        'The pelvic tilt is key - tuck your tailbone',
        'Keep your core engaged',
        'Breathe into the stretch'
      ],
      commonMistakes: [
        'Leaning the torso forward (reduces the stretch)',
        'Not tucking the tailbone (missing the stretch)',
        'Holding breath',
        'Rushing through it'
      ],
      tips: [
        'This is crucial if you sit a lot during the day',
        'You can raise your back arm overhead for a deeper stretch',
        'Do this daily, not just on workout days'
      ]
    }
  },

  hamstring_stretch: {
    id: 'hamstring_stretch',
    name: 'Hamstring Stretch',
    category: 'mobility',
    equipment: ['Floor / Mat'],
    defaultSets: 1,
    defaultReps: '30 sec each leg',
    musclesWorked: ['Hamstrings'],
    instructions: {
      setup: 'Sit on the floor with one leg extended and the other bent with foot against your inner thigh.',
      execution: [
        'Keeping your back straight, hinge forward at the hips',
        'Reach toward your toes on the extended leg',
        'Go until you feel a stretch in the back of your thigh',
        'Hold for 30 seconds',
        'Switch legs and repeat'
      ],
      formCues: [
        'Hinge at the hips, don\'t round your back',
        'Keep the extended leg straight',
        'Flex your foot (toes toward you) for more stretch',
        'Breathe and relax into it'
      ],
      commonMistakes: [
        'Rounding the back to reach further',
        'Bending the extended knee',
        'Bouncing instead of holding',
        'Holding breath'
      ],
      tips: [
        'It\'s not about touching your toes - it\'s about feeling the stretch',
        'A strap or towel around your foot can help if you\'re not flexible',
        'Consistent stretching over time improves flexibility'
      ]
    }
  },

  doorway_pec_stretch: {
    id: 'doorway_pec_stretch',
    name: 'Doorway Pec Stretch',
    category: 'mobility',
    equipment: ['Doorway'],
    defaultSets: 1,
    defaultReps: '30 sec each side',
    musclesWorked: ['Chest', 'Front Delts'],
    instructions: {
      setup: 'Stand in a doorway. Place your forearm against the door frame with your elbow at shoulder height, bent at 90 degrees.',
      execution: [
        'Step forward with the foot on the same side as the stretched arm',
        'Rotate your torso slightly away from the arm',
        'You should feel a stretch across your chest and front shoulder',
        'Hold for 30 seconds',
        'Switch sides and repeat'
      ],
      formCues: [
        'Keep your elbow at shoulder height',
        'Don\'t shrug your shoulder up',
        'Step through gently - don\'t force it',
        'Breathe into the stretch'
      ],
      commonMistakes: [
        'Elbow too high or too low',
        'Forcing the stretch too aggressively',
        'Shrugging the shoulder',
        'Not rotating the torso away enough'
      ],
      tips: [
        'Great for counteracting desk posture',
        'You can change the elbow angle to hit different parts of the pec',
        'Do this multiple times per day if you work at a desk'
      ]
    }
  },

  cat_cow: {
    id: 'cat_cow',
    name: 'Cat-Cow Stretch',
    category: 'mobility',
    equipment: ['Floor / Mat'],
    defaultSets: 1,
    defaultReps: '10 slow cycles',
    musclesWorked: ['Spine', 'Core', 'Back'],
    instructions: {
      setup: 'Get on all fours with hands under shoulders and knees under hips. Start with a neutral spine.',
      execution: [
        'COW: Drop your belly toward the floor, lift your head and tailbone, arch your back',
        'Hold for a breath',
        'CAT: Round your spine toward the ceiling, tuck your chin, tuck your tailbone',
        'Hold for a breath',
        'Flow between these two positions slowly'
      ],
      formCues: [
        'Move through your entire spine, not just lower back',
        'Coordinate movement with your breath - inhale for cow, exhale for cat',
        'Don\'t rush - feel each vertebra move',
        'Keep your arms straight throughout'
      ],
      commonMistakes: [
        'Moving too fast',
        'Only moving the lower back',
        'Holding breath',
        'Collapsing the arms'
      ],
      tips: [
        'Great warm-up for the spine',
        'Also great first thing in the morning',
        'Increases spinal mobility and body awareness'
      ]
    }
  },

  figure_four_stretch: {
    id: 'figure_four_stretch',
    name: 'Figure-4 Stretch',
    category: 'mobility',
    equipment: ['Floor / Mat'],
    defaultSets: 1,
    defaultReps: '30 sec each side',
    musclesWorked: ['Glutes', 'Piriformis', 'Hip External Rotators'],
    instructions: {
      setup: 'Lie on your back with knees bent, feet flat on the floor.',
      execution: [
        'Cross your right ankle over your left knee (making a "4" shape)',
        'Lift your left foot off the floor',
        'Reach through and grab your left thigh (or shin)',
        'Pull your left leg toward your chest',
        'Hold for 30 seconds, then switch sides'
      ],
      formCues: [
        'Keep your head and shoulders on the floor',
        'Flex the foot of the crossed leg',
        'Use your elbow to gently push your crossed knee away',
        'Breathe and relax into it'
      ],
      commonMistakes: [
        'Lifting head and shoulders off the floor',
        'Not flexing the crossed foot',
        'Forcing the stretch too hard',
        'Holding breath'
      ],
      tips: [
        'Great for tight hips and glutes from sitting',
        'Also helps with lower back tension',
        'Can be done seated in a chair too'
      ]
    }
  },

  // ============================================
  // CARDIO
  // ============================================

  walking: {
    id: 'walking',
    name: 'Incline Treadmill Walking',
    category: 'cardio',
    equipment: ['Treadmill'],
    defaultSets: 1,
    defaultReps: '25 min',
    musclesWorked: ['Legs', 'Cardiovascular System'],
    instructions: {
      setup: 'Set treadmill to 5% incline. Set speed to a comfortable walking pace (3.5-3.8 mph).',
      execution: [
        'Start walking at your target pace',
        'Maintain good posture - chest up, shoulders back',
        'Swing your arms naturally',
        'Breathe steadily',
        'Complete your target duration'
      ],
      formCues: [
        'Don\'t hold onto the handrails (reduces calorie burn)',
        'Keep your core engaged',
        'Look forward, not down at your feet',
        'Land heel-to-toe naturally'
      ],
      commonMistakes: [
        'Holding the handrails',
        'Hunching forward',
        'Looking down at phone the whole time',
        'Setting incline too high before building up'
      ],
      tips: [
        'Incline walking is easier on joints than running',
        'Great for fat burning and cardiovascular health',
        'Build up the incline gradually over weeks'
      ]
    }
  }
};

// ============================================
// Workout Templates
// ============================================

export const WORKOUT_TEMPLATES: Record<WorkoutType, string[]> = {
  upper_push: ['chest_press', 'pec_fly', 'shoulder_press_cable', 'lateral_raise_cable', 'tricep_pushdown'],
  lower: ['leg_press', 'leg_extension', 'leg_curl', 'calf_raise_leg_press'],
  upper_pull: ['lat_pulldown', 'seated_row', 'rear_delt_fly', 'cable_bicep_curl', 'face_pull'],
  recovery: [] // Only "Always Do" stack on recovery days
};

// ============================================
// Always-Do Stack
// ============================================

export interface AlwaysDoItem {
  id: string;
  name: string;
  category: 'cardio' | 'core' | 'mobility';
  duration?: string;
  reps?: string;
  sets?: number;
}

export const ALWAYS_DO_STACK: AlwaysDoItem[] = [
  // Cardio
  { id: 'walking', name: 'Incline Walking', category: 'cardio', duration: '25 min' },

  // Core
  { id: 'plank', name: 'Plank', category: 'core', duration: '30-60 sec', sets: 2 },
  { id: 'leg_raises', name: 'Leg Raises', category: 'core', reps: '10-15', sets: 2 },
  { id: 'bicycle_crunches', name: 'Bicycle Crunches', category: 'core', reps: '15-20 each side', sets: 2 },

  // Mobility
  { id: 'hip_flexor_stretch', name: 'Hip Flexor Stretch', category: 'mobility', duration: '30 sec each side' },
  { id: 'hamstring_stretch', name: 'Hamstring Stretch', category: 'mobility', duration: '30 sec each leg' },
  { id: 'doorway_pec_stretch', name: 'Doorway Pec Stretch', category: 'mobility', duration: '30 sec each side' },
  { id: 'cat_cow', name: 'Cat-Cow', category: 'mobility', reps: '10 slow cycles' },
  { id: 'figure_four_stretch', name: 'Figure-4 Stretch', category: 'mobility', duration: '30 sec each side' }
];

export function getExercisesForWorkout(workoutType: WorkoutType): Exercise[] {
  const exerciseIds = WORKOUT_TEMPLATES[workoutType];
  return exerciseIds.map(id => EXERCISES[id]).filter(Boolean);
}

export function getAlwaysDoByCategory(): Record<string, AlwaysDoItem[]> {
  return {
    cardio: ALWAYS_DO_STACK.filter(item => item.category === 'cardio'),
    core: ALWAYS_DO_STACK.filter(item => item.category === 'core'),
    mobility: ALWAYS_DO_STACK.filter(item => item.category === 'mobility')
  };
}
