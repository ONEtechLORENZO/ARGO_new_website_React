/* piccoli indicatori per i tipi di documento (blocco verde "Cosa legge") */
export function DocDot() {
  return (
    <svg viewBox="0 0 28 28" className="docdot" aria-hidden="true" focusable="false">
      <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle className="docdot-in" cx="14" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}
