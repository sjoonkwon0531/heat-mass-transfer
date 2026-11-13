# Week 12 - Topic 1: Laminar Boundary Layers - Blasius Similarity and the Concentration Boundary Layer
# Lecture (Part 1):
#   * flat plate, steady laminar flow, similarity variable eta = y sqrt(v_inf/(nu x)), stream function
#     psi = sqrt(nu x v_inf) f(eta)  ->  vx/v_inf = f'(eta)
#   * Blasius equation (lecture form):  2 f''' + f f'' = 0,  f(0) = f'(0) = 0,  f'(inf) = 1
#     shooting gives f''(0) = 0.332057  ->  wall shear  dvx/dy|0 = 0.332 v_inf sqrt(v_inf/(nu x))
#   * concentration: vx dC/dx + vy dC/dy = D d2C/dy2 with C = (cA - cAs)/(cA_inf - cAs)
#     in the same variable: C'' + (Sc/2) f C' = 0, C(0) = 0, C(inf) = 1
#     (Sc = 1 -> C = f', the analogy used in the lecture)
#     closed form: C'(0) = 1 / int_0^inf exp(-(Sc/2) int_0^eta f ds) d eta
#   * local Sherwood number: Sh_x = kc x / D = C'(0) Re_x^(1/2)  ~  0.332 Sc^(1/3) Re_x^(1/2)
# This script: (1) shoots for f''(0) with RK4 + bisection, (2) the 99% thickness, (3) C'(0) for a
# range of Sc against 0.332 Sc^(1/3), (4) the thickness ratio delta_M/delta_c.

import math

ETA_MAX, H = 12.0, 0.001


def blasius(a):
    """integrate 2f''' + f f'' = 0 from eta = 0 with f''(0) = a; returns lists eta, f, f', f''"""
    def rhs(u):
        return (u[1], u[2], -0.5 * u[0] * u[2])
    u = [0.0, 0.0, a]
    out_e, out_u = [0.0], [tuple(u)]
    n = int(ETA_MAX / H)
    for i in range(n):
        k1 = rhs(u)
        k2 = rhs([u[j] + 0.5 * H * k1[j] for j in range(3)])
        k3 = rhs([u[j] + 0.5 * H * k2[j] for j in range(3)])
        k4 = rhs([u[j] + H * k3[j] for j in range(3)])
        u = [u[j] + H / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) for j in range(3)]
        out_e.append((i + 1) * H)
        out_u.append(tuple(u))
    return out_e, out_u


def shoot():
    lo, hi = 0.2, 0.5
    for _ in range(50):
        mid = 0.5 * (lo + hi)
        if blasius(mid)[1][-1][1] < 1.0:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def wall_gradient(Sc, eta, u):
    """C'(0) = 1 / int exp(-(Sc/2) F) with F = int f, trapezoid rule"""
    F, I = 0.0, 0.0
    g_prev = 1.0
    for i in range(1, len(eta)):
        F += 0.5 * (u[i][0] + u[i - 1][0]) * H
        g = math.exp(-0.5 * Sc * F)
        I += 0.5 * (g + g_prev) * H
        g_prev = g
    return 1.0 / I


if __name__ == "__main__":
    print("=== 1. Blasius: shooting for f''(0) ===")
    a = shoot()
    eta, u = blasius(a)
    print(f"  f''(0) = {a:.6f}   (lecture: 0.332057)")
    i99 = next(i for i, v in enumerate(u) if v[1] >= 0.99)
    print(f"  f'(eta) = 0.99 at eta = {eta[i99]:.3f}  ->  delta_99 = {eta[i99]:.2f} x / Re_x^(1/2)")
    print(f"  far field: f(12) - 12 = {u[-1][0] - 12:.4f}  (displacement, lecture b = 1.7208)")

    print("\n=== 2. Concentration boundary layer: C'(0) versus Sc ===")
    print("    Sc      C'(0)    0.332 Sc^(1/3)   ratio")
    for Sc in (0.6, 0.7, 1.0, 2.0, 10.0, 100.0, 1000.0):
        g = wall_gradient(Sc, eta, u)
        approx = 0.332 * Sc ** (1 / 3)
        print(f"  {Sc:7.1f}  {g:.5f}   {approx:.5f}         {g/approx:.4f}")
    print("  -> Sh_x = C'(0) Re_x^(1/2); the Sc^(1/3) law is within 2% for Sc >= 0.6")

    print("\n=== 3. Example: local and mean Sherwood numbers on a 0.2 m plate ===")
    nu, D, v, L = 1.5e-5, 6.0e-6, 3.0, 0.2        # air, a vapor with D = 6e-6 m^2/s (illustrative)
    Sc = nu / D
    for x in (0.05, 0.1, 0.2):
        Re = v * x / nu
        Sh = 0.332 * Sc ** (1 / 3) * math.sqrt(Re)
        print(f"  x = {x:4.2f} m: Re_x = {Re:8.0f}, Sh_x = {Sh:6.1f}, kc = {Sh*D/x*100:.3f} cm/s")
    ReL = v * L / nu
    print(f"  mean over L: Sh_L = 0.664 Sc^(1/3) Re_L^(1/2) = {0.664*Sc**(1/3)*math.sqrt(ReL):.1f}  "
          f"(= 2 x local value at x = L)")
    print(f"  thickness ratio delta_M/delta_c ~ Sc^(1/3) = {Sc**(1/3):.3f}")
