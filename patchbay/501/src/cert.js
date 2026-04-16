// ═══════════════════════════════════════════
// CERTIFICATE EMISSION
// ═══════════════════════════════════════════
const CERT_SALT = 'patchbay-gcu-2026';
const CERT_WORKSHOP_ID = 'PB-501';
const CERT_REPO = 'endarthur/etc';

async function computeCompletionHash(workshopId, date) {
  const data = new TextEncoder().encode(workshopId + ':' + date + ':' + CERT_SALT);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function allSkullsEarned() {
  return STATE.skulls.every(s => s);
}

async function claimCertificate() {
  const input = document.getElementById('cert-name');
  const status = document.getElementById('cert-status');
  const name = (input.value || '').trim();

  if (!name || name.length < 2) {
    status.textContent = 'Please enter your full name (at least 2 characters).';
    status.style.color = 'var(--amber)';
    return;
  }

  if (!allSkullsEarned()) {
    status.textContent = 'You need all 5 skulls to claim your certificate.';
    status.style.color = 'var(--red)';
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const hash = await computeCompletionHash(CERT_WORKSHOP_ID, today);

  const params = new URLSearchParams({
    template: 'cert-request.yml',
    title: 'cert: ' + CERT_WORKSHOP_ID,
    fullname: name,
    workshop: CERT_WORKSHOP_ID,
    date: today,
    hash: hash,
  });

  status.innerHTML = 'Opening GitHub &mdash; submit the issue to receive your certificate.';
  status.style.color = 'var(--amber)';
  window.open('https://github.com/' + CERT_REPO + '/issues/new?' + params, '_blank');
}

function renderCertSection() {
  const el = document.getElementById('cert-section');
  if (!el) return;

  const earned = allSkullsEarned();

  el.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:32px;margin-bottom:12px">${earned ? '🏆' : '💀'}</div>
      <div style="font-family:var(--font-mono);font-size:13px;color:var(--text);margin-bottom:8px">
        ${earned ? 'All five skulls earned.' : `${STATE.skulls.filter(s=>s).length} of 5 skulls earned.`}
      </div>
      ${earned ? `
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:16px;line-height:1.6;max-width:360px;margin-left:auto;margin-right:auto">
          <em>"This certifies that you have completed Patchbay 501: NaNoGEon."</em><br>
          <em>"What you do next is yours to carry."</em>
        </div>
        <div class="sf" style="max-width:300px;margin:0 auto 12px">
          <label>Your Name</label>
          <input type="text" id="cert-name" placeholder="Full name for certificate" style="text-align:center">
        </div>
        <button class="btn btn-primary" onclick="claimCertificate()">Claim Certificate</button>
        <div id="cert-status" style="font-family:var(--font-mono);font-size:10px;margin-top:8px;min-height:16px"></div>
        <div style="margin-top:16px">
          <button class="btn" onclick="previewCert()" style="padding:4px 10px;font-size:10px">Preview Certificate</button>
        </div>
      ` : `
        <div style="font-size:11px;color:var(--text-faint);line-height:1.5">
          Complete all course chapters to earn your skulls:<br>
          ${['The Generator', 'The Novel', 'The Reader', 'The Catalog', 'The Export'].map((name, i) =>
            `<span style="color:${STATE.skulls[i] ? 'var(--amber)' : 'var(--text-faint)'}">${STATE.skulls[i] ? '💀' : '○'} ${name}</span>`
          ).join(' &nbsp; ')}
        </div>
      `}
    </div>`;
}

function previewCert() {
  window.open('https://endarthur.github.io/etc/cert/#preview=PB-501&n=' +
    encodeURIComponent(document.getElementById('cert-name')?.value || 'Student'), '_blank');
}
