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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
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
      MailApp.sendEmail({
        to: NOTIFICATION_EMAIL,
        subject: 'Prime Video gift card — account issue',
        htmlBody: '<p>An account issue was reported from Beth’s gift card.</p>' +
          '<p>Open the Google Sheet, replace the username/password, and set <b>Status</b> to <b>solved</b>.</p>'
      });
      return json_({ ok: true, status: 'issue', message: 'The sender has been notified and will update the account details soon.' });
    }

    return json_({ ok: false, message: 'Unknown request.' });
  } catch (error) {
    return json_({ ok: false, message: error.message });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
