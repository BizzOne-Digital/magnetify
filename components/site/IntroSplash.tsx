import { LogoMark } from "@/components/site/Logo";

/**
 * Opening brand animation. Pure CSS, so it plays before hydration and removes itself.
 * Shown once per browser session (inline script hides it on repeat visits) and
 * skipped entirely for prefers-reduced-motion.
 */
export function IntroSplash() {
  return (
    <>
      <script
        // Runs before paint: skip the intro if it was already shown this session.
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("mg-intro")){document.documentElement.classList.add("mg-intro-seen")}else{sessionStorage.setItem("mg-intro","1")}}catch(e){}`,
        }}
      />
      <div className="mg-intro" aria-hidden="true">
        <div className="mg-intro-inner">
          <LogoMark className="mg-intro-logo h-24 w-28 sm:h-28 sm:w-32" />
          <p className="mg-intro-word font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="text-gold-metal">Magnetify</span>
          </p>
          <span className="mg-intro-line" />
          <p className="mg-intro-tag font-display text-sm font-semibold tracking-[0.3em] text-cream/80 sm:text-base">
            SMALL MAGNETS, BIG MEMORIES
          </p>
        </div>
      </div>
    </>
  );
}
