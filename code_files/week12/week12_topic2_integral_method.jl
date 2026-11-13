# Week 12 - Topic 2: Integral (von Karman-Pohlhausen) Analysis of the Concentration Boundary Layer
# Lecture (Part 1):
#   * d/dx int_0^delta_c vx (cA_inf - cA) dy = kc (cAs - cA_inf);  cubic ansatz for velocity and concentration
#   * delta_M/x = 4.64/Re_x^(1/2); r = delta_c/delta_M ~ 0.976 Sc^(-1/3); Sh_x ~ 0.331 Sc^(1/3) Re_x^(1/2)
#     (lecture slide quotes 0.36);  turbulent 1/7 law: Sh_x = 0.0292 Re_x^(4/5)
# Run: julia week12_topic2_integral_method.jl

using Printf

function simpson(f, a, b; n=2000)
    h = (b - a) / n
    s = f(a) + f(b)
    for i in 1:n-1
        s += (isodd(i) ? 4 : 2) * f(a + i * h)
    end
    return s * h / 3
end
cubic(p) = 1.5p - 0.5p^3
G(r) = simpson(p -> cubic(r * p) * (1 - cubic(p)), 0.0, 1.0)

function solve_r(Sc, c2)
    f(r) = r * G(r) * c2 / 2 - 1.5 / (r * Sc)
    lo, hi = 1e-4, 1.01
    for _ in 1:80
        mid = 0.5 * (lo + hi)
        f(lo) * f(mid) <= 0 ? (hi = mid) : (lo = mid)
    end
    return 0.5 * (lo + hi)
end

println("=== 1. Momentum integral with the cubic profile ===")
Hm = simpson(p -> cubic(p) * (1 - cubic(p)), 0.0, 1.0)
c = sqrt(3 / Hm)
@printf("  momentum thickness / delta = %.5f (= 39/280 = %.5f)\n", Hm, 39 / 280)
@printf("  delta_M / x = %.3f / Re_x^(1/2)   (exact Blasius delta_99: 4.91)\n", c)

println("\n=== 2. Concentration integral: r = delta_c/delta_M and Sh_x coefficient ===")
println("     Sc       r       r Sc^(1/3)   Sh_x / (Re^(1/2) Sc^(1/3))")
for Sc in (1.0, 2.0, 10.0, 100.0, 1000.0)
    r = solve_r(Sc, c^2)
    @printf("  %7.1f   %.4f    %.4f       %.4f\n", Sc, r, r * cbrt(Sc), 1.5 / (r * c) / cbrt(Sc))
end
println("  exact (Blasius-Pohlhausen): 0.332; lecture slide: 0.36")

println("\n=== 3. Laminar versus turbulent local Sherwood numbers (Sc = 1) ===")
for Re in (1e4, 1e5, 5e5, 1e6, 1e7)
    @printf("  Re_x = %8.0e: laminar 0.332 Re^(1/2) = %8.1f,  turbulent 0.0292 Re^(4/5) = %8.1f\n", Re, 0.332 * sqrt(Re), 0.0292 * Re^0.8)
end
println("  -> at transition (Re_x ~ 5e5) the turbulent law gives about 4.5 times more transfer")

println("\n=== 4. Case: naphthalene sublimation from a plate (illustrative properties) ===")
nu, D, v, L, W = 1.55e-5, 6.1e-6, 2.0, 0.10, 0.05
psat, T, M = 10.6, 298.15, 0.1282
Sc = nu / D; ReL = v * L / nu; ShL = 0.664 * cbrt(Sc) * sqrt(ReL); kc = ShL * D / L
cs = psat / (8.314 * T); rate = kc * W * L * cs * M
@printf("  Sc = %.2f, Re_L = %.0f, Sh_L = %.1f, kc = %.3f cm/s\n", Sc, ReL, ShL, kc * 100)
@printf("  surface concentration = %.2f mmol/m^3; sublimation rate = %.1f mg/h\n", cs * 1e3, rate * 3.6e9)
@printf("  surface recession = %.2f um/h (rho = 1145 kg/m^3): measurable by profilometry\n", rate / (1145 * W * L) * 3.6e9)
