// ═══════════════════════════════════════════
// COVER COMPOSITOR
// Canvas-based title overlay on generated illustrations
// ═══════════════════════════════════════════

const COVER_TEMPLATES = [
  {
    id: 'top-bold',
    name: 'Top Bold',
    desc: 'Large title at top, author at bottom',
    render(ctx, w, h, title, author) {
      // Dark gradient at top
      const gTop = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      gTop.addColorStop(0, 'rgba(0,0,0,0.7)');
      gTop.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gTop;
      ctx.fillRect(0, 0, w, h * 0.4);

      // Dark gradient at bottom
      const gBot = ctx.createLinearGradient(0, h * 0.85, 0, h);
      gBot.addColorStop(0, 'rgba(0,0,0,0)');
      gBot.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = gBot;
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

      // Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(w * 0.09)}px Georgia, serif`;
      wrapText(ctx, title.toUpperCase(), w / 2, h * 0.1, w * 0.85, Math.round(w * 0.11));

      // Author
      ctx.font = `${Math.round(w * 0.035)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(author, w / 2, h * 0.94);
    },
  },
  {
    id: 'centered',
    name: 'Centered',
    desc: 'Title centered, author below',
    render(ctx, w, h, title, author) {
      // Full dark overlay
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, w, h);

      // Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(w * 0.08)}px Georgia, serif`;
      wrapText(ctx, title, w / 2, h * 0.38, w * 0.8, Math.round(w * 0.10));

      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.55);
      ctx.lineTo(w * 0.7, h * 0.55);
      ctx.stroke();

      // Author
      ctx.font = `italic ${Math.round(w * 0.04)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(author, w / 2, h * 0.60);
    },
  },
  {
    id: 'bottom-bar',
    name: 'Bottom Bar',
    desc: 'Dark bar at bottom with title + author',
    render(ctx, w, h, title, author) {
      // Solid dark bar at bottom
      const barH = h * 0.22;
      const barY = h - barH;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, barY, w, barH);

      // Subtle gradient above bar
      const gAbove = ctx.createLinearGradient(0, barY - h * 0.08, 0, barY);
      gAbove.addColorStop(0, 'rgba(0,0,0,0)');
      gAbove.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = gAbove;
      ctx.fillRect(0, barY - h * 0.08, w, h * 0.08);

      // Title
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(w * 0.065)}px Georgia, serif`;
      wrapText(ctx, title, w * 0.08, barY + barH * 0.2, w * 0.84, Math.round(w * 0.08));

      // Author
      ctx.font = `${Math.round(w * 0.032)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(author, w * 0.08, barY + barH * 0.85);
    },
  },
  {
    id: 'split',
    name: 'Split',
    desc: 'Top overlay for title, illustration below',
    render(ctx, w, h, title, author) {
      // Dark overlay on top third
      const gTop = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      gTop.addColorStop(0, 'rgba(0,0,0,0.75)');
      gTop.addColorStop(0.7, 'rgba(0,0,0,0.6)');
      gTop.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gTop;
      ctx.fillRect(0, 0, w, h * 0.45);

      // Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(w * 0.075)}px Georgia, serif`;
      wrapText(ctx, title, w / 2, h * 0.08, w * 0.85, Math.round(w * 0.09));

      // Author
      ctx.font = `${Math.round(w * 0.035)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(author, w / 2, h * 0.30);
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Small title, illustration dominates',
    render(ctx, w, h, title, author) {
      // Subtle gradient at bottom only
      const gBot = ctx.createLinearGradient(0, h * 0.8, 0, h);
      gBot.addColorStop(0, 'rgba(0,0,0,0)');
      gBot.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = gBot;
      ctx.fillRect(0, h * 0.8, w, h * 0.2);

      // Title — small, bottom right
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${Math.round(w * 0.045)}px Georgia, serif`;
      ctx.fillText(title, w * 0.92, h * 0.92);

      // Author — smaller, above title
      ctx.font = `${Math.round(w * 0.028)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(author, w * 0.92, h * 0.96);
    },
  },
];

// ─── Text wrapping utility ───
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  const align = ctx.textAlign;

  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, curY);
}

// ─── Compositing ───
function compositeCovers() {
  const novel = STATE.novels[STATE.currentNovel];
  if (!novel || !novel.coverIllustration) {
    alert('Generate a cover illustration first.');
    return;
  }

  const title = extractTitle(novel.bible) || 'Untitled';
  const author = 'NaNoGEon';
  const templateId = STATE.coverTemplate || 'top-bold';
  const template = COVER_TEMPLATES.find(t => t.id === templateId);
  if (!template) return;

  const canvas = document.createElement('canvas');
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    // Draw illustration
    ctx.drawImage(img, 0, 0);

    // Apply template overlay
    template.render(ctx, canvas.width, canvas.height, title, author);

    // Store composited cover
    novel.cover = canvas.toDataURL('image/jpeg', 0.9);
    saveState();

    // Update UI
    displayCover(novel.cover);
    renderLibrary();
  };
  img.src = novel.coverIllustration;
}

// ─── Render compositor UI in Editorial ───
function renderCompositorPreview() {
  const novel = STATE.novels[STATE.currentNovel];
  if (!novel || !novel.coverIllustration) return '';

  const title = extractTitle(novel.bible) || 'Untitled';
  const templateId = STATE.coverTemplate || 'top-bold';

  const templateOptions = COVER_TEMPLATES.map(t =>
    `<option value="${t.id}" ${t.id === templateId ? 'selected' : ''}>${t.name} — ${t.desc}</option>`
  ).join('');

  return `
    <div style="display:flex;gap:8px;align-items:end;margin-top:8px">
      <div class="sf" style="flex:1">
        <label>Layout Template</label>
        <select onchange="STATE.coverTemplate=this.value;saveState();compositeCovers()">
          ${templateOptions}
        </select>
      </div>
      <button class="btn" onclick="compositeCovers()" style="padding:5px 12px;font-size:10px">Apply</button>
    </div>`;
}
