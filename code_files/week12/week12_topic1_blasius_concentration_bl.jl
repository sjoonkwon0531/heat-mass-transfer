# Week 12 - Topic 1: Laminar Boundary Layers - Blasius Similarity and the Concentration Boundary Layer
# Lecture (Part 1):
#   * similarity variable eta = y sqrt(v_inf/(nu x)), psi = sqrt(nu x v_inf) f(eta), vx/v_inf = f'
#   * Blasius (lecture form): 2 f''' + f f'' = 0, f(0) = f'(0) = 0, f'(inf) = 1 -> f''(0) = 0.332057
#   * concentration: C'' + (Sc/2) f C' = 0, C(0) = 0, C(inf) = 1;  C'(0) = 1/int exp(-(Sc/2) int f)
#   * Sh_x = C'(0) Re_x^(1/2) ~ 0.332 Sc^(1/3) Re_x^(1/2)
# Run: julia week12_topic1_blasius_concentration_bl.jl

using Printf

const H = 0.001
const ETA_MAX = 12.0

rhs(u) = (u[2], u[3], -0.5 * u[1] * u[3])

function blasius(a)
    n = round(Int, ETA_MAX / H)
    U = zeros(n + 1, 3)
    u = (0.0, 0.0, a)
    U[1, :] .= u
    for i in 1:n
        k1 = rhs(u)
        k2 = rhs(u .+ 0.5H .* k1)
        k3 = rhs(u .+ 0.5H .* k2)
        k4 = rhs(u .+ H .* k3)
        u = u .+ (H / 6) .* (k1 .+ 2 .* k2 .+ 2 .* k3 .+ k4)
        U[i+1, :] .= u
    end
    return U
end

function shoot()
    lo, hi = 0.2, 0.5
    for _ in 1:50
        mid = 0.5 * (lo + hi)
        blasius(mid)[end, 2] < 1.0 ? (lo = mid) : (hi = mid)
    end
    return 0.5 * (lo + hi)
end

function wall_gradient(Sc, U)
    F, I, gp = 0.0, 0.0, 1.0
    for i in 2:size(U, 1)
        F += 0.5 * (U[i, 1] + U[i-1, 1]) * H
        g = exp(-0.5 * Sc * F)
        I += 0.5 * (g + gp) * H
        gp = g
    end
    return 1.0 / I
end

println("=== 1. Blasius: shooting for f''(0) ===")
a = shoot()
U = blasius(a)
@printf("  f''(0) = %.6f   (lecture: 0.332057)\n", a)
i99 = findfirst(>=(0.99), U[:, 2])
@printf("  f'(eta) = 0.99 at eta = %.3f  ->  delta_99 = %.2f x / Re_x^(1/2)\n", (i99 - 1) * H, (i99 - 1) * H)
@printf("  far field: f(12) - 12 = %.4f  (displacement, lecture b = 1.7208)\n", U[end, 1] - 12)

println("\n=== 2. Concentration boundary layer: C'(0) versus Sc ===")
println("    Sc      C'(0)    0.332 Sc^(1/3)   ratio")
for Sc in (0.6, 0.7, 1.0, 2.0, 10.0, 100.0, 1000.0)
    g = wall_gradient(Sc, U); ap = 0.332 * cbrt(Sc)
    @printf("  %7.1f  %.5f   %.5f         %.4f\n", Sc, g, ap, g / ap)
end
println("  -> Sh_x = C'(0) Re_x^(1/2); the Sc^(1/3) law is within 2% for Sc >= 0.6")

println("\n=== 3. Example: local and mean Sherwood numbers on a 0.2 m plate ===")
nu, D, v, L = 1.5e-5, 6.0e-6, 3.0, 0.2
Sc = nu / D
for x in (0.05, 0.1, 0.2)
    Re = v * x / nu; Sh = 0.332 * cbrt(Sc) * sqrt(Re)
    @printf("  x = %4.2f m: Re_x = %8.0f, Sh_x = %6.1f, kc = %.3f cm/s\n", x, Re, Sh, Sh * D / x * 100)
end
ReL = v * L / nu
@printf("  mean over L: Sh_L = 0.664 Sc^(1/3) Re_L^(1/2) = %.1f  (= 2 x local value at x = L)\n", 0.664 * cbrt(Sc) * sqrt(ReL))
@printf("  thickness ratio delta_M/delta_c ~ Sc^(1/3) = %.3f\n", cbrt(Sc))
