# Week 8 - Topic 3: Planck's Law, Wien's Displacement, Stefan-Boltzmann
# Cavity mode counting: g(nu) dnu = 8 pi V nu^2/c^3 dnu.
# Equipartition (<E> = kB T) -> Rayleigh-Jeans -> ultraviolet catastrophe.
# Planck (E_n = n h nu) -> <E> = h nu/(exp(h nu/kB T) - 1) ->
#   F_lambda = (2 pi h c^2/lambda^5)/(exp(hc/lambda kB T) - 1)
# Checks: sigma = 2 pi^5 kB^4/(15 h^3 c^2) = 5.670e-8; Wien x = 4.965 ->
# lambda_C T = 2.898e-3 m K; frequency form x = 2.821; Sun -> 500 nm.

using Printf

const H = 6.62607015e-34
const C = 2.99792458e8
const KB = 1.380649e-23

planck(lam, T) = 2pi * H * C^2 / lam^5 / expm1(H * C / (lam * KB * T))
rayleigh_jeans(lam, T) = 2pi * C * KB * T / lam^4

function solve_wien(a)
    f(x) = x * exp(x) / expm1(x) - a
    lo, hi = 0.5, 10.0
    for _ in 1:200
        mid = (lo + hi) / 2
        f(lo) * f(mid) <= 0 ? (hi = mid) : (lo = mid)
    end
    return (lo + hi) / 2
end

# --- Stefan-Boltzmann constant ---
sigma = 2 * pi^5 * KB^4 / (15 * H^3 * C^2)
@printf("sigma = %.4e W/m^2 K^4 (lecture 5.670e-8)\n", sigma)

# Bose-Einstein integral check
n, xmax = 400_000, 60.0
dx = xmax / n
I = sum(((i + 0.5) * dx)^3 / expm1((i + 0.5) * dx) for i in 0:n-1) * dx
@printf("int x^3/(e^x-1) dx = %.6f (pi^4/15 = %.6f)\n\n", I, pi^4 / 15)

# --- Wien displacement ---
x5, x3 = solve_wien(5.0), solve_wien(3.0)
b = H * C / (x5 * KB)
@printf("Wien (lambda): x = %.4f (lecture 4.965) -> lambda_C T = %.4f mm K\n", x5, b * 1e3)
@printf("Wien (nu)    : x = %.4f (lecture 2.821) -> nu_C = 2.821 kB T/h\n", x3)
for (name, T) in (("Sun", 5800.0), ("human body", 310.0), ("furnace", 1500.0))
    @printf("  %-11s T = %6.0f K -> lambda_C = %8.1f nm\n", name, T, b / T * 1e9)
end

# --- total flux check ---
T = 5800.0
lam_lo, lam_hi, nL = 10e-9, 100e-6, 20_000
dlam = (lam_hi - lam_lo) / nL
F = sum(planck(lam_lo + (i + 0.5) * dlam, T) for i in 0:nL-1) * dlam
@printf("\nT = %.0f K: integral F_lambda = %.4e, sigma T^4 = %.4e W/m^2\n",
        T, F, sigma * T^4)

# --- Rayleigh-Jeans vs Planck at 2000 K ---
println("\nF_lambda at 2000 K (W/m^2 um):  lambda    Planck     Rayleigh-Jeans")
for lam_um in (0.2, 0.5, 1.0, 1.449, 3.0, 10.0)
    l = lam_um * 1e-6
    @printf("  %8.3f um  %12.4e  %14.4e\n", lam_um,
            planck(l, 2000.0) * 1e-6, rayleigh_jeans(l, 2000.0) * 1e-6)
end
@printf("  -> RJ diverges as lambda^-4; Planck peaks at %.3f um and decays.\n",
        b / 2000 * 1e6)
