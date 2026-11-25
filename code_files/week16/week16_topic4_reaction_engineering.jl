# Week 16 · Topic 4 — Final review: mass transfer in reaction engineering
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   external film (Week 14 lecture form): Sh = 2 + 0.6 Re^1/2 Sc^1/3;  -r'' = kr kc c/(kr + kc)
#   Thiele (sphere, 1st order): phi = R sqrt(k/De), eta = (3/phi^2)(phi coth phi - 1)
#   diffusion-limited carbon burnout: t_f = (rho/M) R0^2 / (12 c D ln 1.042)
#   reaction-limited CVD: d ln G/dT = Ea/(k T^2)
using Printf
const KB_EV = 8.617e-5
eta_sphere(phi) = phi < 1e-6 ? 1.0 : 3 / phi^2 * (phi / tanh(phi) - 1)

function main()
    println("Topic 4 — mass transfer in reaction engineering\n")
    dp, D, nu = 0.01, 1e-10, 5e-7
    println("[1] External film around a 1 cm pellet (lecture example), c_Ab = 1 mol/L")
    for U in (0.1, 0.2)
        Re = U * dp / nu; Sc = nu / D; Sh = 2 + 0.6 * sqrt(Re) * cbrt(Sc)
        @printf("   U = %.1f m/s: Re = %.0f, Sc = %.0f, Sh = %.1f, k_c = %.4e m/s\n", U, Re, Sc, Sh, Sh * D / dp)
    end
    kc = (2 + 0.6 * sqrt(0.1 * dp / nu) * cbrt(nu / D)) * D / dp; kr = 1e-5
    @printf("   k_r = 1e-5 m/s: Da = %.3f, rate = %.4e mol/m2 s, c_As/c_Ab = %.4f\n\n", kr / kc, kr * kc / (kr + kc) * 1000, kc / (kr + kc))
    println("[2] Internal effectiveness (De = 1e-9 m2/s, rho_c S_a k1 = 0.5 1/s)")
    for R in (3e-3, 1.5e-3)
        phi = R * sqrt(0.5 / 1e-9)
        @printf("   R = %.1f mm: phi = %.2f, eta = %.4f, 3/phi = %.4f\n", R * 1e3, phi, eta_sphere(phi), 3 / phi)
    end
    for phi in (20.0, 5.0)
        @printf("   phi = %4.1f: eta = %.4f\n", phi, eta_sphere(phi))
    end
    @printf("   apparent activation energy under pore control: E_app = E/2 = %.0f kJ/mol for E = 100\n\n", 50)
    println("[3] Diffusion-limited carbon burnout, R0 = 100 um, rho_C = 2000 kg/m3, 1 atm")
    for (T, Dg) in ((1200.0, 2.0e-4), (1500.0, 2.0e-4 * (1500 / 1200)^1.75))
        c = 101325 / (8.314 * T); tf = (2000 / 0.012) * (1e-4)^2 / (12 * c * Dg * log(1.042))
        @printf("   T = %.0f K: c = %.2f mol/m3, D = %.3e m2/s, t_f = %.3f s\n", T, c, Dg, tf)
    end
    println()
    s = 1.9 / (KB_EV * 973.15^2)
    println("[4] Reaction-limited LPCVD, Ea = 1.9 eV at 700 C")
    @printf("   d ln G/dT = %.4f 1/K -> +/-1%% thickness needs +/-%.2f K\n", s, 0.01 / s)
    @printf("   G(700 C)/G(650 C) = %.2f\n", exp(1.9 / KB_EV * (1 / 923.15 - 1 / 973.15)))
end

main()
