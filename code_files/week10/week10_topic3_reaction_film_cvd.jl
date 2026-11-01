# Week 10 - Topic 3: Diffusion with Reaction: Liquid Film (Hatta) and CVD Growth (Grove Model)
# Lecture (Part 1):
#   * gas A absorbed into liquid B with first-order homogeneous reaction R_A = -k1 c_A:
#       D_AB d^2c_A/dz^2 - k1 c_A = 0,  c_A(0) = c_A0,  c_A(delta) = 0
#       c_A(z) = c_A0 [cosh(phi z/delta) - sinh(phi z/delta)/tanh(phi)],  phi = delta sqrt(k1/D_AB)
#       N_Az|0 = (D_AB c_A0/delta) * phi/tanh(phi)
#     phi is the Hatta number Ha; E = Ha/tanh(Ha) is the enhancement over physical absorption
#     (the lecture labels this flux ratio "Hatta number").
#     large k1: N_Az -> sqrt(D_AB k1) c_A0, so k_c ~ D^(1/2) (vs k_c ~ D for the film model)
#   * CVD growth (Grove): gas-phase transfer F1 = h_g (C_g - C_s), surface reaction F2 = k_s C_s
#       steady state: F1 = F2 -> growth rate = (h_g k_s/(h_g + k_s)) C_g / rho
#       low T: k_s = k_s0 exp(-Ea/kT) << h_g -> reaction limited (Ea ~ 1.9 eV)
#       high T: k_s >> h_g ~ T^n (n = 1.5-2) -> mass-transport limited
# CVD parameter values are illustrative.
using Printf, LinearAlgebra

const KB_EV = 8.617333262e-5

film_profile(zeta, Ha) = cosh(Ha * zeta) - sinh(Ha * zeta) / tanh(Ha)
enhancement(Ha) = Ha / tanh(Ha)

function film_fdm(Ha, n = 400)
    h = 1 / n; m = n - 1
    A = SymTridiagonal(fill(-(2 + (Ha * h)^2), m), ones(m - 1))
    b = zeros(m); b[1] = -1.0
    u = [1.0; A \ b; 0.0]
    return u, -(-3u[1] + 4u[2] - u[3]) / (2h)
end

function grove_rate(T; ks0 = 1.0e9, Ea = 1.9, hg0 = 0.05, n = 1.75)
    ks = ks0 * exp(-Ea / (KB_EV * T)); hg = hg0 * (T / 1000)^n
    return hg * ks / (hg + ks), ks, hg
end

println(" Ha      E = Ha/tanh(Ha)   E from FDM    large-Ha limit (=Ha)")
for Ha in (0.1, 0.5, 1.0, 2.0, 5.0, 10.0)
    @printf("%5.1f   %12.5f   %10.5f   %10.3f\n", Ha, enhancement(Ha), film_fdm(Ha)[2], Ha)
end
@printf("profile check Ha = 3, z/delta = 0.5: %.5f FDM: %.5f\n", film_profile(0.5, 3.0), film_fdm(3.0)[1][201])
k1, delta = 100.0, 1e-4
println("\n D (m^2/s)   film k_c = D/delta   reaction k_c = sqrt(D k1)")
for D in (5e-10, 1e-9, 2e-9, 4e-9)
    @printf(" %.1e    %.3e         %.3e\n", D, D / delta, sqrt(D * k1))
end
@printf(" doubling D: film x2, reaction x %.3f\n", sqrt(2))
println("\nGrove model (illustrative constants): rate ~ h_g k_s/(h_g + k_s)")
println("  T (K)   k_s        h_g        rate       regime")
for T in 700:100:1300
    r, ks, hg = grove_rate(T)
    reg = ks < 0.1hg ? "reaction-limited" : (ks > 10hg ? "transport-limited" : "mixed")
    @printf("  %5d  %9.3e  %9.3e  %9.3e  %s\n", T, ks, hg, r, reg)
end
T1, T2 = 700.0, 750.0
@printf("  apparent Ea from the low-T slope = %.3f eV (input 1.9 eV)\n", -KB_EV * log(grove_rate(T2)[1] / grove_rate(T1)[1]) / (1 / T2 - 1 / T1))
