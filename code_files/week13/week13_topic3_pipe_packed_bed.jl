# Week 13 · Topic 3 — Confined flows: pipes and packed beds
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   Gilliland & Sherwood: Sh (p_B,lm/P) = 0.023 Re^0.83 Sc^0.44;  Linton & Sherwood: Sh = 0.023 Re^0.83 Sc^(1/3)
#   Laminar tube: Sh = 1.86 (Re Sc d/L)^(1/3);  packed bed: j_D = 1.17 Re^-0.415
#   Wilson & Geankoplis (liquids): eps j_D = 1.09 Re^(-2/3) (Re < 55), 0.250 Re^(-0.31) (55 < Re < 1500)
using Printf

sh_gilliland(Re, Sc, pB = 1.0) = 0.023 * Re^0.83 * Sc^0.44 / pB
sh_linton(Re, Sc) = 0.023 * Re^0.83 * cbrt(Sc)
sh_laminar_tube(Re, Sc, dL) = 1.86 * cbrt(Re * Sc * dL)
jD_packed_gas(Re) = 1.17 * Re^-0.415
eps_jD_wilson(Re) = Re < 55 ? 1.09 * Re^(-2 / 3) : 0.250 * Re^-0.31

function main()
    println("Topic 3 — pipes and packed beds\n")
    println("[1] Water evaporating into air in a wetted-wall tube (d = 2.5 cm, v = 3 m/s, 25 C)")
    d, v, nu, D = 0.025, 3.0, 1.55e-5, 2.6e-5
    Re = v * d / nu; Sc = nu / D; Sh = sh_gilliland(Re, Sc)
    @printf("   Re = %.0f, Sc = %.3f, Sh = %.2f, k_c = %.4f m/s  (p_B,lm/P taken as 1)\n\n", Re, Sc, Sh, Sh * D / d)

    println("[2] Benzoic acid lining a pipe, water flow (d = 2.5 cm, Re = 1e4, Sc = 1000, D = 1e-9 m2/s)")
    Sh = sh_linton(1e4, 1000.0)
    @printf("   Linton-Sherwood: Sh = %.1f, k_c = %.3e m/s\n\n", Sh, Sh * 1e-9 / 0.025)

    println("[3] Laminar tube, Re = 500, Sc = 1000: effect of the length")
    for Ld in (10, 100, 1000)
        @printf("   L/d = %5d   Sh = %.2f\n", Ld, sh_laminar_tube(500, 1000, 1 / Ld))
    end
    println("   (Longer tubes give a smaller mean Sh: the concentration layer keeps thickening.)\n")

    println("[4] Water through a bed of benzoic acid spheres (d_p = 6 mm, v' = 1 mm/s, eps = 0.40, Sc = 1000)")
    dp, vs, nu, eps, Sc, D = 6e-3, 1e-3, 8.9e-7, 0.40, 1000.0, 8.9e-10
    Re = dp * vs / nu; jD = eps_jD_wilson(Re) / eps; kc = jD * vs / Sc^(2 / 3)
    @printf("   Re = %.2f  ->  eps j_D = %.4f, j_D = %.4f, k_c = %.3e m/s\n", Re, eps_jD_wilson(Re), jD, kc)
    @printf("   Sh = k_c d_p / D = %.2f\n", kc * dp / D)
    @printf("   continuity check at Re = 55: %.4f vs %.4f\n\n", 1.09 * 55^(-2 / 3), 0.250 * 55^-0.31)

    println("[5] Gas through a packed bed: j_D = 1.17 Re^-0.415")
    for Re in (10, 100, 1000, 2500)
        @printf("   Re = %5d   j_D = %.4f\n", Re, jD_packed_gas(Re))
    end
end

main()
