# Week 5 - Topic 4: Forced Convection in a Pipe - Nusselt Correlations & LMTD
# Laminar (Poiseuille) internal flow with constant wall temperature (lecture Part 2):
#   entrance parameter beta = Pe*D/x (Graetz-type),  Pe = Re*Pr
#   mean Nu: <Nu_lam> = (49.371 + (1.615*<beta>^(1/3) - 0.7)^3)^(1/3),  <beta> = Pe*D/L
#   fully developed limits: Nu_inf = 3.660 (const T_w), 4.364 (const q_w)
# Turbulent: Gnielinski
#   <Nu_turb> = (xi/8)(Re-1000)Pr / (1 + 12.7*sqrt(xi/8)*(Pr^(2/3)-1)) * (1+(D/L)^(2/3)),
#   xi = (1.82*log10(Re) - 1.64)^(-2)
# Wall-to-fluid heat rate uses the log-mean temperature difference:
#   Q = h*A*LMTD,  LMTD = (dT_in - dT_out)/ln(dT_in/dT_out)

import math

def nu_lam_constT(beta_mean):
    return (49.371 + (1.615 * beta_mean ** (1.0 / 3.0) - 0.7) ** 3) ** (1.0 / 3.0)

def nu_lam_constq(beta_mean):
    return (83.326 + (1.953 * beta_mean ** (1.0 / 3.0) - 0.6) ** 3) ** (1.0 / 3.0)

def nu_gnielinski(Re, Pr, D_over_L=0.0):
    xi = (1.82 * math.log10(Re) - 1.64) ** -2
    core = (xi / 8.0) * (Re - 1000.0) * Pr / (1.0 + 12.7 * math.sqrt(xi / 8.0) * (Pr ** (2.0 / 3.0) - 1.0))
    return core * (1.0 + D_over_L ** (2.0 / 3.0))

if __name__ == "__main__":
    # --- Fully developed limits ---
    print("Fully developed laminar limits (beta -> 0):")
    print(f"  const wall T   : Nu -> {nu_lam_constT(1e-12):.3f}   (lecture: 3.660)")
    print(f"  const wall flux: Nu -> {nu_lam_constq(1e-12):.3f}   (lecture: 4.364)")

    print("\nEntrance effect (mean Nu vs <beta> = Pe*D/L):")
    print("  beta      Nu(const T)   Nu(const q)")
    for b in (0.1, 1.0, 10.0, 100.0, 1000.0):
        print(f"  {b:7.1f}  {nu_lam_constT(b):10.3f}  {nu_lam_constq(b):11.3f}")
    print("  -> short pipes (large beta): thin entrance boundary layer, high Nu;")
    print("     long pipes (beta -> 0): profile fully developed, Nu saturates.")

    # --- Worked example: hot-wall pipe heating water (laminar) ---
    # water ~30 C: rho = 997, cp = 4180, k = 0.61, nu = 0.658e-6, Pr = 4.34
    rho, cp, k, nuw, Pr = 997.0, 4180.0, 0.61, 0.658e-6, 4.34
    D, L, v = 0.02, 3.0, 0.05
    Tw, Tin = 80.0, 20.0

    Re = v * D / nuw
    Pe = Re * Pr
    beta = Pe * D / L
    Nu = nu_lam_constT(beta)
    h = Nu * k / D
    mdot = rho * v * math.pi * D * D / 4.0
    A = math.pi * D * L

    # outlet temperature from the wall-coupled energy balance:
    # (Tw - Tout)/(Tw - Tin) = exp(-h*A/(mdot*cp))
    Tout = Tw - (Tw - Tin) * math.exp(-h * A / (mdot * cp))
    dTin, dTout = Tw - Tin, Tw - Tout
    LMTD = (dTin - dTout) / math.log(dTin / dTout)
    Q_lmtd = h * A * LMTD
    Q_bal = mdot * cp * (Tout - Tin)

    print(f"\nWorked example: water, D = {D*100:.0f} cm, L = {L} m, v = {v} m/s, Tw = {Tw} C")
    print(f"  Re = {Re:.0f} (< 2300: laminar), Pe = {Pe:.0f}, beta = Pe*D/L = {beta:.1f}")
    print(f"  Nu = {Nu:.2f}, h = {h:.1f} W/m2K")
    print(f"  T_out = {Tout:.2f} C")
    print(f"  LMTD = {LMTD:.2f} K")
    print(f"  Q = h*A*LMTD = {Q_lmtd:.1f} W  vs  mdot*cp*(Tout-Tin) = {Q_bal:.1f} W")
    assert abs(Q_lmtd - Q_bal) / Q_bal < 1e-9   # LMTD is exact for constant Tw

    # --- Turbulent comparison at higher speed ---
    print("\nSame pipe, higher speeds (turbulent, Gnielinski):")
    print("  v [m/s]   Re        Nu        h [W/m2K]")
    for vv in (0.5, 1.0, 2.0):
        Re2 = vv * D / nuw
        Nu2 = nu_gnielinski(Re2, Pr, D / L)
        print(f"  {vv:6.1f}  {Re2:9.0f}  {Nu2:8.1f}  {Nu2 * k / D:9.0f}")
    print("  -> from laminar to turbulent, h jumps by an order of magnitude.")
