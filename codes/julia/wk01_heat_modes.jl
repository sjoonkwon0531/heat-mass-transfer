# Wk01 - Conduction vs convection vs radiation (T^4 takeover)
# Run: julia wk01_heat_modes.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, Printf

const SIGMA = 5.670e-8
T_inf = 25.0
k, L, h, eps_ = 0.6, 0.02, 25.0, 0.85

Ts = range(30.0, 900.0, length=400)
dT = Ts .- T_inf
q_cond = k .* dT ./ L
q_conv = h .* dT
q_rad  = eps_ .* SIGMA .* ((Ts .+ 273.15).^4 .- (T_inf + 273.15)^4)

plt = plot(xlabel="hot-surface temperature Ts [C]",
           ylabel="heat flux q'' [kW/m^2]",
           title="Three modes: who dominates when?", legend=:topleft)
plot!(plt, Ts, q_cond ./ 1e3, lw=2, label="conduction k*dT/L")
plot!(plt, Ts, q_conv ./ 1e3, lw=2, label="convection h*dT")
plot!(plt, Ts, q_rad ./ 1e3,  lw=2, label="radiation eps*sigma*(Ts^4-Tinf^4)")

ic = argmin(abs.(q_rad .- q_conv))
@printf("Radiation passes convection near Ts = %.0f C\n", Ts[ic])
display(plt); readline()
