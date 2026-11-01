# Week 10 - Topic 1: Stefan Tube (Arnold Cell), Log-Mean, Film Model, Pseudo-Steady D Measurement
# Lecture (Part 1):
#   * steady 1D diffusion of A through stagnant B (N_Bz = 0):
#       N_Az = -cD_AB/(1 - y_A) dy_A/dz = const
#       N_Az = cD_AB/(z2 - z1) ln[(1 - y_A2)/(1 - y_A1)] = cD_AB (y_A1 - y_A2)/((z2 - z1) y_B,lm)
#       y_B,lm = (y_B2 - y_B1)/ln(y_B2/y_B1)
#   * profile: (1 - y_A)/(1 - y_A1) = [(1 - y_A2)/(1 - y_A1)]^((z - z1)/(z2 - z1))
#   * film model: k_c = P D_AB/(delta p_B,lm)
#   * pseudo-steady Arnold cell (liquid level falls slowly):
#       rho_AL/M_A dz/dt = cD_AB (y_A1 - y_A2)/(z y_B,lm)
#       -> t = rho_AL y_B,lm (z^2 - z0^2)/(2 c D_AB M_A (y_A1 - y_A2))
#       -> D_AB from the slope of (z^2 - z0^2) versus t.
using Printf, Random

const R = 8.314462618
# Antoine A, B, C (mmHg, degC), rho_L (kg/m^3), M (g/mol), Fuller volume
const Q = Dict("water" => (8.07131, 1730.63, 233.426, 997.0, 18.015, 12.7),
               "ethanol" => (8.20417, 1642.89, 230.300, 789.0, 46.07, 2 * 16.5 + 6 * 1.98 + 5.48),
               "acetone" => (7.02447, 1161.0, 224.0, 784.0, 58.08, 3 * 16.5 + 6 * 1.98 + 5.48))

psat(n, TC) = (q = Q[n]; 10^(q[1] - q[2] / (q[3] + TC)) * 133.322)
fuller(n, TK) = 1.011e-3 * TK^1.75 * sqrt(1 / Q[n][5] + 1 / 28.97) / (cbrt(Q[n][6]) + cbrt(20.1))^2 * 1e-4
ylm(y1, y2) = ((1 - y2) - (1 - y1)) / log((1 - y2) / (1 - y1))
stefan_flux(c, D, L, y1, y2) = c * D / L * log((1 - y2) / (1 - y1))
profile(z, L, y1, y2) = 1 - (1 - y1) * ((1 - y2) / (1 - y1))^(z / L)

P, TC = 101325.0, 25.0
T = TC + 273.15; c = P / (R * T); L = 0.10
@printf("Stefan tube, L = %.0f cm, %.1f C, 1 atm, c = %.3f mol/m^3\n", L * 100, TC, c)
println(" liquid    p_sat(kPa)  y_A1    D(cm^2/s)  y_B,lm   N_A (mol/m^2 s)  Stefan/Fick")
for n in ("water", "ethanol", "acetone")
    y1 = psat(n, TC) / P; D = fuller(n, T); N = stefan_flux(c, D, L, y1, 0.0)
    @printf(" %-8s %9.2f  %6.4f  %8.4f  %7.4f  %14.4e  %9.4f\n", n, psat(n, TC) / 1e3, y1, D * 1e4, ylm(y1, 0.0), N, N / (c * D * y1 / L))
end
y1 = psat("acetone", TC) / P; D = fuller("acetone", T)
@printf("\nlog form %.6e vs log-mean form %.6e\n", stefan_flux(c, D, L, y1, 0.0), c * D * y1 / (L * ylm(y1, 0.0)))
zs = range(0, L, length = 1001); yB = [1 - profile(z, L, y1, 0.0) for z in zs]
@printf("path-averaged y_B = %.6f equals y_B,lm = %.6f\n", sum((yB[1:end-1] .+ yB[2:end]) ./ 2) / 1000, ylm(y1, 0.0))
@printf("film model (delta = 2 mm): k_c = P D/(delta p_B,lm) = %.3f cm/s\n", D / (2e-3 * ylm(y1, 0.0)) * 100)

# pseudo-steady Arnold cell: synthetic experiment and back-calculation of D
rhoL, MA = Q["water"][4], Q["water"][5] * 1e-3
y1 = psat("water", TC) / P; Dt = fuller("water", T); z0 = 0.02
K = 2 * c * Dt * MA * y1 / (rhoL * ylm(y1, 0.0))
Random.seed!(3)
t = [1, 2, 4, 6, 8, 10, 14] .* 86400.0
z = sqrt.(z0^2 .+ K .* t) .+ 2e-5 .* randn(length(t))
slope = sum(t .* (z .^ 2 .- z0^2)) / sum(t .^ 2)
Dfit = slope * rhoL * ylm(y1, 0.0) / (2 * c * MA * y1)
@printf("\nArnold cell (water, z0 = 2 cm): level after 14 days z = %.3f cm\n", z[end] * 100)
@printf("D_true = %.4f cm^2/s, D from (z^2 - z0^2) vs t fit = %.4f cm^2/s\n", Dt * 1e4, Dfit * 1e4)
