export interface TransacaoExtrato {
  id: string;         // identificador único do extrato
  data: Date;
  descricao: string;
  valor: number;      // sempre positivo
  tipo: 'entrada' | 'saida';
  origem: string;     // descrição original do extrato
}

// ─── OFX Parser ────────────────────────────────────────────────────────────
// Suporta o formato SGML exportado por Bradesco, Itaú, Santander, Nubank, etc.

function parseOFXDate(raw: string): Date {
  // Formatos: 20240101, 20240101120000, 20240101120000[-3:BRT]
  const clean = raw.replace(/\[.*\]/, '').trim();
  const year  = parseInt(clean.substring(0, 4));
  const month = parseInt(clean.substring(4, 6)) - 1;
  const day   = parseInt(clean.substring(6, 8));
  return new Date(year, month, day);
}

export function parseOFX(content: string): TransacaoExtrato[] {
  const transactions: TransacaoExtrato[] = [];

  // Normaliza quebras de linha
  const text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Extrai blocos <STMTTRN>...</STMTTRN>
  const blockRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  let idx = 0;
  while ((match = blockRegex.exec(text)) !== null) {
    const block = match[1];

    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^\n<]+)`, 'i'));
      return m ? m[1].trim() : '';
    };

    const dtRaw    = get('DTPOSTED');
    const amtRaw   = get('TRNAMT');
    const memo     = get('MEMO') || get('NAME') || '';
    const fitid    = get('FITID') || String(idx++);
    const trntype  = get('TRNTYPE').toUpperCase();

    if (!dtRaw || !amtRaw) continue;

    const valor = Math.abs(parseFloat(amtRaw.replace(',', '.')));
    if (isNaN(valor) || valor === 0) continue;

    // Tipo: se TRNAMT negativo ou TRNTYPE é DEBIT/CHECK → saída
    const rawAmt = parseFloat(amtRaw.replace(',', '.'));
    const tipo: 'entrada' | 'saida' =
      rawAmt < 0 || ['DEBIT', 'CHECK', 'PAYMENT', 'XFER'].includes(trntype)
        ? 'saida'
        : 'entrada';

    transactions.push({
      id: fitid,
      data: parseOFXDate(dtRaw),
      descricao: memo,
      valor,
      tipo,
      origem: memo,
    });
  }

  return transactions;
}

// ─── CSV Parser ─────────────────────────────────────────────────────────────
// Detecta automaticamente o formato (Nubank, Inter, genérico)

function detectCSVSeparator(line: string): string {
  if ((line.match(/;/g) || []).length > (line.match(/,/g) || []).length) return ';';
  return ',';
}

function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(raw: string): Date | null {
  raw = raw.trim().replace(/"/g, '');

  // ISO: 2024-01-15
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // BR: 15/01/2024
  if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
    const [d, m, y] = raw.substring(0, 10).split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  // BR curto: 15/01/24
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(raw)) {
    const [d, m, y] = raw.split('/').map(Number);
    return new Date(2000 + y, m - 1, d);
  }
  return null;
}

function parseValue(raw: string): number | null {
  if (!raw) return null;
  // Remove R$, espaços, aspas
  let clean = raw.replace(/[R$\s"]/g, '').trim();
  // Converte separador BR (1.234,56 → 1234.56)
  if (/\d+\.\d{3},\d{2}/.test(clean)) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (/,/.test(clean) && !/\./.test(clean)) {
    clean = clean.replace(',', '.');
  }
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
}

export function parseCSV(content: string): TransacaoExtrato[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const sep = detectCSVSeparator(lines[0]);
  const headers = parseCSVLine(lines[0], sep).map(h => h.toLowerCase().replace(/"/g, '').trim());

  // Mapeamento de colunas por banco
  const colData   = findCol(headers, ['data', 'date', 'dt lançamento', 'dt lancamento', 'lançamento']);
  const colValor  = findCol(headers, ['valor', 'value', 'amount', 'vlr', 'transação', 'transacao']);
  const colDesc   = findCol(headers, ['descrição', 'descricao', 'description', 'memo', 'estabelecimento', 'histórico', 'historico', 'identificador']);
  const colTipo   = findCol(headers, ['tipo', 'type', 'natureza']);

  if (colData === -1 || colValor === -1) return [];

  const transactions: TransacaoExtrato[] = [];
  let idx = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], sep);
    if (cols.length < 2) continue;

    const dataRaw  = cols[colData]  || '';
    const valorRaw = cols[colValor] || '';
    const descRaw  = colDesc >= 0 ? cols[colDesc] || '' : '';
    const tipoRaw  = colTipo >= 0 ? cols[colTipo] || '' : '';

    const data = parseDate(dataRaw);
    if (!data) continue;

    const rawVal = parseValue(valorRaw);
    if (rawVal === null) continue;

    const valor = Math.abs(rawVal);
    if (valor === 0) continue;

    // Determinar tipo
    let tipo: 'entrada' | 'saida';
    if (tipoRaw) {
      tipo = /créd|cred|entrada|receita|deposit/i.test(tipoRaw) ? 'entrada' : 'saida';
    } else {
      tipo = rawVal < 0 ? 'saida' : 'entrada';
    }

    const descricao = descRaw.replace(/"/g, '').trim() || `Transação ${idx + 1}`;

    transactions.push({
      id: `csv-${i}-${idx++}`,
      data,
      descricao,
      valor,
      tipo,
      origem: descricao,
    });
  }

  return transactions;
}

function findCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(h => h.includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

// ─── Auto-detect & parse ────────────────────────────────────────────────────

export function parseExtrato(content: string, filename: string): TransacaoExtrato[] {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'ofx' || ext === 'qfx') {
    return parseOFX(content);
  }
  if (ext === 'csv') {
    return parseCSV(content);
  }
  // Tenta detectar pelo conteúdo
  if (content.includes('<OFX>') || content.includes('OFXHEADER')) {
    return parseOFX(content);
  }
  return parseCSV(content);
}
