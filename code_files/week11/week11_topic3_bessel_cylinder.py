# Week 11 - Topic 3: Sturm-Liouville Eigenfunctions in a Cylinder - Bessel Functions and the Heated Wire
# Lecture (Part 2):
#   * Sturm-Liouville operator L = (1/w) [d/dx (p d/dx) + q]; self-adjoint with homogeneous BCs
#     -> real eigenvalues, orthogonal eigenfunctions <u_m, u_n> = int u_m u_n w dx = 0 (m != n)
#   * cylinder (w = r, p = r, q = 0): (1/r)(r F')' = -lambda^2 F  ->  F = a J0(lambda r)  (Y0 diverges at r = 0)
#     Type 1  F(1) = 0          : J0(lambda) = 0           lambda = 2.405, 5.520, 8.654, ...
#     Type 2  F'(1) = 0         : J1(lambda) = 0           lambda = 0, 3.832, 7.016, 10.173, ...
#     Type 3  F'(1) + Bi F(1) = 0: lambda J1(lambda) = Bi J0(lambda)
#     normalisation  int_0^1 J0(lambda r)^2 r dr = [J0(lambda)^2 + J1(lambda)^2]/2
#   * Ex 1 (lecture): electrically heated wire, dTheta/dt = (1/r)(r Theta_r)_r + 1,
#     Theta(r,0) = 0, Theta_r(0) = 0, Theta_r(1) + Bi Theta(1) = 0  (finite Fourier transform):
#     Theta = 2 sum_n J1(l_n) J0(l_n r) / (l_n^3 J0(l_n)^2 (1 + (Bi/l_n)^2)) (1 - exp(-l_n^2 t))
#     steady state Theta_ss = 1/(2 Bi) + (1 - r^2)/4
#   Dimensionless: Theta = k (T - T_inf)/(q''' R^2), t = alpha t/R^2, Bi = h R/k.
# Bessel functions are computed from the integral J_n(x) = (1/pi) int_0^pi cos(n s - x sin s) ds
# with the trapezoidal rule, which converges exponentially for this periodic integrand.

import math


def besselj(n, x, m=200):
    h = math.pi / m
    s = 0.5 * (math.cos(0.0) + math.cos(n * math.pi - x * math.sin(math.pi)))
    for k in range(1, m):
        u = k * h
        s += math.cos(n * u - x * math.sin(u))
    return s * h / math.pi


def roots(f, xmax=20.0, dx=0.01):
    out, x = [], 1e-9
    fx = f(x)
    while x < xmax:
        x2 = x + dx
        f2 = f(x2)
        if fx * f2 < 0:
            a, b = x, x2
            for _ in range(80):
                c = 0.5 * (a + b)
                if f(a) * f(c) <= 0:
                    b = c
                else:
                    a = c
            out.append(0.5 * (a + b))
        x, fx = x2, f2
    return out


def eigenvalues(bc, Bi=1.0, n=4):
    if bc == 1:
        return roots(lambda x: besselj(0, x))[:n]
    if bc == 2:
        return [0.0] + roots(lambda x: besselj(1, x))[: n - 1]
    return roots(lambda x: x * besselj(1, x) - Bi * besselj(0, x))[:n]


def simpson(f, a, b, n=400):
    h = (b - a) / n
    s = f(a) + f(b)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * f(a + i * h)
    return s * h / 3


def wire_series(r, t, Bi, lams):
    s = 0.0
    for l in lams:
        J0l, J1l = besselj(0, l), besselj(1, l)
        s += 2 * J1l * besselj(0, l * r) / (l ** 3 * J0l ** 2 * (1 + (Bi / l) ** 2)) * (1 - math.exp(-l * l * t))
    return s


def wire_fd(t_end, Bi, N=60):
    """explicit finite volume on r in [0,1] with the Robin condition at r = 1"""
    dr = 1.0 / N
    steps = int(t_end / (0.2 * dr * dr)) + 1      # explicit stability: dt < dr^2/4
    dt = t_end / steps
    rc = [(i + 0.5) * dr for i in range(N)]
    th = [0.0] * N
    for _ in range(steps):
        new = th[:]
        for i in range(N):
            rw, re = i * dr, (i + 1) * dr
            fw = rw * (th[i] - th[i - 1]) / dr if i > 0 else 0.0
            if i < N - 1:
                fe = re * (th[i + 1] - th[i]) / dr
            else:  # surface value from Robin: (Ts - th)/(dr/2) = -Bi Ts
                Ts = th[i] / (1 + Bi * dr / 2)
                fe = re * (Ts - th[i]) / (dr / 2)
            new[i] = th[i] + dt * ((fe - fw) / (rc[i] * dr) + 1.0)
        th = new
    return rc, th


if __name__ == "__main__":
    print("=== 1. Eigenvalues for the three boundary-condition types ===")
    fmt = lambda v: "[" + ", ".join(f"{x:.4f}" for x in v) + "]"
    print("  Type 1 (J0 = 0):", fmt(eigenvalues(1)))
    print("  Type 2 (J1 = 0):", fmt(eigenvalues(2)))
    for Bi in (0.1, 1.0, 10.0):
        print(f"  Type 3, Bi = {Bi:4.1f}:", fmt(eigenvalues(3, Bi)))

    print("\n=== 2. Orthogonality (weight w = r) and normalisation ===")
    lam = eigenvalues(1)
    for i in range(3):
        row = []
        for j in range(3):
            row.append(simpson(lambda r: besselj(0, lam[i] * r) * besselj(0, lam[j] * r) * r, 0, 1))
        print("  ", " ".join(f"{v:+.6f}" for v in row))
    l1 = lam[0]
    print(f"  int J0(l1 r)^2 r dr = {simpson(lambda r: besselj(0, l1*r)**2*r, 0, 1):.6f}, "
          f"formula (J0^2 + J1^2)/2 = {(besselj(0,l1)**2 + besselj(1,l1)**2)/2:.6f}")

    print("\n=== 3. Heated wire (Ex 1): series vs finite volume ===")
    Bi = 1.0
    lams = eigenvalues(3, Bi, 30)
    for t in (0.05, 0.2, 1.0):
        rc, th = wire_fd(t, Bi)
        print(f"  t = {t:4.2f}: centre series = {wire_series(0.0, t, Bi, lams):.5f}, FV = {th[0]:.5f};"
              f"  surface series = {wire_series(1.0, t, Bi, lams):.5f}")
    print(f"  steady state 1/(2Bi) + 1/4 = {1/(2*Bi)+0.25:.5f}; series at t = 10: {wire_series(0, 10, Bi, lams):.5f}")
    print(f"  time to reach 95% of the steady centre value: ", end="")
    target = 0.95 * (1 / (2 * Bi) + 0.25)
    lo, hi = 0.0, 10.0
    for _ in range(60):
        mid = 0.5 * (lo + hi)
        if wire_series(0, mid, Bi, lams) < target:
            lo = mid
        else:
            hi = mid
    print(f"t = {mid:.3f}  (one-term estimate 3/lambda1^2 = {3/lams[0]**2:.3f})")

    print("\n=== 4. Case: thin Pt wire, R = 25 um, in still air ===")
    k, alpha, h, q = 71.6, 2.5e-5, 300.0, 1e9      # W/m/K, m^2/s, W/m^2/K, W/m^3 (illustrative)
    R = 25e-6
    Bi = h * R / k
    print(f"  Bi = hR/k = {Bi:.2e} -> nearly uniform temperature (lumped), lambda1 = {eigenvalues(3, Bi, 1)[0]:.4f}")
    print(f"  steady rise T - T_inf = q R / (2 h) = {q*R/(2*h):.1f} K; time constant R^2/(alpha lambda1^2) = "
          f"{R*R/(alpha*eigenvalues(3, Bi, 1)[0]**2)*1e3:.2f} ms (lumped rho c R/(2h))")
