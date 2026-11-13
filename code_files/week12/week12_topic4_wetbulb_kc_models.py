# Week 12 - Topic 4: Heat-Mass Analogy (Lewis Number) and the Three Models of kc
# Lecture (Part 1-2):
#   * dimensionless groups: Sc = nu/D, Pr = nu/alpha, Le = alpha/D = Sc/Pr
#   * Chilton-Colburn for heat and mass: j_H = St Pr^(2/3) = j_D = (kc/v) Sc^(2/3)
#     -> h / kc = rho cp (Sc/Pr)^(2/3) = rho cp Le^(2/3)
#   * wet-bulb thermometer (steady): heat in by convection = latent heat out by evaporation
#       h (T_inf - T_s) = lambda kc (rho_v,s - rho_v,inf)  ->  T_inf - T_s = lambda (rho_v,s - rho_v,inf) / (rho cp Le^(2/3))
#   * three models for kc (lecture Part 2):
#       film model          kc = D/delta                    ~ D^1
#       penetration model   kc = 2 sqrt(D/(pi t_c))         ~ D^(1/2)
#       boundary-layer      kc = 0.664 (D/L) Re^(1/2) Sc^(1/3) ~ D^(2/3)
# This script solves for the wet-bulb temperature and compares how kc scales with D in the three models.

import math


def psat(T):
    """saturation pressure of water, Pa (Buck-type fit, T in C)"""
    return 611.21 * math.exp((18.678 - T / 234.5) * (T / (257.14 + T)))


def wet_bulb(T, RH, Le, P=101325.0):
    Tk = T + 273.15
    rho = P * 0.02897 / (8.314 * Tk)
    cp = 1006.0
    rv = RH * psat(T) * 0.018015 / (8.314 * Tk)

    def f(Ts):
        lam = 2.501e6 - 2370.0 * Ts
        rvs = psat(Ts) * 0.018015 / (8.314 * (Ts + 273.15))
        return (T - Ts) * rho * cp * Le ** (2 / 3) - lam * (rvs - rv)

    lo, hi = -20.0, T
    for _ in range(100):
        mid = 0.5 * (lo + hi)
        if f(lo) * f(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return 0.5 * (lo + hi)


if __name__ == "__main__":
    alpha, D = 2.2e-5, 2.6e-5      # air at ~25 C; water vapor in air (m^2/s)
    Le = alpha / D
    print("=== 1. Lewis number of water vapor in air ===")
    print(f"  Le = alpha/D = {Le:.3f};  Le^(2/3) = {Le**(2/3):.3f}  -> h/(rho cp kc) close to 1")

    print("\n=== 2. Wet-bulb temperature from the heat-mass analogy ===")
    print("   T (C)  RH    T_wb (Le^(2/3))   T_wb (Le = 1)")
    for T, RH in ((20, 0.5), (25, 0.6), (30, 0.5), (35, 0.3), (40, 0.2)):
        print(f"   {T:4.0f}  {RH:.1f}   {wet_bulb(T, RH, Le):8.2f}          {wet_bulb(T, RH, 1.0):8.2f}")
    print("  -> the difference between the two columns is the Lewis-number effect (a few tenths of a kelvin)")

    print("\n=== 3. Evaporative cooling potential (T - T_wb) ===")
    for RH in (0.2, 0.4, 0.6, 0.8, 1.0):
        print(f"  30 C, RH = {RH:.1f}: depression = {30 - wet_bulb(30, RH, Le):5.2f} K")

    print("\n=== 4. How kc scales with D in the three models ===")
    D1, D2 = 1e-9, 2e-9
    delta, tc, nu, v, L = 50e-6, 0.1, 1e-6, 0.5, 0.05
    film = lambda D: D / delta
    pen = lambda D: 2 * math.sqrt(D / (math.pi * tc))
    bl = lambda D: 0.664 * D / L * math.sqrt(v * L / nu) * (nu / D) ** (1 / 3)
    for name, fn in (("film", film), ("penetration", pen), ("boundary layer", bl)):
        k1, k2 = fn(D1), fn(D2)
        print(f"  {name:15s}: kc(D) = {k1*1e6:7.2f} um/s, doubling D multiplies kc by {k2/k1:.3f} "
              f"(exponent {math.log(k2/k1)/math.log(2):.3f})")
    print("  -> plotting log kc against log D and reading the slope tells which picture fits the equipment")
