# Week 10 - Topic 2: Pseudo-Steady Moving Boundaries: Si Oxidation and Carbon-Particle Burnout
# Lecture (Part 1):
#   * diffusion-controlled Si oxidation (O2 = A through SiO2 = B, c_A = 0 at the Si interface):
#       N_Az = D c_As/delta(t);  (rho_B/M_B) d(delta)/dt = N_Az
#       -> delta(t) = (2 M_B D c_As t / rho_B)^(1/2)          (parabolic law)
#     with a finite interface reaction N_Az = k_s c_Ai added in series (linear-parabolic form):
#       delta^2 + (2D/k_s) delta = (2 M_B D c_As/rho_B) t
#   * carbon sphere burning in still air: 3C + 2.5 O2 -> 2 CO2 + CO  (A = O2)
#       sum N = -0.2 N_A  ->  N_Ar = -(c D/(1 + 0.2 y_A)) dy_A/dr,   r^2 N_Ar = const
#       W_O2 = -4 pi R (c D/0.2) ln(1.042)      (y_A = 0 at r = R, 0.21 at infinity)
#       W_C = (3/2.5)|W_O2| = 12 pi R (c D/0.5) ln(1.042)
#       t_f = (rho_C/M_C)(R0^2 - Rf^2) / (12 c D ln 1.042)
#   * single heterogeneous reaction C + O2 -> CO2 with surface rate N_A = -k_s c_As:
#       W_O2 = -4 pi R c D y_inf / (1 + D/(k_s R))
# Parameter values below are illustrative (labelled where chosen).
using Printf

const R = 8.314462618
const M_SiO2, rho_SiO2 = 60.08e-3, 2270.0
const c_s = 5.2e16 * 1e6 / 6.02214076e23
const D_ox = 3.4e-13

delta_parabolic(t) = sqrt(2 * M_SiO2 * D_ox * c_s * t / rho_SiO2)
function delta_linear_parabolic(t, ks)
    A = 2 * D_ox / ks; Bp = 2 * M_SiO2 * D_ox * c_s / rho_SiO2
    return 0.5 * (-A + sqrt(A^2 + 4 * Bp * t))
end
function delta_numeric(tEnd, ks, n)
    d, dt = 1e-10, tEnd / n
    for _ in 1:n
        d += M_SiO2 / rho_SiO2 * c_s / (d / D_ox + 1 / ks) * dt
    end
    return d
end
burnout(R0, Rf, T; P = 101325.0, D = 2.0e-4, rhoC = 2000.0, MC = 0.012) =
    (rhoC / MC) * (R0^2 - Rf^2) / (12 * (P / (R * T)) * D * log(1.042))
W_O2_hetero(Rp, T, ks; D = 2.0e-4, P = 101325.0, yinf = 0.21) =
    -4pi * Rp * (P / (R * T)) * D * yinf / (1 + D / (ks * Rp))

@printf("c_As = %.4e mol/m^3\n", c_s)
println("  t (h)   parabolic (um)   linear-parabolic ks=1e-5 m/s (um)   numeric (um)")
for h in (1, 2, 4, 8, 16)
    t = h * 3600.0
    @printf("%6d   %12.4f   %22.4f   %16.4f\n", h, delta_parabolic(t) * 1e6, delta_linear_parabolic(t, 1e-5) * 1e6, delta_numeric(t, 1e-5, 40000) * 1e6)
end
println("\nCarbon sphere, T = 1200 K, D = 2.0e-4 m^2/s (illustrative), rho_C = 2000 kg/m^3")
@printf("  ln(1.042)/0.2 = %.5f vs 0.21 (no bulk-flow correction)\n", log(1.042) / 0.2)
for r in (10, 50, 100)
    @printf("  R0 = %4d um -> burnout time %.4f s\n", r, burnout(r * 1e-6, 0.0, 1200.0))
end
@printf("  burnout time scales as R0^2: 100 um vs 10 um -> %.1f\n", burnout(100e-6, 0, 1200) / burnout(10e-6, 0, 1200))
println("\nSingle heterogeneous reaction C + O2 -> CO2, R = 50 um, T = 1200 K")
Rp = 50e-6; Wd = W_O2_hetero(Rp, 1200.0, 1e9)
for ks in (0.1, 1.0, 10.0, 100.0)
    W = W_O2_hetero(Rp, 1200.0, ks)
    @printf("  k_s = %6.1f m/s, Da = k_s R/D = %7.3f: W_O2 = %.4e mol/s (%5.1f%% of diffusion limit)\n", ks, ks * Rp / 2e-4, W, W / Wd * 100)
end
