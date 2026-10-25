# Week 9 - Topic 2: Liquid, Pore (Knudsen) and Solid Diffusivity
# Lecture (Part 1):
#   * Stokes-Einstein (large solute A in solvent B):  D_AB = kB T / (6 pi r mu_B)
#   * Wilke-Chang (D in cm^2/s, mu_B in cP, V_A in cm^3/mol at normal boiling point):
#       D_AB mu_B / T = 7.4e-8 (Phi_B M_B)^(1/2) / V_A^0.6
#   * Knudsen diffusivity (d_pore in cm, M in g/mol):  D_KA = (d/3) sqrt(8 R T/(pi M)) = 4850 d sqrt(T/M)
#     -> D_KA ~ T^(1/2), independent of pressure
#   * transition regime (series resistances):  1/D_Ae = (1 - alpha y_A)/D_AB + 1/D_KA,  alpha = 1 + N_B/N_A
#   * random porous solid:  D'_Ae = eps^2 D_Ae
#   * solids (activated hopping):  D = D0 exp(-Q / (R T))

import math

KB = 1.380649e-23
R = 8.314462618

# Arrhenius data from the lecture table (D0 in mm^2/s, Q in kJ/mol)
SOLID = {
    "Au self (fcc)":     (10.7, 176.9),
    "Cu self (fcc)":     (31.0, 200.3),
    "Ni self (fcc)":     (190.0, 279.7),
    "Fe(gamma) self":    (49.0, 284.1),
    "Fe(alpha) self":    (200.0, 239.7),
    "C in Fe (bcc)":     (2.0, 84.1),
    "N in Fe (bcc)":     (0.3, 76.1),
    "H in Fe (bcc)":     (0.1, 13.4),
    "C in Fe (fcc)":     (2.5, 144.2),
}


def stokes_einstein(T, r_m, mu_Pa_s):
    return KB * T / (6 * math.pi * r_m * mu_Pa_s)            # m^2/s


def wilke_chang(T, mu_cP, M_B, V_A, phi):
    return 7.4e-8 * math.sqrt(phi * M_B) * T / (mu_cP * V_A ** 0.6)   # cm^2/s


def knudsen(d_cm, T, M):
    return 4850.0 * d_cm * math.sqrt(T / M)                  # cm^2/s


def knudsen_exact(d_cm, T, M):
    u = math.sqrt(8 * R * T / (math.pi * M * 1e-3)) * 100.0  # cm/s
    return d_cm * u / 3.0


def effective(D_AB, D_K, alpha=0.0, yA=0.0):
    return 1.0 / ((1 - alpha * yA) / D_AB + 1.0 / D_K)


def arrhenius(D0_mm2, Q_kJ, T):
    return D0_mm2 * 1e-6 * math.exp(-Q_kJ * 1e3 / (R * T))  # m^2/s


if __name__ == "__main__":
    # --- liquids ---
    T, mu = 298.15, 0.890     # water, cP
    D_wc = wilke_chang(T, mu, 18.02, 25.6, 2.26)
    print(f"Wilke-Chang, O2 in water at 25 C: D = {D_wc:.3e} cm^2/s")
    for name, VA in [("N2", 31.2), ("CO2", 34.0), ("NH3", 25.8)]:
        print(f"   {name:>4} in water: {wilke_chang(T, mu, 18.02, VA, 2.26):.3e} cm^2/s")
    r = 5e-9   # 10 nm diameter particle
    D_se = stokes_einstein(T, r, mu * 1e-3)
    print(f"Stokes-Einstein, 10 nm particle in water: D = {D_se:.3e} m^2/s = {D_se*1e4:.3e} cm^2/s")

    # --- Knudsen vs molecular ---
    T, M, D_AB = 300.0, 28.0, 0.20
    print("\nN2 at 300 K: pore diameter scan (D_AB = 0.20 cm^2/s, equimolar counter-diffusion)")
    print("  d (nm)    D_K (cm^2/s)   D_Ae (cm^2/s)  regime")
    for d_nm in (1, 10, 50, 100, 1000, 10000):
        d = d_nm * 1e-7
        DK = knudsen(d, T, M)
        De = effective(D_AB, DK)
        reg = "Knudsen" if DK < 0.1 * D_AB else ("molecular" if DK > 10 * D_AB else "transition")
        print(f"  {d_nm:7.0f}   {DK:12.4e}   {De:12.4e}   {reg}")
    d = 1e-6
    print(f"  check 4850 d sqrt(T/M) = {knudsen(d,T,M):.5f} vs (d/3) u = {knudsen_exact(d,T,M):.5f} cm^2/s")
    print(f"  porosity 0.4 -> D'_Ae = eps^2 D_Ae = {0.16 * effective(D_AB, knudsen(1e-5, T, M)):.4e} (d = 100 nm)")

    # --- solids ---
    print("\nSolid-state diffusivity, D = D0 exp(-Q/RT):")
    for name, (D0, Q) in SOLID.items():
        D1 = arrhenius(D0, Q, 1000.0)
        L = math.sqrt(D1 * 3600.0) * 1e6
        print(f"  {name:<16} D(1000 K) = {D1:.3e} m^2/s, sqrt(D t) for 1 h = {L:9.3f} um")
    D0, Q = SOLID["C in Fe (bcc)"]
    T1, T2 = 800.0, 1000.0
    slope = -(math.log(arrhenius(D0, Q, T2)) - math.log(arrhenius(D0, Q, T1))) / (1 / T2 - 1 / T1) * R / 1e3
    print(f"  Arrhenius slope recovers Q = {slope:.1f} kJ/mol (C in bcc Fe)")
