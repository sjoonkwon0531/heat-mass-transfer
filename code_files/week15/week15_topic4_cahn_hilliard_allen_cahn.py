# Week 15 · Topic 4 — Spinodal decomposition (Cahn-Hilliard, conserved) vs. domain coarsening
#                      (Allen-Cahn, non-conserved): explicit finite differences
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   f(c) = 1/4 - c^2/2 + c^4/4 (double well, c = +/-1 are the two phases),  mu = c^3 - c - gamma lap c
#   Cahn-Hilliard:  c_t = lap mu         (mean of c conserved)
#   Allen-Cahn:     c_t = -mu            (mean of c not conserved)
#   linear CH about c0: omega(q) = q^2 (1 - 3 c0^2) - gamma q^4  ->  q_m^2 = (1 - 3 c0^2)/(2 gamma)
#   grid spacing h = 1, periodic boundaries, 5-point Laplacian
import math
import numpy as np

N = 64
GAMMA = 1.0
DT = 0.01
REPORT = (10, 50, 100, 200)


def lcg_field(n, seed):
    out = np.empty(n * n)
    s = seed
    for i in range(n * n):
        s = (1664525 * s + 1013904223) % 4294967296
        out[i] = s / 4294967296.0
    return out.reshape(n, n)


def lap(Z):
    return ((np.roll(Z, 1, 0) + np.roll(Z, -1, 0)) + (np.roll(Z, 1, 1) + np.roll(Z, -1, 1))) - 4.0 * Z


def chord_length(c):
    """Mean chord length: 2 N^2 / (number of sign changes between neighbours, x and y)."""
    s = c > 0
    n = int((s != np.roll(s, 1, 0)).sum() + (s != np.roll(s, 1, 1)).sum())
    return 2.0 * N * N / n if n > 0 else float("inf")


def simulate(kind, c0):
    c = c0 + 0.1 * (lcg_field(N, 2024) - 0.5)
    out = []
    t_steps = [int(round(T / DT)) for T in REPORT]
    step = 0
    for target in t_steps:
        while step < target:
            mu = ((c * c) * c - c) - GAMMA * lap(c)
            if kind == "CH":
                c = c + DT * lap(mu)
            else:
                c = c - DT * mu
            step += 1
        out.append((step * DT, c.mean(), chord_length(c), (c > 0).mean()))
    return c, out


def ascii_map(c, rows=16, cols=32):
    lines = []
    for i in range(rows):
        lines.append("   |" + "".join("#" if c[i * N // rows, j * N // cols] > 0 else "." for j in range(cols)) + "|")
    return "\n".join(lines)


def main():
    print("Topic 4 — Cahn-Hilliard vs. Allen-Cahn: N = %d, gamma = %.1f, dt = %.2f\n" % (N, GAMMA, DT))
    print("[1] Linear stability of the uniform state c0 (Cahn-Hilliard)")
    for c0 in (0.0, -0.3, -0.5, -0.6):
        a = 1 - 3 * c0 * c0
        if a <= 0:
            print("   c0 = %+.1f: 1 - 3 c0^2 = %.2f <= 0 -> outside the spinodal, no linear growth" % (c0, a))
        else:
            qm = math.sqrt(a / (2 * GAMMA))
            print("   c0 = %+.1f: q_c = %.4f, q_m = %.4f, lambda_m = %.3f, omega_max = %.4f"
                  % (c0, math.sqrt(a / GAMMA), qm, 2 * math.pi / qm, a * a / (4 * GAMMA)))
    print()
    for kind, c0 in (("CH", 0.0), ("CH", -0.3), ("AC", 0.0)):
        c, out = simulate(kind, c0)
        print("[%s, c0 = %+.1f]" % ("Cahn-Hilliard" if kind == "CH" else "Allen-Cahn", c0))
        print("     t      mean c     chord length    area fraction c > 0")
        for t, m, L, a in out:
            Ls = "%8.3f" % L if math.isfinite(L) else "  (none)"
            print("   %5.0f   %+.6f   %s        %.4f" % (t, m, Ls, a))
        print(ascii_map(c))
        print()


main()
