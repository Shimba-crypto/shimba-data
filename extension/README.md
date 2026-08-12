# ShimbaData Collector (browser extension)

Contribute Zambian education data — schools, ECZ past papers, health facilities and
laws — to ShimbaData. Everything you submit is **pending review** before it goes public.

## Install (Chrome / Edge / Brave)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the extension for easy access.

## How it works

- Open the popup and pick a dataset tab: School / Paper / Health / Law.
- Fill the form by hand, **or** click *"Detect from this page (optional)"* — this
  reads the visible text of the current tab (only on your click, never in the
  background) and suggests name candidates.
- Enter your email, tick the consent box, and submit.
- Admins review submissions; approved entries join the public datasets that
  ShimSearch indexes.

## Privacy

- The extension never reads page content automatically. Detection runs only when
  you click the button, via `activeTab` + `scripting` permissions.
- Permissions requested: `activeTab`, `scripting`, `storage` (remembers your email
  locally). No host permissions, no background collection.
- Submitted entries include your email and timestamp. See
  https://shimbadata.onrender.com/privacy and /terms.
