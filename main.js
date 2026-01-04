const manifestPath = './souls/index.json';
const logLimit = 80;

const defaultStats = {
  hunger: 78,
  energy: 82,
  mood: 80,
};

const state = {
  souls: [],
  currentSoul: null,
  stats: { ...defaultStats },
  tickId: null,
};

const logEntries = document.getElementById('logEntries');
const soulList = document.getElementById('soulList');
const randomSoulButton = document.getElementById('randomSoul');
const uploadInput = document.getElementById('soulUpload');
const actionButtons = Array.from(document.querySelectorAll('[data-action]'));

const nameEl = document.getElementById('trenchyName');
const pronounsEl = document.getElementById('trenchyPronouns');
const loreEl = document.getElementById('trenchyLore');
const vibeEl = document.getElementById('trenchyVibe');
const favoriteEl = document.getElementById('trenchyFavorite');
const traitTags = document.getElementById('traitTags');

const hungerBar = document.getElementById('hungerBar');
const energyBar = document.getElementById('energyBar');
const moodBar = document.getElementById('moodBar');

const hungerValue = document.getElementById('hungerValue');
const energyValue = document.getElementById('energyValue');
const moodValue = document.getElementById('moodValue');

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function timestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function logEvent(type, text) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const meta = document.createElement('div');
  meta.className = 'log-entry__meta';
  meta.innerHTML = `<span>${type}</span><span>${timestamp()}</span>`;
  entry.appendChild(meta);

  const body = document.createElement('p');
  body.className = 'log-entry__text';
  body.textContent = text;
  entry.appendChild(body);

  logEntries.prepend(entry);
  while (logEntries.children.length > logLimit) {
    logEntries.removeChild(logEntries.lastChild);
  }
}

function renderSoulCards() {
  soulList.innerHTML = '';
  state.souls.forEach((soul) => {
    const card = document.createElement('article');
    card.className = 'soul-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.dataset.id = soul.id;

    const title = document.createElement('div');
    title.className = 'soul-card__title';
    title.innerHTML = `<h3>${soul.name}</h3><span class="tag">${soul.pronouns}</span>`;

    const blurb = document.createElement('p');
    blurb.textContent = soul.vibe;

    card.appendChild(title);
    card.appendChild(blurb);

    card.addEventListener('click', () => selectSoul(soul.id));
    card.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectSoul(soul.id);
      }
    });

    soulList.appendChild(card);
  });
}

function renderTraits(traits) {
  traitTags.innerHTML = '';
  traits.forEach((trait) => {
    const span = document.createElement('span');
    span.className = 'trait';
    span.textContent = trait;
    traitTags.appendChild(span);
  });
}

function renderStats() {
  const { hunger, energy, mood } = state.stats;
  hungerBar.style.width = `${hunger}%`;
  energyBar.style.width = `${energy}%`;
  moodBar.style.width = `${mood}%`;

  hungerValue.textContent = `${Math.round(hunger)}/100`;
  energyValue.textContent = `${Math.round(energy)}/100`;
  moodValue.textContent = `${Math.round(mood)}/100`;
}

function applySoulToUI(soul) {
  nameEl.textContent = soul.name;
  pronounsEl.textContent = soul.pronouns;
  loreEl.textContent = soul.backstory;
  vibeEl.textContent = soul.vibe;
  favoriteEl.textContent = soul.favorite;
  renderTraits(soul.traits);
}

function buildStats(soul) {
  const base = { ...defaultStats };
  if (soul.baseline) {
    base.hunger = soul.baseline.hunger ?? base.hunger;
    base.energy = soul.baseline.energy ?? base.energy;
    base.mood = soul.baseline.mood ?? base.mood;
  }
  return base;
}

function resetTick() {
  if (state.tickId) {
    clearInterval(state.tickId);
  }
  state.tickId = setInterval(() => tickNeeds(), 4500);
}

function tickNeeds() {
  if (!state.currentSoul) return;
  const { needs } = state.currentSoul;
  state.stats.hunger = clamp(state.stats.hunger - (needs.hungerRate ?? 2.8));
  state.stats.energy = clamp(state.stats.energy - (needs.energyRate ?? 2.1));
  state.stats.mood = clamp(state.stats.mood - (needs.moodRate ?? 1.9));
  renderStats();

  const anyLow = [];
  if (state.stats.hunger < 35) anyLow.push('is starving for energy');
  if (state.stats.energy < 35) anyLow.push('is running out of steam');
  if (state.stats.mood < 35) anyLow.push('feels ignored');

  if (anyLow.length > 0) {
    const warning = `${state.currentSoul.name} ${anyLow.join(', ')}.`;
    logEvent('Need', warning);
    const response = pickResponse('tick', warning);
    if (response) logEvent('Soul', response);
  }
}

function pickResponse(kind, context) {
  if (!state.currentSoul) return '';
  const bucket = state.currentSoul.responses?.[kind];
  if (!bucket || bucket.length === 0) return '';

  const choice = bucket[Math.floor(Math.random() * bucket.length)];
  return choice.replace(/\{context\}/g, context);
}

function adjustMood(action, delta) {
  const affinity = state.currentSoul?.needs?.moodAffinity?.[action] ?? 0;
  state.stats.mood = clamp(state.stats.mood + delta + affinity);
}

function performAction(action) {
  if (!state.currentSoul) {
    logEvent('System', 'Choose a trenchy first.');
    return;
  }

  switch (action) {
    case 'feed':
      state.stats.hunger = clamp(state.stats.hunger + 20);
      adjustMood('feed', 6);
      logEvent('Action', `You fed ${state.currentSoul.name} ${state.currentSoul.favorite}.`);
      break;
    case 'play':
      state.stats.mood = clamp(state.stats.mood + 12);
      state.stats.energy = clamp(state.stats.energy - 6);
      adjustMood('play', 8);
      logEvent('Action', `You played a quick game with ${state.currentSoul.name}.`);
      break;
    case 'rest':
      state.stats.energy = clamp(state.stats.energy + 22);
      state.stats.mood = clamp(state.stats.mood + 4);
      adjustMood('rest', 4);
      logEvent('Action', `${state.currentSoul.name} took a restorative nap.`);
      break;
    case 'talk':
      adjustMood('talk', 10);
      logEvent('Action', `You opened a soul channel with ${state.currentSoul.name}.`);
      break;
    default:
      break;
  }

  const response = pickResponse(action, action);
  if (response) logEvent('Soul', response);
  renderStats();
}

function selectSoul(id) {
  const soul = state.souls.find((entry) => entry.id === id);
  if (!soul) return;
  state.currentSoul = soul;
  state.stats = buildStats(soul);
  applySoulToUI(soul);
  renderStats();
  logEvent('Adopted', `${soul.name} has connected. Their soul file influences hunger, energy, and mood.`);
  const intro = pickResponse('introduce', soul.vibe);
  if (intro) logEvent('Soul', intro);
  resetTick();
}

async function loadManifestedSouls() {
  const response = await fetch(manifestPath);
  const manifest = await response.json();
  const souls = await Promise.all(
    manifest.souls.map(async (file) => {
      const res = await fetch(`./souls/${file}`);
      return res.json();
    })
  );
  state.souls = souls;
  renderSoulCards();
}

function handleRandomSoul() {
  if (state.souls.length === 0) return;
  const randomIndex = Math.floor(Math.random() * state.souls.length);
  const soul = state.souls[randomIndex];
  selectSoul(soul.id);
}

function addCustomSoul(soul) {
  const id = soul.id || `custom-${crypto.randomUUID()}`;
  const normalized = {
    id,
    name: soul.name || 'Nameless',
    pronouns: soul.pronouns || 'they/them',
    traits: soul.traits || ['curious'],
    vibe: soul.vibe || 'Undefined vibes, eager to be shaped.',
    favorite: soul.favorite || 'mystery snack',
    backstory: soul.backstory || 'An emerging presence from the trench.',
    baseline: soul.baseline || { ...defaultStats },
    needs: {
      hungerRate: soul?.needs?.hungerRate ?? 3,
      energyRate: soul?.needs?.energyRate ?? 2.4,
      moodRate: soul?.needs?.moodRate ?? 2,
      moodAffinity: soul?.needs?.moodAffinity || {},
    },
    responses: soul.responses || {
      introduce: ['Hello from the depths. I am still learning how to be me.'],
    },
  };

  state.souls.push(normalized);
  renderSoulCards();
  selectSoul(normalized.id);
  logEvent('Import', `Loaded custom soul: ${normalized.name}.`);
}

function handleUpload(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      addCustomSoul(parsed);
    } catch (error) {
      logEvent('Error', 'Soul file was not valid JSON.');
    }
    uploadInput.value = '';
  };
  reader.readAsText(file);
}

function bindActions() {
  actionButtons.forEach((button) => {
    button.addEventListener('click', () => performAction(button.dataset.action));
  });
  randomSoulButton.addEventListener('click', handleRandomSoul);
  uploadInput.addEventListener('change', handleUpload);
}

function init() {
  bindActions();
  loadManifestedSouls()
    .then(() => {
      logEvent('System', 'Loaded built-in soul files. Pick one or import your own.');
    })
    .catch(() => {
      logEvent('Error', 'Unable to load soul manifest.');
    });
  renderStats();
}

init();
