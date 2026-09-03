/*
 * verbal.js — Verbal Analogies, Sentence Completion and Verbal Classification.
 *
 * These are the verbal battery for the upper levels (9 through 17/18, grades
 * 3-12); the primary levels use pictures instead, in primary.js. Sentence
 * Completion appears on both, so its pool runs from very easy items the primary
 * levels draw on up to the hardest secondary material.
 *
 * Difficulties are on the absolute scale from levels.js: grade 3 sits at -1.0,
 * grade 6 at 0.0 and grade 12 at 0.95, so a pool spanning about -2.8 to +2.4
 * lets every level draw a form centred on its own students.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CogatVerbalBank = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var items = [];

  /** Steps may be plain strings (default titles) or [title, text] pairs. */
  function steps(list, defaults) {
    return list.map(function (s, i) {
      return Array.isArray(s)
        ? { title: s[0], text: s[1] }
        : { title: defaults[i] || defaults[defaults.length - 1], text: s };
    });
  }

  function whyByWord(choices, pairs) {
    var why = {};
    Object.keys(pairs || {}).forEach(function (word) {
      var idx = choices.indexOf(word);
      if (idx >= 0) why[idx] = pairs[word];
    });
    return why;
  }

  var VA_TITLES = ['Name the relationship', 'Keep the direction', 'Apply it'];
  var SC_TITLES = ['Read the whole sentence', 'Use the signal', 'Apply it'];
  var VC_TITLES = ['State the rule', 'Narrow it', 'Apply it'];

  /** Verbal analogy: a → b : c → ? */
  function va(id, b, pair, third, choices, answer, hint, body, why) {
    return {
      id: id, battery: 'verbal', subtest: 'verbal-analogies', b: b,
      stem: { kind: 'analogy', pairs: [pair, [third, '?']] },
      choices: choices, answer: choices.indexOf(answer),
      hint: hint, walkthrough: steps(body, VA_TITLES),
      why: whyByWord(choices, why)
    };
  }

  function sc(id, b, text, choices, answer, hint, body, why) {
    return {
      id: id, battery: 'verbal', subtest: 'sentence-completion', b: b,
      stem: { kind: 'sentence', text: text },
      choices: choices, answer: choices.indexOf(answer),
      hint: hint, walkthrough: steps(body, SC_TITLES),
      why: whyByWord(choices, why)
    };
  }

  function vc(id, b, given, choices, answer, hint, body, why) {
    return {
      id: id, battery: 'verbal', subtest: 'verbal-classification', b: b,
      stem: { kind: 'classification', given: given },
      choices: choices, answer: choices.indexOf(answer),
      hint: hint, walkthrough: steps(body, VC_TITLES),
      why: whyByWord(choices, why)
    };
  }

  // ======================================================= VERBAL ANALOGIES

  [
    va('va-01', -2.60, ['fish', 'swim'], 'bird', ['fly', 'nest', 'feather', 'sing', 'egg'], 'fly',
      'What does each animal do to get around?',
      ['A fish moves by swimming.', 'Animal first, the way it moves second.', 'A bird moves by flying.'],
      { nest: 'A nest is where a bird lives, not how it moves.', feather: 'A feather is a body part.', sing: 'Singing is something a bird does, but the pair is about moving.' }),

    va('va-02', -2.55, ['hot', 'cold'], 'big', ['small', 'huge', 'tall', 'wide', 'warm'], 'small',
      'Are the first two words alike or opposite?',
      ['Hot and cold are opposites.', 'We need the opposite of the third word.', 'The opposite of big is small.'],
      { huge: 'Huge means the same as big, not the opposite.', tall: 'Tall is about height only.', warm: 'Warm is close to hot, so it belongs with the first word.' }),

    va('va-03', -2.50, ['kitten', 'cat'], 'lamb', ['sheep', 'wool', 'farm', 'goat', 'grass'], 'sheep',
      'What does each young animal grow up to be?',
      ['A kitten is a young cat.', 'Young animal first, adult animal second.', 'A lamb grows up to be a sheep.'],
      { wool: 'Wool comes from a sheep; it is not what a lamb becomes.', goat: 'A goat is a different animal.', farm: 'A farm is where it lives.' }),

    va('va-04', -2.40, ['cub', 'bear'], 'puppy', ['kennel', 'dog', 'kitten', 'bark', 'tail'], 'dog',
      'What kind of animal grows up from each young animal?',
      ['A cub is the young form of a bear.', 'Young animal first, adult animal second.', 'A puppy grows up to be a dog.'],
      { kennel: 'A kennel is where a dog lives, not what a puppy becomes.', kitten: 'A kitten is a different young animal.', bark: 'Barking is something a dog does.' }),

    va('va-05', -2.30, ['shoe', 'foot'], 'hat', ['head', 'coat', 'hair', 'glove', 'sock'], 'head',
      'Where does each thing go on your body?',
      ['A shoe goes on your foot.', 'The clothing comes first and the body part second.', 'A hat goes on your head.'],
      { glove: 'A glove is another piece of clothing, so it matches the first word.', hair: 'Hair is on your head, but the pair asks for the body part the hat goes on.', sock: 'A sock is also clothing.' }),

    va('va-06', -2.20, ['cow', 'milk'], 'hen', ['egg', 'farm', 'feather', 'chick', 'nest'], 'egg',
      'What does each animal give us?',
      ['A cow gives us milk.', 'Animal first, what it produces second.', 'A hen gives us eggs.'],
      { chick: 'A chick is a young hen, not what a hen produces for us.', nest: 'A nest is where the egg is laid.' }),

    va('va-07', -2.10, ['teacher', 'school'], 'doctor', ['hospital', 'medicine', 'patient', 'nurse', 'illness'], 'hospital',
      'Where does each person work?',
      ['A teacher works in a school.', 'Worker first, workplace second.', 'A doctor works in a hospital.'],
      { medicine: 'Medicine is what a doctor uses.', patient: 'A patient is who a doctor helps.', nurse: 'A nurse is another worker, so it matches the first word.' }),

    va('va-08', -2.00, ['petal', 'flower'], 'page', ['library', 'read', 'book', 'cover', 'author'], 'book',
      'One of these words names a small piece of the other.',
      ['A petal is one part of a flower — a part-to-whole pair.', 'Part first, whole second.', 'A page is one part of a book.'],
      { library: 'A library holds many books; that is one step too far.', cover: 'A cover is another part, at the same level as a page.', author: 'An author makes the book.' }),

    va('va-09', -1.95, ['pen', 'write'], 'knife', ['cut', 'sharp', 'kitchen', 'fork', 'metal'], 'cut',
      'What is each tool for?',
      ['A pen is used to write.', 'Tool first, its job second.', 'A knife is used to cut.'],
      { sharp: 'Sharp describes a knife rather than saying what it does.', fork: 'A fork is another utensil.', kitchen: 'A kitchen is where it is used.' }),

    va('va-10', -1.90, ['thirsty', 'drink'], 'tired', ['sleep', 'run', 'yawn', 'bed', 'hungry'], 'sleep',
      'What do you do to fix the feeling, not what the feeling makes you do?',
      ['When you are thirsty you drink — the pair is need, then the cure.', 'Feeling first, cure second.', 'When you are tired you sleep.'],
      { yawn: 'A yawn is a sign of being tired, not the thing that fixes it.', bed: 'A bed is a place, not an action.', hungry: 'Hungry is another feeling, matching the first word.' }),

    va('va-11', -1.75, ['finger', 'hand'], 'toe', ['foot', 'leg', 'shoe', 'nail', 'arm'], 'foot',
      'Each first word is a small part of the second.',
      ['A finger is part of a hand.', 'Small part first, larger part second.', 'A toe is part of a foot.'],
      { leg: 'A leg is larger still — one level too far.', shoe: 'A shoe covers the foot but is not a body part.', nail: 'A nail is part of a toe, so it sits below it.' }),

    va('va-12', -1.65, ['bee', 'hive'], 'bird', ['nest', 'sky', 'wing', 'egg', 'song'], 'nest',
      'Where does each animal live?',
      ['A bee lives in a hive.', 'Animal first, its home second.', 'A bird lives in a nest.'],
      { sky: 'A bird flies in the sky but does not live there.', wing: 'A wing is a body part.', egg: 'An egg is laid in the nest.' }),

    va('va-13', -1.55, ['loud', 'quiet'], 'rough', ['smooth', 'bumpy', 'coarse', 'hard', 'noisy'], 'smooth',
      'Check whether the first pair means the same or the opposite.',
      ['Loud and quiet are opposites.', 'We need the opposite of the third word.', 'The opposite of rough is smooth.'],
      { bumpy: 'Bumpy is a synonym of rough.', coarse: 'Coarse also means rough.', noisy: 'Noisy matches "loud", the first word of the pair.' }),

    va('va-14', -1.45, ['seed', 'plant'], 'egg', ['bird', 'shell', 'nest', 'yolk', 'chicken'], 'bird',
      'Each first word is the starting form of the second.',
      ['A seed grows into a plant.', 'Starting form first, grown form second.', 'An egg grows into a bird.'],
      { shell: 'A shell is part of the egg.', nest: 'A nest is where the egg sits.', yolk: 'A yolk is inside the egg.' }),

    va('va-15', -1.35, ['wheel', 'car'], 'wing', ['airplane', 'bird', 'feather', 'sky', 'flight'], 'airplane',
      'Each first word is a part that makes the second thing move.',
      ['A wheel is the part of a car that lets it move.', 'Part first, the machine it belongs to second.', 'A wing is the part of an airplane that lets it fly.'],
      { bird: 'A bird has wings, but the pair is about a machine.', feather: 'A feather is part of a wing.', sky: 'The sky is where it flies.' }),

    va('va-16', -1.25, ['gigantic', 'large'], 'frigid', ['cold', 'ice', 'winter', 'warm', 'chilly'], 'cold',
      'One word is an extreme version of the other. Which direction?',
      ['"Gigantic" is an extreme form of "large" — same meaning turned all the way up.', 'Extreme word first, ordinary word second.', 'Frigid is an extreme form of cold.'],
      { ice: 'Ice is a thing that is cold, not a word meaning cold.', warm: 'Warm is the opposite; the first pair were not opposites.', chilly: 'Chilly is milder than cold, running the intensity the wrong way.' }),

    va('va-17', -1.10, ['clock', 'time'], 'thermometer', ['temperature', 'heat', 'weather', 'mercury', 'doctor'], 'temperature',
      'What does each instrument measure?',
      ['A clock measures time.', 'Instrument first, what it measures second.', 'A thermometer measures temperature.'],
      { heat: 'Heat is close, but a thermometer reads cold as well as heat; temperature covers both.', mercury: 'Mercury is what some thermometers contain.', weather: 'Weather is bigger than what one thermometer measures.' }),

    va('va-18', -0.95, ['author', 'book'], 'composer', ['symphony', 'orchestra', 'piano', 'concert', 'conductor'], 'symphony',
      'What does each person create?',
      ['An author creates a book.', 'Creator first, the work they create second.', 'A composer creates a symphony.'],
      { orchestra: 'An orchestra performs the work; it is not what the composer creates.', piano: 'A piano is an instrument.', conductor: 'A conductor leads the performance.' }),

    va('va-19', -0.75, ['carpenter', 'wood'], 'blacksmith', ['iron', 'hammer', 'forge', 'horse', 'fire'], 'iron',
      'What material does each worker shape?',
      ['A carpenter shapes wood.', 'Worker first, the material they work in second.', 'A blacksmith shapes iron.'],
      { hammer: 'A hammer is the tool, not the material.', forge: 'A forge is the workplace.', fire: 'Fire is used to heat the iron.' }),

    va('va-20', -0.60, ['herd', 'cattle'], 'flock', ['sheep', 'shepherd', 'wool', 'field', 'birds'], 'sheep',
      'Each first word names a group of the second.',
      ['A herd is a group of cattle.', 'Collective word first, the animal second.', 'A flock is a group of sheep.'],
      { shepherd: 'A shepherd looks after the flock.', wool: 'Wool comes from sheep.', birds: 'A flock of birds is also correct English, but "herd → cattle" pairs the farm animal, and sheep keeps that match.' }),

    va('va-21', -0.45, ['optimist', 'hopeful'], 'pessimist', ['gloomy', 'realist', 'cheerful', 'quiet', 'wrong'], 'gloomy',
      'The second word describes how the first kind of person feels.',
      ['An optimist is a hopeful person.', 'Person first, the outlook that defines them second.', 'A pessimist is a gloomy person, expecting the worst.'],
      { cheerful: 'Cheerful describes the optimist, not the pessimist.', realist: 'A realist is a third kind of person, not a description.' }),

    va('va-22', -0.30, ['sculptor', 'clay'], 'poet', ['words', 'poem', 'rhyme', 'paper', 'reader'], 'words',
      'What raw material does each artist work in?',
      ['A sculptor shapes clay — the raw material.', 'Artist first, raw material second.', 'A poet shapes words.'],
      { poem: 'A poem is the finished work, like the finished sculpture, not the material.', paper: 'Paper is what a poem is written on.', rhyme: 'Rhyme is one technique a poet may use.' }),

    va('va-23', -0.20, ['microscope', 'tiny'], 'telescope', ['distant', 'stars', 'lens', 'large', 'night'], 'distant',
      'The second word says what problem the tool solves.',
      ['A microscope lets you see things that are too tiny to see.', 'Tool first, the quality that makes it necessary second.', 'A telescope lets you see things that are too distant.'],
      { stars: 'Stars are one thing you look at, not the quality that makes them hard to see.', lens: 'A lens is a part of both tools.', large: 'The obstacle is distance, not size.' }),

    va('va-24', -0.05, ['reluctant', 'eager'], 'scarce', ['abundant', 'rare', 'few', 'limited', 'empty'], 'abundant',
      'Check whether the first pair means the same or the opposite.',
      ['"Reluctant" means unwilling; "eager" means very willing. They are opposites.', 'We need the opposite of "scarce".', 'The opposite of scarce is abundant.'],
      { rare: 'Rare is a synonym of scarce.', few: 'Few is on the same side of the meaning.', limited: 'Limited is another synonym.', empty: 'Empty is more extreme than scarce, not opposite to it.' }),

    va('va-25', 0.10, ['novice', 'expert'], 'sapling', ['tree', 'seed', 'leaf', 'forest', 'branch'], 'tree',
      'Both words name the same thing at two different stages.',
      ['A novice is a beginner; an expert is what that person becomes with time.', 'Early stage first, mature stage second.', 'A sapling is a young tree, so it grows into a mature tree.'],
      { seed: 'A seed comes before a sapling, running the sequence backwards.', leaf: 'A leaf is a part, not a later stage.', forest: 'A forest is many trees — a whole, not a stage.' }),

    va('va-26', 0.20, ['island', 'ocean'], 'oasis', ['desert', 'water', 'palm', 'sand', 'camel'], 'desert',
      'Each first word is a small patch surrounded by a huge amount of its opposite.',
      ['An island is a patch of land surrounded by ocean.', 'Small patch first, vast surrounding second.', 'An oasis is a patch of water and greenery surrounded by desert.'],
      { water: 'Water is what the oasis is made of, matching the wrong half.', palm: 'Palms grow in an oasis — a part, not the surroundings.', sand: 'Sand is the material of the desert, one level too narrow.' }),

    va('va-27', 0.30, ['herbivore', 'plants'], 'carnivore', ['meat', 'lion', 'hunter', 'teeth', 'prey'], 'meat',
      'What does each kind of animal eat?',
      ['A herbivore eats plants.', 'Category of eater first, the food that defines it second.', 'A carnivore eats meat.'],
      { lion: 'A lion is one example of a carnivore, not what it eats.', teeth: 'Teeth are how it eats.', prey: 'Prey is the animal hunted, but "meat" matches "plants" as the food type.' }),

    va('va-28', 0.45, ['philanthropist', 'generous'], 'miser', ['stingy', 'wealthy', 'poor', 'greedy', 'quiet'], 'stingy',
      'The second word is the quality that defines the first.',
      ['A philanthropist is defined by being generous with money.', 'Person first, defining quality second.', 'A miser is defined by being stingy — unwilling to spend.'],
      { wealthy: 'A miser may be wealthy, but that is not what makes him a miser.', greedy: 'Greedy is close, but it is about wanting more; stingy is about refusing to give, which is the exact opposite of generous.' }),

    va('va-29', 0.55, ['prologue', 'book'], 'overture', ['opera', 'music', 'orchestra', 'song', 'stage'], 'opera',
      'Each first word is the opening section of the second.',
      ['A prologue is the opening section of a book.', 'Opening section first, the whole work second.', 'An overture is the opening section of an opera.'],
      { music: 'Music is what an overture is made of, not the work it opens.', orchestra: 'An orchestra performs it.', song: 'A song is a different kind of piece.' }),

    va('va-30', 0.65, ['archipelago', 'islands'], 'constellation', ['stars', 'sky', 'planets', 'telescope', 'night'], 'stars',
      'Each first word names a group of the second.',
      ['An archipelago is a group of islands.', 'Group word first, the members second.', 'A constellation is a group of stars.'],
      { planets: 'Planets are not what a constellation is made of.', sky: 'The sky is where they are, not the members of the group.' }),

    va('va-31', 0.75, ['anarchy', 'government'], 'silence', ['sound', 'peace', 'noise', 'music', 'quiet'], 'sound',
      'The first word names the total absence of the second.',
      ['Anarchy is the complete absence of government.', 'Absence first, the thing absent second.', 'Silence is the complete absence of sound.'],
      { noise: 'Noise is one kind of sound; the absence is of sound in general.', quiet: 'Quiet is a synonym of silence, not the thing it lacks.', peace: 'Peace is a result, not the thing silence lacks.' }),

    va('va-32', 0.90, ['drought', 'rain'], 'famine', ['food', 'hunger', 'war', 'crops', 'poverty'], 'food',
      'Each first word names a damaging shortage of the second.',
      ['A drought is a damaging shortage of rain.', 'The shortage first, the thing in short supply second.', 'A famine is a damaging shortage of food.'],
      { hunger: 'Hunger is the result of a famine, not the thing that is missing.', crops: 'Failed crops are one cause; food is what is actually lacking.', poverty: 'Poverty is a related condition, not the missing thing.' }),

    va('va-33', 1.00, ['ephemeral', 'lasting'], 'trivial', ['important', 'small', 'brief', 'common', 'silly'], 'important',
      'Check the direction before you answer.',
      ['"Ephemeral" means short-lived, the opposite of lasting.', 'We need the opposite of "trivial", which means of little importance.', 'The opposite of trivial is important.'],
      { small: 'Small is close to trivial in meaning, not opposite.', brief: 'Brief matches "ephemeral", the wrong half of the pair.', common: 'Common is about frequency, not importance.' }),

    va('va-34', 1.10, ['cacophony', 'sound'], 'stench', ['smell', 'nose', 'perfume', 'rot', 'taste'], 'smell',
      'Each first word is an unpleasant extreme of the second.',
      ['A cacophony is a harsh, unpleasant sound.', 'The unpleasant extreme first, the neutral sense second.', 'A stench is a harsh, unpleasant smell.'],
      { perfume: 'Perfume is a pleasant smell — the opposite extreme.', nose: 'A nose is the organ, not the sense.', rot: 'Rot is one cause of a stench.' }),

    va('va-35', 1.20, ['gullible', 'deceive'], 'stubborn', ['persuade', 'refuse', 'argue', 'insist', 'resist'], 'persuade',
      'The second word is what is easy — or hard — to do to such a person.',
      ['A gullible person is easy to deceive.', 'The trait first, the action it makes easy second — though watch the direction.', 'A stubborn person is hard to persuade. The pairing is trait to the action it governs, and persuade is the matching verb.'],
      { refuse: 'Refusing is what the stubborn person does, not what is done to them.', resist: 'Resisting is also the stubborn person’s own action.', insist: 'Insisting is again their action rather than yours.' }),

    va('va-36', 1.30, ['arboreal', 'trees'], 'aquatic', ['water', 'fish', 'ocean', 'swim', 'boat'], 'water',
      'Each first word describes living in or among the second.',
      ['"Arboreal" describes an animal that lives in trees.', 'The describing word first, the habitat second.', '"Aquatic" describes an animal that lives in water.'],
      { fish: 'A fish is an aquatic animal, an example rather than the habitat.', ocean: 'An ocean is one body of water; aquatic covers fresh water too.', swim: 'Swimming is an action.' }),

    va('va-37', 1.40, ['penury', 'wealth'], 'obscurity', ['fame', 'darkness', 'shame', 'silence', 'failure'], 'fame',
      'Each first word names the total lack of the second.',
      ['"Penury" is extreme poverty — the absence of wealth.', 'The lack first, the thing lacked second.', '"Obscurity" is being unknown — the absence of fame.'],
      { darkness: 'Darkness plays on the other meaning of obscure; the pair is about a lack of recognition.', shame: 'Shame is a different condition.', failure: 'Obscurity is about being unknown, not about failing.' }),

    va('va-38', 1.50, ['laconic', 'words'], 'frugal', ['money', 'food', 'time', 'thrift', 'wealth'], 'money',
      'Each first word means sparing with the second.',
      ['"Laconic" means using very few words.', 'The trait first, the thing it is sparing with second.', '"Frugal" means sparing with money.'],
      { thrift: 'Thrift is the quality itself, a synonym rather than the resource.', wealth: 'Wealth is what a frugal person may accumulate, not what they are sparing with.' }),

    va('va-39', 1.60, ['sycophant', 'flatter'], 'curmudgeon', ['complain', 'praise', 'argue', 'withdraw', 'scold'], 'complain',
      'The verb names what that kind of person habitually does.',
      ['A sycophant habitually flatters people to gain favour.', 'The person first, their habitual behaviour second.', 'A curmudgeon habitually complains and grumbles.'],
      { praise: 'Praising is what the sycophant does, not the curmudgeon.', scold: 'Scolding is directed at someone; complaining is the general habit.', withdraw: 'Withdrawing is a hermit’s behaviour.' }),

    va('va-40', 1.70, ['ameliorate', 'worsen'], 'exacerbate', ['relieve', 'aggravate', 'improve', 'inflame', 'ignore'], 'relieve',
      'Check the direction carefully — both words in the pair are verbs of change.',
      ['"Ameliorate" means to make better, so its opposite is to worsen.', 'The pair is opposites, so we need the opposite of "exacerbate".', '"Exacerbate" means to make worse, so its opposite is to relieve.'],
      { aggravate: 'Aggravate is a synonym of exacerbate, not its opposite.', inflame: 'Inflame also means to make worse.', improve: 'Improve is tempting, but it pairs with "ameliorate"; relieve is the direct opposite of making a problem worse.' }),

    va('va-41', 1.80, ['iconoclast', 'tradition'], 'maverick', ['convention', 'herd', 'rules', 'leader', 'freedom'], 'convention',
      'The second word names what the first kind of person sets themselves against.',
      ['An iconoclast attacks tradition — established beliefs and customs.', 'The person first, what they defy second.', 'A maverick refuses to follow convention — accepted ways of doing things.'],
      { herd: 'A maverick was originally an unbranded calf away from the herd, but the pair asks what is defied, and that is convention.', leader: 'A leader is a person, not a thing to defy.', freedom: 'Freedom is what a maverick seeks, not what they oppose.' }),

    va('va-42', 1.90, ['obdurate', 'yield'], 'intractable', ['manage', 'obey', 'resist', 'refuse', 'persist'], 'manage',
      'Each first word describes someone who cannot be made to do the second.',
      ['"Obdurate" means stubbornly refusing to yield.', 'The trait first, the action that cannot be brought about second.', '"Intractable" means impossible to manage or control.'],
      { obey: 'Obeying is close, but intractable specifically means hard to manage or handle.', resist: 'Resisting is what the intractable person does.', persist: 'Persisting is again their own behaviour.' }),

    va('va-43', 2.00, ['nascent', 'mature'], 'inchoate', ['formed', 'vague', 'new', 'complete', 'begun'], 'formed',
      'Each pair runs from a just-begun state to a finished one.',
      ['"Nascent" means just coming into existence, the opposite of mature.', 'The beginning state first, the completed state second.', '"Inchoate" means only just begun and not yet properly formed, so its opposite is formed.'],
      { vague: 'Vague is a near-synonym of inchoate, not its opposite.', new: 'New matches "nascent", the wrong half of the pair.', begun: 'Begun is also on the starting side.' }),

    va('va-44', 2.10, ['lachrymose', 'tears'], 'garrulous', ['words', 'silence', 'anger', 'speech', 'laughter'], 'words',
      'Each first word describes producing a great deal of the second.',
      ['"Lachrymose" means tearful — given to weeping.', 'The trait first, what it produces in abundance second.', '"Garrulous" means excessively talkative — producing a flood of words.'],
      { silence: 'Silence is the opposite of what a garrulous person produces.', speech: 'Speech is close, but "words" matches "tears" as the countable thing produced in excess.', laughter: 'Laughter is a different output.' }),

    va('va-45', 2.20, ['quixotic', 'practical'], 'phlegmatic', ['excitable', 'calm', 'slow', 'sluggish', 'stubborn'], 'excitable',
      'Both pairs are opposites drawn from character description.',
      ['"Quixotic" means idealistic to the point of impracticality — the opposite of practical.', 'The pair is opposites, so we need the opposite of "phlegmatic".', '"Phlegmatic" means calm and unexcitable, so its opposite is excitable.'],
      { calm: 'Calm is a synonym of phlegmatic, not its opposite.', sluggish: 'Sluggish is also on the same side.', slow: 'Slow describes pace rather than temperament.' }),

    va('va-46', 2.30, ['ineffable', 'expressed'], 'intractable', ['managed', 'stubborn', 'difficult', 'solved', 'understood'], 'managed',
      'Each first word means "cannot be" whatever the second word says.',
      ['"Ineffable" means it cannot be expressed in words.', 'The word first, the action it rules out second.', '"Intractable" means it cannot be managed or controlled.'],
      { solved: 'Solving fits a problem, but intractable means resistant to management, not specifically to solution.', stubborn: 'Stubborn is a synonym of intractable, not the ruled-out action.', understood: 'Understanding pairs with a different word entirely.' }),

    va('va-47', 2.35, ['apex', 'nadir'], 'zenith', ['nadir', 'summit', 'peak', 'height', 'apogee'], 'nadir',
      'Both pairs are highest-point to lowest-point.',
      ['"Apex" is the highest point and "nadir" the lowest — they are opposites.', 'We need the opposite of "zenith".', '"Zenith" is the highest point, so its opposite is the nadir.'],
      { summit: 'Summit is a synonym of zenith.', peak: 'Peak also means the top.', apogee: 'Apogee is the farthest or highest point, again a synonym.' }),

    va('va-48', 2.40, ['taciturn', 'speech'], 'abstemious', ['indulgence', 'food', 'water', 'wealth', 'silence'], 'indulgence',
      'Each first word means restrained in the matter of the second.',
      ['"Taciturn" means sparing of speech — restrained in talking.', 'The trait first, what it holds back from second.', '"Abstemious" means restrained in eating and drinking — sparing of indulgence.'],
      { food: 'Food is tempting, but abstemious covers drink and pleasure too; indulgence is the general thing restrained.', silence: 'Silence is the result of being taciturn, matching the wrong half.' })
  ].forEach(function (i) { items.push(i); });

  // ===================================================== SENTENCE COMPLETION

  [
    sc('sc-01', -3.20, 'The dog wagged its ____ when it saw me.',
      ['tail', 'paw', 'nose', 'ear', 'fur'], 'tail',
      'What does a happy dog wag?',
      ['A dog shows it is happy by wagging one particular part of its body.',
       'The verb "wagged" only fits one of these.',
       'A dog wags its tail.'],
      { paw: 'A dog can raise a paw, but it does not wag one.', ear: 'Ears twitch rather than wag.' }),

    sc('sc-02', -3.10, 'Put on your coat because it is very ____ outside.',
      ['cold', 'quiet', 'tall', 'green', 'early'], 'cold',
      'Why would you need a coat?',
      ['The word "because" makes the blank the reason for putting on a coat.',
       'The reason has to be about the weather.',
       'You put on a coat because it is cold.'],
      { quiet: 'Quiet gives no reason to wear a coat.', early: 'The time of day is not a reason by itself.' }),

    sc('sc-03', -3.00, 'We use an umbrella when it is ____.',
      ['raining', 'sleeping', 'reading', 'cooking', 'singing'], 'raining',
      'When do you need an umbrella?',
      ['An umbrella keeps something off you.',
       'The blank has to name weather.',
       'We use an umbrella when it is raining.'],
      { sleeping: 'Sleeping is not weather.', cooking: 'Cooking has nothing to do with an umbrella.' }),

    sc('sc-04', -2.90, 'Birds build a ____ to lay their eggs in.',
      ['nest', 'hive', 'web', 'burrow', 'shell'], 'nest',
      'Where do birds put their eggs?',
      ['The sentence says birds build it and lay eggs in it.',
       'Different animals build different homes.',
       'Birds build a nest.'],
      { hive: 'A hive is built by bees.', web: 'A web is spun by a spider.', burrow: 'A burrow is dug by a rabbit.' }),

    sc('sc-05', -2.80, 'We use ____ to cut paper.',
      ['scissors', 'a spoon', 'a pencil', 'a cup', 'a hat'], 'scissors',
      'Which of these has blades?',
      ['The sentence names a job: cutting.',
       'Only one of these is made for cutting.',
       'We use scissors to cut paper.'],
      { 'a pencil': 'A pencil writes on paper rather than cutting it.', 'a spoon': 'A spoon has no edge to cut with.' }),

    sc('sc-06', -2.70, 'She was so ____ that she ate two whole sandwiches.',
      ['hungry', 'sleepy', 'angry', 'cold', 'busy'], 'hungry',
      'What feeling makes someone eat a lot?',
      ['"So ___ that she ate two sandwiches" means the blank caused the eating.',
       'The feeling has to be one that eating fixes.',
       'She was hungry.'],
      { sleepy: 'Sleepiness is fixed by sleeping, not eating.', busy: 'Being busy usually means eating less.' }),

    sc('sc-07', -2.60, 'The ice cream began to ____ in the hot sun.',
      ['melt', 'freeze', 'grow', 'shout', 'float'], 'melt',
      'What does heat do to ice cream?',
      ['The sentence tells you it was hot.',
       'Heat changes ice cream in one particular way.',
       'The ice cream began to melt.'],
      { freeze: 'Freezing happens in the cold, the opposite of what the sentence says.', grow: 'Ice cream does not grow.' }),

    sc('sc-08', -2.50, 'The flowers need water to ____.',
      ['grow', 'sing', 'read', 'jump', 'melt'], 'grow',
      'What does water help a plant do?',
      ['The sentence is about what water is needed for.',
       'Only one choice is something a flower does.',
       'The flowers need water to grow.'],
      { melt: 'Flowers do not melt.', sing: 'Flowers cannot sing.' }),

    sc('sc-09', -2.40, 'The baby was ____, so we spoke quietly.',
      ['sleeping', 'laughing', 'running', 'eating', 'shouting'], 'sleeping',
      'Why would you need to be quiet?',
      ['The word "so" makes the blank the reason for speaking quietly.',
       'Quiet is needed when noise would disturb someone.',
       'The baby was sleeping.'],
      { shouting: 'If the baby were shouting there would be no reason to whisper.', laughing: 'Laughing is already noisy.' }),

    sc('sc-10', -2.20, 'He climbed the ____ to reach the roof.',
      ['ladder', 'chair', 'road', 'river', 'door'], 'ladder',
      'What do you climb to get high up?',
      ['The sentence says he climbed it and reached the roof.',
       'It has to be tall enough to reach a roof.',
       'He climbed the ladder.'],
      { chair: 'A chair is not tall enough to reach a roof.', road: 'A road is not something you climb.' }),

    sc('sc-11', -2.00, 'The detective found a small ____ that helped her solve the case.',
      ['clue', 'cloak', 'clock', 'cluster', 'clash'], 'clue',
      'What does a detective look for?',
      ['Before reading the choices: she found something that helped solve the case — a piece of evidence.',
       '"Clue" is exactly that word; the others only look similar because they start with "cl".',
       'The detective found a small clue.'],
      { cloak: 'A cloak is a garment; finding one would not by itself solve a case.', cluster: 'A cluster is a group of things and needs to say a cluster of what.' }),

    sc('sc-12', -1.80, 'Because the old bridge was ____, the town had to build a new one.',
      ['crumbling', 'scenic', 'crowded', 'sturdy', 'wide'], 'crumbling',
      '"Because" means the blank has to be the reason for what follows.',
      ['"Because" links a cause to an effect: the town had to build a new bridge.',
       'What condition forces a town to replace a bridge? It must be failing.',
       '"Crumbling" describes a bridge falling apart.'],
      { scenic: 'A scenic bridge is a reason to keep it.', sturdy: 'Sturdy is the opposite of a reason to replace it.' }),

    sc('sc-13', -1.60, 'The path was so ____ that we had to walk single file.',
      ['narrow', 'wide', 'long', 'sunny', 'flat'], 'narrow',
      'Why would people have to walk one behind the other?',
      ['"So ___ that we walked single file" means the blank caused it.',
       'Walking single file happens when there is no room side by side.',
       'The path was narrow.'],
      { wide: 'A wide path is exactly what would let people walk side by side.', long: 'Length does not stop people walking abreast.' }),

    sc('sc-14', -1.40, 'The storm was ____, arriving without any warning at all.',
      ['sudden', 'gentle', 'expected', 'yearly', 'distant'], 'sudden',
      'The rest of the sentence defines the word for you.',
      ['The phrase after the comma explains the blank: it arrived without warning.',
       'A word meaning "without warning" is what is needed.',
       'The storm was sudden.'],
      { expected: 'Expected is the opposite of arriving without warning.', yearly: 'Something yearly would be anticipated.' }),

    sc('sc-15', -1.10, 'Although the recipe looked ____, it took Marcus three hours to finish.',
      ['simple', 'delicious', 'expensive', 'foreign', 'healthy'], 'simple',
      '"Although" means the two halves of the sentence must disagree.',
      ['"Although" sets up a contrast: the first half has to clash with the second.',
       'It took three hours — it was hard and slow.',
       'The contrast is "looked simple": the recipe seemed easy but was not.'],
      { delicious: 'Delicious does not clash with taking three hours.', foreign: 'Foreign might even explain the long time, so it agrees rather than contrasts.' }),

    sc('sc-16', -0.90, 'She gave a ____ account of the accident, leaving out nothing at all.',
      ['thorough', 'brief', 'confused', 'reluctant', 'cheerful'], 'thorough',
      'The phrase after the comma defines the word.',
      ['"Leaving out nothing at all" explains what kind of account it was.',
       'An account that leaves nothing out is complete and detailed.',
       'She gave a thorough account.'],
      { brief: 'Brief means short, which usually means leaving things out.', confused: 'A confused account might still leave things out.' }),

    sc('sc-17', -0.70, 'Her argument was so ____ that even the people who came to disagree ended up nodding.',
      ['persuasive', 'lengthy', 'unusual', 'quiet', 'polite'], 'persuasive',
      'The result is that opponents agreed. What quality produces that?',
      ['"So ___ that ___" means the blank is strong enough to cause the result.',
       'People who came to disagree ended up agreeing — she changed their minds.',
       '"Persuasive" is precisely the word for an argument that changes minds.'],
      { lengthy: 'Length does not change minds.', polite: 'Politeness makes people listen but does not make them agree.' }),

    sc('sc-18', -0.55, 'The old map proved ____, leading the hikers several miles off course.',
      ['unreliable', 'detailed', 'ancient', 'expensive', 'colourful'], 'unreliable',
      'What quality of a map sends people the wrong way?',
      ['The second half tells you the result: the hikers went off course.',
       'A map that misleads you cannot be trusted.',
       'The map proved unreliable.'],
      { detailed: 'A detailed map would usually help rather than mislead.', ancient: 'Age might explain it, but the sentence needs the quality itself.' }),

    sc('sc-19', -0.40, 'The volcano had been ____ for centuries, so the villagers were shocked when it erupted.',
      ['dormant', 'active', 'molten', 'ancient', 'hollow'], 'dormant',
      'What would have to be true for an eruption to be shocking?',
      ['"So" links a cause to a result: the state of the volcano caused the shock.',
       'An eruption is only shocking if the volcano seemed to be doing nothing for a very long time.',
       '"Dormant" is the exact word for a volcano that is inactive but not extinct.'],
      { active: 'If it had been active, an eruption would be expected.', ancient: 'Every volcano is ancient; that explains no shock.' }),

    sc('sc-20', -0.25, 'The evidence was ____; the jury reached its verdict in under an hour.',
      ['overwhelming', 'circumstantial', 'missing', 'disputed', 'lengthy'], 'overwhelming',
      'What kind of evidence makes a decision fast and easy?',
      ['The semicolon links the blank to its consequence: a very quick verdict.',
       'A quick verdict means the evidence left little room for doubt.',
       'The evidence was overwhelming.'],
      { disputed: 'Disputed evidence would slow a jury down.', circumstantial: 'Circumstantial evidence usually needs more deliberation, not less.' }),

    sc('sc-21', -0.10, 'The biologist’s ____ notes recorded a change in the birds that everyone else had walked straight past.',
      ['meticulous', 'hasty', 'occasional', 'reluctant', 'casual'], 'meticulous',
      'What kind of note-taking catches something everyone else missed?',
      ['Her notes caught a detail others missed, so they must have been unusually careful.',
       '"Meticulous" means extremely careful about small details.',
       'Every other choice describes sloppy or infrequent work, which would make her more likely to miss the change.'],
      { hasty: 'Hasty notes are rushed, so they would miss details.', occasional: 'Occasional notes leave gaps where the change could hide.' }),

    sc('sc-22', 0.05, 'The team’s ____ training schedule left no room for rest or recovery.',
      ['relentless', 'flexible', 'brief', 'optional', 'popular'], 'relentless',
      'What kind of schedule never lets up?',
      ['The second half says there was no room for rest at all.',
       'A schedule with no let-up is unyielding and constant.',
       'The schedule was relentless.'],
      { flexible: 'A flexible schedule would make room for rest.', optional: 'An optional schedule leaves plenty of room.' }),

    sc('sc-23', 0.20, 'He spoke with such ____ that nobody in the room doubted a word of it.',
      ['conviction', 'hesitation', 'volume', 'speed', 'humour'], 'conviction',
      'What quality of speech removes doubt?',
      ['"Such ___ that nobody doubted" means the blank caused the belief.',
       'People believe a speaker who plainly believes it themselves.',
       'He spoke with conviction.'],
      { hesitation: 'Hesitation creates doubt rather than removing it.', volume: 'Loudness does not make a claim believable.' }),

    sc('sc-24', 0.30, 'The instructions were so ____ that no two people in the room read them the same way.',
      ['ambiguous', 'detailed', 'brief', 'printed', 'illustrated'], 'ambiguous',
      'One word means "open to more than one interpretation".',
      ['No two people read them the same way — the instructions supported several meanings.',
       'The word for language that can be taken more than one way is "ambiguous".',
       '"Brief" is tempting, but shortness alone does not guarantee multiple readings; ambiguity does, by definition.'],
      { detailed: 'Detailed instructions usually reduce disagreement.', illustrated: 'Illustrations generally make instructions clearer.' }),

    sc('sc-25', 0.40, 'The findings were ____ with the theory, which is why the team published them.',
      ['consistent', 'inconsistent', 'unrelated', 'identical', 'compared'], 'consistent',
      'Would a team publish results that supported their theory, or contradicted it?',
      ['The clause "which is why the team published them" tells you the relationship was favourable.',
       'Results that agree with a theory support it.',
       'The findings were consistent with the theory.'],
      { inconsistent: 'Inconsistent findings would undercut the theory.', identical: 'Findings cannot be identical to a theory; they can agree with one.' }),

    sc('sc-26', 0.55, 'Despite the ____ conditions on the ridge, the climbers pressed on.',
      ['treacherous', 'ideal', 'mild', 'predictable', 'familiar'], 'treacherous',
      '"Despite" means the blank must work against continuing.',
      ['"Despite" signals a contrast with pressing on.',
       'To be worth the word "despite", the conditions must have been a reason to stop.',
       'The conditions were treacherous — dangerous and deceptive.'],
      { ideal: 'Ideal conditions are a reason to continue, not something to press on despite.', mild: 'Mild conditions pose no obstacle.' }),

    sc('sc-27', 0.70, 'Rather than ____ the traffic problem, the new one-way system made it noticeably worse.',
      ['alleviating', 'worsening', 'causing', 'studying', 'ignoring'], 'alleviating',
      '"Rather than X, it did the opposite" — so X is the opposite of "made it worse".',
      ['"Rather than X, Y" means Y happened instead of X, so X and Y pull in opposite directions.',
       'Y is "made it noticeably worse".',
       'The opposite of making a problem worse is easing it. "Alleviating" means to make less severe.'],
      { worsening: 'Worsening is the same as Y, but the sentence needs the opposite.', ignoring: 'Ignoring is passive; the contrast is between fixing and worsening.' }),

    sc('sc-28', 0.85, 'The politician’s answer was deliberately ____, committing her to nothing at all.',
      ['evasive', 'candid', 'detailed', 'brief', 'humorous'], 'evasive',
      'What kind of answer avoids saying anything definite?',
      ['The phrase after the comma says the answer committed her to nothing.',
       'An answer designed to avoid the question is evasive.',
       'The answer was deliberately evasive.'],
      { candid: 'Candid means frank and open — the opposite of committing to nothing.', detailed: 'A detailed answer would commit her to something.' }),

    sc('sc-29', 1.00, 'The new data served to ____ the original claim rather than to support it.',
      ['undermine', 'confirm', 'repeat', 'illustrate', 'publish'], 'undermine',
      '"Rather than to support it" tells you the direction.',
      ['The phrase "rather than to support it" sets up a contrast with supporting.',
       'The opposite of supporting a claim is weakening it.',
       '"Undermine" means to weaken the foundation of something.'],
      { confirm: 'Confirming is the same as supporting, but the sentence needs the opposite.', illustrate: 'Illustrating a claim tends to support it.' }),

    sc('sc-30', 1.10, 'The critic’s ____ review closed the play within a week of opening night.',
      ['scathing', 'glowing', 'measured', 'lengthy', 'anonymous'], 'scathing',
      'What kind of review closes a play?',
      ['The result was that the play shut down almost immediately.',
       'Only a severely negative review does that.',
       '"Scathing" means witheringly harsh.'],
      { glowing: 'A glowing review would keep a play running.', measured: 'A measured review is balanced and would not close a show.' }),

    sc('sc-31', 1.20, 'The professor’s explanation was ____, clarifying in ten minutes what the textbook had muddled for thirty pages.',
      ['lucid', 'convoluted', 'brief', 'technical', 'familiar'], 'lucid',
      'The sentence contrasts the explanation with a muddled textbook.',
      ['The explanation is set against a textbook that "muddled" the topic.',
       'The opposite of muddled is clear and easy to follow.',
       '"Lucid" means clearly expressed and easy to understand.'],
      { convoluted: 'Convoluted means twisted and hard to follow — the same as muddled.', technical: 'Technical language usually adds difficulty.' }),

    sc('sc-32', 1.35, 'A more ____ observer would have noticed the discrepancy in the accounts at once.',
      ['discerning', 'casual', 'hurried', 'generous', 'distant'], 'discerning',
      'What quality lets someone spot a subtle problem immediately?',
      ['The sentence says a different sort of observer would have caught it straight away.',
       'Catching a subtle discrepancy takes sharp judgement and attention.',
       '"Discerning" means showing good judgement and a keen eye.'],
      { casual: 'A casual observer is exactly the one who would miss it.', generous: 'Generosity is about character, not perception.' }),

    sc('sc-33', 1.45, 'The once ____ river had dwindled to a trickle you could step across.',
      ['torrential', 'shallow', 'polluted', 'winding', 'frozen'], 'torrential',
      '"Once ___ ... had dwindled" sets up a before-and-after contrast.',
      ['"Once" plus "had dwindled" contrasts what the river used to be with what it became.',
       'It became a trickle, so it must once have been the opposite: powerful and full.',
       '"Torrential" describes a river running fast and full.'],
      { shallow: 'Shallow is close to a trickle, so it fails to create the contrast.', winding: 'Winding describes shape, which does not change with volume.' }),

    sc('sc-34', 1.55, 'Her ____ for detail made her the obvious choice to lead the audit.',
      ['fastidiousness', 'indifference', 'enthusiasm', 'talent', 'reputation'], 'fastidiousness',
      'What trait makes someone the obvious auditor?',
      ['The sentence says this quality, applied to detail, qualified her to lead an audit.',
       'Auditing rewards exacting, almost fussy attention to small things.',
       '"Fastidiousness" is very great attention to accuracy and detail.'],
      { indifference: 'Indifference to detail would disqualify her.', enthusiasm: 'Enthusiasm for detail is closer, but it does not carry the exacting standard an audit needs.' }),

    sc('sc-35', 1.65, 'The company’s ____ growth alarmed even the board members who had championed the expansion.',
      ['precipitous', 'steady', 'modest', 'planned', 'welcome'], 'precipitous',
      'What kind of growth alarms its own supporters?',
      ['Even the people who wanted the expansion were alarmed.',
       'Growth becomes alarming when it is dangerously fast and steep.',
       '"Precipitous" means dangerously steep and sudden.'],
      { steady: 'Steady growth is reassuring, not alarming.', planned: 'Planned growth is what the board championed.' }),

    sc('sc-36', 1.75, 'Far from being ____, her proposal was grounded in three years of field data.',
      ['capricious', 'rigorous', 'detailed', 'expensive', 'original'], 'capricious',
      '"Far from being X" means X is the opposite of what follows.',
      ['"Far from being X, it was Y" tells you X and Y are opposites.',
       'Y is "grounded in three years of field data" — careful and evidence-based.',
       'The opposite of carefully grounded is "capricious": governed by impulse rather than reason.'],
      { rigorous: 'Rigorous means the same as grounded in data, not the opposite.', detailed: 'Detailed also agrees with the second half.' }),

    sc('sc-37', 1.90, 'He remained ____ even as the evidence against his hypothesis accumulated.',
      ['intransigent', 'persuaded', 'curious', 'uncertain', 'delighted'], 'intransigent',
      '"Even as" signals that he did not change despite good reason to.',
      ['"Even as the evidence accumulated" sets up a contrast with what you would expect.',
       'What you would expect is that he changes his mind; he did not.',
       '"Intransigent" means refusing to change one’s position.'],
      { persuaded: 'Being persuaded is exactly what the contrast rules out.', uncertain: 'Uncertainty would soften under evidence, not resist it.' }),

    sc('sc-38', 2.00, 'The treaty was ____ almost as soon as the ink had dried.',
      ['abrogated', 'ratified', 'drafted', 'translated', 'celebrated'], 'abrogated',
      'The phrase "almost as soon as the ink had dried" implies something went wrong fast.',
      ['The timing phrase suggests a reversal happening almost immediately.',
       'A treaty that is undone immediately after signing has been formally cancelled.',
       '"Abrogated" means repealed or formally set aside.'],
      { ratified: 'Ratifying is part of putting a treaty into force, which the timing phrase argues against.', drafted: 'Drafting comes before signing, not after the ink dries.' }),

    sc('sc-39', 2.10, 'The lecture proved so ____ that half the audience was asleep before the interval.',
      ['soporific', 'contentious', 'succinct', 'illuminating', 'brief'], 'soporific',
      'One of these words literally means sleep-inducing.',
      ['The result is that half the audience fell asleep.',
       'There is a single word meaning "tending to induce sleep".',
       '"Soporific" means sleep-inducing.'],
      { contentious: 'A contentious lecture would keep people awake and arguing.', illuminating: 'An illuminating lecture holds attention.' }),

    sc('sc-40', 2.20, 'The committee’s repeated ____ delayed the decision by a further eighteen months.',
      ['prevarication', 'decisiveness', 'candour', 'diligence', 'unanimity'], 'prevarication',
      'What behaviour by a committee causes long delay?',
      ['The result is a further eighteen months of delay.',
       'Delay comes from avoiding a straight answer and putting things off.',
       '"Prevarication" is speaking or acting evasively to avoid committing.'],
      { decisiveness: 'Decisiveness would shorten the delay, not extend it.', unanimity: 'Unanimity would speed the decision up.' }),

    sc('sc-41', 2.30, 'Their ____ was such that the work was finished in half the time anyone had budgeted.',
      ['alacrity', 'reluctance', 'expertise', 'caution', 'fatigue'], 'alacrity',
      'The result is unusual speed. Which word names brisk willingness?',
      ['The work finished in half the expected time.',
       'That comes from moving briskly and willingly, not merely from skill.',
       '"Alacrity" means cheerful promptness and eagerness.'],
      { reluctance: 'Reluctance would slow the work down.', caution: 'Caution generally lengthens a task.', expertise: 'Expertise is tempting, but the sentence points at the manner of working rather than the skill level.' }),

    sc('sc-42', 2.40, 'What had seemed a ____ objection turned out to rest on a genuine flaw in the proof.',
      ['captious', 'decisive', 'formal', 'written', 'welcome'], 'captious',
      'The sentence contrasts how the objection seemed with what it turned out to be.',
      ['"What had seemed X turned out to be Y" makes X and Y opposites.',
       'Y is that the objection rested on a genuine flaw — it was substantial.',
       'The opposite is an objection that seemed like mere nit-picking. "Captious" means given to trivial fault-finding.'],
      { decisive: 'Decisive agrees with resting on a genuine flaw, so it makes no contrast.', formal: 'Formality says nothing about whether the objection had substance.' })
  ].forEach(function (i) { items.push(i); });

  // ================================================== VERBAL CLASSIFICATION

  [
    vc('vc-01', -2.80, ['apple', 'banana', 'orange'], ['pear', 'carrot', 'bread', 'milk', 'chair'], 'pear',
      'They are all the same kind of food.',
      ['Apples, bananas and oranges are all fruit.', 'Not just food — fruit specifically.', 'A pear is a fruit.'],
      { carrot: 'A carrot is a vegetable.', bread: 'Bread is baked, not grown as fruit.' }),

    vc('vc-02', -2.75, ['cat', 'dog', 'horse'], ['cow', 'tree', 'car', 'rock', 'river'], 'cow',
      'They are all the same kind of living thing.',
      ['Cats, dogs and horses are all animals.', 'They are also all mammals kept by people.', 'A cow is an animal.'],
      { tree: 'A tree is a plant.', rock: 'A rock is not alive.' }),

    vc('vc-03', -2.70, ['red', 'blue', 'green'], ['yellow', 'round', 'loud', 'heavy', 'sweet'], 'yellow',
      'What kind of word are all three?',
      ['Red, blue and green are all colours.', 'The other choices describe shape, sound, weight and taste.', 'Yellow is a colour.'],
      { round: 'Round is a shape.', loud: 'Loud describes sound.' }),

    vc('vc-04', -2.65, ['Monday', 'Tuesday', 'Friday'], ['Thursday', 'March', 'winter', 'morning', 'year'], 'Thursday',
      'They are all the same unit of time.',
      ['Monday, Tuesday and Friday are all days of the week.', 'Not just times — days of the week specifically.', 'Thursday is a day of the week.'],
      { March: 'March is a month.', winter: 'Winter is a season.', morning: 'Morning is part of a day, not a day itself.' }),

    vc('vc-05', -2.60, ['car', 'bus', 'truck'], ['van', 'road', 'driver', 'wheel', 'garage'], 'van',
      'They are all the same kind of thing, not parts or places.',
      ['A car, a bus and a truck are all road vehicles.', 'The other choices are parts, people or places connected to vehicles.', 'A van is a road vehicle.'],
      { wheel: 'A wheel is a part of a vehicle.', driver: 'A driver is a person.', garage: 'A garage is where vehicles are kept.' }),

    vc('vc-06', -2.50, ['chair', 'table', 'bed'], ['desk', 'kitchen', 'wood', 'carpenter', 'house'], 'desk',
      'They are all the same kind of object.',
      ['A chair, a table and a bed are all furniture.', 'The other choices are rooms, materials, people or buildings.', 'A desk is furniture.'],
      { wood: 'Wood is what furniture is made from.', kitchen: 'A kitchen is a room.' }),

    vc('vc-07', -2.40, ['robin', 'sparrow', 'eagle'], ['hawk', 'bat', 'butterfly', 'squirrel', 'bee'], 'hawk',
      'All three are the same kind of animal, not just animals that fly.',
      ['Robins, sparrows and eagles are all birds.', '"Things that fly" would also allow bats, butterflies and bees, so the rule must be the tighter one.', 'A hawk is a bird.'],
      { bat: 'A bat flies but is a mammal.', butterfly: 'A butterfly flies but is an insect.', bee: 'A bee flies but is an insect.' }),

    vc('vc-08', -2.30, ['shirt', 'coat', 'sweater'], ['jacket', 'hanger', 'cotton', 'tailor', 'button'], 'jacket',
      'They are all worn the same way.',
      ['A shirt, a coat and a sweater are all garments worn on the upper body.', 'The other choices are accessories, materials or people.', 'A jacket is worn on the upper body.'],
      { button: 'A button is part of a garment.', cotton: 'Cotton is a material.' }),

    vc('vc-09', -2.20, ['copper', 'iron', 'silver'], ['gold', 'plastic', 'wood', 'glass', 'rubber'], 'gold',
      'Think about what all three materials are.',
      ['Copper, iron and silver are all metals.', 'They are not all coins or all magnetic — metal is the rule that covers exactly these three.', 'Gold is a metal.'],
      { plastic: 'Plastic is manufactured, not a metal.', glass: 'Glass is made from sand.' }),

    vc('vc-10', -2.00, ['hammer', 'saw', 'drill'], ['wrench', 'nail', 'wood', 'workshop', 'builder'], 'wrench',
      'They are all the same kind of thing.',
      ['A hammer, a saw and a drill are all tools.', 'The other choices are materials, places or people.', 'A wrench is a tool.'],
      { nail: 'A nail is what a tool acts on.', builder: 'A builder is a person who uses tools.' }),

    vc('vc-11', -1.80, ['rain', 'snow', 'hail'], ['sleet', 'wind', 'cloud', 'thunder', 'sun'], 'sleet',
      'All four fall out of the sky.',
      ['Rain, snow and hail are all forms of precipitation — water falling from the sky.', 'Wind and thunder are weather but do not fall; a cloud stays up.', 'Sleet is precipitation.'],
      { wind: 'Wind is weather but nothing falls.', cloud: 'A cloud stays in the sky rather than falling.' }),

    vc('vc-12', -1.70, ['triangle', 'pentagon', 'octagon'], ['hexagon', 'circle', 'sphere', 'cube', 'oval'], 'hexagon',
      'Count the sides — and notice what kind of sides they are.',
      ['All three are flat shapes made only of straight sides — polygons.', 'Circles and ovals are flat but curved; cubes and spheres are solid.', 'A hexagon is a flat six-sided polygon.'],
      { circle: 'A circle has no straight sides.', cube: 'A cube is three-dimensional.' }),

    vc('vc-13', -1.55, ['oak', 'maple', 'birch'], ['elm', 'rose', 'fern', 'moss', 'grass'], 'elm',
      'They are all the same kind of plant.',
      ['Oak, maple and birch are all trees.', 'The other choices are flowers, ferns or ground plants.', 'An elm is a tree.'],
      { rose: 'A rose is a shrub grown for flowers.', moss: 'Moss grows low to the ground.' }),

    vc('vc-14', -1.40, ['Mercury', 'Venus', 'Mars'], ['Jupiter', 'Moon', 'Sun', 'Orion', 'Halley'], 'Jupiter',
      'They all orbit the same thing.',
      ['Mercury, Venus and Mars are all planets orbiting the Sun.', 'The Moon orbits a planet, the Sun is a star, Orion is a constellation and Halley is a comet.', 'Jupiter is a planet.'],
      { Moon: 'The Moon orbits Earth, so it is a satellite rather than a planet.', Sun: 'The Sun is a star.' }),

    vc('vc-15', -1.20, ['whisper', 'shout', 'mumble'], ['murmur', 'listen', 'write', 'nod', 'read'], 'murmur',
      'Each word names a way of doing the same one thing.',
      ['Whispering, shouting and mumbling are all ways of speaking out loud.', 'They are things the speaker does, not things a listener does.', 'To murmur is to speak in a low, soft voice.'],
      { listen: 'Listening is what the audience does.', write: 'Writing communicates without any voice.' }),

    vc('vc-16', -1.00, ['novel', 'poem', 'essay'], ['memoir', 'library', 'author', 'chapter', 'publisher'], 'memoir',
      'They are all the same kind of thing, not parts or people.',
      ['A novel, a poem and an essay are all forms of written work.', 'The others are places, people or parts of a work.', 'A memoir is a form of written work.'],
      { chapter: 'A chapter is part of a work.', author: 'An author writes them.' }),

    vc('vc-17', -0.90, ['trumpet', 'flute', 'clarinet'], ['tuba', 'violin', 'drum', 'piano', 'guitar'], 'tuba',
      'How do you make each of these instruments produce a note?',
      ['A trumpet, a flute and a clarinet are all played by blowing air through them.', '"Musical instrument" is too broad — every choice would fit. Wind instrument separates them.', 'A tuba is played by blowing into it.'],
      { violin: 'A violin is played with a bow on strings.', drum: 'A drum is struck.', piano: 'A piano uses hammers on strings.' }),

    vc('vc-18', -0.80, ['brave', 'courageous', 'fearless'], ['valiant', 'timid', 'cautious', 'reckless', 'calm'], 'valiant',
      'They all describe the same quality.',
      ['Brave, courageous and fearless all mean showing courage.', 'Timid and cautious are opposites; reckless goes too far.', 'Valiant means showing courage and determination.'],
      { reckless: 'Reckless means acting without regard for danger, which is courage taken past the point of judgement.', timid: 'Timid is the opposite.' }),

    vc('vc-19', -0.70, ['spine', 'ribs', 'skull'], ['pelvis', 'heart', 'lung', 'muscle', 'skin'], 'pelvis',
      'They are all made of the same material.',
      ['The spine, the ribs and the skull are all bones of the skeleton.', 'The other choices are organs or soft tissue.', 'The pelvis is a bone.'],
      { heart: 'The heart is an organ.', muscle: 'Muscle is soft tissue.' }),

    vc('vc-20', -0.60, ['hesitate', 'pause', 'linger'], ['delay', 'rush', 'decide', 'depart', 'sprint'], 'delay',
      'All three describe the same relationship with time.',
      ['Hesitating, pausing and lingering all mean taking more time than expected.', 'Rushing and sprinting mean the opposite.', 'To delay is to put something off or make it take longer.'],
      { rush: 'Rushing means going faster.', decide: 'Deciding is about making a choice, not about time.' }),

    vc('vc-21', -0.45, ['sprint', 'dash', 'bolt'], ['dart', 'stroll', 'wander', 'limp', 'crawl'], 'dart',
      'They all describe the same speed.',
      ['Sprinting, dashing and bolting all mean moving very fast.', 'Strolling, wandering and crawling are all slow.', 'To dart is to move suddenly and quickly.'],
      { stroll: 'Strolling is slow and relaxed.', limp: 'Limping is slow and uneven.' }),

    vc('vc-22', -0.30, ['granite', 'marble', 'slate'], ['limestone', 'clay', 'oak', 'cotton', 'plaster'], 'limestone',
      'They are all one specific kind of natural material.',
      ['Granite, marble and slate are all rocks that get quarried and cut into blocks or slabs.', 'Clay is the tempting one, but clay is a soft sediment you dig and mould, not a rock you quarry.', 'Limestone is a quarried building rock.'],
      { clay: 'Clay is a soft, mouldable sediment rather than a solid rock.', plaster: 'Plaster is manufactured, not quarried.' }),

    vc('vc-23', -0.15, ['curious', 'inquisitive', 'nosy'], ['prying', 'aloof', 'bored', 'shy', 'certain'], 'prying',
      'They all describe the same appetite.',
      ['Curious, inquisitive and nosy all describe wanting to know about things.', 'The list runs from neutral to intrusive, but all share the appetite for knowing.', 'Prying means inquisitively poking into others’ affairs.'],
      { aloof: 'Aloof means uninterested and distant.', bored: 'Bored is the absence of interest.' }),

    vc('vc-24', 0.05, ['drizzle', 'downpour', 'deluge'], ['torrent', 'drought', 'breeze', 'frost', 'haze'], 'torrent',
      'They are all measures of the same thing.',
      ['Drizzle, downpour and deluge all describe falling water, from lightest to heaviest.', 'A drought is the absence of it; the others are different weather entirely.', 'A torrent is a heavy rush of water.'],
      { drought: 'A drought is the absence of rain.', breeze: 'A breeze is wind.' }),

    vc('vc-25', 0.25, ['delta', 'estuary', 'tributary'], ['meander', 'canyon', 'dune', 'glacier', 'crater'], 'meander',
      'All three are named parts of the same kind of landform system.',
      ['A delta, an estuary and a tributary are all features of a river.', '"Landform" is too broad — canyons, dunes and craters are landforms too.', 'A meander is a bend in a river’s course.'],
      { canyon: 'A canyon can be carved by a river but is a valley, not part of the river itself.', glacier: 'A glacier is a river of ice, not one of the named parts of a water river.' }),

    vc('vc-26', 0.40, ['prologue', 'epilogue', 'preface'], ['postscript', 'chapter', 'index', 'author', 'title'], 'postscript',
      'They all sit in the same position relative to the main work.',
      ['A prologue, an epilogue and a preface all sit outside the main body of a text, framing it.', 'A chapter is inside the main body; an index and a title serve other purposes.', 'A postscript is added after the main text has ended.'],
      { chapter: 'A chapter is part of the main body itself.', index: 'An index is a reference aid, not a framing section.' }),

    vc('vc-27', 0.55, ['tundra', 'savanna', 'taiga'], ['steppe', 'canyon', 'river', 'island', 'reef'], 'steppe',
      'They are all classified by the same feature.',
      ['Tundra, savanna and taiga are all biomes — large regions defined by climate and vegetation.', 'A canyon, a river, an island and a reef are landforms or features, not biomes.', 'A steppe is a biome: dry grassland.'],
      { canyon: 'A canyon is a landform, not a biome.', reef: 'A reef is a marine structure.' }),

    vc('vc-28', 0.70, ['simile', 'metaphor', 'hyperbole'], ['personification', 'paragraph', 'syllable', 'noun', 'comma'], 'personification',
      'They all do the same job in writing.',
      ['A simile, a metaphor and hyperbole are all figures of speech — non-literal devices.', 'A paragraph, a syllable, a noun and a comma are structural or grammatical units.', 'Personification is a figure of speech.'],
      { noun: 'A noun is a part of speech, not a figure of speech.', paragraph: 'A paragraph is a unit of structure.' }),

    vc('vc-29', 0.80, ['sonnet', 'haiku', 'limerick'], ['ode', 'novel', 'stanza', 'rhyme', 'poet'], 'ode',
      'They are all the same kind of thing, at the same level.',
      ['A sonnet, a haiku and a limerick are all fixed poetic forms.', 'A stanza is part of a poem, a rhyme is a device, and a poet is a person.', 'An ode is a poetic form.'],
      { stanza: 'A stanza is a part of a poem, one level below a form.', novel: 'A novel is prose, not a poetic form.' }),

    vc('vc-30', 0.95, ['amble', 'saunter', 'meander'], ['stroll', 'sprint', 'charge', 'hurry', 'lunge'], 'stroll',
      'They all describe the same manner of moving.',
      ['Ambling, sauntering and meandering all mean walking slowly and without urgency.', 'The other choices are all fast or sudden.', 'To stroll is to walk in a leisurely way.'],
      { sprint: 'Sprinting is as fast as walking gets.', hurry: 'Hurrying is the opposite of unhurried.' }),

    vc('vc-31', 1.05, ['cumulus', 'cirrus', 'stratus'], ['nimbus', 'monsoon', 'aurora', 'zephyr', 'eclipse'], 'nimbus',
      'They are all names within one classification system.',
      ['Cumulus, cirrus and stratus are all cloud types.', 'A monsoon is a wind system, an aurora is a light display, a zephyr is a breeze and an eclipse is astronomical.', 'Nimbus is a cloud type — the rain-bearing one.'],
      { monsoon: 'A monsoon is a seasonal wind, not a cloud.', aurora: 'An aurora is an atmospheric light display.' }),

    vc('vc-32', 1.15, ['covenant', 'pact', 'accord'], ['treaty', 'dispute', 'verdict', 'petition', 'decree'], 'treaty',
      'They all describe the same kind of arrangement.',
      ['A covenant, a pact and an accord are all binding agreements between parties.', 'A dispute is the opposite; a verdict, a petition and a decree are one-sided acts.', 'A treaty is a formal agreement between parties.'],
      { decree: 'A decree is imposed by one authority, not agreed between parties.', dispute: 'A dispute is a disagreement.' }),

    vc('vc-33', 1.25, ['clavicle', 'femur', 'tibia'], ['radius', 'aorta', 'cornea', 'trachea', 'cortex'], 'radius',
      'They are all made of the same material.',
      ['The clavicle, the femur and the tibia are all bones.', 'The aorta, cornea, trachea and cortex are soft tissue or organs.', 'The radius is a bone of the forearm.'],
      { aorta: 'The aorta is a blood vessel.', cortex: 'The cortex is brain tissue.' }),

    vc('vc-34', 1.40, ['quell', 'subdue', 'suppress'], ['quash', 'incite', 'provoke', 'inflame', 'release'], 'quash',
      'They all act in the same direction.',
      ['Quelling, subduing and suppressing all mean putting something down or holding it back.', 'Inciting, provoking and inflaming all do the opposite — they stir something up.', 'To quash is to put down or annul decisively.'],
      { incite: 'Inciting stirs something up rather than putting it down.', release: 'Releasing lets something go.' }),

    vc('vc-35', 1.50, ['austere', 'spartan', 'frugal'], ['ascetic', 'lavish', 'ornate', 'sumptuous', 'genial'], 'ascetic',
      'They all describe the same attitude to comfort.',
      ['Austere, spartan and frugal all describe severe plainness and doing without.', 'Lavish, ornate and sumptuous describe the opposite.', 'Ascetic describes severe self-denial.'],
      { lavish: 'Lavish means richly abundant — the opposite.', genial: 'Genial describes warmth of manner, not attitude to comfort.' }),

    vc('vc-36', 1.60, ['cacophony', 'din', 'clamour'], ['tumult', 'lull', 'hush', 'murmur', 'accord'], 'tumult',
      'They all describe the same quality of sound.',
      ['Cacophony, din and clamour all mean loud, confused, unpleasant noise.', 'A lull, a hush and a murmur are all quiet.', 'A tumult is a loud confused noise or uproar.'],
      { lull: 'A lull is a pause in noise.', murmur: 'A murmur is quiet.' }),

    vc('vc-37', 1.70, ['laud', 'extol', 'venerate'], ['exalt', 'deride', 'censure', 'malign', 'rebuke'], 'exalt',
      'They all point the same way.',
      ['To laud, extol and venerate all mean to praise or honour highly.', 'Deriding, censuring, maligning and rebuking are all forms of criticism.', 'To exalt is to praise or glorify.'],
      { deride: 'Deriding is mocking, the opposite of praising.', censure: 'Censuring is formal criticism.' }),

    vc('vc-38', 1.80, ['ephemeral', 'transient', 'fleeting'], ['evanescent', 'perpetual', 'enduring', 'abiding', 'eternal'], 'evanescent',
      'They all describe the same relationship with time.',
      ['Ephemeral, transient and fleeting all mean lasting a very short time.', 'Perpetual, enduring, abiding and eternal all mean the opposite.', 'Evanescent means quickly fading and passing out of sight.'],
      { perpetual: 'Perpetual means never-ending.', abiding: 'Abiding means lasting a long time.' }),

    vc('vc-39', 1.95, ['anhydrous', 'arid', 'parched'], ['desiccated', 'saturated', 'humid', 'sodden', 'dank'], 'desiccated',
      'They all describe the same physical state.',
      ['Anhydrous, arid and parched all mean lacking water.', 'Saturated, humid, sodden and dank all mean full of moisture.', 'Desiccated means thoroughly dried out.'],
      { saturated: 'Saturated means soaked through.', dank: 'Dank means unpleasantly damp.' }),

    vc('vc-40', 2.10, ['obstinate', 'intractable', 'recalcitrant'], ['refractory', 'pliant', 'docile', 'amenable', 'tractable'], 'refractory',
      'They all describe the same disposition.',
      ['Obstinate, intractable and recalcitrant all describe stubborn resistance to control.', 'Pliant, docile, amenable and tractable all describe the opposite — easy compliance.', 'Refractory means stubbornly resistant to authority or treatment.'],
      { tractable: 'Tractable is the direct opposite of intractable.', docile: 'Docile means easily managed.' }),

    vc('vc-41', 2.25, ['specious', 'spurious', 'fallacious'], ['sophistical', 'veracious', 'cogent', 'sound', 'valid'], 'sophistical',
      'They all describe the same defect in an argument.',
      ['Specious, spurious and fallacious all describe reasoning that is false while appearing plausible.', 'Veracious, cogent, sound and valid all describe reasoning that holds up.', 'Sophistical means using clever but fallacious argument.'],
      { cogent: 'Cogent means clear and convincing — the opposite defect.', valid: 'Valid reasoning is correct.' }),

    vc('vc-42', 2.35, ['jocular', 'droll', 'waggish'], ['facetious', 'sombre', 'dour', 'grave', 'morose'], 'facetious',
      'They all describe the same manner.',
      ['Jocular, droll and waggish all describe humour and playfulness.', 'Sombre, dour, grave and morose all describe seriousness or gloom.', 'Facetious means treating serious matters with inappropriate humour — still within the playful family.'],
      { sombre: 'Sombre is grave and serious.', morose: 'Morose is sullen and gloomy.' })
  ].forEach(function (i) { items.push(i); });

  // ------------------------------------------------------------- practice ---

  items.push(Object.assign(va('va-prac-1', -3.0, ['puppy', 'dog'], 'kitten',
    ['cat', 'milk', 'mouse', 'fur', 'basket'], 'cat',
    'What does each young animal grow up to be?',
    [['How this works', 'Work out how the first two words go together, then apply the same relationship to the third word.'],
     ['This example', 'A puppy grows up to be a dog, so a kitten grows up to be a cat.']], {}), { practice: true }));

  items.push(Object.assign(va('va-prac-2', -3.0, ['big', 'small'], 'fast',
    ['slow', 'quick', 'car', 'run', 'speed'], 'slow',
    'Are the first two words alike or opposite?',
    [['Check the relationship first', 'Before reaching for an answer, decide whether the two given words mean the same thing or opposite things.'],
     ['This example', 'Big and small are opposites, so we need the opposite of fast, which is slow.']], {}), { practice: true }));

  items.push(Object.assign(sc('sc-prac-1', -3.0, 'The bird flew back to its ____.',
    ['nest', 'shoe', 'cup', 'road', 'song'], 'nest',
    'Where does a bird live?',
    [['How this works', 'Read the whole sentence, then choose the word that makes it make sense.'],
     ['This example', 'A bird flies back to its nest.']], {}), { practice: true }));

  items.push(Object.assign(sc('sc-prac-2', -3.0, 'It was so ____ that we turned on all the lights.',
    ['dark', 'bright', 'loud', 'warm', 'early'], 'dark',
    'Why would you turn the lights on?',
    [['Read the whole sentence first', 'The words after the blank tell you what the blank has to explain — here, why the lights went on.'],
     ['This example', 'You turn lights on when it is dark.']], {}), { practice: true }));

  items.push(Object.assign(vc('vc-prac-1', -3.0, ['red', 'blue', 'green'],
    ['yellow', 'loud', 'round', 'fast', 'heavy'], 'yellow',
    'What kind of word are all three?',
    [['How this works', 'Work out what the three words have in common, then pick the choice that shares it.'],
     ['This example', 'Red, blue and green are all colours, so yellow belongs with them.']], {}), { practice: true }));

  items.push(Object.assign(vc('vc-prac-2', -3.0, ['dog', 'cat', 'horse'],
    ['cow', 'tree', 'rock', 'chair', 'cloud'], 'cow',
    'They are all the same kind of living thing.',
    [['Name the group in your head', 'Say what the three words have in common before you look at the choices.'],
     ['This example', 'A dog, a cat and a horse are all animals, so a cow belongs with them.']], {}), { practice: true }));

  return { items: items };
});
