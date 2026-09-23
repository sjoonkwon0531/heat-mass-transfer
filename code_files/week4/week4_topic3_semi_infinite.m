% Week 4 - Topic 3: Semi-Infinite Solid - Similarity (erf) & the Integral Method
% Exact:    (T-T0)/(Ts-T0) = erfc(eta),  eta = x/(2*sqrt(alpha*t))
% Integral: (T-T0)/(Ts-T0) ~ (1 - x/delta)^2,  delta = sqrt(12*alpha*t)
% Penetration depth: exact 2.8*sqrt(alpha*t) vs integral 2.6895*sqrt(alpha*t)

function week4_topic3_semi_infinite
    close all; clc
    % --- Exact vs integral-method profile (the lecture comparison figure) ---
    eta = linspace(0, 2.5, 251);
    thE = erfc(eta);
    thA = max(1 - eta/sqrt(3), 0).^2;        % x/delta = eta/sqrt(3)

    figure(1);
    plot(eta, thE, 'k-', eta, thA, 'r--', 'LineWidth', 1.6); grid on
    xlabel('x / (2\surd(\alpha t))'); ylabel('(T-T_0)/(T_s-T_0)');
    legend('Exact: erfc', 'Integral method (parabola)');
    title('Semi-infinite wall: exact vs approximate');

    fprintf('max pointwise gap = %.4f\n', max(abs(thE - thA)));
    xdInt = (1 - sqrt(0.05))*sqrt(12);
    fprintf('Penetration depth / sqrt(alpha*t): exact 2.8, integral %.4f (%.1f %% off)\n', ...
            xdInt, abs(xdInt-2.8)/2.8*100);

    % --- Self-similarity: profiles at many t collapse onto one curve ---
    alpha = 7e-7; Ts = 90; T0 = 15;          % soil-like wall
    x = linspace(0, 0.20, 400);
    figure(2); subplot(2,1,1); hold on
    tv = [10 60 600 3600];
    for t = tv
        plot(x*1e3, T0 + (Ts-T0)*erfc(x/(2*sqrt(alpha*t))), 'LineWidth', 1.4);
    end
    grid on; xlabel('x [mm]'); ylabel('T [degC]');
    legend('t=10 s','t=60 s','t=600 s','t=3600 s'); title('Physical profiles spread as \surd t');

    subplot(2,1,2); hold on
    for t = tv
        eta_ = x/(2*sqrt(alpha*t));
        plot(eta_, erfc(eta_), 'LineWidth', 1.4);
    end
    xlim([0 2.5]); grid on; xlabel('\eta'); ylabel('\Theta');
    title('Same data vs \eta: all curves collapse (self-similar)');

    % --- Worked example table ---
    fprintf('\nWorked example: alpha = 0.7 mm^2/s, Ts = 90, T0 = 15 degC\n');
    fprintf('  t [s]   depth 2.8*sqrt(at) [mm]   T(x=10mm) [degC]   q_s [kW/m^2]\n');
    kcond = 1.2;
    for t = tv
        depth = 2.8*sqrt(alpha*t)*1e3;
        T10 = T0 + (Ts-T0)*erfc(0.010/(2*sqrt(alpha*t)));
        qs = kcond*(Ts-T0)/sqrt(pi*alpha*t)/1e3;
        fprintf('  %6.0f  %12.1f            %10.2f      %10.3f\n', t, depth, T10, qs);
    end
    fprintf('  -> depth ~ sqrt(t); surface flux ~ 1/sqrt(t)\n');
end
