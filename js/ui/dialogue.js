// Inline story cues. Preserve unknown braces as literal text.
'use strict';
const DIALOGUE = (() => {
  const tags = /\{(\/?)(shout|whisper|em|beat|glitch|comm)\}/g;
  function segments(source) {
    const text = String(source), stack = [], out = [];
    let start = 0;
    for (const cue of text.matchAll(tags)) {
      const [,close,tag] = cue;
      if (cue.index>start) out.push({text:text.slice(start,cue.index),tags:[...stack]});
      if (tag==='beat' && !close) out.push({text:'',pause:260,tags:[]});
      else if (close && stack.includes(tag)) stack.splice(stack.lastIndexOf(tag),1);
      else if (!close) stack.push(tag);
      start = cue.index+cue[0].length;
    }
    if (start<text.length) out.push({text:text.slice(start),tags:[...stack]});
    return out;
  }
  const plain = source => segments(source).map(span=>span.text).join('');
  return {segments,plain};
})();
