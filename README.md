# Local 12 Weather Operations

**Fully functional** professional mobile weather command center for broadcast meteorologists.

## Live Demo

Open [`index.html`](index.html) in a browser (or deploy to GitHub Pages / any static host).

```bash
# Or serve locally
npx serve .
```

## What Actually Works

| Panel | Status | Data Source |
|-------|--------|-------------|
| **Live Radar** | ✅ Fully functional | LibreWXR (animated past + nowcast tiles) |
| **Forecast Models** | ✅ Working | Open-Meteo (GFS + high-res blend / HRRR) |
| **Live Alerts** | ✅ Working | National Weather Service API (OH + KY) |
| **Camera Matrix** | ✅ Interactive | Demo feeds + live PGM routing |
| **Graphics & Rundown** | ✅ Interactive | Full rundown control + lower-thirds |
| **Engineering** | ✅ Live telemetry | Simulated real-time metrics + logs |

### Radar
- Animated radar over Cincinnati / Tri-State
- Timeline scrubber + play/pause
- Auto-refreshes every 5 minutes
- Dark basemap optimized for severe weather

### Alerts
- Live severe weather alerts from the official NWS API
- Counters for Severe / Tornado / Flood / Advisories
- Displayed on both the Alerts panel and the Radar panel

### Models
- Real precipitation forecasts from Open-Meteo
- HRRR-leaning blend vs GFS comparison
- Confidence gauges and 6-hour precip bars

## Six Command Panels

1. **Live Radar Command Center** – multi-layer radar, timeline, active warnings  
2. **Forecast Model Comparison** – HRRR / NAM / GFS / Euro with confidence  
3. **Live Camera Matrix** – camera grid + PGM 1-4 routing matrix  
4. **Graphics & Rundown** – broadcast rundown, preview, lower-thirds  
5. **Alert Management** – severe workflow, EAS staging, notification actions  
6. **Engineering & System Health** – ingest, latency, load, live logs  

## Tech Stack

- Pure HTML / CSS / JavaScript (no build step required)
- Leaflet for the map
- LibreWXR public radar API
- National Weather Service API
- Open-Meteo forecast API

## Project Structure

```
index.html          # Main app shell
styles.css          # Dark mobile UI matching the mockup
js/
  app.js            # Navigation & shared utilities
  radar.js          # Animated radar (LibreWXR)
  alerts.js         # Live NWS alerts
  models.js         # Open-Meteo model comparison
  cameras.js        # Camera matrix + routing
  graphics.js       # Rundown & lower-thirds
  engineering.js    # System health dashboard
docs/
  UI_MOCKUP.md      # Detailed UI specification
```

## Target Users
- Broadcast meteorologists
- Weather producers
- Engineering / operations staff
- Severe weather desk teams

## Status

**Operational prototype** — core weather data (radar, alerts, models) is live.  
Camera feeds are demo images; swap in real OHGO / KYTC / EarthCam endpoints for production.

## License

All rights reserved.
