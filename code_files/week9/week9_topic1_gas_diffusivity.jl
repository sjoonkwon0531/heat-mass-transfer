# Week 9 - Topic 1: Gas Diffusivity (Kinetic Theory, Chapman-Enskog, Fuller)
# Chapman-Enskog (D in cm^2/s, T in K, P in atm, sigma in Angstrom):
#   D_AB = 1.858e-3 T^(3/2) sqrt(1/M_A + 1/M_B) / (P sigma_AB^2 Omega_D)
#   sigma_AB = (sigma_A + sigma_B)/2,  eps_AB = sqrt(eps_A eps_B),  Omega_D = f(kB T/eps_AB)
# Fuller: D_AB = 1.011e-3 T^1.75 sqrt(1/M_A + 1/M_B) / (P [(sum v_A)^(1/3) + (sum v_B)^(1/3)]^2)
# Kinetic theory: lambda = kB T/(sqrt(2) pi sigma^2 P), u = sqrt(8RT/(pi M)), D_AA* = lambda u/3
using Printf

# (sigma [A], eps/kB [K], M [g/mol], Fuller volume)
const GAS = Dict(
    "H2" => (2.968, 33.3, 2.016, 7.07),   "He" => (2.576, 10.2, 4.003, 2.88),
    "N2" => (3.681, 91.5, 28.01, 17.9),   "O2" => (3.433, 113.0, 32.00, 16.6),
    "Air" => (3.617, 97.0, 28.97, 20.1),  "Ar" => (3.418, 124.0, 39.95, 16.1),
    "CO2" => (3.996, 190.0, 44.01, 26.9), "CH4" => (3.822, 137.0, 16.04, 16.5 + 4 * 1.98))

omegaD(ts) = 1.06036 / ts^0.15610 + 0.19300 / exp(0.47635ts) + 1.03587 / exp(1.52996ts) + 1.76474 / exp(3.89411ts)

function chapman_enskog(a, b, T; P = 1.0)
    sa, ea, Ma, _ = GAS[a]; sb, eb, Mb, _ = GAS[b]
    sab = 0.5 * (sa + sb); eab = sqrt(ea * eb)
    om = omegaD(T / eab)
    return 1.858e-3 * T^1.5 * sqrt(1 / Ma + 1 / Mb) / (P * sab^2 * om), om
end

function fuller(a, b, T; P = 1.0)
    _, _, Ma, va = GAS[a]; _, _, Mb, vb = GAS[b]
    return 1.011e-3 * T^1.75 * sqrt(1 / Ma + 1 / Mb) / (P * (cbrt(va) + cbrt(vb))^2)
end

@printf("Omega_D(1) = %.4f (table 1.439), Omega_D(10) = %.4f (table 0.7424)\n", omegaD(1.0), omegaD(10.0))
T = 293.15
D, om = chapman_enskog("CO2", "Air", T)
@printf("\nCO2-air %.2f K: Omega_D = %.4f, D_CE = %.4f, D_Fuller = %.4f cm^2/s\n", T, om, D, fuller("CO2", "Air", T))
println("\nPair        T(K)   Chapman-Enskog   Fuller   (cm^2/s)")
for (a, b) in [("H2", "N2"), ("O2", "N2"), ("CO2", "N2"), ("He", "Ar"), ("CH4", "Air")], TT in (300.0, 600.0)
    @printf("%4s-%-5s %6.0f   %10.4f   %8.4f\n", a, b, TT, chapman_enskog(a, b, TT)[1], fuller(a, b, TT))
end
kB, R = 1.380649e-23, 8.314462618
s = GAS["N2"][1] * 1e-10; Tn = 300.0
lam = kB * Tn / (sqrt(2) * pi * s^2 * 101325); u = sqrt(8R * Tn / (pi * GAS["N2"][3] * 1e-3))
@printf("\nN2 300 K: lambda = %.1f nm, u = %.0f m/s, D_kin = %.3f cm^2/s\n", lam * 1e9, u, lam * u / 3 * 1e4)
