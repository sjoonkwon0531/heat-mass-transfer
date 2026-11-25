# Week 15 · Topic 1 — Linear stability and the Turing instability
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   2x2 system: lambda^2 - T lambda + Delta = 0
#   reaction-diffusion: W_t = D lap W + J W  ->  lambda(k) = eig(J - k^2 D)
#   Example: Lengyel-Epstein (CDIMA) model
#     u_t = a - u - 4uv/(1+u^2) + lap u
#     v_t = sigma [ b (u - uv/(1+u^2)) + d lap v ]
import math


def eig2(a11, a12, a21, a22):
    """Eigenvalues of a 2x2 matrix as (re1, im1, re2, im2), re1 >= re2."""
    T = a11 + a22
    De = a11 * a22 - a12 * a21
    disc = T * T - 4 * De
    if disc >= 0:
        r = math.sqrt(disc)
        return (T + r) / 2, 0.0, (T - r) / 2, 0.0
    r = math.sqrt(-disc)
    return T / 2, r / 2, T / 2, -r / 2


def classify(a11, a12, a21, a22):
    T = a11 + a22
    De = a11 * a22 - a12 * a21
    if De < 0:
        return "saddle"
    if T * T - 4 * De < 0:
        if T < 0:
            return "stable spiral"
        return "unstable spiral" if T > 0 else "center"
    return "stable node" if T < 0 else "unstable node"


def le_jacobian(a, b, sigma):
    u = a / 5.0
    v = 1 + u * u
    q = 1 + u * u
    fu = (3 * u * u - 5) / q
    fv = -4 * u / q
    gu = sigma * 2 * b * u * u / q
    gv = -sigma * b * u / q
    return u, v, fu, fv, gu, gv


def lam_max(fu, fv, gu, gv, d, k):
    k2 = k * k
    re1, _, _, _ = eig2(fu - k2, fv, gu, gv - d * k2)
    return re1


def main():
    print("Topic 1 — linear stability and the Turing instability\n")
    print("[1] Classification of 2x2 linear systems (trace T, determinant Delta)")
    cases = [(-1, 0, 0, -2), (1, 0, 0, 2), (1, 0, 0, -1), (-0.5, -2, 2, -0.5), (0.5, -2, 2, 0.5), (0, -1, 1, 0)]
    for c in cases:
        T = c[0] + c[3]
        De = c[0] * c[3] - c[1] * c[2]
        e = eig2(*c)
        print("   A = [[%5.2f %5.2f] [%5.2f %5.2f]]  T = %5.2f  Delta = %5.2f  lambda = %.3f%+.3fi, %.3f%+.3fi  -> %s"
              % (c[0], c[1], c[2], c[3], T, De, e[0], e[1], e[2], e[3], classify(*c)))
    print()

    a, b, sigma, dd = 12.0, 0.3, 50.0, 1.0
    u, v, fu, fv, gu, gv = le_jacobian(a, b, sigma)
    d = sigma * dd  # effective diffusivity ratio of v to u
    print("[2] Lengyel-Epstein model: a = %.0f, b = %.1f, sigma = %.0f, d = %.1f" % (a, b, sigma, dd))
    print("   steady state u* = %.4f, v* = %.4f" % (u, v))
    print("   J = [[%.4f %.4f] [%.4f %.4f]]" % (fu, fv, gu, gv))
    T = fu + gv
    De = fu * gv - fv * gu
    print("   without diffusion: T = %.4f (< 0), Delta = %.4f (> 0) -> %s" % (T, De, classify(fu, fv, gu, gv)))
    c1 = d * fu + gv
    c2 = c1 * c1 / (4 * d)
    print("   condition 1: d_eff*R11 + R22 = %.4f (> 0 needed)" % c1)
    print("   condition 2: Delta = %.4f < (d_eff*R11 + R22)^2/(4 d_eff) = %.4f" % (De, c2))
    kc2 = c1 / (2 * d)
    print("   k* (minimum of det) = %.4f, L_c = 2 pi/k* = %.4f" % (math.sqrt(kc2), 2 * math.pi / math.sqrt(kc2)))
    best_k, best_l = 0.0, -1e9
    for i in range(30001):
        k = 3.0 * i / 30000
        l = lam_max(fu, fv, gu, gv, d, k)
        if l > best_l:
            best_k, best_l = k, l
    print("   fastest-growing mode (max Re lambda): k_m = %.4f, lambda_m = %.4f, wavelength 2 pi/k_m = %.4f" % (best_k, best_l, 2 * math.pi / best_k))
    lo = hi = None
    for i in range(30001):
        k = 3.0 * i / 30000
        if lam_max(fu, fv, gu, gv, d, k) > 0:
            if lo is None:
                lo = k
            hi = k
    print("   unstable band: %.4f < k < %.4f" % (lo, hi))
    print("   (min-det k* equals the fastest mode only at onset; here they differ by %.1f%%)" % (100 * (math.sqrt(kc2) / best_k - 1)))
    print()
    print("[3] Critical diffusivity ratio: smallest d_eff giving a Turing band")
    lo_d, hi_d = 1.0, 200.0
    for _ in range(80):
        m = 0.5 * (lo_d + hi_d)
        c1m = m * fu + gv
        ok = c1m > 0 and De < c1m * c1m / (4 * m)
        if ok:
            hi_d = m
        else:
            lo_d = m
    print("   d_c = %.4f (sigma*d must exceed this)" % hi_d)


main()
