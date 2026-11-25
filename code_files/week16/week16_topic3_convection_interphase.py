# Week 16 · Topic 3 — Final review: convective mass transfer, correlations, interphase transfer
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   flat plate: Sh_L = 0.664 Re^1/2 Sc^1/3 (Re_L < 2e5), 0.0365 Re^4/5 Sc^1/3 (turbulent)
#   sphere (Frossling, Week 13): Sh = 2 + 0.552 Re^1/2 Sc^1/3, 2 < Re < 800, 0.6 < Sc < 2.7
#   pipe (liquid, turbulent): Sh = 0.023 Re^0.8 Sc^1/3 (Week 12 example)
#   two films: 1/Ky = 1/ky + m/kx;  absorber: NTU_OG = ln[(1 - 1/A)(yb - m xa)/(ya - m xa) + 1/A]/(1 - 1/A)
import math


def flat_plate(U, L, nu, D):
    Re, Sc = U * L / nu, nu / D
    if Re < 2e5:
        Sh, reg = 0.664 * math.sqrt(Re) * Sc ** (1 / 3), "laminar"
    else:
        Sh, reg = 0.0365 * Re ** 0.8 * Sc ** (1 / 3), "turbulent"
    return Re, Sc, Sh, Sh * D / L, reg


def frossling(U, d, nu, D):
    Re, Sc = U * d / nu, nu / D
    ok = (2 < Re < 800) and (0.6 < Sc < 2.7)
    Sh = 2 + 0.552 * math.sqrt(Re) * Sc ** (1 / 3)
    return Re, Sc, Sh, Sh * D / d, ok


def main():
    print("Topic 3 — convection, correlations and interphase transfer\n")
    print("[1] Flat plates in air at 25 C (nu = 1.55e-5 m2/s)")
    for U, L, D, name in ((2.0, 0.3, 2.6e-5, "water vapour"), (5.0, 0.3, 6.1e-6, "naphthalene"), (15.0, 1.0, 6.1e-6, "naphthalene")):
        Re, Sc, Sh, kc, reg = flat_plate(U, L, 1.55e-5, D)
        print("   %-12s U = %4.1f m/s, L = %.1f m: Re = %.3e (%s), Sc = %.3f, Sh = %.1f, k_c = %.3e m/s" % (name, U, L, Re, reg, Sc, Sh, kc))
    print("   evaporation (first case, rho_v,s = 0.0230 kg/m3): %.3f kg/m2 h" % (flat_plate(2.0, 0.3, 1.55e-5, 2.6e-5)[3] * 0.0230 * 3600))
    print()
    Re, Sc, Sh, kc, ok = frossling(1.0, 0.01, 1.55e-5, 6.1e-6)
    cs = 10.4 / (8.314 * 298.15)
    N = kc * cs
    print("[2] Naphthalene sphere d = 1 cm in air at 1 m/s (p* = 10.4 Pa, rho = 1145 kg/m3, M = 0.128 kg/mol)")
    print("   Re = %.1f, Sc = %.3f, inside Frossling range: %s" % (Re, Sc, "yes" if ok else "no"))
    print("   Sh = %.2f, k_c = %.4e m/s, N = %.4e mol/m2 s, dR/dt = %.3e m/s (%.3f mm/day)" % (Sh, kc, N, N * 0.128 / 1145, N * 0.128 / 1145 * 86400e3))
    print("   with coefficient 0.6 instead: Sh = %.2f (x%.3f)" % (2 + 0.6 * math.sqrt(Re) * Sc ** (1 / 3), (2 + 0.6 * math.sqrt(Re) * Sc ** (1 / 3)) / Sh))
    print()
    Re, Sc, d, D = 5e4, 500.0, 0.02, 1.2e-9
    ShCC = 0.023 * Re ** 0.8 * Sc ** (1 / 3)
    ShR = 0.023 * Re ** (-0.2) * Re * Sc
    print("[3] Liquid in a 2 cm pipe, Re = 5e4, Sc = 500")
    print("   Chilton-Colburn Sh = %.1f, k_c = %.3e m/s; Reynolds analogy Sh = %.3e (ratio %.1f = Sc^(2/3) = %.1f)" % (ShCC, ShCC * D / d, ShR, ShR / ShCC, Sc ** (2 / 3)))
    print("   bubble column: k_c ratio 1.41 for D ratio 2 -> exponent %.3f" % (math.log(1.41) / math.log(2)))
    print()
    ky, kx, m, y, x = 1e-3, 5e-3, 30.0, 0.05, 0.001
    Ky = 1 / (1 / ky + m / kx)
    Nf = Ky * (y - m * x)
    print("[4] Two films: ky = %.0e, kx = %.0e, m = %.0f, y = %.3f, x = %.3f" % (ky, kx, m, y, x))
    print("   Ky = %.4e, N = %.4e, yi = %.4f, xi = %.4e, gas-film share = %.1f%%" % (Ky, Nf, y - Nf / ky, x + Nf / kx, 100 * (1 / ky) / (1 / ky + m / kx)))
    print()
    yb, rec, xa, m, f, HTU = 0.02, 0.9, 0.0, 1.0, 1.5, 0.6
    ya = yb * (1 - rec)
    LVmin = (yb - ya) / (yb / m - xa)
    A = f * LVmin / m
    NTU = math.log((1 - 1 / A) * (yb - m * xa) / (ya - m * xa) + 1 / A) / (1 - 1 / A)
    print("[5] Dilute absorber: yb = 0.02, 90% recovery, m = 1, L/V = 1.5 x minimum, HTU = 0.6 m")
    print("   (L/V)min = %.3f, A = %.3f, NTU_OG = %.3f, Z = %.3f m" % (LVmin, A, NTU, HTU * NTU))


main()
