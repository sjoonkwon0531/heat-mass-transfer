# Week 14 · Topic 3 — Simultaneous heat and mass transfer: a water droplet evaporating in N2
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   (1 - x_inf)/(1 - x_R) = [1 + c_pW (T_inf - T_R)/lambda]^(a*),  a* = k_G/(C c_pW D),  x_R = p_sat(T_R)/P
#   d^2 law: t_life = C_L R0^2 / (2 C D ln[(1 - x_inf)/(1 - x_R)])
using Printf

const P, RG = 101325.0, 8.314
const kG, D, cpW, lam, CL = 0.026, 2.6e-5, 34.0, 44000.0, 55500.0
const C = P / (RG * 298.15)

psat(Tc) = 611.21 * exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)))

function surface_state(Tinf, xinf)
    a = kG / (C * cpW * D)
    f(T) = log((1 - xinf) / (1 - psat(T) / P)) - a * log(1 + cpW * (Tinf - T) / lam)
    lo, hi = -40.0, min(Tinf, 99.9)
    for _ in 1:200
        mid = 0.5 * (lo + hi)
        f(lo) * f(mid) <= 0 ? (hi = mid) : (lo = mid)
    end
    TR = 0.5 * (lo + hi)
    return TR, psat(TR) / P
end

function main()
    println("Topic 3 — water droplet evaporating in N2 (pseudo-steady, stagnant gas)\n")
    @printf("   k_G = %g, D = %.1e, c_pW = %.1f, lambda = %.0f J/mol, C = %.2f mol/m3\n", kG, D, cpW, lam, C)
    @printf("   a* = k_G/(C c_pW D) = %.3f\n\n", kG / (C * cpW * D))
    println("[1] Surface temperature and vapor fraction (dry N2, x_W,inf = 0)")
    println("   T_inf (C)   T(R) (C)   x_W(R)     lifetime of a 100 um droplet (s)")
    for Tinf in (25.0, 50.0, 100.0, 150.0, 200.0)
        TR, xR = surface_state(Tinf, 0.0)
        tl = CL * (50e-6)^2 / (2 * C * D * log(1 / (1 - xR)))
        @printf("   %7.0f    %8.2f   %.5f    %8.2f\n", Tinf, TR, xR, tl)
    end
    println()
    println("[2] Humid gas at 25 C: the surface warms toward T_inf as x_W,inf rises")
    for xi in (0.0, 0.01, 0.02, 0.03)
        TR, xR = surface_state(25.0, xi)
        @printf("   x_W,inf = %.2f   T(R) = %6.2f C   x_W(R) = %.5f\n", xi, TR, xR)
    end
    println()
    println("[3] d^2 law: t_life ∝ R0^2 (dry N2, 25 C)")
    TR, xR = surface_state(25.0, 0.0)
    for d in (10, 50, 100, 500)
        R0 = d * 0.5e-6
        @printf("   d0 = %4d um   t_life = %10.3f s\n", d, CL * R0^2 / (2 * C * D * log(1 / (1 - xR))))
    end
end

main()
