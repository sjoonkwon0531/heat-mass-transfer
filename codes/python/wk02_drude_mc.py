"""
Wk02 - Drude model Monte-Carlo (1D)
Electrons accelerate in a field (a = qE/m) and scatter with
probability dt/tau per step (velocity re-randomized).
The ensemble-average velocity converges to v_d = a*tau,
reproducing sigma = n q^2 tau / m.

Run:    python wk02_drude_mc.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(2)
NE, NSTEP, DT = 5000, 3000, 0.01
TAU, A, U0 = 1.0, 0.5, 3.0     # mean free time, accel qE/m, thermal speed

v = U0 * rng.standard_normal(NE)      # random thermal start
vd_hist = np.zeros(NSTEP)
for n in range(NSTEP):
    scatter = rng.random(NE) < DT / TAU
    v[scatter] = U0 * rng.standard_normal(scatter.sum())  # thermalize
    v[~scatter] += A * DT                                  # field drift
    vd_hist[n] = v.mean()

t = np.arange(NSTEP) * DT
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2))
ax1.plot(t, vd_hist, lw=1, label="<v> (simulation)")
ax1.axhline(A * TAU, color="r", ls="--", lw=2,
            label="Drude: v_d = a*tau")
ax1.set_xlabel("time"); ax1.set_ylabel("mean velocity")
ax1.set_title("Drift velocity emerges from chaos")
ax1.legend()

ax2.hist(v, bins=60, density=True, alpha=0.7)
ax2.axvline(A * TAU, color="r", ls="--", lw=2)
ax2.set_xlabel("v"); ax2.set_ylabel("P(v)")
ax2.set_title("Velocity distribution (shifted Maxwellian)")
plt.tight_layout(); plt.show()

print(f"simulated v_d = {vd_hist[NSTEP//2:].mean():.4f}")
print(f"Drude    v_d = {A*TAU:.4f}   (sigma = n q^2 tau / m)")
