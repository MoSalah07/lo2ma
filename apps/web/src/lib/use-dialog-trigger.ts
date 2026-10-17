import { useState } from 'react';

/** What the element that opens a dialog spreads on itself. */
export interface DialogTrigger {
  onClick: () => void;
  onPointerEnter: () => void;
  onFocus: () => void;
  'aria-haspopup': 'dialog';
}

/**
 * Opens a dialog whose code loads on demand: it starts downloading on hover or focus, opens on click, and stays
 * mounted after the first opening so it can play its way out when it closes.
 */
export function useDialogTrigger(preload: () => void) {
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  const trigger: DialogTrigger = {
    onClick: () => {
      setUsed(true);
      setOpen(true);
    },
    onPointerEnter: preload,
    onFocus: preload,
    'aria-haspopup': 'dialog',
  };
  return { open, setOpen, used, trigger };
}
