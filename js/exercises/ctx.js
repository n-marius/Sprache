// ctx-Fabrik für Aufgaben-Komponenten (Koordinator). Wird von views/session.js und views/dev-exercise.js genutzt.
import { ukText } from '../ui/dom.js';
import { speakerButton } from '../ui/audio-button.js';
import { autoplayAllowed, isListenOff, isSpeakOff } from '../audio-mode.js';
import { mulberry32, hashStr, shuffle as shuffleArr } from '../engine/util.js';

/**
 * makeCtx(app, {lessonId, ex, onReady(bool), onComplete(result), seed})
 * → ctx laut docs/ARCHITECTURE.md
 */
export function makeCtx(app, { lessonId, ex, onReady, onComplete, seed } = {}) {
  const rng = mulberry32(seed ?? (hashStr(`${lessonId}/${ex?.id}`) ^ (Date.now() & 0xffff)));
  return {
    app,
    lessonId,
    t: app.t,
    ukText,
    speaker: (text, opts = {}) => speakerButton(text, { ...opts, autoplay: !!opts.autoplay && autoplayAllowed(app) }),
    listenOff: isListenOff(app),
    speakOff: isSpeakOff(app),
    setReady: v => onReady?.(!!v),
    complete: r => onComplete?.(r),
    rng,
    shuffle: arr => shuffleArr(arr.slice(), rng),
    settings: app.store.state.settings,
    direction: ex?.dir || null,
  };
}
