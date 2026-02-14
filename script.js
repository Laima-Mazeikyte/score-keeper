function getScore(playerId) {
  const el = document.getElementById(playerId + '-score');
  return el ? (parseInt(el.textContent, 10) || 0) : 0;
}

const STORAGE_KEY = 'scoreKeeper';
var MAX_PLAYERS = 10;

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
  return el ? (el.value || '').trim() : '';
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

function createPlayerCard(playerId, initialScore) {
  var score = Math.max(0, parseInt(initialScore, 10) || 0);
  const section = document.createElement('section');
  section.id = playerId;
  section.className = 'player-card';
  var ariaLabel = 'Player ' + playerId.replace('player-', '') + ' name';
  section.innerHTML =
    '<div class="player-name-row">' +
      '<input type="text" id="' + playerId + '-name" class="player-name" data-player="' + playerId + '" placeholder="+ Add player name" aria-label="' + ariaLabel + '" maxlength="30" autocomplete="off">' +
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
  const addPlayerBtn = document.getElementById('btn-add-player');
  if (!addPlayerBtn) return;
  var atLimit = getPlayerCount() >= MAX_PLAYERS;
  addPlayerBtn.hidden = atLimit;
  addPlayerBtn.setAttribute('aria-hidden', atLimit ? 'true' : 'false');
}

function addPlayer() {
  if (getPlayerCount() >= MAX_PLAYERS) return;
  const playerId = getNextPlayerId();
  const container = document.getElementById('players-container');
  const addPlayerBtn = document.getElementById('btn-add-player');
  const card = createPlayerCard(playerId, getDefaultScore());
  container.insertBefore(card, addPlayerBtn);
  setupPlayerNameEditingFor(card);
  setupScoreEditingFor(card);
  saveScores();
  updateAddPlayerButtonVisibility();
  // Run again after layout so grid has updated (ensures hide at 10 players)
  setTimeout(updateAddPlayerButtonVisibility, 0);
}

function loadScores() {
  const data = getSavedState();
  const container = document.getElementById('players-container');
  const addPlayerBtn = document.getElementById('btn-add-player');
  var order = ['player-1', 'player-2'];
  var scores = {};
  var names = {};

  if (data) {
    order = Array.isArray(data.playerOrder) ? data.playerOrder.slice(0, MAX_PLAYERS) : order;
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
    if (nameEl) nameEl.value = nameVal;
    if (scoreEl) scoreEl.textContent = scoreVal;
    container.insertBefore(card, addPlayerBtn);
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
        updateAddPlayerButtonVisibility();
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

function updateStartingScoreButtonText() {
  const btn = document.getElementById('btn-set-default-score');
  if (btn) btn.textContent = 'Starting score: ' + getDefaultScore();
}

function hideDefaultScoreControls() {
  const btn = document.getElementById('btn-set-default-score');
  const controls = document.getElementById('default-score-controls');
  if (btn && controls) {
    controls.hidden = true;
    btn.hidden = false;
    updateStartingScoreButtonText();
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
updateStartingScoreButtonText();
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
