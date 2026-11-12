# Week 12 - Topic 2: Integral (von Karman-Pohlhausen) Analysis of the Concentration Boundary Layer
# Lecture (Part 1):
#   * molar balance on a control volume of height delta_c and length dx:
#       d/dx int_0^delta_c vx (cA_inf - cA) dy = kc (cAs - cA_inf)              (integral equation)
#   * ansatz (cubic) satisfying the four boundary conditions:
#       vx/v_inf = (3/2)(y/delta_M) - (1/2)(y/delta_M)^3,   (cA - cAs)/(cA_inf - cAs) = (3/2)(y/delta_c) - (1/2)(y/delta_c)^3
#   * momentum integral with the cubic profile: delta_M/x = 4.64 / Re_x^(1/2)
#   * with r = delta_c/delta_M <= 1 (Sc >= 1):  r G(r) (delta^2/2)' v = (3/2) D/r,  G(r) = (3/20) r - (3/280) r^3
#     -> r ~ 0.976 Sc^(-1/3)  and  Sh_x = (3/2) x/delta_c ~ 0.331 Sc^(1/3) Re_x^(1/2)
#   * the lecture quotes 0.36 Re_x^(1/2) Sc^(1/3) ("8% error"); carrying the cubic profile through gives 0.323-0.331
#   * turbulent ansatz (1/7 power law) in the lecture: Sh_x = 0.0292 Re_x^(4/5)
# This script evaluates the profile integrals numerically, solves for r(Sc), and compares with Blasius.

import math


def simpson(f, a, b, n=2000):
    h = (b - a) / n
    s = f(a) + f(b)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * f(a + i * h)
    return s * h / 3


def cubic(p):
    return 1.5 * p - 0.5 * p ** 3


def G(r):
    """int_0^1 (vx/v_inf)(1 - C) dphi with phi = y/delta_c, velocity written in y/delta_M = r phi"""
    return simpson(lambda p: cubic(r * p) * (1 - cubic(p)), 0.0, 1.0)


def solve_r(Sc, c2):
    lo, hi = 1e-4, 1.01
    f = lambda r: r * G(r) * c2 / 2 - 1.5 / (r * Sc)
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        if f(lo) * f(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return 0.5 * (lo + hi)


if __name__ == "__main__":
    print("=== 1. Momentum integral with the cubic profile ===")
    Hm = simpson(lambda p: cubic(p) * (1 - cubic(p)), 0, 1)
    c = math.sqrt(3 / Hm)
    print(f"  momentum thickness / delta = {Hm:.5f} (= 39/280 = {39/280:.5f})")
    print(f"  delta_M / x = {c:.3f} / Re_x^(1/2)   (exact Blasius delta_99: 4.91)")

    print("\n=== 2. Concentration integral: r = delta_c/delta_M and Sh_x coefficient ===")
    print("     Sc       r       r Sc^(1/3)   Sh_x / (Re^(1/2) Sc^(1/3))")
    for Sc in (1.0, 2.0, 10.0, 100.0, 1000.0):
        r = solve_r(Sc, c * c)
        coef = 1.5 / (r * c) / Sc ** (1 / 3)
        print(f"  {Sc:7.1f}   {r:.4f}    {r*Sc**(1/3):.4f}       {coef:.4f}")
    print("  exact (Blasius-Pohlhausen): 0.332; lecture slide: 0.36")

    print("\n=== 3. Laminar versus turbulent local Sherwood numbers (Sc = 1) ===")
    for Re in (1e4, 1e5, 5e5, 1e6, 1e7):
        lam = 0.332 * math.sqrt(Re)
        tur = 0.0292 * Re ** 0.8
        print(f"  Re_x = {Re:8.0e}: laminar 0.332 Re^(1/2) = {lam:8.1f},  turbulent 0.0292 Re^(4/5) = {tur:8.1f}")
    print("  -> at transition (Re_x ~ 5e5) the turbulent law gives about 4.5 times more transfer")

    print("\n=== 4. Case: naphthalene sublimation from a plate (illustrative properties) ===")
    nu, D, v, L, W = 1.55e-5, 6.1e-6, 2.0, 0.10, 0.05
    psat, T, M = 10.6, 298.15, 0.1282          # Pa, K, kg/mol
    Sc = nu / D
    ReL = v * L / nu
    ShL = 0.664 * Sc ** (1 / 3) * math.sqrt(ReL)
    kc = ShL * D / L
    cs = psat / (8.314 * T)                     # mol/m^3 at the surface, c_inf = 0
    rate = kc * W * L * cs * M                  # kg/s
    print(f"  Sc = {Sc:.2f}, Re_L = {ReL:.0f}, Sh_L = {ShL:.1f}, kc = {kc*100:.3f} cm/s")
    print(f"  surface concentration = {cs*1e3:.2f} mmol/m^3; sublimation rate = {rate*3.6e9:.1f} mg/h")
    print(f"  surface recession = {rate/(1145*W*L)*3.6e9:.2f} um/h (rho = 1145 kg/m^3): measurable by profilometry")
