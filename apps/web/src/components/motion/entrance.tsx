'use client';

import * as m from 'motion/react-m';
import type { ReactNode } from 'react';
import { fade, rise, sequence } from './presets';
import { useEntrance, type EntranceTrigger } from './use-entrance';

/** The elements an entrance can be. */
const elements = {
  div: m.div,
  section: m.section,
  article: m.article,
  ul: m.ul,
  ol: m.ol,
  li: m.li,
};

const variantSets = { one: rise, list: sequence, screen: fade };

interface EntranceProps {
  as?: keyof typeof elements;
  className?: string;
  children: ReactNode;
}

/** Rises in when it appears in the browser: a message, a notice, a card after loading. */
export function Appear({ as = 'div', className, children }: EntranceProps) {
  return (
    <Entrance trigger="mount" variants="one" as={as} className={className}>
      {children}
    </Entrance>
  );
}

/** Rises in when it scrolls into view: a section further down a page. */
export function Reveal({ as = 'div', className, children }: EntranceProps) {
  return (
    <Entrance trigger="scroll" variants="one" as={as} className={className}>
      {children}
    </Entrance>
  );
}

/** A screen fading in after navigating. The first load shows at once, like everything from the server. */
export function ScreenEntrance({ className, children }: Omit<EntranceProps, 'as'>) {
  return (
    <Entrance trigger="mount" variants="screen" as="div" className={className}>
      {children}
    </Entrance>
  );
}

/** A list whose items (each a `SequenceItem`) rise one after another, on mount or on scroll. */
export function Sequence({
  trigger = 'mount',
  as = 'div',
  className,
  children,
}: EntranceProps & { trigger?: EntranceTrigger }) {
  return (
    <Entrance trigger={trigger} variants="list" as={as} className={className}>
      {children}
    </Entrance>
  );
}

/** One item of a `Sequence`. It takes its timing from the list. */
export function SequenceItem({ as = 'div', className, children }: EntranceProps) {
  const Element = elements[as];
  return (
    <Element variants={rise} className={className}>
      {children}
    </Element>
  );
}

function Entrance({
  trigger,
  variants,
  as,
  className,
  children,
}: Required<Pick<EntranceProps, 'as'>> &
  Omit<EntranceProps, 'as'> & { trigger: EntranceTrigger; variants: keyof typeof variantSets }) {
  const { ref, initial, animate } = useEntrance(trigger);
  const Element = elements[as];
  return (
    <Element
      ref={ref}
      variants={variantSets[variants]}
      initial={initial}
      animate={animate}
      className={className}
    >
      {children}
    </Element>
  );
}
