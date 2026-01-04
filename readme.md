# Trenchogotchi

Browser-based tamagotchi-inspired experience where every **trenchy** is driven by its own portable JSON soul file. Swap souls, import your own, and keep your companion balanced across hunger, energy, and mood.

## Features

- Three built-in soul files (`souls/*.json`) that shape needs, baseline stats, and personality-driven responses.
- Actions to feed, play, rest, and talk—each interacts with the selected soul's affinities.
- Live status bars with need decay over time and contextual soul reactions.
- Import custom souls via JSON upload without reloading the page.

## Soul file schema

```json
{
  "id": "ember",
  "name": "Ember",
  "pronouns": "they/them",
  "traits": ["attentive", "playfully mystical"],
  "vibe": "Short description shown in the library",
  "favorite": "spiced kelp chips",
  "backstory": "Long-form lore about this trenchy.",
  "baseline": { "hunger": 76, "energy": 84, "mood": 88 },
  "needs": {
    "hungerRate": 3.3,
    "energyRate": 1.8,
    "moodRate": 1.5,
    "moodAffinity": { "feed": 5, "rest": 4, "talk": 6 }
  },
  "responses": {
    "introduce": ["Hi, I'm Ember!"],
    "feed": ["Yum!"],
    "play": ["Let's move!"],
    "rest": ["Cooling down."],
    "talk": ["Tell me what lights you up."],
    "tick": ["Glow fading—need care."]
  }
}
```

Only `id`, `name`, and `pronouns` are required when importing; defaults fill the rest.

## Running locally

No build step is required.

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in your browser and adopt a trenchy.

## Creating new souls

1. Copy one of the JSON files from `souls/`.
2. Adjust needs to tune how fast hunger, energy, and mood decay.
3. Add custom responses for each action to give your trenchy its own voice.
4. Drag the JSON into the importer on the page to test it live.
