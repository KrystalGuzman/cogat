/* Verbal battery: Verbal Analogies, Sentence Completion, Verbal Classification. */
(function (root) {
  'use strict';
  var bank = root.CogatBank = root.CogatBank || { items: [], subtests: {} };

  function subtest(meta) { bank.subtests[meta.id] = meta; }
  function add(items) { bank.items.push.apply(bank.items, items); }

  subtest({
    id: 'verbal-analogies',
    battery: 'verbal',
    name: 'Verbal Analogies',
    blurb: 'Work out how the first pair of words is related, then apply the same relationship to the second pair.',
    directions: 'The first two words go together in a certain way. Choose the word that goes with the third word in the same way.',
    timePerItemSec: 40,
    strategy: [
      'Say the relationship out loud as a sentence: "A cub is a young bear."',
      'Keep the direction of the sentence the same when you plug in the third word.',
      'If two answers both fit, make the sentence more specific until only one survives.'
    ]
  });

  add([
    {
      id: 'va-01', battery: 'verbal', subtest: 'verbal-analogies', b: -1.4,
      stem: { kind: 'analogy', pairs: [['cub', 'bear'], ['puppy', '?']] },
      choices: ['kennel', 'dog', 'kitten', 'bark', 'tail'],
      answer: 1,
      hint: 'What kind of animal grows up from each young animal?',
      walkthrough: [
        { title: 'Name the relationship', text: 'A cub is the young form of a bear. The sentence is "a cub grows up to be a bear."' },
        { title: 'Keep the direction', text: 'Young animal first, adult animal second. So we need "a puppy grows up to be a ___."' },
        { title: 'Apply it', text: 'A puppy grows up to be a dog.' }
      ],
      why: {
        0: 'A kennel is where a dog lives, not what a puppy becomes.',
        2: 'A kitten is a different young animal, not the adult form of a puppy.',
        3: 'Barking is something a dog does.',
        4: 'A tail is a body part, not a life stage.'
      }
    },
    {
      id: 'va-02', battery: 'verbal', subtest: 'verbal-analogies', b: -0.8,
      stem: { kind: 'analogy', pairs: [['petal', 'flower'], ['page', '?']] },
      choices: ['library', 'read', 'book', 'cover', 'author'],
      answer: 2,
      hint: 'One of these words names a small piece of the other.',
      walkthrough: [
        { title: 'Name the relationship', text: 'A petal is one part of a flower — a part-to-whole pair.' },
        { title: 'Keep the direction', text: 'Part first, whole second. So: "a page is part of a ___."' },
        { title: 'Apply it', text: 'A page is one part of a book.' }
      ],
      why: {
        0: 'A library holds many books; it is the whole for "book", one step too far.',
        1: 'Reading is an action done with a page, not the whole it belongs to.',
        3: 'A cover is another part, so it sits at the same level as "page".',
        4: 'An author makes the book but is not the whole a page belongs to.'
      }
    },
    {
      id: 'va-03', battery: 'verbal', subtest: 'verbal-analogies', b: -0.5,
      stem: { kind: 'analogy', pairs: [['thirsty', 'drink'], ['tired', '?']] },
      choices: ['sleep', 'run', 'yawn', 'bed', 'hungry'],
      answer: 0,
      hint: 'What do you do to fix the feeling, not what the feeling makes you do?',
      walkthrough: [
        { title: 'Name the relationship', text: 'When you are thirsty, you drink. The pair is need -> the action that relieves it.' },
        { title: 'Keep the direction', text: 'Feeling first, cure second: "when you are tired, you ___."' },
        { title: 'Apply it', text: 'When you are tired, you sleep.' }
      ],
      why: {
        1: 'Running makes you more tired, not less.',
        2: 'A yawn is a sign of being tired, not the thing that fixes it.',
        3: 'A bed is a place, not an action. Watch for answers that change the part of speech.',
        4: 'Hungry is another feeling, so it matches the first word, not the second.'
      }
    },
    {
      id: 'va-04', battery: 'verbal', subtest: 'verbal-analogies', b: 0.4,
      stem: { kind: 'analogy', pairs: [['gigantic', 'large'], ['frigid', '?']] },
      choices: ['cold', 'ice', 'winter', 'warm', 'chilly'],
      answer: 0,
      hint: 'One word is an extreme version of the other. Which direction?',
      walkthrough: [
        { title: 'Name the relationship', text: '"Gigantic" is an extreme form of "large" — same meaning, turned all the way up.' },
        { title: 'Keep the direction', text: 'Extreme word first, ordinary word second. "Frigid" is the extreme, so we need its ordinary partner.' },
        { title: 'Apply it', text: 'Frigid is an extreme form of cold.' }
      ],
      why: {
        1: 'Ice is a thing that is cold, not a word meaning cold.',
        2: 'Winter is a season, a different category from a describing word.',
        3: 'Warm is the opposite; the first pair were not opposites.',
        4: 'Chilly is milder than cold, so it runs the intensity the wrong way — the pair goes extreme -> ordinary, not ordinary -> mild.'
      }
    },
    {
      id: 'va-05', battery: 'verbal', subtest: 'verbal-analogies', b: 0.9,
      stem: { kind: 'analogy', pairs: [['island', 'ocean'], ['oasis', '?']] },
      choices: ['palm', 'desert', 'water', 'sand', 'camel'],
      answer: 1,
      hint: 'Each first word is a small patch of one thing surrounded by a huge amount of its opposite.',
      walkthrough: [
        { title: 'Name the relationship', text: 'An island is a patch of land surrounded by ocean — surrounded thing -> what surrounds it.' },
        { title: 'Keep the direction', text: 'Small patch first, vast surrounding second: "an oasis is surrounded by ___."' },
        { title: 'Apply it', text: 'An oasis is a patch of water and greenery surrounded by desert.' }
      ],
      why: {
        0: 'Palms grow in an oasis — that is a part, not the surroundings.',
        2: 'Water is what the oasis is made of, matching the wrong half of the pair.',
        3: 'Sand is the material of the desert, one level too narrow.',
        4: 'A camel travels through the desert but is not what surrounds an oasis.'
      }
    },
    {
      id: 'va-06', battery: 'verbal', subtest: 'verbal-analogies', b: 1.0,
      stem: { kind: 'analogy', pairs: [['microscope', 'tiny'], ['telescope', '?']] },
      choices: ['stars', 'distant', 'lens', 'large', 'night'],
      answer: 1,
      hint: 'The second word says what problem the tool solves.',
      walkthrough: [
        { title: 'Name the relationship', text: 'A microscope lets you see things that are too tiny to see. Tool -> the quality that made it necessary.' },
        { title: 'Keep the direction', text: 'Tool first, quality second: "a telescope lets you see things that are too ___."' },
        { title: 'Apply it', text: 'A telescope lets you see things that are too distant.' }
      ],
      why: {
        0: 'Stars are one thing you look at, not the quality that makes them hard to see.',
        2: 'A lens is a part of both tools, so it does not distinguish anything.',
        3: 'Telescopes are used on things that look small because they are far away; the obstacle is distance.',
        4: 'Night is when you use it, not why you need it.'
      }
    },
    {
      id: 'va-07', battery: 'verbal', subtest: 'verbal-analogies', b: 0.6,
      stem: { kind: 'analogy', pairs: [['reluctant', 'eager'], ['scarce', '?']] },
      choices: ['abundant', 'rare', 'few', 'limited', 'empty'],
      answer: 0,
      hint: 'Check whether the first pair means the same or the opposite.',
      walkthrough: [
        { title: 'Name the relationship', text: '"Reluctant" means unwilling; "eager" means very willing. They are opposites.' },
        { title: 'Keep the direction', text: 'We need the opposite of "scarce" (in very short supply).' },
        { title: 'Apply it', text: 'The opposite of scarce is abundant — plentiful.' }
      ],
      why: {
        1: 'Rare is a synonym of scarce, and the pair is opposites.',
        2: 'Few also means a small number — same side of the meaning.',
        3: 'Limited is another synonym for scarce.',
        4: 'Empty is more extreme than scarce, not opposite to it.'
      }
    },
    {
      id: 'va-08', battery: 'verbal', subtest: 'verbal-analogies', b: 1.2,
      stem: { kind: 'analogy', pairs: [['novice', 'expert'], ['sapling', '?']] },
      choices: ['seed', 'tree', 'leaf', 'forest', 'branch'],
      answer: 1,
      hint: 'Both words in the first pair name the same thing at two different stages.',
      walkthrough: [
        { title: 'Name the relationship', text: 'A novice is a beginner; an expert is what that person becomes with time. Early stage -> mature stage.' },
        { title: 'Keep the direction', text: 'Early first, mature second: "a sapling grows into a ___."' },
        { title: 'Apply it', text: 'A sapling is a young tree, so it grows into a mature tree.' }
      ],
      why: {
        0: 'A seed comes before a sapling, so it runs the sequence backwards.',
        2: 'A leaf is a part of a tree, not a later stage of a sapling.',
        3: 'A forest is many trees — a whole, not a life stage.',
        4: 'A branch is another part, at the wrong level entirely.'
      }
    }
  ]);

  subtest({
    id: 'sentence-completion',
    battery: 'verbal',
    name: 'Sentence Completion',
    blurb: 'Choose the word that makes the whole sentence make sense, not just the words next to the blank.',
    directions: 'Read the sentence and choose the word that best fits the blank.',
    timePerItemSec: 40,
    strategy: [
      'Read the whole sentence first and predict your own word before you look at the choices.',
      'Hunt for signal words: "although", "rather than", "because", "so" tell you whether the blank agrees with the rest of the sentence or contradicts it.',
      'Plug your choice back in and read the sentence again from the start.'
    ]
  });

  add([
    {
      id: 'sc-01', battery: 'verbal', subtest: 'sentence-completion', b: -1.5,
      stem: { kind: 'sentence', text: 'The detective found a small ____ that helped her solve the case.' },
      choices: ['clue', 'cloak', 'clock', 'cluster', 'clash'],
      answer: 0,
      hint: 'What does a detective look for?',
      walkthrough: [
        { title: 'Predict first', text: 'Before reading the choices: the detective found something that helped solve the case — a piece of evidence.' },
        { title: 'Match your prediction', text: '"Clue" is exactly that word. The other choices only look similar because they start with "cl".' },
        { title: 'Read it back', text: '"The detective found a small clue that helped her solve the case." It works.' }
      ],
      why: {
        1: 'A cloak is a garment; finding one would not by itself solve a case.',
        2: 'A clock is an object, unrelated to the meaning of the sentence.',
        3: 'A cluster is a group of things and needs to say a cluster of what.',
        4: 'A clash is an argument or conflict, not something you find.'
      }
    },
    {
      id: 'sc-02', battery: 'verbal', subtest: 'sentence-completion', b: -1.0,
      stem: { kind: 'sentence', text: 'Because the old bridge was ____, the town had to build a new one.' },
      choices: ['scenic', 'crumbling', 'crowded', 'sturdy', 'wide'],
      answer: 1,
      hint: '"Because" means the blank has to be the reason for what follows.',
      walkthrough: [
        { title: 'Find the signal word', text: '"Because" links a cause to an effect. The effect is "the town had to build a new one."' },
        { title: 'Work backwards', text: 'What condition forces a town to replace a bridge? The bridge must be failing.' },
        { title: 'Apply it', text: '"Crumbling" describes a bridge falling apart, which is a real reason to replace it.' }
      ],
      why: {
        0: 'A scenic bridge is a reason to keep it, not replace it.',
        2: 'Crowding is tempting, but a crowded bridge is usually widened, and the sentence says the old one had to be replaced because of its condition.',
        3: 'Sturdy is the opposite of a reason to replace it.',
        4: 'Wide is a neutral description and gives no reason at all.'
      }
    },
    {
      id: 'sc-03', battery: 'verbal', subtest: 'sentence-completion', b: -0.3,
      stem: { kind: 'sentence', text: 'Although the recipe looked ____, it took Marcus three hours to finish.' },
      choices: ['delicious', 'simple', 'expensive', 'foreign', 'healthy'],
      answer: 1,
      hint: '"Although" means the two halves of the sentence must disagree.',
      walkthrough: [
        { title: 'Find the signal word', text: '"Although" sets up a contrast: the first half has to clash with the second half.' },
        { title: 'Read the second half', text: 'It took three hours — that means it was hard and slow.' },
        { title: 'Apply it', text: 'The contrast to "took three hours" is "looked simple". The recipe seemed easy but was not.' }
      ],
      why: {
        0: 'Delicious does not clash with taking three hours; good food often takes time.',
        2: 'Expensive is about cost, which has nothing to contrast with time.',
        3: 'Foreign might even explain the long time, so it agrees instead of contrasting.',
        4: 'Healthy has no tension with a long cooking time.'
      }
    },
    {
      id: 'sc-04', battery: 'verbal', subtest: 'sentence-completion', b: 0.2,
      stem: { kind: 'sentence', text: 'The volcano had been ____ for centuries, so the villagers were shocked when it erupted.' },
      choices: ['active', 'dormant', 'molten', 'ancient', 'hollow'],
      answer: 1,
      hint: 'What would have to be true for an eruption to be shocking?',
      walkthrough: [
        { title: 'Find the signal word', text: '"So" links a cause to a result: the state of the volcano caused the shock.' },
        { title: 'Work backwards', text: 'An eruption is only shocking if the volcano seemed to be doing nothing for a very long time.' },
        { title: 'Apply it', text: '"Dormant" is the exact word for a volcano that is inactive but not extinct.' }
      ],
      why: {
        0: 'If it had been active, an eruption would be expected, not shocking.',
        2: 'Molten describes the rock inside, and would make an eruption less surprising.',
        3: 'Every volcano is ancient; that fact does not explain any shock.',
        4: 'Hollow describes shape, not activity, and does not set up the surprise.'
      }
    },
    {
      id: 'sc-05', battery: 'verbal', subtest: 'sentence-completion', b: 0.5,
      stem: { kind: 'sentence', text: 'The biologist’s ____ notes recorded a change in the birds that everyone else had walked straight past.' },
      choices: ['hasty', 'meticulous', 'occasional', 'reluctant', 'casual'],
      answer: 1,
      hint: 'What kind of note-taking catches something everyone else missed?',
      walkthrough: [
        { title: 'Predict first', text: 'Her notes caught a detail others missed, so the notes must have been unusually careful and complete.' },
        { title: 'Match your prediction', text: '"Meticulous" means extremely careful about small details — a direct match.' },
        { title: 'Check the rest', text: 'Every other choice describes sloppy or infrequent work, which would make her *more* likely to miss the change, not less.' }
      ],
      why: {
        0: 'Hasty notes are rushed, so they would miss details.',
        2: 'Occasional notes leave gaps where the change could hide.',
        3: 'Reluctant describes her attitude, not the quality of the notes.',
        4: 'Casual notes are the opposite of the care the sentence implies.'
      }
    },
    {
      id: 'sc-06', battery: 'verbal', subtest: 'sentence-completion', b: 0.0,
      stem: { kind: 'sentence', text: 'Her argument was so ____ that even the people who came to disagree ended up nodding.' },
      choices: ['lengthy', 'persuasive', 'unusual', 'quiet', 'polite'],
      answer: 1,
      hint: 'The result is that opponents agreed. What quality produces that result?',
      walkthrough: [
        { title: 'Find the structure', text: '"So ____ that ___" means the blank is strong enough to cause the result.' },
        { title: 'Read the result', text: 'People who came to disagree ended up agreeing — she changed their minds.' },
        { title: 'Apply it', text: '"Persuasive" is precisely the word for an argument that changes minds.' }
      ],
      why: {
        0: 'Length does not change minds; a long argument can still be unconvincing.',
        2: 'Unusual arguments can be dismissed just as easily as accepted.',
        3: 'Volume is unrelated to whether the reasoning works.',
        4: 'Politeness makes people listen but does not by itself make them agree.'
      }
    },
    {
      id: 'sc-07', battery: 'verbal', subtest: 'sentence-completion', b: 0.9,
      stem: { kind: 'sentence', text: 'The instructions were so ____ that no two people in the room read them the same way.' },
      choices: ['detailed', 'ambiguous', 'brief', 'printed', 'illustrated'],
      answer: 1,
      hint: 'One word means "open to more than one interpretation".',
      walkthrough: [
        { title: 'Read the result', text: 'No two people read them the same way — the instructions supported several different meanings.' },
        { title: 'Name that quality', text: 'The word for language that can be taken more than one way is "ambiguous".' },
        { title: 'Test the near miss', text: '"Brief" is tempting because short instructions can be unclear, but shortness alone does not guarantee multiple readings. Ambiguity does, by definition.' }
      ],
      why: {
        0: 'Detailed instructions usually reduce disagreement.',
        2: 'Brief instructions may leave things out, but the sentence says people read them differently, which is about meaning rather than length.',
        3: 'Printed says how they were produced, not how they read.',
        4: 'Illustrations generally make instructions clearer.'
      }
    },
    {
      id: 'sc-08', battery: 'verbal', subtest: 'sentence-completion', b: 1.3,
      stem: { kind: 'sentence', text: 'Rather than ____ the traffic problem, the new one-way system made it noticeably worse.' },
      choices: ['worsening', 'causing', 'alleviating', 'studying', 'ignoring'],
      answer: 2,
      hint: '"Rather than X, it did the opposite" — so X is the opposite of "made it worse".',
      walkthrough: [
        { title: 'Find the signal phrase', text: '"Rather than X, Y" means Y happened instead of X, so X and Y pull in opposite directions.' },
        { title: 'Name Y', text: 'Y is "made it noticeably worse".' },
        { title: 'Take the opposite', text: 'The opposite of making a problem worse is easing it. "Alleviating" means to make less severe.' }
      ],
      why: {
        0: 'Worsening is the same as Y, but the sentence needs the opposite of Y.',
        1: 'Causing the problem also fits the "made it worse" side, not the contrast.',
        3: 'Studying a problem is neutral and does not contrast with worsening it.',
        4: 'Ignoring is passive; the contrast the sentence sets up is between fixing and worsening.'
      }
    }
  ]);

  subtest({
    id: 'verbal-classification',
    battery: 'verbal',
    name: 'Verbal Classification',
    blurb: 'Three words belong to one group. Find the fourth word that belongs with them.',
    directions: 'The three words at the top are alike in some way. Choose the word that belongs with them.',
    timePerItemSec: 35,
    strategy: [
      'Say what all three given words have in common in one short phrase.',
      'Make the rule as narrow as you can — "birds" is better than "animals".',
      'Reject any answer that names the whole category instead of a member of it.'
    ]
  });

  add([
    {
      id: 'vc-01', battery: 'verbal', subtest: 'verbal-classification', b: -1.3,
      stem: { kind: 'classification', given: ['robin', 'sparrow', 'eagle'] },
      choices: ['bat', 'hawk', 'butterfly', 'squirrel', 'bee'],
      answer: 1,
      hint: 'All three are the same kind of animal, not just animals that fly.',
      walkthrough: [
        { title: 'State the rule', text: 'Robins, sparrows and eagles are all birds.' },
        { title: 'Narrow it', text: '"Things that fly" would also allow bats, butterflies and bees, so the rule has to be the tighter one: birds.' },
        { title: 'Apply it', text: 'A hawk is a bird, so it belongs with the group.' }
      ],
      why: {
        0: 'A bat flies but is a mammal.',
        2: 'A butterfly flies but is an insect.',
        3: 'A squirrel is a mammal and does not fly at all.',
        4: 'A bee flies but is an insect.'
      }
    },
    {
      id: 'vc-02', battery: 'verbal', subtest: 'verbal-classification', b: -1.1,
      stem: { kind: 'classification', given: ['copper', 'iron', 'silver'] },
      choices: ['plastic', 'gold', 'wood', 'glass', 'rubber'],
      answer: 1,
      hint: 'Think about what all three materials are.',
      walkthrough: [
        { title: 'State the rule', text: 'Copper, iron and silver are all metals.' },
        { title: 'Check for a tighter rule', text: 'They are not all coins, not all coloured the same, and not all magnetic — metal is the rule that covers exactly these three.' },
        { title: 'Apply it', text: 'Gold is a metal.' }
      ],
      why: {
        0: 'Plastic is a manufactured material, not a metal.',
        2: 'Wood comes from trees.',
        3: 'Glass is made from sand, not a metal.',
        4: 'Rubber comes from plants or petroleum.'
      }
    },
    {
      id: 'vc-03', battery: 'verbal', subtest: 'verbal-classification', b: -0.6,
      stem: { kind: 'classification', given: ['triangle', 'pentagon', 'octagon'] },
      choices: ['circle', 'hexagon', 'sphere', 'cube', 'oval'],
      answer: 1,
      hint: 'Count the sides — and notice what kind of sides they are.',
      walkthrough: [
        { title: 'State the rule', text: 'All three are flat shapes made only of straight sides — polygons.' },
        { title: 'Rule out the near misses', text: 'Circles and ovals are flat but curved. Cubes and spheres are solid, not flat.' },
        { title: 'Apply it', text: 'A hexagon is a flat six-sided polygon, so it belongs.' }
      ],
      why: {
        0: 'A circle has no straight sides.',
        2: 'A sphere is three-dimensional.',
        3: 'A cube is three-dimensional.',
        4: 'An oval is curved, like a circle.'
      }
    },
    {
      id: 'vc-04', battery: 'verbal', subtest: 'verbal-classification', b: -0.2,
      stem: { kind: 'classification', given: ['whisper', 'shout', 'mumble'] },
      choices: ['listen', 'murmur', 'write', 'nod', 'read'],
      answer: 1,
      hint: 'Each word names a way of doing the same one thing.',
      walkthrough: [
        { title: 'State the rule', text: 'Whispering, shouting and mumbling are all ways of speaking out loud.' },
        { title: 'Check the direction', text: 'They are things the speaker does, not things a listener does.' },
        { title: 'Apply it', text: 'To murmur is to speak in a low, soft voice — another way of speaking.' }
      ],
      why: {
        0: 'Listening is what the audience does.',
        2: 'Writing communicates without any voice.',
        3: 'Nodding is a gesture, not speech.',
        4: 'Reading can be silent and is about receiving words.'
      }
    },
    {
      id: 'vc-05', battery: 'verbal', subtest: 'verbal-classification', b: 0.1,
      stem: { kind: 'classification', given: ['trumpet', 'flute', 'clarinet'] },
      choices: ['violin', 'tuba', 'drum', 'piano', 'guitar'],
      answer: 1,
      hint: 'How do you make each of these instruments produce a note?',
      walkthrough: [
        { title: 'State the rule', text: 'A trumpet, a flute and a clarinet are all played by blowing air through them — wind instruments.' },
        { title: 'Narrow it', text: '"Musical instrument" is too broad, because every answer choice would fit. Wind instrument separates them.' },
        { title: 'Apply it', text: 'A tuba is played by blowing into it, so it is a wind instrument.' }
      ],
      why: {
        0: 'A violin is played with a bow on strings.',
        2: 'A drum is struck.',
        3: 'A piano uses hammers on strings.',
        4: 'A guitar is plucked or strummed.'
      }
    },
    {
      id: 'vc-06', battery: 'verbal', subtest: 'verbal-classification', b: 0.4,
      stem: { kind: 'classification', given: ['hesitate', 'pause', 'linger'] },
      choices: ['rush', 'delay', 'decide', 'depart', 'sprint'],
      answer: 1,
      hint: 'All three describe the same relationship with time.',
      walkthrough: [
        { title: 'State the rule', text: 'Hesitating, pausing and lingering all mean taking more time than expected.' },
        { title: 'Check the opposites', text: 'Rushing and sprinting mean the opposite: taking less time.' },
        { title: 'Apply it', text: 'To delay is to put something off or make it take longer, which matches the group.' }
      ],
      why: {
        0: 'Rushing means going faster, the opposite of the group.',
        2: 'Deciding is about making a choice, not about time.',
        3: 'Departing is leaving, which does not imply slowness.',
        4: 'Sprinting is the fastest word on the list.'
      }
    },
    {
      id: 'vc-07', battery: 'verbal', subtest: 'verbal-classification', b: 0.7,
      stem: { kind: 'classification', given: ['granite', 'marble', 'slate'] },
      choices: ['clay', 'limestone', 'oak', 'cotton', 'plaster'],
      answer: 1,
      hint: 'They are all one specific kind of natural material.',
      walkthrough: [
        { title: 'State the rule', text: 'Granite, marble and slate are all rocks that get quarried and cut into blocks or slabs.' },
        { title: 'Rule out the near miss', text: 'Clay is the tempting one, but clay is a soft sediment you dig and mould, not a rock you quarry.' },
        { title: 'Apply it', text: 'Limestone is a quarried rock used for building, just like the other three.' }
      ],
      why: {
        0: 'Clay is a soft, mouldable sediment rather than a solid rock.',
        2: 'Oak is wood, from a tree.',
        3: 'Cotton is a plant fibre.',
        4: 'Plaster is manufactured, not quarried in blocks.'
      }
    },
    {
      id: 'vc-08', battery: 'verbal', subtest: 'verbal-classification', b: 1.4,
      stem: { kind: 'classification', given: ['delta', 'estuary', 'tributary'] },
      choices: ['canyon', 'meander', 'dune', 'glacier', 'crater'],
      answer: 1,
      hint: 'All three are named parts of the same kind of landform system.',
      walkthrough: [
        { title: 'State the rule', text: 'A delta, an estuary and a tributary are all features of a river.' },
        { title: 'Narrow it', text: '"Landform" is too broad — canyons, dunes and craters are landforms too. River feature is the rule that fits exactly these three.' },
        { title: 'Apply it', text: 'A meander is a bend in a river’s course, so it is a river feature.' }
      ],
      why: {
        0: 'A canyon can be carved by a river but is a valley, not a part of the river itself.',
        2: 'A dune is built by wind in sand.',
        3: 'A glacier is a river of ice, but not one of the named parts of a water river.',
        4: 'A crater is formed by impact or volcanic activity.'
      }
    }
  ]);
})(typeof self !== 'undefined' ? self : this);
