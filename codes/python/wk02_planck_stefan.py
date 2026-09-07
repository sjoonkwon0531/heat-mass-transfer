"""
Wk02 - Blackbody radiation: Planck spectrum -> Stefan-Boltzmann
Numerically integrates the Planck spectral exitance over
wavelength and compares to sigma*T^4; marks the Wien peak.

Run:    python wk02_planck_stefan.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

h = 6.626e-34; c = 2.998e8; kB = 1.381e-23
SIGMA = 5.670e-8

def planck_lam(lam, T):     # spectral exitance [W/m^2/m]
    x = h * c / (lam * kB * T)
    return 2 * np.pi * h * c**2 / lam**5 / np.expm1(x)

lam = np.logspace(-7.3, -4.3, 2000)    # 50 nm .. 50 um
plt.figure(figsize=(8, 5))
for T in [2000, 3000, 4000, 5000, 5778]:
    B = planck_lam(lam, T)
    P_num = np.trapz(B, lam)
    P_sb = SIGMA * T**4
    lam_max = 2.898e-3 / T
    plt.plot(lam * 1e6, B / 1e12, lw=2,
             label=f"T={T} K (num/SB = {P_num/P_sb:.3f})")
    plt.axvline(lam_max * 1e6, color="gray", ls=":", lw=0.8)
    print(f"T={T:5d} K: trapz = {P_num:.3e}, sigma*T^4 = {P_sb:.3e}, "
          f"ratio = {P_num/P_sb:.4f}, Wien peak = {lam_max*1e6:.2f} um")

plt.axvspan(0.38, 0.75, alpha=0.15, color="yellow", label="visible")
plt.xscale("log")
plt.xlabel("wavelength [um]"); plt.ylabel("exitance [MW/m^2/um]")
plt.title("Planck spectra: area = sigma*T^4 (Stefan-Boltzmann)")
plt.legend(fontsize=8); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
