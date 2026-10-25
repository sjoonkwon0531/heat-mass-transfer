# Week 9 - Topic 1: Gas Diffusivity (Kinetic Theory, Chapman-Enskog, Fuller)
# Lecture (Part 1):
#   * kinetic theory:  mean free path  lambda = kB T / (sqrt(2) pi sigma^2 P)
#                      mean speed      u = sqrt(8 R T / (pi M))
#                      self-diffusion  D_AA* = lambda u / 3
#   * Chapman-Enskog (Lennard-Jones gas), D in cm^2/s, T in K, P in atm, sigma in Angstrom:
#       D_AB = 1.858e-3 T^(3/2) sqrt(1/M_A + 1/M_B) / (P sigma_AB^2 Omega_D)
#       sigma_AB = (sigma_A + sigma_B)/2,  eps_AB = sqrt(eps_A eps_B)
#       Omega_D = f(kB T / eps_AB)  (collision integral; Neufeld et al. 1972 fit)
#   * Fuller equation (diffusion volumes v from the lecture table):
#       D_AB = 1.011e-3 T^1.75 sqrt(1/M_A + 1/M_B) / (P [(sum v_A)^(1/3) + (sum v_B)^(1/3)]^2)
#   * scaling: D(T2,P2) = D(T1,P1) (P1/P2) (T2/T1)^(3/2) Omega_D(T1)/Omega_D(T2)

import math

KB = 1.380649e-23   # J/K
R = 8.314462618     # J/(mol K)
ATM = 101325.0      # Pa

# Lennard-Jones parameters (sigma [Angstrom], eps/kB [K]) and molar mass [g/mol]
# (classic Hirschfelder-type table used in transport textbooks)
GAS = {
    "H2":  (2.968, 33.3, 2.016),
    "He":  (2.576, 10.2, 4.003),
    "N2":  (3.681, 91.5, 28.01),
    "O2":  (3.433, 113.0, 32.00),
    "Air": (3.617, 97.0, 28.97),
    "Ar":  (3.418, 124.0, 39.95),
    "CO2": (3.996, 190.0, 44.01),
    "CH4": (3.822, 137.0, 16.04),
}
# Fuller diffusion volumes (lecture table)
VOL = {"H2": 7.07, "He": 2.88, "N2": 17.9, "O2": 16.6, "Air": 20.1,
       "Ar": 16.1, "CO2": 26.9, "CH4": 16.5 + 4 * 1.98}


def omega_d(tstar):
    """Collision integral for diffusion, Neufeld-Janzen-Aziz (1972) fit."""
    A, B, C, D, E, F, G, H = 1.06036, 0.15610, 0.19300, 0.47635, 1.03587, 1.52996, 1.76474, 3.89411
    return (A / tstar ** B + C / math.exp(D * tstar) + E / math.exp(F * tstar)
            + G / math.exp(H * tstar))


def chapman_enskog(a, b, T, P_atm=1.0):
    sa, ea, Ma = GAS[a]
    sb, eb, Mb = GAS[b]
    sab = 0.5 * (sa + sb)
    eab = math.sqrt(ea * eb)
    om = omega_d(T / eab)
    D = 1.858e-3 * T ** 1.5 * math.sqrt(1 / Ma + 1 / Mb) / (P_atm * sab ** 2 * om)
    return D, sab, eab, om


def fuller(a, b, T, P_atm=1.0):
    Ma, Mb = GAS[a][2], GAS[b][2]
    den = (VOL[a] ** (1 / 3) + VOL[b] ** (1 / 3)) ** 2
    return 1.011e-3 * T ** 1.75 * math.sqrt(1 / Ma + 1 / Mb) / (P_atm * den)


def kinetic_self(gas, T, P_atm=1.0):
    s, _, M = GAS[gas]
    sig = s * 1e-10
    lam = KB * T / (math.sqrt(2) * math.pi * sig ** 2 * P_atm * ATM)
    u = math.sqrt(8 * R * T / (math.pi * M * 1e-3))
    return lam, u, lam * u / 3.0


if __name__ == "__main__":
    print("Omega_D check: T* = 1 ->", round(omega_d(1.0), 4), "(table 1.439)")
    print("               T* = 10 ->", round(omega_d(10.0), 4), "(table 0.7424)")

    T = 293.15
    D, sab, eab, om = chapman_enskog("CO2", "Air", T)
    print(f"\nCO2-air at {T} K, 1 atm (Chapman-Enskog):")
    print(f"  sigma_AB = {sab:.4f} A, eps_AB/kB = {eab:.1f} K, kT/eps = {T/eab:.3f}, Omega_D = {om:.4f}")
    print(f"  D_AB = {D:.4f} cm^2/s")
    print(f"  Fuller: D_AB = {fuller('CO2', 'Air', T):.4f} cm^2/s")

    print("\nPair        T(K)   Chapman-Enskog   Fuller   (cm^2/s)")
    for a, b in [("H2", "N2"), ("O2", "N2"), ("CO2", "N2"), ("He", "Ar"), ("CH4", "Air")]:
        for TT in (300.0, 600.0):
            print(f"{a:>4}-{b:<5} {TT:6.0f}   {chapman_enskog(a, b, TT)[0]:10.4f}   {fuller(a, b, TT):8.4f}")

    # scaling law check
    D1 = chapman_enskog("O2", "N2", 300.0)[0]
    D2 = chapman_enskog("O2", "N2", 600.0, 2.0)[0]
    s1, s2 = omega_d(300.0 / math.sqrt(113 * 91.5)), omega_d(600.0 / math.sqrt(113 * 91.5))
    D2s = D1 * (1.0 / 2.0) * (600.0 / 300.0) ** 1.5 * s1 / s2
    print(f"\nScaling O2-N2: direct D(600 K, 2 atm) = {D2:.5f}, scaled from 300 K = {D2s:.5f}")

    lam, u, Dk = kinetic_self("N2", 300.0)
    print(f"\nN2 at 300 K, 1 atm: lambda = {lam*1e9:.1f} nm, u = {u:.0f} m/s, "
          f"D_kin = lambda*u/3 = {Dk*1e4:.3f} cm^2/s (hard-sphere estimate)")
