/** The still picture of the hero's shapes: on the server, on weak devices and with reduced motion. */
export function HeroShapes() {
  return (
    <>
      <div aria-hidden className="absolute -end-12 -top-14 size-52.5 rounded-full bg-scene-brand" />
      <div
        aria-hidden
        className="absolute -start-8.5 bottom-9 size-33 -rotate-14 rounded-32 bg-scene-highlight"
      />
      <div
        aria-hidden
        className="absolute end-14 -bottom-4.5 h-16 w-42 rotate-9 rounded-full bg-scene-accent"
      />
      <div
        aria-hidden
        className="absolute start-10 top-11 size-7 rounded-full ring-6 ring-scene-tint ring-inset"
      />
    </>
  );
}
