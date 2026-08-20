# Equation2Image

Turn mathematical functions into AI-generated art.

## Features

- **Function input**: Cartesian `y=f(x)`, polar `r=f(θ)`, parametric `x=f(t), y=g(t)`
- **Line sketch generation**: Real-time Canvas preview from sampled curve points
- **Transforms**: mirror, rotate, kaleidoscope, multi-overlay, radial warp, domain warp
- **Presets**: sine wave, rose curve, heart, butterfly, Lissajous, spiral
- **AI completion**: Replicate ControlNet Scribble turns line art into full illustrations
- **Share & history**: URL-encoded state sharing, localStorage generation history

## Setup

```bash
npm install
cp .env.example .env.local
# Add your Replicate API token to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create `.env.local`:

```
REPLICATE_API_TOKEN=r8_...
```

Get a token at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens).

## Stack

- Next.js 14 (App Router)
- math.js — expression parsing
- HTML Canvas — line rendering
- Replicate — ControlNet Scribble img2img
- Tailwind CSS

## Usage

1. Enter a function (e.g. `sin(x) * cos(2*x)`) or pick a preset
2. Choose a transform mode and adjust parameters
3. Preview the line sketch; export PNG if desired
4. Enter a style prompt and click **AI 生成图片**
5. Share your configuration via the share link

Line preview works without an API key. AI generation requires `REPLICATE_API_TOKEN`.
