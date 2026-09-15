# DiuMed UI/UX Refinement Audit

## 1. Global Viewport & Safe Areas
**CURRENT**: 
The main viewport uses `pb-24` in `AppShell.tsx` to prevent content from hiding behind the `BottomNav.tsx`. BottomNav uses `fixed bottom-0` with `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px)`.
**PROBLEM**: 
Hardcoded `pb-24` is brittle and fails on different devices with varying safe areas, causing scrollable content and bottom sheet contents (like in `OnboardingSheet.tsx`) to overlap or get hidden behind the BottomNav.
**TARGET**: 
A centralized viewport geometry system that inherently understands `--bottom-nav-total-height` and prevents overlapping.
**COMPONENT TO CHANGE**: 
`AppShell.tsx`, `index.css`, `BottomNav.tsx`, `OnboardingSheet.tsx`.
**RESPONSIVE BEHAVIOR**: 
Use CSS `env(safe-area-inset-bottom)` combined with CSS variables for navigation height.
**DARK/WARM MODE BEHAVIOR**: 
Structural only.

---

## 2. Bottom Navigation
**CURRENT**: 
Uses `bg-mineral-black/70 backdrop-blur-2xl` with a thin border.
**PROBLEM**: 
Feels like a standard web app bottom bar. Doesn't feel like a physical, premium instrument dock. Can overlap content if content padding isn't perfectly calculated.
**TARGET**: 
Premium medical device navigation. Controlled translucency, blur, subtle upper glow/highlight, restrained shadow.
**COMPONENT TO CHANGE**: 
`BottomNav.tsx`.
**DARK MODE BEHAVIOR**: Deep mineral black with teal highlights.
**WARM MODE BEHAVIOR**: Warm pearl with amber highlights.

---

## 3. Z-Index & Bottom Sheets
**CURRENT**: 
BottomNav is `z-50`. OnboardingSheet is `z-50` for the sheet and `z-40` for the backdrop.
**PROBLEM**: 
The BottomNav and BottomSheet collide at `z-50`, causing visual conflict. Sheet content often terminates beneath the navigation.
**TARGET**: 
Strict Z-index hierarchy: APP=0, NAV=40, FLOATING=45, BACKDROP=80, SHEET=90, SHEET CONTROLS=95.
**COMPONENT TO CHANGE**: 
`OnboardingSheet.tsx`, `BottomNav.tsx`.
**RESPONSIVE BEHAVIOR**: Max-height bound by `calc(100dvh - var(--safe-top) - 16px)`.
**DARK/WARM MODE BEHAVIOR**: Semantic background coloring without excessive glass.

---

## 4. Bio-Aura & Pulse Touch Flow
**CURRENT**: 
Vertical stacking of instructions often clashes with the bottom navigation.
**PROBLEM**: 
Instructions ("Wait a few seconds for the result.") are getting cut off at the bottom. The instrument takes up space and pushes CTA down.
**TARGET**: 
Redesigned biomedical page. The instrument is the focal point. Instructions are tightly composed, safe-area aware, and always reachable.
**COMPONENT TO CHANGE**: 
`PulseTouchPage.tsx`, `BioAuraPage.tsx`, `CameraLensInstrument.tsx`, `OnboardingSheet.tsx`.
**RESPONSIVE BEHAVIOR**: Mobile-first clamp scaling. No overlapping.
**DARK MODE BEHAVIOR**: Deep contrast, bright teal/amber indicators.
**WARM MODE BEHAVIOR**: Soft paper contrast, rich amber indications.

---

## 5. Auth Page
**CURRENT**: 
Standard animated particles with signal-teal and signal-amber. Glassmorphism inputs.
**PROBLEM**: 
Feels like an "AI startup landing page", not a premium medical/trustworthy entrance.
**TARGET**: 
Editorial, premium product entrance. Quiet, expensive, trustworthy atmosphere.
**COMPONENT TO CHANGE**: 
`AuthPage.tsx`.
**RESPONSIVE BEHAVIOR**: Centered max-width column, elegant fading.
**DARK MODE BEHAVIOR**: Deep mineral atmosphere, slow material movement.
**WARM MODE BEHAVIOR**: Warm pearl, soft stone/paper movement.

---

## 6. Theme System & Design Tokens
**CURRENT**: 
Tailwind config maps some colors to variables. Warm mode essentially inverts the dark palette variables directly.
**PROBLEM**: 
Hardcoded `bg-white/5`, `border-white/10`, and `rgba(255,255,255,...)` throughout the codebase. Warm mode feels like "dark mode with beige background", lacking its own semantic tuning.
**TARGET**: 
Two distinct semantic themes. Four material types: BASE, RAISED, INSTRUMENT, ALERT. No hardcoded whites/blacks in structural UI.
**COMPONENT TO CHANGE**: 
`tailwind.config.js`, `index.css`, all UI components.
**DARK MODE BEHAVIOR**: True dark mineral (Background: #0D1012).
**WARM MODE BEHAVIOR**: True warm pearl (Background: #F4F0E7).

---

## 7. Button & Badge System
**CURRENT**: 
Generic button component with some stylistic variations. Badges are ad-hoc text with colors.
**PROBLEM**: 
Lacks a strict semantic button system and unified badge system.
**TARGET**: 
Create strict `Button` (Primary, Secondary, Tertiary, Ghost, Destructive) and `Badge` (`BetaBadge`, `AdvancedBadge`) semantic components.
**COMPONENT TO CHANGE**: 
`Button.tsx`, Create `BetaBadge.tsx` / `AdvancedBadge.tsx`.
**DARK/WARM MODE BEHAVIOR**: Buttons must remain highly contrasted and legible across both themes without washing out.
