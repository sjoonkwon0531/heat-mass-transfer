# Week 5 - Topic 1: Blasius Boundary Layer by the Shooting Method
# Laminar flat-plate momentum boundary layer (lecture Part 1):
#   similarity variable zeta = y*sqrt(v_inf/(nu*x)),  v_x/v_inf = f'(zeta)
#   Blasius ODE:  f*f'' + 2*f''' = 0,
#   BCs: f(0) = f'(0) = 0 (no-slip),  f'(inf) = 1 (velocity continuity)
# The unknown curvature f''(0) is found by shooting + secant iteration.
# Key results: f''(0) = 0.332057  ->  tau_w = 0.332*mu*v_inf*sqrt(v_inf/(nu*x)),
#   local c_f = 0.664/sqrt(Re_x),  overall C_f = 1.328/sqrt(Re_L),
#   delta_99 ~ 5.0*x/sqrt(Re_x),  beta = lim(zeta - f) = 1.720787

def rhs(y):
    """y = [f, f', f''];  f''' = -f*f''/2."""
    return [y[1], y[2], -0.5 * y[0] * y[2]]

def integrate(fpp0, zmax=10.0, dz=0.001, store=False):
    """RK4 march from zeta = 0 with guessed f''(0). Returns final state (and path)."""
    y = [0.0, 0.0, fpp0]
    path = [(0.0, *y)]
    n = int(zmax / dz)
    for i in range(n):
        k1 = rhs(y)
        k2 = rhs([y[j] + dz / 2 * k1[j] for j in range(3)])
        k3 = rhs([y[j] + dz / 2 * k2[j] for j in range(3)])
        k4 = rhs([y[j] + dz * k3[j] for j in range(3)])
        y = [y[j] + dz / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) for j in range(3)]
        if store:
            path.append(((i + 1) * dz, *y))
    return (y, path) if store else (y, None)

def solve_blasius():
    """Secant iteration on g(fpp0) = f'(zmax) - 1."""
    a, b = 0.2, 0.5
    ga = integrate(a)[0][1] - 1.0
    gb = integrate(b)[0][1] - 1.0
    for _ in range(40):
        c = b - gb * (b - a) / (gb - ga)
        gc = integrate(c)[0][1] - 1.0
        a, ga, b, gb = b, gb, c, gc
        if abs(gc) < 1e-12:
            break
    return b

if __name__ == "__main__":
    fpp0 = solve_blasius()
    print(f"Shooting result: f''(0) = {fpp0:.6f}   (lecture: 0.332057)")

    _, path = integrate(fpp0, store=True)
    # boundary-layer thickness: f' = 0.99
    z99 = next(z for (z, f, fp, fpp) in path if fp >= 0.99)
    print(f"f' = 0.99 at zeta = {z99:.2f}  ->  delta_99 ~ {z99:.1f} * x / sqrt(Re_x)")
    zl, fl = path[-1][0], path[-1][1]
    print(f"beta = lim(zeta - f) = {zl - fl:.6f}   (lecture: 1.720787)")

    print("\nProfile (velocity ratio f' and shear function f''):")
    print("  zeta    f        f'       f''")
    for ztab in (0.0, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 8.0):
        z, f, fp, fpp = min(path, key=lambda p: abs(p[0] - ztab))
        print(f"  {z:4.1f}  {f:7.4f}  {fp:7.4f}  {fpp:7.4f}")

    # Drag coefficients: local and overall
    print("\nDrag: local c_f = 0.664/sqrt(Re_x), overall C_f = 1.328/sqrt(Re_L)")
    print(f"  2*f''(0) = {2*fpp0:.4f}  (= 0.664 prefactor check)")
    # Worked example: air, v_inf = 5 m/s over L = 0.5 m
    nu = 15.9e-6
    U, L = 5.0, 0.5
    ReL = U * L / nu
    print(f"\nWorked example: air, U = {U} m/s, L = {L} m -> Re_L = {ReL:.3e} (laminar)")
    for x in (0.05, 0.1, 0.25, 0.5):
        Rex = U * x / nu
        delta = 5.0 * x / Rex**0.5
        cf = 0.664 / Rex**0.5
        print(f"  x = {x:4.2f} m: Re_x = {Rex:9.3e}, delta_99 = {delta*1e3:5.2f} mm, c_f = {cf:.5f}")

    assert abs(fpp0 - 0.332057) < 1e-4
    assert abs((zl - fl) - 1.720787) < 1e-4
