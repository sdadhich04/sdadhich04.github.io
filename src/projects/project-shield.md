---
title: "Project SHIELD: sensor DAQ board and stress-test rig"
slug: project-shield
pathway: "Data acquisition, test & reliability"
context: Team
status: "● Active"
role: "Hardware & Product Design Lead on the capstone: co-hardware lead (with Thomas Glass) and procurement lead; at ARC Lab I lead the stress-test campaign and built the rig automation"
result: "An ESP32-S3 DAQ board for 8 sensor types, built for about $1,700 of a $4,000 sponsor budget (about 57% under budget), plus test automation that runs an 81-step bias-injection sweep and a 4-session shaker campaign unattended"
stack: [ESP32-S3, KiCad, ESP-IDF, FreeRTOS, C, Python, pyserial, Onshape]
key_numbers:
  - label: "Sensor types on the board design"
    value: "8"
  - label: "Spend vs. the $4,000 sponsor budget"
    value: "~57% under budget"
  - label: "Bias-injection sequencer"
    value: "81 steps, one boot"
  - label: "Shaker-table sequencer"
    value: "4 sessions × 70 min"
  - label: "Nominal data: breadboard, then PCB (poster)"
    value: "2 × 100 h"
links:
  - https://github.com/sdadhich04/Faraday-Cage-design-
layout: layouts/project.njk
permalink: /projects/project-shield/
tags: [project]
mainVisual: shield-render-page
order: 2
---

## Summary

SHIELD (Smart Hardware Inspection for Early Latency Detection) is a sensor-health monitoring project from Guide Air Labs: it characterizes how healthy sensors behave so that early signs of faults and degradation can be detected.
It started as a UW ECE capstone (January to June 2026), where I was Hardware & Product Design Lead: co-hardware lead (with Thomas Glass) and procurement lead.
Thomas and I designed an ESP32-S3 data-acquisition board for 8 sensor types, from schematic to fabrication.
Since June 2026 I have worked on SHIELD at ARC Lab as Data Acquisition & Instrumentation Engineer.
There I lead the undergraduate stress-test campaign and wrote the automation that drives the orbital-shaker vibration rig; I also designed and built the Faraday cage used in the EMI tests.
I also extended the team's firmware (8 of 60 commits).

Figure: shield-board-photo

## The problem

Sensors fail or degrade quietly, and the project's first phase was to build a clean, well-labelled dataset of healthy behavior across the board's sensors before any fault work.
The success criteria asked for data from at least five physical units per sensor type, at fixed, tiered sampling rates.
The board therefore had to mix many interfaces, stay within a sponsor budget of $4,000, and scale to several identical units.
The later stress campaign adds a second problem: long, repeated sessions (vibration, thermal, EMI and fault injection) that are slow and error-prone to run by hand.

The capstone's requirements, as printed on the team's poster:

| Requirement | Goal |
|---|---|
| Sensor modalities | 8 supported sensor types |
| Sensor identity | A unique `{sensor_type, sensor_unit_id}` per run |
| Sampling architecture | Fast / medium / slow tiered sampling |
| Timestamping | ≤ 1 ms resolution |
| Storage | Binary logs + JSON metadata |
| Firmware pipeline | FreeRTOS buffering + async SD writing |
| Dataset output | CSV files for visualization and ML |
| Final ML target | Predict failure ≥ 20 s before functional loss |

Figure: shield-ml-pipeline

## Approach

**Capstone (Jan–Jun 2026)**

- I selected and specified the sensor models for all 8 types by part number and interface (SPI, I²C or ADC), and designed the wiring and power strategy, sharing the hardware lead role with Thomas.
- The types include an IMU, a microphone and a current sensor.
- We validated the sensors on a breadboard prototype with the ESP32-S3 before designing the custom DAQ PCB.
- Thomas and I designed the PCB, ordered it and soldered it.
- After fabrication I found a workaround for a datasheet misreading on the board, which avoided a respin (see "What didn't work").
- As procurement lead I built the BOM and vendor comparison; we spent about $1,700 of the $4,000 budget.
- In May 2026 I designed and built a two-part, 3D-printable Faraday cage enclosure, modelled in Onshape, and published its STEP and STL exports.

**ARC Lab (Jun 2026–present)**

- I wrote Python scripts that drive the shaker over a serial port with `SET <rpm>` commands and log its acceleration feed to CSV.
- I extended the team's firmware: noise-dataset logging across the IMU, microphone, pressure, temperature and photodiode drivers, a BNO08x gyro/magnetometer API fix, and two autonomous test sequencers (81-step bias injection; 4-session shaker table).
- I lead the undergraduate team on the stress-test campaign: I assign sessions, train people on the shaker-rig and Faraday-cage setups, and review data before it enters the shared dataset.

Figure: faraday-cage-render

Figure: faraday-cage-line

## Architecture / signal chain

**Panel A: DAQ board (team design)**

Figure: shield-system

1. **Power:** 9 V battery → 9 V-to-5 V converter → 5 V rail. In the prototype, the analog current sensor and the microSD module moved to an external, stable 5 V supply (see Decision 1).
2. **Sensors (8 types)** on SPI, I²C, ADC and I²S; I²C is the main shared bus.
3. **ESP32-S3 DevKit**, dual-core FreeRTOS firmware: Core 0 runs Fast, Medium and Slow acquisition tasks that push samples into FreeRTOS queues; Core 1 runs only an asynchronous SD-writer task.
4. **microSD (SPI):** `fast_data.bin`, `medium_data.bin`, `slow_data.bin` per session plus `meta.json`.
5. **Offline:** a team script converts the binary files to one CSV per sensor.

Figure: shield-freertos

Figure: shield-pcb-line

**Panel B: stress-test rig (my automation)**

1. **PC:** `a1_batch_runner.py` → `a1_experiment_runner.py` → `shaker_control.py`, sending `SET <rpm>` over serial to the orbital-shaker controller and logging its x, y, z acceleration to CSV.
2. **Board firmware sequencer:** GPIO46 button arms the first session; an NVS checkpoint records progress; each run writes a JSON sidecar with its settings and status.
3. **Faraday cage** around the board for the EMI sessions.
4. **Shared dataset:** I review each session's data before it is added.

## Decisions & trade-offs

Figure: shield-bias-sweep

Figure: shield-shaker-campaign

### 1. Where the analog current sensor and SD card get their 5 V (capstone)

- **Criteria:** the current sensor's reading depends on a fixed 2.5 V output at zero current, which needs a stable 5 V input; the microSD module must not throw write errors.
- **Options:**
  - power both from the ESP32-S3 board's 5 V pins;
  - power both from an external supply, trimmed with a DMM so the current sensor reads 2.5 V at zero current;
  - add real-time recalibration of the zero-current voltage in firmware.
- **Pick:** the external supply for both, because the ESP32's 5 V pins proved too unstable. Thomas and I owned getting the current sensor working, and the external-supply call was mine, driven by the sensor's datasheet.
- **Limitations:** even after calibration, the zero-current voltage still drifts over a full experiment, so current readings drift too. Real-time recalibration was set aside: it needs substantial design work and does not account for current flowing through the sensor during operation.

### 2. Which bus to standardize on (capstone)

- **Criteria:** compatibility with the 3.3 V and 5 V rails, the interfaces the chosen sensors offer, and room to add devices later.
- **Options:** SPI, I²C, analog (ADC) and I²S were all needed for this sensor mix.
- **Pick:** the team standardized on I²C as the main bus, because it scales to several devices on one shared bus, and used the other interfaces only where a sensor required them.
- **Limitations:** we had to add pull-up resistors and an extra ADC converter, and some sensors, the IMU among them, did not run at the expected sampling frequencies.

### 3. Bias injection: reflash per session, or one autonomous boot (ARC Lab)

- **Criteria:** run 81 sessions (3 trials × 9 axes × 3 severities) without hand-editing constants and reflashing between sessions, and without losing track of which run is which.
- **Options:** keep the manual rebuild-and-reflash workflow, or write a single-boot sequencer.
- **Pick:** the sequencer. Bias values became writable registers that the sequencer sets per step, an NVS checkpoint makes it resume-safe, and every run gets a `b4_meta.json` sidecar (axis, severity, trial, step index, status, firmware commit) instead of a paper log.
- **Limitations:** a button press during a session aborts it, and that step only retries on the next power cycle.

### 4. Shaker campaign: gate every session, or only the first (ARC Lab)

- **Criteria:** keep the board's recordings aligned with the PC script that drives the shaker through four back-to-back 70-minute sessions (low, medium, medium, high).
- **Options:** require a button press before each of the 4 sessions, or only before the first.
- **Pick:** only the first. A per-session gate would make the operator react to phase-boundary timing at every one of the 4 handoffs and let the two systems drift apart; after the first press, sessions 2–4 follow the PC script's zero-gap chaining.
- **Limitations:** the board and the PC stay in step only through matching timing; there is no data link between them. The checkpoint is tagged with a fingerprint of the run order, so a stale checkpoint from a different plan restarts at step 0 rather than resuming at the wrong step.

## What didn't work

- **The ESP32's 5 V pins.** They were too unstable for the analog current sensor, and the microSD adapter threw errors from the same fluctuation. Both moved to an external 5 V supply.
- **A datasheet misreading on the fabricated board.** After fabrication we found part of the board had been implemented incorrectly because of a datasheet misreading; I found a workaround that kept testing going and avoided a respin.
- **Long filenames on the SD card.** With a fresh `sdkconfig`, the firmware could not create `fast_data.bin` and the other data files, because their names exceed FAT 8.3 and `fopen` failed with errno 22. I enabled FATFS long-filename support in `sdkconfig.defaults` and wrote a setup, flash and recording guide so the next person does not hit it.
- **Post-soak data loss.** I flagged a data-loss issue after a soak test; we responded with more experiments and more logging around soak sessions.

## Testing

- **Nominal runs (capstone):** long collection runs of 15 hours each in a controlled lab environment, after trimming the supply with a DMM so the current sensor read 2.5 V at zero current.
- **100-hour no-fault collection** by the team, first on the breadboard prototype and then on the PCB prototype.
- **Rig dry runs:** fake serial devices that stream random x, y, z samples at about 50 Hz, with a `--time-scale` option that compresses the protocol waits for testing.
- **A1 vibration protocol:** 5 min settle (shaker off), 60 min at the target speed, 5 min recovery; levels are 80, 140 and 200 RPM.
- **Sequencer validation:** I tested the bias-injection sequencer end to end with a 20 s-per-session build, including a mid-sweep abort and a power-cycle resume, before flashing the real 5-minute-per-session build.
- **Campaign:** vibration, thermal, EMI and fault-injection sessions. Results are not shown here because the benchmark is unpublished.

Figure: shield-fault-map

## Results

- A custom ESP32-S3 DAQ board for 8 sensor types, taken from schematic to fabrication and used for the 100-hour no-fault collection.
- About $1,700 spent of the $4,000 sponsor budget, about 57% under budget.
- Two autonomous test sequencers in the team firmware (81-step bias injection; 4-session shaker table), plus the PC-side shaker scripts.
- 8 of the 60 commits in the team's firmware repository are mine.
- I am a co-author on the SHIBench manuscript, *SHIBench: A Benchmark for Sensor-Level Fault Detection on an Embedded Acquisition Platform*, in preparation for *Measurement* (Elsevier).
- The capstone poster, presented at the UW ECE ENGINE capstone (2026): [Project SHIELD poster (PDF)](/assets/pdf/shield-capstone-poster-2026.pdf).

## What I'd do differently

- Add a hardware sync line between the shaker PC and the board, so the two logs line up by signal rather than by matched timing (Decision 4).
- Plan for the current sensor's zero-point drift from the start, since real-time recalibration was set aside (Decision 1).
- Check each part's datasheet against the schematic before ordering boards.

## Credits & acknowledgements

- Capstone team: Thomas Glass, Jocelyn He, Sam Korostov and Houser Zhang.
- Mentors: industry mentor Alperen Cucioglu (Guide Air Labs); faculty mentor and ARC Lab PI Prof. Sep Makhsous.
- Roles from the Design Report: Thomas Glass was system & product lead and shared the hardware lead with me; Houser Zhang and Sam Korostov led firmware; Jocelyn He and Sam Korostov led data and metadata.
- The acquisition firmware is the team's; my commits extend it.
- The board photo, the system diagram, the firmware pipeline, the ML pipeline and the fault list come from the team's capstone poster; I redrew the diagrams in this site's style.
