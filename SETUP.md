# Gift card setup

The website is static; a Google Sheet and its bound Apps Script safely hold the account details, track issues, and send notification email. **Do not publish the Sheet itself.** Only the Apps Script web app needs public access.

## 1. Create the Sheet

1. Create a Google Sheet and rename its first tab to **Account**.
2. Set `A1` to `Username`, `B1` to `Password`, `C1` to `Profile`, and `D1` to `Status`.
3. Put the Prime Video username and password in `A2` and `B2`, and the profile number/name (for example `1`) in `C2`. Leave `D2` empty.
4. Keep sharing set to **Restricted**. Making the spreadsheet “Anyone with the link” would expose the credentials and is not required.

## 2. Add Apps Script

1. In the Sheet choose **Extensions → Apps Script**.
2. In this GitHub repository, open [`apps-script/Code.gs`](apps-script/Code.gs), press **Raw**, and copy everything from the first `/**` through the final `}`.
3. Return to Apps Script, open `Code.gs`, select everything already in the editor, delete it, and paste the copied JavaScript.
4. **Do not paste** a command such as `git clone`, `git pull`, a line beginning with `git`, or Markdown backticks (`` ``` ``). Those are not JavaScript. The error `Unexpected identifier 'git' line: 1` means a Git command was accidentally pasted into `Code.gs`; clear the editor and repeat step 2 using the **Raw** file.
5. Confirm the first line in the editor starts with `/**` and not `git` or `` ```javascript ``.
6. Change `YOUR_EMAIL@gmail.com` to the address that should receive issue notifications.
7. Save. The unlock phrase is `bethday`; matching is case-insensitive. You can change `GIFT_PASSPHRASE` if desired.

### Fix for the exact error shown in the screenshot

The screenshot is **not showing the contents of `Code.gs`**. It shows a Git patch/diff that begins with `(cd ... git rev-parse ...)`, followed by `diff --git`, `index`, `---`, `+++`, and lines beginning with `+`. Apps Script cannot execute any of those lines. The escaped quotes such as `\'Account\'` are another sign that the patch was copied instead of the file.

Do this exactly:

1. Click inside the Apps Script editor.
2. Press **Ctrl+A** (Windows/Linux) or **⌘A** (Mac), then press **Backspace/Delete**. The editor must be completely empty.
3. Open the repository's actual [`apps-script/Code.gs`](apps-script/Code.gs) file—not a pull-request diff or chat output.
4. Click the **Raw** button at the upper-right of the GitHub file view. The new page must begin with `/**` and must contain no red/green diff markers.
5. Press **Ctrl+A**, then **Ctrl+C** on that Raw page. Paste it into the now-empty Apps Script editor.
6. Replace only `YOUR_EMAIL@gmail.com` with the notification address. Do not add backslashes around any quotes.
7. Press **Ctrl+S**. The toolbar should change from **No functions** to show a function such as `doGet`. Only then click **Deploy**.

After pasting, the first actual code declarations must look exactly like this (ordinary single quotes, with no backslashes and no leading `+`):

```javascript
const SHEET_NAME = 'Account';
const NOTIFICATION_EMAIL = 'YOUR_EMAIL@gmail.com';
const GIFT_PASSPHRASE = 'bethday';
```

If line 1 still starts with `(cd`, `git`, `diff`, `index`, `---`, `+++`, or `@@`, stop: the wrong content is still in the editor. Deleting only the word `git` will not fix it; the **entire patch** must be removed.

## 3. Deploy the backend

1. Click **Deploy → New deployment** and choose **Web app**.
2. Set **Execute as** to **Me**.
3. Set **Who has access** to **Anyone**. This makes only the narrow web endpoint public—not the spreadsheet.
4. Click **Deploy**, grant Spreadsheet and email permissions, and copy the URL ending in `/exec`.
5. Paste that URL between the quotes in `API_URL` near the top of [`script.js`](script.js).
6. If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit**, select **New version**, and deploy again. The `/exec` URL normally remains the same.

The included login button uses Amazon Australia's Prime Video sign-in URL. If the recipient uses a different Amazon region, replace the `href` on `#primeLogin` in `index.html` with that region's Prime Video sign-in link.

## 4. Put the website files on `main`

Your screenshot shows that the repository's `main` branch contains only `.gitkeep`. GitHub Pages cannot serve the site until `index.html` and its supporting files are actually on `main`.

### Option A — merge the pull request (recommended)

1. Open the repository's **Pull requests** tab.
2. Open the pull request containing the gift-card changes.
3. Choose **Merge pull request → Confirm merge**.
4. Return to the **Code** tab, select `main`, and verify that `index.html`, `styles.css`, and `script.js` are visible.

If there is no pull request or those files are not in it, use Option B.

### Option B — upload through GitHub

1. Download/copy these repository files: `index.html`, `styles.css`, `script.js`, `README.md`, and `SETUP.md`.
2. On the GitHub repository's **Code** tab, make sure the branch selector says `main`.
3. Select **Add file → Upload files**.
4. Upload the five files into the repository root—not inside another folder. The path must be exactly `/index.html`, with lowercase letters.
5. Under **Commit changes**, keep **Commit directly to the `main` branch** selected and press **Commit changes**.
6. Verify the Code tab now lists `index.html`. Do not continue while it still lists only `.gitkeep`.

## 5. Enable GitHub Pages

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select branch **main**, folder **/ (root)**, and click **Save**.
4. Open the repository's **Actions** tab and wait for the **pages build and deployment** workflow to show a green check. Deployment normally takes a few minutes.
5. Visit `https://iamarasinghe96.github.io/bethday/`. If it was previously open, refresh without cache or try a private window.

### If Pages still says 404

- Confirm `https://github.com/iamarasinghe96/bethday/blob/main/index.html` opens a file rather than a 404.
- Confirm the filename is exactly lowercase `index.html`, not `Index.html`, `index.html.txt`, or a file inside a second `bethday` folder.
- Confirm Pages is publishing `main` and `/ (root)`.
- Check **Actions → pages build and deployment** for an error. A green deployment cannot publish `index.html` if that file is absent from `main`.

GitHub Pages hosts only the front end. The Google Sheet remains restricted, while Apps Script is separately deployed as the public web app described above.

## Day-to-day workflow

- **Reveal:** Beth taps the card, taps the masked credentials, selects **Reveal account details**, and enters `bethday` in any letter case. The Prime Video logo then minimizes, the credentials appear, and the card shows a direct sign-in button plus the profile from `C2`.
- **Report:** **Report an account issue** writes `issue` to `D2` and emails the configured address.
- **Resolve:** Replace `A2` and `B2`, update the profile in `C2` if needed, then type `solved` into `D2`.
- **Notify:** While `D2` says `solved`, Beth sees “New account details updated” whenever she checks the issue button. Clear `D2` manually after she has received the update; the report button will then create a new issue normally.

## Security note

Anyone who knows the public web-app URL and gift phrase can retrieve the credentials. Use a unique phrase for stronger privacy, do not commit the real account credentials or Apps Script URL to a public repository, and only share the finished gift-card link with its recipient.
