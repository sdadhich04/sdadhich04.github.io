---
title: About · Sparsh Dadhich
description: Electrical and computer engineer working on bioimpedance instrumentation, sensor data acquisition and embedded ML. BS ECE, University of Washington, 2026.
permalink: /about/
layout: layouts/page.njk
pageClass: page-about
---

# About

## Bio

I'm an electrical and computer engineer in Seattle, and I work on the layer between sensors and models: the analog front end, the firmware that samples it, and the checks that show the data can be trusted.
I graduated from the University of Washington in June 2026 with a BS in Electrical & Computer Engineering and a minor in Neural Computation & Engineering.

At the UW BioRobotics Lab I lead biomedical instrumentation and impedance work for TPT-Finder, where I built a tetrapolar bioimpedance board and a two-electrode bioimpedance pen.
At ARC Lab I'm the data acquisition and instrumentation engineer on the SHIELD stress-test campaign, which covers vibration, thermal, EMI and fault-injection testing.
Other recent work: I wrote all of the firmware for a four-person course team's posture wearable (BackOnTrack), and I built an on-device infant cry detector in a joint project with Jonathan Lu (SmartCrib).

## Education

**University of Washington**, Seattle
BS, Electrical & Computer Engineering · June 2026
Minor: Neural Computation & Engineering

- Dean's List (multiple quarters)
- Annual Dean's List, 2025–2026

## Current roles

- **● Active** · **Data Acquisition & Instrumentation Engineer**, ARC Lab (PI: Prof. Sep Makhsous) · Jun 2026–present
- **● Active** · **Biomedical Instrumentation & Impedance Lead**, UW BioRobotics Lab (PI: Blake Hannaford) · Sep 2025–present

## Experience

### ARC Lab (PI: Prof. Sep Makhsous)
**Data Acquisition & Instrumentation Engineer** · Jun 2026–present · `● ACTIVE`

- I lead an undergraduate team on the SHIELD stress-test campaign: I assign sessions, train people on the shaker-rig and Faraday-cage setups, and review data before it enters the shared dataset.
- I designed and built the Faraday cage and the automation scripts that drive the orbital-shaker vibration-test rig, used for vibration, thermal, EMI and fault-injection testing for SHIBench, an open sensor-fault-detection benchmark.
- I extended the team's firmware (8 of 60 commits): noise-dataset logging across the sensor drivers, a BNO08x gyro/magnetometer API fix, and two autonomous test sequencers (an 81-step bias injection and a 4-session shaker-table run).
- I flagged a post-soak data-loss issue; we responded with more experiments and more logging around soak sessions. I also produced sensor-characterization plots that fed the QA process, and I'm a co-author on the SHIBench manuscript.

### UW BioRobotics Lab (PI: Blake Hannaford)

**Biomedical Instrumentation & Impedance Lead** · Sep 2025–present · `● ACTIVE`

- I built two bioimpedance instruments end to end for TPT-Finder: a tetrapolar board (AD5933 impedance analyzer, INA333 instrumentation amplifier, AD8606 Howland current source) and a two-electrode pen (AD5934).
- The tetrapolar board (BioZ v4) moved the sub-team from a bipolar to a tetrapolar measurement approach.
- I ran an electrode-material study across 40 tissue measurements.
- On an earlier board, BioZ v2, I calibrated the sensing chain to 0.034% error at 33 kHz (2200 Ω calibration).
- I ran the ex-vivo study and all 500+ tissue measurements, and I designed the experiments that showed the compression below 1 kΩ was an instrument-level artifact, not tissue behavior.
- I designed the phantom-test experiments that check the readings shift with conductivity as expected.
- I support the ultrasound and photonics sub-modalities, and I wrote the team's UW Undergraduate Research Symposium abstract.
- Our TPT-Finder team won the inaugural SoundBio Lab Ignite Prize, among 67 competing teams, at the Hollomon Health Innovation Challenge (Buerk Center), March 2026.

**Undergraduate Researcher** · Jun 2024–Sep 2025 · `COMPLETED`

- I characterized a 770 nm LED and 785 nm bandpass filter pair for the photonics excitation module.
- I designed a KiCad reference board that simulates tissue-like impedances, to validate the lab's first bioimpedance prototype.
- I rewrote and documented the AD5933 I2C driver against the datasheet, starting from a labmate's branch.
- I traced a persistent 60 Hz artifact to the oscilloscope rather than the circuit, and collected clinical tissue samples with a hospital collaborator.

### Project SHIELD · UW ECE capstone for Guide Air Labs
**Hardware & Product Design Lead** · co-hardware lead (with Thomas Glass) and procurement lead · Jan–Jun 2026 · `COMPLETED`

- I selected and specified the sensors by part number and interface for a board design with 8 sensor types.
- As co-hardware lead, I took the ESP32-S3 data-acquisition PCB from schematic to fabrication. After fabrication we found part of the board had been implemented incorrectly because of a datasheet misreading; I found a workaround that kept testing going and avoided a respin.
- I built the BOM and vendor comparison; we spent about $1,700 of the $4,000 sponsor budget, about 57% under budget.
- I wrote the Python pipelines for paired dataset logging. Teammates led the firmware and the ML.

### Central Research Laboratory, Bharat Electronics
**Computer Vision Robotics Intern** · Aug–Sep 2025 · `COMPLETED`

### UW NextGen Civic Leader Corps
**Student Advisor** · Dec 2022–Jun 2026 · `COMPLETED`

See Leadership below.

## Leadership

### SHIELD stress-test campaign lead · ARC Lab · Jun 2026–present · `● ACTIVE`
I lead the undergraduate team that runs the SHIELD stress-test campaign; the details are under ARC Lab in Experience above.

### Student Advisor · UW NextGen Civic Leader Corps · Dec 2022–Jun 2026
I was a student advisor to the program for three and a half years.

- I grew program participation 25×, from a 4-person core group to 100+ attendees.
- I co-led the NextGen Teams program, which doubled the program's Instagram following and reached a 67% newsletter open rate.
- I built and managed the program's digital community-engagement channels.
- I co-facilitated Leadership Firesides, a weekly dialogue series pairing a 17-student cohort with 8 visiting civic and public-service leaders.

### Co-Founder · ULI · Dec 2023–Mar 2024 · `COMPLETED`
- I co-founded an AI-driven platform for early dementia detection, focused on machine-learning voice analysis.
- I drove product direction through user research, which reached a 75% interest rate in pilot programs.

### Campus activities · University of Washington
- Extended Reality Association (XRA)
- Maple Hall council
- Residential Community Student Association (RCSA)

## Coursework

Course code and title, each tagged with the pathway it supports. The left column is the ECE major and the right column is the Neural Computation & Engineering minor.

| ECE major | Pathway | NC&E minor | Pathway |
|---|---|---|---|
| EE 474 Intro to Embedded Systems | Embedded | EE 460 Neural Engineering | Neural/BCI |
| EE 446 Tiny ML for Low-Power Computing | TinyML | EE 461 Neural Engineering Tech Studio (minor capstone) | Neural/BCI |
| EE 469 Computer Architecture I | Digital design | EE 466 Neural Computation & Engineering Lab | Neural/BCI |
| EE 271 Digital Circuits & Systems | Digital design | AMATH 342 Neural Coding & Computation | Neural/BCI |
| EE 242 Signals, Systems & Data I | Signal processing | CSE 415 Introduction to AI | ML / robotics |
| EE 233 Circuit Theory | Instrumentation | | |
| EE 497/498 Entrepreneurial Capstone (SHIELD) | Test & measurement | | |
| EE 499 Undergraduate Research (BioRobotics Lab) | Instrumentation | | |
| CSE 416 Introduction to Machine Learning | ML | | |
| STAT 390 Statistical Methods in Engineering & Science | Test & measurement | | |
