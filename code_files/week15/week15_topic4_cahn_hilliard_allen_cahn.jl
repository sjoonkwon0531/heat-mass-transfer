# Week 15 · Topic 4 — Spinodal decomposition (Cahn-Hilliard, conserved) vs. domain coarsening
#                      (Allen-Cahn, non-conserved): explicit finite differences
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   f(c) = 1/4 - c^2/2 + c^4/4 (double well, c = +/-1 are the two phases),  mu = c^3 - c - gamma lap c
#   Cahn-Hilliard:  c_t = lap mu         (mean of c conserved)
#   Allen-Cahn:     c_t = -mu            (mean of c not conserved)
#   linear CH about c0: omega(q) = q^2 (1 - 3 c0^2) - gamma q^4  ->  q_m^2 = (1 - 3 c0^2)/(2 gamma)
#   grid spacing h = 1, periodic boundaries, 5-point Laplacian
using Printf, Statistics

const N = 64
const GAMMA = 1.0
const DT = 0.01
const REPORT = (10, 50, 100, 200)

function lcg_field(n, seed)
    out = zeros(n, n); s = UInt64(seed)
    for i in 1:n, j in 1:n
        s = (UInt64(1664525) * s + UInt64(1013904223)) % UInt64(4294967296)
        out[i, j] = s / 4294967296.0
    end
    return out
end

lap(Z) = ((circshift(Z, (1, 0)) .+ circshift(Z, (-1, 0))) .+ (circshift(Z, (0, 1)) .+ circshift(Z, (0, -1)))) .- 4.0 .* Z

function chord_length(c)
    s = c .> 0
    n = sum(s .!= circshift(s, (1, 0))) + sum(s .!= circshift(s, (0, 1)))
    return n > 0 ? 2.0 * N * N / n : Inf
end

function main()
    @printf("Topic 4 — Cahn-Hilliard vs. Allen-Cahn: N = %d, gamma = %.1f, dt = %.2f\n\n", N, GAMMA, DT)
    println("[1] Linear stability of the uniform state c0 (Cahn-Hilliard)")
    for c0 in (0.0, -0.3, -0.5, -0.6)
        a = 1 - 3c0^2
        if a <= 0
            @printf("   c0 = %+.1f: 1 - 3 c0^2 = %.2f <= 0 -> outside the spinodal, no linear growth\n", c0, a)
        else
            qm = sqrt(a / (2GAMMA))
            @printf("   c0 = %+.1f: q_c = %.4f, q_m = %.4f, lambda_m = %.3f, omega_max = %.4f\n", c0, sqrt(a / GAMMA), qm, 2pi / qm, a^2 / (4GAMMA))
        end
    end
    println()
    for (kind, c0) in (("CH", 0.0), ("CH", -0.3), ("AC", 0.0))
        @printf("[%s, c0 = %+.1f]\n", kind == "CH" ? "Cahn-Hilliard" : "Allen-Cahn", c0)
        println("     t      mean c     chord length    area fraction c > 0")
        c = c0 .+ 0.1 .* (lcg_field(N, 2024) .- 0.5)
        step = 0
        for T in REPORT
            target = round(Int, T / DT)
            while step < target
                mu = ((c .* c) .* c .- c) .- GAMMA .* lap(c)
                c = kind == "CH" ? c .+ DT .* lap(mu) : c .- DT .* mu
                step += 1
            end
            L = chord_length(c)
            Ls = isfinite(L) ? @sprintf("%8.3f", L) : "  (none)"
            @printf("   %5.0f   %+.6f   %s        %.4f\n", step * DT, mean(c), Ls, mean(c .> 0))
        end
        for i in 0:15
            println("   |", join((c[i * N ÷ 16 + 1, j * N ÷ 32 + 1] > 0 ? '#' : '.') for j in 0:31), "|")
        end
        println()
    end
end

main()
