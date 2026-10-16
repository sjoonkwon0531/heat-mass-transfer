# Week 8 - Topic 2: PID Feedback & Feedforward Control of a Heat Exchanger
# Lecture (Part 1): plant (valve voltage -> tank temperature), FOPDT:
#   G(s)  = exp(-14.7 s) / (21.3 s + 1)        (Kp = 1)
#   Gd(s) = exp(-35 s)   / (25 s + 1)          (inflow-temperature disturbance)
# PI controller C(s) = Kc (1 + 1/(tau_I s)); ITAE tuning:
#   Kc    = 0.859 (theta_p/tau_p)^-0.977          = 1.2341
#   tau_I = tau_p/0.674 * (theta_p/tau_p)^0.680   = 24.5582
# Feedforward: exact  F(s) = -Gd/G = -(21.3 s + 1)/(25 s + 1) exp(-(35-14.7) s),
# or the static version used by MATLAB's 'heatex' demo (gain -1, delay 25 s).
# This script simulates the closed loop with a discrete PID
#   p_k = pbar + Kc [ e_k + (dt/tau_I) sum e_j + (tau_D/dt)(e_k - e_{k-1}) ]
# and reproduces the lecture plots: setpoint overshoot ~1.26 near t ~ 46 s,
# and disturbance rejection: FB only ~0.53 peak, static FF + FB ~0.17.

import math


def simulate(Kc, tau_I, tau_D=0.0, T_end=250.0, dt=0.01,
             setpoint=1.0, disturb=0.0, feedforward=None):
    """Closed-loop FOPDT simulation; feedforward in (None, 'static', 'leadlag').

    Returns (time, y) lists sampled every 1 s."""
    tau_p, theta_p, Kp = 21.3, 14.7, 1.0        # plant
    tau_d, theta_d = 25.0, 35.0                  # disturbance path
    n = int(T_end / dt)
    dp, dd = int(theta_p / dt), int(theta_d / dt)
    ubuf = [0.0] * (n + dp + 1)                  # delayed control input
    dbuf = [0.0] * (n + dd + 1)                  # delayed disturbance
    # feedforward buffers: static = gain -1 with 25 s delay (heatex demo default);
    # leadlag = exact -Gd/G = -(tau_p s+1)/(tau_d s+1) exp(-(theta_d-theta_p)s)
    dff_st = int(25.0 / dt)
    dff_ll = int((theta_d - theta_p) / dt)
    fbuf = [0.0] * (n + max(dff_st, dff_ll) + 1)
    xff = 0.0
    y = yp = yd = 0.0                            # plant/disturbance first-order states
    I = 0.0
    e_prev = setpoint
    ts, ys = [], []
    for k in range(n):
        e = setpoint - y
        I += e * dt
        u = Kc * (e + I / tau_I + tau_D * (e - e_prev) / dt)
        e_prev = e
        if feedforward == "static":
            fbuf[k + dff_st] = -disturb
            u += fbuf[k]
        elif feedforward == "leadlag":
            xff += dt * (disturb - xff) / tau_d                  # 1/(tau_d s+1) d
            fsig = -(tau_p * (disturb - xff) / tau_d + xff)      # -(tau_p s+1)/(tau_d s+1) d
            fbuf[k + dff_ll] = fsig
            u += fbuf[k]
        ubuf[k + dp] = u
        dbuf[k + dd] = disturb
        yp += dt * (-yp + Kp * ubuf[k]) / tau_p
        yd += dt * (-yd + dbuf[k]) / tau_d
        y = yp + yd
        if k % int(1.0 / dt) == 0:
            ts.append(k * dt)
            ys.append(y)
    return ts, ys


if __name__ == "__main__":
    # --- ITAE tuning from the FOPDT fit ---
    tau_p, theta_p = 21.3, 14.7
    r = theta_p / tau_p
    Kc = 0.859 * r ** (-0.977)
    tau_I = tau_p / 0.674 * r ** 0.680
    print("ITAE PI tuning for G = exp(-14.7 s)/(21.3 s + 1):")
    print(f"  Kc    = 0.859 (theta/tau)^-0.977          = {Kc:.4f}   (lecture 1.2341)")
    print(f"  tau_I = tau_p/0.674 * (theta/tau)^0.680   = {tau_I:.4f}  (lecture 24.5582)")

    # --- setpoint step (lecture: overshoot to ~1.26 near t ~ 46 s) ---
    ts, ys = simulate(Kc, tau_I, setpoint=1.0)
    ymax = max(ys)
    tpk = ts[ys.index(ymax)]
    print("\nSetpoint step response (PI):")
    print(f"  peak y = {ymax:.3f} at t = {tpk:.0f} s (lecture plot: ~1.26 near 46 s)")
    print(f"  final y(250 s) = {ys[-1]:.4f}  -> no offset (integral action)")

    # --- P-only control: offset remains (and dead time limits the gain) ---
    for KcP in (0.5, 1.0, 2.0):
        _, ysp = simulate(KcP, 1e12, T_end=600.0)   # tau_I -> infinity: P-only
        off = 1.0 - ysp[-1]
        print(f"  P-only Kc = {KcP:3.1f}: y_ss = {ysp[-1]:.3f}, offset = {off:.3f} "
              f"(theory 1/(1+Kc*Kp) = {1/(1+KcP):.3f})")
    print("  -> P control always leaves offset 1/(1+Kc Kp); raising Kc shrinks it")
    print("     but the dead time destabilizes the loop well before it vanishes")
    print("     (here the ultimate gain is Kc ~ 2.9).")

    # --- disturbance step: feedback vs feedback + feedforward ---
    print("\nUnit disturbance step (setpoint = 0):")
    _, yfb = simulate(Kc, tau_I, setpoint=0.0, disturb=1.0)
    _, yst = simulate(Kc, tau_I, setpoint=0.0, disturb=1.0, feedforward="static")
    _, yll = simulate(Kc, tau_I, setpoint=0.0, disturb=1.0, feedforward="leadlag")
    print(f"  feedback only          : max |y| = {max(abs(v) for v in yfb):.3f} "
          "(lecture plot ~0.53)")
    print(f"  static FF + FB (heatex): max |y| = {max(abs(v) for v in yst):.3f} "
          "(lecture plot ~0.17)")
    print(f"  exact -Gd/G FF + FB    : max |y| = {max(abs(v) for v in yll):.3f}")
    print("  -> feedforward acts before the error appears; the static version leaves a")
    print("     lead-lag mismatch, while the exact F = -Gd/G cancels the disturbance")
    print("     completely (possible here because theta_d > theta_p keeps F causal).")
