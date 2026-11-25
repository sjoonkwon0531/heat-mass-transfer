# Week 14 · Topic 1 — Coupled fluxes: Soret separation and the thermodynamic factor
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   x_A(L) - x_A(0) ≈ -x_A x_B alpha_A ln(T_L/T_0);  exact: dx/dlnT = -alpha x(1-x)
#   Margules: D* = (1 - 2 A x1 x2) D, negative (uphill diffusion) only if A > 2
using Printf

soret_shift(xA, al, TL, T0) = -xA * (1 - xA) * al * log(TL / T0)
function soret_exact(xA0, al, TL, T0)
    r = xA0 / (1 - xA0) * (T0 / TL)^al
    return r / (1 + r)
end
thermo_factor(x1, A) = 1 - 2A * x1 * (1 - x1)

function main()
    println("Topic 1 — Soret separation and the thermodynamic factor\n")
    println("[1] Lecture example: alpha_A = 0.3, T_L = 300 K, T_0 = 200 K, x_A = x_B = 0.5")
    @printf("   linearised x_A(L) - x_A(0) = %+.4f\n", soret_shift(0.5, 0.3, 300, 200))
    @printf("   exact (integrated)         = %+.4f\n", soret_exact(0.5, 0.3, 300, 200) - 0.5)
    println("   Sign: with alpha_A > 0 the heavier species A gathers at the cold wall (y = 0).\n")
    println("[2] Effect of the temperature ratio (alpha_A = 0.3, x_A = 0.5)")
    for r in (1.1, 1.5, 2.0, 3.0, 5.0)
        @printf("   T_L/T_0 = %4.1f   shift = %+.4f\n", r, soret_shift(0.5, 0.3, r, 1.0))
    end
    println()
    println("[3] Cascade: separation factor per stage q = (T_L/T_0)^alpha, n stages -> q^n")
    q = 1.5^0.3
    for n in (1, 5, 10, 20, 50)
        @printf("   n = %3d   q^n = %10.3f\n", n, q^n)
    end
    println("   (This is why thermal diffusion columns can separate isotopes despite a tiny alpha.)\n")
    println("[4] Thermodynamic factor 1 + dln(gamma)/dln(x) for a Margules solution")
    println("     x1      A=0.5     A=1.5     A=2.5")
    for x in (0.1, 0.2, 0.3, 0.4, 0.5)
        @printf("   %5.2f   %7.3f   %7.3f   %7.3f\n", x, thermo_factor(x, 0.5), thermo_factor(x, 1.5), thermo_factor(x, 2.5))
    end
    A = 2.5; xs = 0.5 * (1 - sqrt(1 - 2 / A))
    @printf("   For A = %g: D* < 0 for %.3f < x1 < %.3f (spinodal region, uphill diffusion)\n", A, xs, 1 - xs)
end

main()
