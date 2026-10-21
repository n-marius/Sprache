import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWord, words } from '../../js/lib/uk-text.js';
import { generate, generateAll, GEN_KINDS, adaptForAudio, pickDistractors } from '../../js/engine/review-gen.js';
import { mulberry32 } from '../../js/engine/util.js';
import { makeApp, setDay } from './engine-fake-app.mjs';

setDay('2026-10-21');
const app = makeApp();
const allVocab = [...app.content.vocabById.values()];
const ukKey = s => words(s).join(' ');
const deKey = s => String(s).toLowerCase().trim();

function assertUnique(list, key, msg) {
  const keys = list.map(key);
  assert.equal(new Set(keys).size, keys.length, `${msg}: Duplikate ${JSON.stringify(list)}`);
}

test('alle Arten für alle Vokabeln: vertragskonform, Index 0 richtig, keine Duplikate', () => {
  let n = 0;
  for (const v of allVocab) {
    for (let seed = 1; seed <= 5; seed++) {
      for (const art of Object.keys(GEN_KINDS)) {
        const ex = generate(app, v, art, { rng: mulberry32(seed * 31 + art.length) });
        if (!ex) continue;
        n++;
        assert.equal(ex.id, `g-${v.id}-${art}`);
        assert.equal(ex.generated, true);
        assert.ok(Array.isArray(ex.vocab) && ex.vocab[0] === v.id);
        assert.ok(ex.difficulty >= 1 && ex.difficulty <= 3);
        switch (ex.type) {
          case 'mc_translate':
            assert.ok(ex.options.length >= 3 && ex.options.length <= 4);
            if (ex.dir === 'de-uk') { assert.equal(ex.prompt, v.de); assert.equal(ex.options[0], v.uk); assertUnique(ex.options, ukKey, 'mc uk'); }
            else { assert.equal(ex.prompt, v.uk); assert.equal(ex.options[0], v.de); assertUnique(ex.options, deKey, 'mc de'); }
            break;
          case 'listening':
            assert.equal(ex.audio_uk, v.uk);
            assert.ok(ex.options.length >= 3);
            if (ex.mode === 'choose_heard') { assert.equal(ex.options[0], v.uk); assertUnique(ex.options, ukKey, 'heard'); }
            else { assert.equal(ex.mode, 'choose_meaning'); assert.equal(ex.options[0], v.de); assertUnique(ex.options, deKey, 'meaning'); }
            break;
          case 'picture_choice':
            assert.ok(v.emoji);
            assert.ok(ex.options.length >= 3 && ex.options.every(o => o.emoji && o.de));
            assert.equal(ex.options[0].emoji, v.emoji);
            assertUnique(ex.options, o => o.emoji, 'pic emoji');
            assertUnique(ex.options, o => deKey(o.de), 'pic de');
            break;
          case 'match_pairs':
            assert.ok(ex.pairs.length >= 4 && ex.pairs.length <= 5);
            assertUnique(ex.pairs, p => ukKey(p.uk), 'pairs uk');
            assertUnique(ex.pairs, p => deKey(p.de), 'pairs de');
            assert.equal(ex.vocab.length, ex.pairs.length);
            break;
          case 'build_sentence': {
            assert.ok(v.example);
            assert.ok(ex.distractors.length >= 2 && ex.distractors.length <= 4);
            if (ex.dir === 'de-uk') {
              assert.equal(ex.prompt, v.example.de); assert.equal(ex.answer, v.example.uk);
              const have = new Set(words(ex.answer));
              for (const d of ex.distractors) assert.ok(!have.has(normalizeWord(d)), `Distraktor ${d} im Satz`);
            } else {
              assert.equal(ex.prompt, v.example.uk); assert.equal(ex.answer, v.example.de);
              const have = new Set(ex.answer.toLowerCase().match(/[\p{L}’'-]+/gu));
              for (const d of ex.distractors) assert.ok(!have.has(d.toLowerCase()), `Distraktor ${d} im Satz`);
            }
            break;
          }
          case 'speak':
            assert.ok(ex.uk && ex.de);
            break;
          default: assert.fail('unerwarteter Typ ' + ex.type);
        }
      }
    }
  }
  assert.ok(n > 100);
});

test('picture_choice nur mit emoji', () => {
  const noEmoji = allVocab.find(v => !v.emoji);
  assert.ok(noEmoji);
  assert.equal(generate(app, noEmoji, 'pic'), null);
});

test('Distraktoren: gleiche Wortart bevorzugt', () => {
  const kava = app.content.vocabById.get('kava');
  const d = pickDistractors(kava, allVocab, 3, mulberry32(1));
  assert.ok(d.every(x => x.pos === 'noun'));
});

test('generateAll liefert mehrere Formen', () => {
  const kava = app.content.vocabById.get('kava');
  const types = new Set(generateAll(app, kava, { rng: mulberry32(2) }).map(e => e.type));
  for (const t of ['mc_translate', 'listening', 'picture_choice', 'match_pairs', 'build_sentence', 'speak']) assert.ok(types.has(t), t);
});

test('adaptForAudio: Hören/Sprechen aus → Textvarianten oder auslassen', () => {
  const L = app.content.getLesson('a1-1-01');
  const off = { listenOff: true, speakOff: true };
  for (const ex of L.exercises) {
    const a = adaptForAudio(app, ex, off, { rng: mulberry32(3) });
    if (ex.type === 'listening' || ex.type === 'speak') {
      if (a) { assert.notEqual(a.type, 'listening'); assert.notEqual(a.type, 'speak'); assert.equal(a.adapted, true); assert.equal(a.generated, true); assert.equal(a.id, ex.id + '~txt'); }
    } else assert.equal(a, ex);
    assert.equal(adaptForAudio(app, ex, { listenOff: false, speakOff: false }), ex);
  }
  const e09 = L.exercises.find(e => e.id === 'e09');
  const a9 = adaptForAudio(app, e09, off);
  assert.equal(a9.type, 'mc_translate'); assert.equal(a9.dir, 'uk-de'); assert.equal(a9.prompt, e09.audio_uk); assert.deepEqual(a9.options, e09.options);
  const e12 = L.exercises.find(e => e.id === 'e12');
  const a12 = adaptForAudio(app, e12, off, { rng: mulberry32(1) });
  assert.equal(a12.type, 'build_sentence'); assert.equal(a12.answer, e12.uk); assert.equal(a12.prompt, e12.de);
  const g = generate(app, app.content.vocabById.get('kava'), 'heard');
  assert.notEqual(adaptForAudio(app, g, off).type, 'listening');
});
