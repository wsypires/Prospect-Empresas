import React, { useEffect, useRef, useState } from 'react';
import { MapPin, MessageCircle, Phone, Star, ExternalLink, Globe } from 'lucide-react';
import { PlaceContact } from '../types';
import { formatWhatsAppUrl } from '../utils/whatsappUtils';

interface InteractiveMapProps {
  contacts: PlaceContact[];
  apiKey: string;
  onOpenCnpjModal: (contact: PlaceContact) => void;
  whatsappTemplate?: string;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapCallback?: () => void;
  }
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  contacts,
  apiKey,
  onOpenCnpjModal,
  whatsappTemplate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedContact, setSelectedContact] = useState<PlaceContact | null>(contacts[0] || null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const validLocations = contacts.filter((c) => c.location && c.location.lat && c.location.lng);

  useEffect(() => {
    if (!apiKey || validLocations.length === 0 || !mapContainerRef.current) return;

    // Check if google maps script is already on page
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
        initMap();
      };
      script.onerror = () => {
        setMapError('Não foi possível carregar a API do Google Maps.');
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      try {
        if (!mapContainerRef.current || !window.google || !window.google.maps) return;

        const centerLat = validLocations[0].location!.lat;
        const centerLng = validLocations[0].location!.lng;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'simplified' }],
            },
          ],
        });

        const bounds = new window.google.maps.LatLngBounds();

        validLocations.forEach((contact) => {
          const position = {
            lat: contact.location!.lat,
            lng: contact.location!.lng,
          };
          bounds.extend(position);

          const marker = new window.google.maps.Marker({
            position,
            map,
            title: contact.name,
            animation: window.google.maps.Animation.DROP,
          });

          marker.addListener('click', () => {
            setSelectedContact(contact);
          });
        });

        if (validLocations.length > 1) {
          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        }
        setMapLoaded(true);
      } catch (err: any) {
        console.error('Google Maps init error:', err);
        setMapError('Visualização de mapa interativo indisponível para esta chave.');
      }
    }
  }, [apiKey, contacts]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
      {/* Left List of places */}
      <div className="lg:col-span-5 border-r border-slate-200 max-h-[550px] overflow-y-auto divide-y divide-slate-100">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Locais Mapeados ({validLocations.length})
          </h4>
        </div>
        {contacts.map((contact) => {
          const isSelected = selectedContact?.id === contact.id;
          return (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-3.5 cursor-pointer transition-colors ${
                isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h5 className="font-bold text-slate-900 text-xs">{contact.name}</h5>
                {contact.rating && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {contact.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{contact.address}</p>
              <div className="mt-2 flex items-center justify-between">
                {contact.whatsappUrl ? (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp Ativo
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {contact.nationalPhone || 'Sem telefone'}
                  </span>
                )}
                {contact.cnpj && (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    CNPJ Ativo
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Map Canvas & Details Overlay */}
      <div className="lg:col-span-7 relative bg-slate-100 min-h-[350px] lg:min-h-[550px] flex flex-col">
        {/* Google Map Container */}
        <div ref={mapContainerRef} className="w-full h-full min-h-[350px] flex-1" />

        {/* Fallback info if map script couldn't render */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-50/95 text-center">
            <div className="max-w-sm">
              <MapPin className="w-10 h-10 text-indigo-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-700">{mapError}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Você pode utilizar os links diretos para visualizar cada estabelecimento no Google Maps.
              </p>
            </div>
          </div>
        )}

        {/* Selected Place Overlay Card */}
        {selectedContact && (
          <div className="p-4 bg-white border-t border-slate-200 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedContact.name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{selectedContact.address}</p>
              </div>
              {selectedContact.rating && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {selectedContact.rating.toFixed(1)}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              {selectedContact.whatsappUrl && (
                <a
                  href={formatWhatsAppUrl(selectedContact, whatsappTemplate) || selectedContact.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Chamar no WhatsApp</span>
                </a>
              )}
              {selectedContact.nationalPhone && (
                <a
                  href={`tel:${selectedContact.nationalPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedContact.nationalPhone}</span>
                </a>
              )}
              {selectedContact.googleMapsUrl && (
                <a
                  href={selectedContact.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl ml-auto"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Rotas no Maps</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
