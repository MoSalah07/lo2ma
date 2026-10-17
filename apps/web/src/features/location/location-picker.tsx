'use client';

import {
  WORKPLACE_DETAILS_MAX,
  workplaceAt,
  type GeoPoint,
  type Place,
  type Workplace,
} from '@lo2ma/core';
import { mapColors } from '@lo2ma/tokens';
import { LocateFixed, MapPinOff, Minus, Plus, X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Dialog } from 'radix-ui';
import { useRef, useState, type ReactNode } from 'react';
import { fade, scrim } from '@/components/motion/presets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePointLookup } from './api';
import { CenterPin } from './center-pin';
import type { MapHandle } from './map-view';
import { PlaceSearch } from './place-search';
import { useGeolocation } from './use-geolocation';

const MapView = dynamic(() => import('./map-view'), { ssr: false });

/** How far the sheet reaches up over the map, in pixels (its -mt-8). The pin marks the center above it. */
const SHEET_OVERLAP = 32;

interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Workplace;
  onConfirm: (workplace: Workplace) => void;
}

/**
 * Picking a place on a map, the way delivery apps do it: the map moves under a fixed pin, a search finds
 * buildings and districts, «my location» asks the browser, and the sheet below says what is under the pin, whether
 * Lo2ma delivers there, and takes notes for the courier. Full screen on a phone, the app's column on a desktop.
 */
export function LocationPicker({ open, onOpenChange, value, onConfirm }: LocationPickerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* On a desktop the picker is the app's column; the page around it dims. */}
            <Dialog.Overlay forceMount asChild>
              <m.div
                variants={scrim}
                initial="hidden"
                animate="shown"
                exit="hidden"
                className="fixed inset-0 z-40 bg-scrim"
              />
            </Dialog.Overlay>
            <Picker
              value={value}
              onClose={() => onOpenChange(false)}
              onConfirm={(workplace) => {
                onConfirm(workplace);
                onOpenChange(false);
              }}
            />
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** The picker's insides, mounted on each opening so it always starts from the saved workplace. */
function Picker({
  value,
  onClose,
  onConfirm,
}: {
  value: Workplace;
  onClose: () => void;
  onConfirm: (workplace: Workplace) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const map = useRef<MapHandle>(null);
  const [center, setCenter] = useState<GeoPoint>(value.point);
  const [moving, setMoving] = useState(false);
  const [mapAvailable, setMapAvailable] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [details, setDetails] = useState(value.details);
  const lookup = usePointLookup(moving ? null : center);
  const geolocation = useGeolocation();

  /** Search results and «my location» move the map; without a map they move the point alone. */
  function goTo(point: GeoPoint) {
    if (mapAvailable && map.current) map.current.flyTo(point);
    else setCenter(point);
  }

  const place = lookup.data;
  const resolving = moving || lookup.isFetching || !place;
  const outside = place?.inServiceArea === false;

  return (
    <Dialog.Content
      forceMount
      asChild
      // Escape closes the search list first, and only then the picker.
      onEscapeKeyDown={(event) => {
        if (searchOpen) event.preventDefault();
      }}
    >
      <m.div
        variants={fade}
        initial="hidden"
        animate="shown"
        exit="hidden"
        // Full screen on a phone. Wider than the app's column, a card in the middle; a press around it closes it.
        className="fixed inset-0 z-50 flex justify-center app:items-center app:p-8"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex size-full max-w-app flex-col overflow-hidden bg-bg app:h-dialog app:max-h-full app:rounded-32 app:shadow-sheet">
          <div className="relative flex-1 overflow-hidden">
            {mapAvailable ? (
              <MapView
                ref={map}
                // The point chosen so far: «my location» or a search can land before the map has loaded.
                initialCenter={center}
                colors={mapColors[resolvedTheme === 'dark' ? 'dark' : 'light']}
                locale={locale}
                label={t('location.mapLabel')}
                bottomInset={SHEET_OVERLAP}
                onMoveStart={() => setMoving(true)}
                onMoveEnd={(point) => {
                  setMoving(false);
                  setCenter(point);
                }}
                onUnavailable={() => setMapAvailable(false)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-gutter pb-8 text-center">
                <MapPinOff aria-hidden className="size-8 text-muted" />
                <p className="max-w-80 text-body-md text-ink-2">{t('location.mapUnavailable')}</p>
              </div>
            )}
            {mapAvailable && (
              <CenterPin lifted={moving} hint={t('location.pinHint')} className="bottom-8" />
            )}

            <div className="absolute inset-x-0 top-0 flex items-start gap-2 px-bar pt-bar">
              <Dialog.Close asChild>
                <IconButton label={t('common.close')} icon={X} className="shadow-card" />
              </Dialog.Close>
              <PlaceSearch
                open={searchOpen}
                onOpenChange={setSearchOpen}
                onPick={(found: Place) => goTo(found.point)}
              />
            </div>

            <div className="absolute end-bar bottom-12 flex flex-col gap-2">
              {mapAvailable && (
                <>
                  <IconButton
                    label={t('location.zoomIn')}
                    icon={Plus}
                    className="shadow-card"
                    onClick={() => map.current?.zoomBy(1)}
                  />
                  <IconButton
                    label={t('location.zoomOut')}
                    icon={Minus}
                    className="shadow-card"
                    onClick={() => map.current?.zoomBy(-1)}
                  />
                </>
              )}
              <IconButton
                label={
                  geolocation.status === 'locating'
                    ? t('location.locating')
                    : t('location.useMyLocation')
                }
                icon={LocateFixed}
                variant="primary"
                className="shadow-card"
                aria-busy={geolocation.status === 'locating'}
                disabled={geolocation.status === 'locating'}
                onClick={() => geolocation.locate(goTo)}
              />
            </div>
          </div>

          <section className="relative z-10 -mt-8 flex flex-col gap-3 rounded-t-28 bg-surface px-gutter pt-5 pb-screen-end shadow-sheet">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-caption font-semibold text-muted">
                {t('location.title')}
              </Dialog.Title>
              {/* Shown over the pin; here for screen readers, who don't see the pin. */}
              <Dialog.Description className="sr-only">{t('location.pinHint')}</Dialog.Description>
              <div aria-live="polite" className="flex min-h-11 flex-col justify-center gap-1">
                {lookup.isError && !moving ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-body-sm text-ink-2">{t('common.error')}</p>
                    <Button variant="tonal" size="sm" onClick={() => void lookup.refetch()}>
                      {t('common.retry')}
                    </Button>
                  </div>
                ) : resolving ? (
                  <>
                    <span className="sr-only">{t('location.resolving')}</span>
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-3.5 w-2/5" />
                  </>
                ) : (
                  <>
                    <bdi className="text-title-md leading-heading">{place.name[locale]}</bdi>
                    <span className="text-caption text-muted">{place.area[locale]}</span>
                  </>
                )}
              </div>
            </div>

            {!resolving && outside && (
              <Notice>
                <Badge tone="warn" className="self-start">
                  {t('location.outsideArea')}
                </Badge>
                {t('location.outsideAreaBody')}
              </Notice>
            )}
            {(geolocation.status === 'denied' || geolocation.status === 'unavailable') && (
              <Notice role="alert">
                {geolocation.status === 'denied'
                  ? t('location.permissionDenied')
                  : t('location.positionUnavailable')}
              </Notice>
            )}

            <Field label={t('location.detailsLabel')}>
              {(control) => (
                <Input
                  {...control}
                  className="h-11 text-body-md"
                  value={details}
                  maxLength={WORKPLACE_DETAILS_MAX}
                  placeholder={t('location.detailsPlaceholder')}
                  autoComplete="off"
                  onChange={(event) => setDetails(event.target.value)}
                />
              )}
            </Field>

            <Button
              block
              size="md"
              disabled={resolving || outside}
              onClick={() => place && onConfirm(workplaceAt(place, center, details))}
            >
              {t('location.confirm')}
            </Button>

            <p className="text-caption-sm text-muted">
              {t.rich('location.mapCredits', {
                osm: (chunks) => (
                  <Credit href="https://www.openstreetmap.org/copyright">{chunks}</Credit>
                ),
                omt: (chunks) => <Credit href="https://openmaptiles.org/">{chunks}</Credit>,
                ofm: (chunks) => <Credit href="https://openfreemap.org/">{chunks}</Credit>,
              })}
            </p>
          </section>
        </div>
      </m.div>
    </Dialog.Content>
  );
}

/** A short message in the sheet: delivery not reaching the pin yet, or the browser not giving a location. */
function Notice({ role, children }: { role?: 'alert'; children: ReactNode }) {
  return (
    <div
      role={role}
      className="flex flex-col gap-1.5 rounded-16 bg-warn px-3.5 py-2.5 text-caption leading-body text-on-warn"
    >
      {children}
    </div>
  );
}

function Credit({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline">
      {children}
    </a>
  );
}
