# Property Access Codes App — Spec

## Overview
A secure, searchable directory of properties and their access codes (door codes, alarm codes, parking, storage, etc.). Users can quickly search by property name and see all relevant codes.

---

## Data Model

Each **Property** record has:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID |
| `name` | string | Property name / identifier (searchable) |
| `codes` | array | List of code entries (see below) |
| `notes` | string | Optional notes |
| `createdAt` | date | |
| `updatedAt` | date | |

Each **Code** entry within a property:

| Field | Type | Description |
|---|---|---|
| `label` | string | e.g. "Main door", "Alarm", "Parking", "Machsan" |
| `value` | string | The code itself |

---

## Properties to Import

| Name | Codes |
|---|---|
| Sharifian (Shneller) | 135 |
| Sderot Eshkol 16 | C1370Y |
| Silver (Stax) | 2590z |
| Gold (Stax) | 2590y |
| Shpitzer 7th floor apt 32 | 2490y — Building: 3582# |
| Sharifian apt 19 4th flr | 135 |
| 1 bedroom (Stax) | 6790z |
| 2 bedroom (Stax) | 3570z |
| Greyson apt 22 flr 5 | 1267x |
| -3 Machsan | 13790 |
| Hakablan 59 | 1267y |
| Rothschild | 534 |
| Mendy's apt 10 | 13689 |
| Mendy's apt 7 | 13689 |
| Givat Moshe | 1568y |
| Kaduri | 1694x |
| Rav apt | Main: 1267 — Outside door: 67890 |
| Shafaram | Code: 1280z — Alarm: 1984 |
| Arzieh Habira Gimmel | 2184x |
| Radak | Main door: 134 — Outside gate: 2652# — Master bdrm: 124 — Downstairs door: C1290z |
| Sderot Eshkol 12 | C2389y — Outside gate: 3636# |
| Agan 1-5 3 | Parking door: 5784 — Machsan: 2478x |
| Beren Shalem | 242424 |
| Sderot Eshkol 22 | Outside door: 1368 — Gate: 1634# |
| Shalem Stimler | 1267z — Machsan: C1670x |
| Shalem 7th FL apt 32 | 1352 — Machsan: 4578y |
| Shaulzon 86 | C1270y |
| Nachal Tzin | 8888 — C12345 |
| Building 1 Shneller | 5792 |
| Moskovitz 3rd floor | 3490y |
| Diskin | 12895 + key |
| Shneller -3 Machsan | 13790 |
| Office (alarm) | 1580 |
| Office (main door) | 4680 |
| Office (side door) | 3829 |
| Zeigler apt 24 B5 | C4570z |
| Sheshet Hayamim 6 apt 20 | 1638z |
| Sheshet Hayamim 19 | Outside gate: C1234y |
| Nachal Tzin apt 21 | C2345z — Machsan: C8491x |
| Maavar Hamitler 3 | — |
| Machal 20 | C5204y |
| Shneller Building | 9505# |
| Brach 2 bdrm apt 35 | C613x |
| Brach 3 bdrm apt 34 | C246x |
| Yam Suf 1 | 2513 |
| JE1201 | 1267x — Machsan: 67890 |

---

## Features

### 1. Search
- Instant live search as you type
- Searches property name (fuzzy/partial match)
- Results highlight matching text
- Keyboard navigable

### 2. Property Detail View
- Shows all codes for the selected property
- Each code row has a **label** and **value**
- One-tap copy to clipboard per code
- "Copied!" confirmation flash

### 3. Add / Edit Property
- Form to add a new property with a name and multiple code rows
- Edit existing property (name + codes)
- Add/remove individual code rows inline

### 4. Delete Property
- Confirm before deleting

---

## Security Requirements
- All data stored in MongoDB (encrypted at rest recommended)
- App is behind login (use existing auth system)
- Codes are never exposed in URLs or logs
- Only authenticated users can view/edit codes

---

## UI / UX
- Single-page with a prominent search bar at top
- Card list of results below search
- Clicking a card expands/opens the detail view
- Mobile-friendly (used on the go)
- Dark mode optional

---

## Pages / Routes

| Route | Description |
|---|---|
| `/codes` | Main search page |
| `/codes/new` | Add new property |
| `/codes/:id` | Property detail / edit |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/codes?q=search` | Search properties |
| GET | `/api/codes/:id` | Get single property |
| POST | `/api/codes` | Create property |
| PUT | `/api/codes/:id` | Update property |
| DELETE | `/api/codes/:id` | Delete property |
