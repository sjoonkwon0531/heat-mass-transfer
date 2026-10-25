# Week 9 - Topic 4: Species Balance, Interface Boundary Conditions and a CVD Film
# Lecture (Part 2):
#   * species continuity:  dc_A/dt + v . grad c_A = D_AB lap c_A + R_A
#   * interface BCs: Raoult p_A = x_A p_A*(T) (solvent, x_A -> 1); Henry p_A = x_A H_A(T) (solute, x_A -> 0);
#                    gas-solid c_A = S_A p_A;  impermeable dc_A/dz = 0;  convective N_A = k_c (c_As - c_Ainf);
#                    reacting surface N_A = -k c_As (A + 2B -> 3C)
#   * W CVD:  3 H2(g) + WF6(g) -> W(s) + 6 HF(g)   (A = WF6, B = H2, C = HF, inert D = He)
#       N_B = 3 N_A,  N_C = -6 N_A,  N_D = 0  ->  N_A (1 + 2 y_A) = -c D_AM dy_A/dz
#       integrating from z = 0 (y_A0) to the film z = delta (y_Ad):
#       N_A = (c D_AM / (2 delta)) ln[(1 + 2 y_A0)/(1 + 2 y_Ad)]
#       with a first-order surface reaction N_A = k_s c y_Ad (finite rate).
# Numbers in the CVD part are illustrative.

import math

# Henry's constants from the lecture table (bar), aqueous solutions
H_T = [273, 280, 290, 300, 310, 320]
H_TAB = {
    "CO2": [710, 960, 1300, 1730, 2175, 2650],
    "O2":  [25500, 30500, 37600, 45700, 52500, 56800],
    "N2":  None,
    "H2":  [58000, 61500, 66500, 71600, 76000, 78600],
    "CH4": [22800, 27800, 35200, 42800, 50000, 56300],
}


def henry(gas, T):
    tab = H_TAB[gas]
    for k in range(len(H_T) - 1):
        if H_T[k] <= T <= H_T[k + 1]:
            f = (T - H_T[k]) / (H_T[k + 1] - H_T[k])
            return tab[k] + f * (tab[k + 1] - tab[k])
    raise ValueError("T outside table")


def cvd_flux_analytic(c, D, delta, y0, yd):
    return c * D / (2 * delta) * math.log((1 + 2 * y0) / (1 + 2 * yd))


def cvd_profile(z, delta, y0, yd):
    s = z / delta
    return 0.5 * ((1 + 2 * y0) ** (1 - s) * (1 + 2 * yd) ** s - 1)


def cvd_flux_fdm(c, D, delta, y0, yd, n=200, iters=200):
    """Solve d/dz[ c D/(1+2y) dy/dz ] = 0 by finite differences (Picard iteration)."""
    y = [y0 + (yd - y0) * i / n for i in range(n + 1)]
    for _ in range(iters):
        kf = [1.0 / (1 + 2 * 0.5 * (y[i] + y[i + 1])) for i in range(n)]   # face coefficients
        # tridiagonal: kf[i-1](y[i-1]-y[i]) + kf[i](y[i+1]-y[i]) = 0
        a = [0.0] * (n + 1); b = [1.0] * (n + 1); cc = [0.0] * (n + 1); d = [0.0] * (n + 1)
        d[0], d[n] = y0, yd
        for i in range(1, n):
            a[i], cc[i], b[i] = kf[i - 1], kf[i], -(kf[i - 1] + kf[i])
        for i in range(1, n + 1):               # Thomas algorithm
            m = a[i] / b[i - 1]
            b[i] -= m * cc[i - 1]
            d[i] -= m * d[i - 1]
        y[n] = d[n] / b[n]
        for i in range(n - 1, -1, -1):
            y[i] = (d[i] - cc[i] * y[i + 1]) / b[i]
    h = delta / n
    return -c * D * (y[1] - y[0]) / h / (1 + 2 * 0.5 * (y[0] + y[1])), y


def cvd_finite_rate(c, D, delta, y0, ks):
    """Find y_Ad such that diffusion flux = surface reaction k_s c y_Ad (bisection)."""
    lo, hi = 0.0, y0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if cvd_flux_analytic(c, D, delta, y0, mid) - ks * c * mid > 0:
            lo = mid
        else:
            hi = mid
    yd = 0.5 * (lo + hi)
    return yd, ks * c * yd


if __name__ == "__main__":
    # --- Henry's law: dissolved O2 and CO2 in water in contact with air ---
    T = 298.0
    for gas, p in (("O2", 0.21), ("CO2", 4.2e-4)):
        H = henry(gas, T)
        x = p / H
        c_mol_m3 = x * 55.4e3                  # water: ~55.4 kmol/m^3
        M = 32.0 if gas == "O2" else 44.0
        print(f"{gas}: H({T:.0f} K) = {H:.0f} bar, p = {p} bar -> x = {x:.3e}, "
              f"c = {c_mol_m3:.3f} mol/m^3 = {c_mol_m3*M:.2f} mg/L")

    # --- W CVD film (illustrative conditions) ---
    P, Tg = 101325.0, 700.0
    c = P / (8.314462618 * Tg)
    D, delta, y0 = 1.0e-4, 1.0e-3, 0.10
    Na = cvd_flux_analytic(c, D, delta, y0, 0.0)
    Nf = c * D * y0 / delta
    Nn, prof = cvd_flux_fdm(c, D, delta, y0, 0.0)
    print(f"\nW CVD: c = {c:.3f} mol/m^3, D = {D} m^2/s, delta = {delta*1e3} mm, y_A0 = {y0}")
    print(f"  diffusion-limited flux (analytic) N_A = {Na:.5e} mol/m^2 s")
    print(f"  finite-difference solution         N_A = {Nn:.5e} mol/m^2 s")
    print(f"  pure Fick (no bulk flow)           N_A = {Nf:.5e} mol/m^2 s  -> bulk-flow factor {Na/Nf:.4f}")
    mid = cvd_profile(0.5 * delta, delta, y0, 0.0)
    print(f"  y_A at mid-film: analytic {mid:.5f}, FDM {prof[len(prof)//2]:.5f}, linear {y0/2:.5f}")
    W_rate = Na * 183.84e-3 / 19.25e3 * 1e9 * 60     # W: M = 183.84 g/mol, rho = 19.25 g/cm^3 -> nm/min
    print(f"  diffusion-limited ceiling on growth = {W_rate/1e3:.1f} um/min (W: 183.84 g/mol, 19.25 g/cm^3)")
    print("  (real W CVD runs far below this ceiling, in the surface-reaction-limited regime Da << 1,")
    print("   because there the rate no longer depends on delta, which makes the film uniform)")
    print("\n  Damkohler scan Da = k_s delta / D:")
    for Da in (0.1, 1.0, 10.0, 100.0):
        ks = Da * D / delta
        yd, N = cvd_finite_rate(c, D, delta, y0, ks)
        print(f"   Da = {Da:6.1f}: y_A(surface) = {yd:.4f}, N_A = {N:.4e}  ({N/Na*100:5.1f}% of diffusion limit)")
