"""
Week 13 · Topic 2 — Creeping flow past a sphere: Stokes drag, terminal velocity, and Sh(Pe)
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  Stokes drag F_D = 6 pi mu U R  (1/3 from pressure, 2/3 from shear);  U_T = 2 R^2 (rho_p - rho) g / (9 mu)
  Pe << 1 (Acrivos & Taylor, Pe = U R / D, Sh on diameter):
      Sh = 2 [1 + Pe/4 + (Pe^2/8) ln Pe + 0.01702 Pe^2 + (Pe^3/32) ln Pe]
  Pe >> 1 (thin concentration layer):  Sh = 1.249 Pe^(1/3)  =  0.991 Pe_d^(1/3),  Pe_d = U d / D
  Brian & Hales (Pe_d < 1e4):  Sh = (4 + 1.21 Pe_d^(2/3))^(1/2)
  Froessling (gas streams):    Sh = 2 + 0.552 Re^(1/2) Sc^(1/3)
"""
import math

G = 9.81


def stokes_terminal(R, drho, mu):
    return 2.0 * R * R * drho * G / (9.0 * mu)


def sh_small_pe(Pe):
    """Acrivos-Taylor expansion, Pe = U R / D (valid for Pe below about 1)."""
    if Pe <= 0:
        return 2.0
    L = math.log(Pe)
    return 2.0 * (1 + Pe / 4 + Pe ** 2 / 8 * L + 0.01702 * Pe ** 2 + Pe ** 3 / 32 * L)


def sh_large_pe(Pe):
    """Thin-layer result, Pe = U R / D."""
    return 1.249 * Pe ** (1 / 3)


def sh_brian_hales(Pe_d):
    return math.sqrt(4.0 + 1.21 * Pe_d ** (2 / 3))


def sh_froessling(Re, Sc):
    return 2.0 + 0.552 * Re ** 0.5 * Sc ** (1 / 3)


def main():
    print("Topic 2 — creeping flow past a sphere\n")
    print("[1] Stokes terminal velocity  U_T = 2 R^2 (rho_p - rho) g / (9 mu)")
    cases = [
        ("1 um silica in water (CMP slurry)", 0.5e-6, 2200 - 997, 8.9e-4, 997),
        ("10 um water droplet in air", 5e-6, 1000 - 1.18, 1.8e-5, 1.18),
        ("100 um sand grain in water", 50e-6, 2650 - 997, 8.9e-4, 997),
    ]
    for name, R, drho, mu, rho in cases:
        U = stokes_terminal(R, drho, mu)
        Re = rho * U * 2 * R / mu
        F = 6 * math.pi * mu * U * R
        print(f"   {name:34s} U_T = {U:.3e} m/s   Re = {Re:.2e}   F_D = {F:.3e} N")
    print("   (Stokes' law needs Re << 1; the 100 um grain is already at Re ~ 1, the edge of validity.)\n")

    print("[2] Sherwood number of a sphere versus Pe = U R / D   (Sh based on the diameter)")
    print("     Pe       Acrivos-Taylor   1.249 Pe^(1/3)   Brian-Hales(Pe_d = 2 Pe)")
    for Pe in (0.01, 0.1, 0.5, 1, 10, 100, 1000, 1e4):
        st = sh_small_pe(Pe) if Pe <= 1 else float("nan")
        print(f"   {Pe:7.2g}   {st:12.4f}   {sh_large_pe(Pe):12.3f}   {sh_brian_hales(2 * Pe):12.3f}")
    print("   Same law in two notations: 1.249 Pe^(1/3) = 1.249 (Pe_d/2)^(1/3) = "
          f"{1.249 / 2 ** (1 / 3):.3f} Pe_d^(1/3)\n")

    print("[3] Shape factors for Pe << 1 (Sh on length L)")
    for name, val in (("sphere, L = 2R", 2.0), ("oblate spheroid a/b = 1/2, L = 2b", 2.40),
                      ("circular disk, L = 2R", 8 / math.pi), ("square plate, L = a", math.pi / math.log(4))):
        print(f"   {name:36s} Sh = {val:.3f}")
    print()

    print("[4] Froessling: 1 mm naphthalene sphere in air at 1 m/s (nu = 1.55e-5, D = 6.1e-6 m2/s)")
    d, U, nu, D = 1e-3, 1.0, 1.55e-5, 6.1e-6
    Re, Sc = U * d / nu, nu / D
    Sh = sh_froessling(Re, Sc)
    print(f"   Re = {Re:.1f}, Sc = {Sc:.3f}, Sh = {Sh:.3f}, k_c = {Sh * D / d:.4f} m/s")


if __name__ == "__main__":
    main()
