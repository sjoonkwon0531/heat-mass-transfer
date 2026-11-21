"""
Week 13 · Topic 3 — Confined flows: pipes and packed beds
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  Gilliland & Sherwood (gas, 2000 < Re < 35000, 0.6 < Sc < 2.5):  Sh (p_B,lm / P) = 0.023 Re^0.83 Sc^0.44
  Linton & Sherwood (liquid, 2000 < Re < 35000, 1000 < Sc < 2260): Sh = 0.023 Re^0.83 Sc^(1/3)
  Laminar tube (10 < Re < 2000):                                    Sh = 1.86 (Re Sc d / L)^(1/3)
  Packed bed (10 < Re < 2500):                                      j_D = 1.17 Re^-0.415
  Packed bed, liquids (Wilson & Geankoplis 1966):  eps j_D = 1.09 Re^(-2/3)   (0.0016 < Re < 55)
                                                   eps j_D = 0.250 Re^(-0.31) (55 < Re < 1500)
  with j_D = (k_c / v') Sc^(2/3), Re = d_p v' rho / mu, v' = superficial velocity.
"""
import math


def sh_gilliland(Re, Sc, pBlm_over_P=1.0):
    return 0.023 * Re ** 0.83 * Sc ** 0.44 / pBlm_over_P


def sh_linton(Re, Sc):
    return 0.023 * Re ** 0.83 * Sc ** (1 / 3)


def sh_laminar_tube(Re, Sc, d_over_L):
    return 1.86 * (Re * Sc * d_over_L) ** (1 / 3)


def jD_packed_gas(Re):
    return 1.17 * Re ** -0.415


def eps_jD_wilson(Re):
    return 1.09 * Re ** (-2 / 3) if Re < 55 else 0.250 * Re ** -0.31


def main():
    print("Topic 3 — pipes and packed beds\n")

    print("[1] Water evaporating into air in a wetted-wall tube (d = 2.5 cm, v = 3 m/s, 25 C)")
    d, v, nu, D = 0.025, 3.0, 1.55e-5, 2.6e-5
    Re, Sc = v * d / nu, nu / D
    Sh = sh_gilliland(Re, Sc)
    print(f"   Re = {Re:.0f}, Sc = {Sc:.3f}, Sh = {Sh:.2f}, k_c = {Sh * D / d:.4f} m/s  (p_B,lm/P taken as 1)\n")

    print("[2] Benzoic acid lining a pipe, water flow (d = 2.5 cm, Re = 1e4, Sc = 1000, D = 1e-9 m2/s)")
    Re, Sc, D, d = 1e4, 1000.0, 1e-9, 0.025
    Sh = sh_linton(Re, Sc)
    print(f"   Linton-Sherwood: Sh = {Sh:.1f}, k_c = {Sh * D / d:.3e} m/s\n")

    print("[3] Laminar tube, Re = 500, Sc = 1000: effect of the length")
    for L_over_d in (10, 100, 1000):
        Sh = sh_laminar_tube(500, 1000, 1 / L_over_d)
        print(f"   L/d = {L_over_d:5d}   Sh = {Sh:.2f}")
    print("   (Longer tubes give a smaller mean Sh: the concentration layer keeps thickening.)\n")

    print("[4] Water through a bed of benzoic acid spheres (d_p = 6 mm, v' = 1 mm/s, eps = 0.40, Sc = 1000)")
    dp, vs, nu, eps, Sc, D = 6e-3, 1e-3, 8.9e-7, 0.40, 1000.0, 8.9e-10
    Re = dp * vs / nu
    jD = eps_jD_wilson(Re) / eps
    kc = jD * vs / Sc ** (2 / 3)
    print(f"   Re = {Re:.2f}  ->  eps j_D = {eps_jD_wilson(Re):.4f}, j_D = {jD:.4f}, k_c = {kc:.3e} m/s")
    print(f"   Sh = k_c d_p / D = {kc * dp / D:.2f}")
    print("   continuity check at Re = 55:", f"{1.09 * 55 ** (-2 / 3):.4f} vs {0.250 * 55 ** -0.31:.4f}\n")

    print("[5] Gas through a packed bed: j_D = 1.17 Re^-0.415")
    for Re in (10, 100, 1000, 2500):
        print(f"   Re = {Re:5d}   j_D = {jD_packed_gas(Re):.4f}")


if __name__ == "__main__":
    main()
