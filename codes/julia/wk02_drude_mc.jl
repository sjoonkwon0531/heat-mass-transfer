# Wk02 - Drude model Monte-Carlo (1D)
# Run: julia wk02_drude_mc.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Random, Statistics, Plots, Printf
Random.seed!(2)

NE, NSTEP, DT = 5000, 3000, 0.01
TAU, A, U0 = 1.0, 0.5, 3.0

v = U0 .* randn(NE)
vd = zeros(NSTEP)
for n in 1:NSTEP
    for i in 1:NE
        if rand() < DT / TAU
            v[i] = U0 * randn()      # scatter: thermalize
        else
            v[i] += A * DT           # accelerate in field
        end
    end
    vd[n] = mean(v)
end

t = (0:NSTEP-1) .* DT
p1 = plot(t, vd, lw=1, label="<v> (simulation)",
          xlabel="time", ylabel="mean velocity",
          title="Drift velocity from chaos")
hline!(p1, [A * TAU], lw=2, ls=:dash, color=:red, label="Drude a*tau")

p2 = histogram(v, bins=60, normalize=:pdf, alpha=0.7, legend=false,
               xlabel="v", ylabel="P(v)", title="Shifted Maxwellian")
vline!(p2, [A * TAU], lw=2, ls=:dash, color=:red)

@printf("simulated v_d = %.4f, Drude a*tau = %.4f\n",
        mean(vd[div(NSTEP,2):end]), A * TAU)
display(plot(p1, p2, layout=(1,2), size=(950,420))); readline()
