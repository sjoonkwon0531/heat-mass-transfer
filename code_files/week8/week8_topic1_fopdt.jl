# Week 8 - Topic 1: Stirred-Tank Heating -> First-Order Process & FOPDT Fitting
# Energy balance: rho*V*cp dT'/dt = mdot*cp (Tin' - T') + Q'
#   -> T'(s) = [K/(tau s+1)] Q'(s) + [1/(tau s+1)] Tin'(s),
#      K = 1/(mdot*cp), tau = rho*V/mdot.
# FOPDT: G(s) = Kp exp(-theta_p s)/(tau_p s + 1).
# Two-point fit: tau_p = 3(t2-t1)/2, theta_p = (3 t1 - t2)/2
# Lecture example: t1 = 21.8 s, t2 = 36.0 s -> tau_p = 21.3 s, theta_p = 14.7 s.

using Printf

function fopdt_step(t, Kp, du, tau_p, theta_p; y0=0.0)
    t < theta_p && return y0
    e = exp(-(t - theta_p) / tau_p)
    return e * y0 + (1 - e) * Kp * du
end

two_point_fit(t1, t2) = (3 * (t2 - t1) / 2, (3 * t1 - t2) / 2)

# --- stirred tank: physical parameters -> K and tau ---
rho, cp = 1000.0, 4184.0
V, mdot = 0.5, 0.25
K = 1 / (mdot * cp)
tau = rho * V / mdot
println("Stirred-tank first-order parameters:")
@printf("  K   = 1/(mdot*cp) = %.3e K/W\n", K)
@printf("  tau = rho*V/mdot  = %.1f s\n", tau)
@printf("  (a +10 kW step in Q raises T by %.3f K at steady state)\n\n", K * 1e4)

# --- lecture two-point fit ---
t1, t2 = 21.8, 36.0
tau_p, theta_p = two_point_fit(t1, t2)
println("FOPDT two-point fit (lecture valve-to-temperature data):")
@printf("  t1 = %.1f s (0.283), t2 = %.1f s (0.632)\n", t1, t2)
@printf("  tau_p   = %.1f s (lecture 21.3)\n", tau_p)
@printf("  theta_p = %.1f s (lecture 14.7)\n", theta_p)
for tt in (t1, t2)
    @printf("  check y(%5.1f)/y_inf = %.4f\n", tt, fopdt_step(tt, 1.0, 1.0, tau_p, theta_p))
end

# --- normalized step-response table ---
println("\nNormalized FOPDT step response (Kp*du = 1):\n    t (s)    y(t)")
for tt in 0:10:120
    @printf("  %6d   %7.4f\n", tt, fopdt_step(Float64(tt), 1.0, 1.0, tau_p, theta_p))
end
@printf("  -> 63.2%% reached at theta_p + tau_p = %.1f s\n", theta_p + tau_p)
