---
title: "TPT-Finder bioimpedance instrument"
slug: tpt-finder-bioimpedance
pathway: Biomedical instrumentation
context: Lab
status: "● Active"
role: "Biomedical Instrumentation & Impedance Lead, UW BioRobotics Lab (since Sep 2025); I design and validate the bioimpedance instruments"
result: "Calibrated the bioimpedance sensing chain on BioZ v2 to 0.034% error at 33 kHz (2200 Ω calibration)"
stack: [AD5933, AD5934, AD8606, INA333, Bioimpedance, KiCad, ESP-IDF, Python]
key_numbers:
  - label: "Calibration error at 33 kHz (BioZ v2, 2200 Ω calibration)"
    value: "0.034%"
  - label: "Ex-vivo tissue measurements I ran (BioZ v2)"
    value: "500+"
  - label: "Electrode-material study"
    value: "40 tissue measurements"
  - label: "Two-electrode BioZ v2 → four-electrode BioZ v4"
    value: "v2 → v4"
  - label: "SoundBio Lab Ignite Prize (team award)"
    value: "Inaugural, among 67 teams"
links: []
layout: layouts/project.njk
permalink: /projects/tpt-finder-bioimpedance/
tags: [project]
mainVisual: tpt-finder-signal-chain
plotVisual: tpt-liquid-validation
order: 1
---

## Summary

TPT-Finder is a pen-like, multisensing surgical instrument that the UW BioRobotics Lab is developing to tell thyroid tissue from parathyroid tissue in real time during surgery.
I lead its bioimpedance instrumentation as Biomedical Instrumentation & Impedance Lead, a role I have held since September 2025; I joined the lab as an undergraduate researcher in June 2024.
The poster's bioimpedance data came from BioZ v2, a two-electrode board built around an AD5933 impedance analyzer, with an AD8606 dual op-amp as its drive buffer and transimpedance stage.
On it I calibrated the sensing chain to 0.034% error at 33 kHz (2200 Ω calibration) and ran all 500+ ex-vivo tissue measurements.
I then designed and built BioZ v4, a tetrapolar (four-electrode) board that adds an INA333 instrumentation amplifier on the sense pair.
I also built a second instrument, a two-electrode pen around the AD5934.

## The problem

More than 150,000 thyroidectomies are performed in the US each year, and surgeons still find the parathyroid glands mainly by eye.
The glands are only 2–3 mm across, variable, and easy to confuse with the tissue around them; in 5–7% of cases they are damaged or removed by accident, which can cause hypoparathyroidism.
The lab is characterizing three sensing modalities separately (bioimpedance, ultrasound and photonics) before combining them in a multimodal classifier.
My part is bioimpedance. The signal chain has to measure tissue impedance with instrument error well below the differences between tissues, and it has to be trustworthy at the low-impedance end of the range.

## Approach

- I moved the bioimpedance sub-team from the bipolar (two-electrode) BioZ v2 to a tetrapolar design, which became BioZ v4.
- I ran a controlled electrode-material study across 40 tissue measurements to settle the team's electrode protocol.
- I calibrated the sensing chain against structured RC reference networks.
- I ran the ex-vivo study and all 500+ tissue measurements.
- For a more portable use case I built a two-electrode pen around the AD5934, where a simpler design was an acceptable trade.
- Earlier, as an undergraduate researcher, I designed a KiCad reference board that simulates tissue-like impedances to validate the lab's first bioimpedance prototype.
- I rewrote and documented the AD5933 I²C driver against the datasheet, starting from a labmate's branch.
- I wrote ESP-IDF firmware and a Python GUI for the sensing head. (No code links: the code is lab property.)

## Architecture

The board that took the poster data, BioZ v2 (the diagram at the top, read from its KiCad netlist):

- **AD5933 impedance analyzer**, clocked by a 16 MHz oscillator and configured and read by the MCU over I²C; its on-chip DFT gives the real and imaginary parts of each reading.
- **Drive:** the AD5933's excitation is AC-coupled through 47 nF, re-biased to mid-supply, and buffered by one channel of an AD8606 onto electrode E1.
- **Return:** the current comes back on electrode E2 into the AD8606's other channel, a transimpedance stage, and from there into the AD5933's receive input.
- **Two electrodes:** the same pair drives and senses.
- **ESP32 running ESP-IDF firmware**, with a **Python GUI** on the host PC that runs sweeps and logs results.
- **Calibration:** structured RC reference networks in place of tissue, including the 2200 Ω calibration.

BioZ v4 keeps the AD5933 and the AD8606 drive buffer and moves to four electrodes: the outer pair injects and returns the current, and the inner pair senses the voltage through an **INA333 instrumentation amplifier** (Decision 2).

Figure: tpt-finder-electrodes

The second instrument, the two-electrode pen, uses an AD5934 with a single electrode pair that both drives and senses.

## Decisions & trade-offs

### 1. Tetrapolar instead of bipolar sensing on BioZ v4

- **Criteria:** the reading should reflect the tissue, not the electrode-to-tissue contact, and it has to hold up at low impedances.
- **Options:**
  - *Bipolar (two electrodes):* the same pair injects current and senses voltage. It needs fewer parts, but the contact impedance sits in series with the tissue in every reading.
  - *Tetrapolar (four electrodes):* an outer pair injects current and an inner pair senses voltage, which keeps contact impedance out of the measured voltage.
- **Pick:** tetrapolar for BioZ v4. Bipolar was simpler, but the electrode–tissue contact impedance swamped the tissue signal; tetrapolar separates drive and sense. This moved the sub-team off the less accurate bipolar approach.
- **Limitations:** it needs four electrodes plus an instrumentation amplifier, where the bipolar design needed two electrodes, and the four-electrode tip is larger. Where portability mattered more, I kept a two-electrode design (the AD5934 pen).

### 2. A single-supply instrumentation amplifier for the sense pair (BioZ v4)

- **Criteria:** amplify the small voltage across the inner electrode pair on the board's existing single 3.3 V supply, with high common-mode rejection and low drift.
- **Options:** a standard bioimpedance instrumentation amplifier such as the AD620 or AD8422, which typically needs dual supplies or a higher supply floor, or the INA333, a zero-drift, micropower part that runs on a single 3.3 V supply.
- **Pick:** the INA333, with its gain set to about 1000 by a 100 Ω gain resistor, sized from the modelled tissue range so the output stays inside the 3.3 V swing, and its reference pin at 1.65 V from a 10 kΩ/10 kΩ divider so the AC signal sits mid-supply.
- **Limitations:** the gain is fixed by one resistor, so a sense voltage beyond the modelled range clips and a new range means a new resistor; the 1.65 V reference comes from a resistor divider rather than a buffered reference.

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
- **Liquids** (figure above): at 33 kHz, |Z| falls from about 208 kΩ for distilled water to about 592 Ω for saline, roughly 350×, so the reading follows conductivity.
- **Chicken breast** (figure below): 20 ex-vivo samples cluster within 10.3 Ω (590.7–601.1 Ω, SD 3.0 Ω, 0.5% of the mean) and within 1.7° in phase at 33 kHz.

Figure: tpt-chicken-cluster

- Two working bioimpedance instruments: the BioZ v4 tetrapolar board and the AD5934 two-electrode pen.
- 500+ ex-vivo tissue measurements collected, on BioZ v2.
- The TPT-Finder team won the inaugural SoundBio Lab Ignite Prize at the 2026 Hollomon Health Innovation Challenge (Buerk Center), among 67 teams.
- I wrote the team's UW Undergraduate Research Symposium abstract.
- Elsewhere on the poster, the photonics sub-team reported a large effect size (Cohen's d ≈ 1.7) over about 600 measurements per trial. That result is theirs, not the bioimpedance chain's.
- I do not quote a tissue-classification accuracy here: the multimodal classifier is still ongoing work.

## What I'd do differently

- Report calibration error across the whole frequency sweep, not at one frequency.
- Test for range compression at the low-impedance end from day one, instead of finding it during validation.

## Credits & acknowledgements

- UW BioRobotics Lab, PI Blake Hannaford.
- Mentor: Andrew Lewis, PhD.
- Built with the TPT-Finder team (UW BioRobotics Lab).
- The AD5933 driver started from a labmate's branch before I rewrote and documented it.
- The prize was awarded to the TPT-Finder team.
- The lab's code, data and internal documents are lab property and are not published or linked here.
