# Week 5 - Topic 2: Laminar Flat-Plate Heat Transfer - the Nusselt Number
# Local: Nu_x = 0.332*Pr^(1/3)*sqrt(Re_x);  Mean: Nu_L = 0.664*Pr^(1/3)*sqrt(Re_L)
# Integral method (cubic profile): prefactor 0.36 (~8% above the exact 0.332).
# Run: julia week5_topic2_flatplate_nu.jl

using Printf

nu_local(Rex, Pr) = 0.332 * Pr^(1 / 3) * sqrt(Rex)
nu_mean(ReL, Pr) = 0.664 * Pr^(1 / 3) * sqrt(ReL)

# --- Worked example: air over a heated plate ---
nu_air, k_air, Pr_air = 15.9e-6, 0.0263, 0.707
U, L, W = 5.0, 0.5, 0.5
Ts, Tinf = 60.0, 20.0
ReL = U * L / nu_air
@printf("Air, U = %g m/s, L = %g m: Re_L = %.3e < 5e5 -> laminar\n", U, L, ReL)

println("\nLocal values (h_x ~ x^(-1/2)):")
println("  x [m]    Re_x        Nu_x      h_x [W/m2K]")
for x in (0.01, 0.05, 0.1, 0.2, 0.35, 0.5)
    Rex = U * x / nu_air
    Nux = nu_local(Rex, Pr_air)
    @printf("  %5.2f  %10.3e  %8.2f  %10.2f\n", x, Rex, Nux, Nux * k_air / x)
end

NuL = nu_mean(ReL, Pr_air)
hbar = NuL * k_air / L
@printf("\nMean: Nu_L = %.1f, h_bar = %.2f W/m2K\n", NuL, hbar)
@printf("Total heat rate (%.1fx%.1f m, dT = %.0f K): Q = %.1f W\n",
        W, L, Ts - Tinf, hbar * W * L * (Ts - Tinf))
@printf("Check: Nu_L / Nu_x(L) = %.3f (= 2 exactly)\n", NuL / nu_local(ReL, Pr_air))
@printf("Integral method vs exact: 0.36/0.332 = %.4f (~8%% high)\n", 0.36 / 0.332)

println("\nPr sweep at Re_x = 1e5:")
println("  fluid           Pr      Nu_x")
for (name, Pr) in (("mercury", 0.016), ("air", 0.707), ("water(30C)", 5.4),
                   ("sea water", 13.0), ("light oil", 100.0))
    @printf("  %-12s %7.3f  %8.1f\n", name, Pr, nu_local(1e5, Pr))
end
println("  cf) Pr^(1/3) scaling holds for Pr >~ 0.6; liquid metals differ.")

@assert abs(nu_mean(1e5, 1.0) - 2 * nu_local(1e5, 1.0)) < 1e-9
@assert abs(nu_local(1e5, 1.0) - 0.332 * sqrt(1e5)) < 1e-9
