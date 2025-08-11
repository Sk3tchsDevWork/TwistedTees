// Simple, extensible tracking stubs. Replace with real carrier API calls.
export async function trackCarrier(carrier, code) {
  const normalized = carrier.toLowerCase()
  // In production, integrate carriers here.
  return {
    carrier: normalized,
    code,
    status: "in_transit",
    last_update: new Date().toISOString(),
    events: [
      { ts: new Date(Date.now()-86400000*2).toISOString(), desc: "Label created" },
      { ts: new Date(Date.now()-86400000).toISOString(), desc: "Package accepted at facility" },
      { ts: new Date().toISOString(), desc: "In transit" }
    ]
  }
}
