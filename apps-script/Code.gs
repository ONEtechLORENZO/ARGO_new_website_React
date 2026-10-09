/**
 * ARGO — modulo "Richiedi Demo"
 * Google Apps Script (runtime V8), pubblicato come App web.
 *
 * Riceve le richieste dal sito (POST JSON da /api/demo) e invia:
 *   1. a sales@otech.one  → tutti i dati della richiesta (risposta diretta al cliente con "Rispondi")
 *   2. al cliente          → la conferma "Gentile <nome>, grazie per aver richiesto una demo di ARGO"
 *
 * Impostazione (una volta sola): vedi apps-script/README.md
 *   - Proprietà dello script DEMO_SECRET = la stessa stringa di DEMO_WEBHOOK_SECRET nel sito
 */

const CONFIG = {
  SALES_EMAIL: 'sales@otech.one',
  SALES_FROM_NAME: 'Sito ARGO',          // mittente visualizzato nella mail interna
  CUSTOMER_FROM_NAME: 'ARGO by One Tech', // mittente visualizzato nella conferma al cliente
  CUSTOMER_REPLY_TO: 'sales@otech.one',   // se il cliente risponde alla conferma, scrive a sales
  MAX_PER_EMAIL: 3,                        // massimo richieste per indirizzo...
  WINDOW_SECONDS: 600,                     // ...ogni 10 minuti (anti-abuso)
  IMAGES: {
    customerHeader: 'https://0wlrsgrnxygpaqsuekgapipp_non2jhzqw6lly0gr6o.canva-cdn.email/c75be37ba232429652a39d003a3e0aa0.jpg',
    customerFooter: 'https://0wlrsgrnxygpaqsuekgapipp_non2jhzqw6lly0gr6o.canva-cdn.email/42d135d3eb34f2fe56e069984a1c33b0.jpg',
    salesHeader: 'https://0wlrsgrnxygpaqsuekgapipp_non2jhzqw6lly0gr6o.canva-cdn.email/906dcea71416ac6579fd03f38d46da57.jpg',
    salesFooter: 'https://0wlrsgrnxygpaqsuekgapipp_non2jhzqw6lly0gr6o.canva-cdn.email/6f42afe1b2397290fd2ace1a81d9a138.jpg',
  },
};

/* ------------------------------------------------------------------ */
/* Ingressi                                                             */
/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    const data = parseRequest_(e);

    // 1. solo il sito (che conosce il segreto) può usare questo indirizzo
    const secret = PropertiesService.getScriptProperties().getProperty('DEMO_SECRET');
    if (!secret || data.secret !== secret) return json_({ ok: false, error: 'unauthorized' });

    // 2. campo trappola per i bot: risposta "ok" ma nessuna email
    if (data.website) return json_({ ok: true });

    // 3. stessi controlli del sito
    const d = clean_(data);
    const invalid = validate_(d);
    if (invalid.length) return json_({ ok: false, error: 'invalid', fields: invalid });

    // 4. anti-abuso: troppe richieste dallo stesso indirizzo in poco tempo
    if (!withinRateLimit_(d.email)) return json_({ ok: false, error: 'rate_limited' });

    // 5. email a sales (obbligatoria) e conferma al cliente
    sendToSales_(d);
    sendToCustomer_(d);

    return json_({ ok: true });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: 'server' });
  }
}

/* Aprendo l'URL dell'App web nel browser si vede che il servizio è attivo. */
function doGet() {
  return json_({ ok: true, service: 'argo-demo-form' });
}

/* ------------------------------------------------------------------ */
/* Dati                                                                 */
/* ------------------------------------------------------------------ */

function parseRequest_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { /* non JSON: prova i parametri */ }
  }
  return (e && e.parameter) || {};
}

function clean_(data) {
  const s = (v, max) => String(v == null ? '' : v).trim().slice(0, max || 160);
  return {
    company: s(data.company),
    contact: s(data.contact),
    email: s(data.email, 254).toLowerCase(),
    phone: s(data.phone, 40),                 // normalizzato dal sito, es. +393471234567
    phoneAsTyped: s(data.phoneAsTyped || data.phone, 40),
    sector: s(data.sector),
    role: s(data.role),
    interest: s(data.interest),
    message: s(data.message, 2000),
    consent: data.consent === true || data.consent === 'true',
    lang: data.lang === 'en' ? 'en' : 'it',
    submittedAt: s(data.submittedAt, 40) || new Date().toISOString(),
    plan: cleanPlan_(data.plan, s),
  };
}

/* piano scelto da "Contattaci" nella sezione prezzi (null se la richiesta arriva da altrove) */
function cleanPlan_(p, s) {
  if (!p || typeof p !== 'object' || !p.name) return null;
  const rows = Array.isArray(p.rows) ? p.rows.slice(0, 8) : [];
  return {
    name: s(p.name, 40),
    fee: s(p.fee, 60),
    rows: rows
      .filter(function (r) { return Array.isArray(r) && r.length === 2; })
      .map(function (r) { return [s(r[0], 40), s(r[1], 300)]; }),
  };
}

function validate_(d) {
  const bad = [];
  ['company', 'contact', 'email', 'phone', 'sector', 'role', 'interest', 'message'].forEach(function (k) {
    if (!d[k]) bad.push(k);
  });
  if (d.email && !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(d.email)) bad.push('email');
  if (d.phone && !/^\+?\d{6,15}$/.test(d.phone.replace(/[\s.\-()/]/g, ''))) bad.push('phone');
  if (!d.consent) bad.push('consent');
  return bad;
}

function withinRateLimit_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'rl:' + email;
  const count = Number(cache.get(key) || 0);
  if (count >= CONFIG.MAX_PER_EMAIL) return false;
  cache.put(key, String(count + 1), CONFIG.WINDOW_SECONDS);
  return true;
}

/* ------------------------------------------------------------------ */
/* Invio                                                                */
/* ------------------------------------------------------------------ */

function sendToSales_(d) {
  MailApp.sendEmail({
    to: CONFIG.SALES_EMAIL,
    replyTo: d.email, // "Rispondi" scrive direttamente al cliente
    name: CONFIG.SALES_FROM_NAME,
    subject: oneLine_('Nuova richiesta demo ARGO — ' + d.company + (d.plan ? ' · Piano ' + d.plan.name : '')),
    htmlBody: salesHtml_(d),
    body: salesText_(d),
  });
}

function sendToCustomer_(d) {
  const en = d.lang === 'en';
  MailApp.sendEmail({
    to: d.email,
    replyTo: CONFIG.CUSTOMER_REPLY_TO,
    name: CONFIG.CUSTOMER_FROM_NAME,
    subject: en ? 'Thank you for requesting an ARGO demo' : 'Grazie per aver richiesto una demo di ARGO',
    htmlBody: customerHtml_(d),
    body: customerText_(d),
  });
}

/* ------------------------------------------------------------------ */
/* Email al cliente (template fornito)                                  */
/* ------------------------------------------------------------------ */

function customerCopy_(d) {
  return d.lang === 'en'
    ? { hello: 'Dear', lines: ['Thank you for requesting a demo of ARGO.', 'Our team will contact you shortly to agree on a date and time and to answer all your questions.', 'Talk soon.'], sign: ['The ARGO team', 'by One Tech'] }
    : { hello: 'Gentile', lines: ['Grazie per aver richiesto una demo di ARGO.', 'Il nostro team ti contatterà a breve per concordare data e orario e per rispondere a tutte le tue domande.', 'A presto.'], sign: ['Il team di ARGO', 'by One Tech'] };
}

function customerHtml_(d) {
  const c = customerCopy_(d);
  const body = c.lines.join('<br><br>') + '<br><br>' + c.sign.join('<br>');
  return emailShell_(
    '<tr><td style="padding:24px 0px 16px">' + image_(CONFIG.IMAGES.customerHeader) + '</td></tr>' +
    '<tr><td dir="ltr" style="font-size:16px;text-align:justify;padding:0px 24px 16px;line-height:1.2;mso-line-height-alt:19.2px">' +
      '<span style="font-size:14.7px;white-space:pre-wrap">' + c.hello + ' </span>' +
      '<span style="font-weight:700;font-family:Poppins, Arial, Helvetica, sans-serif;white-space:pre-wrap">' + esc_(d.contact) + '</span>' +
      '<span style="font-size:14.7px;white-space:pre-wrap">,</span>' +
    '</td></tr>' +
    '<tr><td dir="ltr" style="font-size:14.7px;text-align:justify;padding:0px 24px 16px;line-height:19.2px;mso-line-height-alt:19.2px">' + body + '</td></tr>' +
    '<tr><td style="padding:0px 0px 24px">' + image_(CONFIG.IMAGES.customerFooter) + '</td></tr>'
  );
}

function customerText_(d) {
  const c = customerCopy_(d);
  return c.hello + ' ' + d.contact + ',\n\n' + c.lines.join('\n\n') + '\n\n' + c.sign.join('\n');
}

/* ------------------------------------------------------------------ */
/* Email a sales (template fornito)                                     */
/* ------------------------------------------------------------------ */

function salesRows_(d) {
  const digits = d.phone.replace(/\D/g, '');
  return [
    ['Nome Referente', esc_(d.contact)],
    ['Email', '<a href="mailto:' + esc_(d.email) + '" style="color:#222222;text-decoration:none">' + esc_(d.email) + '</a>'],
    ['Telefono / WhatsApp',
      '<a href="tel:' + esc_(d.phone) + '" style="color:#222222;text-decoration:none">' + esc_(d.phoneAsTyped) + '</a>' +
      ' <a href="https://wa.me/' + digits + '" style="font-size:13px;font-weight:400;color:#1f9d5a;text-decoration:none">(WhatsApp)</a>'],
    ['Settore di appartenenza', esc_(d.sector)],
    ['Ruolo', esc_(d.role)],
    ['Interesse principale', esc_(d.interest)],
    ["Messaggio / caso d'uso", esc_(d.message).replace(/\r?\n/g, '<br>')],
  ];
}

function salesHtml_(d) {
  const label = 'font-size:19.7px;font-family:Helvetica, Arial, sans-serif;white-space:pre-wrap';
  const value = 'font-size:17.3px;font-weight:700;font-family:Poppins, Arial, Helvetica, sans-serif;white-space:pre-wrap;color:#222222';
  const row = (l, v) =>
    '<tr><td dir="ltr" style="font-size:16px;text-align:left;padding:0px 24px 16px;line-height:1.3;mso-line-height-alt:19.2px">' +
      '<span class="ers-fs-197" style="' + label + '">' + l + ': </span>' +
      '<span class="ers-fs-173" style="' + value + '">' + v + '</span>' +
    '</td></tr>';

  return emailShell_(
    '<tr><td style="padding:0">' + image_(CONFIG.IMAGES.salesHeader) + '</td></tr>' +
    '<tr><td dir="ltr" style="font-size:16px;font-family:Poppins, Arial, Helvetica, sans-serif;text-align:left;padding:24px 24px 16px;line-height:1.2;mso-line-height-alt:19.2px">' +
      '<span class="ers-fs-183" style="font-size:18.3px;font-weight:700;white-space:pre-wrap">Azienda</span>' +
      '<span class="ers-fs-197" style="font-size:19.7px;white-space:pre-wrap"> : </span>' +
      '<span class="ers-fs-213" style="font-size:21.3px;font-weight:700;color:#5e17eb;white-space:pre-wrap">' + esc_(d.company) + '</span>' +
    '</td></tr>' +
    salesRows_(d).map(function (r) { return row(r[0], r[1]); }).join('') +
    planHtml_(d.plan) +
    '<tr><td dir="ltr" style="padding:0px 24px 20px;font-family:Helvetica, Arial, sans-serif;font-size:12px;color:#8a8a8a">' +
      'Lingua del sito: ' + (d.lang === 'en' ? 'inglese' : 'italiano') + ' · Ricevuta il ' + esc_(formatDate_(d.submittedAt)) +
    '</td></tr>' +
    '<tr><td style="padding:0px 0px 24px">' + image_(CONFIG.IMAGES.salesFooter) + '</td></tr>',
    '@media(max-width:550px){.ers-fs-173{font-size:16.7px!important}.ers-fs-183{font-size:17.2px!important}.ers-fs-197{font-size:17.9px!important}.ers-fs-213{font-size:18.7px!important}}'
  );
}

/* riquadro "Piano selezionato" con tutti i dettagli del piano scelto */
function planHtml_(plan) {
  if (!plan) return '';
  const cell = 'padding:6px 0;font-family:Helvetica, Arial, sans-serif;font-size:14px;vertical-align:top;border-top:1px solid #d7e6dc';
  const rows = plan.rows.map(function (r) {
    return '<tr><td style="' + cell + ';color:#5b6b62;width:42%">' + esc_(r[0]) + '</td>' +
      '<td style="' + cell + ';color:#222222;font-weight:700">' + esc_(r[1]) + '</td></tr>';
  }).join('');
  return '<tr><td style="padding:4px 24px 20px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #bfe0cc;border-left:4px solid #1f9d5a;background:#f1f9f4">' +
      '<tr><td style="padding:14px 16px 16px">' +
        '<div style="font-family:Helvetica, Arial, sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#16884f">Piano selezionato</div>' +
        '<div style="margin:4px 0 10px;font-family:Poppins, Arial, Helvetica, sans-serif;font-size:21px;font-weight:700;color:#5e17eb">' + esc_(plan.name) +
          (plan.fee ? ' <span style="font-size:15px;font-weight:400;color:#16884f">' + esc_(plan.fee) + '</span>' : '') + '</div>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + rows + '</table>' +
      '</td></tr>' +
    '</table>' +
  '</td></tr>';
}

function salesText_(d) {
  const plan = d.plan
    ? ['', 'PIANO SELEZIONATO: ' + d.plan.name].concat(d.plan.rows.map(function (r) { return '  ' + r[0] + ': ' + r[1]; }))
    : [];
  return [
    'Nuova richiesta demo ARGO',
    '',
    'Azienda: ' + d.company,
    'Nome Referente: ' + d.contact,
    'Email: ' + d.email,
    'Telefono / WhatsApp: ' + d.phoneAsTyped + ' (' + d.phone + ')',
    'Settore di appartenenza: ' + d.sector,
    'Ruolo: ' + d.role,
    'Interesse principale: ' + d.interest,
    "Messaggio / caso d'uso:",
    d.message,
  ].concat(plan, [
    '',
    'Lingua del sito: ' + (d.lang === 'en' ? 'inglese' : 'italiano') + ' · Ricevuta il ' + formatDate_(d.submittedAt),
  ]).join('\n');
}

/* ------------------------------------------------------------------ */
/* Struttura comune delle email (dai template forniti)                  */
/* ------------------------------------------------------------------ */

function emailShell_(rows, extraCss) {
  return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
    '<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
    '<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">' +
    '<meta name="x-apple-disable-message-reformatting">' +
    '<style>body{margin:0;padding:0}table{mso-table-lspace:0;mso-table-rspace:0}p,span,h1,h2,h3,h4,h5,h6{margin:0;padding:0}p{line-height:inherit}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important}#MessageViewBody a{color:inherit;text-decoration:none}img+div{display:none}@media (max-width:599px){.ecw{width:100%!important;min-width:0!important}}' + (extraCss || '') + '</style>' +
    '<!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->' +
    '</head><body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0">' +
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5"><tbody><tr><td style="background-color:#f0f1f5">' +
    '<!--[if mso]><center><table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tbody><tr><td><![endif]-->' +
    '<table align="center" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="ecw" style="max-width:600px;margin:0 auto;background-color:#ffffff;width:600px;min-width:600px"><tbody><tr><td style="vertical-align:top">' +
    '<table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody>' +
    rows +
    '</tbody></table>' +
    '</td></tr></tbody></table>' +
    '<!--[if mso]></td></tr></tbody></table></center><![endif]-->' +
    '</td></tr></tbody></table></body></html>';
}

function image_(src) {
  return '<table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center">' +
    '<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px"><tbody><tr><td style="width:100%">' +
    '<img src="' + src + '" width="600" height="180" alt="ARGO by One Tech" style="display:block;width:600px;height:auto;max-width:100%;border:0">' +
    '</td></tr></tbody></table></td></tr></tbody></table>';
}

/* ------------------------------------------------------------------ */
/* Utilità                                                              */
/* ------------------------------------------------------------------ */

/* rende sicuro il testo scritto dall'utente prima di metterlo nell'HTML */
function esc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* niente a-capo negli oggetti delle email */
function oneLine_(v) {
  return String(v).replace(/[\r\n]+/g, ' ').slice(0, 180);
}

function formatDate_(iso) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return String(iso);
  return Utilities.formatDate(date, 'Europe/Rome', 'dd/MM/yyyy HH:mm');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ */
/* Prova manuale dall'editor: esegui testSend() per ricevere le due email */
/* ------------------------------------------------------------------ */

function testSend() {
  const secret = PropertiesService.getScriptProperties().getProperty('DEMO_SECRET');
  const res = doPost({
    postData: {
      contents: JSON.stringify({
        secret: secret,
        company: 'Alfa Srl (TEST)',
        contact: 'Mario Rossi',
        email: Session.getActiveUser().getEmail(), // la conferma arriva a te
        phone: '+393471234567',
        phoneAsTyped: '347 123 4567',
        sector: 'Credito al consumo',
        role: 'Responsabile operations',
        interest: 'Piano Business',
        message: 'Messaggio di prova.\nGestiamo circa 12.000 buste paga al mese.',
        consent: true,
        lang: 'it',
        submittedAt: new Date().toISOString(),
      }),
    },
  });
  console.log(res.getContent());
}
