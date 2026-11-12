# Week 12 - Topic 4: Heat-Mass Analogy (Lewis Number) and the Three Models of kc
# Lecture (Part 1-2):
#   * Sc = nu/D, Pr = nu/alpha, Le = alpha/D;  Chilton-Colburn j_H = j_D  ->  h/kc = rho cp Le^(2/3)
#   * wet bulb: h (T_inf - T_s) = lambda kc (rho_v,s - rho_v,inf)
#   * kc models: film ~ D, penetration ~ D^(1/2), boundary layer ~ D^(2/3)
# Run: julia week12_topic4_wetbulb_kc_models.jl

using Printf

psat(T) = 611.21 * exp((18.678 - T / 234.5) * (T / (257.14 + T)))

function wet_bulb(T, RH, Le; P=101325.0)
    Tk = T + 273.15
    rho = P * 0.02897 / (8.314 * Tk); cp = 1006.0
    rv = RH * psat(T) * 0.018015 / (8.314 * Tk)
    f(Ts) = (T - Ts) * rho * cp * Le^(2 / 3) - (2.501e6 - 2370.0 * Ts) * (psat(Ts) * 0.018015 / (8.314 * (Ts + 273.15)) - rv)
    lo, hi = -20.0, Float64(T)
    for _ in 1:100
        mid = 0.5 * (lo + hi)
        f(lo) * f(mid) <= 0 ? (hi = mid) : (lo = mid)
    end
    return 0.5 * (lo + hi)
end

alpha, D = 2.2e-5, 2.6e-5
Le = alpha / D
println("=== 1. Lewis number of water vapor in air ===")
@printf("  Le = alpha/D = %.3f;  Le^(2/3) = %.3f  -> h/(rho cp kc) close to 1\n", Le, Le^(2 / 3))

println("\n=== 2. Wet-bulb temperature from the heat-mass analogy ===")
println("   T (C)  RH    T_wb (Le^(2/3))   T_wb (Le = 1)")
for (T, RH) in ((20, 0.5), (25, 0.6), (30, 0.5), (35, 0.3), (40, 0.2))
    @printf("   %4.0f  %.1f   %8.2f          %8.2f\n", T, RH, wet_bulb(T, RH, Le), wet_bulb(T, RH, 1.0))
end
println("  -> the difference between the two columns is the Lewis-number effect (a few tenths of a kelvin)")

println("\n=== 3. Evaporative cooling potential (T - T_wb) ===")
for RH in (0.2, 0.4, 0.6, 0.8, 1.0)
    @printf("  30 C, RH = %.1f: depression = %5.2f K\n", RH, 30 - wet_bulb(30, RH, Le))
end

println("\n=== 4. How kc scales with D in the three models ===")
let D1 = 1e-9, D2 = 2e-9, delta = 50e-6, tc = 0.1, nu = 1e-6, v = 0.5, L = 0.05
    models = (("film", d -> d / delta),
              ("penetration", d -> 2 * sqrt(d / (pi * tc))),
              ("boundary layer", d -> 0.664 * d / L * sqrt(v * L / nu) * cbrt(nu / d)))
    for (name, fn) in models
        k1, k2 = fn(D1), fn(D2)
        @printf("  %-15s: kc(D) = %7.2f um/s, doubling D multiplies kc by %.3f (exponent %.3f)\n", name, k1 * 1e6, k2 / k1, log(k2 / k1) / log(2))
    end
end
println("  -> plotting log kc against log D and reading the slope tells which picture fits the equipment")
