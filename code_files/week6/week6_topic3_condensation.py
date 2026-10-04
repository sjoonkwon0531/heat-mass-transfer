# Week 6 - Topic 3: Nusselt Film Condensation on a Vertical Wall
# Nusselt model (lecture Part 2): a laminar condensate film falls under gravity;
# force balance gives a Couette-like half-parabola velocity profile,
#   v_x = (rhoL - rhov) delta^2 g / mu_L * [y/delta - (y/delta)^2/2],
#   Gamma = (rhoL - rhov) delta^3 g / (3 mu_L)   (flow rate per width)
# The energy balance (latent heat released = conduction across the film) gives
#   delta(x) = [4 k mu_L dT x / (g rhoL (rhoL-rhov) h'_fg)]^(1/4),
#   h_x = k/delta ~ x^(-1/4),
#   h_Nusselt = (4/3) h_x(Lc) = 0.943 [k^3 g h'_fg rhoL (rhoL-rhov) / (mu_L dT Lc)]^(1/4)
# with the subcooling correction h'_fg = h_fg + (3/8) c_pL dT.
# Horizontal cylinder: coefficient 0.725 (per-D); vertical n-tube bank: 0.725/n^(1/4).

import math

G = 9.81
# saturated steam / water film at 1 atm
RHO_L, RHO_V = 957.9, 0.596
MU_L, CP_L, K_L = 2.79e-4, 4217.0, 0.68
H_FG = 2.257e6

def h_prime(dT):
    return H_FG + 0.375 * CP_L * dT          # h'_fg = h_fg + (3/8) c_pL dT

def delta_of_x(x, dT):
    return (4.0 * K_L * MU_L * dT * x / (G * RHO_L * (RHO_L - RHO_V) * h_prime(dT))) ** 0.25

def h_local(x, dT):
    return K_L / delta_of_x(x, dT)

def h_avg_vertical(L, dT):
    return 0.943 * (K_L ** 3 * G * h_prime(dT) * RHO_L * (RHO_L - RHO_V)
                    / (MU_L * dT * L)) ** 0.25

def h_avg_cylinder(D, dT, n=1):
    return 0.725 * (K_L ** 3 * G * h_prime(dT) * RHO_L * (RHO_L - RHO_V)
                    / (n * MU_L * dT * D)) ** 0.25

def re_film(L, dT):
    """Re_f = 4 Gamma_c / mu_L with Gamma_c = h_avg * dT * L / h'_fg."""
    Gam = h_avg_vertical(L, dT) * dT * L / h_prime(dT)
    return 4.0 * Gam / MU_L

if __name__ == "__main__":
    dT, L = 10.0, 0.5
    print(f"Steam at 1 atm condensing on a vertical wall, dT = {dT:.0f} K, L = {L} m")
    print("  x [m]    delta [um]   h_x [W/m^2K]")
    for x in (0.01, 0.05, 0.1, 0.25, 0.5):
        print(f"  {x:5.2f}   {delta_of_x(x, dT)*1e6:9.1f}   {h_local(x, dT):10.0f}")
    print("  -> the film thickens as x^(1/4); h_x falls as x^(-1/4).")

    havg = h_avg_vertical(L, dT)
    print(f"\n  h_avg = 0.943[...]^(1/4) = {havg:.0f} W/m^2K")
    print(f"  check 4/3 rule: h_avg / h_x(L) = {havg / h_local(L, dT):.4f} (= 4/3)")
    Re = re_film(L, dT)
    print(f"  film Reynolds Re_f = {Re:.0f} ({'laminar, Nusselt model OK' if Re < 1800 else 'turbulent: use 0.045 Re^(1/5) Pr^(1/3)'})")
    q = havg * dT
    mdot = q * L / h_prime(dT)   # per unit width
    print(f"  q = {q/1e3:.1f} kW/m^2, condensate rate = {mdot*3600:.1f} kg/h per m width")

    print("\nEffect of subcooling dT (same wall, L = 0.5 m):")
    print("  dT [K]   h_avg [W/m^2K]   q [kW/m^2]")
    for d in (5, 10, 20, 40):
        h = h_avg_vertical(L, d)
        print(f"  {d:5.0f}   {h:11.0f}   {h*d/1e3:9.1f}")
    print("  -> h ~ dT^(-1/4): a hotter wall gap thickens the film and hurts h,")
    print("     but q = h dT still rises as dT^(3/4).")

    print("\nHorizontal tubes (D = 25 mm), vertical banks of n tubes:")
    print("  n     h_avg [W/m^2K]")
    for n in (1, 2, 4, 9, 16):
        print(f"  {n:3d}   {h_avg_cylinder(0.025, dT, n):10.0f}")
    print("  -> h ~ n^(-1/4): lower tubes drown in the condensate of those above")
    print("     (the lecture's parallel-condenser design point).")

    # sanity checks (0.943 is the rounded Nusselt constant: (4/3)/4^(1/4) = 0.9428)
    assert abs(h_avg_vertical(L, dT) / h_local(L, dT) - 4.0 / 3.0) < 1e-3
    assert abs(h_avg_cylinder(0.025, dT, 16) / h_avg_cylinder(0.025, dT, 1) - 16 ** -0.25) < 1e-9
