# Where to add your AI Robot image

Add your AI robot image in these **3 placeholder divs**. Replace the placeholder div with an `<img>` (or keep the div and set it as `background-image`).

---

## 1. **Login page** (`src/pages/Login.jsx`)

- **Location:** Above the "AI Interview" heading.
- **Search for:** `[AI Robot image]`
- **Suggestion:** Use a friendly robot/avatar (e.g. logo or mascot).  
  Example:  
  `<img src="/robot.png" alt="AI Interview" className="w-24 h-24 rounded-2xl object-cover" />`  
  Put `robot.png` in `public/` so it’s at `/robot.png`.

---

## 2. **Setup Interview – loading overlay** (`src/pages/SetupInterview.jsx`)

- **Location:** Inside the loading overlay (when “Setting up interview…” / “Matching resume & JD…” is shown).
- **Search for:** `[AI Robot]`
- **Suggestion:** Use a “thinking” or “processing” robot image.  
  Example:  
  `<img src="/robot-thinking.png" alt="" className="w-20 h-20 rounded-2xl object-cover" />`

---

## 3. **Result page** (`src/pages/Result.jsx`)

- **Location:** After the report cards, above “Start new interview” / “Logout”.
- **Search for:** `[AI Robot]`
- **Suggestion:** Use a “success” or “congrats” robot image.  
  Example:  
  `<img src="/robot-success.png" alt="" className="w-16 h-16 rounded-xl object-cover" />`

---

## Quick steps

1. Add your images to `public/` (e.g. `public/robot.png`, `public/robot-thinking.png`, `public/robot-success.png`).
2. In each file, find the placeholder comment/div and replace it with the corresponding `<img>` (or style the div with `background-image` and keep the same size classes).

All three spots use Tailwind for size and rounding; you can tweak `w-*` / `h-*` and `rounded-*` to match your assets.
