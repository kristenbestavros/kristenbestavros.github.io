// Generation takes a few hundred milliseconds, which is long enough to freeze
// the page if it runs on the main thread. It runs here instead.

import { Anagrammer } from './generator.js';

let anagrammer = null;

self.onmessage = async (event) => {
  const msg = event.data;

  try {
    if (msg.type === 'init') {
      const response = await fetch(msg.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      anagrammer = new Anagrammer(data);
      self.postMessage({ type: 'ready', attribution: data.attribution });
      return;
    }

    if (msg.type === 'generate') {
      if (!anagrammer) throw new Error('Model not loaded');
      const output = anagrammer.generate(msg.phrase, msg.options);
      self.postMessage({ type: 'results', ...output });
    }
  } catch (error) {
    self.postMessage({ type: 'failed', message: String(error.message || error) });
  }
};
