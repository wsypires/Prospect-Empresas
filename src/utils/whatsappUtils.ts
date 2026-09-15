import { PlaceContact } from '../types';

export const DEFAULT_WHATSAPP_TEMPLATE =
  'Olá! Encontrei a {empresa} no Google e gostaria de solicitar mais informações sobre seus serviços.';

export const WHATSAPP_TEMPLATE_STORAGE_KEY = 'encontre_empresas_whatsapp_template';
export const WHATSAPP_TEMPLATES_LIST_KEY = 'encontre_empresas_whatsapp_templates_list';

export interface WhatsAppPresetTemplate {
  id: string;
  title: string;
  description?: string;
  template: string;
  isDefault?: boolean;
}

export const PRESET_WHATSAPP_TEMPLATES: WhatsAppPresetTemplate[] = [
  {
    id: 'prospect',
    title: 'Apresentação / Prospecção Comercial',
    description: 'Ideal para abordar novos clientes potenciais de forma profissional',
    template: 'Olá! Encontrei a {empresa} no Google em {cidade} e gostaria de saber se vocês atendem novos clientes/pedidos no momento.',
    isDefault: true,
  },
  {
    id: 'partnership',
    title: 'Proposta de Parceria B2B',
    description: 'Para entrar em contato com donos ou tomadores de decisão',
    template: 'Olá equipe da {empresa}! Encontrei vocês no Google e gostaria de falar com o responsável sobre uma oportunidade de parceria comercial.',
    isDefault: true,
  },
  {
    id: 'quote',
    title: 'Cotação / Orçamento',
    description: 'Solicitação direta de preços e catálogo',
    template: 'Olá! Localizei o contato da {empresa} no Google e gostaria de solicitar um orçamento e mais detalhes sobre os produtos/serviços.',
    isDefault: true,
  },
  {
    id: 'direct',
    title: 'Contato Rápido e Direto',
    description: 'Mensagem curta e humana para iniciar diálogo rápido',
    template: 'Olá! Tudo bem? Encontrei o contato da {empresa} no Google e gostaria de tirar uma dúvida.',
    isDefault: true,
  },
];

/**
 * Load all saved templates from localStorage (or fallback to presets)
 */
export function getSavedTemplatesList(): WhatsAppPresetTemplate[] {
  try {
    const raw = localStorage.getItem(WHATSAPP_TEMPLATES_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar lista de templates de WhatsApp:', e);
  }
  return [...PRESET_WHATSAPP_TEMPLATES];
}

/**
 * Save template list to localStorage
 */
export function saveTemplatesList(templates: WhatsAppPresetTemplate[]): void {
  try {
    localStorage.setItem(WHATSAPP_TEMPLATES_LIST_KEY, JSON.stringify(templates));
  } catch (e) {
    console.warn('Erro ao persistir lista de templates:', e);
  }
}

/**
 * Replaces dynamic variables in a template string with actual contact properties.
 */
export function formatWhatsAppMessage(template: string, contact: Partial<PlaceContact>): string {
  const tpl = template && template.trim() ? template : DEFAULT_WHATSAPP_TEMPLATE;

  return tpl
    .replace(/{empresa}/gi, contact.name || 'sua empresa')
    .replace(/{nome}/gi, contact.name || 'sua empresa')
    .replace(/{cidade}/gi, contact.city || '')
    .replace(/{nicho}/gi, contact.keyword || '')
    .replace(/{endereco}/gi, contact.address || '')
    .replace(/{bairro}/gi, contact.neighborhood || '')
    .replace(/{telefone}/gi, contact.nationalPhone || '');
}

/**
 * Generates the wa.me URL with the pre-formatted message
 */
export function formatWhatsAppUrl(contact: PlaceContact, template?: string): string | null {
  let phone = contact.whatsappPhone;

  if (!phone) {
    const raw = contact.nationalPhone || contact.internationalPhone || '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      phone = `55${digits}`;
    } else if (digits.length >= 12) {
      phone = digits;
    }
  }

  if (!phone || phone.length < 10) {
    return null;
  }

  const message = formatWhatsAppMessage(template || DEFAULT_WHATSAPP_TEMPLATE, contact);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Load template from localStorage
 */
export function getSavedWhatsAppTemplate(): string {
  try {
    const saved = localStorage.getItem(WHATSAPP_TEMPLATE_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved;
    }
  } catch (e) {
    console.warn('Erro ao carregar template de WhatsApp:', e);
  }
  return DEFAULT_WHATSAPP_TEMPLATE;
}

/**
 * Persist template to localStorage
 */
export function saveWhatsAppTemplate(template: string): void {
  try {
    localStorage.setItem(WHATSAPP_TEMPLATE_STORAGE_KEY, template);
  } catch (e) {
    console.warn('Erro ao salvar template de WhatsApp:', e);
  }
}
