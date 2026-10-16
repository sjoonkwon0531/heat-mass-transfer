% Week 8 - Topic 1: Stirred-Tank Heating -> First-Order Process & FOPDT Fitting
% Energy balance: rho*V*cp dT'/dt = mdot*cp (Tin' - T') + Q'
%   -> T'(s) = [K/(tau s+1)] Q'(s) + [1/(tau s+1)] Tin'(s),
%      K = 1/(mdot*cp), tau = rho*V/mdot.
% FOPDT: G(s) = Kp exp(-theta_p s)/(tau_p s + 1).
% Two-point fit: tau_p = 3(t2-t1)/2, theta_p = (3 t1 - t2)/2
% Lecture example: t1 = 21.8 s, t2 = 36.0 s -> tau_p = 21.3 s, theta_p = 14.7 s.

clear; clc;

% --- stirred tank: physical parameters -> K and tau ---
rho = 1000; cp = 4184; V = 0.5; mdot = 0.25;
K = 1/(mdot*cp); tau = rho*V/mdot;
fprintf('Stirred-tank first-order parameters:\n');
fprintf('  K   = 1/(mdot*cp) = %.3e K/W\n', K);
fprintf('  tau = rho*V/mdot  = %.1f s\n', tau);
fprintf('  (a +10 kW step in Q raises T by %.3f K at steady state)\n\n', K*1e4);

% --- lecture two-point fit ---
t1 = 21.8; t2 = 36.0;
tau_p   = 3*(t2 - t1)/2;
theta_p = (3*t1 - t2)/2;
fprintf('FOPDT two-point fit (lecture valve-to-temperature data):\n');
fprintf('  t1 = %.1f s (0.283), t2 = %.1f s (0.632)\n', t1, t2);
fprintf('  tau_p   = %.1f s (lecture 21.3)\n', tau_p);
fprintf('  theta_p = %.1f s (lecture 14.7)\n', theta_p);

% verify anchor fractions
for tt = [t1 t2]
    y = fopdt_step(tt, 1, 1, tau_p, theta_p);
    fprintf('  check y(%5.1f)/y_inf = %.4f\n', tt, y);
end

% --- normalized step-response table ---
fprintf('\nNormalized FOPDT step response (Kp*du = 1):\n    t (s)    y(t)\n');
for tt = 0:10:120
    fprintf('  %6.0f   %7.4f\n', tt, fopdt_step(tt, 1, 1, tau_p, theta_p));
end
fprintf('  -> 63.2%% reached at theta_p + tau_p = %.1f s\n', theta_p + tau_p);

function y = fopdt_step(t, Kp, du, tau_p, theta_p)
    if t < theta_p
        y = 0;
    else
        y = (1 - exp(-(t - theta_p)/tau_p)) * Kp * du;
    end
end
