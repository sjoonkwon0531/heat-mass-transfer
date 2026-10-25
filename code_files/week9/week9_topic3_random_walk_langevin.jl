# Week 9 - Topic 3: Random Walk, Langevin Dynamics and the Diffusivity
# Langevin (one component, m = kB T = 1): dv = -gamma v dt + sqrt(2 kappa dt) N(0,1), kappa = gamma
#   <x^2> = (2/gamma)[t - (1 - exp(-gamma t))/gamma] -> 2 D t,  D = kB T/(m gamma) = 1/gamma
#   Green-Kubo: D = int <v(t) v(0)> dt = int exp(-gamma t) dt = 1/gamma
# Porous lattice walk: blind ant on a periodic square lattice with open-site fraction eps.
using Printf, Random

function langevin(; gamma = 2.0, dt = 0.01, nwalk = 4000, nsteps = 2000)
    rng = MersenneTwister(7)
    amp = sqrt(2gamma * dt)
    v = randn(rng, nwalk); v0 = copy(v); x = zeros(nwalk)
    println("   t     MSD_sim   MSD_exact   VACF_sim  VACF_exact")
    m1 = t1 = 0.0
    for k in 1:nsteps
        @. v += -gamma * v * dt + amp * $randn(rng, nwalk)
        @. x += v * dt
        if k % 200 == 0
            t = k * dt; msd = sum(abs2, x) / nwalk; vacf = sum(v .* v0) / nwalk
            ex = 2 / gamma * (t - (1 - exp(-gamma * t)) / gamma)
            @printf("%6.2f  %9.4f  %9.4f   %8.4f  %8.4f\n", t, msd, ex, vacf, exp(-gamma * t))
            k == 1000 && (m1 = msd; t1 = t)
            k == nsteps && @printf("Long-time D = %.3f (theory %.3f)\n", (msd - m1) / (t - t1) / 2, 1 / gamma)
        end
    end
end

function porous_walk(eps; L = 64, nw = 500, ns = 3000)
    rng = MersenneTwister(1)
    open_ = rand(rng, L, L) .< eps
    voids = findall(open_)
    moves = ((1, 0), (-1, 0), (0, 1), (0, -1))
    s2 = 0.0
    for _ in 1:nw
        c = voids[rand(rng, 1:length(voids))]; i, j = c[1], c[2]; X = Y = 0
        for _ in 1:ns
            di, dj = moves[rand(rng, 1:4)]
            ni = mod1(i + di, L); nj = mod1(j + dj, L)
            if open_[ni, nj]
                i, j = ni, nj; X += di; Y += dj
            end
        end
        s2 += X^2 + Y^2
    end
    return s2 / nw / ns
end

langevin()
println("\n  porosity   D_eff/D_0   eps^2")
for eps in (1.0, 0.9, 0.8, 0.7, 0.6, 0.5)
    @printf("   %4.2f      %7.3f    %5.3f\n", eps, porous_walk(eps), eps^2)
end
