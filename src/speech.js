/*
 * speech.js — turning an item into the words an examiner would say.
 *
 * CogAT's "Verbal" battery means reasoning *with words*; it does not mean the
 * test is spoken. Oral administration is a separate axis and it splits by level:
 *
 *   Primary levels (5/6, 7, 8 — grades K-2) are administered orally. The
 *     examiner reads the directions AND every question, because the children
 *     taking them are not yet readers. Without a script these levels are simply
 *     unusable: a written sentence-completion item is not a test of reasoning
 *     for someone who cannot read the sentence.
 *
 *   Upper levels (9 and above) have their DIRECTIONS read aloud, but the student
 *     reads the questions independently. Reading the items aloud there changes
 *     what is being measured — verbal reasoning through reading becomes listening
 *     comprehension — so the app offers it only as an explicit accommodation and
 *     records that it was used.
 *
 * Scripts are derived from the item rather than stored beside it, so they cannot
 * drift out of sync with the question. Hand-authored scripts (the picture items)
 * win where they exist, because a picture item's script has to name things the
 * markup does not.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CogatSpeech = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Symbols an examiner speaks rather than shows.
  var SPOKEN = [
    [/△/g, ' triangle '], [/□/g, ' square '], [/◻/g, ' square '], [/○/g, ' circle '],
    [/◯/g, ' circle '], [/×/g, ' times '], [/÷/g, ' divided by '], [/−/g, ' minus '],
    [/\+/g, ' plus '], [/=/g, ' equals '], [/\?/g, ' blank '], [/\(/g, ' '], [/\)/g, ' ']
  ];

  function speakSymbols(text) {
    var out = String(text);
    SPOKEN.forEach(function (rule) { out = out.replace(rule[0], rule[1]); });
    return tidy(out);
  }

  function tidy(text) {
    return String(text).replace(/\s+/g, ' ').replace(/\s+([,.?])/g, '$1').trim();
  }

  function isFigureChoice(c) { return c && typeof c === 'object' && c.fig; }

  /**
   * Read the answer choices out. A child who cannot read the question cannot
   * read the options either, so text and number choices are always spoken.
   * Figure choices are looked at, not heard — unless they carry a word label,
   * as the picture battery's do.
   */
  function choiceScript(item) {
    var choices = item.choices || [];
    if (!choices.length) return '';

    if (isFigureChoice(choices[0])) {
      var words = choices.map(function (c) { return c.word; });
      if (words.every(Boolean)) {
        return 'Your choices are: ' + words.map(function (w, i) {
          return LETTERS[i] + ', ' + w;
        }).join('. ') + '.';
      }
      // The stem for a figure item already says to choose from the pictures,
      // so there is nothing useful to add here.
      return '';
    }

    return 'Your choices are: ' + choices.map(function (c, i) {
      return LETTERS[i] + ', ' + speakSymbols(c);
    }).join('. ') + '.';
  }

  /** The spoken form of the question itself, without the choices. */
  function stemScript(item) {
    var s = item.stem;
    if (!s) return '';

    switch (s.kind) {
      case 'sentence':
        return 'Listen to this sentence. ' +
          s.text.replace('____', ' blank ').replace(/\s+/g, ' ').trim() +
          ' Which word belongs in the blank?';

      case 'analogy': {
        var a = s.pairs[0], b = s.pairs[1];
        return a[0] + ' goes with ' + a[1] + '. ' +
          'In the same way, ' + b[0] + ' goes with what?';
      }

      case 'numAnalogy': {
        var parts = s.pairs.map(function (p) {
          return p[1] === null || p[1] === '?'
            ? p[0] + ' goes with what'
            : p[0] + ' goes with ' + p[1];
        });
        return 'Listen. ' + parts.join('. ') + '?';
      }

      case 'classification':
        return 'Listen to these words: ' + s.given.join(', ') + '. ' +
          'Which word belongs with them?';

      case 'series':
        return 'Listen to these numbers: ' + s.values.join(', ') + '. ' +
          'What number comes next?';

      case 'puzzle':
        return 'Listen. ' + s.lines.map(speakSymbols).join('. ') +
          '. What number makes this true?';

      case 'matrix':
        return 'Look at the boxes. The pictures change in a certain way. ' +
          'Choose the picture that belongs in the empty box.';

      case 'figClass':
        return 'Look at the three pictures at the top. They go together in some way. ' +
          'Choose the picture that belongs with them.';

      case 'figSeq':
        return 'Look at the pictures. They show a piece of paper being folded and then punched. ' +
          'Choose the picture that shows how the paper looks when it is opened out.';

      case 'pictureAnalogy':
      case 'pictureClass':
        // These always carry a hand-written script; this is only a fallback.
        return 'Look at the pictures and choose the one that belongs.';

      default:
        return '';
    }
  }

  /**
   * The full script for an item.
   * @param {Object} item
   * @param {Object} [opts] { withChoices: boolean }
   * @returns {string} what the examiner says, or '' if nothing sensible can be said
   */
  function scriptFor(item, opts) {
    opts = opts || {};
    var withChoices = opts.withChoices !== false;

    // A hand-written script names things the markup cannot, so it wins.
    if (item.readAloud) {
      return withChoices && needsSpokenChoices(item)
        ? tidy(item.readAloud + ' ' + choiceScript(item))
        : tidy(item.readAloud);
    }

    var stem = stemScript(item);
    if (!stem) return '';
    return tidy(withChoices ? stem + ' ' + choiceScript(item) : stem);
  }

  /**
   * Picture choices carrying word labels are read out; bare figures are not,
   * because naming an abstract shape would give the answer away.
   */
  function needsSpokenChoices(item) {
    var first = (item.choices || [])[0];
    if (!first) return false;
    if (!isFigureChoice(first)) return true;
    return item.choices.every(function (c) { return c.word; });
  }

  /** Directions are read aloud at every level, not only the primary ones. */
  function directionsScript(subtestMeta) {
    if (!subtestMeta) return '';
    return tidy(subtestMeta.name + '. ' + subtestMeta.directions);
  }

  return {
    scriptFor: scriptFor,
    stemScript: stemScript,
    choiceScript: choiceScript,
    directionsScript: directionsScript,
    speakSymbols: speakSymbols,
    needsSpokenChoices: needsSpokenChoices
  };
});
