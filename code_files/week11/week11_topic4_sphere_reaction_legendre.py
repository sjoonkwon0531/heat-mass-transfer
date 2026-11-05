# Week 11 - Topic 4: Spherical Coordinates - Reaction in a Catalyst Pellet and Legendre Polynomials
# Lecture (Part 3):
#   * radial problem (w = r^2, p = r^2): (1/r^2)(r^2 F')' = -lambda^2 F -> F = sin(lambda r)/r (spherical Bessel j0)
#       Type 1 F(1) = 0: lambda_n = n pi;  Type 2 F'(1) = 0: lambda = tan(lambda);
#       Type 3 F'(1) + A F(1) = 0: lambda = (1 - A) tan(lambda)
#   * Ex 1, steady first-order reaction in a sphere, Da = k R^2/D (= phi^2, Thiele modulus squared):
#       (1/r^2)(r^2 Theta')' - Da Theta = 0, Theta'(0) = 0, Theta(1) = 1
#       Theta = sinh(sqrt(Da) r)/(r sinh(sqrt(Da)))     (modified spherical Bessel i0)
#       effectiveness factor eta = 3 (phi coth phi - 1)/phi^2
#   * Ex 2, transient start-up, Theta(r,0) = 0 (finite Fourier transform with Type 1 eigenfunctions):
#       Theta = sinh(sqrt(Da) r)/(r sinh sqrt(Da)) + 2 sum_n (n pi)(-1)^n/((n pi)^2 + Da)
#               * exp(-((n pi)^2 + Da) t) sin(n pi r)/r
#   * polar problem (eta = cos(theta), w = 1, p = 1 - eta^2): Legendre polynomials P_n, lambda^2 = n(n+1),
#       int_-1^1 P_n P_m d eta = 2/(2n+1) delta_nm
#   * Ex 3, sphere (conductivity k_B) in a matrix (k_A) under a uniform gradient G, gamma = k_B/k_A:
#       outside T = G r cos(theta) [1 + ((1 - gamma)/(2 + gamma)) (R/r)^3],  inside T = G r cos(theta) 3/(2 + gamma)
#       -> Maxwell's effective conductivity of a dilute suspension (volume fraction f):
#       k_eff/k_A = (gamma + 2 + 2 f (gamma - 1)) / (gamma + 2 - f (gamma - 1))

import math


def steady_profile(r, Da):
    p = math.sqrt(Da)
    if r < 1e-12:
        return p / math.sinh(p)
    return math.sinh(p * r) / (r * math.sinh(p))


def effectiveness(phi):
    return 3.0 * (phi / math.tanh(phi) - 1.0) / phi ** 2


def transient(r, t, Da, nterms=400):
    s = steady_profile(r, Da)
    for n in range(1, nterms + 1):
        a = n * math.pi
        shape = a if r < 1e-12 else math.sin(a * r) / r
        s += 2.0 * a * (-1) ** n / (a * a + Da) * math.exp(-(a * a + Da) * t) * shape
    return s


def fv_transient(t_end, Da, N=60):
    dr = 1.0 / N
    steps = int(t_end / (0.15 * dr * dr)) + 1
    dt = t_end / steps
    rc = [(i + 0.5) * dr for i in range(N)]
    vol = [((i + 1) ** 3 - i ** 3) * dr ** 3 / 3.0 for i in range(N)]
    th = [0.0] * N
    for _ in range(steps):
        new = th[:]
        for i in range(N):
            aw, ae = (i * dr) ** 2, ((i + 1) * dr) ** 2
            fw = aw * (th[i] - th[i - 1]) / dr if i > 0 else 0.0
            fe = ae * ((th[i + 1] if i < N - 1 else 1.0) - th[i]) / (dr if i < N - 1 else dr / 2)
            new[i] = th[i] + dt * ((fe - fw) / vol[i] - Da * th[i])
        th = new
    return rc, th


def legendre(n, x):
    p0, p1 = 1.0, x
    if n == 0:
        return p0
    for k in range(1, n):
        p0, p1 = p1, ((2 * k + 1) * x * p1 - k * p0) / (k + 1)
    return p1


def gauss_legendre_integral(f, m=40):
    # composite Simpson on [-1, 1] is adequate for polynomial products of low order
    n = 2 * m
    h = 2.0 / n
    s = f(-1.0) + f(1.0)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * f(-1.0 + i * h)
    return s * h / 3


def maxwell(gamma, f):
    return (gamma + 2 + 2 * f * (gamma - 1)) / (gamma + 2 - f * (gamma - 1))


if __name__ == "__main__":
    print("=== 1. Steady reaction in a sphere: profile and effectiveness factor ===")
    for Da in (0.25, 1.0, 9.0, 100.0):
        phi = math.sqrt(Da)
        print(f"  Da = {Da:6.2f} (phi = {phi:5.2f}): centre Theta = {steady_profile(0, Da):.4f}, "
              f"eta = {effectiveness(phi):.4f}, large-phi limit 3/phi = {3/phi:.4f}")

    print("\n=== 2. Transient start-up (Ex 2): series vs finite volume, Da = 9 ===")
    Da = 9.0
    for t in (0.02, 0.1, 0.5):
        rc, th = fv_transient(t, Da)
        print(f"  t = {t:4.2f}: centre series = {transient(0, t, Da):.5f}, FV = {th[0]:.5f}  "
              f"(steady {steady_profile(0, Da):.5f})")
    print(f"  check t = 0: Theta(0.5, 0) = {transient(0.5, 0.0, Da, 4000):.4f} (should be 0)")
    print(f"  slowest decay rate pi^2 + Da = {math.pi**2 + Da:.3f}: reaction speeds up the approach to steady state")

    print("\n=== 3. Radial eigenvalues of a sphere ===")
    def root(f, a, b):
        for _ in range(100):
            c = 0.5 * (a + b)
            if f(a) * f(c) <= 0:
                b = c
            else:
                a = c
        return 0.5 * (a + b)
    t2 = [root(lambda x: math.sin(x) - x * math.cos(x), (k + 0.5) * math.pi - 0.5, (k + 0.5) * math.pi - 1e-9) for k in range(1, 4)]
    print("  Type 1: n pi =", [round(k * math.pi, 4) for k in range(1, 4)])
    print("  Type 2 (lambda = tan lambda):", [round(v, 4) for v in t2])

    print("\n=== 4. Legendre polynomials: orthogonality ===")
    for n in range(4):
        row = [gauss_legendre_integral(lambda x: legendre(n, x) * legendre(m, x)) for m in range(4)]
        print("  ", " ".join(f"{v:+.4f}" for v in row), f"   2/(2n+1) = {2/(2*n+1):.4f}")

    print("\n=== 5. Sphere in a gradient: Maxwell effective conductivity ===")
    print("  gamma = kB/kA   inside gradient 3/(2+gamma)   k_eff/k_A at f = 0.1, 0.3")
    for gamma in (0.0, 0.1, 1.0, 10.0, 100.0):
        print(f"  {gamma:7.1f}          {3/(2+gamma):.4f}                  {maxwell(gamma,0.1):.4f}, {maxwell(gamma,0.3):.4f}")
    print("  case: thermal interface material, epoxy kA = 0.2 W/m/K with alumina kB = 30 W/m/K")
    for f in (0.1, 0.3, 0.5):
        print(f"    f = {f:.1f}: k_eff = {0.2*maxwell(150.0, f):.3f} W/m/K")
    print("  -> even very conductive fillers raise k_eff by at most (1 + 2f)/(1 - f) in the dilute model")
