# Week 12 - Topic 3: Turbulent Mass Transfer - Reynolds, Prandtl, von Karman and Chilton-Colburn Analogies
# Lecture (Part 2):
#   * eddy diffusivity: N_Ay = -(D_AB + eps_D) dcA/dy;  laminar sublayer delta/D = 62 Re^(-7/8)
#   * Reynolds (Sc = 1): kc/v = Cf/2;  Prandtl: kc/v = (Cf/2)/[1 + 5 sqrt(Cf/2)(Sc - 1)]
#   * von Karman: Sh = (Cf/2) Re Sc / {1 + 5 sqrt(Cf/2)[Sc - 1 + ln((1 + 5Sc)/6)]}
#   * Chilton-Colburn: j_D = (kc/v) Sc^(2/3) = Cf/2  (0.6 < Sc < 2500);  smooth pipe Cf/2 = 0.023 Re^(-0.2)
# Run: julia week12_topic3_turbulent_analogies.jl

using Printf

half_cf(Re) = 0.023 * Re^-0.2
sh_reynolds(Re, Sc) = half_cf(Re) * Re * Sc
sh_prandtl(Re, Sc) = (c = half_cf(Re); c * Re * Sc / (1 + 5 * sqrt(c) * (Sc - 1)))
sh_karman(Re, Sc) = (c = half_cf(Re); c * Re * Sc / (1 + 5 * sqrt(c) * (Sc - 1 + log((1 + 5Sc) / 6))))
sh_colburn(Re, Sc) = half_cf(Re) * Re * cbrt(Sc)

for Re in (1e4, 1e5)
    @printf("=== Smooth pipe, Re = %.0e, Cf/2 = %.5f ===\n", Re, half_cf(Re))
    println("     Sc    Reynolds    Prandtl   von Karman   Colburn")
    for Sc in (0.7, 1.0, 2.0, 10.0, 100.0, 1000.0)
        @printf("  %6.1f  %9.1f  %9.1f  %9.1f   %9.1f\n", Sc, sh_reynolds(Re, Sc), sh_prandtl(Re, Sc), sh_karman(Re, Sc), sh_colburn(Re, Sc))
    end
    println()
end
println("  -> all four agree at Sc = 1. Reynolds overshoots at large Sc (it ignores the sublayer resistance);")
println("     Prandtl and von Karman level off (they allow no eddy transport inside the sublayer),")
println("     while Colburn keeps the Sc^(1/3) growth seen in liquid-phase data within 0.6 < Sc < 2500")

println("\n=== Laminar sublayer thickness, delta/D = 62 Re^(-7/8) ===")
for Re in (1e4, 3e4, 1e5, 3e5)
    d = 62 * Re^-0.875
    @printf("  Re = %7.0e: delta/D = %.5f  -> in a 25 mm pipe: %.0f um\n", Re, d, d * 25e3)
end

println("\n=== Case: wall dissolution in a water pipe (Sc = 1000, Re = 2e4, D = 1e-9 m^2/s, d = 25 mm) ===")
let Re = 2e4, Sc = 1000.0, D = 1e-9, d = 0.025
    for (name, fn) in (("Prandtl", sh_prandtl), ("von Karman", sh_karman), ("Colburn", sh_colburn))
        Sh = fn(Re, Sc)
        @printf("  %-10s: Sh = %7.1f, kc = %.2f um/s\n", name, Sh, Sh * D / d * 1e6)
    end
end
println("  -> a factor of ~3 between models at Sc = 1000: for liquids, use a Sc^(1/3) correlation")
