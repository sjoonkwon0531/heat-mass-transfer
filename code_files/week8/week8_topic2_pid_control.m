% Week 8 - Topic 2: PID Feedback & Feedforward Control of a Heat Exchanger
% Plant (valve -> tank temperature), FOPDT: G = exp(-14.7 s)/(21.3 s + 1)
% Disturbance (inflow temperature):       Gd = exp(-35 s)/(25 s + 1)
% ITAE PI tuning: Kc = 0.859 (th/ta)^-0.977 = 1.2341,
%                 tau_I = ta/0.674 (th/ta)^0.680 = 24.5582
% Discrete PID: p_k = Kc [e_k + (dt/tau_I) sum e_j + (tau_D/dt)(e_k - e_{k-1})]
% Reproduces: setpoint overshoot ~1.26 near t~46 s; disturbance peak 0.53 (FB)
% vs 0.17 (static FF + FB, the MATLAB 'heatex' demo configuration).

clear; clc;

tau_p = 21.3; theta_p = 14.7;
r = theta_p/tau_p;
Kc    = 0.859 * r^(-0.977);
tau_I = tau_p/0.674 * r^0.680;
fprintf('ITAE PI tuning for G = exp(-14.7 s)/(21.3 s + 1):\n');
fprintf('  Kc = %.4f (lecture 1.2341), tau_I = %.4f (lecture 24.5582)\n\n', Kc, tau_I);

% --- setpoint step response (PI) ---
[ts, ys] = closed_loop(Kc, tau_I, 0, 250, 1, 0, 'none');
[ymax, im] = max(ys);
fprintf('Setpoint step (PI): peak y = %.3f at t = %.0f s (lecture ~1.26 @ 46 s)\n', ...
        ymax, ts(im));
fprintf('  final y = %.4f -> no offset (integral action)\n\n', ys(end));

% --- P-only: offset remains ---
for KcP = [0.5 1 2]
    [~, yp] = closed_loop(KcP, 1e12, 0, 600, 1, 0, 'none');
    fprintf('  P-only Kc = %.1f: y_ss = %.3f, offset = %.3f (theory %.3f)\n', ...
            KcP, yp(end), 1-yp(end), 1/(1+KcP));
end
fprintf('  -> dead time caps the gain: ultimate Kc ~ 2.9 here\n\n');

% --- disturbance rejection: FB vs FF + FB ---
[~, yfb] = closed_loop(Kc, tau_I, 0, 250, 0, 1, 'none');
[~, yst] = closed_loop(Kc, tau_I, 0, 250, 0, 1, 'static');
[~, yll] = closed_loop(Kc, tau_I, 0, 250, 0, 1, 'leadlag');
fprintf('Unit disturbance step (setpoint = 0):\n');
fprintf('  feedback only          : max|y| = %.3f (lecture ~0.53)\n', max(abs(yfb)));
fprintf('  static FF + FB (heatex): max|y| = %.3f (lecture ~0.17)\n', max(abs(yst)));
fprintf('  exact -Gd/G FF + FB    : max|y| = %.3f\n', max(abs(yll)));

function [ts, ys] = closed_loop(Kc, tau_I, tau_D, T_end, setpoint, disturb, ff)
    tau_p = 21.3; theta_p = 14.7; Kp = 1;
    tau_d = 25.0; theta_d = 35.0;
    dt = 0.01; n = round(T_end/dt);
    dp = round(theta_p/dt); dd = round(theta_d/dt);
    dst = round(25.0/dt); dll = round((theta_d-theta_p)/dt);
    ubuf = zeros(1, n+dp+1); dbuf = zeros(1, n+dd+1);
    fbuf = zeros(1, n+max(dst,dll)+1);
    xff = 0; yp = 0; yd = 0; y = 0; I = 0; e_prev = setpoint;
    ts = (0:n-1)*dt; ys = zeros(1, n);
    for k = 1:n
        e = setpoint - y;
        I = I + e*dt;
        u = Kc*(e + I/tau_I + tau_D*(e - e_prev)/dt);
        e_prev = e;
        if strcmp(ff, 'static')
            fbuf(k+dst) = -disturb;  u = u + fbuf(k);
        elseif strcmp(ff, 'leadlag')
            xff = xff + dt*(disturb - xff)/tau_d;
            fbuf(k+dll) = -(tau_p*(disturb - xff)/tau_d + xff);
            u = u + fbuf(k);
        end
        ubuf(k+dp) = u;  dbuf(k+dd) = disturb;
        yp = yp + dt*(-yp + Kp*ubuf(k))/tau_p;
        yd = yd + dt*(-yd + dbuf(k))/tau_d;
        y = yp + yd;  ys(k) = y;
    end
end
