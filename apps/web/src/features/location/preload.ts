/**
 * Starts downloading the picker and its map before they are needed, on hover or focus of what opens them. Both
 * are loaded with next/dynamic, so a screen that only might open the picker carries none of its code.
 */
export function preloadLocationPicker() {
  void import('./location-picker');
  void import('./map-view');
}
