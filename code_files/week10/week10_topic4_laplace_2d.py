# Week 10 - Topic 4: Two-Dimensional Steady Diffusion (Laplace Equation)
# Lecture (Part 2):
#   * rectangle 0<x<W, 0<y<H: c = 0 on x=0, x=W, y=0; c = c0 on y=H
#       c/c0 = sum_{n odd} (4/(n pi)) sin(n pi x/W) sinh(n pi y/W)/sinh(n pi H/W)
#   * TEOS stagnant gas between two wafers (LPCVD furnace): cylindrical (r, z)
#       (1/r) d/dr(r dc/dr) + d^2c/dz^2 = 0
#       c = c_A0 at r = R (open edge), c = 0 at z = 0 (fast surface reaction on the wafer),
#       dc/dr = 0 at r = 0, dc/dz = 0 at z = L/2 (mid-plane symmetry)
#     deposition flux on the wafer N(r) = D dc/dz|_{z=0}: the edge receives more than the center.
#   * extension: finite surface rate D dc/dz = ks c at the wafer, Da = ks L/D.
#     For a thin gap (L << R) the gap-averaged balance gives a Bessel problem:
#       c = c_A0 I0(m r)/I0(m R),  m^2 = 2 ks/(D L),  Thiele modulus Phi = m R
#     centre/edge deposition ratio = 1/I0(Phi): uniform wafers need Phi < ~0.5
#     (reaction-limited LPCVD), which is why TEOS furnaces can stack wafers closely.

import math


def rect_series(x, y, W=1.0, H=1.0, nterms=101):
    s = 0.0
    for n in range(1, nterms + 1, 2):
        a = n * math.pi / W
        # sinh ratio written to avoid overflow for large n
        ratio = math.exp(a * (y - H)) * (1 - math.exp(-2 * a * y)) / (1 - math.exp(-2 * a * H))
        s += 4 / (n * math.pi) * math.sin(a * x) * ratio
    return s


def rect_sor(N=40, W=1.0, H=1.0, omega=1.85, tol=1e-9):
    h = W / N
    M = int(round(H / h))
    c = [[0.0] * (N + 1) for _ in range(M + 1)]
    for i in range(1, N):
        c[M][i] = 1.0
    for it in range(20000):
        err = 0.0
        for j in range(1, M):
            for i in range(1, N):
                new = 0.25 * (c[j][i - 1] + c[j][i + 1] + c[j - 1][i] + c[j + 1][i])
                d = omega * (new - c[j][i]); c[j][i] += d; err = max(err, abs(d))
        if err < tol:
            return c, it + 1
    return c, it + 1


def I0(x):
    # modified Bessel function of the first kind, order 0 (power series)
    s, term, k = 1.0, 1.0, 1
    while True:
        term *= (x / (2 * k)) ** 2
        s += term
        if term < 1e-16 * s:
            return s
        k += 1


def thin_gap(r, R, Da, L):
    """gap-averaged model: (1/r)(r c')' = (2 ks/(D L)) c -> c = I0(m r)/I0(m R)."""
    m = math.sqrt(2 * Da) / L          # Da = ks L / D,  m^2 = 2 ks/(D L)
    return I0(m * r) / I0(m * R)


def wafer_sor(R=1.0, L=0.1, Da=0.01, Nr=80, Nz=10, omega=1.9, tol=1e-10, maxit=200000):
    """FDM on r in [0,R], z in [0,L/2]; Robin BC D dc/dz = ks c on the wafer (z = 0).
    Da = ks L/D; Da -> infinity recovers the lecture case c = 0 on the wafer."""
    dr, dz = R / Nr, (L / 2) / Nz
    c = [[1.0 if i == Nr else 0.0 for i in range(Nr + 1)] for _ in range(Nz + 1)]
    ar, az = 1 / dr ** 2, 1 / dz ** 2
    beta = 2 * dz * Da / L
    for it in range(maxit):
        err = 0.0
        for j in range(1, Nz + 1):
            for i in range(0, Nr):
                up = c[j + 1][i] if j < Nz else c[j - 1][i]       # symmetry at z = L/2
                dn = c[j - 1][i]
                if i == 0:                                        # r = 0 (L'Hopital)
                    new = (4 * ar * c[j][1] + az * (up + dn)) / (4 * ar + 2 * az)
                else:
                    r = i * dr
                    w = (1 - dr / (2 * r)) * ar; e = (1 + dr / (2 * r)) * ar
                    new = (w * c[j][i - 1] + e * c[j][i + 1] + az * (up + dn)) / (2 * ar + 2 * az)
                d = omega * (new - c[j][i]); c[j][i] += d; err = max(err, abs(d))
        for i in range(0, Nr):                                    # wafer surface node
            new = (4 * c[1][i] - c[2][i]) / (3 + beta)
            err = max(err, abs(new - c[0][i])); c[0][i] = new
        if err < tol:
            break
    flux = [Da * c[0][i] for i in range(Nr + 1)]                  # (L/(D c0)) N_wafer
    return c, flux, it + 1


if __name__ == "__main__":
    print("Rectangle W = H = 1, c/c0 at (x, y):")
    cs, its = rect_sor()
    for (x, y) in ((0.5, 0.5), (0.25, 0.75), (0.5, 0.9), (0.1, 0.5)):
        i, j = int(round(x * 40)), int(round(y * 40))
        print(f"  ({x:.2f},{y:.2f})  series = {rect_series(x, y):.5f}   SOR(40x40) = {cs[j][i]:.5f}")
    print("  SOR iterations:", its, "   centre value exact = 0.25 by superposition")
    print("  Gibbs: partial sums at (0.02, 1.0):",
          [round(rect_series(0.02, 1.0, nterms=n), 4) for n in (5, 21, 101)])

    print("\nTEOS wafer gap: R = 1, gap L = 0.1, Robin BC with Da = ks L/D")
    print("  Thiele modulus Phi = R sqrt(2 Da)/L ; centre/edge deposition = 1/I0(Phi)")
    print("  Da        Phi     FDM centre/edge   thin-gap 1/I0(Phi)   SOR its")
    for Da in (1e-4, 1e-3, 1e-2, 5e-2):
        c, f, its = wafer_sor(Da=Da)
        Phi = math.sqrt(2 * Da) / 0.1
        print(f"  {Da:7.1e}  {Phi:6.3f}   {c[0][0]:.4f}            {thin_gap(0, 1, Da, 0.1):.4f}             {its}")
    print("  radial profile at Da = 1e-2 (Phi = 1.414):")
    c, f, _ = wafer_sor(Da=1e-2)
    for frac in (0.0, 0.25, 0.5, 0.75, 1.0):
        i = int(round(frac * 80))
        print(f"    r/R = {frac:4.2f}   FDM c_wafer = {c[0][i]:.4f}   thin-gap = {thin_gap(frac, 1, 1e-2, 0.1):.4f}")
