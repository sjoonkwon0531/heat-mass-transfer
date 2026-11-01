# Week 10 - Topic 2: Pseudo-Steady Moving Boundaries: Si Oxidation and Carbon-Particle Burnout
# Lecture (Part 1):
#   * diffusion-controlled Si oxidation (O2 = A through SiO2 = B, c_A = 0 at the Si interface):
#       N_Az = D c_As/delta(t);  (rho_B/M_B) d(delta)/dt = N_Az
#       -> delta(t) = (2 M_B D c_As t / rho_B)^(1/2)          (parabolic law)
#     with a finite interface reaction N_Az = k_s c_Ai added in series (linear-parabolic form):
#       delta^2 + (2D/k_s) delta = (2 M_B D c_As/rho_B) t
#   * carbon sphere burning in still air: 3C + 2.5 O2 -> 2 CO2 + CO  (A = O2)
#       sum N = -0.2 N_A  ->  N_Ar = -(c D/(1 + 0.2 y_A)) dy_A/dr,   r^2 N_Ar = const
#       W_O2 = -4 pi R (c D/0.2) ln(1.042)      (y_A = 0 at r = R, 0.21 at infinity)
#       W_C = (3/2.5)|W_O2| = 12 pi R (c D/0.5) ln(1.042)
#       t_f = (rho_C/M_C)(R0^2 - Rf^2) / (12 c D ln 1.042)
#   * single heterogeneous reaction C + O2 -> CO2 with surface rate N_A = -k_s c_As:
#       W_O2 = -4 pi R c D y_inf / (1 + D/(k_s R))
# Parameter values below are illustrative (labelled where chosen).

import math

R = 8.314462618

# ---------- Si oxidation ----------
M_SiO2, rho_SiO2 = 60.08e-3, 2270.0      # kg/mol, kg/m^3
c_s = 5.2e16 * 1e6 / 6.02214076e23       # O2 solubility in SiO2 (~5.2e16 cm^-3, dry O2, 1 atm) -> mol/m^3
D_ox = 3.4e-13                            # m^2/s, illustrative effective value near 1000 degC


def delta_parabolic(t):
    return math.sqrt(2 * M_SiO2 * D_ox * c_s * t / rho_SiO2)


def delta_linear_parabolic(t, ks):
    A = 2 * D_ox / ks
    Bp = 2 * M_SiO2 * D_ox * c_s / rho_SiO2
    return 0.5 * (-A + math.sqrt(A * A + 4 * Bp * t))


def delta_numeric(t_end, ks=None, n=200000):
    """Integrate (rho/M) d(delta)/dt = N with series resistances (pseudo-steady)."""
    d, dt = 1e-10, t_end / n
    for _ in range(n):
        res = d / D_ox + (1 / ks if ks else 0.0)
        N = c_s / res
        d += M_SiO2 / rho_SiO2 * N * dt
    return d

# ---------- carbon particle ----------
def burnout(R0, Rf, T, P=101325.0, D=2.0e-4, rho_C=2000.0, M_C=0.012):
    c = P / (R * T)
    return (rho_C / M_C) * (R0 ** 2 - Rf ** 2) / (12 * c * D * math.log(1.042))


def W_O2_hetero(Rp, T, ks, D=2.0e-4, P=101325.0, yinf=0.21):
    c = P / (R * T)
    return -4 * math.pi * Rp * c * D * yinf / (1 + D / (ks * Rp))


if __name__ == "__main__":
    print(f"c_As = {c_s:.4e} mol/m^3")
    print("  t (h)   parabolic (um)   linear-parabolic ks=1e-5 m/s (um)   numeric (um)")
    for h in (1, 2, 4, 8, 16):
        t = h * 3600
        print(f"{h:6d}   {delta_parabolic(t)*1e6:12.4f}   {delta_linear_parabolic(t,1e-5)*1e6:22.4f}   "
              f"{delta_numeric(t,1e-5,40000)*1e6:16.4f}")

    print("\nCarbon sphere, T = 1200 K, D = 2.0e-4 m^2/s (illustrative), rho_C = 2000 kg/m^3")
    print(f"  ln(1.042)/0.2 = {math.log(1.042)/0.2:.5f} vs 0.21 (no bulk-flow correction)")
    for R0_um in (10, 50, 100):
        print(f"  R0 = {R0_um:4d} um -> burnout time {burnout(R0_um*1e-6, 0.0, 1200.0):.4f} s")
    print("  burnout time scales as R0^2: 100 um vs 10 um ->",
          round(burnout(100e-6, 0, 1200) / burnout(10e-6, 0, 1200), 1))

    print("\nSingle heterogeneous reaction C + O2 -> CO2, R = 50 um, T = 1200 K")
    Rp = 50e-6
    Wd = W_O2_hetero(Rp, 1200.0, 1e9)
    for ks in (0.1, 1.0, 10.0, 100.0):
        W = W_O2_hetero(Rp, 1200.0, ks)
        print(f"  k_s = {ks:6.1f} m/s, Da = k_s R/D = {ks*Rp/2e-4:7.3f}: W_O2 = {W:.4e} mol/s ({W/Wd*100:5.1f}% of diffusion limit)")
