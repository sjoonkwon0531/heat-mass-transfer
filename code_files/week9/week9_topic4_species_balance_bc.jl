# Week 9 - Topic 4: Species Balance, Interface Boundary Conditions and a CVD Film
# Henry's law p_A = x_A H_A(T) (lecture table, bar); Raoult p_A = x_A p_A*(T)
# W CVD: 3H2 + WF6 -> W + 6HF  ->  N_A(1 + 2 y_A) = -c D dy_A/dz
#   diffusion-limited: N_A = (c D/(2 delta)) ln[(1 + 2 y_A0)/(1 + 2 y_Ad)]
#   finite surface rate: N_A = k_s c y_Ad,  Da = k_s delta/D
using Printf, LinearAlgebra

const Tt = [273, 280, 290, 300, 310, 320]
const H_O2 = [25500, 30500, 37600, 45700, 52500, 56800]
function henry(tab, T)
    k = findlast(<=(T), Tt)
    k == length(Tt) && return float(tab[end])
    return tab[k] + (T - Tt[k]) / (Tt[k+1] - Tt[k]) * (tab[k+1] - tab[k])
end
H = henry(H_O2, 298.0); x = 0.21 / H; cO2 = x * 55.4e3
@printf("O2 in water at 298 K: H = %.0f bar, x = %.3e, c = %.3f mol/m^3 = %.2f mg/L\n", H, x, cO2, cO2 * 32)

c = 101325 / (8.314462618 * 700); D = 1e-4; delta = 1e-3; y0 = 0.10
fluxA(yd) = c * D / (2delta) * log((1 + 2y0) / (1 + 2yd))
Na = fluxA(0.0); Nf = c * D * y0 / delta

n = 200
y = collect(range(y0, 0.0, length = n + 1))
for it in 1:200
    kf = 1 ./ (1 .+ (y[1:end-1] .+ y[2:end]))
    dl = [kf[1:n-1]; 0.0]; du = [0.0; kf[2:n]]
    dg = [1.0; -(kf[1:n-1] .+ kf[2:n]); 1.0]
    rhs = zeros(n + 1); rhs[1] = y0
    global y = Tridiagonal(dl, dg, du) \ rhs
end
h = delta / n; Nn = -c * D * (y[2] - y[1]) / h / (1 + (y[1] + y[2]))
@printf("\nW CVD: analytic N_A = %.5e, FDM N_A = %.5e, pure Fick = %.5e mol/m^2 s\n", Na, Nn, Nf)
for Da in (0.1, 1.0, 10.0, 100.0)
    ks = Da * D / delta; lo, hi = 0.0, y0
    for _ in 1:200
        mid = 0.5 * (lo + hi)
        fluxA(mid) - ks * c * mid > 0 ? (lo = mid) : (hi = mid)
    end
    yd = 0.5 * (lo + hi)
    @printf("  Da = %6.1f: y_A(surface) = %.4f, N_A = %.4e (%5.1f%% of limit)\n", Da, yd, ks * c * yd, ks * c * yd / Na * 100)
end
