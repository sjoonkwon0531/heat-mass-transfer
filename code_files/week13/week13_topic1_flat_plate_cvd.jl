# Week 13 · Topic 1 — Flat-plate correlations, the unheated starting length, and the CVD example
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   Laminar (Re_L < 2e5):   Sh_L = 0.664 Re_L^(1/2) Sc^(1/3)
#   Turbulent (Re_L > 2e5): Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3)
#   Wall active from x = X: Sh_x = 0.332 Re_x^(1/2) [Sc / (1 - (X/x)^(3/4))]^(1/3)
using Printf

sh_plate_mean(Re, Sc) = Re < 2e5 ? 0.664 * Re^0.5 * cbrt(Sc) : 0.0365 * Re^0.8 * cbrt(Sc)
jD_plate(Re) = Re < 2e5 ? 0.664 * Re^-0.5 : 0.0365 * Re^-0.2
sh_x_entrance(Rex, Sc, Xx) = 0.332 * sqrt(Rex) * cbrt(Sc / (1 - Xx^0.75))

function main()
    println("Topic 1 — flat-plate correlations and the CVD example\n")
    println("[1] Mean Sh and j_D on a flat plate (Sc = 1)")
    println("   Re_L       regime      Sh_L        j_D")
    for Re in (1e3, 1e4, 1e5, 1.99e5, 2.01e5, 1e6, 1e7)
        reg = Re < 2e5 ? "laminar" : "turbulent"
        @printf("   %8.2e  %-10s %10.2f  %.5f\n", Re, reg, sh_plate_mean(Re, 1.0), jD_plate(Re))
    end
    println("   (Check: j_D = Sh / (Re Sc^(1/3)) equals C_f/2 for a flat plate.)\n")

    println("[2] Entrance (unheated starting length) factor [1 - (X/x)^(3/4)]^(-1/3)")
    for r in (0.0, 0.2, 0.44444, 0.6, 0.8, 0.9, 0.99)
        @printf("   X/x = %6.4f   factor = %6.3f\n", r, (1 - r^0.75)^(-1 / 3))
    end
    println()

    println("[3] CVD example: v = 100 cm/s, nu = 5.686 cm2/s, D_AB = 1.55 cm2/s, X = 4 cm, x = 9 cm")
    v, nu, D, X, x = 100.0, 5.686, 1.55, 4.0, 9.0
    Re = v * x / nu; Sc = nu / D
    ratio = cbrt(Sc / (1 - (X / x)^0.75))
    Sh = sh_x_entrance(Re, Sc, X / x); kc = Sh * D / x
    @printf("   Re_x = %.1f (laminar),  Sc = %.3f\n", Re, Sc)
    @printf("   entrance factor (Sc/(1-(X/x)^0.75))^(1/3) = %.3f\n", ratio)
    @printf("   Sh_x = %.3f   ->   k_c = Sh D / x = %.3f cm/s\n", Sh, kc)
    dM = 4.79 * x / sqrt(Re); dc = dM / ratio; kf = D / dc
    @printf("   delta_M = 4.79 x / Re^(1/2) = %.3f cm,  delta_M/delta_c = %.3f,  delta_c = %.3f cm\n", dM, ratio, dc)
    @printf("   film theory k_c = D/delta_c = %.3f cm/s   (%.0f%% below the BL result)\n", kf, (1 - kf / kc) * 100)
    @printf("   with the cubic-profile wall gradient 3/2: k_c = 1.5 D/delta_c = %.3f cm/s\n", 1.5 * kf)
end

main()
