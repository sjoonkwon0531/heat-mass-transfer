"""
Week 13 · Topic 1 — Flat-plate correlations, the unheated starting length, and the CVD example
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  Laminar (Re_L < 2e5):   Sh_L = 0.664 Re_L^(1/2) Sc^(1/3),  j_D = 0.664 Re_L^(-1/2)
  Turbulent (Re_L > 2e5): Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3), j_D = 0.0365 Re_L^(-1/5)
  Mass transfer that starts at x = X (inert wall before X):
      Sh_x = 0.332 Re_x^(1/2) [Sc / (1 - (X/x)^(3/4))]^(1/3)
  CVD example (lecture): carrier gas over a wafer that begins at X = 4 cm, evaluated at x = 9 cm.
"""
import math


def sh_plate_mean(Re, Sc):
    """Mean Sherwood number over a plate of length L, with the regime picked by Re_L."""
    if Re < 2e5:
        return 0.664 * Re ** 0.5 * Sc ** (1 / 3)
    return 0.0365 * Re ** 0.8 * Sc ** (1 / 3)


def jD_plate(Re):
    return 0.664 * Re ** -0.5 if Re < 2e5 else 0.0365 * Re ** -0.2


def sh_x_entrance(Re_x, Sc, X_over_x):
    """Local Sherwood number when the active wall starts at X (laminar)."""
    return 0.332 * Re_x ** 0.5 * (Sc / (1.0 - X_over_x ** 0.75)) ** (1 / 3)


def main():
    print("Topic 1 — flat-plate correlations and the CVD example\n")

    print("[1] Mean Sh and j_D on a flat plate (Sc = 1)")
    print("   Re_L       regime      Sh_L        j_D")
    for Re in (1e3, 1e4, 1e5, 1.99e5, 2.01e5, 1e6, 1e7):
        reg = "laminar" if Re < 2e5 else "turbulent"
        print(f"   {Re:8.2e}  {reg:10s} {sh_plate_mean(Re, 1.0):10.2f}  {jD_plate(Re):.5f}")
    print("   (Check: j_D = Sh / (Re Sc^(1/3)) equals C_f/2 for a flat plate.)\n")

    print("[2] Entrance (unheated starting length) factor [1 - (X/x)^(3/4)]^(-1/3)")
    for r in (0.0, 0.2, 0.44444, 0.6, 0.8, 0.9, 0.99):
        print(f"   X/x = {r:6.4f}   factor = {(1 - r ** 0.75) ** (-1 / 3):6.3f}")
    print()

    print("[3] CVD example: v = 100 cm/s, nu = 5.686 cm2/s, D_AB = 1.55 cm2/s, X = 4 cm, x = 9 cm")
    v, nu, D, X, x = 100.0, 5.686, 1.55, 4.0, 9.0
    Re = v * x / nu
    Sc = nu / D
    Sh = sh_x_entrance(Re, Sc, X / x)
    kc = Sh * D / x
    print(f"   Re_x = {Re:.1f} (laminar),  Sc = {Sc:.3f}")
    print(f"   entrance factor (Sc/(1-(X/x)^0.75))^(1/3) = {(Sc / (1 - (X / x) ** 0.75)) ** (1 / 3):.3f}")
    print(f"   Sh_x = {Sh:.3f}   ->   k_c = Sh D / x = {kc:.3f} cm/s")
    # film-theory estimate with the lecture's momentum thickness 4.79 x / Re^(1/2)
    dM = 4.79 * x / Re ** 0.5
    ratio = (Sc / (1 - (X / x) ** 0.75)) ** (1 / 3)
    dc = dM / ratio
    kc_film = D / dc
    print(f"   delta_M = 4.79 x / Re^(1/2) = {dM:.3f} cm,  delta_M/delta_c = {ratio:.3f},  delta_c = {dc:.3f} cm")
    print(f"   film theory k_c = D/delta_c = {kc_film:.3f} cm/s   ({(1 - kc_film / kc) * 100:.0f}% below the BL result)")
    print(f"   with the cubic-profile wall gradient 3/2: k_c = 1.5 D/delta_c = {1.5 * kc_film:.3f} cm/s")


if __name__ == "__main__":
    main()
