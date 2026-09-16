export interface PlaceContact {
  id: string;
  name: string;
  keyword?: string;
  cnpj: string | null;
  cnpjStatus?: 'verified' | 'search_needed' | 'manual';
  address: string;
  neighborhood?: string;
  postalCode?: string;
  city: string;
  state: string;
  country: string;
  nationalPhone: string | null;
  internationalPhone: string | null;
  whatsappPhone: string | null;
  whatsappUrl: string | null;
  isMobile: boolean;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  userRatingCount: number;
  businessStatus: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  types: string[];
  isOpenNow?: boolean | null;
  outreachStatus?: 'Enviado' | 'Pendente';
  notes?: string;
  isFavorite?: boolean;
}

export interface ContactFilters {
  keyword: string;
  country: string;
  state: string;
  city: string;
  status: 'all' | 'Pendente' | 'Enviado';
}

export const DEFAULT_CONTACT_FILTERS: ContactFilters = {
  keyword: '',
  country: 'all',
  state: 'all',
  city: '',
  status: 'all',
};

export interface SearchFormData {
  keyword: string;
  country: string;
  state: string;
  city: string;
  apiKey?: string;
  maxResults?: number;
  onlyWithPhone?: boolean;
  onlyWithWhatsapp?: boolean;
  minRating?: number;
  accumulate?: boolean;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  total: number;
  places: PlaceContact[];
  nextPageToken: string | null;
  error?: string;
}

export interface BrazilianState {
  uf: string;
  name: string;
}

export const BRAZILIAN_STATES: BrazilianState[] = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

export const POPULAR_KEYWORDS = [
  'Farmácia',
  'Dentista e Clínica Odontológica',
  'Advocacia e Jurídico',
  'Restaurante',
  'Imobiliária',
  'Oficina Mecânica',
  'Contabilidade',
  'Academia',
  'Pet Shop e Veterinária',
  'Estética e Salão de Beleza',
  'Supermercado',
  'Material de Construção',
];

export const COUNTRIES_LIST: string[] = [
  'Brasil',
  'Portugal',
  'Estados Unidos',
  'Argentina',
  'Espanha',
  'França',
  'Itália',
  'Alemanha',
  'Reino Unido',
  'Canadá',
  'Uruguai',
  'Paraguai',
  'Chile',
  'Colômbia',
  'México',
];

export const STATE_CAPITALS: Record<string, string> = {
  AC: 'Rio Branco',
  AL: 'Maceió',
  AP: 'Macapá',
  AM: 'Manaus',
  BA: 'Salvador',
  CE: 'Fortaleza',
  DF: 'Brasília',
  ES: 'Vitória',
  GO: 'Goiânia',
  MA: 'São Luís',
  MT: 'Cuiabá',
  MS: 'Campo Grande',
  MG: 'Belo Horizonte',
  PA: 'Belém',
  PB: 'João Pessoa',
  PR: 'Curitiba',
  PE: 'Recife',
  PI: 'Teresina',
  RJ: 'Rio de Janeiro',
  RN: 'Natal',
  RS: 'Porto Alegre',
  RO: 'Porto Velho',
  RR: 'Boa Vista',
  SC: 'Florianópolis',
  SP: 'São Paulo',
  SE: 'Aracaju',
  TO: 'Palmas',
};

export interface EnvironmentSpec {
  name: string;
  version: string;
  category: string;
  description: string;
  active: boolean;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  suggestedPrompt: string;
  tags: string[];
}

