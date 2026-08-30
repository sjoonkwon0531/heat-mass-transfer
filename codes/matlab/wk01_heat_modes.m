% Wk01 - Conduction vs convection vs radiation (T^4 takeover)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

SIGMA = 5.670e-8; T_inf = 25;
k = 0.6; L = 0.02; h = 25; eps = 0.85;

Ts = linspace(30, 900, 400);
dT = Ts - T_inf;
q_cond = k * dT / L;
q_conv = h * dT;
q_rad  = eps * SIGMA * ((Ts+273.15).^4 - (T_inf+273.15)^4);

figure(1);
plot(Ts, q_cond/1e3, 'LineWidth', 2); hold on;
plot(Ts, q_conv/1e3, 'LineWidth', 2);
plot(Ts, q_rad/1e3,  'LineWidth', 2); hold off;
grid on;
xlabel('hot-surface temperature T_s [C]');
ylabel('heat flux q'''' [kW/m^2]');
title('Three modes of heat transfer: who dominates when?');
legend('conduction k\DeltaT/L','convection h\DeltaT', ...
       'radiation \epsilon\sigma(T_s^4-T_\infty^4)', ...
       'Location','northwest');

[~, ic] = min(abs(q_rad - q_conv));
fprintf('Radiation passes convection near Ts = %.0f C\n', Ts(ic));
