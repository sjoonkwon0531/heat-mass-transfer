# Week 13 · Topic 2 — Creeping flow past a sphere: Stokes drag, terminal velocity, and Sh(Pe)
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   F_D = 6 pi mu U R,  U_T = 2 R^2 (rho_p - rho) g / (9 mu)
#   Pe << 1 (Acrivos & Taylor, Pe = U R / D): Sh = 2[1 + Pe/4 + (Pe^2/8) ln Pe + 0.01702 Pe^2 + (Pe^3/32) ln Pe]
#   Pe >> 1: Sh = 1.249 Pe^(1/3);  Brian & Hales: Sh = (4 + 1.21 Pe_d^(2/3))^(1/2);  Froessling: Sh = 2 + 0.552 Re^(1/2) Sc^(1/3)
using Printf

const G = 9.81
stokes_terminal(R, drho, mu) = 2R^2 * drho * G / (9mu)
function sh_small_pe(Pe)
    Pe <= 0 && return 2.0
    L = log(Pe)
    return 2 * (1 + Pe / 4 + Pe^2 / 8 * L + 0.01702 * Pe^2 + Pe^3 / 32 * L)
end
sh_large_pe(Pe) = 1.249 * cbrt(Pe)
sh_brian_hales(Ped) = sqrt(4 + 1.21 * Ped^(2 / 3))
sh_froessling(Re, Sc) = 2 + 0.552 * sqrt(Re) * cbrt(Sc)

function main()
    println("Topic 2 — creeping flow past a sphere\n")
    println("[1] Stokes terminal velocity  U_T = 2 R^2 (rho_p - rho) g / (9 mu)")
    cases = [("1 um silica in water (CMP slurry)", 0.5e-6, 2200 - 997, 8.9e-4, 997),
             ("10 um water droplet in air", 5e-6, 1000 - 1.18, 1.8e-5, 1.18),
             ("100 um sand grain in water", 50e-6, 2650 - 997, 8.9e-4, 997)]
    for (name, R, drho, mu, rho) in cases
        U = stokes_terminal(R, drho, mu); Re = rho * U * 2R / mu; F = 6pi * mu * U * R
        @printf("   %-34s U_T = %.3e m/s   Re = %.2e   F_D = %.3e N\n", name, U, Re, F)
    end
    println("   (Stokes' law needs Re << 1; the 100 um grain is already at Re ~ 1, the edge of validity.)\n")

    println("[2] Sherwood number of a sphere versus Pe = U R / D   (Sh based on the diameter)")
    println("     Pe       Acrivos-Taylor   1.249 Pe^(1/3)   Brian-Hales(Pe_d = 2 Pe)")
    for Pe in (0.01, 0.1, 0.5, 1, 10, 100, 1000, 1e4)
        st = Pe <= 1 ? sh_small_pe(Pe) : NaN
        @printf("   %7.2g   %12.4f   %12.3f   %12.3f\n", Pe, st, sh_large_pe(Pe), sh_brian_hales(2Pe))
    end
    @printf("   Same law in two notations: 1.249 Pe^(1/3) = 1.249 (Pe_d/2)^(1/3) = %.3f Pe_d^(1/3)\n\n", 1.249 / cbrt(2))

    println("[3] Shape factors for Pe << 1 (Sh on length L)")
    for (name, val) in (("sphere, L = 2R", 2.0), ("oblate spheroid a/b = 1/2, L = 2b", 2.40),
                        ("circular disk, L = 2R", 8 / pi), ("square plate, L = a", pi / log(4)))
        @printf("   %-36s Sh = %.3f\n", name, val)
    end
    println()

    println("[4] Froessling: 1 mm naphthalene sphere in air at 1 m/s (nu = 1.55e-5, D = 6.1e-6 m2/s)")
    d, U, nu, D = 1e-3, 1.0, 1.55e-5, 6.1e-6
    Re = U * d / nu; Sc = nu / D; Sh = sh_froessling(Re, Sc)
    @printf("   Re = %.1f, Sc = %.3f, Sh = %.3f, k_c = %.4f m/s\n", Re, Sc, Sh, Sh * D / d)
end

main()
