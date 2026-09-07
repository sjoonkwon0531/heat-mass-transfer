"""
Wk02 - Wiedemann-Franz law check with real metal data (293 K)
    kappa / (sigma * T) = L  (Lorenz number, 2.44e-8 V^2/K^2)
Free electrons carry BOTH charge and heat -> the two
conductivities are locked together.

Run:    python wk02_wiedemann_franz.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

T = 293.0
L0 = 2.44e-8
# metal: (sigma [S/m], kappa [W/m K])
metals = {
    "Ag": (6.30e7, 429), "Cu": (5.96e7, 401), "Au": (4.52e7, 317),
    "Al": (3.77e7, 237), "W":  (1.79e7, 173), "Zn": (1.69e7, 116),
    "Ni": (1.43e7,  91), "Fe": (1.00e7,  80), "Pt": (0.94e7,  72),
    "Pb": (0.455e7, 35),
}

print(f"{'Metal':<6}{'sigma':>10}{'kappa':>8}{'L=k/(sT)':>12}{'L/L0':>7}")
xs, ys = [], []
for name, (s, k) in metals.items():
    Lm = k / (s * T)
    xs.append(s * T * L0); ys.append(k)
    print(f"{name:<6}{s:10.2e}{k:8.0f}{Lm:12.3e}{Lm/L0:7.2f}")

plt.figure(figsize=(6.4, 5))
plt.scatter(xs, ys, s=60, zorder=3)
lim = [0, max(ys) * 1.15]
plt.plot(lim, lim, "r--", lw=2, label="kappa = L0 * sigma * T")
for name, (s, k) in metals.items():
    plt.annotate(name, (s * T * L0, k), textcoords="offset points",
                 xytext=(6, 4), fontsize=9)
plt.xlabel("L0 * sigma * T  [W/m K]")
plt.ylabel("measured kappa [W/m K]")
plt.title("Wiedemann-Franz: one carrier, two currents")
plt.legend(); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
