import { PlaceContact } from '../types';

export function formatCnpj(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return value;
}

export function exportToCsv(contacts: PlaceContact[], filename: string = 'contatos_google_places.csv', delimiter: string = ';') {
  if (!contacts || contacts.length === 0) return;

  const headers = [
    'Palavra-chave',
    'Nome',
    'CNPJ',
    'WhatsApp (Link)',
    'Telefone Nacional',
    'WhatsApp Número',
    'Tipo Telefone',
    'Endereço Completo',
    'Bairro',
    'CEP',
    'Cidade',
    'Estado',
    'País',
    'Avaliação',
    'Qtd Avaliações',
    'Website',
    'Google Maps URL',
    'Status Funcionamento',
    'Categorias',
  ];

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = contacts.map((c) => {
    return [
      escapeCell(c.keyword || ''),
      escapeCell(c.name),
      escapeCell(c.cnpj || ''),
      escapeCell(c.whatsappUrl || ''),
      escapeCell(c.nationalPhone || ''),
      escapeCell(c.whatsappPhone || ''),
      escapeCell(c.isMobile ? 'Celular / WhatsApp' : 'Fixo'),
      escapeCell(c.address),
      escapeCell(c.neighborhood || ''),
      escapeCell(c.postalCode || ''),
      escapeCell(c.city),
      escapeCell(c.state),
      escapeCell(c.country),
      escapeCell(c.rating !== null ? c.rating.toString().replace('.', ',') : ''),
      escapeCell(c.userRatingCount || 0),
      escapeCell(c.website || ''),
      escapeCell(c.googleMapsUrl || ''),
      escapeCell(c.businessStatus === 'OPERATIONAL' ? 'Operacional' : c.businessStatus),
      escapeCell((c.types || []).slice(0, 3).join(', ')),
    ].join(delimiter);
  });

  // UTF-8 BOM to guarantee Excel in Portuguese opens with proper encoding
  const csvContent = '\uFEFF' + [headers.join(delimiter), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJson(contacts: PlaceContact[], filename: string = 'contatos_google_places.json') {
  if (!contacts || contacts.length === 0) return;

  const jsonContent = JSON.stringify(contacts, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyPhoneListToClipboard(contacts: PlaceContact[]): number {
  const phones = contacts
    .map((c) => c.whatsappPhone || (c.nationalPhone ? c.nationalPhone.replace(/\D/g, '') : null))
    .filter(Boolean);

  const text = phones.join('\n');
  navigator.clipboard.writeText(text);
  return phones.length;
}

export function copyFormattedTableToClipboard(contacts: PlaceContact[]): number {
  const headers = ['Nome', 'CNPJ', 'Telefone', 'WhatsApp URL', 'Endereço', 'Cidade', 'Estado', 'Website'].join('\t');
  const rows = contacts.map((c) =>
    [
      c.name,
      c.cnpj || '',
      c.nationalPhone || '',
      c.whatsappUrl || '',
      c.address,
      c.city,
      c.state,
      c.website || '',
    ].join('\t')
  );

  navigator.clipboard.writeText([headers, ...rows].join('\n'));
  return contacts.length;
}

export type WhatsAppFormatMode = 'table_box' | 'table_cards' | 'table_columns';

/**
 * Helper to truncate and pad strings for fixed-width monospace tables
 */
function padTrunc(text: string, width: number): string {
  const clean = text.replace(/\n/g, ' ').trim();
  if (clean.length > width) {
    return clean.slice(0, Math.max(0, width - 1)) + '…';
  }
  return clean + ' '.repeat(Math.max(0, width - clean.length));
}

/**
 * Cleans phone and formats international wa.me link
 */
function getPhoneDisplayAndLink(contact: PlaceContact): { phoneDisplay: string; waLink: string | null } {
  const raw = contact.whatsappPhone || contact.nationalPhone || contact.internationalPhone || '';
  const digits = raw.replace(/\D/g, '');
  
  if (!digits) {
    return { phoneDisplay: 'Não informado', waLink: null };
  }

  let waDigits = digits;
  if (digits.length === 10 || digits.length === 11) {
    waDigits = `55${digits}`;
  }

  const display = contact.whatsappPhone || contact.nationalPhone || contact.internationalPhone || raw;
  return {
    phoneDisplay: display,
    waLink: contact.whatsappUrl || `https://wa.me/${waDigits}`,
  };
}

/**
 * Generates formatted text message for sharing 1 or more contacts to WhatsApp
 * Strictly limited to: Nome, WhatsApp, Endereço in organized table format
 */
export function generateWhatsAppShareMessage(
  contacts: PlaceContact[],
  customIntro?: string,
  mode: WhatsAppFormatMode = 'table_cards'
): string {
  if (!contacts || contacts.length === 0) return '';

  const isSingle = contacts.length === 1;

  // 1. FORMATO: TABELA COM MOLDURA MONOSPACE (``` Box Table ```)
  if (mode === 'table_box') {
    const lines: string[] = [];

    if (customIntro && customIntro.trim()) {
      lines.push(customIntro.trim());
      lines.push('');
    }

    if (isSingle) {
      const c = contacts[0];
      const { phoneDisplay, waLink } = getPhoneDisplayAndLink(c);

      lines.push('📋 *TABELA DE CONTATO*');
      lines.push('```');
      lines.push('┌──────────┬─────────────────────────────────────┐');
      lines.push(`│ NOME     │ ${padTrunc(c.name, 35)} │`);
      lines.push('├──────────┼─────────────────────────────────────┤');
      lines.push(`│ WHATSAPP │ ${padTrunc(phoneDisplay, 35)} │`);
      lines.push('├──────────┼─────────────────────────────────────┤');
      lines.push(`│ ENDEREÇO │ ${padTrunc(c.address, 35)} │`);
      lines.push('└──────────┴─────────────────────────────────────┘');
      lines.push('```');

      if (waLink) {
        lines.push(`💬 *Chamar no WhatsApp:* ${waLink}`);
      }
      return lines.join('\n');
    }

    // Multiple contacts in table_box
    const colNum = 3;
    const colName = 20;
    const colPhone = 15;
    const colAddr = 30;

    lines.push(`📋 *TABELA DE CONTATOS (${contacts.length} empresas)*`);
    lines.push('```');
    // Top border
    lines.push(
      `┌─${'─'.repeat(colNum)}─┬─${'─'.repeat(colName)}─┬─${'─'.repeat(colPhone)}─┬─${'─'.repeat(colAddr)}─┐`
    );
    // Header row
    lines.push(
      `│ ${padTrunc('#', colNum)} │ ${padTrunc('NOME', colName)} │ ${padTrunc('WHATSAPP', colPhone)} │ ${padTrunc('ENDEREÇO', colAddr)} │`
    );
    // Divider
    lines.push(
      `├─${'─'.repeat(colNum)}─┼─${'─'.repeat(colName)}─┼─${'─'.repeat(colPhone)}─┼─${'─'.repeat(colAddr)}─┤`
    );

    contacts.forEach((c, idx) => {
      const { phoneDisplay } = getPhoneDisplayAndLink(c);
      const numStr = String(idx + 1);
      lines.push(
        `│ ${padTrunc(numStr, colNum)} │ ${padTrunc(c.name, colName)} │ ${padTrunc(phoneDisplay, colPhone)} │ ${padTrunc(c.address, colAddr)} │`
      );
    });

    // Bottom border
    lines.push(
      `└─${'─'.repeat(colNum)}─┴─${'─'.repeat(colName)}─┴─${'─'.repeat(colPhone)}─┴─${'─'.repeat(colAddr)}─┘`
    );
    lines.push('```');

    // Direct WhatsApp quick links
    const withLinks = contacts
      .map((c, i) => {
        const { waLink } = getPhoneDisplayAndLink(c);
        return waLink ? `${i + 1}. *${c.name}:* ${waLink}` : null;
      })
      .filter(Boolean);

    if (withLinks.length > 0) {
      lines.push('');
      lines.push('💬 *Links diretos para WhatsApp:*');
      lines.push(withLinks.slice(0, 15).join('\n'));
      if (withLinks.length > 15) {
        lines.push(`_... e mais ${withLinks.length - 15} links_`);
      }
    }

    return lines.join('\n');
  }

  // 2. FORMATO: TABELA EM COLUNAS SIMPLES (``` Colunas com Barras ```)
  if (mode === 'table_columns') {
    const lines: string[] = [];

    if (customIntro && customIntro.trim()) {
      lines.push(customIntro.trim());
      lines.push('');
    }

    lines.push(`📋 *TABELA DE CONTATOS (${contacts.length} empresas)*`);
    lines.push('```');
    lines.push('NOME | WHATSAPP | ENDEREÇO');
    lines.push('─────────────────────────────────────────────');

    contacts.forEach((c, idx) => {
      const { phoneDisplay } = getPhoneDisplayAndLink(c);
      lines.push(`${idx + 1}. ${c.name} | ${phoneDisplay} | ${c.address}`);
    });
    lines.push('```');

    // Direct links list
    const withLinks = contacts
      .map((c, i) => {
        const { waLink } = getPhoneDisplayAndLink(c);
        return waLink ? `${i + 1}. *${c.name}:* ${waLink}` : null;
      })
      .filter(Boolean);

    if (withLinks.length > 0) {
      lines.push('');
      lines.push('💬 *Links diretos:*');
      lines.push(withLinks.slice(0, 15).join('\n'));
    }

    return lines.join('\n');
  }

  // 3. FORMATO PADRÃO: TABELA ESTRUTURADA EM CARTÕES (Organizado, legível no celular, com links diretos)
  const lines: string[] = [];

  if (customIntro && customIntro.trim()) {
    lines.push(customIntro.trim());
    lines.push('');
  }

  if (isSingle) {
    const c = contacts[0];
    const { phoneDisplay, waLink } = getPhoneDisplayAndLink(c);

    lines.push('📋 *DADOS DO CONTATO*');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`🏢 *Nome:* ${c.name}`);
    lines.push(`💬 *WhatsApp:* ${phoneDisplay}`);
    if (waLink) {
      lines.push(`   👉 Link: ${waLink}`);
    }
    lines.push(`📍 *Endereço:* ${c.address}`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
  }

  // Multiple contacts (table_cards)
  lines.push(`📋 *TABELA DE CONTATOS (${contacts.length} empresas)*`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  contacts.forEach((c, idx) => {
    const num = idx + 1;
    const { phoneDisplay, waLink } = getPhoneDisplayAndLink(c);

    lines.push(`*${num}. ${c.name}*`);
    lines.push(`💬 *WhatsApp:* ${phoneDisplay}`);
    if (waLink) {
      lines.push(`   👉 Conversar: ${waLink}`);
    }
    lines.push(`📍 *Endereço:* ${c.address}`);
    lines.push('────────────────────────────────────');
  });

  return lines.join('\n');
}

/**
 * Builds a direct wa.me or api.whatsapp.com URL with the encoded message
 */
export function getWhatsAppShareUrl(messageText: string, recipientPhone?: string): string {
  const encoded = encodeURIComponent(messageText);
  if (recipientPhone) {
    const digits = recipientPhone.replace(/\D/g, '');
    let clean = digits;
    if (digits.length === 10 || digits.length === 11) {
      clean = `55${digits}`;
    }
    return `https://wa.me/${clean}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}
