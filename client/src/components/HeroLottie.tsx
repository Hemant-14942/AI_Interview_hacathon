"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const HERO_LOTTIE_SRC = "/homepages/homepageairobot.lottie";

export function HeroLottie() {
  return (
    <div
      className="relative mx-auto aspect-[1200/800] w-full max-h-[min(420px,52vh)]"
      role="img"
      aria-label="Intervo product preview animation"
    >
      <DotLottieReact
        src={HERO_LOTTIE_SRC}
        loop
        autoplay
        className="h-full w-full [&_canvas]:mx-auto [&_canvas]:h-full [&_canvas]:max-h-full [&_canvas]:w-full [&_canvas]:max-w-full"
      />
    </div>
  );
}
