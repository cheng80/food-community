// Local verification intercepts only the PortOne API, before Next wraps fetch.
const fetchOriginal = globalThis.fetch;
globalThis.fetch = (input, init) => fetchOriginal(
  typeof input === "string" && input.startsWith("https://api.portone.io/payments/")
    ? process.env.SUPABASE_URL + "/__portone/" + input.slice("https://api.portone.io/".length)
    : input,
  init,
);
