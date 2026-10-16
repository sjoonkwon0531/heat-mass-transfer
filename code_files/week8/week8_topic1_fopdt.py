# Week 8 - Topic 1: Stirred-Tank Heating -> First-Order Process & FOPDT Fitting
# Lecture (Part 1): energy balance on a stirred tank with holdup V,
#   rho*V*cp dT'/dt = mdot*cp (Tin' - T') + Q'
# In deviation variables and Laplace space,
#   T'(s) = [K/(tau s + 1)] Q'(s) + [1/(tau s + 1)] Tin'(s),
#   K = 1/(mdot*cp),  tau = rho*V/mdot.
# With a transport delay theta_p (dead time), the FOPDT model is
#   G(s) = Kp exp(-theta_p s) / (tau_p s + 1).
# Two-point fitting (lecture): find t1, t2 where y/y_inf = 0.283 and 0.632:
#   tau_p = 3*(t2 - t1)/2,   theta_p = (3*t1 - t2)/2.
# Lecture example: t1 = 21.8 s, t2 = 36.0 s -> tau_p = 21.3 s, theta_p = 14.7 s.

import math


def fopdt_step(t, Kp, du, tau_p, theta_p, y0=0.0):
    """Step response of Kp*exp(-theta_p*s)/(tau_p*s+1) to a step du at t = 0."""
    if t < theta_p:
        return y0
    e = math.exp(-(t - theta_p) / tau_p)
    return e * y0 + (1.0 - e) * Kp * du


def two_point_fit(t1, t2):
    """FOPDT parameters from the 28.3% and 63.2% response times."""
    tau_p = 3.0 * (t2 - t1) / 2.0
    theta_p = (3.0 * t1 - t2) / 2.0
    return tau_p, theta_p


if __name__ == "__main__":
    # --- stirred tank: physical parameters -> K and tau ---
    rho, cp = 1000.0, 4184.0          # water, SI
    V, mdot = 0.5, 0.25               # m^3, kg/s
    K = 1.0 / (mdot * cp)             # K per W
    tau = rho * V / mdot              # s
    print("Stirred-tank first-order parameters:")
    print(f"  K   = 1/(mdot*cp) = {K:.3e} K/W")
    print(f"  tau = rho*V/mdot  = {tau:.1f} s")
    print(f"  (a +10 kW step in Q raises T by K*dQ = {K*1e4:.3f} K at steady state)")

    # --- lecture two-point fit ---
    t1, t2 = 21.8, 36.0
    tau_p, theta_p = two_point_fit(t1, t2)
    print("\nFOPDT two-point fit (lecture valve-to-temperature data):")
    print(f"  t1 = {t1} s (y/y_inf = 0.283), t2 = {t2} s (y/y_inf = 0.632)")
    print(f"  tau_p   = 3(t2-t1)/2 = {tau_p:.1f} s   (lecture: 21.3)")
    print(f"  theta_p = (3t1-t2)/2 = {theta_p:.1f} s   (lecture: 14.7)")

    # verify: the fitted model reproduces the two anchor fractions exactly
    for tt, target in [(t1, 1 - math.exp(-1.0 / 3.0)), (t2, 1 - math.exp(-1.0))]:
        y = fopdt_step(tt, 1.0, 1.0, tau_p, theta_p)
        print(f"  check y({tt:5.1f})/y_inf = {y:.4f}  (target {target:.4f})")

    # --- normalized step-response table ---
    print("\nNormalized FOPDT step response (Kp*du = 1):")
    print("    t (s)    y(t)")
    for tt in range(0, 121, 10):
        print(f"  {tt:6.0f}   {fopdt_step(tt, 1.0, 1.0, tau_p, theta_p):7.4f}")
    print("  -> y = 0 until t = theta_p, then rises with time constant tau_p;")
    print("     63.2% of the final value is reached at t = theta_p + tau_p "
          f"= {theta_p + tau_p:.1f} s.")
