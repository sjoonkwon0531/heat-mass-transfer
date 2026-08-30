% Wk01 - One equation, three physics (nu, alpha, D)
% d(phi)/dt = delta d2(phi)/dx2, phi(0)=1 -> compare with erfc analytic
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

deltas = [8.9e-7, 1.43e-7, 2.0e-9];      % water: nu, alpha, D
labels = {'momentum (nu)','heat (alpha)','mass (D)'};
cols   = {'b','r','g'};
L = 0.02; N = 201; t_end = 20.0;

figure(1); hold on;
for m = 1:3
    delta = deltas(m);
    x = linspace(0, L, N); dx = x(2) - x(1);
    dt = 0.4*dx^2/delta; nstep = ceil(t_end/dt); dt = t_end/nstep;
    phi = zeros(1, N); phi(1) = 1;
    c = delta*dt/dx^2;
    for n = 1:nstep
        phi(2:end-1) = phi(2:end-1) + ...
            c*(phi(3:end) - 2*phi(2:end-1) + phi(1:end-2));
        phi(1) = 1; phi(end) = 0;
    end
    plot(x*1000, phi, [cols{m} '-'], 'LineWidth', 2, ...
         'DisplayName', [labels{m} ' FDM']);
    ana = erfc(x / (2*sqrt(delta*t_end)));
    plot(x*1000, ana, [cols{m} '--'], 'LineWidth', 1, ...
         'DisplayName', [labels{m} ' analytic']);
end
hold off; grid on;
xlabel('x [mm]'); ylabel('phi (v*, T*, C*)');
Pr = deltas(1)/deltas(2); Sc = deltas(1)/deltas(3);
title(sprintf('Water, t = %.0f s (Pr = %.1f, Sc = %.0f)', t_end, Pr, Sc));
legend('Location','northeast');
