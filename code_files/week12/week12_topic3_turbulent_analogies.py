# Week 12 - Topic 3: Turbulent Mass Transfer - Reynolds, Prandtl, von Karman and Chilton-Colburn Analogies
# Lecture (Part 2):
#   * eddy diffusivity (mixing length): N_Ay = -(D_AB + eps_D) dcA/dy,  eps_D = v_y' L
#   * laminar sublayer thickness in a pipe: delta/D = 62 Re^(-7/8)
#   * Reynolds analogy (Sc = 1):        kc / v = Cf/2                       -> Sh = (Cf/2) Re Sc
#   * Prandtl analogy (sublayer):        kc / v = (Cf/2) / [1 + 5 sqrt(Cf/2) (Sc - 1)]
#   * von Karman analogy (+ buffer):     Sh = (Cf/2) Re Sc / {1 + 5 sqrt(Cf/2) [Sc - 1 + ln((1 + 5 Sc)/6)]}
#   * Chilton-Colburn:                   j_D = (kc/v) Sc^(2/3) = Cf/2    (0.6 < Sc < 2500)
#   Smooth-pipe friction used here: Cf/2 = f_Fanning/2 = 0.023 Re^(-0.2), so Colburn gives Sh = 0.023 Re^0.8 Sc^(1/3).
# This script compares the four analogies over Sc and evaluates the sublayer thickness.

import math


def half_cf(Re):
    return 0.023 * Re ** -0.2


def sh_reynolds(Re, Sc):
    return half_cf(Re) * Re * Sc


def sh_prandtl(Re, Sc):
    c = half_cf(Re)
    return c * Re * Sc / (1 + 5 * math.sqrt(c) * (Sc - 1))


def sh_karman(Re, Sc):
    c = half_cf(Re)
    return c * Re * Sc / (1 + 5 * math.sqrt(c) * (Sc - 1 + math.log((1 + 5 * Sc) / 6)))


def sh_colburn(Re, Sc):
    return half_cf(Re) * Re * Sc ** (1 / 3)


if __name__ == "__main__":
    for Re in (1e4, 1e5):
        print(f"=== Smooth pipe, Re = {Re:.0e}, Cf/2 = {half_cf(Re):.5f} ===")
        print("     Sc    Reynolds    Prandtl   von Karman   Colburn")
        for Sc in (0.7, 1.0, 2.0, 10.0, 100.0, 1000.0):
            print(f"  {Sc:6.1f}  {sh_reynolds(Re, Sc):9.1f}  {sh_prandtl(Re, Sc):9.1f}  "
                  f"{sh_karman(Re, Sc):9.1f}   {sh_colburn(Re, Sc):9.1f}")
        print()
    print("  -> all four agree at Sc = 1. Reynolds overshoots at large Sc (it ignores the sublayer resistance);")
    print("     Prandtl and von Karman level off (they allow no eddy transport inside the sublayer),")
    print("     while Colburn keeps the Sc^(1/3) growth seen in liquid-phase data within 0.6 < Sc < 2500")

    print("\n=== Laminar sublayer thickness, delta/D = 62 Re^(-7/8) ===")
    for Re in (1e4, 3e4, 1e5, 3e5):
        d = 62 * Re ** -0.875
        print(f"  Re = {Re:7.0e}: delta/D = {d:.5f}  -> in a 25 mm pipe: {d*25e3:.0f} um")

    print("\n=== Case: wall dissolution in a water pipe (Sc = 1000, Re = 2e4, D = 1e-9 m^2/s, d = 25 mm) ===")
    Re, Sc, D, d = 2e4, 1000.0, 1e-9, 0.025
    for name, fn in (("Prandtl", sh_prandtl), ("von Karman", sh_karman), ("Colburn", sh_colburn)):
        Sh = fn(Re, Sc)
        print(f"  {name:10s}: Sh = {Sh:7.1f}, kc = {Sh*D/d*1e6:.2f} um/s")
    print("  -> a factor of ~3 between models at Sc = 1000: for liquids, use a Sc^(1/3) correlation")
