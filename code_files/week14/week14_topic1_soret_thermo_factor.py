"""
Week 14 · Topic 1 — Coupled fluxes: Soret separation and the thermodynamic factor
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  Soret (thermal diffusion) between two plates, no net flux of A:
      dx_A = -x_A x_B alpha_A d(ln T)   =>   x_A(L) - x_A(0) ≈ -x_A x_B alpha_A ln(T_L / T_0)
  Cascade of n identical stages (small separation per stage): separation factors multiply.
  Non-ideal binary solution, two-suffix Margules model ln(gamma_1) = A x_2^2:
      D* = (1 + d ln gamma_1 / d ln x_1) D = (1 - 2 A x_1 x_2) D
      D* < 0 (uphill diffusion, spinodal) when 2 A x_1 x_2 > 1, i.e. only if A > 2.
"""
import math


def soret_shift(xA, alpha, TL, T0):
    return -xA * (1 - xA) * alpha * math.log(TL / T0)


def soret_exact(xA0, alpha, TL, T0):
    """Exact solution of dx/dlnT = -alpha x (1 - x) with x(T0) = xA0 (constant alpha)."""
    r = xA0 / (1 - xA0) * (T0 / TL) ** alpha
    return r / (1 + r)


def thermo_factor(x1, A):
    return 1.0 - 2.0 * A * x1 * (1.0 - x1)


def main():
    print("Topic 1 — Soret separation and the thermodynamic factor\n")
    print("[1] Lecture example: alpha_A = 0.3, T_L = 300 K, T_0 = 200 K, x_A = x_B = 0.5")
    lin = soret_shift(0.5, 0.3, 300, 200)
    ex = soret_exact(0.5, 0.3, 300, 200) - 0.5
    print(f"   linearised x_A(L) - x_A(0) = {lin:+.4f}")
    print(f"   exact (integrated)         = {ex:+.4f}")
    print("   Sign: with alpha_A > 0 the heavier species A gathers at the cold wall (y = 0).\n")

    print("[2] Effect of the temperature ratio (alpha_A = 0.3, x_A = 0.5)")
    for ratio in (1.1, 1.5, 2.0, 3.0, 5.0):
        print(f"   T_L/T_0 = {ratio:4.1f}   shift = {soret_shift(0.5, 0.3, ratio, 1.0):+.4f}")
    print()

    print("[3] Cascade: separation factor per stage q = (T_L/T_0)^alpha, n stages -> q^n")
    q = (300 / 200) ** 0.3
    for n in (1, 5, 10, 20, 50):
        print(f"   n = {n:3d}   q^n = {q ** n:10.3f}")
    print("   (This is why thermal diffusion columns can separate isotopes despite a tiny alpha.)\n")

    print("[4] Thermodynamic factor 1 + dln(gamma)/dln(x) for a Margules solution")
    print("     x1      A=0.5     A=1.5     A=2.5")
    for x1 in (0.1, 0.2, 0.3, 0.4, 0.5):
        print(f"   {x1:5.2f}   {thermo_factor(x1, 0.5):7.3f}   {thermo_factor(x1, 1.5):7.3f}   {thermo_factor(x1, 2.5):7.3f}")
    A = 2.5
    xs = 0.5 * (1 - math.sqrt(1 - 2 / A))
    print(f"   For A = {A}: D* < 0 for {xs:.3f} < x1 < {1 - xs:.3f} (spinodal region, uphill diffusion)")


if __name__ == "__main__":
    main()
