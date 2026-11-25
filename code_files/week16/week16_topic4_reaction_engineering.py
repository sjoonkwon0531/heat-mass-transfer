# Week 16 · Topic 4 — Final review: mass transfer in reaction engineering
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   external film (Week 14 lecture form): Sh = 2 + 0.6 Re^1/2 Sc^1/3;  -r'' = kr kc c/(kr + kc)
#   Thiele (sphere, 1st order): phi = R sqrt(k/De), eta = (3/phi^2)(phi coth phi - 1)
#   diffusion-limited carbon burnout: t_f = (rho/M) R0^2 / (12 c D ln 1.042)
#   reaction-limited CVD: d ln G/dT = Ea/(k T^2)
import math

KB_EV = 8.617e-5


def eta_sphere(phi):
    return 1.0 if phi < 1e-6 else 3.0 / phi ** 2 * (phi / math.tanh(phi) - 1.0)


def main():
    print("Topic 4 — mass transfer in reaction engineering\n")
    U, dp, D, nu, cb = 0.1, 0.01, 1e-10, 5e-7, 1000.0
    print("[1] External film around a 1 cm pellet (lecture example), c_Ab = 1 mol/L")
    for UU in (U, 2 * U):
        Re, Sc = UU * dp / nu, nu / D
        Sh = 2 + 0.6 * math.sqrt(Re) * Sc ** (1 / 3)
        print("   U = %.1f m/s: Re = %.0f, Sc = %.0f, Sh = %.1f, k_c = %.4e m/s" % (UU, Re, Sc, Sh, Sh * D / dp))
    kc = (2 + 0.6 * math.sqrt(U * dp / nu) * (nu / D) ** (1 / 3)) * D / dp
    kr = 1e-5
    print("   k_r = 1e-5 m/s: Da = %.3f, rate = %.4e mol/m2 s, c_As/c_Ab = %.4f" % (kr / kc, kr * kc / (kr + kc) * cb, kc / (kr + kc)))
    print()
    print("[2] Internal effectiveness (De = 1e-9 m2/s, rho_c S_a k1 = 0.5 1/s)")
    for R in (3e-3, 1.5e-3):
        phi = R * math.sqrt(0.5 / 1e-9)
        print("   R = %.1f mm: phi = %.2f, eta = %.4f, 3/phi = %.4f" % (R * 1e3, phi, eta_sphere(phi), 3 / phi))
    for phi in (20.0, 5.0):
        print("   phi = %4.1f: eta = %.4f" % (phi, eta_sphere(phi)))
    print("   apparent activation energy under pore control: E_app = E/2 = %.0f kJ/mol for E = 100" % (100 / 2))
    print()
    print("[3] Diffusion-limited carbon burnout, R0 = 100 um, rho_C = 2000 kg/m3, 1 atm")
    for T, Dg in ((1200.0, 2.0e-4), (1500.0, 2.0e-4 * (1500 / 1200) ** 1.75)):
        c = 101325.0 / (8.314 * T)
        tf = (2000.0 / 0.012) * (1e-4) ** 2 / (12 * c * Dg * math.log(1.042))
        print("   T = %.0f K: c = %.2f mol/m3, D = %.3e m2/s, t_f = %.3f s" % (T, c, Dg, tf))
    print()
    Ea, T = 1.9, 973.15
    s = Ea / (KB_EV * T ** 2)
    print("[4] Reaction-limited LPCVD, Ea = 1.9 eV at 700 C")
    print("   d ln G/dT = %.4f 1/K -> +/-1%% thickness needs +/-%.2f K" % (s, 0.01 / s))
    print("   G(700 C)/G(650 C) = %.2f" % math.exp(Ea / KB_EV * (1 / 923.15 - 1 / 973.15)))


main()
