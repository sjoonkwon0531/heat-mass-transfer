"""
Wk01 - Transport analogy: Newton / Fourier / Fick
All three diffusivities (nu, alpha, D) share units of m^2/s,
so their ratios form the dimensionless groups Pr, Sc, Le.

Run:    python wk01_flux_analogy.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

# name: (mu [Pa s], k [W/m K], D [m^2/s], rho [kg/m^3], cp [J/kg K])
MATERIALS = {
    "Air (25C)":   (1.8e-5, 0.026, 2.5e-5, 1.18, 1005.0),
    "Water (25C)": (8.9e-4, 0.61,  2.0e-9, 997.0, 4180.0),
    "Glycerin":    (0.95,   0.29,  1.0e-11, 1260.0, 2430.0),
    "Engine oil":  (0.80,   0.145, 1.0e-10, 888.0, 1880.0),
}

print(f"{'Material':<14}{'nu':>11}{'alpha':>11}{'D':>11}"
      f"{'Pr':>9}{'Sc':>11}{'Le':>9}")
rows = []
for name, (mu, k, D, rho, cp) in MATERIALS.items():
    nu = mu / rho
    alpha = k / (rho * cp)
    Pr, Sc, Le = nu / alpha, nu / D, alpha / D
    rows.append((name, nu, alpha, D))
    print(f"{name:<14}{nu:11.2e}{alpha:11.2e}{D:11.2e}"
          f"{Pr:9.2f}{Sc:11.1f}{Le:9.1f}")

# --- bar chart of the three diffusivities (log scale) --------
names = [r[0] for r in rows]
x = np.arange(len(names)); w = 0.26
fig, ax = plt.subplots(figsize=(8, 4.5))
ax.bar(x - w, [r[1] for r in rows], w, label=r"$\nu$ (momentum)")
ax.bar(x,     [r[2] for r in rows], w, label=r"$\alpha$ (heat)")
ax.bar(x + w, [r[3] for r in rows], w, label=r"$D$ (mass)")
ax.set_yscale("log"); ax.set_ylabel(r"diffusivity [m$^2$/s]")
ax.set_xticks(x); ax.set_xticklabels(names, rotation=10)
ax.set_title("One unit (m^2/s), three transports")
ax.legend(); ax.grid(alpha=0.3, axis="y")
plt.tight_layout(); plt.show()
