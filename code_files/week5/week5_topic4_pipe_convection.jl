# Week 5 - Topic 4: Forced Convection in a Pipe - Nusselt Correlations & LMTD
# Laminar (const T_w): <Nu> = (49.371 + (1.615*beta^(1/3) - 0.7)^3)^(1/3),
#   beta = Pe*D/L; limits 3.660 (const T_w) / 4.364 (const q_w)
# Turbulent (Gnielinski) and Q = h*A*LMTD.
# Run: julia week5_topic4_pipe_convection.jl

using Printf

nu_lam_T(beta) = cbrt(49.371 + (1.615 * cbrt(beta) - 0.7)^3)
nu_lam_q(beta) = cbrt(83.326 + (1.953 * cbrt(beta) - 0.6)^3)

function nu_gnielinski(Re, Pr, DoL=0.0)
    xi = (1.82 * log10(Re) - 1.64)^-2
    core = (xi / 8) * (Re - 1000) * Pr / (1 + 12.7 * sqrt(xi / 8) * (Pr^(2 / 3) - 1))
    return core * (1 + DoL^(2 / 3))
end

println("Fully developed laminar limits (beta -> 0):")
@printf("  const wall T   : Nu -> %.3f (lecture: 3.660)\n", nu_lam_T(1e-12))
@printf("  const wall flux: Nu -> %.3f (lecture: 4.364)\n", nu_lam_q(1e-12))

println("\nEntrance effect (mean Nu vs beta = Pe*D/L):")
println("  beta      Nu(const T)   Nu(const q)")
for b in (0.1, 1.0, 10.0, 100.0, 1000.0)
    @printf("  %7.1f  %10.3f  %11.3f\n", b, nu_lam_T(b), nu_lam_q(b))
end
println("  -> short pipes: thin entrance boundary layer, high Nu.")

# --- Worked example: hot-wall pipe heating water (laminar) ---
rho, cp, k, nuw, Pr = 997.0, 4180.0, 0.61, 0.658e-6, 4.34
D, L, v = 0.02, 3.0, 0.05
Tw, Tin = 80.0, 20.0

Re = v * D / nuw
Pe = Re * Pr
beta = Pe * D / L
Nu = nu_lam_T(beta)
h = Nu * k / D
mdot = rho * v * pi * D^2 / 4
A = pi * D * L

Tout = Tw - (Tw - Tin) * exp(-h * A / (mdot * cp))
dTin, dTout = Tw - Tin, Tw - Tout
LMTD = (dTin - dTout) / log(dTin / dTout)
Q1 = h * A * LMTD
Q2 = mdot * cp * (Tout - Tin)

@printf("\nWorked example: water, D = 2 cm, L = 3 m, v = 0.05 m/s, Tw = 80 C\n")
@printf("  Re = %.0f (laminar), Pe = %.0f, beta = %.1f\n", Re, Pe, beta)
@printf("  Nu = %.2f, h = %.1f W/m2K, T_out = %.2f C\n", Nu, h, Tout)
@printf("  LMTD = %.2f K, Q = h*A*LMTD = %.1f W vs mdot*cp*dT = %.1f W\n", LMTD, Q1, Q2)
@assert abs(Q1 - Q2) / Q2 < 1e-9   # LMTD is exact for constant Tw

println("\nSame pipe, higher speeds (Gnielinski):")
println("  v [m/s]   Re        Nu        h [W/m2K]")
for vv in (0.5, 1.0, 2.0)
    Re2 = vv * D / nuw
    Nu2 = nu_gnielinski(Re2, Pr, D / L)
    @printf("  %6.1f  %9.0f  %8.1f  %9.0f\n", vv, Re2, Nu2, Nu2 * k / D)
end
println("  -> laminar to turbulent: h jumps by an order of magnitude.")
