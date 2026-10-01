import React from 'react';
import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
} from 'lucide-react';
import { PlaceContact } from '../types';
import { getEffectiveSocials, normalizeSocialUrl } from '../utils/socialUtils';

interface SocialIconsProps {
  contact: PlaceContact;
  size?: 'sm' | 'md';
  variant?: 'inline' | 'buttons';
}

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49v-7.14a8.16 8.16 0 0 0 4.91 1.63v-3.46z" />
  </svg>
);

export const SocialIcons: React.FC<SocialIconsProps> = ({
  contact,
  size = 'sm',
  variant = 'inline',
}) => {
  const socials = getEffectiveSocials(contact);

  const hasAny = Boolean(
    socials.instagram ||
    socials.facebook ||
    socials.linkedin ||
    socials.youtube ||
    socials.tiktok ||
    socials.twitter
  );

  if (!hasAny) {
    return null;
  }

  const isSmall = size === 'sm';
  const iconSizeClass = isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const containerBtnClass =
    variant === 'buttons'
      ? 'p-2 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95'
      : 'p-1 rounded-lg transition-all cursor-pointer hover:scale-110 active:scale-95';

  return (
    <div className="inline-flex items-center gap-1">
      {/* Instagram */}
      {socials.instagram && (
        <a
          href={normalizeSocialUrl('instagram', socials.instagram)!}
          target="_blank"
          rel="noreferrer"
          className={`${containerBtnClass} ${
            variant === 'buttons'
              ? 'bg-rose-50/70 border-rose-200/80 text-[#e1306c] hover:bg-rose-100 hover:border-[#e1306c]/40'
              : 'text-slate-400 hover:text-[#e1306c] hover:bg-rose-50'
          }`}
          title={`Acessar Instagram: ${socials.instagram}`}
          aria-label="Instagram da empresa"
        >
          <Instagram className={iconSizeClass} />
        </a>
      )}

      {/* Facebook */}
      {socials.facebook && (
        <a
          href={normalizeSocialUrl('facebook', socials.facebook)!}
          target="_blank"
          rel="noreferrer"
          className={`${containerBtnClass} ${
            variant === 'buttons'
              ? 'bg-blue-50/70 border-blue-200/80 text-[#1877f2] hover:bg-blue-100 hover:border-[#1877f2]/40'
              : 'text-slate-400 hover:text-[#1877f2] hover:bg-blue-50'
          }`}
          title={`Acessar Facebook: ${socials.facebook}`}
          aria-label="Facebook da empresa"
        >
          <Facebook className={iconSizeClass} />
        </a>
      )}

      {/* LinkedIn */}
      {socials.linkedin && (
        <a
          href={normalizeSocialUrl('linkedin', socials.linkedin)!}
          target="_blank"
          rel="noreferrer"
          className={`${containerBtnClass} ${
            variant === 'buttons'
              ? 'bg-sky-50/70 border-sky-200/80 text-[#0a66c2] hover:bg-sky-100 hover:border-[#0a66c2]/40'
              : 'text-slate-400 hover:text-[#0a66c2] hover:bg-sky-50'
          }`}
          title={`Acessar LinkedIn: ${socials.linkedin}`}
          aria-label="LinkedIn da empresa"
        >
          <Linkedin className={iconSizeClass} />
        </a>
      )}

      {/* YouTube */}
      {socials.youtube && (
        <a
          href={normalizeSocialUrl('youtube', socials.youtube)!}
          target="_blank"
          rel="noreferrer"
          className={`${containerBtnClass} ${
            variant === 'buttons'
              ? 'bg-red-50/70 border-red-200/80 text-[#ff0000] hover:bg-red-100 hover:border-[#ff0000]/40'
              : 'text-slate-400 hover:text-[#ff0000] hover:bg-red-50'
          }`}
          title={`Acessar YouTube: ${socials.youtube}`}
          aria-label="Canal do YouTube da empresa"
        >
          <Youtube className={iconSizeClass} />
        </a>
      )}

      {/* TikTok */}
      {socials.tiktok && (
        <a
          href={normalizeSocialUrl('tiktok', socials.tiktok)!}
          target="_blank"
          rel="noreferrer"
          className={`${containerBtnClass} ${
            variant === 'buttons'
              ? 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200 hover:border-slate-400'
              : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={`Acessar TikTok: ${socials.tiktok}`}
          aria-label="TikTok da empresa"
        >
          <TikTokIcon className={iconSizeClass} />
        </a>
      )}

      {/* Twitter / X */}
      {socials.twitter && (
        <a
          href={normalizeSocialUrl('twitter', socials.twitter)!}
          target="_blank"
          rel="noreferrer"
          className={`${containerBtnClass} ${
            variant === 'buttons'
              ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 hover:border-slate-400'
              : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title={`Acessar X (Twitter): ${socials.twitter}`}
          aria-label="X (Twitter) da empresa"
        >
          <Twitter className={iconSizeClass} />
        </a>
      )}
    </div>
  );
};
