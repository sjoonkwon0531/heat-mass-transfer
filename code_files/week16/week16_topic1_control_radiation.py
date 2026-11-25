# Week 16 · Topic 1 — Final review: stirred-tank dynamics, FOPDT/PI tuning, gray-body radiation
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   tau = rho V/mdot, K = 1/(mdot cp);  tau_p = 1.5 (t2 - t1), theta_p = (3 t1 - t2)/2
#   ITAE PI (lecture): Kc Kp = 0.859 (theta/tau)^-0.977, tau_I = (tau/0.674)(theta/tau)^0.680
#   parallel plates with N thin shields: q'' = sigma (T1^4 - T2^4) / sum of (1/e_i + 1/e_j - 1)
import math

SIGMA = 5.670e-8


def tank(V, mdot, cp, dQ):
    tau = 1000.0 * V / mdot
    K = 1.0 / (mdot * cp)
    return tau, K, K * dQ


def fopdt(t1, t2):
    tp = 1.5 * (t2 - t1)
    th = (3 * t1 - t2) / 2
    return tp, th


def itae_pi(tp, th):
    r = th / tp
    return 0.859 * r ** -0.977, tp / 0.674 * r ** 0.680


def plates_with_shields(T1, T2, e1, e2, es, n):
    """Net flux and shield temperatures for n identical thin shields (emissivity es on both sides)."""
    eps = [e1] + [es] * n + [e2]
    R = [1 / eps[i] + 1 / eps[i + 1] - 1 for i in range(n + 1)]
    q = SIGMA * (T1 ** 4 - T2 ** 4) / sum(R)
    temps = []
    T4 = T1 ** 4
    for i in range(n):
        T4 -= q * R[i] / SIGMA
        temps.append(T4 ** 0.25)
    return q, temps


def main():
    print("Topic 1 — stirred tank, FOPDT/PI tuning, gray-body radiation\n")
    tau, K, dT = tank(0.5, 0.25, 4184.0, 1.0e4)
    print("[1] Stirred tank: V = 0.5 m3, mdot = 0.25 kg/s, cp = 4184 J/kg K, dQ = 10 kW")
    print("   tau = %.0f s, K = %.3e K/W, final rise = %.2f K, t95 = 3 tau = %.0f s" % (tau, K, dT, 3 * tau))
    for frac in (0.632, 0.95):
        print("   time to %.1f%% = %.0f s" % (100 * frac, -tau * math.log(1 - frac)))
    print()
    tp, th = fopdt(20.0, 50.0)
    kk, ti = itae_pi(tp, th)
    print("[2] FOPDT two-point fit: t1 = 20 s (28.3%), t2 = 50 s (63.2%)")
    print("   tau_p = %.1f s, theta_p = %.1f s, theta/tau = %.4f" % (tp, th, th / tp))
    print("   ITAE PI: Kc Kp = %.3f, tau_I = %.2f s" % (kk, ti))
    print()
    print("[3] Parallel plates T1 = 800 K (e = 0.6), T2 = 400 K (e = 0.9), shields e = 0.05")
    q0 = None
    for n in range(4):
        q, temps = plates_with_shields(800.0, 400.0, 0.6, 0.9, 0.05, n)
        if q0 is None:
            q0 = q
        ts = ", ".join("%.1f" % t for t in temps) if temps else "-"
        print("   N = %d: q'' = %9.1f W/m2  (q0/q = %6.2f)  shield T = %s K" % (n, q, q0 / q, ts))
    print()
    e, D, Ts, Tsur = 0.8, 0.1, 450.0, 300.0
    q = e * SIGMA * math.pi * D * (Ts ** 4 - Tsur ** 4)
    hr = e * SIGMA * (Ts + Tsur) * (Ts ** 2 + Tsur ** 2)
    print("[4] Pipe in a room: D = 0.1 m, e = 0.8, 450 K in 300 K surroundings")
    print("   q = %.1f W per metre, h_r = %.2f W/m2 K" % (q, hr))
    print()
    print("[5] Wien peaks (lambda_max T = 2898 um K)")
    for T in (5800.0, 2900.0, 300.0):
        print("   T = %6.0f K -> lambda_max = %.3f um" % (T, 2898.0 / T))


main()
