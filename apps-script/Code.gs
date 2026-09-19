/**
 * Google Apps Script backend for the gift card.
 * Copy ONLY this file's JavaScript into the Apps Script Code.gs editor.
 * Do not paste a terminal command, Markdown fence, or a line beginning with git.
 */
const SHEET_NAME = 'Account';
const NOTIFICATION_EMAIL = 'YOUR_EMAIL@gmail.com';
const GIFT_PASSPHRASE = 'bethday';

function doGet() {
  return json_({ ok: true, message: 'Gift card service is running.' });
}

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents || '{}');
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('The Account sheet was not found.');

    const row = sheet.getRange(2, 1, 1, 4).getDisplayValues()[0];
    const username = row[0].trim();
    const password = row[1].trim();
    const profile = row[2].trim();
    const status = row[3].trim().toLowerCase();

    if (request.action === 'reveal') {
      if (String(request.passphrase || '').trim().toLowerCase() !== GIFT_PASSPHRASE.toLowerCase()) {
        return json_({ ok: false, message: 'That password is not quite right.' });
      }
      return json_({ ok: true, username: username, password: password, profile: profile || '1' });
    }

    if (request.action === 'report') {
      if (status === 'solved') {
        return json_({ ok: true, status: 'solved', message: 'Please unlock the card again to see the new account details.' });
      }

      sheet.getRange(2, 4).setValue('issue');
      sendIssueEmail_(spreadsheet, sheet);
      return json_({ ok: true, status: 'issue', message: 'The sender has been notified and will update the account details soon.' });
    }

    return json_({ ok: false, message: 'Unknown request.' });
  } catch (error) {
    return json_({ ok: false, message: error.message });
  }
}

/**
 * Emails the notification address, with a link that opens the Account sheet
 * straight on the row that needs new credentials.
 */
function sendIssueEmail_(spreadsheet, sheet) {
  const sheetUrl = sheetLink_(spreadsheet, sheet);
  const reportedAt = Utilities.formatDate(
    new Date(), spreadsheet.getSpreadsheetTimeZone(), "d MMMM yyyy 'at' h:mm a");

  const plainBody =
    'An account issue was reported from Beth\u2019s gift card on ' + reportedAt + '.\n\n' +
    'Open the Google Sheet:\n' + sheetUrl + '\n\n' +
    'Replace the username in A2 and the password in B2, update the profile in C2 ' +
    'if it changed, then type "solved" into D2. Beth sees the new details the next ' +
    'time she unlocks the card.';

  const htmlBody =
    '<p>An account issue was reported from Beth&rsquo;s gift card on ' + reportedAt + '.</p>' +
    '<p><a href="' + sheetUrl + '">Open the Google Sheet</a><br>' +
    '<span style="font-size:12px;color:#666">' + sheetUrl + '</span></p>' +
    '<p>Replace the username in <b>A2</b> and the password in <b>B2</b>, update the ' +
    'profile in <b>C2</b> if it changed, then type <b>solved</b> into <b>D2</b>. ' +
    'Beth sees the new details the next time she unlocks the card.</p>';

  MailApp.sendEmail({
    to: notificationAddress_(),
    subject: 'Prime Video gift card \u2014 account issue',
    body: plainBody,
    htmlBody: htmlBody
  });
}

/** Deep link to the Account tab, with cell A2 selected. */
function sheetLink_(spreadsheet, sheet) {
  return spreadsheet.getUrl().replace(/[?#].*$/, '') +
    '#gid=' + sheet.getSheetId() + '&range=A2';
}

/** Falls back to the account running the script if the constant was left unedited. */
function notificationAddress_() {
  if (NOTIFICATION_EMAIL && NOTIFICATION_EMAIL.indexOf('YOUR_EMAIL') === -1) {
    return NOTIFICATION_EMAIL;
  }
  const owner = Session.getEffectiveUser().getEmail();
  if (!owner) throw new Error('Set NOTIFICATION_EMAIL in Code.gs to the address that should receive issue reports.');
  return owner;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
