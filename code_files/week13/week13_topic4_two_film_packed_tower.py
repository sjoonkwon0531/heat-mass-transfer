"""
Week 13 · Topic 4 — Two-resistance theory and packed-tower design
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  Two films in series, linear equilibrium y* = m x (mole fractions):
      N_A = k_y (y - y_i) = k_x (x_i - x) = K_y (y - y*),   1/K_y = 1/k_y + m/k_x,   1/K_x = 1/(m k_y) + 1/k_x
  Dilute counter-current absorber (gas enters at the bottom b, liquid at the top a):
      operating line  y = (L/V) x + (y_a - (L/V) x_a)
      (L/V)_min = (y_b - y_a) / (y_b/m - x_a)
      NTU_OG = ∫ dy / (y - y*);  for straight lines with A = L/(mV):
      NTU_OG = ln[(1 - 1/A)(y_b - m x_a)/(y_a - m x_a) + 1/A] / (1 - 1/A)
      Z = HTU_OG × NTU_OG,  HTU_OG = G_M / (K_y a)
"""
import math


def two_film(y, x, m, ky, kx):
    Ky = 1.0 / (1.0 / ky + m / kx)
    N = Ky * (y - m * x)
    yi = y - N / ky
    xi = x + N / kx
    gas_share = (1.0 / ky) / (1.0 / Ky)
    return N, yi, xi, Ky, gas_share


def ntu_numeric(yb, ya, xa, LV, m, n=20000):
    """Trapezoid rule for ∫ dy / (y - m x(y)) along the operating line."""
    h = (yb - ya) / n
    s = 0.0
    for i in range(n + 1):
        y = ya + i * h
        x = xa + (y - ya) / LV
        f = 1.0 / (y - m * x)
        s += f * (0.5 if i in (0, n) else 1.0)
    return s * h


def ntu_colburn(yb, ya, xa, LV, m):
    A = LV / m
    return math.log((1 - 1 / A) * (yb - m * xa) / (ya - m * xa) + 1 / A) / (1 - 1 / A)


def main():
    print("Topic 4 — two-resistance theory and packed-tower design\n")

    print("[1] Two films in series: k_y = 1e-3, k_x = 5e-3 kmol/(m2 s), y = 0.05, x = 0")
    print("        system          m        K_y          gas-film share   y_i       x_i")
    for name, m in (("very soluble (NH3-like)", 0.8), ("moderate", 30.0), ("sparingly soluble (O2-like)", 4.3e4)):
        N, yi, xi, Ky, share = two_film(0.05, 0.0, m, 1e-3, 5e-3)
        print(f"   {name:28s} {m:8.3g}   {Ky:.3e}    {share * 100:6.2f} %      {yi:.5f}   {xi:.3e}")
    print("   (Small m: gas film controls. Large m: liquid film controls.)\n")

    print("[2] Dilute absorber: y_b = 0.020 in, 95% recovery, clean solvent x_a = 0, m = 1.2")
    yb, xa, m = 0.020, 0.0, 1.2
    ya = yb * (1 - 0.95)
    LVmin = (yb - ya) / (yb / m - xa)
    print(f"   y_a = {ya:.4f},  (L/V)_min = {LVmin:.4f}")
    for factor in (1.1, 1.5, 2.0, 3.0):
        LV = factor * LVmin
        A = LV / m
        n_num = ntu_numeric(yb, ya, xa, LV, m)
        n_col = ntu_colburn(yb, ya, xa, LV, m)
        xb = xa + (yb - ya) / LV
        print(f"   L/V = {factor:.1f}×min = {LV:.4f}   A = {A:.3f}   x_b = {xb:.5f}   "
              f"NTU_OG = {n_col:.3f} (numerical {n_num:.3f})")
    print()

    print("[3] Height: G_M = 0.020 kmol/(m2 s), K_y a = 0.040 kmol/(m3 s)  ->  HTU_OG = 0.50 m")
    HTU = 0.020 / 0.040
    for factor in (1.1, 1.5, 2.0):
        LV = factor * LVmin
        print(f"   L/V = {factor:.1f}×min   Z = HTU × NTU = {HTU * ntu_colburn(yb, ya, xa, LV, m):.2f} m")


if __name__ == "__main__":
    main()
