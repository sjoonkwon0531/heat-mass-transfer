"""
Week 14 · Topic 2 — Stefan–Maxwell equations: A diffusing through a stagnant B + C mixture
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  Stefan–Maxwell (ideal gas): dx_i/dz = sum_j (x_i N_j - x_j N_i) / (C D_ij)
  With N_B = N_C = 0 (B and C stagnant):
      dx_B/dz = x_B N_A / (C D_AB),   dx_C/dz = x_C N_A / (C D_AC)
  =>  x_B(z) = x_B(L) exp[-N_A (L - z)/(C D_AB)],  x_C(z) = x_C(L) exp[-N_A (L - z)/(C D_AC)]
  N_A is fixed by x_A(0) = 1 - x_B(0) - x_C(0).
  Binary check: with C absent this is N_A = (C D_AB / L) ln[(1 - x_A,L)/(1 - x_A,0)].
  Effective (Wilke) diffusivity for A through stagnant B + C:  D_A,mix = (1 - x_A)/(x_B/D_AB + x_C/D_AC).
"""
import math


def solve_NA(xA0, xBL, xCL, L, C, DAB, DAC):
    def resid(N):
        xB0 = xBL * math.exp(-N * L / (C * DAB))
        xC0 = xCL * math.exp(-N * L / (C * DAC))
        return (1 - xB0 - xC0) - xA0
    lo, hi = 0.0, 1.0
    while resid(hi) < 0:
        hi *= 2
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if resid(mid) < 0:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def main():
    print("Topic 2 — Stefan–Maxwell: A through stagnant B + C\n")
    C, L = 40.9, 0.10          # mol/m3 (1 atm, 298 K), tube length m
    DAB, DAC = 2.6e-5, 9.0e-5  # m2/s, illustrative (B = N2-like, C = H2-like)
    xA0, xAL = 0.20, 0.0
    print(f"   C = {C} mol/m3, L = {L} m, D_AB = {DAB:.1e}, D_AC = {DAC:.1e} m2/s, x_A(0) = {xA0}, x_A(L) = 0\n")

    print("[1] Binary check (no C): Stefan–Maxwell versus the log formula")
    N_sm = solve_NA(xA0, 1.0, 0.0, L, C, DAB, DAC)
    N_log = C * DAB / L * math.log((1 - xAL) / (1 - xA0))
    print(f"   N_A (Stefan–Maxwell) = {N_sm:.6e} mol/(m2 s)")
    print(f"   N_A (log formula)    = {N_log:.6e} mol/(m2 s)\n")

    print("[2] Ternary: top gas is a B + C mixture")
    print("    x_C(L)     N_A (mol/m2 s)    D_A,mix at the top (m2/s)")
    for xCL in (0.0, 0.25, 0.5, 0.75, 1.0):
        xBL = 1 - xCL
        N = solve_NA(xA0, xBL, xCL, L, C, DAB, DAC)
        Dmix = 1.0 / (xBL / DAB + xCL / DAC)
        print(f"    {xCL:5.2f}      {N:.4e}        {Dmix:.3e}")
    print("   (Adding the fast partner C raises the flux of A.)\n")

    print("[3] Composition profiles for x_C(L) = 0.5")
    N = solve_NA(xA0, 0.5, 0.5, L, C, DAB, DAC)
    print("     z/L      x_A       x_B       x_C")
    for k in range(6):
        z = L * k / 5
        xB = 0.5 * math.exp(-N * (L - z) / (C * DAB))
        xC = 0.5 * math.exp(-N * (L - z) / (C * DAC))
        print(f"    {z / L:4.1f}    {1 - xB - xC:.4f}    {xB:.4f}    {xC:.4f}")
    print("   B (slow partner) is depleted near the liquid more than C: x_B/x_C is not constant.")


if __name__ == "__main__":
    main()
