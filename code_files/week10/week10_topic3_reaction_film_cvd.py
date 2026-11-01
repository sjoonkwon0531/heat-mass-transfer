# Week 10 - Topic 3: Diffusion with Reaction: Liquid Film (Hatta) and CVD Growth (Grove Model)
# Lecture (Part 1):
#   * gas A absorbed into liquid B with first-order homogeneous reaction R_A = -k1 c_A:
#       D_AB d^2c_A/dz^2 - k1 c_A = 0,  c_A(0) = c_A0,  c_A(delta) = 0
#       c_A(z) = c_A0 [cosh(phi z/delta) - sinh(phi z/delta)/tanh(phi)],  phi = delta sqrt(k1/D_AB)
#       N_Az|0 = (D_AB c_A0/delta) * phi/tanh(phi)
#     phi is the Hatta number Ha; E = Ha/tanh(Ha) is the enhancement over physical absorption
#     (the lecture labels this flux ratio "Hatta number").
#     large k1: N_Az -> sqrt(D_AB k1) c_A0, so k_c ~ D^(1/2) (vs k_c ~ D for the film model)
#   * CVD growth (Grove): gas-phase transfer F1 = h_g (C_g - C_s), surface reaction F2 = k_s C_s
#       steady state: F1 = F2 -> growth rate = (h_g k_s/(h_g + k_s)) C_g / rho
#       low T: k_s = k_s0 exp(-Ea/kT) << h_g -> reaction limited (Ea ~ 1.9 eV)
#       high T: k_s >> h_g ~ T^n (n = 1.5-2) -> mass-transport limited
# CVD parameter values are illustrative.

import math

KB_EV = 8.617333262e-5   # eV/K


def film_profile(zeta, Ha):
    return math.cosh(Ha * zeta) - math.sinh(Ha * zeta) / math.tanh(Ha)


def enhancement(Ha):
    return Ha / math.tanh(Ha)


def film_fdm(Ha, n=400):
    """Solve u'' = Ha^2 u on [0,1], u(0)=1, u(1)=0 by finite differences (Thomas)."""
    h = 1.0 / n
    a = [0.0] * (n + 1); b = [1.0] * (n + 1); c = [0.0] * (n + 1); d = [0.0] * (n + 1)
    d[0] = 1.0
    for i in range(1, n):
        a[i], b[i], c[i] = 1.0, -(2 + (Ha * h) ** 2), 1.0
    for i in range(1, n + 1):
        m = a[i] / b[i - 1]; b[i] -= m * c[i - 1]; d[i] -= m * d[i - 1]
    u = [0.0] * (n + 1)
    u[n] = d[n] / b[n]
    for i in range(n - 1, -1, -1):
        u[i] = (d[i] - c[i] * u[i + 1]) / b[i]
    # second-order one-sided derivative at z = 0
    dudz = (-3 * u[0] + 4 * u[1] - u[2]) / (2 * h)
    return u, -dudz


def grove_rate(T, ks0=1.0e9, Ea=1.9, hg0=0.05, n=1.75, Cg=1.0, rho=1.0):
    ks = ks0 * math.exp(-Ea / (KB_EV * T))
    hg = hg0 * (T / 1000.0) ** n
    return hg * ks / (hg + ks) * Cg / rho, ks, hg


if __name__ == "__main__":
    print(" Ha      E = Ha/tanh(Ha)   E from FDM    large-Ha limit (=Ha)")
    for Ha in (0.1, 0.5, 1.0, 2.0, 5.0, 10.0):
        u, E_num = film_fdm(Ha)
        print(f"{Ha:5.1f}   {enhancement(Ha):12.5f}   {E_num:10.5f}   {Ha:10.3f}")
    print("profile check Ha = 3, z/delta = 0.5:", round(film_profile(0.5, 3.0), 5),
          "FDM:", round(film_fdm(3.0)[0][200], 5))

    # k_c scaling: film model vs penetration (reaction-dominated) model
    k1, delta = 100.0, 1e-4
    print("\n D (m^2/s)   film k_c = D/delta   reaction k_c = sqrt(D k1)")
    for D in (5e-10, 1e-9, 2e-9, 4e-9):
        print(f" {D:.1e}    {D/delta:.3e}         {math.sqrt(D*k1):.3e}")
    print(" doubling D: film x2, reaction x", round(math.sqrt(2), 3))

    print("\nGrove model (illustrative constants): rate ~ h_g k_s/(h_g + k_s)")
    print("  T (K)   k_s        h_g        rate       regime")
    for T in (700, 800, 900, 1000, 1100, 1200, 1300):
        r, ks, hg = grove_rate(T)
        reg = "reaction-limited" if ks < 0.1 * hg else ("transport-limited" if ks > 10 * hg else "mixed")
        print(f"  {T:5d}  {ks:9.3e}  {hg:9.3e}  {r:9.3e}  {reg}")
    T1, T2 = 700.0, 750.0
    Ea_fit = -KB_EV * math.log(grove_rate(T2)[0] / grove_rate(T1)[0]) / (1 / T2 - 1 / T1)
    print(f"  apparent Ea from the low-T slope = {Ea_fit:.3f} eV (input 1.9 eV)")
