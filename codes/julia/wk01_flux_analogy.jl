# Wk01 - Transport analogy: Newton / Fourier / Fick (Pr, Sc, Le)
# Run: julia wk01_flux_analogy.jl   (needs Plots, Printf)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Printf, Plots

names = ["Air (25C)", "Water (25C)", "Glycerin", "Engine oil"]
mu  = [1.8e-5, 8.9e-4, 0.95,  0.80]
k   = [0.026,  0.61,   0.29,  0.145]
D   = [2.5e-5, 2.0e-9, 1e-11, 1e-10]
rho = [1.18,   997.0,  1260.0, 888.0]
cp  = [1005.0, 4180.0, 2430.0, 1880.0]

nu    = mu ./ rho
alpha = k ./ (rho .* cp)
Pr = nu ./ alpha; Sc = nu ./ D; Le = alpha ./ D

@printf("%-14s %10s %10s %10s %8s %10s %8s\n",
        "Material", "nu", "alpha", "D", "Pr", "Sc", "Le")
for i in eachindex(names)
    @printf("%-14s %10.2e %10.2e %10.2e %8.2f %10.1f %8.1f\n",
            names[i], nu[i], alpha[i], D[i], Pr[i], Sc[i], Le[i])
end

x = 1:length(names)
plt = plot(yscale=:log10, ylabel="diffusivity [m^2/s]",
           title="One unit (m^2/s), three transports",
           xticks=(x, names), legend=:best)
bar!(plt, x .- 0.25, nu,    bar_width=0.22, label="nu (momentum)")
bar!(plt, x,         alpha, bar_width=0.22, label="alpha (heat)")
bar!(plt, x .+ 0.25, D,     bar_width=0.22, label="D (mass)")
display(plt); readline()
