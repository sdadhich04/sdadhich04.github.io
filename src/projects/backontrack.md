---
title: "BackOnTrack: wearable posture monitor"
slug: backontrack
pathway: "Embedded systems & firmware"
context: "Course team"
status: Prototype
role: "Wrote all of the firmware (15/15 commits) in a four-person EE/BIOEN 461 team (Sparsh, Matthew, Parneet, Ella)"
result: "On-device, rule-based posture classification (good posture + 5 fault states with the upper IMU and one EMG channel), 95.3% accurate when checked against real-time movements, with raw sensor data streamed over BLE at 20 Hz"
stack: [ESP32-S3, ESP-IDF, FreeRTOS, C/C++, BNO085 IMU (SPI), MyoWare 2.0 EMG, BLE (NimBLE), Python]
key_numbers:
  - label: "Classification accuracy, checked against real-time movements"
    value: "95.3%"
  - label: "Firmware commits that are mine"
    value: "15 of 15"
  - label: "Posture states"
    value: "7 designed; good + 5 fault states running on one IMU"
  - label: "Sampling: IMU / EMG / BLE"
    value: "50 Hz / 100 Hz / 20 Hz"
  - label: "Confirmation window before a fault counts"
    value: "750 ms"
  - label: "Longest logged session"
    value: "48,594 BLE packets (40.5 min)"
links:
  - https://github.com/sdadhich04/Project-Back-on-Track
layout: layouts/project.njk
permalink: /projects/backontrack/
tags: [project]
mainVisual: backontrack-system
plotVisual: backontrack-telemetry
cardVisual: backontrack-telemetry
order: 3
---

## Summary

BackOnTrack is a wearable posture-awareness prototype built by a four-person EE/BIOEN 461 team (Sparsh, Matthew, Parneet, Ella) in Spring 2026; I wrote all of the firmware (15/15 commits).
As the team's user manual describes it, the system is an ESP32-S3 main module with two BNO085 IMUs, one on the upper back between the shoulder blades and one on the lower back near the lumbar region, a MyoWare 2.0 EMG sensor on the upper trapezius, vibration alerts, and a companion mobile app (iOS and Android) over BLE.
It sorts posture into seven states (Good, Slouching, Leaning Forward, Leaning Left, Leaning Right, High Tension and Lumbar Collapse), and an alert fires only after a confirmation period.
The public firmware currently runs the upper IMU only. The bundled BNO08x driver is single-instance, so the lower-back IMU, which Lumbar Collapse needs, is configured but disabled, and the device classifies good posture plus 5 fault states.
Checked against real-time movements, the classification was 95.3% accurate.
It is a posture-awareness prototype, not a medical device.

## The problem

The team wanted a wearable that tells different poor-posture patterns apart in real time, with the classification done on the device rather than in a phone app or the cloud.
The device is aimed at people who sit for long hours, such as office workers.
Orientation alone cannot separate some cases: leaning forward is an orientation change, while sitting upright with tense shoulders shows up only as muscle activity. That is why the design pairs IMUs with an EMG sensor.

## Approach

- **Sensors:** in the manual's design, BNO085 IMUs sit on the upper back (between the shoulder blades) and the lower back (near the lumbar region), and a MyoWare 2.0 sits on the upper trapezius. In the public firmware, the upper BNO085 runs over SPI and the MyoWare is read by the ESP32-S3's ADC; the lower-back IMU is configured but disabled (Decision 2).
- **Sampling:** IMUs at 50 Hz and EMG at 100 Hz.
- **Firmware structure:** separate ESP-IDF components for the sensor HAL, drivers, posture features and classifier, BLE and serial telemetry, so changing a driver or a threshold does not ripple through the rest.
- **Calibration:** a 5-second startup calibration records the neutral gravity vectors, an upper-to-lower IMU alignment baseline and resting EMG; in the firmware, a BLE command can rerun it.
- **Classifier:** threshold rules on forward lean, sideways lean, total lean and EMG above baseline, each held for a confirmation window before it counts. I set and checked the thresholds through experimentation and trial and error.
- **Feedback for the user:** the manual's design alerts with vibration and pairs with the companion app; the firmware also tracks gamified streaks and points for time spent in good posture.

## Architecture / signal chain

1. **BNO085 (upper back)** on SPI3 → `imu_upper_task` at 50 Hz → IMU queue. Runs on Core 0.
2. **MyoWare 2.0** → ADC1 channel 3 (GPIO4) → exponential moving-average filter → `emg_task` at 100 Hz → EMG queue. Runs on Core 0.
3. **`processing_task`** on Core 1 at 20 Hz drains both queues, then:
   - sends the raw sensor packet over BLE (NimBLE GATT notify, 20 Hz);
   - computes features: the gravity direction from the IMU quaternion, compared with the calibrated neutral, split into forward, sideways and total lean, plus EMG above baseline;
   - classifies with the rules and the 750 ms confirmation window;
   - updates session statistics and prints CSV or JSON over serial at 10 Hz.
4. **BLE control characteristic:** command 0x01 reruns calibration, 0x02 resets the session statistics.
5. **Desktop receiver:** `tools/bot_ble_receiver.py` (Python, bleak) subscribes and logs packets to CSV.
6. **Second BNO085 (lower back):** drawn greyed out. It is configured in the source but disabled at runtime (Decision 2).

## Decisions & trade-offs

### 1. Rule-based classifier instead of a trained model

- **Criteria:** no training-data collection phase within the course, and every flagged state traceable to a specific rule, so the logic can be debugged.
- **Options:** threshold rules on calibrated features, or a trained classifier (a TinyML model was listed as a later step).
- **Pick:** rules. We had no labelled posture data yet, so rules we could explain and tune beat a model we couldn't validate. Current thresholds: forward lean of 10° for slouching and 25° for leaning forward, ±12° sideways, 14° total lean for diagonal leans, and EMG 80 ADC counts above baseline for high tension.
- **Limitations:** I set and checked the thresholds through experimentation and trial and error, so they are not trained or validated on labelled posture data. Logged CSV telemetry could become training data for a TinyML model later.

### 2. One IMU instead of two

- **Criteria:** detect lower-back rounding ("Lumbar Collapse") that an upper-back sensor misses, without destabilizing the firmware.
- **Options:**
  - two BNO085s on a shared SPI bus, upper and lower back, with a lumbar-collapse rule at 12° of relative flexion, as the manual's design has it;
  - one BNO085 on the upper back.
- **Pick:** one IMU. The bundled BNO08x library embeds a single-instance SH-2 stack (one global `sh2_t`; `MAX_INSTANCES == 1` in `shtp.c`); opening a second sensor makes `sh2_open()` fail, and its orphaned service task dereferences a null pointer.
- **Limitations:** no Lumbar Collapse detection on the device, even though the rule is still in the code; the user manual describes the two-IMU design, and the public firmware runs one.

### 3. Lean measured from the gravity vector instead of Euler angles

- **Criteria:** lean measured relative to the calibrated neutral posture, consistent from run to run, across a wider variety of ranges of motion and actions.
- **Options:**
  - deviations of pitch and roll angles from neutral, with thresholds of 15° (slouch), 30° (forward) and ±10° (sideways);
  - the gravity direction from the quaternion, compared with the neutral gravity direction and split into forward, sideways and total lean, with thresholds of 10°, 25°, ±12° and 14°.
- **Pick:** the gravity-vector version, in the 10 June commit "Singular IMU with thresholding classifications". I made the change to handle a wider variety of ranges of motion and actions. Every metric is a difference from the neutral vector, so the sensor's absolute sign convention does not matter. I set the new thresholds through experimentation and trial and error.
- **Limitations:** the decomposition is only valid until the body tilts about 90° from neutral, far beyond sitting posture; the thresholds are still hand-set.

### 4. A 750 ms confirmation window

- **Criteria:** brief movements, such as reaching for a cup, should not count as bad posture.
- **Options:** the documented tuning range is 500–2000 ms. A shorter window reacts faster but lets more brief movements through; a longer one filters more but delays real alerts.
- **Pick:** 750 ms.
- **Limitations:** a real fault is reported at least 750 ms late.

## What didn't work

**IMU bring-up.** Both BNO085s returned valid part numbers, yet calibration failed and every posture value stayed at zero.
I verified the wiring and the SPI transport, then compared the firmware against a standalone diagnostic app that I iterated six times.
The diagnostic reset the sensor and drained its boot packets before enabling the Game Rotation Vector report; copying that sequence got the sensor streaming.
Values still stayed at zero, so the problem had moved to parsing: we had set the wrong feature flags and report ID.
Later the same day I switched to the bundled BNO08x library.
That library is single-instance, which is what forced the one-IMU design: the lower-back IMU, which Lumbar Collapse needs, is still configured but disabled (Decision 2).

## Testing

- **Live check:** I checked the classification against real-time movements; it was 95.3% accurate. This was a check against live movements, not an evaluation on a labelled dataset.
- **Test checklist** (`docs/testing.md`): pre-flash wiring checks, startup and calibration ranges, each posture state triggered on purpose, a lean shorter than 750 ms that must not trigger, gamification counters, and a 5-minute run with no crash and no frequent queue drops.
- **Logged session:** I wore the device for a BLE log on 9 June 2026 that holds 48,594 packets over 40.5 minutes (20 Hz), with the upper IMU and EMG valid and the lower IMU off.

## Results

- Working ESP-IDF firmware: one IMU plus EMG, on-device rule-based classification of good posture + 5 fault states, BLE streaming and BLE commands, serial telemetry, and streak tracking.
- 95.3% classification accuracy, checked against real-time movements.
- A root-caused IMU calibration fault (mis-set BNO08x feature flags), documented with the diagnostic project in the repo.
- A 40.5-minute logged session of 48,594 telemetry frames (upper-back IMU + EMG).

## What I'd do differently

Next steps already listed in the repo:

- save the calibration to NVS so it survives a reboot;
- add a buzzer or vibration motor for feedback on the device;
- add a battery and power management;
- log labelled sessions and train a TinyML classifier to compare with the rules.

My own additions:

- validate the thresholds on labelled sessions before tuning them;
- solve the two-IMU limit early, with a driver that supports two instances or a second MCU for the lower-back IMU.

## Credits & acknowledgements

- Team: Sparsh, Matthew, Parneet and Ella (EE/BIOEN 461, Spring 2026).
- The system description follows the team's user manual (EE/BIOEN 461, Spring 2026).
- The bundled `esp32_BNO08x` library is MIT-licensed and credits Myles Parfeniuk.
- The sensor-HAL pattern was adapted from Project SHIELD.
