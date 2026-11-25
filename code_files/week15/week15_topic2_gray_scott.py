# Week 15 · Topic 2 — Gray-Scott reaction-diffusion patterns (explicit finite differences)
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   U + 2V -> 3V,  V -> P,  U fed at rate F, both drained:
#   U_t = Du lap U - U V^2 + F (1 - U)
#   V_t = Dv lap V + U V^2 - (F + k) V
#   grid spacing 1, time step 1, periodic boundaries, 5-point Laplacian
import numpy as np

N = 96
DU, DV, DT = 0.16, 0.08, 1.0
STEPS = 6000


def lcg_field(n, seed):
    """Reproducible uniform numbers in [0, 1) from a 32-bit LCG (same in every language)."""
    out = np.empty(n * n)
    s = seed
    for i in range(n * n):
        s = (1664525 * s + 1013904223) % 4294967296
        out[i] = s / 4294967296.0
    return out.reshape(n, n)


def lap(Z):
    return ((np.roll(Z, 1, 0) + np.roll(Z, -1, 0)) + (np.roll(Z, 1, 1) + np.roll(Z, -1, 1))) - 4.0 * Z


def run(F, k):
    U = np.ones((N, N))
    V = np.zeros((N, N))
    r = lcg_field(N, 12345)
    c0, c1 = N // 2 - 8, N // 2 + 8
    U[c0:c1, c0:c1] = 0.50
    V[c0:c1, c0:c1] = 0.25
    U = U + 0.02 * (r - 0.5)
    V = V + 0.02 * (r - 0.5)
    for _ in range(STEPS):
        uvv = (U * V) * V
        Un = U + DT * ((DU * lap(U) - uvv) + F * (1.0 - U))
        Vn = V + DT * ((DV * lap(V) + uvv) - (F + k) * V)
        U, V = Un, Vn
    return U, V


def ascii_map(V, rows=24, cols=48):
    chars = " .:-=+*#%@"
    lines = []
    for i in range(rows):
        row = ""
        for j in range(cols):
            v = V[i * N // rows, j * N // cols]
            idx = int(min(9, max(0, v / 0.4 * 9.999)))
            row += chars[idx]
        lines.append("   |" + row + "|")
    return "\n".join(lines)


def main():
    print("Topic 2 — Gray-Scott patterns: N = %d, Du = %.2f, Dv = %.2f, dt = %.1f, %d steps\n" % (N, DU, DV, DT, STEPS))
    print("[1] Homogeneous states: (U, V) = (1, 0) always; nontrivial states need")
    print("    F/(F+k)^2 >= 4 i.e. V = [1 +/- sqrt(1 - 4(F+k)^2/F)] F/(2(F+k))")
    for F, k in [(0.035, 0.060), (0.040, 0.060), (0.060, 0.062)]:
        disc = 1 - 4 * (F + k) ** 2 / F
        if disc >= 0:
            vs = [(1 + s * disc ** 0.5) * F / (2 * (F + k)) for s in (1, -1)]
            print("    F = %.3f, k = %.3f: V = %.4f, %.4f" % (F, k, vs[0], vs[1]))
        else:
            print("    F = %.3f, k = %.3f: only the trivial state" % (F, k))
    print()
    presets = [("spots", 0.035, 0.065), ("stripes/labyrinth", 0.060, 0.062), ("mixed", 0.025, 0.060)]
    for name, F, k in presets:
        U, V = run(F, k)
        print("[%s] F = %.3f, k = %.3f" % (name, F, k))
        print("   mean U = %.5f, mean V = %.5f, area fraction V > 0.2 = %.4f" % (U.mean(), V.mean(), (V > 0.2).mean()))
        print(ascii_map(V))
        print()


main()
