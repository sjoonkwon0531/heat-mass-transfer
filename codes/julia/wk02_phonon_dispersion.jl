# Wk02 - Phonon dispersion of a 1D diatomic chain
# Run: julia wk02_phonon_dispersion.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots

C, m1 = 1.0, 1.0
ratios = [1.0, 2.0, 4.0]
ka = range(-pi/2, pi/2, length=400)

plts = []
for r in ratios
    m2 = r * m1
    s = 1/m1 + 1/m2
    root = sqrt.(s^2 .- 4 .* sin.(ka).^2 ./ (m1*m2))
    w_ac = sqrt.(C .* (s .- root))
    w_op = sqrt.(C .* (s .+ root))
    p = plot(ka, w_ac, lw=2, color=:blue, label="acoustic",
             xlabel="ka", title="m2/m1 = " * string(Int(r)))
    plot!(p, ka, w_op, lw=2, color=:red, label="optical")
    push!(plts, p)
end
display(plot(plts..., layout=(1,3), size=(1000,360),
             plot_title="Mass contrast opens a phonon gap"))
readline()
