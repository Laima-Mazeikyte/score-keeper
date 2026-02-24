function getScore(playerId) {
  const el = document.getElementById(playerId + '-score');
  return el ? (parseInt(el.textContent, 10) || 0) : 0;
}

const STORAGE_KEY = 'scoreKeeper';
var MAX_PLAYERS = 12;

// Click sound: only plays if sounds/click.mp3, .ogg, or .wav is present (no fallback)
var clickAudioCtx = null;
var clickBuffer = null;
var CLICK_VOLUME = 0.35; // 0–1; lower = quieter

function getClickAudioCtx() {
  if (!clickAudioCtx) clickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return clickAudioCtx;
}

function loadClickSound() {
  var names = ['click.mp3', 'click.ogg', 'click.wav'];
  var base = (document.baseURI || window.location.href).replace(/[#?].*$/, '').replace(/\/[^/]*$/, '/');
  if (base.length && base[base.length - 1] !== '/') base += '/';
  function tryNext(i) {
    if (i >= names.length) return;
    var ctx = getClickAudioCtx();
    var url = base + 'sounds/' + names[i];
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Not found');
      return res.arrayBuffer();
    }).then(function (ab) {
      return ctx.decodeAudioData(ab);
    }).then(function (decoded) {
      clickBuffer = decoded;
      if (window.console && console.log) console.log('Click sound loaded: sounds/' + names[i]);
    }).catch(function () {
      tryNext(i + 1);
    });
  }
  tryNext(0);
}

function playClickSound() {
  if (!clickBuffer) return;
  try {
    var ctx = getClickAudioCtx();
    var masterGain = ctx.createGain();
    masterGain.gain.value = CLICK_VOLUME;
    masterGain.connect(ctx.destination);
    var src = ctx.createBufferSource();
    src.buffer = clickBuffer;
    src.connect(masterGain);
    src.start(0);
  } catch (err) {}
}
var SECONDARY_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
var DEFAULT_PLAYER_NAMES = ['Sardine Player', 'Eggplant Player', 'Cucumber Player', 'Radish Player', 'Turmeric Player', 'Lilac Player', 'Pumpkin Player', 'Pickle Player', 'Kale Player', 'Grape Player', 'Pepper Player', 'Plum Player'];

function getDefaultPlayerName(colorIndex) {
  return (colorIndex >= 1 && colorIndex <= 12) ? DEFAULT_PLAYER_NAMES[colorIndex - 1] : '';
}

function setScore(playerId, value) {
  const el = document.getElementById(playerId + '-score');
  if (el) el.textContent = Math.max(0, Math.min(9999, value));
}

function getSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

var defaultScore = 0;

function getDefaultScore() {
  return Math.max(0, defaultScore);
}

function setDefaultScore(value) {
  defaultScore = Math.max(0, parseInt(value, 10) || 0);
}

function getScoreFromCard(card) {
  const el = card.querySelector('.score');
  return el ? (parseInt(el.textContent, 10) || 0) : 0;
}

function getPlayerNameFromCard(card) {
  const el = card.querySelector('.player-name');
  if (!el) return '';
  return (el.value || '').trim();
}

function getColorIndexFromCard(card) {
  var raw = card.getAttribute('data-card-color');
  var n = parseInt(raw, 10);
  return (n >= 1 && n <= 12) ? n : null;
}

function getUsedColorIndices() {
  const container = document.getElementById('players-container');
  if (!container) return [];
  const sections = container.querySelectorAll('.player-card');
  var used = [];
  sections.forEach(function (section) {
    var idx = getColorIndexFromCard(section);
    if (idx !== null) used.push(idx);
  });
  return used;
}

function getFirstAvailableColorIndex() {
  var used = getUsedColorIndices();
  for (var i = 0; i < SECONDARY_INDICES.length; i++) {
    var idx = SECONDARY_INDICES[i];
    if (used.indexOf(idx) === -1) return idx;
  }
  return null;
}

function saveScores() {
  const container = document.getElementById('players-container');
  const sections = container.querySelectorAll('.player-card');
  const playerOrder = [];
  const scores = {};
  const names = {};
  const colorByPlayer = {};
  sections.forEach(function (section) {
    const id = section.id;
    if (!id || id.indexOf('player-') !== 0) return;
    playerOrder.push(id);
    scores[id] = getScoreFromCard(section);
    names[id] = getPlayerNameFromCard(section);
    var colorIdx = getColorIndexFromCard(section);
    if (colorIdx !== null) colorByPlayer[id] = colorIdx;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    playerOrder: playerOrder,
    scores: scores,
    names: names,
    colorByPlayer: colorByPlayer,
    defaultScore: getDefaultScore()
  }));
}

function setPlayerName(playerId, value) {
  const el = document.getElementById(playerId + '-name');
  if (!el) return;
  el.value = (value && value.trim()) ? value.trim() : '';
}

function getNextPlayerId() {
  const container = document.getElementById('players-container');
  const sections = container.querySelectorAll('.player-card');
  var max = 0;
  sections.forEach(function (section) {
    const id = section.id;
    if (id && id.indexOf('player-') === 0) {
      const n = parseInt(id.replace('player-', ''), 10);
      if (n > max) max = n;
    }
  });
  return 'player-' + (max + 1);
}

function createPlayerCard(playerId, initialScore, colorIndex) {
  var score = Math.max(0, parseInt(initialScore, 10) || 0);
  const section = document.createElement('section');
  section.id = playerId;
  section.className = 'player-card';
  var idx = (colorIndex >= 1 && colorIndex <= 12) ? colorIndex : null;
  if (idx !== null) section.setAttribute('data-card-color', String(idx));
  var defaultName = getDefaultPlayerName(idx);
  var ariaLabel = 'Player ' + playerId.replace('player-', '') + ' name';
  section.innerHTML =
    '<div class="player-name-row">' +
      '<input type="text" id="' + playerId + '-name" class="player-name" data-player="' + playerId + '" value="' + (defaultName.replace(/"/g, '&quot;')) + '" placeholder="Edit name" aria-label="' + ariaLabel + '" maxlength="30" autocomplete="off">' +
    '</div>' +
    '<div class="score-controls">' +
      '<button type="button" class="btn-secondary score-btn btn-decrement" data-player="' + playerId + '" aria-label="Decrease score">−</button>' +
      '<div id="' + playerId + '-score" class="score" contenteditable="true" data-player="' + playerId + '">' + score + '</div>' +
      '<button type="button" class="btn-secondary score-btn btn-increment" data-player="' + playerId + '" aria-label="Increase score">+</button>' +
    '</div>' +
    '<button type="button" class="btn-remove" data-player="' + playerId + '" aria-label="Remove player">Remove</button>';
  return section;
}

function getPlayerCount() {
  const container = document.getElementById('players-container');
  return container ? container.querySelectorAll('.player-card').length : 0;
}

function updateAddPlayerButtonVisibility() {
  var count = getPlayerCount();
  var atLimit = count >= MAX_PLAYERS;
  const addPlayerBtn = document.getElementById('btn-add-player');
  if (addPlayerBtn) {
    addPlayerBtn.hidden = atLimit;
    addPlayerBtn.setAttribute('aria-hidden', atLimit ? 'true' : 'false');
    addPlayerBtn.textContent = '+ Add player: ' + count;
    addPlayerBtn.setAttribute('aria-label', '+ Add player: ' + count + (atLimit ? ' (maximum reached)' : ''));
  }
  const addPlayerFooterBtn = document.getElementById('btn-add-player-footer');
  if (addPlayerFooterBtn) {
    addPlayerFooterBtn.hidden = atLimit;
    addPlayerFooterBtn.setAttribute('aria-hidden', atLimit ? 'true' : 'false');
  }
  const addPlayerFooter = document.getElementById('add-player-footer');
  if (addPlayerFooter) {
    addPlayerFooter.hidden = atLimit;
  }
  const fsBarAddPlayer = document.getElementById('fs-bar-add-player');
  if (fsBarAddPlayer) {
    fsBarAddPlayer.textContent = 'Add player: ' + count;
    fsBarAddPlayer.setAttribute('aria-label', 'Add player: ' + count + (atLimit ? ' (maximum reached)' : ''));
    fsBarAddPlayer.disabled = atLimit;
    fsBarAddPlayer.hidden = false;
    fsBarAddPlayer.setAttribute('aria-hidden', 'false');
  }
  var inFullscreen = document.body.classList.contains('fullscreen-mode');
  var noPlayers = getPlayerCount() === 0;
  if (inFullscreen && noPlayers) {
    document.body.classList.add('fullscreen-empty');
  } else {
    document.body.classList.remove('fullscreen-empty');
  }
}

function addPlayer() {
  if (getPlayerCount() >= MAX_PLAYERS) return;
  var colorIndex = getFirstAvailableColorIndex();
  if (colorIndex === null) return;
  const playerId = getNextPlayerId();
  const playersGrid = document.getElementById('players-grid');
  const card = createPlayerCard(playerId, getDefaultScore(), colorIndex);
  playersGrid.appendChild(card);
  setupPlayerNameEditingFor(card);
  setupScoreEditingFor(card);
  saveScores();
  updateAddPlayerButtonVisibility();
  // Run again after layout so grid has updated (ensures hide at 12 players)
  setTimeout(updateAddPlayerButtonVisibility, 0);
  if (document.body.classList.contains('fullscreen-mode')) updateFullscreenGridLayout();
}

function loadScores() {
  const data = getSavedState();
  const playersGrid = document.getElementById('players-grid');
  var order = ['player-1', 'player-2', 'player-3'];
  var scores = {};
  var names = {};

  var colorByPlayer = {};
  if (data) {
    order = Array.isArray(data.playerOrder) ? data.playerOrder.slice(0, MAX_PLAYERS) : order;
    scores = data.scores || {};
    names = data.names || {};
    if (data.colorByPlayer && typeof data.colorByPlayer === 'object') {
      colorByPlayer = data.colorByPlayer;
    }
    if (typeof data.defaultScore === 'number' && data.defaultScore >= 0) {
      defaultScore = data.defaultScore;
    }
    if (!Array.isArray(data.playerOrder) && (typeof data.player1 === 'number' || typeof data.player2 === 'number')) {
      if (typeof data.player1 === 'number') scores['player-1'] = data.player1;
      if (typeof data.player2 === 'number') scores['player-2'] = data.player2;
      if (typeof data.player1Name === 'string') names['player-1'] = data.player1Name;
      if (typeof data.player2Name === 'string') names['player-2'] = data.player2Name;
    }
  }

  // Rebuild all cards from saved order so every card behaves the same (no ghost cards, correct order).
  playersGrid.querySelectorAll('.player-card').forEach(function (card) {
    card.remove();
  });
  var usedColorIndices = [];
  order.forEach(function (id, indexInOrder) {
    const score = typeof scores[id] === 'number' ? scores[id] : getDefaultScore();
    var colorIndex = (colorByPlayer[id] >= 1 && colorByPlayer[id] <= 12) ? colorByPlayer[id] : null;
    if (colorIndex === null) {
      // Legacy or missing: assign first available in palette order
      for (var i = 0; i < SECONDARY_INDICES.length; i++) {
        var idx = SECONDARY_INDICES[i];
        if (usedColorIndices.indexOf(idx) === -1) {
          colorIndex = idx;
          break;
        }
      }
    }
    if (colorIndex !== null) usedColorIndices.push(colorIndex);
    const card = createPlayerCard(id, score, colorIndex);
    var nameVal = typeof names[id] === 'string' ? names[id] : '';
    if (!nameVal.trim()) nameVal = getDefaultPlayerName(colorIndex);
    var scoreVal = typeof scores[id] === 'number' ? scores[id] : score;
    var nameEl = card.querySelector('.player-name');
    var scoreEl = card.querySelector('.score');
    if (nameEl) nameEl.value = nameVal;
    if (scoreEl) scoreEl.textContent = scoreVal;
    playersGrid.appendChild(card);
    setupPlayerNameEditingFor(card);
    setupScoreEditingFor(card);
  });
  updateAddPlayerButtonVisibility();
}

function setupPlayerNameEditingFor(card) {
  const el = card.querySelector('.player-name');
  if (!el || el._nameEditingSetup) return;
  el._nameEditingSetup = true;
  const playerId = el.getAttribute('data-player');
  const row = el.closest('.player-name-row');

  function saveName() {
    const text = (el.value || '').trim();
    setPlayerName(playerId, text);
    saveScores();
    row.classList.remove('editing');
  }

  el.addEventListener('focus', function () {
    row.classList.add('editing');
    if (el.value.length > 0) {
      setTimeout(function () { el.select(); }, 0);
    }
  });
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      el.blur();
    }
  });
  el.addEventListener('blur', function () {
    saveName();
  });
}

function setupScoreEditingFor(card) {
  const el = card.querySelector('.score');
  if (!el || el._scoreEditingSetup) return;
  el._scoreEditingSetup = true;
  const playerId = el.getAttribute('data-player') || (el.id && el.id.replace('-score', ''));

  var MAX_SCORE = 9999;

  function selectAllScore() {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function commitScore() {
    var raw = (el.textContent || '').replace(/\s/g, '');
    var n = Math.max(0, Math.min(MAX_SCORE, parseInt(raw, 10) || 0));
    setScore(playerId, n);
    el.textContent = n;
    saveScores();
  }

  el.addEventListener('focus', function () {
    setTimeout(selectAllScore, 0);
  });
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitScore();
      el.blur();
      return;
    }
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      return;
    }
    if (e.key.length === 1 && /\d/.test(e.key)) {
      var text = (el.textContent || '').replace(/\D/g, '');
      var sel = window.getSelection();
      var replacing = sel.rangeCount && !sel.getRangeAt(0).collapsed;
      if (text.length >= 4 && !replacing) e.preventDefault();
    }
  });
  el.addEventListener('paste', function (e) {
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text');
    var digits = (text || '').replace(/\D/g, '').slice(0, 4);
    document.execCommand('insertText', false, digits);
  });
  el.addEventListener('blur', commitScore);
}

function showScoreFeedback(button, text) {
  const controls = button.closest('.score-controls');
  if (!controls) return;
  const span = document.createElement('span');
  span.className = 'score-feedback';
  span.textContent = text;
  var dx = (Math.random() - 0.5) * 28;
  var dy = -10 - Math.random() * 10;
  span.style.setProperty('--bump-dx', dx + 'px');
  span.style.setProperty('--bump-dy', dy + 'px');
  controls.appendChild(span);
  const ctrlRect = controls.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();
  span.style.left = (btnRect.left - ctrlRect.left + btnRect.width / 2) + 'px';
  span.style.top = (btnRect.top - ctrlRect.top - 4) + 'px';
  span.addEventListener('animationend', function () {
    span.remove();
  });
}

function setupScoreButtons() {
  document.getElementById('players-container').addEventListener('click', function (e) {
    const playerId = e.target.getAttribute('data-player');
    if (!playerId) return;
    if (e.target.classList.contains('btn-increment')) {
      playClickSound();
      setScore(playerId, getScore(playerId) + 1);
      saveScores();
      showScoreFeedback(e.target, '+1');
    } else if (e.target.classList.contains('btn-decrement')) {
      playClickSound();
      var current = getScore(playerId);
      setScore(playerId, current - 1);
      saveScores();
      if (current > 0) showScoreFeedback(e.target, '−1');
    } else if (e.target.classList.contains('btn-remove')) {
      const card = e.target.closest('.player-card');
      if (card) {
        card.remove();
        saveScores();
        updateAddPlayerButtonVisibility();
        if (document.body.classList.contains('fullscreen-mode')) {
          updateFullscreenGridLayout();
        }
      }
    }
  });
}

function resetAllScores() {
  const container = document.getElementById('players-container');
  const sections = container.querySelectorAll('.player-card');
  const base = getDefaultScore();
  sections.forEach(function (section) {
    const id = section.id;
    if (id && id.indexOf('player-') === 0) setScore(id, base);
  });
  saveScores();
}

function updateStartingScoreDisplayText() {
  const display = document.getElementById('starting-score-display');
  const input = document.getElementById('starting-score-input');
  const fsDisplay = document.getElementById('fs-starting-score-display');
  const fsInput = document.getElementById('fs-starting-score-input');
  var value = getDefaultScore();
  if (display) display.textContent = 'Starting score: ' + value;
  if (input) input.value = String(value);
  if (fsDisplay) fsDisplay.textContent = 'Starting score: ' + value;
  if (fsInput) fsInput.value = String(value);
}

function setupStartingScoreEditing() {
  const wrap = document.querySelector('.starting-score-wrap');
  const display = document.getElementById('starting-score-display');
  const input = document.getElementById('starting-score-input');
  if (!wrap || !display || !input) return;

  function commitScore() {
    var raw = (input.value || '').replace(/\D/g, '');
    var n = Math.max(0, Math.min(9999, parseInt(raw, 10) || 0));
    input.value = String(n);
    wrap.classList.remove('editing');
    input.setAttribute('hidden', '');
    if (getPlayerCount() > 0) {
      if (n !== getDefaultScore()) {
        openStartingScoreModal(n);
      }
      return;
    }
    setDefaultScore(n);
    updateStartingScoreDisplayText();
    saveScores();
  }

  function syncInputSize() {
    var len = (input.value || '').replace(/\D/g, '').length || 1;
    input.size = Math.max(1, Math.min(4, len));
  }

  function enterEditing() {
    wrap.classList.add('editing');
    input.removeAttribute('hidden');
    input.value = String(getDefaultScore());
    syncInputSize();
    input.focus();
    input.select();
  }

  display.addEventListener('click', function () {
    enterEditing();
  });

  display.addEventListener('touchstart', function () {
    if (!wrap.classList.contains('editing')) {
      enterEditing();
    }
  }, { passive: true });

  display.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      display.click();
    }
  });

  input.addEventListener('input', syncInputSize);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitScore();
      return;
    }
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
    }
    if (e.key.length === 1 && /\d/.test(e.key)) {
      var text = (input.value || '').replace(/\D/g, '') + (/\d/.test(e.key) ? e.key : '');
      if (text.length > 4) e.preventDefault();
    }
  });

  input.addEventListener('blur', commitScore);
}

/** Game night title: palette used for letter colors (no two adjacent letters same color) */
var TITLE_COLORS = ['var(--blue-200)', 'var(--secondary-5)', 'var(--secondary-7)', 'var(--secondary-11)', 'var(--secondary-6)', 'var(--secondary-8)', 'var(--secondary-4)'];

function getTitleLetterSpans() {
  var title = document.querySelector('.page-header h1.title-rainbow');
  if (!title) return { spans: [], letterIndexes: [] };
  var spans = title.querySelectorAll(':scope > span');
  var letterIndexes = [];
  var i;
  for (i = 0; i < spans.length; i++) {
    if ((spans[i].textContent || '').trim().length === 1) letterIndexes.push(i);
  }
  return { spans: spans, letterIndexes: letterIndexes };
}

function pickDifferentColor(notColors) {
  var allowed = TITLE_COLORS.filter(function (c) { return notColors.indexOf(c) === -1; });
  if (allowed.length === 0) return TITLE_COLORS[0];
  return allowed[Math.floor(Math.random() * allowed.length)];
}

function randomizeTitleColors() {
  var state = getTitleLetterSpans();
  var spans = state.spans;
  var letterIndexes = state.letterIndexes;
  if (letterIndexes.length === 0) return;
  var prevColor = null;
  var i, idx, neighborColors;
  for (i = 0; i < letterIndexes.length; i++) {
    idx = letterIndexes[i];
    neighborColors = [];
    if (prevColor !== null) neighborColors.push(prevColor);
    if (i + 1 < letterIndexes.length) neighborColors.push(spans[letterIndexes[i + 1]].style.color || '');
    prevColor = pickDifferentColor(neighborColors);
    spans[idx].style.color = prevColor;
  }
}

function changeOneTitleLetterColor() {
  var state = getTitleLetterSpans();
  var spans = state.spans;
  var letterIndexes = state.letterIndexes;
  if (letterIndexes.length === 0) return;
  var i = letterIndexes[Math.floor(Math.random() * letterIndexes.length)];
  var pos = letterIndexes.indexOf(i);
  var neighborColors = [];
  if (pos > 0) neighborColors.push(spans[letterIndexes[pos - 1]].style.color || '');
  if (pos < letterIndexes.length - 1) neighborColors.push(spans[letterIndexes[pos + 1]].style.color || '');
  var newColor = pickDifferentColor(neighborColors);
  spans[i].style.color = newColor;
}

function scheduleNextTitleColorSwitch() {
  var delay = 800 + Math.random() * 2200;
  setTimeout(function () {
    changeOneTitleLetterColor();
    scheduleNextTitleColorSwitch();
  }, delay);
}

function setupTitleColorRotation() {
  randomizeTitleColors();
  scheduleNextTitleColorSwitch();
}

var cursorX = null;
var cursorY = null;
var shadowUpdateScheduled = false;
var CARD_SHADOW_OFFSET = 10;
var SCORE_SHADOW_OFFSET = 8;

function updateCursorShadows(clientX, clientY) {
  var cards = document.querySelectorAll('.player-card');
  var i, card, scoreEl, rect, centerX, centerY, dx, dy, len, scale, sx, sy;
  var headerTitle = document.querySelector('.page-header h1');

  for (i = 0; i < cards.length; i++) {
    card = cards[i];
    rect = card.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    dx = clientX - centerX;
    dy = clientY - centerY;
    len = Math.sqrt(dx * dx + dy * dy) || 1;
    scale = CARD_SHADOW_OFFSET / len;
    sx = -dx * scale;
    sy = -dy * scale;
    card.style.setProperty('--card-shadow-x', sx + 'px');
    card.style.setProperty('--card-shadow-y', sy + 'px');

    scoreEl = card.querySelector('.score');
    if (scoreEl) {
      rect = scoreEl.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      dx = clientX - centerX;
      dy = clientY - centerY;
      len = Math.sqrt(dx * dx + dy * dy) || 1;
      scale = SCORE_SHADOW_OFFSET / len;
      sx = -dx * scale;
      sy = -dy * scale;
      scoreEl.style.setProperty('--score-shadow-x', sx + 'px');
      scoreEl.style.setProperty('--score-shadow-y', sy + 'px');
    }
  }

  if (headerTitle) {
    rect = headerTitle.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    dx = clientX - centerX;
    dy = clientY - centerY;
    len = Math.sqrt(dx * dx + dy * dy) || 1;
    scale = SCORE_SHADOW_OFFSET / len;
    sx = -dx * scale;
    sy = -dy * scale;
    headerTitle.style.setProperty('--score-shadow-x', sx + 'px');
    headerTitle.style.setProperty('--score-shadow-y', sy + 'px');
  }

  shadowUpdateScheduled = false;
}

function scheduleShadowUpdate() {
  if (shadowUpdateScheduled) return;
  shadowUpdateScheduled = true;
  requestAnimationFrame(function () {
    if (cursorX !== null && cursorY !== null) {
      updateCursorShadows(cursorX, cursorY);
    } else {
      shadowUpdateScheduled = false;
    }
  });
}

function setupCursorShadows() {
  document.addEventListener('mousemove', function (e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
    scheduleShadowUpdate();
  });

  var w = window.innerWidth;
  var h = window.innerHeight;
  updateCursorShadows(w / 2, h / 2);
}

loadScores();
updateStartingScoreDisplayText();
setupStartingScoreEditing();
loadClickSound();
setupScoreButtons();
setupCursorShadows();
setupTitleColorRotation();
function openResetModal() {
  var backdrop = document.getElementById('reset-modal-backdrop');
  var modal = document.getElementById('reset-modal');
  var cancelBtn = document.getElementById('reset-modal-cancel');
  var confirmBtn = document.getElementById('reset-modal-confirm');
  if (!backdrop || !modal) return;

  backdrop.removeAttribute('hidden');
  backdrop.setAttribute('aria-hidden', 'false');
  backdrop.setAttribute('data-open', 'true');

  cancelBtn.focus();

  function closeModal() {
    backdrop.setAttribute('data-open', 'false');
    backdrop.setAttribute('hidden', '');
    backdrop.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeydown);
    backdrop.removeEventListener('click', onBackdropClick);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  }

  function onBackdropClick(e) {
    if (e.target === backdrop) closeModal();
  }

  document.addEventListener('keydown', onKeydown);
  backdrop.addEventListener('click', onBackdropClick);

  cancelBtn.onclick = function () {
    closeModal();
  };

  confirmBtn.onclick = function () {
    closeModal();
    resetAllScores();
  };
}

function openStartingScoreModal(newValue) {
  var backdrop = document.getElementById('starting-score-modal-backdrop');
  var modal = document.getElementById('starting-score-modal');
  var titleEl = document.getElementById('starting-score-modal-title');
  var descEl = document.getElementById('starting-score-modal-desc');
  var updateBtn = document.getElementById('starting-score-modal-update');
  var leaveBtn = document.getElementById('starting-score-modal-leave');
  if (!backdrop || !modal || !descEl) return;

  if (titleEl) titleEl.textContent = 'Update scores?';
  descEl.textContent = 'Set everyone\'s score to ' + newValue + ', or keep their current scores?';

  var mainDisplay = document.getElementById('starting-score-display');
  var mainInput = document.getElementById('starting-score-input');
  var fsDisplay = document.getElementById('fs-starting-score-display');
  var fsInput = document.getElementById('fs-starting-score-input');
  if (mainDisplay) mainDisplay.textContent = 'Starting score: ' + newValue;
  if (mainInput) mainInput.value = String(newValue);
  if (fsDisplay) fsDisplay.textContent = 'Starting score: ' + newValue;
  if (fsInput) fsInput.value = String(newValue);

  backdrop.removeAttribute('hidden');
  backdrop.setAttribute('aria-hidden', 'false');
  backdrop.setAttribute('data-open', 'true');

  leaveBtn.focus();

  function closeModal() {
    backdrop.setAttribute('data-open', 'false');
    backdrop.setAttribute('hidden', '');
    backdrop.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeydown);
    backdrop.removeEventListener('click', onBackdropClick);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      setDefaultScore(newValue);
      saveScores();
      updateStartingScoreDisplayText();
    }
  }

  function onBackdropClick(e) {
    if (e.target === backdrop) {
      closeModal();
      setDefaultScore(newValue);
      saveScores();
      updateStartingScoreDisplayText();
    }
  }

  document.addEventListener('keydown', onKeydown);
  backdrop.addEventListener('click', onBackdropClick);

  leaveBtn.onclick = function () {
    closeModal();
    setDefaultScore(newValue);
    saveScores();
    updateStartingScoreDisplayText();
  };

  updateBtn.onclick = function () {
    closeModal();
    setDefaultScore(newValue);
    resetAllScores();
    saveScores();
    updateStartingScoreDisplayText();
  };
}

/* Fullscreen API vendor prefixes */
function getFullscreenElement(doc) {
  return doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || null;
}
function requestFullscreenOn(el) {
  var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  return fn ? fn.apply(el) : Promise.reject(new Error('Fullscreen not supported'));
}
function exitFullscreenOn(doc) {
  var fn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
  if (fn) fn.call(doc);
}

var FS_CARD_TALL_CLASS = 'fs-card-tall';

function clearFullscreenModeState() {
  if (!document.body.classList.contains('fullscreen-mode')) return;
  var fullscreenBtn = document.getElementById('btn-fullscreen');
  var grid = document.getElementById('players-grid');
  document.body.classList.remove('fullscreen-mode');
  document.body.classList.remove('fullscreen-empty');
  if (grid) {
    grid.style.removeProperty('--fs-cols');
    grid.style.removeProperty('--fs-rows');
    grid.querySelectorAll('.player-card').forEach(function (card) {
      card.classList.remove(FS_CARD_TALL_CLASS);
    });
  }
  if (fullscreenBtn) fullscreenBtn.focus();
}

function exitFullscreenMode() {
  if (!document.body.classList.contains('fullscreen-mode')) return;
  if (getFullscreenElement(document)) exitFullscreenOn(document);
  clearFullscreenModeState();
}

function updateFullscreenCardProportions() {
  if (!document.body.classList.contains('fullscreen-mode')) return;
  var cards = document.querySelectorAll('.players-grid .player-card');
  var i, card, rect;
  for (i = 0; i < cards.length; i++) {
    card = cards[i];
    rect = card.getBoundingClientRect();
    if (rect.height >= rect.width) {
      card.classList.add(FS_CARD_TALL_CLASS);
    } else {
      card.classList.remove(FS_CARD_TALL_CLASS);
    }
  }
}

function updateFullscreenGridLayout() {
  if (!document.body.classList.contains('fullscreen-mode')) return;
  var grid = document.getElementById('players-grid');
  if (!grid) return;
  var n = grid.querySelectorAll('.player-card').length;
  if (n <= 0) return;
  var cols = Math.ceil(Math.sqrt(n));
  var rows = Math.ceil(n / cols);
  grid.style.setProperty('--fs-cols', String(cols));
  grid.style.setProperty('--fs-rows', String(rows));
  requestAnimationFrame(function () {
    updateFullscreenCardProportions();
  });
}

function applyFullscreenLayout() {
  document.body.classList.add('fullscreen-mode');
  updateAddPlayerButtonVisibility();
  updateFullscreenGridLayout();
  var barExitBtn = document.getElementById('fs-bar-exit-fullscreen');
  if (barExitBtn) barExitBtn.focus();
}

function enterFullscreenMode() {
  var el = document.documentElement;
  requestFullscreenOn(el).then(function () {
    applyFullscreenLayout();
  }).catch(function () {
    applyFullscreenLayout();
  });
}

function setupFullscreenMode() {
  var fullscreenBtn = document.getElementById('btn-fullscreen');
  var exitBtn = document.getElementById('btn-exit-fullscreen');
  var backdrop = document.getElementById('reset-modal-backdrop');

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', function () {
      if (document.body.classList.contains('fullscreen-mode')) {
        exitFullscreenMode();
      } else {
        enterFullscreenMode();
      }
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener('click', exitFullscreenMode);
  }

  var fsTopBar = document.getElementById('fs-top-bar');
  if (fsTopBar) {
    fsTopBar.addEventListener('mouseenter', function () {
      fsTopBar.classList.add('is-visible');
    });
    fsTopBar.addEventListener('mouseleave', function () {
      fsTopBar.classList.remove('is-visible');
    });
    fsTopBar.addEventListener('focusin', function () {
      fsTopBar.classList.add('is-visible');
    });
    fsTopBar.addEventListener('focusout', function () {
      var bar = fsTopBar;
      setTimeout(function () {
        if (bar && !bar.contains(document.activeElement)) {
          bar.classList.remove('is-visible');
        }
      }, 0);
    });
  }

  var fsBottomBar = document.getElementById('fs-bottom-bar');
  if (fsBottomBar) {
    fsBottomBar.addEventListener('mouseenter', function () {
      fsBottomBar.classList.add('is-visible');
    });
    fsBottomBar.addEventListener('mouseleave', function () {
      fsBottomBar.classList.remove('is-visible');
    });
    fsBottomBar.addEventListener('focusin', function () {
      fsBottomBar.classList.add('is-visible');
    });
    fsBottomBar.addEventListener('focusout', function () {
      var bar = fsBottomBar;
      setTimeout(function () {
        if (bar && !bar.contains(document.activeElement)) {
          bar.classList.remove('is-visible');
        }
      }, 0);
    });
  }

  var fsBarExitFullscreen = document.getElementById('fs-bar-exit-fullscreen');
  if (fsBarExitFullscreen) {
    fsBarExitFullscreen.addEventListener('click', exitFullscreenMode);
  }

  var fsBarAddPlayer = document.getElementById('fs-bar-add-player');
  if (fsBarAddPlayer) {
    fsBarAddPlayer.addEventListener('click', function () {
      addPlayer();
      if (document.body.classList.contains('fullscreen-mode')) updateFullscreenGridLayout();
    });
  }

  var fsStartingScoreWrap = document.getElementById('fs-starting-score-wrap');
  var fsStartingScoreDisplay = document.getElementById('fs-starting-score-display');
  var fsStartingScoreInput = document.getElementById('fs-starting-score-input');
  if (fsStartingScoreWrap && fsStartingScoreDisplay && fsStartingScoreInput) {
    function commitFsStartingScore() {
      var raw = (fsStartingScoreInput.value || '').replace(/\D/g, '');
      var n = Math.max(0, Math.min(9999, parseInt(raw, 10) || 0));
      fsStartingScoreInput.value = String(n);
      fsStartingScoreWrap.classList.remove('editing');
      fsStartingScoreInput.setAttribute('hidden', '');
      if (getPlayerCount() > 0) {
        if (n !== getDefaultScore()) {
          openStartingScoreModal(n);
        }
        return;
      }
      setDefaultScore(n);
      updateStartingScoreDisplayText();
      saveScores();
    }
    function syncFsInputSize() {
      var len = (fsStartingScoreInput.value || '').replace(/\D/g, '').length || 1;
      fsStartingScoreInput.size = Math.max(1, Math.min(4, len));
    }
    function enterFsEditing() {
      fsStartingScoreWrap.classList.add('editing');
      fsStartingScoreInput.removeAttribute('hidden');
      fsStartingScoreInput.value = String(getDefaultScore());
      syncFsInputSize();
      fsStartingScoreInput.focus();
      fsStartingScoreInput.select();
    }

    fsStartingScoreDisplay.addEventListener('click', function () {
      enterFsEditing();
    });

    fsStartingScoreDisplay.addEventListener('touchstart', function () {
      if (!fsStartingScoreWrap.classList.contains('editing')) {
        enterFsEditing();
      }
    }, { passive: true });
    fsStartingScoreDisplay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fsStartingScoreDisplay.click();
      }
    });
    fsStartingScoreInput.addEventListener('input', syncFsInputSize);
    fsStartingScoreInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitFsStartingScore();
        return;
      }
      if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
      }
      if (e.key.length === 1 && /\d/.test(e.key)) {
        var text = (fsStartingScoreInput.value || '').replace(/\D/g, '') + (/\d/.test(e.key) ? e.key : '');
        if (text.length > 4) e.preventDefault();
      }
    });
    fsStartingScoreInput.addEventListener('blur', commitFsStartingScore);
  }

  var fsBarResetScore = document.getElementById('fs-bar-reset-score');
  if (fsBarResetScore) {
    fsBarResetScore.addEventListener('click', openResetModal);
  }

  function onFullscreenChange() {
    if (!getFullscreenElement(document) && document.body.classList.contains('fullscreen-mode')) {
      clearFullscreenModeState();
    }
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('mozfullscreenchange', onFullscreenChange);
  document.addEventListener('MSFullscreenChange', onFullscreenChange);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !document.body.classList.contains('fullscreen-mode')) return;
    if (backdrop && backdrop.getAttribute('aria-hidden') === 'false') return;
    e.preventDefault();
    exitFullscreenMode();
  });

  window.addEventListener('resize', function () {
    if (document.body.classList.contains('fullscreen-mode')) {
      requestAnimationFrame(updateFullscreenCardProportions);
    }
  });
  window.addEventListener('orientationchange', function () {
    if (document.body.classList.contains('fullscreen-mode')) {
      setTimeout(function () {
        requestAnimationFrame(updateFullscreenCardProportions);
      }, 100);
    }
  });
}

document.getElementById('btn-add-player').addEventListener('click', addPlayer);
document.getElementById('btn-add-player-footer').addEventListener('click', addPlayer);
document.getElementById('btn-reset-score').addEventListener('click', openResetModal);
setupFullscreenMode();
updateAddPlayerButtonVisibility();
