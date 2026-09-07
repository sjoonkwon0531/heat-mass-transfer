"""
Wk02 - Phonon dispersion of a 1D diatomic chain (m1, m2, spring C)
    omega^2 = C(1/m1 + 1/m2) +/- C*sqrt((1/m1+1/m2)^2
                                        - 4 sin^2(ka)/(m1 m2))
Acoustic & optical branches; a band gap opens when m1 != m2.

Run:    python wk02_phonon_dispersion.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

C = 1.0
m1 = 1.0
ratios = [1.0, 2.0, 4.0]          # m2 / m1
ka = np.linspace(-np.pi / 2, np.pi / 2, 400)

fig, axes = plt.subplots(1, len(ratios), figsize=(11, 3.8), sharey=True)
for ax, r in zip(axes, ratios):
    m2 = r * m1
    s = 1 / m1 + 1 / m2
    root = np.sqrt(s**2 - 4 * np.sin(ka)**2 / (m1 * m2))
    w_ac = np.sqrt(C * (s - root))
    w_op = np.sqrt(C * (s + root))
    ax.plot(ka, w_ac, "b-", lw=2, label="acoustic")
    ax.plot(ka, w_op, "r-", lw=2, label="optical")
    ax.set_title(f"m2/m1 = {r:.0f}")
    ax.set_xlabel("ka")
    gap = np.sqrt(2 * C / min(m1, m2)) - np.sqrt(2 * C / max(m1, m2))
    ax.text(0, np.sqrt(2 * C / m1) * 1.02, f"gap = {gap:.2f}",
            ha="center", fontsize=9)
axes[0].set_ylabel("omega")
axes[0].legend()
plt.suptitle("Diatomic chain: heavier contrast -> wider phonon gap")
plt.tight_layout(); plt.show()
