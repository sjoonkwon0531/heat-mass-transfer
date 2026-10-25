# Week 9 - Topic 2: Liquid, Pore (Knudsen) and Solid Diffusivity
#   Stokes-Einstein: D = kB T/(6 pi r mu)
#   Wilke-Chang:     D_AB = 7.4e-8 sqrt(Phi_B M_B) T/(mu_B V_A^0.6)   [cm^2/s, cP, cm^3/mol]
#   Knudsen:         D_KA = 4850 d sqrt(T/M)   [d in cm -> cm^2/s]
#   Transition:      1/D_Ae = (1 - alpha y_A)/D_AB + 1/D_KA;  porous solid: D'_Ae = eps^2 D_Ae
#   Solids:          D = D0 exp(-Q/RT)  (lecture table)
using Printf
const kB, R = 1.380649e-23, 8.314462618

wilke_chang(T, mu, MB, VA, phi) = 7.4e-8 * sqrt(phi * MB) * T / (mu * VA^0.6)
knudsen(dcm, T, M) = 4850.0 * dcm * sqrt(T / M)
effective(DAB, DK; alpha = 0.0, yA = 0.0) = 1 / ((1 - alpha * yA) / DAB + 1 / DK)
arrhenius(D0, Q, T) = D0 * 1e-6 * exp(-Q * 1e3 / (R * T))

T, mu = 298.15, 0.890
@printf("Wilke-Chang, O2 in water at 25 C: D = %.3e cm^2/s\n", wilke_chang(T, mu, 18.02, 25.6, 2.26))
@printf("Stokes-Einstein, 10 nm particle: D = %.3e m^2/s\n", kB * T / (6pi * 5e-9 * mu * 1e-3))

DAB = 0.20
for dnm in (1, 10, 50, 100, 1000, 10000)
    DK = knudsen(dnm * 1e-7, 300.0, 28.0)
    @printf("  d = %6d nm: D_K = %.4e, D_Ae = %.4e cm^2/s\n", dnm, DK, effective(DAB, DK))
end

solids = [("Au self (fcc)", 10.7, 176.9), ("Cu self (fcc)", 31.0, 200.3), ("Ni self (fcc)", 190.0, 279.7),
          ("Fe(gamma) self", 49.0, 284.1), ("Fe(alpha) self", 200.0, 239.7), ("C in Fe (bcc)", 2.0, 84.1),
          ("N in Fe (bcc)", 0.3, 76.1), ("H in Fe (bcc)", 0.1, 13.4), ("C in Fe (fcc)", 2.5, 144.2)]
println("\nSolid-state diffusivity at 1000 K")
for (name, D0, Q) in solids
    D = arrhenius(D0, Q, 1000.0)
    @printf("  %-16s D = %.3e m^2/s, sqrt(D*1h) = %9.3f um\n", name, D, sqrt(D * 3600) * 1e6)
end
