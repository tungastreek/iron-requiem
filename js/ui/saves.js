// ===== Portable campaign slots and JSON backup screens =====
'use strict';
const SAVES = (() => {
  function time(ms) { const mins = Math.floor((ms || 0) / 60000); return Math.floor(mins / 60) + 'h ' + String(mins % 60).padStart(2, '0') + 'm'; }
  function chapter(s) { const c = CHAPTERS[s.chapter]; return c ? 'Mission ' + c.num + ' · ' + c.title : 'Campaign complete'; }
  function portrait(s) {
    const pid = s.roster[0], face = pid === 'rei' && s.hero.gender === 'f' ? 'rina' : pid;
    const cv = h('canvas', { width: 80, height: 100, class: 'savePortrait', 'aria-hidden': 'true' }), ctx = cv.getContext('2d');
    const p = ASSETS.portrait(face, 'normal', 80, 100);
    if (p) ctx.drawImage(p, 0, 0); else ART.drawPortrait(ctx, PORTRAITS[face] || PORTRAITS.grunt_c, 80, 100, 'normal');
    return cv;
  }
  function openSlots(mode = 'load') {
    return UI.modal(close => {
      const card = h('div', { class: 'card savesCard' }); let pending = null, message = '';
      const render = () => {
        card.replaceChildren(h('div', { class: 'eyebrow' }, 'CAMPAIGN RECORDS'), h('h2', {}, mode === 'save' ? 'Save to a slot' : 'Load a campaign'));
        if (pending) {
          const info = GAME.slots().find(s => s.id === pending.id);
          card.append(h('p', {}, pending.kind === 'delete' ? 'Delete ' + info.label + '? This removes that saved copy. Your current campaign and other slots stay available.' : 'Replace ' + info.label + ' with your current campaign?'),
            h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { pending = null; render(); } }, 'Keep existing save'), h('button', { class: 'btn ' + (pending.kind === 'delete' ? 'danger' : 'primary'), onclick: () => {
              if (pending.kind === 'delete') { const ok = GAME.deleteSlot(pending.id); message = ok ? info.label + ' deleted.' : 'Removed from this page. Browser storage is blocked, so an older copy may return after reopening.'; }
              else { const ok = GAME.saveSlot(pending.id); message = ok ? 'Saved to ' + info.label + '.' : 'Saved in this page only. Export a backup before closing.'; }
              pending = null; render();
            } }, pending.kind === 'delete' ? 'Delete saved copy' : 'Replace save')));
          return;
        }
        card.append(h('p', { class: 'muted small' }, 'Three manual slots and one autosave. Loading resumes at the chapter briefing. Continue chooses the most recently saved campaign.'));
        if (message) card.append(h('p', { class: 'saveMessage', role: 'status' }, message));
        const list = h('div', { class: 'saveSlots' });
        for (const info of GAME.slots()) {
          const s = info.save, row = h('article', { class: 'saveSlot' });
          if (s) row.append(portrait(s));
          const copy = h('div', { class: 'saveInfo' }, h('h3', {}, info.label), h('b', {}, s ? chapter(s) : info.corrupt ? 'Unreadable save' : 'Empty slot'));
          if (s) copy.append(h('p', {}, s.hero.name + ' · ' + time(s.meta.playtime)), h('p', { class: 'muted small' }, s.meta.savedAt ? new Date(s.meta.savedAt).toLocaleString() : 'Earlier save · timestamp unavailable'));
          else if (info.corrupt) copy.append(h('p', { class: 'muted small' }, info.error));
          const actions = h('div', { class: 'saveActions' });
          if (mode === 'save' && info.id !== 'auto') actions.append(h('button', { class: 'btn primary', onclick: () => { if (s || info.corrupt) { pending = { kind: 'save', id: info.id }; render(); } else { const ok = GAME.saveSlot(info.id); message = ok ? 'Saved to ' + info.label + '.' : 'Saved in this page only. Export a backup before closing.'; render(); } } }, s ? 'Replace' : 'Save here'));
          if (mode === 'load' && s) actions.append(h('button', { class: 'btn primary', onclick: () => { try { GAME.loadSlot(info.id); close(); } catch (e) { message = e.message; render(); } } }, 'Load'));
          if (s || info.corrupt) actions.append(h('button', { class: 'btn sm danger', onclick: () => { pending = { kind: 'delete', id: info.id }; render(); } }, 'Delete'));
          row.append(copy, actions); list.append(row);
        }
        card.append(list, h('div', { class: 'row saveFooter' }, h('button', { class: 'btn', onclick: () => { close(); openExport(); } }, 'Export current'), h('button', { class: 'btn', onclick: () => { close(); openImport(); } }, 'Import JSON'), h('button', { class: 'btn', onclick: () => close() }, 'Close')));
      }; render(); return card;
    }, 'saveModal');
  }
  function openExport() {
    return UI.modal(close => {
      const text = h('textarea', { class: 'saveJSON', readonly: 'readonly', spellcheck: 'false', 'aria-label': 'Exported campaign JSON' }, GAME.exportJSON());
      const status = h('p', { class: 'saveMessage', role: 'status' });
      return h('div', { class: 'card savesCard' }, h('div', { class: 'eyebrow' }, 'PORTABLE BACKUP'), h('h2', {}, 'Export campaign'), h('p', {}, 'Copy this JSON into a text file. It includes your roster, choices, upgrades and skill progress. You can import it in another folder or browser.'), text, status,
        h('div', { class: 'row saveFooter' }, h('button', { class: 'btn primary', onclick: async () => {
          try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text.value); status.textContent = 'Campaign JSON copied.'; }
          catch (e) { text.focus(); text.select(); status.textContent = 'JSON selected. Press Ctrl+C or Command+C to copy it.'; }
        } }, 'Copy JSON'), h('button', { class: 'btn', onclick: () => close() }, 'Close')));
    }, 'saveModal');
  }
  function openImport() {
    return UI.modal(close => {
      const text = h('textarea', { class: 'saveJSON', spellcheck: 'false', placeholder: 'Paste an Iron Requiem save here', 'aria-label': 'Campaign JSON to import' });
      const status = h('p', { class: 'saveMessage', role: 'alert' });
      return h('div', { class: 'card savesCard' }, h('div', { class: 'eyebrow' }, 'RESTORE A BACKUP'), h('h2', {}, 'Import campaign'), h('p', {}, 'Paste a save exported by Iron Requiem. Version 1 saves are upgraded automatically. Import replaces the current autosave; the three manual slots are preserved.'), text, status,
        h('div', { class: 'row saveFooter' }, h('button', { class: 'btn primary', onclick: () => { try { GAME.importJSON(text.value); close(); UI.toast('Campaign imported.'); } catch (e) { status.textContent = e.message; } } }, 'Load pasted save'), h('button', { class: 'btn', onclick: () => close() }, 'Cancel')));
    }, 'saveModal');
  }
  return { openLoad: () => openSlots('load'), openSave: () => openSlots('save'), openExport, openImport };
})();
