"""
Week 14 · Topic 3 — Simultaneous heat and mass transfer: a water droplet evaporating in N2
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  Pseudo-steady, spherically symmetric, stagnant N2 (lecture, Pe -> 0):
      N_W(R) = (C D / R) ln[(1 - x_W,inf)/(1 - x_W(R))]                (mass)
      N_W(R) = (k_G / (c_pW R)) ln[1 + c_pW (T_inf - T(R)) / lambda]     (energy)
  Eliminating N_W:   (1 - x_W,inf)/(1 - x_W(R)) = [1 + c_pW (T_inf - T(R))/lambda]^(a*),  a* = k_G/(C c_pW D)
  with x_W(R) = p_sat(T(R))/P.  Lifetime from dR/dt = -N_W(R)/C_L  (the d^2 law):
      t_life = C_L R0^2 / (2 C D ln[(1 - x_W,inf)/(1 - x_W(R))])
  Property values are illustrative (N2 near room temperature, 1 atm).
"""
import math

P, RG = 101325.0, 8.314
kG, D, cpW, lam = 0.026, 2.6e-5, 34.0, 44000.0   # W/mK, m2/s, J/mol K (vapor), J/mol
CL = 55500.0                                       # mol/m3, liquid water
C = P / (RG * 298.15)                              # mol/m3, gas


def psat(Tc):
    """Buck (1981) fit, Pa, T in deg C."""
    return 611.21 * math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)))


def surface_state(Tinf, xinf):
    a = kG / (C * cpW * D)

    def f(TR):
        xR = psat(TR) / P
        return math.log((1 - xinf) / (1 - xR)) - a * math.log(1 + cpW * (Tinf - TR) / lam)
    lo, hi = -40.0, min(Tinf, 99.9)
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if f(lo) * f(mid) <= 0:
            hi = mid
        else:
            lo = mid
    TR = 0.5 * (lo + hi)
    return TR, psat(TR) / P, a


def main():
    print("Topic 3 — water droplet evaporating in N2 (pseudo-steady, stagnant gas)\n")
    print(f"   k_G = {kG}, D = {D:.1e}, c_pW = {cpW}, lambda = {lam:.0f} J/mol, C = {C:.2f} mol/m3")
    print(f"   a* = k_G/(C c_pW D) = {kG / (C * cpW * D):.3f}\n")
    print("[1] Surface temperature and vapor fraction (dry N2, x_W,inf = 0)")
    print("   T_inf (C)   T(R) (C)   x_W(R)     lifetime of a 100 um droplet (s)")
    for Tinf in (25, 50, 100, 150, 200):
        TR, xR, a = surface_state(Tinf, 0.0)
        tl = CL * (50e-6) ** 2 / (2 * C * D * math.log(1 / (1 - xR)))
        print(f"   {Tinf:7.0f}    {TR:8.2f}   {xR:.5f}    {tl:8.2f}")
    print()
    print("[2] Humid gas at 25 C: the surface warms toward T_inf as x_W,inf rises")
    for xinf in (0.0, 0.01, 0.02, 0.03):
        TR, xR, a = surface_state(25.0, xinf)
        print(f"   x_W,inf = {xinf:.2f}   T(R) = {TR:6.2f} C   x_W(R) = {xR:.5f}")
    print()
    print("[3] d^2 law: t_life ∝ R0^2 (dry N2, 25 C)")
    TR, xR, a = surface_state(25.0, 0.0)
    for d_um in (10, 50, 100, 500):
        R0 = d_um * 0.5e-6
        print(f"   d0 = {d_um:4d} um   t_life = {CL * R0 ** 2 / (2 * C * D * math.log(1 / (1 - xR))):10.3f} s")


if __name__ == "__main__":
    main()
