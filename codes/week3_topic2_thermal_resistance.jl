# Week 3 - Topic 2: Combined Conduction + Convection via Thermal Resistance Networks
# Q = dT / sum(R); R_conv = 1/(h*A); R_slab = L/(k*A); R_cyl = log(ro/ri)/(2*pi*L*k)
# Run: julia week3_topic2_thermal_resistance.jl

using Printf

# --- Case A: 3-layer plane wall with two-sided convection ---
Th, Tc, A = 300.0, 20.0, 1.0
hL, hR = 25.0, 10.0
layers = [(0.02, 15.0), (0.10, 0.5), (0.01, 45.0)]   # (thickness, k)

R = Float64[1 / (hL * A)]
for (L, k) in layers
    push!(R, L / (k * A))
end
push!(R, 1 / (hR * A))

Rtot = sum(R)
Q = (Th - Tc) / Rtot
U = 1 / (A * Rtot)

names = ["conv,L", "cond,1", "cond,2", "cond,3", "conv,R"]
println("Case A: 3-layer plane wall with two-sided convection")
for (n, r) in zip(names, R)
    @printf("  R_%-7s = %10.6f K/W\n", n, r)
end
@printf("  R_total   = %10.6f K/W\n  Q = %.3f W,  U = %.4f W/m^2K\n", Rtot, Q, U)

temps = Float64[Th]
for r in R
    push!(temps, temps[end] - Q * r)
end
println("  T profile: ", join([@sprintf("%.2f", t) for t in temps], ", "))

# --- Case B: insulated steam pipe, per meter ---
Lp, h_in, h_out = 1.0, 1500.0, 12.0
r = [0.025, 0.030, 0.055]
ks = [50.0, 0.06]
A_in = 2pi * r[1] * Lp
A_out = 2pi * r[end] * Lp
R2 = [1 / (h_in * A_in),
      log(r[2] / r[1]) / (2pi * Lp * ks[1]),
      log(r[3] / r[2]) / (2pi * Lp * ks[2]),
      1 / (h_out * A_out)]
Q2 = (250.0 - 25.0) / sum(R2)

lab = ["conv,in", "cond,steel", "cond,insul", "conv,out"]
println("\nCase B: insulated steam pipe, per meter of pipe")
for (n, rr) in zip(lab, R2)
    @printf("  R_%-10s = %10.6f K/W\n", n, rr)
end
@printf("  Q per meter = %.2f W/m\n", Q2)
