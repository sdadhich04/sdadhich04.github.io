---
title: "Real-time EMG cursor BCI with a feedback-lag sweep"
slug: emg-bci
pathway: "Neural engineering / BCI"
context: Course · lab group of 3
status: Completed
role: "Wrote the MATLAB code for the EMG streaming, Kalman-filter closed-loop cursor and feedback-lag sweep, and did the lag-sweep analysis, in a lab group of three"
result: "Live two-channel EMG drove a Kalman-filter cursor in a center-out task at feedback lags of 0, 100, 300 and 500 ms plus a position-control condition; successful reaches fell from 10–16 of 19 at 0–100 ms to 2–4 of 19 at 300–500 ms"
stack: [MATLAB, Lab Streaming Layer, EMG, Kalman filter, Closed-loop control, Center-out task]
key_numbers:
  - label: "EMG channels"
    value: "2"
  - label: "Loop period, measured (100 ms nominal)"
    value: "≈120 ms"
  - label: "Feedback lags, nominal → measured"
    value: "100 / 300 / 500 → ≈125 / 360 / 590 ms"
  - label: "Successful reaches of 19, by added lag (0 / 100 / 300 / 500 ms)"
    value: "10 / 16 / 2 / 4"
  - label: "Kalman filter states"
    value: "3 (position, velocity, offset)"
links: []
layout: layouts/project.njk
permalink: /projects/emg-bci/
tags: [project]
mainVisual: emg-bci-loop
plotVisual: emg-bci-lag-sweep
cardVisual: emg-bci-lag-sweep
order: 5
---

## Summary

I built a real-time EMG cursor interface in MATLAB for EE 466 (Winter 2026): EMG streaming, a Kalman-filter closed-loop cursor, and a feedback-lag sweep.
The code reads two EMG channels from a Lab Streaming Layer (LSL) stream, reduces each 100 ms chunk to mean absolute EMG per channel, and uses a Kalman filter to turn it into a one-dimensional cursor in a center-out reaching task.
The lag-sweep version delays the displayed cursor by a set number of loop iterations, and the task was recorded at 0, 100, 300 and 500 ms of lag, plus a position-control condition.

> Built for EE 466 (Winter 2026) at UW in a three-person lab group with Jonathan and Olivia, following the course protocol and script outlines by A. L. Orsborn. The code here and the lag-sweep analysis are my own.

## The problem

In a closed-loop interface the user steers with what they see, so any delay between muscle activity and the on-screen cursor feeds straight back into control.
The experiment asks two things: how performance changes as feedback lag grows, and whether EMG is easier to use for controlling cursor velocity or cursor position.

## Approach

- **Streaming first:** scripts that stream and plot both EMG channels, so the signal and the loop timing can be checked before closing the loop.
- **Baseline scaling:** a 10-second baseline sets a per-channel offset and scale, so that strong contractions map to roughly the same range on both channels.
- **Decoder:** a Kalman filter with three states (position, velocity, offset), where one channel pushes velocity in the positive direction and the other in the negative direction.
- **Task:** two targets at ±6 display units, 0.5 s holds at the center and the target, a 5 s limit to reach, and 20 trials per run with the two targets balanced.
- **Lag sweep:** the displayed cursor is the decoder's estimate from `LAG_LENGTH` iterations earlier, where `LAG_LENGTH = round(LAG_T / DELTA_T)`.
- **Logging:** each run saves its full workspace, including task events and per-loop timing, to a time-stamped `.mat` file.
- **What was mine:** the decoder parameters, lag values and trial counts came from the course protocol, and our lab group of three ran the sessions, with me as the test subject. I wrote the code in this repo (streaming, Kalman filter, task loop and lag buffer, filling in the course outline scripts) and did the lag-sweep analysis below.

## Architecture / signal chain

1. **EMG electrodes and amplifier** → two-channel LSL stream.
2. **MATLAB loop, every 100 ms:** pull the latest chunk → mean absolute value per channel → subtract offset, multiply by scale.
3. **Kalman filter:** predict with a state model in which velocity decays by a factor of 0.9 each step and position integrates velocity; update with the two scaled EMG values (measurement noise 0.2 per channel).
4. **Lag buffer:** cursor position = estimate from `LAG_LENGTH` loops ago (0, 1, 3 or 5 loops).
5. **Task state machine and display:** center hold → go → reach → target hold → inter-trial interval; success or error codes are logged as task events.
6. **Output:** one `.mat` file per run.

## Decisions & trade-offs

Most of the setup (bin width, decoder matrices, lag values and trial counts) followed the course protocol, so I describe it above as the setup rather than as my choices. The two decisions below are in the analysis.

### 1. How a successful reach is scored

- **Criteria:** the score should show whether the user can actually land on the target and stay there, and keep instability before the reach starts from being folded into reach failures.
- **Options:** count each trial by its end state alone, or split the outcomes into successful reaches, target-hold failures, reach timeouts and failed center holds.
- **Pick:** a reach counts only if the cursor reaches the target and holds there for 0.5 s within the 5 s limit. Failed center holds are counted separately, because they show instability before the reach starts.
- **Limitations:** each condition is one run with 19 scored reaches, so a small difference such as 0 vs 100 ms can't be separated from practice or run-to-run variation.

### 2. Report the measured lag, not the nominal lag

- **Criteria:** the lag on the x-axis should be the delay I actually experienced as the user, not the value typed into the script.
- **Options:** report the nominal 100, 300 and 500 ms, or compute the real added lag from the saved per-loop times.
- **Pick:** the measured lag. Lag is set in whole 100 ms loops (100, 300 and 500 ms are 1, 3 and 5 iterations), so the real lag is the number of iterations times the real loop period. The saved per-loop times have a median of 116–125 ms, so the real added lags were about 125, 360 and 590 ms.
- **Limitations:** the measured values use each run's median loop period, so they hide loop-to-loop variation, and any loop overrun stretches the lag further.

## What didn't work

- **Baseline scaling runs on every loop.** The check that should compute the offset and scale once reads `if i %%FILLIN (some equality)`; in MATLAB the `%%` starts a comment, so the condition is just `if i`, which is always true, and the scaling is recomputed on every iteration. What that changed: the cursor only starts after the 10-second baseline window, and from then on the recomputation reads the same stored baseline samples, so the offset and scale stayed constant during every task. The real effect is on the calibration itself: during the baseline window each new sample was scaled with an in-progress estimate, so the final offset and scale came from already-scaled EMG rather than raw EMG as intended. Every lag condition ran the same code, so the bug doesn't explain the drop at higher lag, though it may have changed how sensitive the cursor felt overall. The copy in the repo is not fixed yet.
- **The normalized streaming script was left unfinished;** it still has template `FILLIN` markers. It's a separate warm-up script, not the one that recorded the lag-sweep runs.

## Testing

- **Signal check:** streaming scripts plot both raw EMG channels live before any closed-loop run.
- **Recorded runs:** all conditions were recorded on 3 March 2026 within about 45 minutes, with me as the test subject, in the order 0 ms (the experiment-2 run, reused as the zero-lag condition), 100 ms, 500 ms, 300 ms, then position control.
- **Completed trials:** each of the four lag runs reached its 20 planned trials, with 19 scored reaches per run.

## Results

- The closed loop ran live at four feedback lags and in a position-control condition, with every run saved.
- Successful reaches fell from 10 and 16 of 19 at 0 and 100 ms added lag to 2 and 4 of 19 at 300 and 500 ms, and failed center holds rose from 4–5 to 49–78. With one run per condition, the 0 vs 100 ms gap may be practice; the drop from 300 ms upward is the effect.
- The loop ran at about 120 ms rather than the nominal 100 ms, so the real added lags were about 125, 360 and 590 ms.

## What I'd do differently

- Counterbalance or repeat the lag order. The conditions ran once each, in one session, in the order 0, 100, 500, 300 ms, so lag can't be separated from learning and fatigue.
- Record the 0 ms condition in the same block as the others, rather than reusing the experiment-2 run.
- Commit the analysis script with the data, so the results can be reproduced from the repo.

## Credits & acknowledgements

Built for EE 466 (Winter 2026) at UW in a three-person lab group with Jonathan and Olivia, following the course protocol and script outlines by A. L. Orsborn. The code here and the lag-sweep analysis are my own.

- Lab group: Jonathan and Olivia, who ran the recording sessions with me; I was the test subject.
- Lab Streaming Layer (LSL) MATLAB bindings.
