// Este archivo suprime los warnings de React Router v6 sobre flags futuros SOLO en desarrollo.
// Puedes eliminarlo cuando actualices a React Router v7 o si quieres ver los warnings.
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    const msg = args[0] || '';
    if (
      typeof msg === 'string' &&
      (msg.includes('React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7.') ||
        msg.includes('React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7.'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
