
# AI-IoT Based Sensor Fused Model for Food Spoilage Detection

[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://narayan-rajdeeep-iot-major-project.vercel.app/)
[![Cloud Telemetry](https://img.shields.io/badge/IoT_Cloud-ThingSpeak-0076A8?style=for-the-badge)](https://thingspeak.mathworks.com/channels/3194508)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js_%2F_React-111111?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firmware](https://img.shields.io/badge/Firmware-Arduino_C%2B%2B-00979D?style=for-the-badge&logo=arduino&logoColor=white)](https://www.arduino.cc/)
[![Domain](https://img.shields.io/badge/Domain-Biotechnology_%26_IoT-2E7D32?style=for-the-badge)](#)

An end-to-end, low-cost **Electronic Nose (E-Nose) and IoT telemetry framework** for non-destructive, real-time food spoilage monitoring across **12 perishable food specimens** spanning fruits, vegetables, and dairy products.

Developed as a **B.Tech. Biotechnology Dissertation Project** at the **Amity Institute of Biotechnology, Amity University Chhattisgarh, Raipur (May 2026)**, this system fuses multi-gas Metal Oxide Semiconductor (MOS) readings, optical liquid turbidity measurements, and ambient environmental telemetry into a unified **$[0, 1]$ Spoilage Index ($SI$)** streamed to ThingSpeak and visualized through an interactive Next.js web application.

<!-- Replace the image path below with your actual hero photo or dashboard screenshot -->
<p align="center">
  <img width="807" alt="Food Spoilage Detection Next.js Dashboard" src="https://github.com/user-attachments/assets/a43694a2-99f3-47ca-bfe6-22dd3aad05b5" />
  <br />
  <em>Figure 1: Hardware sensing prototype
</em>
</p>


<p align="center">
<img width="767" height="496" alt="Screenshot 2026-11-23 at 11 57 20 pm" src="https://github.com/user-attachments/assets/d06f3034-88dc-4ef0-8a78-ff559324a78d" />
  <br />
  <em>Figure 2: System Architecture
</em>
</p>



---

## Quick Links

| Resource | Link | Notes |
| :--- | :--- | :--- |
| **Live Web Dashboard** | [narayan-rajdeeep-iot-major-project.vercel.app](https://narayan-rajdeeep-iot-major-project.vercel.app/) | Interactive Next.js dashboard (12 items, 175 daily records, JSON export) |
| **ThingSpeak IoT Channel** | [Channel #3194508 — IoT Food Safety](https://thingspeak.mathworks.com/channels/3194508) | Cloud time-series storage & REST JSON/XML API feed |
| **Full Dissertation Report** | `./docs/Rajdeep_Patil_BTech_Thesis_2026.pdf` | *Upload PDF to `/docs` or replace with Google Drive / Zenodo link* |
| **Experimental Dataset** | `./data/READINGS_ITEMS.csv` | 175 structured daily multi-sensor records across 12 food specimens |
| **Embedded Firmware** | `./firmware/food_spoilage_monitor.ino` | Arduino C/C++ acquisition, $R_s/R_0$ scaling, LCD, buzzer & Wi-Fi upload |

---

## Table of Contents

1. [Project Overview & Motivation](#1-project-overview--motivation)
2. [System Architecture & Hardware Setup](#2-system-architecture--hardware-setup)
3. [Mathematical Model: Weighted Sensor Fusion & Spoilage Index](#3-mathematical-model-weighted-sensor-fusion--spoilage-index)
4. [Experimental Protocol & Environmental Conditions](#4-experimental-protocol--environmental-conditions)
5. [Experimental Dataset & Comparative Results](#5-experimental-dataset--comparative-results)
6. [Category-Wise Sensor Thresholds & Classification Modes](#6-category-wise-sensor-thresholds--classification-modes)
7. [Web Dashboard & Cloud Pipeline](#7-web-dashboard--cloud-pipeline)
8. [Repository Structure](#8-repository-structure)
9. [Local Setup & Usage](#9-local-setup--usage)
10. [Known Limitations & v2 Research Roadmap](#10-known-limitations--v2-research-roadmap)
11. [Academic Credits, Contributors & Citation](#11-academic-credits-contributors--citation)

---

## 1. Project Overview & Motivation

Nearly one-third of global food production is lost or wasted annually, with post-harvest losses in perishable fruits and vegetables in India reaching **$25\text{--}40\%$** due to inadequate real-time storage monitoring. Conventional quality assurance methods suffer from clear operational trade-offs:

* **Visual & Olfactory Inspection:** Subjective, non-quantitative, and only detects late-stage decay.
* **Microbiological & Chemical Assays (TPC, TVBN, GC-MS, HPLC):** Gold-standard accuracy, but destructive, expensive, slow, and confined to laboratory environments.
* **Single-Sensor IoT Detectors:** Prone to false alarms from ambient drift, cross-sensitivity, and poor generalization across diverse food biochemistry.

### Key Contributions
* **Multi-Modal Hardware Array:** Integrates 4 complementary MOS gas sensors ($\text{MQ-3}$, $\text{MQ-4}$, $\text{MQ-5}$, $\text{MQ-135}$), an optical turbidity probe for liquid dairy, and a $\text{DHT11}$ ambient temperature/humidity sensor.
* **Deterministic Sensor-Fusion Baseline ($SI$):** Implements baseline calibration, Min-Max feature scaling, weighted linear sensor fusion, and inverse normalization to map heterogeneous sensor ranges onto an interpretable $[0, 1]$ spoilage scale.
* **Cross-Category Longitudinal Dataset:** Captures **175 day-wise observations** tracking complete spoilage trajectories across **5 fruits, 5 vegetables, and 2 dairy products**.
* **Cloud-to-Web Telemetry Pipeline:** Streams embedded sensor packets to ThingSpeak and surfaces day-wise progression, sensor trends, and JSON exports through a deployed Next.js dashboard.

> **Research Positioning Note:** While framed within an AI-IoT architecture, this v1 dissertation release establishes the **deterministic signal-fusion baseline, hardware calibration workflow, and structured telemetry pipeline**. Supervised machine learning classifiers (e.g., Random Forest, 1D-CNN, and shelf-life regression) are scoped for Phase 2 once multi-replicate datasets paired with laboratory microbiological ground truth (CFU / pH) are collected.

---

## 2. System Architecture & Hardware Setup

### Hardware Bill of Materials (BOM)

| Component | Model / Spec | Primary Role in System | Target Biochemical / Physical Signal |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | Arduino Uno (ATmega328P) | 5V analog ADC acquisition, LCD/buzzer control | 10-bit ADC sampling across sensor array |
| **Wi-Fi Gateway** | ESP8266 / ESP32 Module | Wireless UART/Wi-Fi HTTP telemetry | Cloud push to ThingSpeak REST API |
| **Alcohol Gas Sensor** | Hanwei MQ-3 ($\text{SnO}_2$) | Fermentation & fruit over-ripening monitor | Ethanol / alcohol vapors |
| **Methane Gas Sensor** | Hanwei MQ-4 ($\text{SnO}_2$) | Anaerobic organic decomposition monitor | Methane ($\text{CH}_4$) & natural gas |
| **Broad VOC Sensor** | Hanwei MQ-5 ($\text{SnO}_2$) | General volatile degradation monitor | Combustible gases, LPG, broad VOCs |
| **Air Quality Sensor** | Hanwei MQ-135 ($\text{SnO}_2$) | Microbial & protein degradation monitor | Ammonia ($\text{NH}_3$), $\text{CO}_2$, $\text{H}_2\text{S}$, VOCs |
| **Liquid Optical Probe** | DFRobot-type Turbidity Sensor | Liquid dairy physical spoilage monitor | Suspended solids, casein coagulation (NTU) |
| **Ambient Sensor** | DHT11 Digital Sensor | Chamber environmental monitoring | Ambient temperature ($^\circ\text{C}$) & humidity ($\%\text{RH}$) |
| **Local Display & Alert** | $20 \times 4$ LCD + Active Buzzer | Multi-page local telemetry & audible alert | Live readings, Wi-Fi status, alarm states |
| **Power Subsystem** | 5V DC Regulated (`7805`) | Stable power for MOS sensor heater coils | Continuous heater stabilization |

### Firmware Pin Mapping & Clean-Air Calibration Constants

The embedded C/C++ sketch (`Arduino IDE`) configures sensor pins and baseline resistance ($R_0$) constants as follows:

| Signal / Module | Firmware Pin | Interface | Clean-Air $R_0$ Constant | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **DHT11** | `A0` | Digital (1-Wire) | N/A | Ambient temperature & relative humidity |
| **MQ-3** | `A1` | Analog Input | $R_0 = 10.0$ | Ethanol / alcohol estimation |
| **MQ-5** | `A2` | Analog Input | $R_0 = 6.5$ | Generalized VOC estimation |
| **MQ-135** | `A3` | Analog Input | $R_0 = 76.63$ | Ammonia / air quality estimation |
| **Turbidity** | `A4` | Analog Input | N/A | Converted via `getNTU(turbRaw)` |
| **MQ-4** | `A5` | Analog Input | $R_0 = 4.4$ | Methane / anaerobic gas estimation |
| **ESP Wi-Fi** | `D5`, `D6` | `SoftwareSerial` | N/A | Serial bridge for ThingSpeak HTTP upload |
| **Buzzer** | `D4` | Digital Output | N/A | Active-HIGH spoilage alert |

Gas concentrations (ppm) are approximated in firmware from datasheet sensitivity curves using the power-law resistance ratio:

$$\text{ppm} = A \cdot \left(\frac{R_s}{R_0}\right)^B$$

> **Power & Security Best Practices:** Four simultaneous MQ heater elements draw approximately $650\text{--}720\text{ mA}$ continuously. For sustained multi-day logging, power the array via a dedicated $5\text{ V} / 2\text{ A}$ DC adapter or buck converter rather than an unheatsinked linear `7805` regulator on batteries. Always store ThingSpeak Write API keys in a git-ignored `secrets.h` / `.env.local` file rather than hardcoding them in firmware.

---

## 3. Mathematical Model: Weighted Sensor Fusion & Spoilage Index

<!-- Add your sensor fusion workflow diagram here -->
<p align="center">
  <img src="./docs/images/sensor-fusion-workflow.png" alt="Sensor Fusion Pipeline Diagram" width="70%" />
  <br />
  <em>Figure 4: Feature-level multi-sensor fusion pipeline converting raw readings to the unified Spoilage Index ($SI$).</em>
</p>

Because individual MQ-series and turbidity sensors operate across incompatible numerical scales and baseline offsets, raw values are processed through a 4-stage analytical pipeline:

### Step 1: Baseline Calibration
Clean-air / Day-1 fresh baseline readings ($S_{i,\text{base}}$) are recorded to isolate spoilage-driven signal deviations:

$$\Delta S_i = S_i - S_{i,\text{base}}$$

### Step 2: Min-Max Normalization (Feature Scaling)
Each sensor reading $S_i$ is mapped to a dimensionless fractional progression value $N_i \in [0, 1]$ using the baseline fresh reference ($S_{i,\text{base}}$) and confirmed spoiled peak ($S_{i,\text{spoil}}$):

$$N_i = \text{clip}\left(\frac{S_i - S_{i,\text{base}}}{S_{i,\text{spoil}} - S_{i,\text{base}}},\ 0,\ 1\right)$$

### Step 3: Weighted Linear Sensor Fusion
Normalized outputs are fused into a single unified **Spoilage Index ($SI$)** bounded within $[0, 1]$:

$$SI = \sum_{i=1}^{n} w_i N_i \quad \text{subject to} \quad \sum_{i=1}^{n} w_i = 1$$

#### Assigned Domain Weights

| Sensor | Target Modality | Weight ($w_i$) — Solid Foods (Gas Only) | Weight ($w_i$) — Liquid Dairy (Gas + Turbidity) | Justification |
| :--- | :--- | :---: | :---: | :--- |
| **MQ-135** | $\text{NH}_3$ / Broad VOCs | $0.35$ | $0.30$ | Strongest broad-spectrum microbial spoilage sensitivity |
| **MQ-3** | Ethanol / Alcohols | $0.30$ | $0.25$ | Key early indicator of sugar & dairy fermentation |
| **MQ-5** | General VOCs / Hydrocarbons | $0.20$ | $0.15$ | Cross-category volatile decomposition marker |
| **MQ-4** | Methane ($\text{CH}_4$) | $0.15$ | $0.10$ | Late-stage anaerobic breakdown marker |
| **Turbidity** | Optical Scattering (NTU) | N/A | $0.20$ | Captures casein coagulation & physical curdling in liquids |
| **Total** | | **$1.00$** | **$1.00$** | |

### Step 4: Classification & Inverse Normalization
The continuous $SI$ value maps into three operational freshness states:

| Spoilage Index ($SI$) | Classification | Operational Interpretation |
| :---: | :--- | :--- |
| $0.0 \le SI < 0.3$ | **Fresh** | Responses within normal baseline variation; suitable for consumption |
| $0.3 \le SI < 0.7$ | **Early Spoilage** | Measurable gas/matrix degradation initiated; prioritize consumption or discard soon |
| $SI \ge 0.7$ | **Spoiled** | Advanced biochemical deterioration confirmed; unsafe / organoleptically unacceptable |

To translate abstract index boundaries ($N_i = 0.3$ and $N_i = 0.7$) back into physically interpretable sensor thresholds (ppm / NTU), inverse normalization is applied:

$$S_i = N_i \left(S_{i,\text{spoil}} - S_{i,\text{base}}\right) + S_{i,\text{base}}$$

---

## 4. Experimental Protocol & Environmental Conditions

* **Monitoring Period:** November to February (ambient laboratory storage)
* **Ambient Temperature:** $18\text{--}28^\circ\text{C}$ (Mean $\approx 23^\circ\text{C}$)
* **Ambient Relative Humidity:** $45\text{--}75\%\text{ RH}$ (Mean $\approx 60\%\text{ RH}$)
* **Chamber Protocol:** Specimens were evaluated in a transparent, semi-enclosed chamber to accumulate headspace volatiles while limiting external room drafts. Solid items (fruits/vegetables) were centered beneath the headspace, while dairy liquids (milk/curd) were placed in sterile containers with the turbidity probe partially submerged.
* **Sampling Cadence:** Sensors underwent heater warm-up and clean-air baseline stabilization prior to logging; daily mean sensor responses were aggregated across the complete degradation window of each specimen (**175 total day-item observations**).

---

## 5. Experimental Dataset & Comparative Results

<!-- Add your multi-specimen spoilage curves image here -->
<p align="center">
  <img src="./docs/images/spoilage-curves.png" alt="Comparative Spoilage Index Progression Curves" width="90%" />
  <br />
  <em>Figure 5: Day-wise Spoilage Index ($SI$) progression across rapid-, moderate-, and slow-spoiling food categories.</em>
</p>

### Complete 12-Specimen Experimental Summary

All gas readings below are reported in **ppm** and turbidity in **NTU**. Transition days (`Fresh Until` / `Spoiled From`) reflect the **weighted linear Spoilage Index ($SI$)** model evaluated in Chapter 4 of the thesis.

| # | Food Specimen | Category | Total Days | Day 1 Readings (`MQ3 / MQ4 / MQ5 / MQ135` [+ `NTU`]) | Final Day Readings (`MQ3 / MQ4 / MQ5 / MQ135` [+ `NTU`]) | Fresh Until ($SI < 0.3$) | Spoiled From ($SI \ge 0.7$) | Peak $SI$ |
| :-: | :--- | :--- | :-: | :--- | :--- | :-: | :-: | :-: |
| 1 | **Milk** | Dairy | 6 | `27 / 43 / 55 / 102` + `12 NTU` | `233 / 312 / 354 / 608` + `75 NTU` | Day 2 | Day 5 | $1.00$ |
| 2 | **Curd** | Dairy | 7 | `30 / 38 / 72 / 97` + `12 NTU` | `254 / 289 / 361 / 513` + `88 NTU` | Day 3 | Day 6 | $1.00$ |
| 3 | **Guava** | Fruit | 8 | `30 / 54 / 68 / 114` | `330 / 406 / 455 / 678` | Day 3 | Day 6 | $1.00$ |
| 4 | **Papaya** | Fruit | 10 | `31 / 49 / 67 / 127` | `338 / 395 / 464 / 703` | Day 4 | Day 8 | $0.99$ |
| 5 | **Cauliflower** | Vegetable | 12 | `38 / 51 / 54 / 95` | `288 / 349 / 438 / 553` | Day 5 | Day 9 | $1.00$ |
| 6 | **Tomato** | Vegetable | 12 | `33 / 59 / 63 / 124` | `280 / 354 / 439 / 664` | Day 5 | Day 10 | $1.00$ |
| 7 | **Brinjal** | Vegetable | 14 | `26 / 46 / 59 / 109` | `336 / 425 / 493 / 802` | Day 6 | Day 11 | $0.99$ |
| 8 | **Orange** | Fruit | 18 | `24 / 45 / 58 / 88` | `373 / 436 / 571 / 835` | Day 7 | Day 14 | $0.99$ |
| 9 | **Pomegranate** | Fruit | 18 | `18 / 30 / 42 / 76` | `385 / 473 / 550 / 819` *(Day 17 MQ135: 907)* | Day 8 | Day 14 | $0.99$ |
| 10 | **Capsicum** | Vegetable | 20 | `34 / 49 / 73 / 98` | `414 / 531 / 674 / 865` *(Day 19 MQ135: 898)* | Day 8 | Day 15 | $0.99$ |
| 11 | **Apple** | Fruit | 22 | `22 / 43 / 56 / 88` | `467 / 488 / 592 / 842` | Day 9 | Day 17 | $1.00$ |
| 12 | **Potato** | Vegetable | 28 | `37 / 48 / 60 / 88` | `451 / 547 / 688 / 949` | Day 13 | Day 22 | $0.99$ |

### Observed Global Signal Envelope (All 175 Records Combined)

| Sensor | Min Observed | Max Observed | Dynamic Span |
| :--- | :---: | :---: | :---: |
| **MQ-3 (ppm)** | $18$ *(Pomegranate, Day 1)* | $467$ *(Apple, Day 22)* | $449$ |
| **MQ-4 (ppm)** | $30$ *(Pomegranate, Day 1)* | $547$ *(Potato, Day 28)* | $517$ |
| **MQ-5 (ppm)** | $42$ *(Pomegranate, Day 1)* | $688$ *(Potato, Day 28)* | $646$ |
| **MQ-135 (ppm)** | $76$ *(Pomegranate, Day 1)* | $949$ *(Potato, Day 28)* | $873$ |
| **Turbidity (NTU)** | $12$ *(Milk/Curd, Day 1)* | $88$ *(Curd, Day 7)* | $76$ |

### Key Analytical Takeaways
1. **Structural & Biochemical Stratification:** High-moisture, high-sugar, or actively fermenting items (**Milk, Curd, Guava, Papaya**) crossed $SI \ge 0.7$ within **$5\text{--}8\text{ days}$**, whereas specimens with thick protective rinds, waxy cuticles, or dense starchy periderms (**Orange, Pomegranate, Capsicum, Apple, Potato**) resisted spoilage for **$14\text{--}22\text{ days}$**.
2. **Sensor Dominance:** $\text{MQ-135}$ and $\text{MQ-3}$ exhibited the highest sensitivity and diagnostic variance across microbial breakdown and fermentation stages, supporting their higher fusion weights.
3. **Non-Linear Decay Plateaus:** Transient plateaus or minor dips (e.g., Potato Days 23–24, Pomegranate Days 17–18, Cauliflower Days 9–10) reflected headspace volatile dissipation, substrate exhaustion, or transitions from early fermentation to late-stage anaerobic decomposition—demonstrating why multi-sensor fusion outperforms single-gas alarms.

---

## 6. Category-Wise Sensor Thresholds & Classification Modes

### Dashboard Category Threshold Reference

The deployed dashboard applies non-overlapping sensor cutoffs per food category:

#### Fruits & Vegetables (Gas Only)
| Stage | MQ-3 (ppm) | MQ-4 (ppm) | MQ-5 (ppm) | MQ-135 (ppm) |
| :--- | :---: | :---: | :---: | :---: |
| **Fresh** | $10\text{--}50$ | $20\text{--}80$ | $30\text{--}100$ | $50\text{--}150$ |
| **Early Spoilage** | $50\text{--}150$ | $80\text{--}250$ | $100\text{--}250$ | $150\text{--}350$ |
| **Spoiled** | $150\text{--}400+$ | $250\text{--}400+$ | $250\text{--}500+$ | $350\text{--}800+$ |

#### Milk (Gas + Turbidity)
| Stage | MQ-3 (ppm) | MQ-4 (ppm) | MQ-5 (ppm) | MQ-135 (ppm) | Turbidity (NTU) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Fresh** | $5\text{--}40$ | $10\text{--}60$ | $20\text{--}80$ | $50\text{--}120$ | $0\text{--}5$ |
| **Early Spoilage** | $40\text{--}120$ | $60\text{--}150$ | $80\text{--}200$ | $120\text{--}300$ | $5\text{--}25$ |
| **Spoiled** | $120\text{--}300+$ | $150\text{--}350+$ | $200\text{--}400+$ | $300\text{--}700+$ | $25\text{--}100+$ |

#### Curd (Gas + Turbidity)
| Stage | MQ-3 (ppm) | MQ-4 (ppm) | MQ-5 (ppm) | MQ-135 (ppm) | Turbidity (NTU) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Fresh** | $10\text{--}60$ | $20\text{--}80$ | $30\text{--}100$ | $80\text{--}200$ | $2\text{--}10$ |
| **Early Spoilage** | $60\text{--}180$ | $80\text{--}200$ | $100\text{--}250$ | $200\text{--}400$ | $10\text{--}40$ |
| **Spoiled** | $180\text{--}500+$ | $200\text{--}400+$ | $250\text{--}500+$ | $400\text{--}900+$ | $40\text{--}120+$ |

> **Important Note on Classification Modes:**
> * **Weighted Fusion Mode (Thesis Chapter 4):** Computes continuous $SI = \sum w_i N_i$ across all sensors to suppress single-sensor false positives (e.g., Apple reaches Spoiled on Day 17).
> * **Conservative Safety Mode (Live Vercel Demo):** Classifies each day using the *"worst matched stage across active sensors"* (max-rule trigger) to minimize food-safety false negatives (e.g., Apple flags Early Spoilage on Day 4 and Spoiled on Day 10 once a single sensor crosses its category ceiling).

---

## 7. Web Dashboard & Cloud Pipeline

**Live Deployment:** [https://narayan-rajdeeep-iot-major-project.vercel.app/](https://narayan-rajdeeep-iot-major-project.vercel.app/)

<!-- Add a screenshot of your Vercel dashboard here -->
<p align="center">
  <img src="./docs/images/dashboard-ui.png" alt="Next.js Food Spoilage Monitoring Dashboard" width="90%" />
  <br />
  <em>Figure 6: Deployed Next.js web application displaying item selection, per-sensor progress bars, and multi-day trend charts.</em>
</p>

### Dashboard Features
* **Category Sidebar:** Filter across all 12 monitored specimens grouped into Fruits, Vegetables, and Dairy.
* **Interactive Day Scrubber:** Inspect day-by-day sensor progression from Day 1 through complete spoilage.
* **Lifecycle Metrics:** Automatic summary cards showing total monitored days, first Early Spoilage day, first Spoiled day, and Fresh duration.
* **Per-Sensor Trend Charts:** Color-coded bar visualizations (Green = Fresh, Amber = Early Spoilage, Red = Spoiled) across $\text{MQ-3}$, $\text{MQ-4}$, $\text{MQ-5}$, $\text{MQ-135}$, and Turbidity.
* **Data Portability:** One-click **Export JSON** for downstream analysis or ML model ingestion.
* **Demo Mode vs. Live Polling:** The public Vercel deployment runs in static demo mode powered by the recorded `READINGS_ITEMS.csv` dataset (`API polling disabled`) so reviewers can inspect all 175 experimental records even when the physical hardware rig is offline.

---

## 8. Repository Structure

```text
ai-iot-food-spoilage-detection/
├── README.md
├── docs/
│   ├── Rajdeep_Patil_BTech_Thesis_2026.pdf
│   └── images/
│       ├── project-hero.png           # <-- Add your hero / prototype + UI banner
│       ├── system-architecture.png    # <-- Add Fig. 3 architecture diagram
│       ├── hardware-setup.jpg         # <-- Add Fig. 4 / benchtop hardware photo
│       ├── sensor-fusion-workflow.png # <-- Add Fig. 9 pipeline diagram
│       ├── spoilage-curves.png        # <-- Add comparative SI curves
│       └── dashboard-ui.png           # <-- Add Vercel dashboard screenshot
├── firmware/
│   ├── food_spoilage_monitor.ino      # Arduino Uno + ESP Wi-Fi acquisition sketch
│   └── secrets.example.h              # Template for Wi-Fi SSID & ThingSpeak API key
├── data/
│   └── READINGS_ITEMS.csv             # 175 daily records across 12 food items
└── web-dashboard/                     # Next.js + React frontend deployed on Vercel
    ├── package.json
    ├── public/
    └── src/
```

---

## 9. Local Setup & Usage

### 1. Run the Next.js Web Dashboard Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>/web-dashboard

# Install dependencies
npm install

# Configure optional ThingSpeak environment variables
cp .env.example .env.local
# Add NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID=3194508 and API keys if enabling live polling

# Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

### 2. Flash the Embedded Firmware

1. Open `firmware/food_spoilage_monitor.ino` in **Arduino IDE** (v1.8.19+ or v2.x).
2. Install required libraries via Library Manager:
   * `LiquidCrystal`
   * `DHT sensor library` (Adafruit)
   * `SoftwareSerial` & `EEPROM` (built-in)
3. Copy `firmware/secrets.example.h` to `firmware/secrets.h` and add your Wi-Fi credentials and ThingSpeak Write API key.
4. Pre-heat the MQ-series sensors for at least **20–30 minutes** in clean ambient air (or 24 hours for brand-new sensors) before recording baseline values.
5. Select **Arduino Uno** (or target board), pick the active COM port, and upload.

---

## 10. Known Limitations & v2 Research Roadmap

Transparent engineering documentation of current prototype boundaries and planned next-generation upgrades:

| Current v1 Prototype Limitation | Planned v2 Engineering / Research Upgrade |
| :--- | :--- |
| **No Microbiological Ground Truth:** Freshness boundaries were validated via gas accumulation and visual/organoleptic observation rather than lab assays. | Pair sensor time-series with **ISO 4833 Total Plate Count (CFU/g)**, pH/titratable acidity (for dairy), and headspace GC-MS to anchor $SI$ boundaries biologically. |
| **Offline Per-Specimen Normalization:** Using each sample's own $S_{i,\text{base}}$ and $S_{i,\text{spoil}}$ is ideal for retrospective curve comparison, but live inference cannot know a sample's future peak. | Freeze **category-level calibration bounds** ($S_{\text{cat,base}}, S_{\text{cat,spoil}}$) from multi-replicate training cohorts with strict $[0, 1]$ clamping during live inference. |
| **Deterministic Heuristic Weights:** Weights ($0.35, 0.30, 0.20, 0.15$) were assigned via domain knowledge rather than learned from data. | Train cross-validated **Random Forest, Gradient Boosted Trees, or 1D-CNN** models for both spoilage classification and Remaining Useful Shelf-Life (RUSL) regression. |
| **Uncompensated Environmental Drift:** $\text{DHT11}$ logged ambient ranges ($18\text{--}28^\circ\text{C}$, $45\text{--}75\%\text{ RH}$), but temperature/humidity did not enter the $R_s/R_0$ equations. | Upgrade to **BME280/SHT31** and apply datasheet temperature-humidity compensation curves directly to sensor resistance calculations. |
| **Dashboard & Thesis Mode Alignment:** The deployed Vercel demo uses conservative single-sensor triggers, whereas the thesis evaluates weighted $SI$ fusion. | Add a UI toggle allowing users to switch between **Weighted Fusion $SI$** (continuous $0.00\text{--}1.00$ score) and **Strict Safety Alert** (worst-sensor mode), plus live ThingSpeak streaming toggle. |
| **Chamber & Dairy Optical Physics:** Semi-enclosed headspace and water-calibrated optical turbidity probes face saturation in opaque whole milk. | Build a sealed acrylic manifold with a micro-circulation fan for gas arrays, and pair dairy monitoring with **pH / electrical conductivity (EC) probes** alongside headspace gas sensing. |

---

## 11. Academic Credits, Contributors & Citation

### Academic Information
* **Author:** Rajdeep Patil (Enrollment No. `A80404122005`, B.Tech. Biotechnology, VIII Semester)
* **Dashboard & Prototype Collaborator:** Narayan *(Web Dashboard & IoT Integration)*
* **Supervisor:** Dr. Sushma Chauhan, Assistant Professor, Amity Institute of Biotechnology (AIB)
* **Co-Supervisor:** Prof. (Dr.) Varaprasad Kolla, Director, Amity Institute of Biotechnology (AIB)
* **Institution:** Amity University Chhattisgarh, Raipur, India (May 2026)

### Citation

If you reference this framework, dataset, or hardware architecture in academic work, please cite:

```bibtex
@thesis{patil2026aiiot,
  author       = {Rajdeep Patil},
  title        = {AI-IoT Based Sensor Fused Model for Food Spoilage Detection},
  type         = {B.Tech. Dissertation},
  institution  = {Amity Institute of Biotechnology, Amity University Chhattisgarh},
  address      = {Raipur, India},
  month        = {May},
  year         = {2026},
  url          = {https://narayan-rajdeeep-iot-major-project.vercel.app/}
}
```

---

*Built for low-cost food quality intelligence, post-harvest loss reduction, and reproducible IoT sensing research.*
