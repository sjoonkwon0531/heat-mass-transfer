# Week 11 - Topic 1: Unsteady 1D Diffusion - Semi-Infinite Medium and Finite Slab
# Lecture (Part 1):
#   * Fick's second law (1D, no reaction, no bulk motion): dc/dt = D d2c/dz2
#   * semi-infinite medium, c(z,0) = c0, c(0,t) = cs, c(inf,t) = c0  (Laplace transform):
#       (c - c0)/(cs - c0) = erfc( z / (2 sqrt(D t)) )
#       surface flux  N(0,t) = (cs - c0) sqrt(D/(pi t))       (decays as t^-1/2)
#       uptake per area  W/S = 2 (cs - c0) sqrt(D t / pi)       (grows as t^1/2)
#   * finite slab 0 < z < L, c = cs on both faces, Y = (c - cs)/(c0 - cs):
#       Y = (4/pi) sum_k 1/(2k-1) sin((2k-1) pi z/L) exp(-(2k-1)^2 pi^2 D t / L^2)
#       fractional uptake  M(t)/M_inf = 1 - sum_k 8/((2k-1)^2 pi^2) exp(-(2k-1)^2 pi^2 Fo),  Fo = D t/L^2
#   * case study (lecture): P diffusion into Si, cs = 2.5e20 cm^-3, target 2.5e18 cm^-3,
#     D = 6.5e-13 cm^2/s at 1373 K, t = 1 h  ->  erfc(phi) = 0.01, phi = 1.82, z = 1.76 um
# This script: (1) erfc profile, flux and uptake, (2) the doping-depth case,
# (3) Fourier series versus a Crank-Nicolson finite-difference solution,
# (4) when the semi-infinite (short-time) result stops being valid for a slab.

import math


def erfc_inv(y, lo=0.0, hi=10.0):
    """inverse of erfc on (0, 1] by bisection"""
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if math.erfc(mid) > y:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def semi_infinite(z, t, D):
    return math.erfc(z / (2.0 * math.sqrt(D * t)))


def slab_series(z, t, D, L, nterms=200):
    s = 0.0
    for k in range(1, nterms + 1):
        m = 2 * k - 1
        s += 4.0 / (m * math.pi) * math.sin(m * math.pi * z / L) * math.exp(-(m * math.pi / L) ** 2 * D * t)
    return s  # Y = (c - cs)/(c0 - cs)


def slab_uptake(Fo, nterms=200):
    s = 0.0
    for k in range(1, nterms + 1):
        m = 2 * k - 1
        s += 8.0 / (m * m * math.pi ** 2) * math.exp(-(m * math.pi) ** 2 * Fo)
    return 1.0 - s


def thomas(a, b, c, d):
    n = len(d)
    cp, dp = [0.0] * n, [0.0] * n
    cp[0], dp[0] = c[0] / b[0], d[0] / b[0]
    for i in range(1, n):
        m = b[i] - a[i] * cp[i - 1]
        cp[i] = c[i] / m if i < n - 1 else 0.0
        dp[i] = (d[i] - a[i] * dp[i - 1]) / m
    x = [0.0] * n
    x[-1] = dp[-1]
    for i in range(n - 2, -1, -1):
        x[i] = dp[i] - cp[i] * x[i + 1]
    return x


def slab_crank_nicolson(Fo_end, N=100, steps=2000):
    """Y on 0..1 (z/L), Y = 1 inside at t = 0, Y = 0 on both faces"""
    h = 1.0 / N
    dt = Fo_end / steps
    r = dt / h ** 2
    Y = [1.0] * (N + 1)
    Y[0] = Y[N] = 0.0
    n = N - 1
    a = [-r / 2] * n
    b = [1 + r] * n
    c = [-r / 2] * n
    for _ in range(steps):
        d = [r / 2 * Y[i - 1] + (1 - r) * Y[i] + r / 2 * Y[i + 1] for i in range(1, N)]
        Y[1:N] = thomas(a, b, c, d)
    return Y


if __name__ == "__main__":
    print("=== 1. Semi-infinite medium: profile, flux, uptake ===")
    D = 1.0e-9          # m^2/s (a small solute in water)
    dc = 1.0            # cs - c0, mol/m^3
    for t in (10.0, 100.0, 1000.0):
        delta = math.sqrt(D * t)
        flux = dc * math.sqrt(D / (math.pi * t))
        up = 2 * dc * math.sqrt(D * t / math.pi)
        print(f"t = {t:7.0f} s: sqrt(Dt) = {delta*1e6:7.1f} um, "
              f"N(0) = {flux:.3e} mol/m2/s, uptake = {up:.3e} mol/m2")
    print(f"  N(0) x sqrt(t) = dc sqrt(D/pi) = {dc*math.sqrt(D/math.pi):.4e} for every t")

    print("\n=== 2. Case: P doping of Si (lecture) ===")
    cs, ctarget = 2.5e20, 2.5e18          # atoms/cm^3
    Dp, t = 6.5e-13, 3600.0                # cm^2/s, s
    phi = erfc_inv(ctarget / cs)
    z = 2 * phi * math.sqrt(Dp * t)
    print(f"erfc(phi) = {ctarget/cs:.3f}  ->  phi = {phi:.3f}")
    print(f"depth for 2.5e18 cm^-3 after 1 h at 1373 K: z = {z*1e4:.2f} um   (lecture: 1.76 um)")
    for hours in (0.25, 1, 4):
        print(f"  t = {hours:4.2f} h -> z = {2*phi*math.sqrt(Dp*hours*3600)*1e4:.2f} um  (depth ~ sqrt(t))")

    print("\n=== 3. Finite slab: Fourier series vs Crank-Nicolson ===")
    for Fo in (0.01, 0.05, 0.2):
        Ycn = slab_crank_nicolson(Fo)
        err = max(abs(Ycn[i] - slab_series(i / 100, Fo, 1.0, 1.0)) for i in range(101))
        print(f"Fo = {Fo:4.2f}: Y(centre) series = {slab_series(0.5, Fo, 1, 1):.5f}, "
              f"CN = {Ycn[50]:.5f}, max |diff| = {err:.1e}")
    print("terms needed at t = 0+ (Gibbs): the series converges slowly near the faces;")
    for nt in (1, 5, 50):
        print(f"  {nt:3d} terms: Y(z/L = 0.02, Fo = 0) = {slab_series(0.02, 0.0, 1, 1, nt):.3f} (exact 1)")

    print("\n=== 4. When is a slab 'semi-infinite'? ===")
    print("  Fo      exact M/Minf   short-time 4 sqrt(Fo/pi)   error")
    for Fo in (0.001, 0.01, 0.03, 0.05, 0.1, 0.2):
        ex = slab_uptake(Fo)
        st = 4 * math.sqrt(Fo / math.pi)
        print(f"  {Fo:5.3f}   {ex:.4f}         {st:.4f}                  {100*(st-ex)/ex:6.2f}%")
    print("-> the two faces do not 'see' each other until Fo ~ 0.05 (error about 0.1%)")
