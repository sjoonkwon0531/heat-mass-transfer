# Wk01 - One equation, three physics (nu, alpha, D vs erfc analytic)
# Run: julia wk01_unified_transport.jl   (needs Plots, SpecialFunctions)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, SpecialFunctions, Printf

function solve_diffusion(delta; L=0.02, N=201, t_end=20.0)
    x = range(0, L, length=N); dx = step(x)
    dt = 0.4 * dx^2 / delta
    nstep = ceil(Int, t_end / dt); dt = t_end / nstep
    phi = zeros(N); phi[1] = 1.0
    c = delta * dt / dx^2
    for _ in 1:nstep
        phi[2:end-1] .+= c .* (phi[3:end] .- 2 .* phi[2:end-1] .+ phi[1:end-2])
        phi[1] = 1.0; phi[end] = 0.0
    end
    return collect(x), phi
end

deltas = [8.9e-7, 1.43e-7, 2.0e-9]      # water: nu, alpha, D
labels = ["momentum (nu)", "heat (alpha)", "mass (D)"]
cols   = [:blue, :red, :green]
t_end  = 20.0

plt = plot(xlabel="x [mm]", ylabel="phi (v*, T*, C*)",
           title="Water: same solver, three diffusivities", legend=:topright)
for m in 1:3
    x, phi = solve_diffusion(deltas[m]; t_end=t_end)
    plot!(plt, x .* 1000, phi, lw=2, color=cols[m], label=labels[m] * " FDM")
    ana = erfc.(x ./ (2 .* sqrt(deltas[m] * t_end)))
    plot!(plt, x .* 1000, ana, lw=1, ls=:dash, color=cols[m],
          label=labels[m] * " analytic")
end
@printf("Pr = %.1f, Sc = %.0f\n", deltas[1]/deltas[2], deltas[1]/deltas[3])
display(plt); readline()
