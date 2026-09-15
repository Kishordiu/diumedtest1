# DiuMed UI Component System

DiuMed uses a custom component system built with React, Tailwind CSS, and Framer Motion. It is inspired by, but distinct from, stock `shadcn/ui`.

## 1. Core Principles
*   **Mobile-First**: Touch-friendly targets (min 44px), safe-area padding for notches, and bottom-sheet heavy interactions.
*   **Optical Instrumentation Aesthetic**: Thin measurement marks, precise typography, subtle signal indicators, and a restrained dark palette. No overly "sci-fi" elements.
*   **Accessible**: High contrast text, ARIA labels, and `prefers-reduced-motion` support.

## 2. Color Tokens (Tailwind)
*   `mineral-black` (`#0D1012`): Primary app background.
*   `deep-graphite` (`#171B1E`): Surface color for cards and sheets.
*   `warm-pearl` (`#F5F2EA`): Primary text (high contrast).
*   `soft-bone` (`#E9E4DA`): Secondary text.
*   `stone` (`#A7A39A`): Tertiary text and inactive icons.
*   `signal-teal` (`#53B7A8`): Primary active color (heart rate, success).
*   `signal-amber` (`#D8A94D`): Warnings, offline states.
*   `emergency-red` (`#D85A52`): Critical actions (112, SOS).

## 3. Typography
*   **Primary**: `Instrument Sans` (variable) for all UI copy.
*   **Monospace**: `DM Mono` for numerical telemetry (BPM, duration, diagnostics).

## 4. Animation (Framer Motion)
*   Animations communicate state (e.g., finding signal → capturing).
*   Transitions use soft spring physics `type: "spring", stiffness: 300, damping: 30`.
*   Users with `prefers-reduced-motion: reduce` receive instant transitions.
