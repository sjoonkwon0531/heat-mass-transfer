# Wk01 - 1D random walk -> Gaussian diffusion
# Run: julia wk01_random_walk.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Random, Statistics, Plots
Random.seed!(1)

NP, NSTEP, ELL = 20000, 400, 1.0
pos = zeros(NP)
msd = zeros(NSTEP + 1)

for n in 1:NSTEP
    pos .+= ELL .* (2 .* (rand(NP) .< 0.5) .- 1)
    msd[n+1] = mean(pos .^ 2)
end

sigma = ELL * sqrt(NSTEP)
xg = range(-4sigma, 4sigma, length=400)
gauss = exp.(-xg .^ 2 ./ (2sigma^2)) ./ (sigma * sqrt(2pi))

p1 = histogram(pos, bins=60, normalize=:pdf, alpha=0.6, label="walkers",
               xlabel="x", ylabel="P(x)", title="Walkers vs Gaussian")
plot!(p1, xg, gauss, lw=2, color=:red, label="Gaussian")

t = 0:NSTEP
p2 = plot(t, msd, lw=2, label="simulated",
          xlabel="step n (time)", ylabel="<x^2>", title="MSD ~ t")
plot!(p2, t, ELL^2 .* t, lw=2, ls=:dash, color=:red, label="theory")

display(plot(p1, p2, layout=(1,2), size=(950,420))); readline()
