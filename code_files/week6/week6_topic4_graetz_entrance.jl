# Week 6 - Topic 4: The Graetz Problem - Eigenvalues, Entrance Region, Nu_inf
# Sturm-Liouville: (1/eta) d/deta(eta dPhi/deta) = -lam^2 (1-eta^2) Phi,
#   Phi'(0) = 0, Phi(1) = 0 -> lam_1 = 2.7044, ...; Nu_inf = lam_1^2/2 = 3.656
# Leveque: Nu = 1.357 (R/z)^(1/3) Pe^(1/3); L_T/R ~ 0.1 Pe.
# Run: julia week6_topic4_graetz_entrance.jl

using Printf
using SpecialFunctions   # ] add SpecialFunctions   (for gamma)

function phi_at_wall(lam; n=4000)
    h = 1.0 / n
    eta = 1e-6
    Phi = 1 - lam^2 * eta^2 / 4
    dPhi = -lam^2 * eta / 2
    rhs(e, P, D) = (D, -lam^2 * (1 - e^2) * P - D / e)
    while eta < 1 - 1e-12
        s = min(h, 1 - eta)
        k1 = rhs(eta, Phi, dPhi)
        k2 = rhs(eta + s / 2, Phi + s / 2 * k1[1], dPhi + s / 2 * k1[2])
        k3 = rhs(eta + s / 2, Phi + s / 2 * k2[1], dPhi + s / 2 * k2[2])
        k4 = rhs(eta + s, Phi + s * k3[1], dPhi + s * k3[2])
        Phi += s / 6 * (k1[1] + 2k2[1] + 2k3[1] + k4[1])
        dPhi += s / 6 * (k1[2] + 2k2[2] + 2k3[2] + k4[2])
        eta += s
    end
    return Phi
end

function graetz_eigenvalues(count=5)
    eigs = Float64[]
    prev_l, prev_f = 0.5, phi_at_wall(0.5)
    lam = 0.6
    while length(eigs) < count
        f = phi_at_wall(lam)
        if prev_f * f < 0
            lo, hi, flo = prev_l, lam, prev_f
            for _ in 1:60
                mid = (lo + hi) / 2
                fm = phi_at_wall(mid)
                if flo * fm <= 0
                    hi = mid
                else
                    lo, flo = mid, fm
                end
            end
            push!(eigs, (lo + hi) / 2)
        end
        prev_l, prev_f = lam, f
        lam += 0.1
    end
    return eigs
end

nu_leveque(z_over_R, Pe) = 1.357 * cbrt(1 / z_over_R) * cbrt(Pe)

eigs = graetz_eigenvalues(5)
println("Graetz eigenvalues (shooting + bisection):")
println("  computed : " * join([@sprintf("%8.4f", e) for e in eigs]))
println("  lecture  :   2.7044   6.6790  10.6730  14.6710  18.6700")
nu_inf = eigs[1]^2 / 2
@printf("\n  Nu_inf = lam_1^2/2 = %.3f (lecture: 3.656)\n", nu_inf)

C = 6 / (gamma(1 / 3) * (9 / 2)^(1 / 3))
@printf("\nLeveque constant: 6/[Gamma(1/3)(9/2)^(1/3)] = %.4f (lecture 1.357)\n", C)
@printf("  Gamma(1/3) = %.5f\n", gamma(1 / 3))

Pe = 1000.0
@printf("\nEntrance region at Pe = %.0f:\n", Pe)
println("  z/R        Nu_Leveque")
for zR in (0.1, 1.0, 10.0, 100.0)
    @printf("  %8.1f  %10.2f\n", zR, nu_leveque(zR, Pe))
end
@printf("  thermal entrance length: L_T/R ~ 0.1 Pe = %.0f\n", 0.1 * Pe)
slope = (log(nu_leveque(10, Pe)) - log(nu_leveque(1, Pe))) / log(10)
@printf("  log-log slope = %.4f (= -1/3)\n", slope)

@assert abs(eigs[1] - 2.7044) < 2e-3
@assert abs(nu_inf - 3.656) < 5e-3
@assert abs(slope + 1 / 3) < 1e-9
