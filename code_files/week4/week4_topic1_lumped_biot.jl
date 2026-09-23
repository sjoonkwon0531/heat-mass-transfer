# Week 4 - Topic 1: Lumped Capacitance & the Biot Number
# (T-Tinf)/(T0-Tinf) = exp(-t/tau) = exp(-Bi*Fo), Bi = h*Lc/k, Fo = alpha*t/Lc^2
# Also the steady heat-generating wire (lecture): Theta = (2 + Bi*(1-eta^2))/(2 + Bi)
# Run: julia week4_topic1_lumped_biot.jl

using Printf

lumped_history(Bi, Fo) = exp(-Bi * Fo)
wire_profile(eta, Bi) = (2 + Bi * (1 - eta^2)) / (2 + Bi)

# --- Case A: steel sphere quenched in oil ---
D = 0.010
rho, c, k = 7800.0, 480.0, 45.0
h = 400.0
T0, Tinf = 850.0, 60.0

Lc = D / 6                       # V/A of a sphere
Bi = h * Lc / k
alpha = k / (rho * c)
tau = rho * c * Lc / h

println("Case A: steel sphere, D = 10 mm, quenched in oil")
@printf("  Lc = D/6 = %.3f mm\n", Lc * 1e3)
@printf("  Bi = %.4f  (%s)\n", Bi, Bi < 0.1 ? "< 0.1 -> lumped OK" : ">= 0.1 -> full PDE")
@printf("  alpha = %.3f mm^2/s,  tau = %.2f s\n", alpha * 1e6, tau)

println("  t [s]   Fo      T [degC]")
for t in (0.0, 5.0, 15.6, 30.0, 60.0, 120.0)
    Fo = alpha * t / Lc^2
    T = Tinf + (T0 - Tinf) * lumped_history(Bi, Fo)   # = exp(-t/tau)
    @printf("  %5.1f  %6.2f  %8.2f\n", t, Fo, T)
end
@printf("  time to 99%% equilibration: %.1f s\n", tau * log(100))

# sanity: exp(-Bi*Fo) must equal exp(-t/tau)
let t = 37.0
    Fo = alpha * t / Lc^2
    @assert abs(lumped_history(Bi, Fo) - exp(-t / tau)) < 1e-12
end

# --- Case B: physical meaning of Bi via the heat-generating wire ---
println("\nCase B: steady wire, Theta = (2 + Bi(1-eta^2))/(2 + Bi)")
etas = (0.0, 0.25, 0.5, 0.75, 1.0)
println("  eta:   " * join([@sprintf("%5.2f", e) for e in etas], "  "))
for Biw in (0.0, 0.5, 2.0, 10.0, 1e12)
    tag = Biw > 1e6 ? " inf" : @sprintf("%4g", Biw)
    vals = join([@sprintf("%5.3f", wire_profile(e, Biw)) for e in etas], "  ")
    println("  Bi=$tag: $vals")
end
println("  Bi->0: isothermal wire (convection-limited)")
println("  Bi->inf: surface pinned at Tinf (conduction-limited)")
