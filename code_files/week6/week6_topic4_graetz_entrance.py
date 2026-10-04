# Week 6 - Topic 4: The Graetz Problem - Eigenvalues, Entrance Region, Nu_inf
# Confined laminar tube flow with constant wall temperature (lecture Part 3).
# Fully developed region: Sturm-Liouville eigenvalue problem
#   (1/eta) d/deta(eta dPhi/deta) = -lam^2 (1 - eta^2) Phi,  Phi'(0)=0, Phi(1)=0
#   -> lam_1 = 2.7044, 6.6790, 10.673, ... and Nu_inf = lam_1^2 / 2 = 3.656
# Thermal entrance region (Leveque): Nu = 1.357 (R/z)^(1/3) Pe^(1/3),
#   with 1.357 = 6 / [Gamma(1/3) (9/2)^(1/3)], i.e. slope -1/3 on log Nu vs log z.
# Thermal entrance length: L_T / R ~ 0.1 Pe  (plus ~1 R when Pe is not large).

import math

def phi_at_wall(lam, n=4000):
    """Integrate the Graetz ODE from eta ~ 0 to 1 (RK4); return Phi(1)."""
    h = 1.0 / n
    eta = 1e-6
    y = [1.0 - lam ** 2 * eta ** 2 / 4.0, -lam ** 2 * eta / 2.0]  # series start

    def rhs(e, y):
        return [y[1], -lam ** 2 * (1.0 - e * e) * y[0] - y[1] / e]

    while eta < 1.0 - 1e-12:
        s = min(h, 1.0 - eta)
        k1 = rhs(eta, y)
        k2 = rhs(eta + s / 2, [y[i] + s / 2 * k1[i] for i in range(2)])
        k3 = rhs(eta + s / 2, [y[i] + s / 2 * k2[i] for i in range(2)])
        k4 = rhs(eta + s, [y[i] + s * k3[i] for i in range(2)])
        y = [y[i] + s / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) for i in range(2)]
        eta += s
    return y[0]

def graetz_eigenvalues(count=5):
    """Scan + bisection for the first `count` eigenvalues."""
    eigs, prev_l, prev_f = [], 0.5, phi_at_wall(0.5)
    lam = 0.6
    while len(eigs) < count:
        f = phi_at_wall(lam)
        if prev_f * f < 0:
            lo, hi, flo = prev_l, lam, prev_f
            for _ in range(60):
                mid = 0.5 * (lo + hi)
                fm = phi_at_wall(mid)
                if flo * fm <= 0:
                    hi = mid
                else:
                    lo, flo = mid, fm
            eigs.append(0.5 * (lo + hi))
        prev_l, prev_f = lam, f
        lam += 0.1
    return eigs

def nu_leveque(z_over_R, Pe):
    return 1.357 * (1.0 / z_over_R) ** (1.0 / 3.0) * Pe ** (1.0 / 3.0)

if __name__ == "__main__":
    eigs = graetz_eigenvalues(5)
    print("Graetz eigenvalues (shooting + bisection):")
    print("  computed :", "  ".join(f"{e:7.4f}" for e in eigs))
    print("  lecture  :  2.7044   6.6790  10.6730  14.6710  18.6700")
    nu_inf = eigs[0] ** 2 / 2.0
    print(f"\n  Nu_inf = lam_1^2 / 2 = {nu_inf:.3f}   (lecture: 3.656)")
    print("  (cf. Week 5 used the engineering value 3.660 - same physics,")
    print("   slightly different averaging convention.)")

    # Leveque constant from first principles
    C = 6.0 / (math.gamma(1.0 / 3.0) * (9.0 / 2.0) ** (1.0 / 3.0))
    print(f"\nLeveque constant: 6/[Gamma(1/3)(9/2)^(1/3)] = {C:.4f} (lecture: 1.357)")
    print(f"  Gamma(1/3) = {math.gamma(1/3):.5f}")

    # entrance-region decay, slope -1/3
    Pe = 1000.0
    print(f"\nEntrance region at Pe = {Pe:.0f}: Nu(z) = 1.357 (R/z)^(1/3) Pe^(1/3)")
    print("  z/R        Nu_Leveque   vs Nu_inf")
    for zR in (0.1, 1.0, 10.0, 100.0 * 0.1 * Pe / 10):
        nu = nu_leveque(zR, Pe)
        print(f"  {zR:8.1f}  {nu:10.2f}   {'entrance' if nu > nu_inf else '-> fully developed'}")
    LT = 0.1 * Pe
    print(f"  thermal entrance length: L_T/R ~ 0.1 Pe = {LT:.0f}  (z/R beyond this: Nu ~ 3.66)")
    nu_at_LT = nu_leveque(LT, Pe)
    print(f"  check: Nu_Leveque(L_T) = {nu_at_LT:.2f}, same order as Nu_inf = {nu_inf:.2f} v")

    # log-log slope check
    s = (math.log(nu_leveque(10, Pe)) - math.log(nu_leveque(1, Pe))) / (math.log(10) - math.log(1))
    print(f"  log-log slope = {s:.4f} (= -1/3: the lecture's entrance-region signature)")

    assert abs(eigs[0] - 2.7044) < 2e-3
    assert abs(nu_inf - 3.656) < 5e-3
    assert abs(s + 1.0 / 3.0) < 1e-9
