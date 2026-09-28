# Week 5 - Topic 3: Laminar-Turbulent Transition on a Flat Plate
# The boundary layer trips at Re_crit = 5e5 (lecture Part 2). Correlations:
#   laminar   : <Nu_lam>  = 0.664 * Pr^(1/3) * Re^(1/2)
#   turbulent : <Nu_turb> = 0.037*Re^0.8*Pr / (1 + 2.443*Re^(-0.1)*(Pr^(2/3)-1))
#   transition band (10 < Re < 1e7, 0.6 < Pr < 2000):
#               <Nu> = sqrt(<Nu_lam>^2 + <Nu_turb>^2)
# The quadrature blend recovers the laminar line at low Re and the turbulent
# line at high Re, with a smooth handover around the critical Reynolds number.

import math

RE_CRIT = 5.0e5

def nu_lam(Re, Pr):
    return 0.664 * Pr ** (1.0 / 3.0) * math.sqrt(Re)

def nu_turb(Re, Pr):
    return 0.037 * Re ** 0.8 * Pr / (1.0 + 2.443 * Re ** -0.1 * (Pr ** (2.0 / 3.0) - 1.0))

def nu_combined(Re, Pr):
    nl, nt = nu_lam(Re, Pr), nu_turb(Re, Pr)
    return math.sqrt(nl * nl + nt * nt)

if __name__ == "__main__":
    Pr = 0.707  # air
    print("Flat plate, air (Pr = 0.707): the three correlations")
    print("  Re          Nu_lam     Nu_turb    combined   regime")
    for Re in (1e3, 1e4, 1e5, RE_CRIT, 1e6, 5e6, 1e7):
        nl, nt, nc = nu_lam(Re, Pr), nu_turb(Re, Pr), nu_combined(Re, Pr)
        regime = "laminar" if Re < RE_CRIT else "turbulent"
        print(f"  {Re:9.1e}  {nl:9.1f}  {nt:9.1f}  {nc:9.1f}   {regime}")
    print("  -> below Re_crit the laminar term dominates the blend;")
    print("     above it the 0.8-power turbulent term takes over.")

    # --- Worked example: wind over a roof panel ---
    # air: nu = 15.9e-6 m^2/s, k = 0.0263 W/mK
    nu_air, k_air = 15.9e-6, 0.0263
    L = 2.0
    print(f"\nWind over an L = {L} m panel: mean h vs wind speed")
    print("  U [m/s]   Re_L        x_crit [m]   <Nu>       h [W/m2K]")
    for U in (1.0, 2.0, 5.0, 10.0, 20.0):
        ReL = U * L / nu_air
        xc = RE_CRIT * nu_air / U
        Nu = nu_combined(ReL, Pr)
        h = Nu * k_air / L
        xs = f"{xc:.2f}" if xc < L else "  all laminar"
        print(f"  {U:6.1f}  {ReL:10.3e}  {xs:>11s}  {Nu:9.1f}  {h:9.2f}")
    print("  -> turbulence pays: past transition, h grows nearly like U^0.8.")

    # sanity: blend approaches each limit
    assert abs(nu_combined(1e3, Pr) / nu_lam(1e3, Pr) - 1.0) < 0.3
    assert abs(nu_combined(1e7, Pr) / nu_turb(1e7, Pr) - 1.0) < 0.02
    # turbulent form reduces to 0.037 Re^0.8 Pr when Pr = 1
    assert abs(nu_turb(1e6, 1.0) - 0.037 * 1e6 ** 0.8) < 1e-6
