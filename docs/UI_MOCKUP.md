# Local 12 Weather Operations — Mobile UI Mockup

High-fidelity mobile interface concept for a professional weather operations command center.

> **Note:** The original multi-panel mockup image (six iPhone screens) is available in the project conversation history. Upload it here as `docs/mockup.png` or `docs/mockup.jpg` for permanent inclusion in the repository.

## Layout Overview

Six primary screens accessible via bottom tab navigation:

| Tab | Screen | Purpose |
|-----|--------|---------|
| Radar | Live Radar Command Center | Real-time radar + warnings |
| Models | Forecast Model Comparison | HRRR / NAM / GFS / Euro |
| Cameras | Live Camera Matrix | Multi-camera feeds + routing |
| (More) | Graphics & Rundown | Broadcast control |
| Alerts | Alert Management | Severe weather workflow |
| (More) | Engineering & System Health | Ops / telemetry |

---

## 1. Live Radar Command Center

**Header:** LOCAL 12 WEATHER OPERATIONS + ON AIR indicator  
**Tabs:** RADAR | SATELLITE | LIGHTNING | WARNINGS

### Key Elements
- Full-screen radar map centered on Cincinnati / Hamilton / Dayton / Florence area
- Color-scale intensity (LIGHT → EXTREME)
- Red warning polygons overlaid on map
- Storm tracks and motion vectors
- Timeline scrubber with LIVE indicator (timestamp)
- Active Warnings panel:
  - Tornado Warning — Hamilton County, OH (expires 10:15 PM)
  - Severe Thunderstorm Warning — Boone County, KY (expires 10:30 PM)
- Floating layer / zoom / lightning / settings controls on the right

### Bottom Navigation
Radar (active) · Models · Cameras · Alerts · More

---

## 2. Forecast Model Comparison

**Header:** Forecast Models

### Model Cards
| Model | Description | Confidence | Notes |
|-------|-------------|------------|-------|
| **HRRR** | High Resolution Rapid Refresh | 78% | Best Match · 3 km · Run 15Z |
| **NAM** | North American Mesoscale | 62% | 12 km · Run 12Z |
| **GFS** | Global Forecast System | 48% | 25 km · Run 12Z |
| **Euro** | (tab available) | — | — |

### Precipitation Comparison (Next 6 Hours)
Horizontal bar charts comparing HRRR / NAM / GFS precipitation amounts with color gradients.

---

## 3. Live Camera Matrix

**Header:** Live Cameras · All Systems Operational

### Camera Grid (2×3)
- Downtown Cincinnati (LIVE)
- I-71 at Norwood (LIVE)
- Airport (LIVE)
- Riverside (LIVE)
- Mt. Healthy (LIVE)
- Eastgate (LIVE)

### Camera Control Row
All Cameras · Favorites · Map View · PTZ Control

### Feed Routing Matrix
| Camera | PGM 1 | PGM 2 | PGM 3 | PGM 4 | Status |
|--------|-------|-------|-------|-------|--------|
| Downtown | ● | ○ | ○ | ○ | ON AIR |
| Airport | ○ | ● | ○ | ○ | ON AIR |
| Riverside | ○ | ○ | ● | ○ | ON AIR |
| I-71 Norwood | ○ | ○ | ○ | ● | ON AIR |

Tally: 4/4

---

## 4. Graphics & Rundown

**Header:** Graphics & Rundown · On Air

### Preview Monitor
- FUTURECAST graphic (Tue 7:00 PM)
- Meteorologist on set pointing to radar
- Controls: CG · Lower Thirds · Full Screen · Audio
- ON AIR badge

### Broadcast Rundown
| # | Segment | Duration | Status |
|---|---------|----------|--------|
| 1 | Weather Intro | 0:45 | Complete |
| 2 | Current Conditions | 2:30 | Complete |
| 3 | Severe Storms | 3:00 | **On Air** |
| 4 | 7 Day Forecast | 2:00 | Next |
| 5 | Closing | 0:30 | Pending |

### Lower Third Control
Style presets: Default · Modern · Bold · Clean  
Current text: "Severe Storms Moving In"

---

## 5. Alert Management

**Header:** Alert Management · Severe Weather Workflow

### Alert Counters
- **3** Severe
- **5** Tornado Watch
- **12** Flood Watch
- **7** Advisories

### Active Alerts (3 Active)
- Tornado Warning — Clermont County, OH (Until 10:15 PM)
- Severe Thunderstorm Warning — Hamilton County, OH (Until 10:30 PM)
- Flash Flood Watch — Multiple Counties (Until 2:00 AM)

### EAS Staging
- EAS Ready
- Audio: Connected · Encoder: Online · Test: Not Required
- Actions: Send Push · Send SMS · Send Email · Stage Alert

---

## 6. Engineering & System Health

**Header:** Engineering & System Health · All Systems Operational

### Status Cards
| Component | Status |
|-----------|--------|
| Ingest Servers | 3/3 Online |
| Radar Ingest | Healthy |
| Telemetry | Normal |
| Network | Stable |
| Latency | 42 ms |
| Backup | Completed |

### System Load
- CPU 32%
- Memory 48%
- Disk 27%

### Recent Logs
- 9:41 PM — Radar ingest healthy
- 9:38 PM — Camera 3 back online
- 9:31 PM — Model update complete
- 9:28 PM — EAS system online

---

## Design Notes

- Dark theme optimized for control-room / nighttime use
- High-contrast status indicators (green = healthy / on-air, red/orange = warnings)
- Consistent bottom tab bar across all screens
- Real-time timestamps and LIVE badges
- Professional broadcast terminology (PGM, EAS, Lower Thirds, Tally)

## Next Steps for Implementation

1. Export high-resolution mockup image into `docs/`
2. Build React Native / Flutter prototype matching these screens
3. Wire live data sources (radar, models, cameras, NWS alerts)
4. Add authentication and role-based access (Meteorologist / Producer / Engineer)
