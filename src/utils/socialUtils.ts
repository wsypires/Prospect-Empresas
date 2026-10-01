import { PlaceContact, CompanySocials } from '../types';

/**
 * Normalizes a raw social URL or handle to a full valid HTTPS URL
 */
export function normalizeSocialUrl(network: keyof CompanySocials, input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // If already starts with http/https
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  // Remove leading @ if present for handle
  const clean = raw.startsWith('@') ? raw.slice(1) : raw;

  switch (network) {
    case 'instagram':
      return clean.includes('instagram.com') ? `https://${clean}` : `https://www.instagram.com/${clean}`;
    case 'facebook':
      return clean.includes('facebook.com') ? `https://${clean}` : `https://www.facebook.com/${clean}`;
    case 'linkedin':
      return clean.includes('linkedin.com') ? `https://${clean}` : `https://www.linkedin.com/company/${clean}`;
    case 'youtube':
      return clean.includes('youtube.com') || clean.includes('youtu.be') ? `https://${clean}` : `https://www.youtube.com/@${clean}`;
    case 'tiktok':
      return clean.includes('tiktok.com') ? `https://${clean}` : `https://www.tiktok.com/@${clean}`;
    case 'twitter':
      return clean.includes('twitter.com') || clean.includes('x.com') ? `https://${clean}` : `https://x.com/${clean}`;
    default:
      return `https://${clean}`;
  }
}

/**
 * Detects if a given URL belongs to a social media platform
 */
export function detectSocialFromUrl(url: string | null | undefined): { network: keyof CompanySocials; url: string } | null {
  if (!url) return null;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('instagram.com/')) {
    return { network: 'instagram', url: trimmed };
  }
  if (lower.includes('facebook.com/') || lower.includes('fb.com/') || lower.includes('fb.me/')) {
    return { network: 'facebook', url: trimmed };
  }
  if (lower.includes('linkedin.com/')) {
    return { network: 'linkedin', url: trimmed };
  }
  if (lower.includes('youtube.com/') || lower.includes('youtu.be/')) {
    return { network: 'youtube', url: trimmed };
  }
  if (lower.includes('tiktok.com/')) {
    return { network: 'tiktok', url: trimmed };
  }
  if (lower.includes('twitter.com/') || lower.includes('x.com/')) {
    return { network: 'twitter', url: trimmed };
  }

  return null;
}

/**
 * Extracts social links from any arbitrary text block (e.g. notes or page HTML)
 */
export function extractSocialsFromText(text: string | null | undefined): Partial<CompanySocials> {
  if (!text) return {};
  const found: Partial<CompanySocials> = {};

  // Instagram pattern
  const instaMatch = text.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._-]+)(?:\/)?/i);
  if (instaMatch && !['p', 'reel', 'stories', 'explore', 'accounts'].includes(instaMatch[1].toLowerCase())) {
    found.instagram = `https://www.instagram.com/${instaMatch[1]}`;
  }

  // Facebook pattern
  const fbMatch = text.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]+)(?:\/)?/i);
  if (fbMatch && !['sharer', 'share', 'policies', 'help'].includes(fbMatch[1].toLowerCase())) {
    found.facebook = `https://www.facebook.com/${fbMatch[1]}`;
  }

  // LinkedIn pattern
  const inMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+)(?:\/)?/i);
  if (inMatch) {
    found.linkedin = inMatch[0].startsWith('http') ? inMatch[0] : `https://${inMatch[0]}`;
  }

  // YouTube pattern
  const ytMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:@[a-zA-Z0-9._-]+|c\/[a-zA-Z0-9._-]+|channel\/[a-zA-Z0-9._-]+)|youtu\.be\/[a-zA-Z0-9._-]+)/i);
  if (ytMatch) {
    found.youtube = ytMatch[0].startsWith('http') ? ytMatch[0] : `https://${ytMatch[0]}`;
  }

  // TikTok pattern
  const ttMatch = text.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._-]+)(?:\/)?/i);
  if (ttMatch) {
    found.tiktok = `https://www.tiktok.com/@${ttMatch[1]}`;
  }

  // Twitter/X pattern
  const xMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9._-]+)(?:\/)?/i);
  if (xMatch && !['intent', 'share', 'home'].includes(xMatch[1].toLowerCase())) {
    found.twitter = `https://x.com/${xMatch[1]}`;
  }

  return found;
}

/**
 * Resolves all effective social links for a place contact by combining:
 * 1. Explicit contact.socials
 * 2. Auto-detection from contact.website (if website is an Instagram / Facebook page)
 * 3. Any mentions in contact.notes
 */
export function getEffectiveSocials(contact: PlaceContact): CompanySocials {
  const result: CompanySocials = {
    instagram: contact.socials?.instagram || null,
    facebook: contact.socials?.facebook || null,
    linkedin: contact.socials?.linkedin || null,
    youtube: contact.socials?.youtube || null,
    tiktok: contact.socials?.tiktok || null,
    twitter: contact.socials?.twitter || null,
  };

  // If website itself is a social network link, populate it!
  if (contact.website) {
    const detected = detectSocialFromUrl(contact.website);
    if (detected && !result[detected.network]) {
      result[detected.network] = detected.url;
    }
  }

  // If notes contain social links or handles
  if (contact.notes) {
    const fromNotes = extractSocialsFromText(contact.notes);
    (Object.keys(fromNotes) as (keyof CompanySocials)[]).forEach((net) => {
      if (!result[net] && fromNotes[net]) {
        result[net] = fromNotes[net]!;
      }
    });
  }

  return result;
}

/**
 * Returns true if the company has at least one social media link
 */
export function hasAnySocial(socials?: CompanySocials | null): boolean {
  if (!socials) return false;
  return Boolean(
    socials.instagram ||
    socials.facebook ||
    socials.linkedin ||
    socials.youtube ||
    socials.tiktok ||
    socials.twitter
  );
}

/**
 * Generates a Google search URL to quickly locate the business's social media page
 */
export function getGoogleSearchSocialUrl(
  network: 'instagram' | 'facebook' | 'linkedin',
  companyName: string,
  city?: string
): string {
  const query = `site:${network}.com "${companyName}" ${city || ''}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
