# Week 8 - Topic 2: PID Feedback & Feedforward Control of a Heat Exchanger
# Plant (valve -> tank temperature), FOPDT: G = exp(-14.7 s)/(21.3 s + 1)
# Disturbance (inflow temperature):       Gd = exp(-35 s)/(25 s + 1)
# ITAE PI tuning: Kc = 0.859 (th/ta)^-0.977 = 1.2341,
#                 tau_I = ta/0.674 (th/ta)^0.680 = 24.5582
# Reproduces: setpoint overshoot ~1.26 near t~46 s; disturbance peak 0.53 (FB)
# vs 0.17 (static FF + FB, the MATLAB 'heatex' demo configuration).

using Printf

function closed_loop(Kc, tau_I; tau_D=0.0, T_end=250.0, setpoint=1.0,
                     disturb=0.0, ff=:none)
    tau_p, theta_p, Kp = 21.3, 14.7, 1.0
    tau_d, theta_d = 25.0, 35.0
    dt = 0.01; n = round(Int, T_end / dt)
    dp = round(Int, theta_p / dt); dd = round(Int, theta_d / dt)
    dst = round(Int, 25.0 / dt);   dll = round(Int, (theta_d - theta_p) / dt)
    ubuf = zeros(n + dp + 1); dbuf = zeros(n + dd + 1)
    fbuf = zeros(n + max(dst, dll) + 1)
    xff = 0.0; yp = 0.0; yd = 0.0; y = 0.0; I = 0.0; e_prev = setpoint
    ts = collect(0:n-1) .* dt; ys = zeros(n)
    for k in 1:n
        e = setpoint - y
        I += e * dt
        u = Kc * (e + I / tau_I + tau_D * (e - e_prev) / dt)
        e_prev = e
        if ff == :static
            fbuf[k + dst] = -disturb; u += fbuf[k]
        elseif ff == :leadlag
            xff += dt * (disturb - xff) / tau_d
            fbuf[k + dll] = -(tau_p * (disturb - xff) / tau_d + xff)
            u += fbuf[k]
        end
        ubuf[k + dp] = u; dbuf[k + dd] = disturb
        yp += dt * (-yp + Kp * ubuf[k]) / tau_p
        yd += dt * (-yd + dbuf[k]) / tau_d
        y = yp + yd; ys[k] = y
    end
    return ts, ys
end

tau_p, theta_p = 21.3, 14.7
r = theta_p / tau_p
Kc = 0.859 * r^(-0.977)
tau_I = tau_p / 0.674 * r^0.680
println("ITAE PI tuning for G = exp(-14.7 s)/(21.3 s + 1):")
@printf("  Kc = %.4f (lecture 1.2341), tau_I = %.4f (lecture 24.5582)\n\n", Kc, tau_I)

ts, ys = closed_loop(Kc, tau_I)
ymax, im = findmax(ys)
@printf("Setpoint step (PI): peak y = %.3f at t = %.0f s (lecture ~1.26 @ 46 s)\n",
        ymax, ts[im])
@printf("  final y = %.4f -> no offset (integral action)\n\n", ys[end])

for KcP in (0.5, 1.0, 2.0)
    _, yp = closed_loop(KcP, 1e12; T_end=600.0)
    @printf("  P-only Kc = %.1f: y_ss = %.3f, offset = %.3f (theory %.3f)\n",
            KcP, yp[end], 1 - yp[end], 1 / (1 + KcP))
end
println("  -> dead time caps the gain: ultimate Kc ~ 2.9 here\n")

_, yfb = closed_loop(Kc, tau_I; setpoint=0.0, disturb=1.0)
_, yst = closed_loop(Kc, tau_I; setpoint=0.0, disturb=1.0, ff=:static)
_, yll = closed_loop(Kc, tau_I; setpoint=0.0, disturb=1.0, ff=:leadlag)
println("Unit disturbance step (setpoint = 0):")
@printf("  feedback only          : max|y| = %.3f (lecture ~0.53)\n", maximum(abs.(yfb)))
@printf("  static FF + FB (heatex): max|y| = %.3f (lecture ~0.17)\n", maximum(abs.(yst)))
@printf("  exact -Gd/G FF + FB    : max|y| = %.3f\n", maximum(abs.(yll)))
