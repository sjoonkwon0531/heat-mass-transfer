"""
Wk01 - Conduction vs convection vs radiation
Sweeps the hot-surface temperature and shows the T^4 takeover
of radiation at high temperature.

Run:    python wk01_heat_modes.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

SIGMA = 5.670e-8      # Stefan-Boltzmann [W/m^2 K^4]
T_inf = 25.0          # ambient [C]
k, L = 0.6, 0.02      # slab conduction [W/m K], [m]
h = 25.0              # convection coefficient [W/m^2 K]
eps = 0.85            # emissivity

Ts = np.linspace(30.0, 900.0, 400)          # hot surface [C]
dT = Ts - T_inf
q_cond = k * dT / L
q_conv = h * dT
q_rad = eps * SIGMA * ((Ts + 273.15)**4 - (T_inf + 273.15)**4)

plt.figure(figsize=(8, 5))
plt.plot(Ts, q_cond / 1e3, lw=2, label="conduction  q = k dT/L")
plt.plot(Ts, q_conv / 1e3, lw=2, label="convection  q = h dT")
plt.plot(Ts, q_rad / 1e3, lw=2, label="radiation    q = eps*sigma*(Ts^4-Tinf^4)")
xc = Ts[np.argmin(np.abs(q_rad - q_conv))]
plt.axvline(xc, color="gray", ls=":", lw=1)
plt.text(xc + 8, 2, f"radiation passes convection\n near {xc:.0f} C", fontsize=9)
plt.xlabel("hot-surface temperature Ts [C]")
plt.ylabel("heat flux q'' [kW/m^2]")
plt.title("Three modes of heat transfer: who dominates when?")
plt.legend(); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
