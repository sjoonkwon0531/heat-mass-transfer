"""
Wk01 - 1D random walk: microscopic randomness -> macroscopic diffusion
N particles hop +/-1 each step. The histogram converges to a Gaussian
with sigma = ell*sqrt(n), i.e. <x^2> = 2Dt with D = ell^2/(2 dt).

Run:    python wk01_random_walk.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(1)
NP, NSTEP, ELL = 20000, 400, 1.0

pos = np.zeros(NP)
msd = np.zeros(NSTEP + 1)
for n in range(1, NSTEP + 1):
    pos += ELL * rng.choice([-1.0, 1.0], size=NP)
    msd[n] = np.mean(pos**2)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2))

# --- histogram vs Gaussian ----------------------------------
sigma = ELL * np.sqrt(NSTEP)
xg = np.linspace(-4 * sigma, 4 * sigma, 400)
gauss = np.exp(-xg**2 / (2 * sigma**2)) / (sigma * np.sqrt(2 * np.pi))
ax1.hist(pos, bins=60, density=True, alpha=0.6, label="walkers")
ax1.plot(xg, gauss, "r-", lw=2, label="Gaussian, sigma = ell*sqrt(n)")
ax1.set_xlabel("x"); ax1.set_ylabel("P(x)")
ax1.set_title(f"{NP} walkers after {NSTEP} steps")
ax1.legend()

# --- MSD ~ t (the fingerprint of diffusion) -----------------
t = np.arange(NSTEP + 1)
ax2.plot(t, msd, "b-", lw=2, label="<x^2> (simulated)")
ax2.plot(t, ELL**2 * t, "r--", lw=2, label="theory: n*ell^2 = 2Dt")
ax2.set_xlabel("step n (time)"); ax2.set_ylabel("<x^2>")
ax2.set_title("Mean-square displacement grows linearly in t")
ax2.legend()
plt.tight_layout(); plt.show()
