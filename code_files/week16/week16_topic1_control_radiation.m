% Week 16 · Topic 1 — Final review: stirred-tank dynamics, FOPDT/PI tuning, gray-body radiation
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   tau = rho V/mdot, K = 1/(mdot cp);  tau_p = 1.5 (t2 - t1), theta_p = (3 t1 - t2)/2
%   ITAE PI (lecture): Kc Kp = 0.859 (theta/tau)^-0.977, tau_I = (tau/0.674)(theta/tau)^0.680
%   parallel plates with N thin shields: q'' = sigma (T1^4 - T2^4) / sum of (1/e_i + 1/e_j - 1)
function week16_topic1_control_radiation()
    SIGMA = 5.670e-8;
    fprintf('Topic 1 — stirred tank, FOPDT/PI tuning, gray-body radiation\n\n');
    tau = 1000*0.5/0.25; K = 1/(0.25*4184);
    fprintf('[1] Stirred tank: V = 0.5 m3, mdot = 0.25 kg/s, cp = 4184 J/kg K, dQ = 10 kW\n');
    fprintf('   tau = %.0f s, K = %.3e K/W, final rise = %.2f K, t95 = 3 tau = %.0f s\n', tau, K, K*1e4, 3*tau);
    for frac = [0.632 0.95]
        fprintf('   time to %.1f%% = %.0f s\n', 100*frac, -tau*log(1 - frac));
    end
    fprintf('\n');
    tp = 1.5*(50 - 20); th = (3*20 - 50)/2; r = th/tp;
    fprintf('[2] FOPDT two-point fit: t1 = 20 s (28.3%%), t2 = 50 s (63.2%%)\n');
    fprintf('   tau_p = %.1f s, theta_p = %.1f s, theta/tau = %.4f\n', tp, th, r);
    fprintf('   ITAE PI: Kc Kp = %.3f, tau_I = %.2f s\n\n', 0.859*r^-0.977, tp/0.674*r^0.680);
    fprintf('[3] Parallel plates T1 = 800 K (e = 0.6), T2 = 400 K (e = 0.9), shields e = 0.05\n');
    q0 = NaN;
    for n = 0:3
        eps = [0.6, 0.05*ones(1, n), 0.9];
        R = 1./eps(1:end-1) + 1./eps(2:end) - 1;
        q = SIGMA*(800^4 - 400^4)/sum(R);
        if isnan(q0), q0 = q; end
        T4 = 800^4; ts = '';
        for i = 1:n
            T4 = T4 - q*R(i)/SIGMA;
            if i > 1, ts = [ts ', ']; end
            ts = [ts sprintf('%.1f', T4^0.25)];
        end
        if n == 0, ts = '-'; end
        fprintf('   N = %d: q'''' = %9.1f W/m2  (q0/q = %6.2f)  shield T = %s K\n', n, q, q0/q, ts);
    end
    fprintf('\n');
    q = 0.8*SIGMA*pi*0.1*(450^4 - 300^4); hr = 0.8*SIGMA*(450 + 300)*(450^2 + 300^2);
    fprintf('[4] Pipe in a room: D = 0.1 m, e = 0.8, 450 K in 300 K surroundings\n');
    fprintf('   q = %.1f W per metre, h_r = %.2f W/m2 K\n\n', q, hr);
    fprintf('[5] Wien peaks (lambda_max T = 2898 um K)\n');
    for T = [5800 2900 300]
        fprintf('   T = %6.0f K -> lambda_max = %.3f um\n', T, 2898/T);
    end
end
