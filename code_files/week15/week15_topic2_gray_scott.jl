# Week 15 · Topic 2 — Gray-Scott reaction-diffusion patterns (explicit finite differences)
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   U + 2V -> 3V,  V -> P,  U fed at rate F, both drained:
#   U_t = Du lap U - U V^2 + F (1 - U)
#   V_t = Dv lap V + U V^2 - (F + k) V
#   grid spacing 1, time step 1, periodic boundaries, 5-point Laplacian
using Printf, Statistics

const N = 96
const DU, DV, DT = 0.16, 0.08, 1.0
const STEPS = 6000

function lcg_field(n, seed)
    out = zeros(n, n); s = UInt64(seed)
    for i in 1:n, j in 1:n        # row-major order, as in Python/C++
        s = (UInt64(1664525) * s + UInt64(1013904223)) % UInt64(4294967296)
        out[i, j] = s / 4294967296.0
    end
    return out
end

lap(Z) = ((circshift(Z, (1, 0)) .+ circshift(Z, (-1, 0))) .+ (circshift(Z, (0, 1)) .+ circshift(Z, (0, -1)))) .- 4.0 .* Z

function run(F, k)
    U = ones(N, N); V = zeros(N, N)
    r = lcg_field(N, 12345)
    c = (N ÷ 2 - 8 + 1):(N ÷ 2 + 8)
    U[c, c] .= 0.50; V[c, c] .= 0.25
    U .+= 0.02 .* (r .- 0.5); V .+= 0.02 .* (r .- 0.5)
    for _ in 1:STEPS
        uvv = (U .* V) .* V
        Un = U .+ DT .* ((DU .* lap(U) .- uvv) .+ F .* (1.0 .- U))
        Vn = V .+ DT .* ((DV .* lap(V) .+ uvv) .- (F + k) .* V)
        U, V = Un, Vn
    end
    return U, V
end

function ascii_map(V; rows = 24, cols = 48)
    chars = " .:-=+*#%@"
    for i in 0:rows-1
        row = join(chars[Int(floor(min(9, max(0, V[i * N ÷ rows + 1, j * N ÷ cols + 1] / 0.4 * 9.999)))) + 1] for j in 0:cols-1)
        println("   |", row, "|")
    end
end

function main()
    @printf("Topic 2 — Gray-Scott patterns: N = %d, Du = %.2f, Dv = %.2f, dt = %.1f, %d steps\n\n", N, DU, DV, DT, STEPS)
    println("[1] Homogeneous states: (U, V) = (1, 0) always; nontrivial states need")
    println("    F/(F+k)^2 >= 4 i.e. V = [1 +/- sqrt(1 - 4(F+k)^2/F)] F/(2(F+k))")
    for (F, k) in [(0.035, 0.060), (0.040, 0.060), (0.060, 0.062)]
        disc = 1 - 4 * (F + k)^2 / F
        if disc >= 0
            @printf("    F = %.3f, k = %.3f: V = %.4f, %.4f\n", F, k, (1 + sqrt(disc)) * F / (2(F + k)), (1 - sqrt(disc)) * F / (2(F + k)))
        else
            @printf("    F = %.3f, k = %.3f: only the trivial state\n", F, k)
        end
    end
    println()
    for (name, F, k) in [("spots", 0.035, 0.065), ("stripes/labyrinth", 0.060, 0.062), ("mixed", 0.025, 0.060)]
        U, V = run(F, k)
        @printf("[%s] F = %.3f, k = %.3f\n", name, F, k)
        @printf("   mean U = %.5f, mean V = %.5f, area fraction V > 0.2 = %.4f\n", mean(U), mean(V), mean(V .> 0.2))
        ascii_map(V)
        println()
    end
end

main()
