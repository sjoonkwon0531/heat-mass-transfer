# Week 5 - Topic 2: Laminar Flat-Plate Heat Transfer - the Nusselt Number
# Thermal boundary layer on a flat plate (lecture Part 1):
#   Pr = 1  : temperature profile = Blasius velocity profile -> Nu_x = 0.332*sqrt(Re_x)
#   Pr != 1 : delta/delta_t ~ Pr^(1/3) (laminar) -> Nu_x = 0.332*Pr^(1/3)*sqrt(Re_x)
#   Mean value over 0..L: Nu_L = 0.664*Pr^(1/3)*sqrt(Re_L)  (= 2*Nu_x at x = L)
# Integral method (cubic profile, no Blasius solution): Nu_x = 0.36*Re_x^(1/2)*Pr^(1/3)
#   -> only ~8% above the exact 0.332 prefactor.
# Also: h_x ~ x^(-1/2) (thin boundary layer near the leading edge transfers best).

import math

def nu_x(Re_x, Pr):
    """Local Nusselt number, exact laminar boundary-layer result."""
    return 0.332 * Pr ** (1.0 / 3.0) * math.sqrt(Re_x)

def nu_mean(Re_L, Pr):
    """Mean Nusselt number over the plate (integrated h_x)."""
    return 0.664 * Pr ** (1.0 / 3.0) * math.sqrt(Re_L)

def nu_x_integral(Re_x, Pr):
    """Integral-method estimate with the cubic profile."""
    return 0.36 * Pr ** (1.0 / 3.0) * math.sqrt(Re_x)

if __name__ == "__main__":
    # --- Worked example: air over a heated plate ---
    # air at ~300 K: nu = 15.9e-6 m^2/s, k = 0.0263 W/mK, Pr = 0.707
    nu_air, k_air, Pr_air = 15.9e-6, 0.0263, 0.707
    U, L, W = 5.0, 0.5, 0.5
    Ts, Tinf = 60.0, 20.0
    Re_L = U * L / nu_air
    print(f"Air, U = {U} m/s, L = {L} m: Re_L = {Re_L:.3e} < 5e5 -> laminar everywhere")

    print("\nLocal values along the plate (h_x ~ x^(-1/2)):")
    print("  x [m]    Re_x        Nu_x      h_x [W/m2K]")
    for x in (0.01, 0.05, 0.1, 0.2, 0.35, 0.5):
        Re_x = U * x / nu_air
        Nux = nu_x(Re_x, Pr_air)
        hx = Nux * k_air / x
        print(f"  {x:5.2f}  {Re_x:10.3e}  {Nux:8.2f}  {hx:10.2f}")

    NuL = nu_mean(Re_L, Pr_air)
    hbar = NuL * k_air / L
    Q = hbar * (W * L) * (Ts - Tinf)
    print(f"\nMean: Nu_L = {NuL:.1f}, h_bar = {hbar:.2f} W/m2K")
    print(f"Total heat rate ({W}x{L} m plate, dT = {Ts-Tinf} K): Q = {Q:.1f} W")
    # mean = 2 x local at L (both ~ sqrt)
    print(f"Check: Nu_L / Nu_x(L) = {NuL / nu_x(Re_L, Pr_air):.3f}  (= 2 exactly)")

    # --- Integral method vs exact ---
    print("\nIntegral method (0.36) vs exact (0.332):")
    print(f"  prefactor ratio = {0.36/0.332:.4f}  -> ~8% overestimate (lecture)")

    # --- Effect of Prandtl number at fixed Re_x = 1e5 ---
    print("\nPr sweep at Re_x = 1e5 (why liquids beat gases, and metals beat both):")
    print("  fluid           Pr      Nu_x")
    for name, Pr in (("mercury", 0.016), ("air", 0.707), ("water(30C)", 5.4),
                     ("sea water", 13.0), ("light oil", 100.0)):
        print(f"  {name:12s} {Pr:7.3f}  {nu_x(1e5, Pr):8.1f}")
    print("  cf) Pr^(1/3) scaling holds for Pr >~ 0.6; liquid metals need a separate treatment.")

    # sanity checks
    assert abs(nu_mean(1e5, 1.0) - 2 * nu_x(1e5, 1.0)) < 1e-9
    assert abs(nu_x(1e5, 1.0) - 0.332 * math.sqrt(1e5)) < 1e-9
