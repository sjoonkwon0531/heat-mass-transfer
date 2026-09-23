% Week 4 - Topic 1: Lumped Capacitance & the Biot Number
% (T-Tinf)/(T0-Tinf) = exp(-t/tau) = exp(-Bi*Fo), Bi = h*Lc/k, Fo = alpha*t/Lc^2
% Also the steady heat-generating wire (lecture): Theta = (2+Bi*(1-eta.^2))/(2+Bi)

function week4_topic1_lumped_biot
    close all; clc
    % --- Case A: steel sphere quenched in oil ---
    D = 0.010; rho = 7800; c = 480; k = 45; h = 400;
    T0 = 850; Tinf = 60;
    Lc = D/6;                       % V/A of a sphere
    Bi = h*Lc/k;
    alpha = k/(rho*c);
    tau = rho*c*Lc/h;
    fprintf('Case A: steel sphere, D = 10 mm, quenched in oil\n');
    fprintf('  Lc = D/6 = %.3f mm\n', Lc*1e3);
    if Bi < 0.1, s = '< 0.1 -> lumped OK'; else, s = '>= 0.1 -> full PDE'; end
    fprintf('  Bi = %.4f  (%s)\n', Bi, s);
    fprintf('  alpha = %.3f mm^2/s, tau = %.2f s\n', alpha*1e6, tau);

    tv = [0 5 15.6 30 60 120];
    Fov = alpha*tv/Lc^2;
    Tv = Tinf + (T0 - Tinf)*exp(-Bi*Fov);      % = exp(-t/tau)
    fprintf('  t [s]   Fo      T [degC]\n');
    fprintf('  %5.1f  %6.2f  %8.2f\n', [tv; Fov; Tv]);
    fprintf('  time to 99%% equilibration: %.1f s\n', tau*log(100));

    % history plot
    t = linspace(0, 120, 400);
    figure(1);
    plot(t, Tinf + (T0-Tinf)*exp(-t/tau), 'LineWidth', 1.5); grid on
    xlabel('t [s]'); ylabel('T [degC]');
    title(sprintf('Lumped cooling, Bi = %.4f, \\tau = %.1f s', Bi, tau));

    % --- Case B: physical meaning of Bi via the heat-generating wire ---
    eta = linspace(0, 1, 101);
    Bis = [0 0.5 2 10 1e9];
    figure(2); hold on
    for b = Bis
        plot(eta, (2 + b*(1 - eta.^2))/(2 + b), 'LineWidth', 1.5);
    end
    grid on; xlabel('\eta = r/R'); ylabel('\Theta');
    legend('Bi = 0','Bi = 0.5','Bi = 2','Bi = 10','Bi = inf','Location','southwest');
    title('Steady heat-generating wire: \Theta = (2+Bi(1-\eta^2))/(2+Bi)');

    fprintf('\nCase B: wire profile Theta(eta) at eta = 0, 0.5, 1:\n');
    for b = [0 0.5 2 10 1e9]
        th = (2 + b*(1 - [0 0.5 1].^2))/(2 + b);
        fprintf('  Bi = %-6g: %.3f  %.3f  %.3f\n', b, th);
    end
end
