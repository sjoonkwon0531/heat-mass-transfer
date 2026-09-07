# Wk02 - Wiedemann-Franz law with real metal data (293 K)
# Run: julia wk02_wiedemann_franz.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, Printf

T, L0 = 293.0, 2.44e-8
names = ["Ag","Cu","Au","Al","W","Zn","Ni","Fe","Pt","Pb"]
sigma = [6.30, 5.96, 4.52, 3.77, 1.79, 1.69, 1.43, 1.00, 0.94, 0.455] .* 1e7
kappa = [429.0, 401, 317, 237, 173, 116, 91, 80, 72, 35]

@printf("%-6s %10s %8s %12s %7s\n", "Metal", "sigma", "kappa", "L", "L/L0")
for i in eachindex(names)
    L = kappa[i] / (sigma[i] * T)
    @printf("%-6s %10.2e %8.0f %12.3e %7.2f\n",
            names[i], sigma[i], kappa[i], L, L / L0)
end

x = L0 .* sigma .* T
plt = scatter(x, kappa, ms=6, label="metals",
              xlabel="L0*sigma*T [W/m K]", ylabel="kappa [W/m K]",
              title="Wiedemann-Franz: one carrier, two currents",
              series_annotations=text.(names, 8, :bottom))
lim = maximum(kappa) * 1.15
plot!(plt, [0, lim], [0, lim], lw=2, ls=:dash, color=:red,
      label="kappa = L0*sigma*T")
display(plt); readline()
