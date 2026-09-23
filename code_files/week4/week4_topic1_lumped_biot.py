# Week 4 - Topic 1: Lumped Capacitance & the Biot Number
# Unsteady conduction, "0-D" limit: when internal conduction is much faster than
# surface convection (Bi << 1), the whole body is nearly isothermal and the PDE
# collapses to a first-order ODE:
#   rho*c*V dT/dt = -h*A*(T - Tinf)  ->  (T-Tinf)/(T0-Tinf) = exp(-t/tau) = exp(-Bi*Fo)
#   Bi = h*Lc/k,  Fo = alpha*t/Lc^2,  Lc = V/A,  tau = rho*c*Lc/h
# Also: steady radial profile of a heat-generating wire (lecture),
#   Theta(eta) = (2 + Bi*(1 - eta^2)) / (2 + Bi),  eta = r/R
# shows the physical meaning of Bi: Bi->0 isothermal wire, Bi->inf surface at Tinf.

import math

def lumped_history(Bi, Fo):
    """Dimensionless temperature (T-Tinf)/(T0-Tinf) = exp(-Bi*Fo)."""
    return math.exp(-Bi * Fo)

def wire_profile(eta, Bi):
    """Steady dimensionless profile of a heat-generating wire, Theta=(T-Tinf)/(Tc-Tinf)."""
    return (2.0 + Bi * (1.0 - eta * eta)) / (2.0 + Bi)

if __name__ == "__main__":
    # --- Case A: steel sphere quenched in oil ---
    D = 0.010                       # sphere diameter [m]
    rho, c, k = 7800.0, 480.0, 45.0 # steel [kg/m^3, J/kgK, W/mK]
    h = 400.0                       # oil bath [W/m^2K]
    T0, Tinf = 850.0, 60.0          # initial & bath temperature [degC]

    Lc = D / 6.0                    # V/A of a sphere = D/6
    Bi = h * Lc / k
    alpha = k / (rho * c)
    tau = rho * c * Lc / h
    print("Case A: steel sphere, D = 10 mm, quenched in oil")
    print(f"  Lc = V/A = D/6 = {Lc*1e3:.3f} mm")
    print(f"  Bi = h*Lc/k = {Bi:.4f}  ({'< 0.1 -> lumped OK' if Bi < 0.1 else '>= 0.1 -> need full PDE'})")
    print(f"  alpha = {alpha*1e6:.3f} mm^2/s,  tau = rho*c*Lc/h = {tau:.2f} s")

    print("  t [s]   Fo      T [degC]")
    for t in (0.0, 5.0, 15.6, 30.0, 60.0, 120.0):
        Fo = alpha * t / Lc**2
        theta = lumped_history(Bi, Fo)          # = exp(-t/tau)
        T = Tinf + (T0 - Tinf) * theta
        print(f"  {t:5.1f}  {Fo:6.2f}  {T:8.2f}")
    t99 = tau * math.log(100.0)
    print(f"  time to 99% equilibration: t = tau*ln(100) = {t99:.1f} s")

    # sanity: exp(-Bi*Fo) must equal exp(-t/tau)
    t = 37.0
    Fo = alpha * t / Lc**2
    assert abs(lumped_history(Bi, Fo) - math.exp(-t / tau)) < 1e-12

    # --- Case B: physical meaning of Bi via the heat-generating wire (lecture) ---
    print("\nCase B: steady heat-generating wire, Theta = (2 + Bi(1-eta^2))/(2 + Bi)")
    print("  eta:   " + "  ".join(f"{e:5.2f}" for e in (0.0, 0.25, 0.5, 0.75, 1.0)))
    for Bi_w in (0.0, 0.5, 2.0, 10.0, 1e12):
        vals = [wire_profile(e, Bi_w) for e in (0.0, 0.25, 0.5, 0.75, 1.0)]
        tag = "inf" if Bi_w > 1e6 else f"{Bi_w:g}"
        print(f"  Bi={tag:>4s}: " + "  ".join(f"{v:5.3f}" for v in vals))
    print("  Bi->0  : Theta = 1 everywhere (isothermal wire, convection-limited)")
    print("  Bi->inf: Theta(1) = 0 (surface pinned at Tinf, conduction-limited)")
