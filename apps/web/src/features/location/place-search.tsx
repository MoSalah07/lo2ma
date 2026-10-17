'use client';

import type { Place } from '@lo2ma/core';
import { MapPin, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState, type KeyboardEvent } from 'react';
import { focusRing } from '@/components/ui/focus';
import { cn } from '@/lib/cn';
import { useDebounced } from '@/lib/use-debounced';
import { MIN_QUERY_LENGTH, usePlaceSearch, useSuggestedPlaces } from './api';

interface PlaceSearchProps {
  /** Whether the list under the field is showing. The picker needs to know, so Escape closes the list first. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (place: Place) => void;
}

/**
 * The search over the map, as an ARIA combobox: popular workplaces before anything is typed, matches after.
 * Arrow keys move through the list while focus stays in the field, Enter picks, Escape closes the list.
 */
export function PlaceSearch({ open, onOpenChange, onPick }: PlaceSearchProps) {
  const t = useTranslations('location');
  const locale = useLocale();
  const id = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const typed = useDebounced(query).trim();
  const searching = typed.length >= MIN_QUERY_LENGTH;
  const search = usePlaceSearch(typed);
  const suggested = useSuggestedPlaces();
  const options = (searching ? search.data : suggested.data) ?? [];
  const optionId = (index: number) => `${id}-option-${index}`;

  function pick(place: Place) {
    onPick(place);
    setQuery('');
    setActive(-1);
    onOpenChange(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      onOpenChange(true);
      const count = options.length;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      // From the field, down goes to the first place and up to the last; then it wraps around.
      setActive((current) =>
        count === 0
          ? -1
          : current < 0
            ? step > 0
              ? 0
              : count - 1
            : (current + step + count) % count,
      );
    } else if (event.key === 'Enter') {
      const place = options[active] ?? (searching ? options[0] : undefined);
      if (place) {
        event.preventDefault();
        pick(place);
      }
    } else if (event.key === 'Escape' && open) {
      onOpenChange(false);
      setActive(-1);
    }
  }

  const showing = open && (options.length > 0 || searching);

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={`${id}-input`} className="sr-only">
        {t('searchLabel')}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted"
      />
      <input
        id={`${id}-input`}
        type="search"
        role="combobox"
        aria-expanded={showing}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={showing && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        enterKeyHint="search"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(-1);
          onOpenChange(true);
        }}
        onFocus={() => onOpenChange(true)}
        onBlur={() => onOpenChange(false)}
        onKeyDown={onKeyDown}
        className={cn(
          'h-11 w-full rounded-full bg-surface ps-12 pe-4 text-body-md text-ink shadow-card ring-1 ring-line ring-inset placeholder:text-muted',
          focusRing,
        )}
      />
      {showing && (
        <div className="absolute inset-x-0 top-full mt-2 flex flex-col rounded-24 bg-surface p-2 shadow-sheet">
          <p id={`${id}-heading`} className="px-3 pt-1 pb-2 text-caption font-semibold text-muted">
            {searching ? t('results') : t('suggested')}
          </p>
          <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-heading`}>
            {options.map((place, index) => (
              // Focus stays in the field (aria-activedescendant), so the keyboard is handled there; the mouse
              // press is kept from blurring the field before the click lands.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={place.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(place)}
                className="flex min-h-13 cursor-pointer items-center gap-3 rounded-16 px-3 py-2 hover:bg-surface-2 aria-selected:bg-surface-2"
              >
                <MapPin aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="flex min-w-0 flex-col">
                  <bdi className="truncate text-body-md font-medium">{place.name[locale]}</bdi>
                  <span className="truncate text-caption text-muted">{place.area[locale]}</span>
                </span>
              </li>
            ))}
          </ul>
          {searching && !search.isFetching && options.length === 0 && (
            <p role="status" className="px-3 py-3 text-body-md text-muted">
              {t('noResults', { query: typed })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
