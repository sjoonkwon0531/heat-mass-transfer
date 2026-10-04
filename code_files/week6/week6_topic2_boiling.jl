# Week 6 - Topic 2: Boiling Heat Transfer - Rohsenow, CHF, Film Boiling
# Nucleate: q = mu_L h_fg sqrt(g(rhoL-rhov)/sigma) [cpL dT/(Csf h_fg Pr^1.7)]^3
# CHF:      q_crit = 0.18 h_fg rho_v [g sigma (rhoL-rhov)/rho_v^2]^(1/4)
# Film:     h = 0.62 [k_v^3 g (rhoL-rhov)(h_fg + 0.4 cpL dT)/(D0 nu_v dT)]^(1/4)
# Run: julia week6_topic2_boiling.jl

using Printf

const G = 9.81
# saturated water / vapor at 1 atm
const RHO_L, RHO_V = 957.9, 0.596
const MU_L, CP_L, PR_L = 2.79e-4, 4217.0, 1.76
const H_FG, SIGMA = 2.257e6, 0.0589
const K_V, NU_V = 0.025, 2.0e-5

q_rohsenow(dT; Csf=0.013) =
    MU_L * H_FG * sqrt(G * (RHO_L - RHO_V) / SIGMA) *
    (CP_L * dT / (Csf * H_FG * PR_L^1.7))^3

q_critical() = 0.18 * H_FG * RHO_V * (G * SIGMA * (RHO_L - RHO_V) / RHO_V^2)^0.25

h_film(dT; D0=0.01) =
    0.62 * (K_V^3 * G * (RHO_L - RHO_V) * (H_FG + 0.4 * CP_L * dT) / (D0 * NU_V * dT))^0.25

function h_with_radiation(hc, hr)
    h = hc + hr
    for _ in 1:200
        hn = hr + hc * cbrt(hc / h)
        abs(hn - h) < 1e-10 && break
        h = hn
    end
    return h
end

println("Rohsenow nucleate boiling, water at 1 atm:")
println("  surface      C_sf     q(dT=10K) [kW/m^2]")
for (name, Csf) in (("platinum", 0.013), ("brass", 0.006))
    @printf("  %-10s %6.3f   %12.1f\n", name, Csf, q_rohsenow(10.0; Csf=Csf) / 1e3)
end
println("  -> q ~ dT^3 and ~ 1/C_sf^3: the surface finish enters cubed!")

println("\n  dT [K]   q [kW/m^2]  (C_sf = 0.013)")
for dT in (5.0, 10.0, 15.0, 20.0, 25.0)
    @printf("  %5.0f   %10.1f\n", dT, q_rohsenow(dT) / 1e3)
end

qc = q_critical()
@printf("\nCritical heat flux: q_crit = %.2f MW/m^2\n", qc / 1e6)
@printf("  Rohsenow reaches CHF near dT ~ %.0f K (boiling-curve point C)\n",
        cbrt(qc / q_rohsenow(1.0)))

println("\nStable film boiling around a D0 = 10 mm tube:")
println("  dT [K]    h_film [W/m^2K]   q [kW/m^2]")
for dT in (200.0, 500.0, 1000.0)
    h = h_film(dT)
    @printf("  %5.0f   %12.1f   %10.1f\n", dT, h, h * dT / 1e3)
end

hc, hr = h_film(500.0), 40.0
ht = h_with_radiation(hc, hr)
@printf("\nRadiation correction (dT = 500 K, h_r = 40): h_c = %.1f -> h = %.1f\n", hc, ht)
@assert hc < ht < hc + hr

@printf("\nBoiling-curve landmarks: ONB ~ 5 K, CHF ~ 30 K at %.1f MW/m^2, Leidenfrost ~ 100-120 K.\n",
        qc / 1e6)
