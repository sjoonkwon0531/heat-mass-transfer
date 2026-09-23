# Week 4 - Topic 3: Semi-Infinite Solid - Similarity (erf), and the Integral Method
# No geometric length scale -> the diffusion length sqrt(alpha*t) takes its place.
# Method 1 (similarity): eta = x / (2*sqrt(alpha*t)) turns the PDE into an ODE:
#   Theta'' + 2*eta*Theta' = 0  ->  (T - T0)/(Ts - T0) = erfc(eta)
# Method 3 (integral method, lecture): assume a parabolic profile inside a
# penetration depth delta(t); the energy balance gives delta = sqrt(12*alpha*t):
#   (T - T0)/(Ts - T0) ~ (1 - x/delta)^2   for x <= delta
# Penetration depth (95% criterion):
#   exact erfc(1.4) ~ 0.05     -> x_depth = 2.8    * sqrt(alpha*t)
#   integral method            -> x_depth = 2.6895 * sqrt(alpha*t)  (only ~4% off)

import math

def theta_exact(eta):
    """(T - T0)/(Ts - T0) = erfc(eta)."""
    return math.erfc(eta)

def theta_integral(eta):
    """Integral-method parabola in eta units: x/delta = 2*eta/sqrt(12) = eta/sqrt(3)."""
    v = 1.0 - eta / math.sqrt(3.0)
    return v * v if v > 0.0 else 0.0

def surface_flux(k, Ts, T0, alpha, t):
    """Exact surface heat flux q_s = k*(Ts - T0)/sqrt(pi*alpha*t) ~ t^(-1/2)."""
    return k * (Ts - T0) / math.sqrt(math.pi * alpha * t)

if __name__ == "__main__":
    print("Exact vs integral-method profile, Theta = (T-T0)/(Ts-T0):")
    print("  eta      erfc(eta)   parabola   |diff|")
    maxerr = 0.0
    for i in range(11):
        eta = 0.25 * i
        e, a = theta_exact(eta), theta_integral(eta)
        maxerr = max(maxerr, abs(e - a))
        print(f"  {eta:4.2f}    {e:8.5f}   {a:8.5f}   {abs(e-a):7.5f}")
    print(f"  max pointwise gap ~ {maxerr:.4f} -> a 2-line energy balance nearly")
    print("  reproduces the exact erfc solution.")

    # Penetration depths (95% change criterion)
    xd_exact = 2.8
    xd_int = (1.0 - math.sqrt(0.05)) * math.sqrt(12.0)
    print(f"\nPenetration depth / sqrt(alpha*t):")
    print(f"  exact (erfc(1.4)={math.erfc(1.4):.4f}) : 2.8")
    print(f"  integral method               : {xd_int:.4f}")
    print(f"  relative error                : {abs(xd_int-xd_exact)/xd_exact*100:.1f} %")

    # Worked example: hot bath (Ts = 90) suddenly applied to soil-like wall (T0 = 15)
    alpha = 7.0e-7                # [m^2/s]
    k = 1.2                       # [W/mK]
    Ts, T0 = 90.0, 15.0
    print("\nWorked example: wall with alpha = 0.7 mm^2/s, Ts = 90, T0 = 15 degC")
    print("  t [s]    depth 2.8*sqrt(at) [mm]   T at x=10mm [degC]   q_s [kW/m^2]")
    for t in (10.0, 60.0, 600.0, 3600.0):
        depth = 2.8 * math.sqrt(alpha * t) * 1e3
        eta10 = 0.010 / (2.0 * math.sqrt(alpha * t))
        T10 = T0 + (Ts - T0) * theta_exact(eta10)
        qs = surface_flux(k, Ts, T0, alpha, t) / 1e3
        print(f"  {t:6.0f}   {depth:12.1f}            {T10:8.2f}          {qs:8.3f}")
    print("  -> depth grows as sqrt(t); the surface flux decays as 1/sqrt(t).")

    # sanity checks
    assert abs(theta_exact(0.0) - 1.0) < 1e-12          # wall surface at Ts
    assert theta_exact(3.0) < 3e-5                      # far field at T0
    assert abs(theta_integral(math.sqrt(3.0))) < 1e-12  # parabola hits 0 at x = delta
