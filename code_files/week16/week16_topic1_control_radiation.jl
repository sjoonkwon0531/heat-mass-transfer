# Week 16 · Topic 1 — Final review: stirred-tank dynamics, FOPDT/PI tuning, gray-body radiation
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   tau = rho V/mdot, K = 1/(mdot cp);  tau_p = 1.5 (t2 - t1), theta_p = (3 t1 - t2)/2
#   ITAE PI (lecture): Kc Kp = 0.859 (theta/tau)^-0.977, tau_I = (tau/0.674)(theta/tau)^0.680
#   parallel plates with N thin shields: q'' = sigma (T1^4 - T2^4) / sum of (1/e_i + 1/e_j - 1)
using Printf
const SIGMA = 5.670e-8

function main()
    println("Topic 1 — stirred tank, FOPDT/PI tuning, gray-body radiation\n")
    tau = 1000 * 0.5 / 0.25; K = 1 / (0.25 * 4184)
    println("[1] Stirred tank: V = 0.5 m3, mdot = 0.25 kg/s, cp = 4184 J/kg K, dQ = 10 kW")
    @printf("   tau = %.0f s, K = %.3e K/W, final rise = %.2f K, t95 = 3 tau = %.0f s\n", tau, K, K * 1e4, 3tau)
    for frac in (0.632, 0.95)
        @printf("   time to %.1f%% = %.0f s\n", 100frac, -tau * log(1 - frac))
    end
    println()
    tp = 1.5 * (50 - 20); th = (3 * 20 - 50) / 2; r = th / tp
    println("[2] FOPDT two-point fit: t1 = 20 s (28.3%), t2 = 50 s (63.2%)")
    @printf("   tau_p = %.1f s, theta_p = %.1f s, theta/tau = %.4f\n", tp, th, r)
    @printf("   ITAE PI: Kc Kp = %.3f, tau_I = %.2f s\n\n", 0.859 * r^-0.977, tp / 0.674 * r^0.680)
    println("[3] Parallel plates T1 = 800 K (e = 0.6), T2 = 400 K (e = 0.9), shields e = 0.05")
    q0 = NaN
    for n in 0:3
        eps = vcat(0.6, fill(0.05, n), 0.9)
        R = [1 / eps[i] + 1 / eps[i+1] - 1 for i in 1:n+1]
        q = SIGMA * (800.0^4 - 400.0^4) / sum(R)
        isnan(q0) && (q0 = q)
        T4 = 800.0^4; temps = String[]
        for i in 1:n
            T4 -= q * R[i] / SIGMA
            push!(temps, @sprintf("%.1f", T4^0.25))
        end
        ts = n == 0 ? "-" : join(temps, ", ")
        @printf("   N = %d: q'' = %9.1f W/m2  (q0/q = %6.2f)  shield T = %s K\n", n, q, q0 / q, ts)
    end
    println()
    q = 0.8 * SIGMA * pi * 0.1 * (450.0^4 - 300.0^4); hr = 0.8 * SIGMA * (450 + 300) * (450^2 + 300^2)
    println("[4] Pipe in a room: D = 0.1 m, e = 0.8, 450 K in 300 K surroundings")
    @printf("   q = %.1f W per metre, h_r = %.2f W/m2 K\n\n", q, hr)
    println("[5] Wien peaks (lambda_max T = 2898 um K)")
    for T in (5800.0, 2900.0, 300.0)
        @printf("   T = %6.0f K -> lambda_max = %.3f um\n", T, 2898 / T)
    end
end

main()
