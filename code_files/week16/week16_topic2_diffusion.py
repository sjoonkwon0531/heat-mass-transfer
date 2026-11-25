# Week 16 · Topic 2 — Final review: steady and unsteady molecular diffusion
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   Stefan tube: N_A = (cD/L) ln[(1 - yA2)/(1 - yA1)];  Deal-Grove: x^2 + A x = B t
#   Hatta: Ha = delta sqrt(k1/D), E = Ha/tanh(Ha);  semi-infinite: erfc(z/(2 sqrt(D t)))
#   slab uptake: M/Minf = 1 - sum 8/((2k-1)^2 pi^2) exp(-(2k-1)^2 pi^2 Fo)
#   sphere release: m/m0 = (6/pi^2) sum (1/n^2) exp(-n^2 pi^2 tau)
import math

KB_EV = 8.617e-5


def bisect(f, lo, hi, n=200):
    flo = f(lo)
    for _ in range(n):
        m = 0.5 * (lo + hi)
        fm = f(m)
        if (fm > 0) == (flo > 0):
            lo, flo = m, fm
        else:
            hi = m
    return 0.5 * (lo + hi)


def slab_uptake(Fo):
    s = 0.0
    for k in range(1, 400):
        a = (2 * k - 1) ** 2 * math.pi ** 2
        s += 8.0 / a * math.exp(-a * Fo)
    return 1.0 - s


def sphere_left(tau):
    s = 0.0
    for n in range(1, 400):
        s += math.exp(-n * n * math.pi ** 2 * tau) / (n * n)
    return 6.0 / math.pi ** 2 * s


def main():
    print("Topic 2 — steady and unsteady molecular diffusion\n")
    P, T, L, D, pv = 101325.0, 298.15, 0.08, 1.25e-5, 7830.0
    c = P / (8.314 * T)
    y1 = pv / P
    N = c * D / L * math.log(1 / (1 - y1))
    Nf = c * D * y1 / L
    print("[1] Stefan tube (ethanol, 25 C, 1 atm, L = 8 cm, D = 0.125 cm2/s)")
    print("   c = %.2f mol/m3, yA1 = %.4f, N_A = %.4e mol/m2 s, Fick = %.4e (ratio %.4f)" % (c, y1, N, Nf, N / Nf))
    print("   daily loss = %.3f kg/m2" % (N * 0.04607 * 86400))
    print()
    print("[2] Deal-Grove, dry O2 on (111) Si, target x = 0.1 um")
    for Tc in (1100.0, 1000.0):
        Tk = Tc + 273.15
        B = 772.0 * math.exp(-1.23 / (KB_EV * Tk))
        BA = 6.23e6 * math.exp(-2.0 / (KB_EV * Tk))
        A = B / BA
        t = (0.1 ** 2 + A * 0.1) / B
        print("   %4.0f C: B = %.4f um2/h, B/A = %.4f um/h, A = %.4f um, t = %.3f h" % (Tc, B, BA, A, t))
    print()
    k1 = 8.5e3 * 0.2
    Dc, d = 1.9e-9, 40e-6
    Ha = d * math.sqrt(k1 / Dc)
    print("[3] Reactive absorption of CO2 in 0.2 M NaOH: k1 = %.0f 1/s" % k1)
    print("   Ha = %.2f, E = %.2f, k_c(phys) = %.3e m/s, k_c(react) = %.3e m/s" % (Ha, Ha / math.tanh(Ha), Dc / d, math.sqrt(Dc * k1)))
    print()
    target = 1e17 / 2.5e20
    phi = bisect(lambda p: math.erfc(p) - target, 0.0, 6.0)
    Dp, t = 6.5e-13, 1800.0
    print("[4] Junction depth: erfc(phi) = %.1e -> phi = %.4f, z = %.3f um" % (target, phi, 2 * phi * math.sqrt(Dp * t) * 1e4))
    print()
    print("[5] Slab uptake (both faces, L = 50 um, D = 1e-12 m2/s)")
    for f in (0.5, 0.9):
        Fo = bisect(lambda x: slab_uptake(x) - f, 1e-6, 2.0)
        print("   M/Minf = %.1f: Fo = %.4f, t = %.1f s" % (f, Fo, Fo * (50e-6) ** 2 / 1e-12))
    print("   short-time form 4 sqrt(Fo/pi) = 0.5 -> Fo = %.4f" % (math.pi / 64))
    print()
    print("[6] Sphere release (R = 0.5 mm, D = 1e-11 m2/s)")
    for left in (0.5, 0.1):
        tau = bisect(lambda x: sphere_left(x) - left, 1e-6, 2.0)
        print("   m/m0 = %.1f: tau = %.4f, t = %.1f min" % (left, tau, tau * (0.5e-3) ** 2 / 1e-11 / 60))
    print("   one-term (6/pi^2) exp(-pi^2 tau) = 0.1 -> tau = %.4f" % (math.log(6 / math.pi ** 2 / 0.1) / math.pi ** 2))


main()
