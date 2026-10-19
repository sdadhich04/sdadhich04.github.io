---
title: "SmartCrib: on-device infant-cry detection"
slug: smartcrib
pathway: "TinyML / edge ML"
context: "Course team"
status: Prototype
role: "Joint project with Jonathan Lu (EE/CSE 474 final project)"
result: "INT8 cry detector running on an Arduino Nano 33 BLE Sense: 41% smaller than float32 (7,392 vs 12,508 bytes) with the same held-out results (93.75% cry recall at threshold 0.7)"
stack: [Arduino Nano 33 BLE Sense, TensorFlow Lite Micro, INT8 quantization, MFCC, CMSIS-DSP, TensorFlow/Keras, ESP32, BLE]
key_numbers:
  - label: "INT8 model size (float32: 12,508 B)"
    value: "7,392 bytes (−41%)"
  - label: "Cry recall, INT8, threshold 0.7"
    value: "93.75% (3 of 48 cry windows missed)"
  - label: "Accuracy, INT8, threshold 0.7"
    value: "94.79% on 96 held-out windows"
  - label: "Alert rule"
    value: "2 of the last 3 one-second windows"
  - label: "Estimated tensor arena, INT8 (float32: 56,320 B)"
    value: "27,648 bytes"
links:
  - https://github.com/sdadhich04/EE-474-final-project-
layout: layouts/project.njk
permalink: /projects/smartcrib/
tags: [project]
mainVisual: smartcrib-pipeline
plotVisual: smartcrib-quantization
cardVisual: smartcrib-quantization
order: 4
---

## Summary

Joint project with Jonathan Lu.
SmartCrib was our final project for EE/CSE 474 (Spring 2026): an infant-cry detector that runs entirely on a microcontroller.
An Arduino Nano 33 BLE Sense (nRF52840, Arm Cortex-M4) listens through its onboard PDM microphone, turns each 1-second window into MFCC features and runs an INT8 TensorFlow Lite Micro model.
When 2 of the last 3 windows cross the cry threshold, it raises an alert; an ESP32 bridge then sounds a buzzer and sends a BLE notification.
The INT8 model is 7,392 bytes, 41% smaller than the float32 version, with the same results on the held-out test windows.

## The problem

The detector has to work without streaming audio to a server, which keeps latency down and audio private.
Cry recall is the metric that matters most, because a false negative means a cry was missed.
It has to fit the Nano 33 BLE Sense: 1 MB of flash and 256 KB of SRAM, with targets of a model under 100 KB and inference under 200 ms per window.

## Approach

- **Data:** cry clips from the Donate-a-Cry corpus as positives; ESC-50 clips as negatives, excluding its `crying_baby` category.
- **Splits:** train, validation and test were split by original clip before windowing, to avoid leakage; training windows were balanced between classes.
- **Bounded run:** the committed artifacts were trained on a subset of 80 Donate-a-Cry clips and 80 negative clips, giving 448 training, 96 validation and 96 test windows.
- **Features:** 16 kHz mono audio, 1-second windows, 13 MFCCs × 40 frames (512-point FFT, Hann window, 26 mel bins), standardized with training-set statistics that are exported to the device.
- **Model:** two Conv1D layers (16 and 32 filters), global average pooling and a two-class softmax.
- **Deployment:** full-integer post-training quantization with representative MFCC windows, export to a C array, and a Nano sketch that computes MFCCs with CMSIS-DSP.

## Architecture / signal chain

**Nano 33 BLE Sense**

1. PDM microphone (16 kHz) → interrupt buffer → audio ring buffer.
2. Snapshot of the latest 1-second window at each hop.
3. MFCC: Hann window → real FFT (CMSIS-DSP `arm_rfft_fast_f32`) → 26-bin mel filterbank → log → DCT → standardization.
4. INT8 TensorFlow Lite Micro model in a 60 KB tensor arena → P(cry).
5. Threshold (0.7) → 2-of-3 majority vote → onboard LED and pin D2 HIGH.

**ESP32 alert bridge**

6. GPIO 5 reads the Nano's D2 alert line (interrupt sets a flag; the main loop does the slow work).
7. GPIO 6 drives a buzzer with a non-blocking pattern.
8. BLE peripheral `SmartCrib-ESP32`: an alert characteristic (notify/read) sends `CRY_ALERT,count=N,state=1,muted=M`; a control characteristic accepts `MUTE`, `UNMUTE`, `ACK` and `TEST`. An optional mute button sits on GPIO 4.

**Offline pipeline (Python):** `audio_features.py` → `train_smartcrib.py` → `convert_to_tflite.py` → `evaluate_smartcrib.py` (threshold sweep) → `export_model_array.py` (model C array + feature config header).

## Decisions & trade-offs

### 1. Operating threshold: 0.7 instead of 0.5

- **Criteria:** reach the 90% cry-recall target first, then keep false alarms as low as possible.
- **Options (INT8 model, 96 test windows):**

  | Threshold | Cry recall | Cry precision | Missed cries (FN) | False alarms (FP) |
  |---:|---:|---:|---:|---:|
  | 0.3 | 97.92% | 83.93% | 1 | 9 |
  | 0.4 | 97.92% | 85.45% | 1 | 8 |
  | 0.5 | 97.92% | 92.16% | 1 | 4 |
  | 0.6 | 95.83% | 92.00% | 2 | 4 |
  | 0.7 | 93.75% | 95.74% | 3 | 2 |

- **Pick:** 0.7, the lowest-false-positive threshold that met the recall target.
- **Limitations:** it misses 3 cry windows where 0.5 misses 1, at the cost of two extra false alarms; the final report says to drop to 0.5 if on-device recordings show missed cries. The threshold was chosen on the same held-out split that the results are reported on, and that split has only 96 windows.

### 2. Audio and ML on the Nano, alerts on an ESP32, joined by one GPIO line

- **Criteria:** keep all audio processing and inference on one board, and keep the link to the alert board simple and reliable.
- **Options:**
  - the original proposal: one ESP32-S3 with an external I²S microphone doing everything;
  - the Nano's onboard microphone and model, with an ESP32 that only handles alerts;
  - for the link between the boards, a single GPIO alert line or UART carrying scores.
- **Pick:** Nano for audio and inference, ESP32 bridge, one GPIO line (Nano D2 → ESP32 GPIO 5). Moving to the Nano's onboard PDM microphone let us keep all of the processing and classification on one board.
- **Limitations:** the ESP32 only receives the final alert state, not the cry score, threshold or latency; sending those over UART is listed as future work.

### 3. INT8 instead of float32

- **Criteria:** fit the Nano's memory with margin and lose no detection performance.
- **Options:** float32 TFLite (12,508 bytes; estimated arena 56,320 bytes) or full-integer INT8 (7,392 bytes; estimated arena 27,648 bytes); both scored 94.79% accuracy and 93.75% cry recall at threshold 0.7.
- **Pick:** INT8. The course didn't require the float32-vs-INT8 comparison; we ran it as our own extra step, to check that quantizing cost nothing on the test set before we committed to INT8.
- **Limitations:** the arena sizes are host-side estimates to confirm on the board, and on-device latency was not measured; the only latency figure in the project is the target of under 200 ms per window.

## What didn't work

**Converting the Conv1D model for the Arduino library.** A standard Conv1D export produced `EXPAND_DIMS` operations that the Arduino TensorFlowLite 2.4.0-ALPHA library does not support.
Finding the cause meant inspecting the generated TFLite graph and the list of supported operators.
We rebuilt the converter to write a Conv2D-equivalent graph with the same trained weights, so the model uses only supported ops.

**On-device validation stopped short.** No recordings from the Nano's own microphone were collected, so we have not measured how the public-dataset model transfers to that microphone.
The Arduino MFCC code was also never checked against the Python MFCC extraction on a known clip.

## Testing

- **Held-out evaluation:** float32 and INT8 models on the same 96-window test split, with a threshold sweep from 0.3 to 0.7.
- **Bench test plan:** wiring smoke test (`PinSmokeTest.ino`); driving the ESP32 alert pin by hand; subscribing from a BLE scanner app; and the `MUTE`, `UNMUTE`, `ACK` and `TEST` writes.
- **End-to-end demo:** cry audio played through a nearby speaker was detected by the Nano, which lit its LED and raised D2; the ESP32 sounded the buzzer and sent a BLE notification to a phone.

## Results

| Model | Accuracy | Cry recall | Cry precision | Cry F1 | Size |
|---|---:|---:|---:|---:|---:|
| Float32 TFLite (threshold 0.7) | 94.79% | 93.75% | 95.74% | 94.74% | 12,508 B |
| INT8 TFLite (threshold 0.7) | 94.79% | 93.75% | 95.74% | 94.74% | 7,392 B |

- On the 96 test windows the INT8 model found 45 of 48 cry windows and raised 2 false alarms out of 48 non-cry windows.
- Training stopped after 12 epochs at 97.5% training accuracy and 89.6% validation accuracy; the gap points to some overfitting.
- These numbers come from public-dataset clips, not from audio recorded on the Nano.

## What I'd do differently

Next steps already listed in the project:

- record cry and non-cry audio on the Nano's own microphone and evaluate on it;
- check the Arduino MFCC output against the Python extraction on a known clip;
- send the cry score, threshold and latency to the ESP32 over UART;
- add hard negatives (TV, speech, music, dog barks, room noise) if false alarms are high;
- train on the full datasets rather than the bounded 80 + 80 clip subset.

My own additions:

- pick the operating threshold on the validation split, not the test split, so the reported test numbers stay unbiased (Decision 1);
- measure inference latency on the device, not only against the 200 ms target.

## Credits & acknowledgements

- Joint project with Jonathan Lu.
- Built for EE/CSE 474 at UW (Spring 2026).
- Datasets: the Donate-a-Cry corpus and ESC-50.
- Libraries: Arduino TensorFlowLite 2.4.0-ALPHA and CMSIS-DSP.
