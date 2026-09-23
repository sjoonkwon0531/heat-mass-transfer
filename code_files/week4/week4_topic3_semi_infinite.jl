# Week 4 - Topic 3: Semi-Infinite Solid - Similarity (erf) & the Integral Method
# Exact:    (T-T0)/(Ts-T0) = erfc(eta),  eta = x/(2*sqrt(alpha*t))
# Integral: (T-T0)/(Ts-T0) ~ (1 - x/delta)^2, delta = sqrt(12*alpha*t)
# Penetration depth: exact 2.8*sqrt(alpha*t) vs integral 2.6895*sqrt(alpha*t)
# Run: julia week4_topic3_semi_infinite.jl   (uses SpecialFunctions for erfc)

using Printf
using SpecialFunctions   # ] add SpecialFunctions

theta_exact(eta) = erfc(eta)

function theta_integral(eta)
    v = 1 - eta / sqrt(3)       # x/delta = eta/sqrt(3)
    return v > 0 ? v^2 : 0.0
end

surface_flux(k, Ts, T0, alpha, t) = k * (Ts - T0) / sqrt(pi * alpha * t)

println("Exact vs integral-method profile, Theta = (T-T0)/(Ts-T0):")
println("  eta      erfc(eta)   parabola   |diff|")
maxerr = 0.0
for i in 0:10
    eta = 0.25 * i
    e, a = theta_exact(eta), theta_integral(eta)
    global maxerr = max(maxerr, abs(e - a))
    @printf("  %4.2f    %8.5f   %8.5f   %7.5f\n", eta, e, a, abs(e - a))
end
@printf("  max pointwise gap ~ %.4f\n", maxerr)

xd_int = (1 - sqrt(0.05)) * sqrt(12)
println("\nPenetration depth / sqrt(alpha*t):")
@printf("  exact (erfc(1.4) = %.4f) : 2.8\n", erfc(1.4))
@printf("  integral method          : %.4f\n", xd_int)
@printf("  relative error           : %.1f %%\n", abs(xd_int - 2.8) / 2.8 * 100)

# Worked example: hot bath (Ts = 90) suddenly applied to a soil-like wall (T0 = 15)
alpha = 7.0e-7
k = 1.2
Ts, T0 = 90.0, 15.0
println("\nWorked example: alpha = 0.7 mm^2/s, Ts = 90, T0 = 15 degC")
println("  t [s]   depth 2.8*sqrt(at) [mm]   T(x=10mm) [degC]   q_s [kW/m^2]")
for t in (10.0, 60.0, 600.0, 3600.0)
    depth = 2.8 * sqrt(alpha * t) * 1e3
    eta10 = 0.010 / (2 * sqrt(alpha * t))
    T10 = T0 + (Ts - T0) * theta_exact(eta10)
    qs = surface_flux(k, Ts, T0, alpha, t) / 1e3
    @printf("  %6.0f  %12.1f            %10.2f      %10.3f\n", t, depth, T10, qs)
end
println("  -> depth grows as sqrt(t); surface flux decays as 1/sqrt(t).")

# sanity checks
@assert abs(theta_exact(0.0) - 1.0) < 1e-12
@assert theta_exact(3.0) < 3e-5
@assert abs(theta_integral(sqrt(3))) < 1e-12
