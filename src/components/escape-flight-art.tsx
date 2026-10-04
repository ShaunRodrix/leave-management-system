/**
 * "Escape Flight" panel illustration for the login page. An approved
 * leave day (emerald check) takes off from the calendar as a paper
 * plane. Pure SVG; motion lives in globals.css (.ef-* keyframes).
 * Decorative only — hidden from assistive tech.
 */
export function EscapeFlightArt() {
  return (
    <svg viewBox="0 0 400 240" fill="none" aria-hidden="true" className="w-full max-w-[430px]">
      {/* sun */}
      <g stroke="rgba(255,255,255,.5)" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="76" cy="46" r="13" stroke="rgba(255,255,255,.75)" />
        <g className="ef-rays">
          <path d="M76 24v-7" />
          <path d="M76 68v7" />
          <path d="M54 46h-7" />
          <path d="M98 46h7" />
          <path d="M60 30l-5-5" />
          <path d="M92 30l5-5" />
          <path d="M60 62l-5 5" />
          <path d="M92 62l5 5" />
        </g>
      </g>
      {/* stars */}
      <g fill="rgba(255,255,255,.5)">
        <circle className="ef-star" cx="160" cy="34" r="1.7" />
        <circle className="ef-star" cx="205" cy="52" r="1.4" style={{ animationDelay: ".5s" }} />
        <circle className="ef-star" cx="255" cy="26" r="1.6" style={{ animationDelay: "1s" }} />
        <circle className="ef-star" cx="140" cy="66" r="1.3" style={{ animationDelay: "1.5s" }} />
      </g>
      {/* soft clouds */}
      <g className="ef-cloud-a" fill="rgba(255,255,255,.09)">
        <ellipse cx="238" cy="122" rx="28" ry="10" />
        <circle cx="226" cy="115" r="10" />
        <circle cx="246" cy="111" r="13" />
      </g>
      <g className="ef-cloud-b" fill="rgba(255,255,255,.07)">
        <ellipse cx="318" cy="96" rx="24" ry="9" />
        <circle cx="308" cy="90" r="9" />
        <circle cx="326" cy="87" r="11" />
      </g>
      {/* dashed flight path */}
      <path
        className="ef-trail"
        d="M104 136 C150 100 190 92 235 78 S330 48 348 42"
        stroke="rgba(255,255,255,.4)"
        strokeWidth="1.5"
        strokeDasharray="5 8"
        strokeLinecap="round"
      />
      {/* paper plane */}
      <g className="ef-plane" stroke="rgba(255,255,255,.9)" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M316 56 L362 28 L338 70 Z" />
        <path d="M338 70 L332 48 L362 28" stroke="rgba(255,255,255,.45)" />
      </g>
      {/* the calendar it leaves behind */}
      <g stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round">
        <rect x="36" y="148" width="96" height="84" rx="12" />
        <path d="M36 172h96" stroke="rgba(255,255,255,.35)" />
        <path d="M62 136v14M106 136v14" strokeWidth="3" />
      </g>
      <g fill="rgba(255,255,255,.35)">
        <circle cx="62" cy="192" r="2.2" />
        <circle cx="88" cy="192" r="2.2" />
        <circle cx="62" cy="212" r="2.2" />
        <circle cx="88" cy="212" r="2.2" />
      </g>
      {/* booked day */}
      <circle cx="114" cy="212" r="9" stroke="rgba(255,255,255,.85)" strokeWidth="1.8" />
      <path
        className="ef-check"
        d="M110.5 212l3 3 6.5-7.5"
        stroke="#34d399"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={20}
      />
    </svg>
  );
}
