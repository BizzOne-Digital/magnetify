import { Logo } from "@/components/site/Logo";

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
          <span className="mg-intro-logo block">
            <Logo priority className="h-20 max-w-[86vw] sm:h-28" />
          </span>
          <span className="mg-intro-line" />
          <p className="mg-intro-tag font-display text-sm font-semibold tracking-[0.3em] text-cream/80 sm:text-base">
            SMALL MAGNETS, BIG MEMORIES
          </p>
        </div>
      </div>
    </>
  );
}
