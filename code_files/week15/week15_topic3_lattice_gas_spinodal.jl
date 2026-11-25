# Week 15 · Topic 3 — Lattice-gas (regular-solution) free energy, spinodal, binodal and the
#                      fastest-growing wavelength of spinodal decomposition
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   f(phi) = dF/(kB T N) = chi phi (1 - phi) + phi ln phi + (1 - phi) ln(1 - phi),  chi = kappa/(kB T)
#   spinodal: f'' = 0  ->  2 chi phi (1 - phi) = 1;   critical point chi_c = 2, phi_c = 1/2 (T_c = kappa/(2 kB))
#   binodal (symmetric): f'(phi) = 0  ->  chi (1 - 2 phi) + ln[phi/(1 - phi)] = 0
#   Cahn-Hilliard, linearised:  growth rate omega(q) = -M q^2 [ f''(phi0) + 2 K q^2 ],  K = C h^2, C = chi/2
#   q_c^2 = -f''/(2K) (marginal),  q_m^2 = -f''/(4K) = q_c^2/2 (fastest),  lambda_m = 2 pi / q_m
using Printf

f(p, chi) = chi * p * (1 - p) + p * log(p) + (1 - p) * log(1 - p)
f2(p, chi) = -2chi + 1 / (p * (1 - p))
function spinodal(chi)
    s = sqrt(1 - 2 / chi); return 0.5 * (1 - s), 0.5 * (1 + s)
end
function binodal(chi)
    g(p) = chi * (1 - 2p) + log(p / (1 - p))
    lo, hi = 1e-12, spinodal(chi)[1]
    for _ in 1:200
        m = 0.5 * (lo + hi)
        if g(lo) * g(m) <= 0; hi = m; else; lo = m; end
    end
    p = 0.5 * (lo + hi); return p, 1 - p
end

function main()
    println("Topic 3 — lattice-gas free energy, spinodal, binodal and lambda_m\n")
    println("[1] Free energy of mixing f(phi) at phi = 0.1, 0.3, 0.5")
    for chi in (1.0, 1.5, 2.0, 2.5, 3.0)
        @printf("   chi = %.1f:  f = %8.4f %8.4f %8.4f   f''(0.5) = %6.3f\n", chi, f(0.1, chi), f(0.3, chi), f(0.5, chi), f2(0.5, chi))
    end
    println("   critical point: chi_c = 2 (T_c = kappa/(2 kB)), phi_c = 0.5\n")
    println("[2] Phase diagram:  T/T_c = 2/chi")
    println("    chi    T/Tc    binodal (phi1, phi2)    spinodal (phi1, phi2)")
    for chi in (2.05, 2.2, 2.5, 3.0, 3.5, 4.0)
        b = binodal(chi); s = spinodal(chi)
        @printf("   %4.2f   %.4f   (%.4f, %.4f)        (%.4f, %.4f)\n", chi, 2 / chi, b[1], b[2], s[1], s[2])
    end
    println()
    println("[3] Linear Cahn-Hilliard: K = C h^2 with C = chi/2, h = 1 (lattice spacing)")
    println("    chi   phi0   f''(phi0)   q_c      q_m      lambda_m/h   lecture q_C = (1/h)[1 - 1/(2 chi phi0(1-phi0))]^(1/2)")
    for (chi, phi0) in [(2.5, 0.5), (2.5, 0.4), (3.0, 0.5), (3.0, 0.3), (4.0, 0.5)]
        fpp = f2(phi0, chi); K = chi / 2
        qc = sqrt(-fpp / (2K)); qm = sqrt(-fpp / (4K)); lec = sqrt(1 - 1 / (2chi * phi0 * (1 - phi0)))
        @printf("   %4.1f   %.2f   %8.4f   %.4f   %.4f   %8.3f      %.4f\n", chi, phi0, fpp, qc, qm, 2pi / qm, lec)
    end
    println("   (the lecture's q_C equals q_m = q_c/sqrt(2), the fastest-growing mode)\n")
    println("[4] Growth-rate spectrum omega(q)/M for chi = 2.5, phi0 = 0.5 (f'' = -1, K = 1.25)")
    for q in (0.1, 0.2, 0.3, 0.4, 0.4472, 0.5, 0.6, 0.6325, 0.7)
        w = -q^2 * (f2(0.5, 2.5) + 2 * 1.25 * q^2)
        @printf("   q = %.4f   omega/M = %+.5f\n", q, w)
    end
end

main()
