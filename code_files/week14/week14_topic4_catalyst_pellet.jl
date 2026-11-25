# Week 14 · Topic 4 — Mass transfer for reaction engineering: external film, packed bed, Thiele modulus
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   Sh = 2 + 0.6 Re^(1/2) Sc^(1/3);  r'' = k_r k_c c_Ab/(k_r + k_c);  c_A/c_A0 = exp(-k_c a_c z/U)
#   eta = (3/phi^2)(phi coth phi - 1);  Omega = eta/(1 + eta k/(k_c a_c))
using Printf

function froessling(U, dp, D, nu)
    Re = U * dp / nu; Sc = nu / D
    Sh = 2 + 0.6 * sqrt(Re) * cbrt(Sc)
    return Re, Sc, Sh, Sh * D / dp
end
eta_sphere(phi) = phi < 1e-4 ? 1.0 : 3 / phi^2 * (phi / tanh(phi) - 1)

function main()
    println("Topic 4 — external film, packed bed, and internal diffusion\n")
    println("[1] Lecture example: d_p = 1 cm, U = 0.1 m/s, D_AB = 1e-10 m2/s, nu = 5e-7 m2/s, c_Ab = 1 mol/L")
    Re, Sc, Sh, kc = froessling(0.1, 0.01, 1e-10, 5e-7)
    @printf("   Re = %.0f, Sc = %.0f, Sh = %.1f, k_c = %.3e m/s\n", Re, Sc, Sh, kc)
    @printf("   instantaneous surface reaction: n_A = k_c c_Ab = %.3e mol/(m2 s)\n\n", kc * 1000)
    println("[2] Finite surface rate: Da = k_r/k_c")
    for Da in (0.01, 0.1, 1, 10, 100)
        kr = Da * kc
        @printf("   Da = %7.2f   c_As/c_Ab = %.4f   rate = %.3e mol/(m2 s)\n", Da, kc / (kr + kc), kr * kc / (kr + kc) * 1000)
    end
    println("   (Da << 1: reaction-limited; Da >> 1: transport-limited.)\n")
    println("[3] Sensitivity of k_c in the transport-limited regime (Sh >> 2): k_c ∝ U^(1/2) d_p^(-1/2) D^(2/3) nu^(-1/6)")
    for U in (0.05, 0.1, 0.2, 0.4)
        @printf("   U = %.2f m/s   k_c = %.3e m/s\n", U, froessling(U, 0.01, 1e-10, 5e-7)[4])
    end
    println()
    println("[4] Mass-transfer-limited packed bed (d_p = 1 cm, bed porosity 0.4, U = 0.1 m/s superficial)")
    ac = 6 * (1 - 0.4) / 0.01
    for z in (0.1, 0.5, 1.0, 2.0, 5.0)
        r = exp(-kc * ac * z / 0.1)
        @printf("   z = %4.1f m   c_A/c_A0 = %.4f   conversion = %.4f\n", z, r, 1 - r)
    end
    @printf("   a_c = %.0f m2/m3\n\n", ac)
    println("[5] Internal effectiveness factor of a sphere")
    println("      phi1      eta        3/phi1")
    for p in (0.1, 0.5, 1, 2, 5, 10, 20)
        @printf("   %7.2f   %.4f    %.4f\n", p, eta_sphere(p), 3 / p)
    end
    println()
    println("[6] Overall effectiveness Omega with the external film (k = 2e-3 1/s, k_c a_c from [1] and [4])")
    kbed = 2e-3
    for p in (0.5, 2, 10)
        eta = eta_sphere(p); Om = eta / (1 + eta * kbed / (kc * ac))
        @printf("   phi1 = %5.1f   eta = %.4f   k_c a_c = %.3e 1/s   Omega = %.4e\n", p, eta, kc * ac, Om)
    end
end

main()
