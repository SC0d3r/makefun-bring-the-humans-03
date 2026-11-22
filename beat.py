#!/usr/bin/env python3
"""Original 22.5 s beat for the make.fun ad: kick, hat, snare and bass, 48 kHz stereo.

Standard library only (wave, math, random, array). Nothing sampled or downloaded:
every sound is synthesised here from oscillators and white noise.
"""
import math
import random
import sys
import wave
from array import array

SR = 48000
DUR = 22.5
N = int(SR * DUR)
BPM = 128.0
BEAT = 60.0 / BPM
BARS = 12

random.seed(20261121)

left = [0.0] * N
right = [0.0] * N


def add(samples, start, gain=1.0, pan=0.0):
    i0 = int(start * SR)
    gl = gain * (1.0 - max(0.0, pan))
    gr = gain * (1.0 + min(0.0, pan))
    for k, v in enumerate(samples):
        j = i0 + k
        if 0 <= j < N:
            left[j] += v * gl
            right[j] += v * gr


def kick(dur=0.34, amp=1.0):
    n = int(dur * SR)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / SR
        f = 44.0 + 100.0 * math.exp(-t / 0.032)
        phase += 2.0 * math.pi * f / SR
        body = math.sin(phase) * math.exp(-t / 0.095)
        click = (random.random() * 2.0 - 1.0) * math.exp(-t / 0.004) * 0.22
        out.append(amp * (body + click))
    return out


def hat(dur=0.055, amp=1.0):
    n = int(dur * SR)
    out = []
    prev = 0.0
    for i in range(n):
        t = i / SR
        x = random.random() * 2.0 - 1.0
        y = x - prev
        prev = x
        out.append(amp * y * math.exp(-t / 0.011))
    return out


def snare(dur=0.19, amp=1.0):
    n = int(dur * SR)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / SR
        phase += 2.0 * math.pi * 186.0 / SR
        tone = math.sin(phase) * math.exp(-t / 0.065)
        noise = (random.random() * 2.0 - 1.0) * math.exp(-t / 0.045)
        out.append(amp * (0.55 * tone + 0.45 * noise))
    return out


def bass(freq, dur, amp=1.0):
    n = int(dur * SR)
    out = []
    phase = 0.0
    lp = 0.0
    for i in range(n):
        t = i / SR
        phase += 2.0 * math.pi * freq / SR
        raw = math.sin(phase) + 0.34 * math.sin(2.0 * phase) + 0.14 * math.sin(3.0 * phase)
        lp += 0.075 * (raw - lp)
        env = min(1.0, t / 0.012) * math.exp(-t / 0.34)
        out.append(amp * lp * env)
    return out


def impact(dur=0.8, amp=1.0):
    n = int(dur * SR)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / SR
        f = 28.0 + 78.0 * math.exp(-t / 0.20)
        phase += 2.0 * math.pi * f / SR
        body = math.sin(phase) * math.exp(-t / 0.30)
        thump = (random.random() * 2.0 - 1.0) * math.exp(-t / 0.035) * 0.5
        out.append(amp * (body + thump))
    return out


# Four-on-the-floor kick, snare on two and four, eighth-note hats.
for b in range(BARS * 4):
    t = b * BEAT
    add(kick(amp=0.95 if b % 4 == 0 else 0.78), t)
    if b % 4 in (1, 3):
        add(snare(amp=0.34), t)
    add(hat(amp=0.13), t, pan=-0.18 if b % 2 else 0.18)
    add(hat(amp=0.09), t + BEAT / 2.0, pan=0.22 if b % 2 else -0.22)

# A minor sub-bass line: A1 A1 C2 G1, resolving to A1 on the end card.
line = [55.00, 55.00, 65.41, 49.00]
for bar in range(BARS):
    notes = [55.00, 55.00, 65.41, 55.00] if bar == BARS - 1 else line
    for k, freq in enumerate(notes):
        add(bass(freq, BEAT * 0.94, amp=0.40), (bar * 4 + k) * BEAT)

# Scene-change impacts on the cuts.
for t, amp in ((0.0, 0.60), (5.0, 0.42), (10.0, 0.45), (15.0, 0.48), (20.0, 0.62)):
    add(impact(amp=amp), t)

# Soft top and tail.
for i in range(N):
    t = i / SR
    g = 1.0
    if t < 0.025:
        g *= t / 0.025
    if t > 21.70:
        g *= max(0.0, (DUR - t) / 0.80)
    left[i] *= g
    right[i] *= g

peak = max(max(abs(v) for v in left), max(abs(v) for v in right)) or 1.0
scale = 0.89 / peak
pcm = array("h")
for i in range(N):
    pcm.append(int(max(-1.0, min(1.0, left[i] * scale)) * 32767))
    pcm.append(int(max(-1.0, min(1.0, right[i] * scale)) * 32767))

out = sys.argv[1] if len(sys.argv) > 1 else "beat.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {out}: {DUR}s, {SR} Hz, stereo, {len(pcm) // 2} frames")
