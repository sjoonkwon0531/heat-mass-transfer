# Week 15 · Topic 3 — Lattice-gas (regular-solution) free energy, spinodal, binodal and the
#                      fastest-growing wavelength of spinodal decomposition
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   f(phi) = dF/(kB T N) = chi phi (1 - phi) + phi ln phi + (1 - phi) ln(1 - phi),  chi = kappa/(kB T)
#   spinodal: f'' = 0  ->  2 chi phi (1 - phi) = 1;   critical point chi_c = 2, phi_c = 1/2 (T_c = kappa/(2 kB))
#   binodal (symmetric): f'(phi) = 0  ->  chi (1 - 2 phi) + ln[phi/(1 - phi)] = 0
#   Cahn-Hilliard, linearised:  growth rate omega(q) = -M q^2 [ f''(phi0) + 2 K q^2 ],  K = C h^2, C = chi/2
#   q_c^2 = -f''/(2K) (marginal),  q_m^2 = -f''/(4K) = q_c^2/2 (fastest),  lambda_m = 2 pi / q_m
import math


def f(phi, chi):
    return chi * phi * (1 - phi) + phi * math.log(phi) + (1 - phi) * math.log(1 - phi)


def f2(phi, chi):
    return -2 * chi + 1 / (phi * (1 - phi))


def spinodal(chi):
    if chi <= 2:
        return None
    s = math.sqrt(1 - 2 / chi)
    return 0.5 * (1 - s), 0.5 * (1 + s)


def binodal(chi):
    if chi <= 2:
        return None
    g = lambda p: chi * (1 - 2 * p) + math.log(p / (1 - p))
    lo, hi = 1e-12, spinodal(chi)[0]
    for _ in range(200):
        m = 0.5 * (lo + hi)
        if g(lo) * g(m) <= 0:
            hi = m
        else:
            lo = m
    p = 0.5 * (lo + hi)
    return p, 1 - p


def main():
    print("Topic 3 — lattice-gas free energy, spinodal, binodal and lambda_m\n")
    print("[1] Free energy of mixing f(phi) at phi = 0.1, 0.3, 0.5")
    for chi in (1.0, 1.5, 2.0, 2.5, 3.0):
        print("   chi = %.1f:  f = %8.4f %8.4f %8.4f   f''(0.5) = %6.3f" % (chi, f(0.1, chi), f(0.3, chi), f(0.5, chi), f2(0.5, chi)))
    print("   critical point: chi_c = 2 (T_c = kappa/(2 kB)), phi_c = 0.5\n")
    print("[2] Phase diagram:  T/T_c = 2/chi")
    print("    chi    T/Tc    binodal (phi1, phi2)    spinodal (phi1, phi2)")
    for chi in (2.05, 2.2, 2.5, 3.0, 3.5, 4.0):
        b = binodal(chi)
        s = spinodal(chi)
        print("   %4.2f   %.4f   (%.4f, %.4f)        (%.4f, %.4f)" % (chi, 2 / chi, b[0], b[1], s[0], s[1]))
    print()
    print("[3] Linear Cahn-Hilliard: K = C h^2 with C = chi/2, h = 1 (lattice spacing)")
    print("    chi   phi0   f''(phi0)   q_c      q_m      lambda_m/h   lecture q_C = (1/h)[1 - 1/(2 chi phi0(1-phi0))]^(1/2)")
    for chi, phi0 in [(2.5, 0.5), (2.5, 0.4), (3.0, 0.5), (3.0, 0.3), (4.0, 0.5)]:
        fpp = f2(phi0, chi)
        K = chi / 2
        if fpp >= 0:
            print("   %4.1f   %.2f   %8.4f   stable (outside the spinodal)" % (chi, phi0, fpp))
            continue
        qc = math.sqrt(-fpp / (2 * K))
        qm = math.sqrt(-fpp / (4 * K))
        lec = math.sqrt(1 - 1 / (2 * chi * phi0 * (1 - phi0)))
        print("   %4.1f   %.2f   %8.4f   %.4f   %.4f   %8.3f      %.4f" % (chi, phi0, fpp, qc, qm, 2 * math.pi / qm, lec))
    print("   (the lecture's q_C equals q_m = q_c/sqrt(2), the fastest-growing mode)")
    print()
    print("[4] Growth-rate spectrum omega(q)/M for chi = 2.5, phi0 = 0.5 (f'' = -1, K = 1.25)")
    for q in (0.1, 0.2, 0.3, 0.4, 0.4472, 0.5, 0.6, 0.6325, 0.7):
        w = -q * q * (f2(0.5, 2.5) + 2 * 1.25 * q * q)
        print("   q = %.4f   omega/M = %+.5f" % (q, w))


main()
