# Week 6 - Topic 3: Nusselt Film Condensation on a Vertical Wall
# delta(x) = [4 k mu dT x/(g rhoL (rhoL-rhov) h'_fg)]^(1/4), h_x = k/delta,
# h_Nusselt = (4/3) h_x(Lc) = 0.943 [k^3 g h'_fg rhoL(rhoL-rhov)/(mu dT Lc)]^(1/4),
# h'_fg = h_fg + (3/8) cpL dT. Cylinder 0.725; n-tube bank 0.725/n^(1/4).
# Run: julia week6_topic3_condensation.jl

using Printf

const G = 9.81
const RHO_L, RHO_V = 957.9, 0.596
const MU_L, CP_L, K_L = 2.79e-4, 4217.0, 0.68
const H_FG = 2.257e6

h_prime(dT) = H_FG + 0.375 * CP_L * dT

delta_of_x(x, dT) =
    (4 * K_L * MU_L * dT * x / (G * RHO_L * (RHO_L - RHO_V) * h_prime(dT)))^0.25

h_local(x, dT) = K_L / delta_of_x(x, dT)

h_avg_vertical(L, dT) =
    0.943 * (K_L^3 * G * h_prime(dT) * RHO_L * (RHO_L - RHO_V) / (MU_L * dT * L))^0.25

h_avg_cylinder(D, dT; n=1) =
    0.725 * (K_L^3 * G * h_prime(dT) * RHO_L * (RHO_L - RHO_V) / (n * MU_L * dT * D))^0.25

dT, L = 10.0, 0.5
@printf("Steam at 1 atm on a vertical wall, dT = %.0f K, L = %.1f m\n", dT, L)
println("  x [m]    delta [um]   h_x [W/m^2K]")
for x in (0.01, 0.05, 0.1, 0.25, 0.5)
    @printf("  %5.2f   %9.1f   %10.0f\n", x, delta_of_x(x, dT) * 1e6, h_local(x, dT))
end
println("  -> film thickens as x^(1/4); h_x falls as x^(-1/4).")

havg = h_avg_vertical(L, dT)
@printf("\n  h_avg = %.0f W/m^2K; 4/3 rule: h_avg/h_x(L) = %.4f\n", havg, havg / h_local(L, dT))
Re = 4 * havg * dT * L / h_prime(dT) / MU_L
@printf("  film Reynolds Re_f = %.0f (%s)\n", Re,
        Re < 1800 ? "laminar, Nusselt model OK" : "TURBULENT: 0.045 Re^(1/5) Pr^(1/3)")

println("\nEffect of dT (L = 0.5 m):")
println("  dT [K]   h_avg      q [kW/m^2]")
for d in (5.0, 10.0, 20.0, 40.0)
    h = h_avg_vertical(L, d)
    @printf("  %5.0f   %8.0f   %9.1f\n", d, h, h * d / 1e3)
end
println("  -> h ~ dT^(-1/4) but q = h dT ~ dT^(3/4).")

println("\nHorizontal tube banks (D = 25 mm):")
println("  n     h_avg [W/m^2K]")
for n in (1, 2, 4, 9, 16)
    @printf("  %3d   %10.0f\n", n, h_avg_cylinder(0.025, dT; n=n))
end
println("  -> h ~ n^(-1/4): lower tubes drown in condensate from above.")

@assert abs(havg / h_local(L, dT) - 4 / 3) < 1e-3
@assert abs(h_avg_cylinder(0.025, dT; n=16) / h_avg_cylinder(0.025, dT) - 16^-0.25) < 1e-9
