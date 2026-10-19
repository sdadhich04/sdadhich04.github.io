---
title: "TPT-Finder bioimpedance instrument (BioZ v4)"
slug: tpt-finder-bioimpedance
pathway: Biomedical instrumentation
context: Lab
status: "● Active"
role: "Biomedical Instrumentation & Impedance Lead, UW BioRobotics Lab (since Sep 2025); I design and validate the bioimpedance instruments"
result: "Calibrated the bioimpedance sensing chain on BioZ v2 to 0.034% error at 33 kHz (2200 Ω calibration)"
stack: [AD5933, AD5934, INA333, AD8606 Howland current source, Tetrapolar bioimpedance, KiCad, ESP-IDF, Python]
key_numbers:
  - label: "Calibration error at 33 kHz (BioZ v2, 2200 Ω calibration)"
    value: "0.034%"
  - label: "Ex-vivo tissue measurements I ran (bioimpedance)"
    value: "500+"
  - label: "Electrode-material study"
    value: "40 tissue measurements"
  - label: "Board"
    value: "BioZ v4, tetrapolar (4-electrode)"
  - label: "SoundBio Lab Ignite Prize (team award)"
    value: "Inaugural, among 67 teams"
links: []
layout: layouts/project.njk
permalink: /projects/tpt-finder-bioimpedance/
tags: [project]
cardVisual: tpt-finder-poster-2026
order: 1
---

## Summary

TPT-Finder is a pen-like, multisensing surgical instrument that the UW BioRobotics Lab is developing to tell thyroid tissue from parathyroid tissue in real time during surgery.
I lead its bioimpedance instrumentation as Biomedical Instrumentation & Impedance Lead, a role I have held since September 2025; I joined the lab as an undergraduate researcher in June 2024.
I designed and built BioZ v4, a tetrapolar (four-electrode) bioimpedance board with an AD5933 impedance analyzer, an INA333 instrumentation amplifier and an AD8606 Howland current source.
I also built a second instrument, a two-electrode pen around the AD5934.
On an earlier board, BioZ v2, I calibrated the sensing chain to 0.034% error at 33 kHz (2200 Ω calibration).

## The problem

Surgeons still find the parathyroid glands mainly by eye, and the glands are small, variable and easy to confuse with the tissue around them.
Damaging or removing them by accident can cause hypoparathyroidism.
The lab is characterizing three sensing modalities separately (bioimpedance, ultrasound and photonics) before combining them in a multimodal classifier.
My part is bioimpedance. The signal chain has to measure tissue impedance with instrument error well below the differences between tissues, and it has to be trustworthy at the low-impedance end of the range.

## Approach

- I moved the bioimpedance sub-team from a bipolar (two-electrode) design to a tetrapolar one, which became BioZ v4.
- I ran a controlled electrode-material study across 40 tissue measurements to settle the team's electrode protocol.
- I calibrated the sensing chain against structured RC reference networks.
- I ran the ex-vivo study and all 500+ tissue measurements.
- For a more portable use case I built a two-electrode pen around the AD5934, where a simpler design was an acceptable trade.
- Earlier, as an undergraduate researcher, I designed a KiCad reference board that simulates tissue-like impedances to validate the lab's first bioimpedance prototype.
- I rewrote and documented the AD5933 I²C driver against the datasheet, starting from a labmate's branch.
- I wrote ESP-IDF firmware and a Python GUI for the sensing head. (No code links: the code is lab property.)

## Architecture

The parts of the BioZ v4 measurement:

- **AD5933 impedance analyzer**, configured and read by the MCU over I²C.
- **AD8606 Howland current source**, for constant-current excitation (Decision 2).
- **INA333 instrumentation amplifier.**
- **Four electrodes (tetrapolar):** the outer pair injects current and the inner pair senses voltage.
- **ESP32 running ESP-IDF firmware**, with a **Python GUI** on the host PC that runs sweeps and logs results.
- **Calibration:** structured RC reference networks in place of tissue, including the 2200 Ω calibration.

The second instrument, the two-electrode pen, uses an AD5934 with a single electrode pair that both drives and senses.

## Decisions & trade-offs

### 1. Tetrapolar instead of bipolar sensing on BioZ v4

- **Criteria:** the reading should reflect the tissue, not the electrode-to-tissue contact, and it has to hold up at low impedances.
- **Options:**
  - *Bipolar (two electrodes):* the same pair injects current and senses voltage. It needs fewer parts, but the contact impedance sits in series with the tissue in every reading.
  - *Tetrapolar (four electrodes):* an outer pair injects current and an inner pair senses voltage, which keeps contact impedance out of the measured voltage.
- **Pick:** tetrapolar for BioZ v4. Bipolar was simpler, but the electrode–tissue contact impedance swamped the tissue signal; tetrapolar separates drive and sense. This moved the sub-team off the less accurate bipolar approach.
- **Limitations:** it needs four electrodes plus a current source and an instrumentation amplifier, where the bipolar design needed two electrodes, and the four-electrode tip is larger. Where portability mattered more, I kept a two-electrode design (the AD5934 pen).

### 2. Constant-current excitation from a Howland source

- **Criteria:** the excitation should not change with the load, because the load (tissue) is what is being measured.
- **Options:** drive the electrodes from the AD5933's voltage output directly, or put an AD8606 Howland current source in between.
- **Pick:** the AD8606 Howland current source.
- **Limitations:** a Howland source holds the current constant only within its compliance range, and how constant it stays depends on how well its resistors match, so it adds parts and a stage that has to be checked.

## What didn't work

### Signal compression below 1 kΩ

While validating the board, I saw the measured signal compress below 1 kΩ in a way that did not match how tissue should behave.
I designed the experiments that showed the compression below 1 kΩ was an instrument-level artifact, not tissue behavior.
This mattered because a tissue classifier trained on that data would have learned instrument error instead of tissue differences.

### 60 Hz noise that came from the oscilloscope

As a researcher I chased a persistent 60 Hz artifact and traced it to the oscilloscope rather than the circuit.

## Testing

- **Calibration:** against structured RC reference networks; on BioZ v2, the 2200 Ω calibration reached 0.034% error at 33 kHz.
- **Electrode protocol:** controlled study across 40 tissue measurements.
- **Phantoms:** I designed the phantom-test experiments: liquids and ionic phantoms of different conductivity, to check that the readings shift with conductivity as expected.
- **Ex-vivo tissue:** I ran the study and all 500+ measurements.
- **Earlier validation:** a KiCad reference board with tissue-like impedances, used to validate the lab's first bioimpedance prototype.

## Results

- On BioZ v2, the sensing chain is calibrated to 0.034% error at 33 kHz (2200 Ω calibration).
- Two working bioimpedance instruments: the BioZ v4 tetrapolar board and the AD5934 two-electrode pen.
- 500+ ex-vivo tissue measurements collected.
- The TPT-Finder team won the inaugural SoundBio Lab Ignite Prize at the 2026 Hollomon Health Innovation Challenge (Buerk Center), among 67 teams.
- I wrote the team's UW Undergraduate Research Symposium abstract.
- I do not quote a tissue-classification accuracy here: the multimodal classifier is still ongoing work.

## What I'd do differently

- Report calibration error across the whole frequency sweep, not at one frequency.
- Test for range compression at the low-impedance end from day one, instead of finding it during validation.

## Credits & acknowledgements

- UW BioRobotics Lab, PI Blake Hannaford.
- Built with the TPT-Finder team (UW BioRobotics Lab).
- The AD5933 driver started from a labmate's branch before I rewrote and documented it.
- The prize was awarded to the TPT-Finder team.
- The lab's code, data and internal documents are lab property and are not published or linked here.
