% Wk02 - Wiedemann-Franz law with real metal data (293 K)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

T = 293; L0 = 2.44e-8;
names = {'Ag','Cu','Au','Al','W','Zn','Ni','Fe','Pt','Pb'};
sigma = [6.30 5.96 4.52 3.77 1.79 1.69 1.43 1.00 0.94 0.455]*1e7;
kappa = [429 401 317 237 173 116 91 80 72 35];

L = kappa ./ (sigma * T);
fprintf('%-6s %10s %8s %12s %7s\n','Metal','sigma','kappa','L','L/L0');
for i = 1:numel(names)
    fprintf('%-6s %10.2e %8.0f %12.3e %7.2f\n', ...
            names{i}, sigma(i), kappa(i), L(i), L(i)/L0);
end

figure(1);
x = L0 * sigma * T;
scatter(x, kappa, 60, 'filled'); hold on;
plot([0 max(kappa)*1.15], [0 max(kappa)*1.15], 'r--', 'LineWidth', 2);
text(x, kappa, names, 'VerticalAlignment','bottom');
hold off; grid on;
xlabel('L_0 \sigma T [W/m K]'); ylabel('measured \kappa [W/m K]');
title('Wiedemann-Franz: one carrier, two currents');
