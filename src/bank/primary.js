/*
 * primary.js — Picture Analogies and Picture Classification.
 *
 * These two subtests replace Verbal Analogies and Verbal Classification on the
 * primary levels (5/6, 7 and 8 — kindergarten through grade 2), because the
 * children taking them are not yet reliable readers. Every item is read aloud by
 * the examiner; `readAloud` is the script, and it is also what the app speaks
 * when read-aloud is switched on.
 *
 * Difficulties are on the absolute scale from levels.js. The primary levels are
 * centred at -2.6 (K), -2.0 (grade 1) and -1.5 (grade 2), so this pool spans
 * roughly -3.3 to -1.2.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../pictograms.js'));
  } else {
    root.CogatPrimaryBank = factory(root.CogatPictograms);
  }
})(typeof self !== 'undefined' ? self : this, function (Pictograms) {
  'use strict';

  var items = [];
  function P(name) { return Pictograms.get(name); }
  function choice(name) { return { fig: P(name), word: P(name).word }; }

  /**
   * @param {Array} pairs [[a, b], [c, null]] pictogram names
   * @param {Array} options five pictogram names; `answerName` must be among them
   */
  function analogy(id, b, pairs, options, answerName, relation, readAloud, steps, why) {
    return {
      id: id, battery: 'verbal', subtest: 'picture-analogies', b: b,
      stem: { kind: 'pictureAnalogy', pairs: pairs.map(function (p) { return [P(p[0]), p[1] ? P(p[1]) : null]; }) },
      choices: options.map(choice),
      answer: options.indexOf(answerName),
      readAloud: readAloud,
      hint: relation,
      walkthrough: steps,
      why: why
    };
  }

  function classification(id, b, given, options, answerName, rule, readAloud, steps, why) {
    return {
      id: id, battery: 'verbal', subtest: 'picture-classification', b: b,
      stem: { kind: 'pictureClass', given: given.map(P) },
      choices: options.map(choice),
      answer: options.indexOf(answerName),
      readAloud: readAloud,
      hint: rule,
      walkthrough: steps,
      why: why
    };
  }

  // ------------------------------------------------------ picture analogies ---

  var A = [
    ['pa-01', -3.10, [['seed', 'tree'], ['egg', null]], ['bird', 'nest', 'fish', 'flower', 'cat'], 'bird',
      'What does each little thing turn into when it grows?',
      'A seed grows into a tree. An egg grows into what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A seed grows into a tree.' },
       { title: 'Use the same words', text: 'An egg grows into a ___.' },
       { title: 'Answer', text: 'An egg grows into a bird.' }],
      { 1: 'A nest is where the egg sits, not what it becomes.', 3: 'A flower grows from a seed, not from an egg.' }],

    ['pa-02', -3.00, [['bird', 'nest'], ['dog', null]], ['kennel', 'bone', 'house', 'cat', 'tree'], 'kennel',
      'Where does each animal live?',
      'A bird lives in a nest. A dog lives in what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A bird lives in a nest.' },
       { title: 'Use the same words', text: 'A dog lives in a ___.' },
       { title: 'Answer', text: 'A dog lives in a kennel.' }],
      { 1: 'A bone is what a dog eats, not where it lives.', 2: 'People live in a house; the pair is about the animal’s own home.' }],

    ['pa-03', -2.90, [['dog', 'bone'], ['cat', null]], ['fish', 'nest', 'ball', 'bird', 'apple'], 'fish',
      'What does each animal eat?',
      'A dog eats a bone. A cat eats what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A dog eats a bone.' },
       { title: 'Use the same words', text: 'A cat eats a ___.' },
       { title: 'Answer', text: 'A cat eats a fish.' }],
      { 2: 'A ball is a toy a cat plays with, not food.', 3: 'A cat may chase a bird, but fish is the food that matches the pair.' }],

    ['pa-04', -2.80, [['wheel', 'car'], ['door', null]], ['house', 'key', 'window', 'boat', 'chair'], 'house',
      'Each first picture is one piece of the second picture.',
      'A wheel is part of a car. A door is part of what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A wheel is one part of a car.' },
       { title: 'Use the same words', text: 'A door is one part of a ___.' },
       { title: 'Answer', text: 'A door is one part of a house.' }],
      { 1: 'A key opens a door, but it is not the thing the door is part of.', 2: 'A window is another part, so it is the same kind of thing as a door.' }],

    ['pa-05', -2.70, [['tree', 'leaf'], ['car', null]], ['wheel', 'house', 'boat', 'door', 'key'], 'wheel',
      'This time the whole thing comes first and the piece comes second.',
      'A tree has leaves. A car has what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A leaf is one part of a tree — so the whole comes first here.' },
       { title: 'Use the same words', text: 'One part of a car is a ___.' },
       { title: 'Answer', text: 'One part of a car is a wheel.' }],
      { 3: 'A door is part of a house, not the part that belongs with a car in this pair.' }],

    ['pa-06', -2.60, [['scissors', 'paper'], ['hammer', null]], ['nail', 'book', 'pencil', 'wheel', 'key'], 'nail',
      'What does each tool work on?',
      'Scissors cut paper. A hammer hits what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'Scissors are used on paper.' },
       { title: 'Use the same words', text: 'A hammer is used on a ___.' },
       { title: 'Answer', text: 'A hammer is used on a nail.' }],
      { 2: 'A pencil is another tool, so it goes with scissors and hammer, not with paper.' }],

    ['pa-07', -2.50, [['cup', 'spoon'], ['shoe', null]], ['sock', 'hat', 'ball', 'glove', 'paper'], 'sock',
      'Which two things go together on the same part of you?',
      'A cup goes with a spoon. A shoe goes with what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A cup and a spoon are used together.' },
       { title: 'Use the same words', text: 'A shoe is used together with a ___.' },
       { title: 'Answer', text: 'A shoe goes with a sock — both go on your foot.' }],
      { 1: 'A hat goes on your head, not with a shoe.', 3: 'A glove goes on your hand.' }],

    ['pa-08', -2.40, [['apple', 'tree'], ['egg', null]], ['bird', 'nest', 'seed', 'cat', 'pear'], 'bird',
      'Where does each thing come from?',
      'An apple comes from a tree. An egg comes from what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'An apple comes from a tree.' },
       { title: 'Use the same words', text: 'An egg comes from a ___.' },
       { title: 'Answer', text: 'An egg comes from a bird.' }],
      { 1: 'A nest is where the egg is kept, not what it came from.', 4: 'A pear is another fruit, like the apple.' }],

    ['pa-09', -2.30, [['window', 'house'], ['wheel', null]], ['car', 'door', 'boat', 'tree', 'key'], 'car',
      'Each first picture is one piece of the second picture.',
      'A window is part of a house. A wheel is part of what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A window is one part of a house.' },
       { title: 'Use the same words', text: 'A wheel is one part of a ___.' },
       { title: 'Answer', text: 'A wheel is one part of a car.' }],
      { 1: 'A door is another part of a house, so it matches the first word, not the second.' }],

    ['pa-10', -2.20, [['key', 'lock'], ['pencil', null]], ['paper', 'book', 'scissors', 'nail', 'hammer'], 'paper',
      'What does each one get used on?',
      'A key is used on a lock. A pencil is used on what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A key is used on a lock.' },
       { title: 'Use the same words', text: 'A pencil is used on ___.' },
       { title: 'Answer', text: 'A pencil is used on paper.' }],
      { 2: 'Scissors are another tool, like the pencil itself.', 4: 'A hammer is a tool too, not the thing written on.' }],

    ['pa-11', -2.10, [['rain', 'cloud'], ['leaf', null]], ['tree', 'flower', 'seed', 'nest', 'apple'], 'tree',
      'Where does each one come from?',
      'Rain comes from a cloud. A leaf comes from what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'Rain comes out of a cloud.' },
       { title: 'Use the same words', text: 'A leaf comes from a ___.' },
       { title: 'Answer', text: 'A leaf comes from a tree.' }],
      { 2: 'A seed also comes from a plant, so it belongs on the same side as the leaf.' }],

    ['pa-12', -2.00, [['cat', 'fish'], ['bird', null]], ['seed', 'nest', 'egg', 'bone', 'dog'], 'seed',
      'What does each animal eat?',
      'A cat eats a fish. A bird eats what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A cat eats a fish.' },
       { title: 'Use the same words', text: 'A bird eats a ___.' },
       { title: 'Answer', text: 'A bird eats seeds.' }],
      { 1: 'A nest is where a bird lives.', 2: 'An egg is what a bird lays, not what it eats.', 3: 'A bone is a dog’s food.' }],

    ['pa-13', -1.90, [['house', 'door'], ['car', null]], ['wheel', 'boat', 'window', 'key', 'tree'], 'wheel',
      'The whole thing comes first and one of its parts comes second.',
      'A house has a door. A car has what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A house has a door — the whole comes first.' },
       { title: 'Use the same words', text: 'A car has a ___.' },
       { title: 'Answer', text: 'A car has a wheel.' }],
      { 2: 'A window is part of a house, which is the pair we already used.' }],

    ['pa-14', -1.80, [['seed', 'flower'], ['egg', null]], ['bird', 'tree', 'nest', 'fish', 'butterfly'], 'bird',
      'What does each little thing turn into?',
      'A seed grows into a flower. An egg grows into what? Point to your answer.',
      [{ title: 'Say the first pair out loud', text: 'A seed grows into a flower.' },
       { title: 'Use the same words', text: 'An egg grows into a ___.' },
       { title: 'Answer', text: 'An egg grows into a bird.' }],
      { 1: 'A tree also grows from a seed, so it belongs with the first pair.', 4: 'A butterfly hatches too, but it comes from a caterpillar, and the bird is the animal shown laying eggs here.' }],

    ['pa-15', -1.70, [['bone', 'dog'], ['fish', null]], ['cat', 'bird', 'boat', 'nest', 'egg'], 'cat',
      'This time the food comes first and the animal comes second.',
      'A bone is eaten by a dog. A fish is eaten by what? Point to your answer.',
      [{ title: 'Notice the order', text: 'The food comes first this time and the animal second — the opposite of the usual way round.' },
       { title: 'Use the same words', text: 'A fish is eaten by a ___.' },
       { title: 'Answer', text: 'A fish is eaten by a cat.' }],
      { 2: 'A boat goes on water where fish live, but it does not eat them.' }],

    ['pa-16', -1.60, [['lock', 'key'], ['nail', null]], ['hammer', 'scissors', 'paper', 'pencil', 'door'], 'hammer',
      'The thing comes first and the tool that works it comes second.',
      'A lock is opened by a key. A nail is hit by what? Point to your answer.',
      [{ title: 'Notice the order', text: 'The object comes first and the tool second, which is the reverse of the usual order.' },
       { title: 'Use the same words', text: 'A nail is worked with a ___.' },
       { title: 'Answer', text: 'A nail is hit with a hammer.' }],
      { 1: 'Scissors are a tool, but they are not the tool for a nail.', 4: 'A door is opened by a key, so it belongs in the first pair.' }],

    ['pa-17', -1.50, [['nest', 'bird'], ['kennel', null]], ['dog', 'cat', 'house', 'bone', 'fish'], 'dog',
      'The home comes first and the animal comes second.',
      'A nest is the home of a bird. A kennel is the home of what? Point to your answer.',
      [{ title: 'Notice the order', text: 'The home comes first this time and the animal second.' },
       { title: 'Use the same words', text: 'A kennel is the home of a ___.' },
       { title: 'Answer', text: 'A kennel is the home of a dog.' }],
      { 2: 'A house is another home, so it matches the first word rather than the second.' }],

    ['pa-18', -1.40, [['paper', 'scissors'], ['nail', null]], ['hammer', 'pencil', 'key', 'book', 'glove'], 'hammer',
      'The material comes first and the tool comes second.',
      'Paper is cut with scissors. A nail is hit with what? Point to your answer.',
      [{ title: 'Notice the order', text: 'The material comes first and the tool that works it comes second.' },
       { title: 'Use the same words', text: 'A nail is worked with a ___.' },
       { title: 'Answer', text: 'A nail is hit with a hammer.' }],
      { 1: 'A pencil writes on paper; it is not the tool for a nail.' }],

    ['pa-19', -1.30, [['tree', 'apple'], ['bird', null]], ['egg', 'nest', 'seed', 'leaf', 'fish'], 'egg',
      'The living thing comes first and what it makes comes second.',
      'A tree makes apples. A bird makes what? Point to your answer.',
      [{ title: 'Notice the order', text: 'The living thing comes first and the thing it produces comes second.' },
       { title: 'Use the same words', text: 'A bird makes a ___.' },
       { title: 'Answer', text: 'A bird makes an egg.' }],
      { 1: 'A nest is what a bird builds to hold the eggs, not what it produces.', 3: 'A leaf is made by a tree, so it belongs in the first pair.' }],

    ['pa-20', -1.20, [['bird', 'egg'], ['tree', null]], ['seed', 'leaf', 'apple', 'flower', 'nest'], 'seed',
      'The grown thing comes first and the little starting thing comes second.',
      'A bird comes from an egg. A tree comes from what? Point to your answer.',
      [{ title: 'Notice the order', text: 'The grown living thing comes first and the small thing it started as comes second.' },
       { title: 'Use the same words', text: 'A tree started as a ___.' },
       { title: 'Answer', text: 'A tree started as a seed.' }],
      { 1: 'A leaf grows on a tree but is not what the tree started from.', 2: 'An apple is fruit the tree makes later.' }]
  ];

  A.forEach(function (a) { items.push(analogy.apply(null, a)); });

  // ------------------------------------------------ picture classification ---

  var C = [
    ['pc-01', -3.30, ['cat', 'dog', 'fish'], ['bird', 'tree', 'car', 'cup', 'house'], 'bird',
      'They are all the same kind of living thing.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A cat, a dog and a fish are all animals.' },
       { title: 'Check the choices', text: 'Only one of the pictures is an animal.' },
       { title: 'Answer', text: 'A bird is an animal, so it belongs.' }],
      { 1: 'A tree is a plant, not an animal.', 2: 'A car is a machine.', 3: 'A cup is something you drink from.' }],

    ['pc-02', -3.20, ['cat', 'bird', 'butterfly'], ['dog', 'chair', 'book', 'key', 'boat'], 'dog',
      'They are all the same kind of living thing.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A cat, a bird and a butterfly are all animals.' },
       { title: 'Check the choices', text: 'Only one choice is a living animal.' },
       { title: 'Answer', text: 'A dog is an animal.' }],
      { 1: 'A chair is furniture.', 2: 'A book is a thing you read.' }],

    ['pc-03', -3.10, ['sun', 'moon', 'star'], ['cloud', 'shoe', 'spoon', 'nail', 'chair'], 'cloud',
      'Think about where you see all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'The sun, the moon and a star are all things you see up in the sky.' },
       { title: 'Check the choices', text: 'Only one choice belongs in the sky.' },
       { title: 'Answer', text: 'A cloud is in the sky.' }],
      { 1: 'A shoe goes on your foot.', 3: 'A nail is used with a hammer.' }],

    ['pc-04', -3.00, ['apple', 'banana', 'egg'], ['pear', 'key', 'wheel', 'lamp', 'sock'], 'pear',
      'Think about what you can do with all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'An apple, a banana and an egg are all things you can eat.' },
       { title: 'Check the choices', text: 'Only one choice is food.' },
       { title: 'Answer', text: 'A pear is food.' }],
      { 1: 'A key opens a lock.', 4: 'A sock is something you wear.' }],

    ['pc-05', -2.90, ['shoe', 'hat', 'sock'], ['glove', 'cup', 'nail', 'boat', 'clock'], 'glove',
      'Think about what you do with all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A shoe, a hat and a sock are all things you wear.' },
       { title: 'Check the choices', text: 'Only one choice is worn on your body.' },
       { title: 'Answer', text: 'A glove is worn on your hand.' }],
      { 1: 'A cup is for drinking.', 4: 'A clock tells the time.' }],

    ['pc-06', -2.80, ['key', 'pencil', 'scissors'], ['hammer', 'apple', 'cloud', 'fish', 'chair'], 'hammer',
      'They are all things you pick up and use.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A key, a pencil and a pair of scissors are all tools you hold in your hand to do a job.' },
       { title: 'Check the choices', text: 'Only one choice is a tool.' },
       { title: 'Answer', text: 'A hammer is a tool.' }],
      { 1: 'An apple is food.', 2: 'A cloud is in the sky.' }],

    ['pc-07', -2.75, ['sock', 'glove', 'shoe'], ['hat', 'book', 'seed', 'bottle', 'car'], 'hat',
      'Think about what you do with all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A sock, a glove and a shoe are all clothes you put on.' },
       { title: 'Check the choices', text: 'Only one choice is something you wear.' },
       { title: 'Answer', text: 'A hat is worn on your head.' }],
      { 1: 'A book is for reading.', 3: 'A bottle holds a drink.' }],

    ['pc-08', -2.70, ['tree', 'flower', 'leaf'], ['seed', 'hammer', 'clock', 'boat', 'cup'], 'seed',
      'They are all part of the same living thing.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A tree, a flower and a leaf are all plants or parts of plants.' },
       { title: 'Check the choices', text: 'Only one choice comes from a plant.' },
       { title: 'Answer', text: 'A seed is part of a plant — it is what a plant grows from.' }],
      { 1: 'A hammer is a tool.', 2: 'A clock is a machine.' }],

    ['pc-09', -2.65, ['rain', 'cloud', 'sun'], ['moon', 'shoe', 'spoon', 'nail', 'dog'], 'moon',
      'Think about where you see all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'Rain, a cloud and the sun are all up in the sky.' },
       { title: 'Check the choices', text: 'Only one choice is something you see in the sky.' },
       { title: 'Answer', text: 'The moon is in the sky.' }],
      { 4: 'A dog is an animal on the ground.' }],

    ['pc-10', -2.60, ['door', 'window', 'chair'], ['lamp', 'fish', 'cloud', 'tree', 'star'], 'lamp',
      'Think about where you would find all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A door, a window and a chair are all things you find inside a house.' },
       { title: 'Check the choices', text: 'Only one choice belongs indoors.' },
       { title: 'Answer', text: 'A lamp is found inside a house.' }],
      { 2: 'A cloud is outside in the sky.', 3: 'A tree grows outdoors.' }],

    ['pc-11', -2.50, ['ball', 'wheel', 'clock'], ['sun', 'book', 'nail', 'sock', 'chair'], 'sun',
      'Look at the shape of all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A ball, a wheel and a clock are all round.' },
       { title: 'Check the choices', text: 'Only one choice is round like a circle.' },
       { title: 'Answer', text: 'The sun is round.' }],
      { 1: 'A book has straight edges and corners.', 2: 'A nail is long and thin.' }],

    ['pc-12', -2.40, ['sun', 'lamp', 'star'], ['moon', 'cup', 'sock', 'wheel', 'paper'], 'moon',
      'What do all three do?',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'The sun, a lamp and a star all give off light.' },
       { title: 'Narrow it', text: '"Things in the sky" will not do, because a lamp is indoors. Giving light is what all three share.' },
       { title: 'Answer', text: 'The moon shines with light too.' }],
      { 3: 'A wheel is round like the sun, but it gives no light.' }],

    ['pc-13', -2.30, ['hammer', 'scissors', 'pencil'], ['key', 'apple', 'nest', 'cloud', 'fish'], 'key',
      'They are all things you hold and use.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A hammer, scissors and a pencil are all held in the hand to do a job.' },
       { title: 'Check the choices', text: 'Only one choice is a tool you hold.' },
       { title: 'Answer', text: 'A key is a small tool you hold to open a lock.' }],
      { 2: 'A nest is built by a bird.' }],

    ['pc-14', -2.20, ['banana', 'pear', 'apple'], ['egg', 'paper', 'lamp', 'wheel', 'glove'], 'egg',
      'Think about what you can do with all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A banana, a pear and an apple are all food.' },
       { title: 'Check the choices', text: 'Only one choice is something you can eat.' },
       { title: 'Answer', text: 'An egg is food.' }],
      { 1: 'Paper is for writing on.' }],

    ['pc-15', -2.10, ['chair', 'lamp', 'clock'], ['book', 'tree', 'cloud', 'fish', 'star'], 'book',
      'Think about where you would find all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A chair, a lamp and a clock are all things kept indoors.' },
       { title: 'Check the choices', text: 'Only one choice belongs inside a house.' },
       { title: 'Answer', text: 'A book is kept indoors.' }],
      { 1: 'A tree grows outside.', 4: 'A star is in the sky.' }],

    ['pc-16', -2.00, ['wheel', 'ball', 'clock'], ['moon', 'book', 'kennel', 'nail', 'sock'], 'moon',
      'Look at the shape of all three.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Name the group', text: 'A wheel, a ball and a clock are all round.' },
       { title: 'Check the choices', text: 'Only one choice has a round shape.' },
       { title: 'Answer', text: 'The moon is round.' }],
      { 1: 'A book is a rectangle.', 2: 'A kennel has straight walls and a pointed roof.' }],

    ['pc-17', -1.90, ['cup', 'bottle', 'nest'], ['kennel', 'pencil', 'leaf', 'star', 'nail'], 'kennel',
      'Each one has something kept inside it.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Look past what they are made of', text: 'A cup, a bottle and a nest are made of different things and used by different people, so the group is not about material.' },
       { title: 'Name the group', text: 'Each one holds something inside it: a drink, a drink, and eggs.' },
       { title: 'Answer', text: 'A kennel holds a dog inside it.' }],
      { 1: 'A pencil is solid; nothing is kept inside it.', 2: 'A leaf holds nothing.' }],

    ['pc-18', -1.70, ['dog', 'cat', 'chair'], ['bird', 'ball', 'cloud', 'apple', 'paper'], 'bird',
      'Count something on each one.',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Look past living and not living', text: 'Two are animals and one is furniture, so the group is not about being alive.' },
       { title: 'Name the group', text: 'A dog, a cat and a chair all have legs.' },
       { title: 'Answer', text: 'A bird has legs too.' }],
      { 1: 'A ball has no legs.', 2: 'A cloud has no legs.' }],

    ['pc-19', -1.50, ['apple', 'leaf', 'paper'], ['pear', 'nail', 'clock', 'glove', 'fish'], 'pear',
      'Where does each one come from?',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Look past what they are used for', text: 'You eat one, one grows on a branch, and one you write on — so the group is not about use.' },
       { title: 'Name the group', text: 'All three come from a tree: fruit, leaves, and paper made from wood.' },
       { title: 'Answer', text: 'A pear grows on a tree.' }],
      { 1: 'A nail is made of metal.', 3: 'A glove is made of cloth or leather.' }],

    ['pc-20', -1.30, ['door', 'window', 'book'], ['scissors', 'nail', 'star', 'apple', 'sock'], 'scissors',
      'What can you do to all three?',
      'These three go together. Point to the picture that goes with them.',
      [{ title: 'Look past where they are found', text: 'Two are parts of a house and one is something you read, so the group is not about place.' },
       { title: 'Name the group', text: 'All three open and close.' },
       { title: 'Answer', text: 'Scissors open and close.' }],
      { 1: 'A nail does not open.', 3: 'An apple does not open and close.' }]
  ];

  C.forEach(function (c) { items.push(classification.apply(null, c)); });

  // ------------------------------------------------------------- practice ---
  // Untimed examples shown before each section. They never count toward a score.

  items.push(Object.assign(analogy('pa-prac-1', -3.6, [['bird', 'nest'], ['dog', null]],
    ['kennel', 'bone', 'cat', 'tree', 'cup'], 'kennel',
    'Where does each animal live?',
    'Look at the first two pictures. A bird lives in a nest. Now look at the dog. Which picture shows where a dog lives?',
    [{ title: 'How this works', text: 'Work out how the first two pictures go together, then find the picture that goes with the third one in the same way.' },
     { title: 'This example', text: 'A bird lives in a nest, so a dog lives in a kennel.' }], {}), { practice: true }));

  items.push(Object.assign(analogy('pa-prac-2', -3.6, [['seed', 'tree'], ['egg', null]],
    ['bird', 'nest', 'fish', 'cup', 'hat'], 'bird',
    'What does each one grow into?',
    'A seed grows into a tree. Which picture shows what an egg grows into?',
    [{ title: 'Say the first pair out loud', text: 'Putting the first two pictures into a sentence makes the link easy to carry across.' },
     { title: 'This example', text: 'A seed grows into a tree, so an egg grows into a bird.' }], {}), { practice: true }));

  items.push(Object.assign(classification('pc-prac-1', -3.6, ['cat', 'dog', 'bird'],
    ['fish', 'car', 'cup', 'tree', 'hat'], 'fish',
    'They are all the same kind of living thing.',
    'Look at the three pictures at the top. They all go together in some way. Point to the picture below that goes with them.',
    [{ title: 'How this works', text: 'Find what the top three have in common, then pick the one below that shares it.' },
     { title: 'This example', text: 'A cat, a dog and a bird are all animals, so the fish belongs with them.' }], {}), { practice: true }));

  items.push(Object.assign(classification('pc-prac-2', -3.6, ['apple', 'banana', 'pear'],
    ['egg', 'shoe', 'wheel', 'lamp', 'nail'], 'egg',
    'Think about what you can do with all three.',
    'These three go together. Point to the picture that goes with them.',
    [{ title: 'Look for what they share', text: 'The three pictures at the top always have one thing in common. Name it before you choose.' },
     { title: 'This example', text: 'An apple, a banana and a pear are all food, so the egg belongs with them.' }], {}), { practice: true }));

  return { items: items };
});
