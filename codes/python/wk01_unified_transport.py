"""
Wk01 - One equation, three physics:
    d(phi)/dt = delta * d2(phi)/dx2,  phi(0,t)=1, phi(inf,t)=0
The SAME solver is called three times with delta = nu, alpha, D.
FDM result is compared to the analytic solution
    phi = erfc( x / (2*sqrt(delta*t)) ).

Run:    python wk01_unified_transport.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt
from math import erfc

# --- one generic diffusion solver (explicit FDM) -------------
def solve_diffusion(delta, L=1.0, N=201, t_end=0.005):
    x = np.linspace(0.0, L, N); dx = x[1] - x[0]
    dt = 0.4 * dx * dx / delta
    nstep = int(t_end / dt) + 1
    dt = t_end / nstep
    phi = np.zeros(N); phi[0] = 1.0
    c = delta * dt / dx**2
    for _ in range(nstep):
        phi[1:-1] += c * (phi[2:] - 2 * phi[1:-1] + phi[:-2])
        phi[0], phi[-1] = 1.0, 0.0
    return x, phi

# --- water at 25 C: three very different diffusivities -------
water = {"momentum (nu)": 8.9e-7,
         "heat (alpha)":  1.43e-7,
         "mass (D)":      2.0e-9}
t_end = 20.0  # seconds
colors = {"momentum (nu)": "tab:blue",
          "heat (alpha)":  "tab:red",
          "mass (D)":      "tab:green"}

plt.figure(figsize=(8, 5))
for name, delta in water.items():
    x, phi = solve_diffusion(delta, L=0.02, N=201, t_end=t_end)
    plt.plot(x * 1000, phi, "-", color=colors[name], lw=2,
             label=f"{name}: FDM")
    ana = np.array([erfc(xi / (2 * np.sqrt(delta * t_end))) for xi in x])
    plt.plot(x * 1000, ana, "--", color=colors[name], lw=1.2,
             label=f"{name}: analytic erfc")

Pr = water["momentum (nu)"] / water["heat (alpha)"]
Sc = water["momentum (nu)"] / water["mass (D)"]
plt.title(f"Water, t = {t_end:.0f} s  (Pr = {Pr:.1f}, Sc = {Sc:.0f})"
          "\nSame equation & same solver - only delta differs")
plt.xlabel("distance from wall x [mm]")
plt.ylabel("phi (v*, T*, C*)")
plt.legend(fontsize=8); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
