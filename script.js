function getScore(playerId) {
  const el = document.getElementById(playerId + '-score');
  return el ? (parseInt(el.textContent, 10) || 0) : 0;
}

const STORAGE_KEY = 'scoreKeeper';

function setScore(playerId, value) {
  const el = document.getElementById(playerId + '-score');
  if (el) el.textContent = Math.max(0, Math.min(9999, value));
}

const PLACEHOLDER_TEXT = '+ Add player name';

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
  const text = (el.textContent || '').trim();
  return text === '' || text === PLACEHOLDER_TEXT ? '' : text;
}

function saveScores() {
  const container = document.getElementById('players-container');
  const sections = container.querySelectorAll('.player-card');
  const playerOrder = [];
  const scores = {};
  const names = {};
  sections.forEach(function (section) {
    const id = section.id;
    if (!id || id.indexOf('player-') !== 0) return;
    playerOrder.push(id);
    scores[id] = getScoreFromCard(section);
    names[id] = getPlayerNameFromCard(section);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    playerOrder: playerOrder,
    scores: scores,
    names: names,
    defaultScore: getDefaultScore()
  }));
}

function getPlayerName(playerId) {
  const el = document.getElementById(playerId + '-name');
  if (!el) return '';
  const text = (el.textContent || '').trim();
  return text === '' || text === PLACEHOLDER_TEXT ? '' : text;
}

function setPlayerName(playerId, value) {
  const el = document.getElementById(playerId + '-name');
  if (!el) return;
  el.textContent = (value && value.trim()) ? value.trim() : '';
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

function createPlayerCard(playerId, initialScore) {
  var score = Math.max(0, parseInt(initialScore, 10) || 0);
  const section = document.createElement('section');
  section.id = playerId;
  section.className = 'player-card';
  section.innerHTML =
    '<div class="player-name-row">' +
      '<h2 id="' + playerId + '-name" class="player-name" contenteditable="true" spellcheck="false" data-player="' + playerId + '" data-placeholder="+ Add player name"></h2>' +
      '<button type="button" class="btn-save" aria-label="Save name">Save</button>' +
    '</div>' +
    '<div class="score-controls">' +
      '<button type="button" class="btn-secondary score-btn btn-decrement" data-player="' + playerId + '" aria-label="Decrease score">−</button>' +
      '<div id="' + playerId + '-score" class="score" contenteditable="true" data-player="' + playerId + '">' + score + '</div>' +
      '<button type="button" class="btn-secondary score-btn btn-increment" data-player="' + playerId + '" aria-label="Increase score">+</button>' +
    '</div>' +
    '<button type="button" class="btn-remove" data-player="' + playerId + '" aria-label="Remove player">Remove</button>';
  return section;
}

function addPlayer() {
  const playerId = getNextPlayerId();
  const container = document.getElementById('players-container');
  const addPlayerBtn = document.getElementById('btn-add-player');
  const card = createPlayerCard(playerId, getDefaultScore());
  container.insertBefore(card, addPlayerBtn);
  setupPlayerNameEditingFor(card);
  setupScoreEditingFor(card);
  saveScores();
}

function loadScores() {
  const data = getSavedState();
  const container = document.getElementById('players-container');
  const addPlayerBtn = document.getElementById('btn-add-player');
  var order = ['player-1', 'player-2'];
  var scores = {};
  var names = {};

  if (data) {
    order = Array.isArray(data.playerOrder) ? data.playerOrder : order;
    scores = data.scores || {};
    names = data.names || {};
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
  container.querySelectorAll('.player-card').forEach(function (card) {
    card.remove();
  });
  order.forEach(function (id) {
    const score = typeof scores[id] === 'number' ? scores[id] : getDefaultScore();
    const card = createPlayerCard(id, score);
    var nameVal = typeof names[id] === 'string' ? names[id] : '';
    var scoreVal = typeof scores[id] === 'number' ? scores[id] : score;
    var nameEl = card.querySelector('.player-name');
    var scoreEl = card.querySelector('.score');
    if (nameEl) nameEl.textContent = nameVal;
    if (scoreEl) scoreEl.textContent = scoreVal;
    container.insertBefore(card, addPlayerBtn);
    setupPlayerNameEditingFor(card);
    setupScoreEditingFor(card);
  });
}

function setupPlayerNameEditingFor(card) {
  const el = card.querySelector('.player-name');
  if (!el || el._nameEditingSetup) return;
  el._nameEditingSetup = true;
  const playerId = el.getAttribute('data-player');
  const row = el.closest('.player-name-row');
  const saveBtn = row && row.querySelector('.btn-save');

  function selectAllText() {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function enterEditMode() {
    row.classList.add('editing');
    var currentText = (el.textContent || '').trim();
    if (currentText === '' || currentText === PLACEHOLDER_TEXT) {
      el.textContent = '';
      el.focus();
    } else {
      setTimeout(selectAllText, 0);
    }
  }

  function exitEditMode() {
    row.classList.remove('editing');
    el.blur();
  }

  function saveName() {
    const text = (el.textContent || '').trim();
    setPlayerName(playerId, text);
    saveScores();
    exitEditMode();
  }

  el.addEventListener('focus', enterEditMode);
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    }
  });
  el.addEventListener('blur', function () {
    if (!saveBtn || saveBtn.matches(':hover')) return;
    saveName();
  });
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      saveName();
    });
  }
}

function setupPlayerNameEditing() {
  document.querySelectorAll('.player-card').forEach(function (card) {
    setupPlayerNameEditingFor(card);
  });
}

function setupScoreEditingFor(card) {
  const el = card.querySelector('.score');
  if (!el || el._scoreEditingSetup) return;
  el._scoreEditingSetup = true;
  const playerId = el.getAttribute('data-player') || (el.id && el.id.replace('-score', ''));

  var MAX_SCORE = 9999;

  function placeCaretAtEnd() {
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
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
    setTimeout(placeCaretAtEnd, 0);
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

function setupScoreEditing() {
  document.querySelectorAll('.player-card').forEach(function (card) {
    setupScoreEditingFor(card);
  });
}

function setupScoreButtons() {
  document.getElementById('players-container').addEventListener('click', function (e) {
    const playerId = e.target.getAttribute('data-player');
    if (!playerId) return;
    if (e.target.classList.contains('btn-increment')) {
      setScore(playerId, getScore(playerId) + 1);
      saveScores();
    } else if (e.target.classList.contains('btn-decrement')) {
      setScore(playerId, getScore(playerId) - 1);
      saveScores();
    } else if (e.target.classList.contains('btn-remove')) {
      const card = e.target.closest('.player-card');
      if (card) {
        card.remove();
        saveScores();
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

function showDefaultScoreRow() {
  const btn = document.getElementById('btn-set-default-score');
  const controls = document.getElementById('default-score-controls');
  const valueEl = document.getElementById('default-score-value');
  if (btn && controls && valueEl) {
    valueEl.textContent = getDefaultScore();
    btn.hidden = true;
    controls.hidden = false;
  }
}

function hideDefaultScoreControls() {
  const btn = document.getElementById('btn-set-default-score');
  const controls = document.getElementById('default-score-controls');
  if (btn && controls) {
    controls.hidden = true;
    btn.hidden = false;
  }
}

function saveDefaultScore() {
  const valueEl = document.getElementById('default-score-value');
  if (valueEl) {
    setDefaultScore(valueEl.textContent);
    hideDefaultScoreControls();
    saveScores();
  }
}

loadScores();
setupPlayerNameEditing();
setupScoreEditing();
setupScoreButtons();
document.getElementById('btn-add-player').addEventListener('click', addPlayer);
document.getElementById('btn-reset-score').addEventListener('click', resetAllScores);
document.getElementById('btn-set-default-score').addEventListener('click', showDefaultScoreRow);
document.getElementById('btn-save-default-score').addEventListener('click', saveDefaultScore);

var defaultScoreValueEl = document.getElementById('default-score-value');
document.getElementById('btn-default-minus').addEventListener('click', function () {
  var n = Math.max(0, (parseInt(defaultScoreValueEl.textContent, 10) || 0) - 1);
  defaultScoreValueEl.textContent = n;
});
document.getElementById('btn-default-plus').addEventListener('click', function () {
  var n = (parseInt(defaultScoreValueEl.textContent, 10) || 0) + 1;
  defaultScoreValueEl.textContent = n;
});
