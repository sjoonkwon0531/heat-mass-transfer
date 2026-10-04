# Week 6 - Topic 2: Boiling Heat Transfer - Rohsenow, Critical Heat Flux, Film Boiling
# The boiling curve (lecture Part 2): free convection -> nucleate (ONB..CHF) ->
# transition -> film boiling (Leidenfrost minimum at its start).
# Nucleate regime (Rohsenow):
#   q = mu_L*h_fg*sqrt(g*(rhoL-rhov)/sigma) * [c_pL*dT/(C_sf*h_fg*Pr_L^1.7)]^3
#   (the lecture slide writes the kinematic prefactor; the standard dynamic-viscosity
#    form above reproduces the classic water data)
# Critical heat flux (burn-out):
#   q_crit = 0.18*h_fg*rho_v*[g*sigma*(rhoL-rhov)/rho_v^2]^(1/4)
# Stable film boiling on a tube of diameter D0:
#   h = 0.62*[k_v^3*g*(rhoL-rhov)*(h_fg+0.4*c_pL*dT)/(D0*nu_v*dT)]^(1/4)
# Radiation correction: h = h_r + h_c*(h_c/h)^(1/3)  (solved iteratively)

import math

G = 9.81

# saturated water / vapor at 1 atm (100 C)
RHO_L, RHO_V = 957.9, 0.596
MU_L, CP_L, PR_L = 2.79e-4, 4217.0, 1.76
H_FG, SIGMA = 2.257e6, 0.0589
K_V, CP_V, NU_V = 0.025, 2030.0, 2.0e-5   # steam film properties (approx.)

def q_rohsenow(dT, Csf=0.013):
    """Nucleate-boiling heat flux [W/m^2], water on platinum: Csf = 0.013."""
    return MU_L * H_FG * math.sqrt(G * (RHO_L - RHO_V) / SIGMA) \
        * (CP_L * dT / (Csf * H_FG * PR_L ** 1.7)) ** 3

def q_critical():
    """Burn-out (critical) heat flux [W/m^2]."""
    return 0.18 * H_FG * RHO_V * (G * SIGMA * (RHO_L - RHO_V) / RHO_V ** 2) ** 0.25

def h_film(dT, D0=0.01):
    """Stable film boiling around a tube of outside diameter D0 [W/m^2 K]."""
    return 0.62 * (K_V ** 3 * G * (RHO_L - RHO_V) * (H_FG + 0.4 * CP_L * dT)
                   / (D0 * NU_V * dT)) ** 0.25

def h_with_radiation(h_c, h_r):
    """Solve h = h_r + h_c*(h_c/h)^(1/3) by fixed-point iteration."""
    h = h_c + h_r
    for _ in range(200):
        h_new = h_r + h_c * (h_c / h) ** (1.0 / 3.0)
        if abs(h_new - h) < 1e-10:
            break
        h = h_new
    return h

if __name__ == "__main__":
    print("Nucleate boiling (Rohsenow), water at 1 atm:")
    print("  surface        C_sf     q(dT=10K) [kW/m^2]")
    for name, Csf in (("platinum", 0.013), ("copper", 0.013), ("brass", 0.006),
                      ("nickel", 0.006)):
        print(f"  {name:12s} {Csf:6.3f}   {q_rohsenow(10, Csf)/1e3:12.1f}")
    print("  -> q ~ dT^3 and ~ 1/C_sf^3: the surface finish enters cubed!")

    print("\n  dT [K]   q [kW/m^2]  (C_sf = 0.013)")
    for dT in (5, 10, 15, 20, 25):
        print(f"  {dT:5.0f}   {q_rohsenow(dT)/1e3:10.1f}")

    qc = q_critical()
    print(f"\nCritical heat flux: q_crit = {qc/1e6:.2f} MW/m^2")
    # dT at which Rohsenow reaches CHF (nucleate regime upper edge)
    dT_chf = (qc / q_rohsenow(1.0)) ** (1.0 / 3.0)
    print(f"  Rohsenow reaches CHF near dT ~ {dT_chf:.0f} K (boiling-curve point C)")

    print("\nStable film boiling around a D0 = 10 mm tube:")
    print("  dT [K]    h_film [W/m^2K]   q [kW/m^2]")
    for dT in (200, 500, 1000):
        h = h_film(dT)
        print(f"  {dT:5.0f}   {h:12.1f}   {h*dT/1e3:10.1f}")

    # radiation correction example
    h_c, h_r = h_film(500), 40.0
    h_tot = h_with_radiation(h_c, h_r)
    print(f"\nRadiation correction (dT = 500 K, h_r = 40): "
          f"h_c = {h_c:.1f} -> h = {h_tot:.1f} W/m^2K")
    # sanity: h must lie between h_c and h_c + h_r
    assert h_c < h_tot < h_c + h_r

    print("\nBoiling-curve landmarks (lecture): ONB ~ 5 K, CHF (C) ~ 30 K at "
          f"{qc/1e6:.1f} MW/m^2, Leidenfrost minimum (D) ~ 100-120 K.")
