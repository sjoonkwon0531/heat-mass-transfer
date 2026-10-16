# Week 8 - Topic 3: Planck's Law, Wien's Displacement, Stefan-Boltzmann
# Lecture (Part 2): counting standing-wave modes in a cavity gives the
# density of states g(nu) dnu = 8 pi V nu^2 / c^3 dnu. Classical equipartition
# (<E> = kB T) gives Rayleigh-Jeans and the ultraviolet catastrophe;
# Planck's quantization E_n = n h nu gives
#   <E> = h nu / (exp(h nu / kB T) - 1)
# and the spectral flux F_lambda = (2 pi h c^2 / lambda^5) / (exp(hc/lambda kB T) - 1).
# Results checked here:
#   * total flux  F = sigma T^4 with sigma = 2 pi^5 kB^4/(15 h^3 c^2) = 5.670e-8
#   * Wien peak   x e^x/(e^x - 1) = 5  -> x = 4.965 -> lambda_C T = 2.898e-3 m K
#   * frequency peak: x = 2.821; sun at 5800 K peaks near 500 nm.

import math

H = 6.62607015e-34     # J s
C = 2.99792458e8       # m/s
KB = 1.380649e-23      # J/K


def planck_lambda(lam, T):
    """Spectral emissive power F_lambda, W/m^2 per m of wavelength."""
    x = H * C / (lam * KB * T)
    if x > 700:
        return 0.0
    return 2.0 * math.pi * H * C ** 2 / lam ** 5 / math.expm1(x)


def rayleigh_jeans(lam, T):
    return 2.0 * math.pi * C * KB * T / lam ** 4


def solve_wien(target):
    """Solve x*exp(x)/(exp(x)-1) = target by bisection."""
    f = lambda x: x * math.exp(x) / math.expm1(x) - target
    lo, hi = 0.5, 10.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if f(lo) * f(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return 0.5 * (lo + hi)


if __name__ == "__main__":
    # --- Stefan-Boltzmann constant from first principles ---
    sigma = 2.0 * math.pi ** 5 * KB ** 4 / (15.0 * H ** 3 * C ** 2)
    print(f"sigma = 2 pi^5 kB^4/(15 h^3 c^2) = {sigma:.4e} W/m^2 K^4 (lecture 5.670e-8)")

    # numerical check of the Bose-Einstein integral int x^3/(e^x-1) dx = pi^4/15
    n, xmax = 400000, 60.0
    dx = xmax / n
    integral = sum((i * dx + 0.5 * dx) ** 3 / math.expm1(i * dx + 0.5 * dx)
                   for i in range(n)) * dx
    print(f"int_0^inf x^3/(e^x - 1) dx = {integral:.6f}  (pi^4/15 = {math.pi**4/15:.6f})")

    # --- Wien displacement (wavelength and frequency forms) ---
    x5 = solve_wien(5.0)
    x3 = solve_wien(3.0)
    b = H * C / (x5 * KB)
    print(f"\nWien (lambda form): x = {x5:.4f} (lecture 4.965) -> "
          f"lambda_C T = {b*1e3:.4f} mm K (lecture 2.898)")
    print(f"Wien (nu form)    : x = {x3:.4f} (lecture 2.821) -> nu_C = 2.821 kB T/h")
    for T, name in [(5800.0, "Sun"), (310.0, "human body"), (1500.0, "furnace")]:
        lamC = b / T
        print(f"  {name:11s} T = {T:6.0f} K -> lambda_C = "
              f"{lamC*1e9:8.1f} nm = {lamC*1e6:7.3f} um")

    # --- total flux: numerical integral of Planck vs sigma T^4 ---
    T = 5800.0
    lam_lo, lam_hi, nL = 10e-9, 100e-6, 20000
    dlam = (lam_hi - lam_lo) / nL
    F = sum(planck_lambda(lam_lo + (i + 0.5) * dlam, T) for i in range(nL)) * dlam
    print(f"\nT = {T:.0f} K: integral of F_lambda = {F:.4e} W/m^2, "
          f"sigma T^4 = {sigma*T**4:.4e} W/m^2")

    # --- Rayleigh-Jeans vs Planck: the ultraviolet catastrophe ---
    print("\nF_lambda at T = 2000 K (W/m^2 um):   lambda    Planck      Rayleigh-Jeans")
    for lam_um in (0.2, 0.5, 1.0, 1.449, 3.0, 10.0):
        lam = lam_um * 1e-6
        print(f"  {lam_um:8.3f} um   {planck_lambda(lam, 2000.0)*1e-6:12.4e} "
              f"{rayleigh_jeans(lam, 2000.0)*1e-6:14.4e}")
    print("  -> RJ diverges as lambda^-4 (catastrophe); Planck peaks at "
          f"lambda_C = {b/2000.0*1e6:.3f} um for 2000 K and dies off exponentially.")
