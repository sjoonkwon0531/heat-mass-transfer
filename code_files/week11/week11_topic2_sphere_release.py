# Week 11 - Topic 2: Transient Diffusion in a Sphere - Drug Release from a Gel Bead
# Lecture (Part 1):
#   dc/dt = D (d2c/dr2 + (2/r) dc/dr),  c(R,t) = cs = 0 (perfect sink),  dc/dr(0,t) = 0,  c(r,0) = c0
#   (c - c0)/(cs - c0) = 1 + (2R/(pi r)) sum_n (-1)^n/n sin(n pi r/R) exp(-n^2 pi^2 D t/R^2)
#   centre (r -> 0, sin x/x -> 1):  (c(0,t) - c0)/(cs - c0) = 1 + 2 sum_n (-1)^n exp(-n^2 pi^2 tau)
#   release rate   W(t) = 8 pi c0 D R sum_n exp(-n^2 pi^2 tau)
#   remaining      m(t)/m0 = (6/pi^2) sum_n (1/n^2) exp(-n^2 pi^2 tau),   tau = D t / R^2
#   long times (one term): m/m0 ~ (6/pi^2) exp(-pi^2 tau)  (the lecture writes ~ exp(-pi^2 tau))
#   short times: released fraction ~ 6 sqrt(tau/pi) - 3 tau  (semi-infinite limit with curvature)
# This script: series solution, a finite-volume check in spherical coordinates,
# half-release and 90%-release times, and how release time scales with bead radius.

import math


def remaining_fraction(tau, nterms=400):
    if tau <= 0:
        return 1.0
    return 6.0 / math.pi ** 2 * sum(math.exp(-(n * math.pi) ** 2 * tau) / n ** 2 for n in range(1, nterms + 1))


def theta(rho, tau, nterms=400):
    """c/c0 inside the bead (sink at the surface, cs = 0)"""
    if tau <= 0:
        return 1.0
    s = 0.0
    for n in range(1, nterms + 1):
        e = math.exp(-(n * math.pi) ** 2 * tau)
        if e < 1e-300:
            break
        shape = n * math.pi if rho < 1e-12 else math.sin(n * math.pi * rho) / rho
        s += 2.0 * (-1) ** (n + 1) / (n * math.pi) * shape * e
    return s   # c/c0 = (2/(pi rho)) sum (-1)^(n+1)/n sin(n pi rho) exp(-n^2 pi^2 tau)


def tau_for(remaining):
    lo, hi = 1e-8, 5.0
    for _ in range(200):
        mid = math.sqrt(lo * hi)
        if remaining_fraction(mid) > remaining:
            lo = mid
        else:
            hi = mid
    return math.sqrt(lo * hi)


def finite_volume(tau_end, N=200, steps=40000):
    """explicit finite volume on N shells, returns (centre c/c0, remaining fraction)"""
    dr = 1.0 / N
    rc = [(i + 0.5) * dr for i in range(N)]
    vol = [((i + 1) ** 3 - i ** 3) * dr ** 3 / 3.0 for i in range(N)]
    area = [(i + 1) ** 2 * dr ** 2 for i in range(N)]       # outer face of shell i (4 pi dropped)
    dt = tau_end / steps
    assert dt < 0.5 * dr * dr / 3.0, "explicit step too large"
    c = [1.0] * N
    for _ in range(steps):
        flux = [0.0] * N
        for i in range(N - 1):
            flux[i] = -area[i] * (c[i + 1] - c[i]) / dr
        flux[N - 1] = -area[N - 1] * (0.0 - c[N - 1]) / (0.5 * dr)
        new = c[:]
        for i in range(N):
            inflow = (flux[i - 1] if i > 0 else 0.0) - flux[i]
            new[i] = c[i] + dt * inflow / vol[i]
        c = new
    m = sum(ci * vi for ci, vi in zip(c, vol)) * 3.0     # total volume = 1/3
    return c[0], m


if __name__ == "__main__":
    print("=== 1. Series solution: centre concentration and remaining drug ===")
    print("  tau      c(0)/c0    m/m0 (series)   one-term (6/pi^2)e^(-pi^2 tau)")
    for tau in (0.01, 0.03, 0.05, 0.1, 0.2, 0.3):
        print(f"  {tau:5.2f}    {theta(0.0, tau):.5f}    {remaining_fraction(tau):.5f}        "
              f"{6/math.pi**2*math.exp(-math.pi**2*tau):.5f}")

    print("\n=== 2. Check against a finite-volume solution (200 shells) ===")
    for tau in (0.03, 0.1):
        c0, m = finite_volume(tau)
        print(f"  tau = {tau:4.2f}: centre FV = {c0:.4f} vs series {theta(0.5/200, tau):.4f}; "
              f"m/m0 FV = {m:.4f} vs series {remaining_fraction(tau):.4f}")

    print("\n=== 3. Characteristic release times ===")
    t50, t90 = tau_for(0.5), tau_for(0.1)
    print(f"  50% released at tau = {t50:.4f};  90% released at tau = {t90:.4f}")
    print(f"  short-time check: 6 sqrt(tau/pi) - 3 tau at tau_50 = {6*math.sqrt(t50/math.pi)-3*t50:.4f} (should be 0.5)")

    print("\n=== 4. Case: release from hydrogel beads (illustrative diffusivities) ===")
    for name, D in (("small drug, D = 5e-10 m^2/s", 5e-10), ("protein, D = 1e-11 m^2/s", 1e-11)):
        print("  " + name)
        for R_mm in (0.1, 0.5, 1.0, 2.0):
            R = R_mm * 1e-3
            print(f"    R = {R_mm:3.1f} mm: t50 = {t50*R*R/D/60:8.2f} min, t90 = {t90*R*R/D/60:8.1f} min")
    print("  -> release time scales as R^2/D: halving the bead radius releases four times faster")
