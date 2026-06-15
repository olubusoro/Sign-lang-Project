# Sign Language Hand Simulation System

A **speech and text-controlled 3D ASL hand simulation** built with Next.js App Router, React Three Fiber, and Tailwind CSS. Uses a 100% deterministic, rule-based NLP pipeline — no ML models required.

## Quick Start

> **Node.js 18+ is required.** Download from [nodejs.org](https://nodejs.org) if not installed.

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Add your hand rig model
#    Copy a Mixamo-rigged GLB to: public/model.glb
#    If omitted, a built-in geometric placeholder hand is shown instead.

# 3. Run the dev server
npm run dev

# 4. Open http://localhost:3000
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout (Inter font, dark theme)
│   ├── page.tsx            # Main UI — Web Speech API + state management
│   └── globals.css         # Tailwind + custom animations + glassmorphism
├── components/
│   └── SimulationCanvas.jsx # R3F canvas, GLTF rig, LERP bone animation
├── lib/
│   └── nlpUtils.js         # Deterministic NLP: normalize → lemmatize → tokenize
├── public/
│   ├── dictionary.json     # ASL bone rotation data (Mixamo naming)
│   └── model.glb           # ← Place your hand rig here (see below)
├── next.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

## Adding a Hand Rig

1. Go to [mixamo.com](https://www.mixamo.com), choose any humanoid character.
2. Download → **Format: FBX for Unity** or **GLB** (no animation needed).
3. If using FBX, convert to GLB via [products.aspose.app/3d/conversion](https://products.aspose.app/3d/conversion) or Blender.
4. Save as `public/model.glb`.

The app targets standard Mixamo bone names:
- `mixamorig:RightHand`
- `mixamorig:RightHandThumb1/2/3`
- `mixamorig:RightHandIndex1/2/3`
- `mixamorig:RightHandMiddle1/2/3`
- `mixamorig:RightHandRing1/2/3`
- `mixamorig:RightHandPinky1/2/3`

## Extending the Dictionary

Edit `public/dictionary.json` to add new signs. Each entry maps a token (uppercase) to an array of bone poses:

```json
"WATER": [
  { "bone": "mixamorig:RightHandIndex1", "x": 0.4, "y": 0, "z": 0 },
  ...
]
```

**Supported built-in words:** `HELLO`, `THANK`, `LOVE`, `YES`, `NO`, `PLEASE`  
**Supported fingerspelling:** `A B C D E F G H I K L O R V W Y` (full A–Z via fallback)

## Architecture

```
Raw Speech/Text
      │
      ▼
 normalizeText()          lowercase, strip punctuation
      │
      ▼
 lemmatize()              suffix-rule stripping (talking→talk)
      │
      ▼
 ASL stop-word filter     remove "the", "is", "a", etc.
      │
      ▼
 dictionary lookup        word sign OR fingerspelling fallback
      │
      ▼
 SimulationCanvas         R3F → useFrame → LERP bone rotations
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| 3D Engine | React Three Fiber + Three.js |
| 3D Helpers | @react-three/drei |
| Styling | Tailwind CSS v3 |
| Speech | Web Speech API (browser-native) |
| NLP | Custom rule-based (no ML) |
