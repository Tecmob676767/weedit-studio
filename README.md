# 🎬 WeEdit Studio — Pro Video & Multimedia PWA

> The world's most advanced browser-native video and multimedia studio built as an installable Progressive Web App (PWA). Engineered with client-side Canvas compositing, Web Audio DSP, multi-track timeline, real-time shaders, and hardware-accelerated video export—surpassing CapCut, InShot, and VN with **100% privacy, zero server wait, and zero subscription paywalls**.

![WeEdit Studio Banner](https://raw.githubusercontent.com/Tecmob676767/weedit-studio/main/public/favicon.svg)

---

## 🌟 Key Superpowers

* **🎵 Extract Audio from Other Videos**:
  Upload any video file (MP4, WebM, MOV, TikTok clip, YouTube rip) and WeEdit immediately rips the raw audio and generates an interactive audio waveform clip on the timeline!
* **⚡ Detach Audio to Separate Track**:
  With 1 click on any video clip in the timeline, split its audio into an independent audio lane with full waveform controls and mute the video.
* **📐 10 Aspect Ratio Presets**:
  1. **16:9** — YouTube / TV Landscape (1920x1080)
  2. **9:16** — TikTok / Instagram Reels / YouTube Shorts (1080x1920)
  3. **1:1** — Instagram Square Post (1080x1080)
  4. **4:5** — Instagram Portrait (1080x1350)
  5. **21:9** — UltraWide Cinema Scope (2560x1080)
  6. **4:3** — Classic Retro TV / iPad (1440x1080)
  7. **3:4** — Vertical Tablet / Social Story (1080x1440)
  8. **2:3** — Pinterest / Portrait Photo (1080x1620)
  9. **2.39:1** — Anamorphic Panavision Widescreen (2560x1070)
  10. **9:20** — Modern Tall Smartphone (1080x2400)
* **🎞️ Pro Non-Linear Editing (NLE) Timeline**:
  * Multi-track stacking (Main Video, B-roll/Overlays, BGM Music, SFX/Voiceovers, Subtitles/Captions, Stickers).
  * Frame-accurate razor split (<kbd>C</kbd>), clip trimming handles, magnetic snapping, and drag-and-drop.
  * Real-time audio waveforms rendered directly on clips.
* **💎 Parametric Keyframing Engine**:
  * Smooth cubic bezier interpolation for **Scale, Opacity, Position X/Y, and Rotation**.
  * Visual keyframe diamond markers directly on timeline clips.
* **🎛️ Web Audio DSP & Rhythm Beats**:
  * **3-Band Parametric EQ** (Bass, Mid, Treble dB adjustments) + speed control (0.5x to 2x).
  * **Auto Beat Detection**: Automatically detects transient energy spikes and marks rhythm drop points along the timeline for synchronized beat cutting.
  * **Procedural Sound FX**: Built-in royalty-free sound effects (Cinematic Impact, 808 Sub Drop, Riser, Camera Shutter, Bubble Pop, Crystal Ding) generated in-memory.
  * **Voiceover Studio**: Record live commentary directly into an audio track with live stereo VU level meters.
* **🎨 Hardware-Accelerated Shaders & Color Grading**:
  * **Chroma Key (Green Screen)**: Real-time color keying with tolerance and softness sliders.
  * **1-Click LUT Presets**: Cyberpunk Neon, Golden Hour, Teal & Orange, Noir B&W, Matrix Emerald, Retro 1970.
  * **VFX Shaders**: RGB Cyber Glitch, 35mm Film Grain, Retro VHS Scanlines, and Vignette.
* **🔤 Kinetic Typography & Auto-Captions**:
  * Animated **Typewriter Reveal**, **Pop Bounce**, and subtitle generator with karaoke word highlights.
* **🔥 Animated Stickers & Emoji Overlays**:
  * Add animated stickers (🔥, ✨, 🎯, ❤️, 👑, ⚠️, 💎, 🚀, ⚡, 💯) as overlay clips with custom transforms and keyframing.
* **🚀 Instant Client-Side Export**:
  * 720p, 1080p, 4K at 24, 30, or 60 FPS with custom bitrates. Zero cloud rendering queues or data leaks.
* **📱 100% Offline-Ready PWA**:
  * Installable on Windows, macOS, Linux, Android, and iOS as a standalone app with Service Worker caching.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause Playback |
| <kbd>←</kbd> / <kbd>→</kbd> | Step 1 Frame Backward / Forward |
| <kbd>C</kbd> | Razor Split Tool |
| <kbd>V</kbd> | Selection Pointer Tool |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo |
| <kbd>Del</kbd> | Delete Selected Clip |
| <kbd>Home</kbd> | Jump to Start |

---

## 🛠️ Quickstart

```bash
# Clone the repository
git clone https://github.com/Tecmob676767/weedit-studio.git

# Enter project directory
cd weedit-studio

# Install dependencies
npm install

# Start local studio
npm run dev

# Build for production
npm run build
```

---

## 📄 License

MIT License © 2026 Tecmob676767
