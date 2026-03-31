type JuegoGrupo = {
  vendedor: {
    nombre?: string | null;
    telefono?: string | null;
    documento?: string | null;
    direccion?: string | null;
  };
  totalBoletas: number;
  boletas: Array<{ numero: string }>;
};

type JuegoReportInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  rifaNombre: string;
  loteriaNombre?: string | null;
  premioNombre: string;
  premioDescripcion?: string | null;
  premioFecha: string;
  totalBoletas: number;
  grupos: JuegoGrupo[];
};

function escapeHtml(value: string) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPrintDateTime(date: Date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

function buildColumns(groups: JuegoGrupo[]) {
  const maxRows = Math.max(...groups.map((group) => group.boletas.length), 0);
  const rows = Array.from({ length: maxRows }, (_, rowIndex) =>
    groups.map((group) => group.boletas[rowIndex]?.numero || '')
  );

  return rows;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function printHtmlDocument(title: string, html: string) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';

  document.body.appendChild(iframe);

  const printDocument = iframe.contentWindow?.document;
  const printWindow = iframe.contentWindow;

  if (!printDocument || !printWindow) {
    document.body.removeChild(iframe);
    throw new Error('No se pudo preparar la impresion.');
  }

  printDocument.open();
  printDocument.write(`
    <html>
      <head><title>${escapeHtml(title)}</title></head>
      <body>${html}</body>
    </html>
  `);
  printDocument.close();

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  iframe.onload = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } finally {
      cleanup();
    }
  };
}

export function downloadJuegoExcel(input: JuegoReportInput) {
  const printedAt = formatPrintDateTime(new Date());
  const rows = buildColumns(input.grupos);

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          ${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}
        </tr>
      `
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #94a3b8; padding: 6px 10px; font-family: Arial; }
          .meta { background: #e0f2fe; font-weight: 700; }
          .vendor { background: #dcfce7; font-weight: 700; }
          .total { background: #fef3c7; font-weight: 700; }
        </style>
      </head>
      <body>
        <table>
          <tr><th colspan="${Math.max(input.grupos.length, 1)}" class="meta">${escapeHtml(input.companyName)} - ${escapeHtml(input.rifaNombre)} - JUEGO</th></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Loteria: ${escapeHtml(input.loteriaNombre || 'N/A')}</td></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Premio: ${escapeHtml(input.premioNombre)}</td></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Descripcion premio: ${escapeHtml(input.premioDescripcion || 'Sin descripcion')}</td></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Juega: ${escapeHtml(input.premioFecha)}</td></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Responsable: ${escapeHtml(input.responsableNombre || 'N/A')}</td></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Autoriza: ${escapeHtml(input.entidadAutoriza || 'N/A')} / ${escapeHtml(input.numeroResolucionAutorizacion || 'N/A')}</td></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Total boletas que juegan: ${input.totalBoletas.toLocaleString('es-CO')}</td></tr>
          <tr><td colspan="${Math.max(input.grupos.length, 1)}">Impreso: ${escapeHtml(printedAt)}</td></tr>
          <tr>${input.grupos.map((group) => `<th class="vendor">${escapeHtml(group.vendedor.nombre || 'Sin vendedor')}</th>`).join('')}</tr>
          <tr>${input.grupos.map((group) => `<th class="total">Total: ${group.totalBoletas.toLocaleString('es-CO')}</th>`).join('')}</tr>
          ${tableRows}
        </table>
      </body>
    </html>
  `;

  const fileName = `juego-${input.rifaNombre.replace(/\s+/g, '-').toLowerCase()}.xls`;
  downloadFile(fileName, html, 'application/vnd.ms-excel;charset=utf-8;');
}

export function printJuegoLetterReport(input: JuegoReportInput) {
  const printedAt = formatPrintDateTime(new Date());
  const groupChunks = [];

  for (let index = 0; index < input.grupos.length; index += 4) {
    groupChunks.push(input.grupos.slice(index, index + 4));
  }

  const pagesHtml = groupChunks
    .map((chunk, chunkIndex) => {
      const rows = buildColumns(chunk);
      const bodyRows = rows
        .map(
          (row) => `
            <tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>
          `
        )
        .join('');

      return `
        <section class="page ${chunkIndex > 0 ? 'page-break' : ''}">
          <section class="header">
            <div class="logo-wrap">
              ${input.logoDataUrl ? `<img src="${input.logoDataUrl}" alt="${escapeHtml(input.companyName)}" />` : ''}
            </div>
            <div>
              <div class="eyebrow">Informe de juego</div>
              <h1>${escapeHtml(input.companyName)} - ${escapeHtml(input.rifaNombre)}</h1>
              <p>Boletas que si juegan por vendedor en la rifa seleccionada.</p>
            </div>
          </section>

          <section class="meta-grid">
            <div class="meta-card"><div class="label">Responsable</div><div class="value">${escapeHtml(input.responsableNombre || 'N/A')}</div></div>
            <div class="meta-card"><div class="label">Telefono</div><div class="value">${escapeHtml(input.responsableTelefono || 'N/A')}</div></div>
            <div class="meta-card"><div class="label">Ubicacion</div><div class="value">${escapeHtml([input.responsableDireccion, input.responsableCiudad, input.responsableDepartamento].filter(Boolean).join(' - ') || 'N/A')}</div></div>
            <div class="meta-card"><div class="label">Autorizacion</div><div class="value">${escapeHtml([input.entidadAutoriza, input.numeroResolucionAutorizacion].filter(Boolean).join(' / ') || 'N/A')}</div></div>
          </section>

          <section class="summary-grid">
            <div class="summary-card">
              <div class="label">Loteria</div>
              <div class="value">${escapeHtml(input.loteriaNombre || 'N/A')}</div>
            </div>
            <div class="summary-card">
              <div class="label">Premio</div>
              <div class="value">${escapeHtml(input.premioNombre)}</div>
            </div>
            <div class="summary-card">
              <div class="label">Juega</div>
              <div class="value">${escapeHtml(input.premioFecha)}</div>
            </div>
          </section>

          <section class="summary-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr));">
            <div class="summary-card">
              <div class="label">Total boletas que juegan</div>
              <div class="big">${input.totalBoletas.toLocaleString('es-CO')}</div>
            </div>
            <div class="summary-card">
              <div class="label">Vendedores visibles</div>
              <div class="big">${chunk.length.toLocaleString('es-CO')}</div>
            </div>
            <div class="summary-card">
              <div class="label">Impreso</div>
              <div class="value">${escapeHtml(printedAt)}</div>
            </div>
          </section>

          <section class="summary-card" style="margin-top: 12px;">
            <div class="label">Descripcion del premio</div>
            <div class="value">${escapeHtml(input.premioDescripcion || 'Sin descripcion')}</div>
          </section>

          <section class="table-wrap">
            <table>
              <thead>
                <tr>${chunk.map((group) => `<th class="vendor-head">${escapeHtml(group.vendedor.nombre || 'Sin vendedor')}</th>`).join('')}</tr>
                <tr>${chunk.map((group) => `<th class="total-head">Total: ${group.totalBoletas.toLocaleString('es-CO')}</th>`).join('')}</tr>
              </thead>
              <tbody>${bodyRows || '<tr><td colspan="4">Sin boletas que juegan</td></tr>'}</tbody>
            </table>
          </section>
        </section>
      `;
    })
    .join('');

  printHtmlDocument(
    `${input.companyName} - Juego`,
    `
      <style>
        @page { size: letter landscape; margin: 12mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; }
        .page-break { page-break-before: always; }
        .header {
          display: grid; grid-template-columns: 88px 1fr; gap: 18px; align-items: center;
          border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px 18px;
          background: linear-gradient(135deg, #f8fafc 0%, #ecfeff 100%);
        }
        .logo-wrap {
          width: 88px; height: 88px; border-radius: 18px; border: 1px solid #dbeafe;
          background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .logo-wrap img { max-width: 80px; max-height: 80px; object-fit: contain; }
        .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .16em; color: #64748b; text-transform: uppercase; }
        h1 { margin: 6px 0 0; font-size: 26px; line-height: 1.1; font-weight: 800; text-transform: uppercase; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #475569; }
        .meta-grid, .summary-grid { display: grid; gap: 10px; margin-top: 12px; }
        .meta-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .meta-card, .summary-card { border: 1px solid #cbd5e1; border-radius: 14px; padding: 12px; background: #fff; }
        .label { font-size: 10px; font-weight: 700; letter-spacing: .12em; color: #64748b; text-transform: uppercase; }
        .value { margin-top: 8px; font-size: 13px; font-weight: 700; }
        .big { margin-top: 8px; font-size: 28px; font-weight: 800; }
        .table-wrap { margin-top: 16px; border: 1px solid #cbd5e1; border-radius: 16px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: center; }
        .vendor-head { background: #dcfce7; font-weight: 800; }
        .total-head { background: #fef3c7; font-weight: 700; }
      </style>
      ${pagesHtml}
    `
  );
}
