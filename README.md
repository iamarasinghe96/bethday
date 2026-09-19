# Bethday Prime Video gift card

A mobile-friendly animated gift card backed by a private Google Sheet. Start with the **[complete setup guide](SETUP.md)**.

## Why GitHub Pages currently shows 404

GitHub Pages can only publish files that actually exist on the selected branch. If the repository's **Code** tab shows only `.gitkeep`, `index.html` has not been uploaded or the pull request containing it has not been merged. Pages will therefore return “File not found.”

To fix it:

1. Merge the pull request containing this project into `main`, **or** upload `index.html`, `styles.css`, `script.js`, `README.md`, and `SETUP.md` to the root of `main`, plus the `assets` folder (the ribbon, bow, and Prime Video artwork) at `/assets`.
2. In **Settings → Pages**, select **Deploy from a branch**, `main`, and `/ (root)`, then click **Save**.
3. Wait for the Pages deployment to finish and open `https://iamarasinghe96.github.io/bethday/`.

Do not upload real Prime Video credentials. They belong only in the private Google Sheet.

## Apps Script says `Unexpected identifier 'git'`

You copied a Git diff instead of the JavaScript file. If the Apps Script editor contains `(cd ...`, `diff --git`, `index`, `---`, `+++`, `@@`, leading `+` signs, or quotes written as `\'`, delete **everything** in that editor. Then open [`apps-script/Code.gs`](apps-script/Code.gs), click **Raw**, and copy that entire Raw page. The detailed recovery steps are in [SETUP.md](SETUP.md#fix-for-the-exact-error-shown-in-the-screenshot).
