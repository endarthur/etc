// ═══════════════════════════════════════════
// CERTIFICATE CLAIM
// ═══════════════════════════════════════════
const CERT_SALT = 'patchbay-gcu-2026';
const CERT_WORKSHOP_ID = 'PB-401';
const CERT_REPO = 'endarthur/etc';

async function computeCompletionHash(workshopId, date) {
  const data = new TextEncoder().encode(workshopId + ':' + date + ':' + CERT_SALT);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
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

  const today = new Date().toISOString().slice(0, 10);
  const hash = await computeCompletionHash(CERT_WORKSHOP_ID, today);

  const params = new URLSearchParams({
    template: 'cert-request.yml',
    title: `cert: ${CERT_WORKSHOP_ID}`,
    fullname: name,
    workshop: CERT_WORKSHOP_ID,
    date: today,
    hash: hash,
  });
  const url = `https://github.com/${CERT_REPO}/issues/new?${params}`;

  status.textContent = 'Opening GitHub — submit the issue to receive your certificate.';
  status.style.color = 'var(--cyan)';
  window.open(url, '_blank');
}
